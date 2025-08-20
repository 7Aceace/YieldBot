import asyncio
import logging
from web3 import Web3
from web3.exceptions import BlockNotFound, TransactionNotFound
from typing import Optional, Dict, Any, List
from config import Config
import json

class BlockchainMonitor:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.w3 = Web3(Web3.HTTPProvider(Config.RPC_URL))
        self.last_processed_block = None
        
        # Verify connection
        if not self.w3.is_connected():
            raise ConnectionError(f"Failed to connect to RPC endpoint: {Config.RPC_URL}")
        
        self.logger.info(f"Connected to blockchain. Chain ID: {self.w3.eth.chain_id}")
        
        # Contract addresses
        self.rewards_manager_address = Config.REWARDS_MANAGER_ADDRESS
        self.slvlusd_address = Config.SLVLUSD_ADDRESS
        
        # Calculate the Rewarded event signature
        # Rewarded(address asset, address to, uint256 amount)
        self.rewarded_event_signature = self.w3.keccak(text="Rewarded(address,address,uint256)").hex()
        self.logger.info(f"Calculated Rewarded event signature: {self.rewarded_event_signature}")
        
        # Event signatures for yield distribution detection
        self.event_signatures = {
            # Standard Transfer event signature (legitimate Ethereum standard)
            'Transfer': '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
            # Rewarded event signature (calculated for your specific contract)
            'Rewarded': self.rewarded_event_signature,
        }
        
        # Function signatures for yield distribution detection
        self.function_signatures = {
            'yield_distribution': '0x6a761202',  # Specific yield distribution method on RewardsManager
        }
    
    async def get_latest_block(self) -> int:
        """Get the latest block number."""
        try:
            return self.w3.eth.block_number
        except Exception as e:
            self.logger.error(f"Error getting latest block: {e}")
            raise
    
    async def get_block_transactions(self, block_number: int) -> List[Dict[str, Any]]:
        """Get all transactions from a specific block."""
        try:
            block = self.w3.eth.get_block(block_number, full_transactions=True)
            return block.transactions
        except BlockNotFound:
            self.logger.warning(f"Block {block_number} not found")
            return []
        except Exception as e:
            self.logger.error(f"Error getting block {block_number}: {e}")
            return []
    
    async def get_transaction_receipt(self, tx_hash: str) -> Optional[Dict[str, Any]]:
        """Get transaction receipt."""
        try:
            return self.w3.eth.get_transaction_receipt(tx_hash)
        except TransactionNotFound:
            self.logger.warning(f"Transaction {tx_hash} not found")
            return None
        except Exception as e:
            self.logger.error(f"Error getting transaction receipt {tx_hash}: {e}")
            return None
    
    def is_yield_distribution_transaction(self, transaction: Dict[str, Any]) -> bool:
        """Check if a transaction is related to yield distribution."""
        # Check if transaction is to RewardsManager with the specific yield distribution method
        to_address = transaction.get('to')
        
        # Handle transactions without a 'to' address (contract creation, etc.)
        if not to_address:
            return False
            
        to_address = to_address.lower()
        rewards_manager = self.rewards_manager_address.lower()
        
        # Check if it's a transaction to RewardsManager with yield distribution method 0x6a761202
        if to_address == rewards_manager:
            input_data = transaction.get('input', '')
            # Check if it's calling the yield distribution function
            if input_data:
                try:
                    # Handle both string and bytes input data
                    if isinstance(input_data, bytes):
                        # Convert bytes to hex string
                        input_hex = input_data.hex()
                    elif isinstance(input_data, str):
                        # Remove '0x' prefix if present
                        input_hex = input_data[2:] if input_data.startswith('0x') else input_data
                    else:
                        input_hex = str(input_data)
                    
                    # Ensure input_hex is a string before calling startswith
                    if isinstance(input_hex, str):
                        # Check if it starts with yield distribution method signature (without 0x)
                        yield_sig = self.function_signatures['yield_distribution'][2:]  # Remove '0x'
                        if input_hex.startswith(yield_sig):
                            self.logger.info(f"✅ Found method 0x6a761202 call to RewardsManager: {transaction.get('hash', '').hex()}")
                            return True
                except Exception as e:
                    self.logger.error(f"Error processing transaction input data: {e}")
                    return False
            
        return False
    
    def analyze_transaction_logs(self, receipt: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze transaction logs for yield distribution events."""
        result = {
            'is_yield_distribution': False,
            'amount': None,
            'token_address': None,
            'events': [],
            'transaction_type': None,  # 'reward_call' or 'yield_distribution'
            'involves_rewards_manager': False,
            'involves_slvlusd': False
        }
        
        if not receipt or 'logs' not in receipt:
            return result
        
        for log in receipt['logs']:
            # Check if log is from our target contracts
            log_address = log.get('address', '').lower()
            rewards_manager = self.rewards_manager_address.lower()
            slvlusd = self.slvlusd_address.lower()
            
            # Track which contracts are involved
            if log_address == rewards_manager:
                result['involves_rewards_manager'] = True
            elif log_address == slvlusd:
                result['involves_slvlusd'] = True
            
            # Only analyze logs from our target contracts
            if log_address not in [rewards_manager, slvlusd]:
                continue
            
            # Check event signatures
            if log.get('topics') and len(log['topics']) > 0:
                event_signature = log['topics'][0].hex()
                
                # Rewarded events (the primary target)
                if event_signature == self.event_signatures['Rewarded']:
                    try:
                        # Rewarded(address asset, address to, uint256 amount)
                        # Topics: [signature, asset (indexed), to (indexed)]
                        # Data: amount (non-indexed uint256)
                        
                        asset_address = None
                        recipient_address = None
                        
                        # Extract asset address from topic[1] if indexed
                        if len(log['topics']) >= 2:
                            asset_address = '0x' + log['topics'][1].hex()[-40:]  # Last 20 bytes
                            self.logger.info(f"Rewarded event - Asset: {asset_address}")
                        
                        # Extract recipient address from topic[2] if indexed
                        if len(log['topics']) >= 3:
                            recipient_address = '0x' + log['topics'][2].hex()[-40:]  # Last 20 bytes
                            self.logger.info(f"Rewarded event - Recipient: {recipient_address}")
                        
                        # Extract amount from data field
                        amount_hex = log['data']
                        if amount_hex:
                            # Handle both hex string and bytes
                            if isinstance(amount_hex, bytes):
                                amount_wei = int.from_bytes(amount_hex, byteorder='big')
                            elif isinstance(amount_hex, str):
                                # Remove '0x' prefix if present
                                if amount_hex.startswith('0x'):
                                    amount_hex = amount_hex[2:]
                                amount_wei = int(amount_hex, 16)
                            else:
                                continue
                                
                            # Don't convert to ETH - store raw amount for proper token formatting
                            # The asset address will tell us what token this is
                            raw_amount = amount_wei
                            
                            # Format amount based on known token contracts
                            if asset_address and asset_address.lower() == '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48':
                                # USDC has 6 decimals
                                formatted_amount = raw_amount / (10**6)
                                amount_display = f"{formatted_amount:,.2f} USDC"
                            else:
                                # Default to 18 decimals (ETH standard)
                                amount_eth = self.w3.from_wei(raw_amount, 'ether')
                                amount_display = f"{amount_eth} tokens"
                            
                            result['is_yield_distribution'] = True
                            result['amount'] = amount_display
                            result['amount_raw'] = raw_amount
                            result['token_address'] = log_address
                            result['events'].append({
                                'type': 'Rewarded',
                                'amount': amount_display,
                                'amount_raw': raw_amount,
                                'address': log_address,
                                'signature': event_signature,
                                'asset': asset_address,
                                'recipient': recipient_address
                            })
                            self.logger.info(f"✅ Found Rewarded event with amount: {amount_display}")
                    except Exception as e:
                        self.logger.error(f"Error decoding Rewarded event: {e}")
                
                # Transfer events (potential yield distribution)
                elif event_signature == self.event_signatures['Transfer']:
                    try:
                        # Decode transfer amount (in wei)
                        amount_hex = log['data']
                        if amount_hex:
                            # Handle both hex string and bytes
                            if isinstance(amount_hex, bytes):
                                amount_wei = int.from_bytes(amount_hex, byteorder='big')
                            elif isinstance(amount_hex, str):
                                amount_wei = int(amount_hex, 16)
                            else:
                                continue
                                
                            # Format amount based on the contract address (similar to Rewarded event logic)
                            raw_amount = amount_wei
                            
                            # Check if this is from a known token contract
                            if log_address == '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48':  # USDC
                                formatted_amount = raw_amount / (10**6)
                                amount_display = f"{formatted_amount:,.2f} USDC"
                            else:
                                # Default to 18 decimals (ETH standard)
                                amount_eth = self.w3.from_wei(raw_amount, 'ether')
                                amount_display = f"{amount_eth} tokens"
                            
                            result['is_yield_distribution'] = True
                            result['amount'] = amount_display
                            result['amount_raw'] = raw_amount
                            result['token_address'] = log_address
                            result['events'].append({
                                'type': 'Transfer',
                                'amount': amount_display,
                                'amount_raw': raw_amount,
                                'address': log_address
                            })
                    except Exception as e:
                        # Just log a debug message instead of error
                        self.logger.debug(f"Could not decode transfer log data: {e}")
                
                # Note: Removed generic event signatures - only monitoring specific Rewarded events and Transfers
        
        # Determine transaction type based on analysis
        if result['involves_rewards_manager']:
            result['transaction_type'] = 'yield_distribution_call'  # RewardsManager yield distribution method called
            result['is_yield_distribution'] = True
        elif result['involves_slvlusd']:
            result['transaction_type'] = 'slvlusd_interaction'  # slvlUSD contract interaction
            result['is_yield_distribution'] = True
        
        return result
    
    async def process_block(self, block_number: int) -> List[Dict[str, Any]]:
        """Process a single block and return yield distribution events."""
        yield_distributions = []
        
        try:
            transactions = await self.get_block_transactions(block_number)
            
            for tx in transactions:
                if self.is_yield_distribution_transaction(tx):
                    receipt = await self.get_transaction_receipt(tx['hash'].hex())
                    
                    if receipt:
                        analysis = self.analyze_transaction_logs(receipt)
                        
                        if analysis['is_yield_distribution']:
                            yield_distribution = {
                                'transaction_hash': tx['hash'].hex(),
                                'block_number': block_number,
                                'from_address': tx.get('from'),
                                'to_address': tx.get('to'),
                                'amount': analysis.get('amount', 'Unknown'),
                                'token_address': analysis.get('token_address'),
                                'events': analysis.get('events', []),
                                'gas_used': receipt.get('gasUsed', 0),
                                'transaction_type': analysis.get('transaction_type', 'unknown'),
                                'involves_rewards_manager': analysis.get('involves_rewards_manager', False),
                                'involves_slvlusd': analysis.get('involves_slvlusd', False)
                            }
                            
                            yield_distributions.append(yield_distribution)
                            self.logger.info(f"Yield distribution detected in block {block_number}: {tx['hash'].hex()}")
        
        except Exception as e:
            self.logger.error(f"Error processing block {block_number}: {e}")
        
        return yield_distributions
    
    async def start_monitoring(self, start_block: Optional[int] = None):
        """Start monitoring the blockchain for yield distributions."""
        if start_block is None:
            start_block = await self.get_latest_block()
        
        self.last_processed_block = start_block - 1
        self.logger.info(f"Starting blockchain monitoring from block {start_block}")
        
        while True:
            try:
                latest_block = await self.get_latest_block()
                
                # Process new blocks
                if latest_block > self.last_processed_block:
                    # Process blocks with confirmations
                    confirmed_block = latest_block - Config.BLOCK_CONFIRMATIONS
                    
                    if confirmed_block > self.last_processed_block:
                        for block_num in range(self.last_processed_block + 1, confirmed_block + 1):
                            yield_distributions = await self.process_block(block_num)
                            
                            # Yield each distribution for processing
                            for distribution in yield_distributions:
                                yield distribution
                        
                        self.last_processed_block = confirmed_block
                
                # Wait before next poll
                await asyncio.sleep(Config.POLL_INTERVAL)
                
            except Exception as e:
                self.logger.error(f"Error in monitoring loop: {e}")
                await asyncio.sleep(Config.POLL_INTERVAL)
    
    def get_status(self) -> Dict[str, Any]:
        """Get monitoring status."""
        return {
            'connected': self.w3.is_connected(),
            'chain_id': self.w3.eth.chain_id if self.w3.is_connected() else None,
            'last_processed_block': self.last_processed_block,
            'rewards_manager_address': self.rewards_manager_address,
            'slvlusd_address': self.slvlusd_address
        }
