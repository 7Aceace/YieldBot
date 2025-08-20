import { config, validateConfig } from './config.js';
import { BlockchainMonitor } from './blockchain-monitor.js';
import { DiscordBot } from './discord-bot.js';

/**
 * Test script to check a specific block for yield distribution events AND send Discord notifications
 * Usage: node src/test-block-with-discord.js [blockNumber]
 * Example: node src/test-block-with-discord.js 23174914
 */

async function testSpecificBlockWithDiscord(blockNumber) {
  let bot = null;
  
  try {
    console.log('🧪 YieldBot Block Testing Tool (with Discord notifications)');
    console.log('='.repeat(60));
    
    // Validate configuration
    validateConfig();
    console.log('✅ Configuration validated');
    
    // Initialize monitor
    const monitor = new BlockchainMonitor();
    console.log('✅ Blockchain monitor initialized');
    
    // Initialize Discord bot
    bot = new DiscordBot();
    console.log('✅ Discord bot initialized');
    
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
      
      // Connect to Discord for notifications
      console.log('\n📱 Connecting to Discord...');
      try {
        await bot.start();
        console.log('✅ Connected to Discord successfully');
        
        // Wait a moment for connection to stabilize
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Send notifications for each distribution
        for (let index = 0; index < distributions.length; index++) {
          const dist = distributions[index];
          
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
          
          // Send Discord notification for this distribution
          console.log(`\n📤 Sending Discord notification for transaction ${dist.transactionHash}...`);
          try {
            const success = await bot.sendYieldNotification(dist);
            if (success) {
              console.log('✅ Discord notification sent successfully!');
              console.log('📱 Check your Discord channel for the notification!');
            } else {
              console.log('❌ Failed to send Discord notification');
            }
          } catch (error) {
            console.log(`❌ Discord notification error: ${error.message}`);
          }
          
          // Small delay between notifications if multiple
          if (index < distributions.length - 1) {
            console.log('⏳ Waiting 2 seconds before next notification...');
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
        
        console.log('\n🎉 SUCCESS: Found yield distributions and sent Discord notifications!');
        
      } catch (discordError) {
        console.warn(`⚠️ Discord connection failed: ${discordError.message}`);
        console.log('📋 Continuing with local analysis only...');
        
        // Still show the distributions locally
        distributions.forEach((dist, index) => {
          console.log(`\n${index + 1}. Transaction: ${dist.transactionHash}`);
          console.log(`   💰 Amount: ${dist.amount}`);
          console.log(`   📦 Block: ${dist.blockNumber}`);
          console.log(`   🏷️ Type: ${dist.transactionType}`);
        });
        
        console.log('\n🎉 SUCCESS: Found yield distributions (Discord unavailable)!');
      }
      
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
  } finally {
    // Clean up Discord connection
    if (bot && bot.client && bot.client.isReady()) {
      console.log('\n🔌 Disconnecting from Discord...');
      try {
        await bot.stop();
        console.log('✅ Discord connection closed');
      } catch (error) {
        console.log(`⚠️ Error closing Discord connection: ${error.message}`);
      }
    }
  }
}

// Get block number from command line arguments
const blockNumber = process.argv[2];

if (!blockNumber) {
  console.error('❌ Please provide a block number');
  console.log('📋 Usage: node src/test-block-with-discord.js [blockNumber]');
  console.log('📋 Example: node src/test-block-with-discord.js 23174914');
  console.log('\n🔗 You can find block numbers on Etherscan:');
  console.log('   https://etherscan.io/address/0xBD05B8B22fE4ccf093a6206C63Cc39f02345E0DA#events');
  process.exit(1);
}

if (!/^\d+$/.test(blockNumber)) {
  console.error('❌ Block number must be a valid integer');
  process.exit(1);
}

// Run the test
testSpecificBlockWithDiscord(parseInt(blockNumber));
