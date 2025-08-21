import { createPublicClient, http, parseAbiItem, formatUnits, keccak256, toHex } from 'viem';
import { mainnet } from 'viem/chains';
import { config } from './config.js';

export class BlockchainMonitor {
  constructor() {
    this.client = createPublicClient({
      chain: mainnet,
      transport: http(config.RPC_URL)
    });
    
    this.lastProcessedBlock = null;
    
    // Calculate Rewarded event signature
    this.rewardedEventSignature = keccak256(toHex('Rewarded(address,address,uint256)'));
    console.log(`📊 Calculated Rewarded event signature: ${this.rewardedEventSignature}`);
    
    // Event signatures
    this.eventSignatures = {
      Transfer: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
      Rewarded: this.rewardedEventSignature
    };
  }
  
  async getLatestBlock() {
    return await this.client.getBlockNumber();
  }
  
  async getBlock(blockNumber) {
    return await this.client.getBlock({
      blockNumber: BigInt(blockNumber),
      includeTransactions: true
    });
  }
  
  async getTransactionReceipt(txHash) {
    return await this.client.getTransactionReceipt({ hash: txHash });
  }
  
  isYieldDistributionTransaction(tx) {
    if (!tx.to || !tx.input) return false;
    const methodId = tx.input.slice(0, 10); // First 4 bytes (0x + 8 chars)
    const toAddress = tx.to.toLowerCase();
    const requiredTo = config.INTERACTION_TO_ADDRESS?.toLowerCase();
    // Candidate only if:
    // - Method ID matches 0x6a761202
    // - AND the tx 'to' equals the specified interaction address (proxy/multicall)
    if (methodId !== config.YIELD_DISTRIBUTION_METHOD) return false;
    if (requiredTo && toAddress !== requiredTo) return false;
    return true;
  }
  
  analyzeTransactionLogs(receipt) {
    const result = {
      isYieldDistribution: false,
      amount: null,
      events: [],
      transactionType: null,
      involvesRewardsManager: false,
      involvesSlvlusd: false,
      foundRewarded: false
    };
    
    if (!receipt || !receipt.logs) {
      return result;
    }
    
    for (const log of receipt.logs) {
      const logAddress = log.address.toLowerCase();
      const rewardsManager = config.REWARDS_MANAGER_ADDRESS.toLowerCase();
      const slvlusd = config.SLVLUSD_ADDRESS?.toLowerCase();
      
      // Track contract involvement
      if (logAddress === rewardsManager) {
        result.involvesRewardsManager = true;
      } else if (slvlusd && logAddress === slvlusd) {
        result.involvesSlvlusd = true;
      }
      
      // Skip logs not from target contracts
      if (logAddress !== rewardsManager && logAddress !== slvlusd) {
        continue;
      }
      
      if (log.topics && log.topics.length > 0) {
        const eventSignature = log.topics[0];
        
        // Check for Rewarded event
        if (eventSignature === this.eventSignatures.Rewarded) {
          try {
            // Rewarded(address asset, address to, uint256 amount)
            // Topics: [signature, asset, recipient]
            // Data: amount
            
            let assetAddress = null;
            let recipientAddress = null;
            
            if (log.topics.length >= 2) {
              assetAddress = '0x' + log.topics[1].slice(-40); // Last 20 bytes
              console.log(`🎯 Rewarded event - Asset: ${assetAddress}`);
            }
            
            if (log.topics.length >= 3) {
              recipientAddress = '0x' + log.topics[2].slice(-40); // Last 20 bytes
              console.log(`🎯 Rewarded event - Recipient: ${recipientAddress}`);
            }
            
            // Extract amount from data
            if (log.data && log.data !== '0x') {
              // Extract amount from the last 32 bytes of data (standard for uint256)
              let amountWei;
              if (log.data.length >= 66) { // 0x + 64 chars
                const lastBytes = '0x' + log.data.slice(-64);
                amountWei = BigInt(lastBytes);
              } else {
                amountWei = BigInt(log.data);
              }
              
              // Smart amount formatting
              let amountDisplay;
              
              // Check if the data contains USDC address (indicates USDC transfer)
              const dataContainsUSDC = log.data.toLowerCase().includes(config.USDC_ADDRESS.slice(2).toLowerCase());
              
              if (dataContainsUSDC || (assetAddress && assetAddress.toLowerCase() === config.USDC_ADDRESS.toLowerCase())) {
                // USDC has 6 decimals, display as USD
                const amountFormatted = formatUnits(amountWei, 6);
                amountDisplay = `${parseFloat(amountFormatted).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })} USD`;
              } else {
                // Default to 18 decimals for other tokens
                const amountFormatted = formatUnits(amountWei, 18);
                amountDisplay = `${amountFormatted} tokens`;
              }
              
              result.isYieldDistribution = true;
              result.amount = amountDisplay;
              result.events.push({
                type: 'Rewarded',
                amount: amountDisplay,
                amountRaw: amountWei.toString(),
                address: logAddress,
                signature: eventSignature,
                asset: assetAddress,
                recipient: recipientAddress
              });
              // Strict flag so we only notify when a Rewarded event is present
              result.foundRewarded = true;
              
              console.log(`✅ Found Rewarded event with amount: ${amountDisplay}`);
            }
          } catch (error) {
            console.error(`❌ Error decoding Rewarded event: ${error.message}`);
          }
        }
        
        // Check for Transfer events
        else if (eventSignature === this.eventSignatures.Transfer) {
          try {
            if (log.data && log.data !== '0x') {
              const amountWei = BigInt(log.data);
              
              // Format based on contract
              let amountDisplay;
              if (logAddress === config.USDC_ADDRESS.toLowerCase()) {
                const amountFormatted = formatUnits(amountWei, 6);
                amountDisplay = `${parseFloat(amountFormatted).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })} USDC`;
              } else {
                const amountFormatted = formatUnits(amountWei, 18);
                amountDisplay = `${amountFormatted} tokens`;
              }
              
              result.isYieldDistribution = true;
              result.amount = amountDisplay;
              result.events.push({
                type: 'Transfer',
                amount: amountDisplay,
                amountRaw: amountWei.toString(),
                address: logAddress
              });
              
              console.log(`💸 Found Transfer event with amount: ${amountDisplay}`);
            }
          } catch (error) {
            console.error(`❌ Error decoding Transfer event: ${error.message}`);
          }
        }
      }
    }
    
    // Determine transaction type
    if (result.involvesRewardsManager) {
      result.transactionType = 'yield_distribution_call';
      result.isYieldDistribution = true;
    } else if (result.involvesSlvlusd) {
      result.transactionType = 'slvlusd_interaction';
      result.isYieldDistribution = true;
    }
    
    return result;
  }
  
  async processBlock(blockNumber) {
    const yieldDistributions = [];
    
    try {
      console.log(`🔍 Processing block ${blockNumber}...`);
      const block = await this.getBlock(blockNumber);
      
      for (const tx of block.transactions) {
        
        if (this.isYieldDistributionTransaction(tx)) {
          console.log(`🧐 Found candidate 0x6a761202 call: ${tx.hash}`);
          const receipt = await this.getTransactionReceipt(tx.hash);
          
          if (receipt) {
            const analysis = this.analyzeTransactionLogs(receipt);
            
            // Notify only when a Rewarded event is present
            if (analysis.foundRewarded) {
              const yieldDistribution = {
                transactionHash: tx.hash,
                blockNumber: Number(blockNumber),
                fromAddress: tx.from,
                toAddress: tx.to,
                amount: analysis.amount || 'Unknown',
                events: analysis.events || [],
                gasUsed: receipt.gasUsed?.toString() || '0',
                transactionType: analysis.transactionType || 'unknown',
                involvesRewardsManager: analysis.involvesRewardsManager,
                involvesSlvlusd: analysis.involvesSlvlusd
              };
              
              yieldDistributions.push(yieldDistribution);
              console.log(`✅ Yield distribution detected in block ${blockNumber}: ${tx.hash}`);
            }
          }
        }
      }
      
      if (yieldDistributions.length > 0) {
        console.log(`✅ Found ${yieldDistributions.length} yield distribution(s) in block ${blockNumber}`);
      }
      
    } catch (error) {
      console.error(`❌ Error processing block ${blockNumber}: ${error.message}`);
    }
    
    return yieldDistributions;
  }
  
  async startMonitoring(startBlock = null) {
    if (startBlock === null) {
      startBlock = await this.getLatestBlock();
    }
    
    this.lastProcessedBlock = startBlock - BigInt(1);
    console.log(`🚀 Starting blockchain monitoring from block ${startBlock}`);
    
    const monitor = async () => {
      try {
        const latestBlock = await this.getLatestBlock();
        
        if (latestBlock > this.lastProcessedBlock) {
          const confirmedBlock = latestBlock - BigInt(config.BLOCK_CONFIRMATIONS);
          
          if (confirmedBlock > this.lastProcessedBlock) {
            for (let blockNum = this.lastProcessedBlock + BigInt(1); blockNum <= confirmedBlock; blockNum++) {
              const distributions = await this.processBlock(blockNum);
              
              for (const distribution of distributions) {
                // Emit event for each distribution
                this.emit('yieldDistribution', distribution);
              }
            }
            
            this.lastProcessedBlock = confirmedBlock;
          }
        }
      } catch (error) {
        console.error(`❌ Error in monitoring loop: ${error.message}`);
      }
      
      setTimeout(monitor, config.POLL_INTERVAL * 1000);
    };
    
    monitor();
  }
  
  // Simple event emitter
  emit(event, data) {
    if (this.listeners && this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }
  
  on(event, callback) {
    if (!this.listeners) this.listeners = {};
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }
  
  async getStatus() {
    try {
      const latestBlock = await this.getLatestBlock();
      return {
        connected: true,
        chainId: config.CHAIN_ID,
        latestBlock: Number(latestBlock),
        lastProcessedBlock: this.lastProcessedBlock ? Number(this.lastProcessedBlock) : null,
        rewardsManagerAddress: config.REWARDS_MANAGER_ADDRESS,
        slvlusdAddress: config.SLVLUSD_ADDRESS
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }
}
