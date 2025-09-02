import { config, validateConfig } from './config.js';
import { BlockchainMonitor } from './blockchain-monitor.js';
import { DiscordBot } from './discord-bot.js';

/**
 * Test script to check a specific block for yield distribution events
 * Usage: node src/test-block.js [blockNumber]
 * Example: node src/test-block.js 23174914
 */

async function testSpecificBlock(blockNumber) {
  let bot = null;
  try {
    console.log('🧪 YieldBot Block Testing Tool');
    console.log('='.repeat(50));
    
    // Validate configuration
    validateConfig();
    console.log('✅ Configuration validated');
    
    // Initialize monitor
    const monitor = new BlockchainMonitor();
    console.log('✅ Blockchain monitor initialized');
    
    // Get status
    const status = await monitor.getStatus();
    console.log('📊 Monitor Status:', status);
    
    if (!status.connected) {
      console.error('❌ Not connected to blockchain');
      return;
    }
    
    // Test specific block
    console.log(`\n🔍 Testing block ${blockNumber}...`);
    console.log('-'.repeat(40));
    
    const startTime = Date.now();
    const distributions = await monitor.processBlock(BigInt(blockNumber));
    const duration = Date.now() - startTime;
    
    console.log(`\n📈 Results for block ${blockNumber}:`);
    console.log(`⏱️ Processing time: ${duration}ms`);
    console.log(`📊 Yield distributions found: ${distributions.length}`);
    
    if (distributions.length > 0) {
      console.log('\n🎯 DETECTED YIELD DISTRIBUTIONS:');
      console.log('='.repeat(50));
      
      distributions.forEach((dist, index) => {
        console.log(`\n${index + 1}. Transaction: ${dist.transactionHash}`);
        console.log(`   💰 Amount: ${dist.amount}`);
        console.log(`   📦 Block: ${dist.blockNumber}`);
        console.log(`   🏷️ Type: ${dist.transactionType}`);
        console.log(`   ⛽ Gas Used: ${dist.gasUsed}`);
        console.log(`   🏛️ RewardsManager: ${dist.involvesRewardsManager ? '✅' : '❌'}`);
        console.log(`   💎 slvlUSD: ${dist.involvesSlvlusd ? '✅' : '❌'}`);
        
        if (dist.events && dist.events.length > 0) {
          console.log(`   📝 Events (${dist.events.length}):`);
          dist.events.forEach((event, eventIndex) => {
            console.log(`      ${eventIndex + 1}. ${event.type}: ${event.amount}`);
            if (event.asset) console.log(`         Asset: ${event.asset}`);
            if (event.recipient) console.log(`         Recipient: ${event.recipient}`);
          });
        }
      });
      
      // Send Discord notifications for detected distributions
      console.log('\n📱 Testing Discord notifications...');
      try {
        // Initialize Discord bot
        bot = new DiscordBot();
        await bot.start();
        console.log('✅ Connected to Discord');
        
        // Wait for connection to stabilize
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Send notification for first distribution
        if (distributions.length > 0) {
          console.log('📤 Sending test Discord notification...');
          const success = await bot.sendYieldNotification(distributions[0]);
          if (success) {
            console.log('✅ Discord notification sent successfully!');
          } else {
            console.log('❌ Failed to send Discord notification');
          }
        }
        
        // Clean up
        await bot.stop();
        console.log('🔌 Discord connection closed');
        
      } catch (error) {
        console.warn(`⚠️ Discord test failed: ${error.message}`);
      }
      
      console.log('\n🎉 SUCCESS: Found yield distributions and tested Discord!');
    } else {
      console.log('\n📭 No yield distributions found in this block.');
      console.log('\n💡 This could mean:');
      console.log('   - No yield distribution transactions occurred in this block');
      console.log('   - The transactions were not to the target contract');
      console.log('   - The method ID 0x6a761202 was not called');
      console.log('   - No Rewarded events were emitted');
    }
    
    console.log('\n🔍 Block Analysis Complete!');
    
  } catch (error) {
    console.error(`💥 Error testing block: ${error.message}`);
    console.error(error.stack);
  }
}

// Get block number from command line arguments
const blockNumber = process.argv[2];

if (!blockNumber) {
  console.error('❌ Please provide a block number');
  console.log('📋 Usage: node src/test-block.js [blockNumber]');
  console.log('📋 Example: node src/test-block.js 23174914');
  console.log('\n🔗 You can find block numbers on Etherscan:');
  console.log('   https://etherscan.io/address/0xBD05B8B22fE4ccf093a6206C63Cc39f02345E0DA#events');
  process.exit(1);
}

if (!/^\d+$/.test(blockNumber)) {
  console.error('❌ Block number must be a valid integer');
  process.exit(1);
}

// Run the test
testSpecificBlock(parseInt(blockNumber));
