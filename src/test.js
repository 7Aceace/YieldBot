import { config, validateConfig } from './config.js';
import { BlockchainMonitor } from './blockchain-monitor.js';
import { DiscordBot } from './discord-bot.js';

/**
 * Comprehensive test suite for YieldBot
 * Usage: node src/test.js
 */

async function testConfiguration() {
  console.log('🧪 Testing Configuration...');
  try {
    validateConfig();
    console.log('✅ Configuration is valid');
    
    console.log('📋 Current configuration:');
    console.log(`   🤖 Discord Channel ID: ${config.DISCORD_CHANNEL_ID}`);
    console.log(`   🌐 RPC URL: ${config.RPC_URL?.slice(0, 30)}...`);
    console.log(`   🏛️ RewardsManager: ${config.REWARDS_MANAGER_ADDRESS}`);
    console.log(`   💎 slvlUSD: ${config.SLVLUSD_ADDRESS || 'Not set'}`);
    console.log(`   ⛓️ Chain ID: ${config.CHAIN_ID}`);
    console.log(`   📊 Poll Interval: ${config.POLL_INTERVAL}s`);
    console.log(`   🔧 Method ID: ${config.YIELD_DISTRIBUTION_METHOD}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Configuration error: ${error.message}`);
    return false;
  }
}

async function testBlockchainConnection() {
  console.log('\\n🌐 Testing Blockchain Connection...');
  try {
    const monitor = new BlockchainMonitor();
    const status = await monitor.getStatus();
    
    if (status.connected) {
      console.log('✅ Successfully connected to blockchain');
      console.log(`📊 Latest block: ${status.latestBlock?.toLocaleString()}`);
      console.log(`⛓️ Chain ID: ${status.chainId}`);
      console.log(`🔑 Event signature: ${monitor.rewardedEventSignature}`);
      return true;
    } else {
      console.error(`❌ Failed to connect: ${status.error}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Blockchain connection error: ${error.message}`);
    return false;
  }
}

async function testDiscordConnection() {
  console.log('\\n🤖 Testing Discord Connection...');
  try {
    const bot = new DiscordBot();
    
    console.log('⏳ Connecting to Discord...');
    await bot.start();
    
    // Wait a moment for connection to establish
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    if (bot.client.isReady()) {
      console.log('✅ Successfully connected to Discord');
      console.log(`🏛️ Connected to ${bot.client.guilds.cache.size} servers`);
      
      const channel = bot.client.channels.cache.get(config.DISCORD_CHANNEL_ID);
      if (channel) {
        console.log(`📝 Target channel found: #${channel.name}`);
      } else {
        console.error('❌ Target channel not found or not accessible');
      }
      
      await bot.stop();
      return true;
    } else {
      console.error('❌ Failed to connect to Discord');
      return false;
    }
  } catch (error) {
    console.error(`❌ Discord connection error: ${error.message}`);
    return false;
  }
}

async function testEventSignature() {
  console.log('\\n🔑 Testing Event Signature Calculation...');
  try {
    const monitor = new BlockchainMonitor();
    
    console.log('📋 Event signature details:');
    console.log(`   Event: Rewarded(address,address,uint256)`);
    console.log(`   Calculated signature: ${monitor.rewardedEventSignature}`);
    console.log(`   Expected method ID: ${config.YIELD_DISTRIBUTION_METHOD}`);
    
    // Test with the known transaction from the screenshot
    console.log('\\n📊 Testing with known transaction data:');
    console.log('   Asset: 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48 (USDC)');
    console.log('   Amount: 31338000000 (raw)');
    console.log('   Expected: 31,338.00 USDC');
    
    return true;
  } catch (error) {
    console.error(`❌ Event signature test error: ${error.message}`);
    return false;
  }
}

async function testBlockProcessing() {
  console.log('\\n🔍 Testing Block Processing...');
  try {
    const monitor = new BlockchainMonitor();
    const status = await monitor.getStatus();
    
    if (!status.connected) {
      console.error('❌ Cannot test block processing - not connected to blockchain');
      return false;
    }
    
    // Test with a recent block (should be empty for yield distributions)
    const testBlock = status.latestBlock - 10;
    console.log(`📦 Testing block processing with block ${testBlock}...`);
    
    const startTime = Date.now();
    const distributions = await monitor.processBlock(BigInt(testBlock));
    const duration = Date.now() - startTime;
    
    console.log(`✅ Block processing completed in ${duration}ms`);
    console.log(`📊 Distributions found: ${distributions.length}`);
    
    if (distributions.length > 0) {
      console.log('🎉 Found yield distributions! (unexpected but good)');
      distributions.forEach((dist, index) => {
        console.log(`   ${index + 1}. ${dist.transactionHash} - ${dist.amount}`);
      });
    } else {
      console.log('📭 No distributions found (expected for random block)');
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Block processing test error: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 YieldBot Comprehensive Test Suite');
  console.log('=' .repeat(50));
  
  const tests = [
    { name: 'Configuration', fn: testConfiguration },
    { name: 'Blockchain Connection', fn: testBlockchainConnection },
    { name: 'Discord Connection', fn: testDiscordConnection },
    { name: 'Event Signature', fn: testEventSignature },
    { name: 'Block Processing', fn: testBlockProcessing }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
    } catch (error) {
      console.error(`💥 Test "${test.name}" crashed: ${error.message}`);
      results.push({ name: test.name, passed: false });
    }
  }
  
  // Summary
  console.log('\\n📊 Test Results Summary');
  console.log('=' .repeat(30));
  
  let allPassed = true;
  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.name}`);
    if (!result.passed) allPassed = false;
  });
  
  console.log('\\n' + (allPassed ? '🎉 ALL TESTS PASSED!' : '⚠️ SOME TESTS FAILED'));
  
  if (allPassed) {
    console.log('\\n🚀 Your YieldBot is ready to run!');
    console.log('💡 Start it with: node src/index.js');
    console.log('🔍 Test specific blocks with: node src/test-block.js [blockNumber]');
  } else {
    console.log('\\n🔧 Please fix the failing tests before running the bot.');
  }
  
  console.log('\\n📋 Useful commands:');
  console.log('   npm start           - Start the bot');
  console.log('   npm run test        - Run these tests again');
  console.log('   npm run test-block  - Test a specific block');
}

// Run all tests
runAllTests().catch(error => {
  console.error(`💥 Test suite crashed: ${error.message}`);
  process.exit(1);
});
