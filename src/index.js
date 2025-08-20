import { config, validateConfig } from './config.js';
import { BlockchainMonitor } from './blockchain-monitor.js';
import { DiscordBot } from './discord-bot.js';

class YieldBotService {
  constructor() {
    this.bot = null;
    this.monitor = null;
    this.running = false;
  }
  
  async initialize() {
    try {
      // Validate configuration
      validateConfig();
      console.log('✅ Configuration validated successfully');
      
      // Initialize Discord bot
      this.bot = new DiscordBot();
      console.log('✅ Discord bot created');
      
      // Initialize blockchain monitor
      this.monitor = new BlockchainMonitor();
      console.log('✅ Blockchain monitor created');
      
      return true;
    } catch (error) {
      console.error(`❌ Failed to initialize service: ${error.message}`);
      return false;
    }
  }
  
  async start() {
    console.log('🚀 Starting YieldBot service...');
    
    if (!await this.initialize()) {
      console.error('❌ Failed to initialize service');
      return false;
    }
    
    this.running = true;
    
    try {
      // Start Discord bot
      await this.bot.start();
      
      // Set up blockchain monitoring
      this.monitor.on('yieldDistribution', async (distribution) => {
        if (!this.running) return;
        
        console.log(`📊 Processing yield distribution: ${distribution.transactionHash}`);
        
        const success = await this.bot.sendYieldNotification(distribution);
        
        if (success) {
          console.log(`✅ Notification sent for transaction: ${distribution.transactionHash}`);
        } else {
          console.error(`❌ Failed to send notification for transaction: ${distribution.transactionHash}`);
        }
      });
      
      // Start monitoring
      await this.monitor.startMonitoring();
      
    } catch (error) {
      console.error(`❌ Service error: ${error.message}`);
      await this.stop();
    }
  }
  
  async stop() {
    console.log('🛑 Stopping YieldBot service...');
    this.running = false;
    
    if (this.bot) {
      await this.bot.stop();
    }
    
    console.log('✅ YieldBot service stopped');
  }
}

// Handle shutdown signals
process.on('SIGINT', async () => {
  console.log('\\n📝 Received SIGINT, shutting down gracefully...');
  if (service) {
    await service.stop();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\\n📝 Received SIGTERM, shutting down gracefully...');
  if (service) {
    await service.stop();
  }
  process.exit(0);
});

// Start the service
const service = new YieldBotService();

try {
  await service.start();
} catch (error) {
  console.error(`💥 Fatal error: ${error.message}`);
  process.exit(1);
}
