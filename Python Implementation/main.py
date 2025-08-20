import asyncio
import logging
import signal
import sys
from datetime import datetime
from config import Config
from discord_bot import create_bot
from blockchain_monitor import BlockchainMonitor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('yieldbot.log', encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)

class YieldBotService:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.bot = None
        self.monitor = None
        self.running = False
        
    async def initialize(self):
        """Initialize the bot and blockchain monitor."""
        try:
            # Validate configuration
            Config.validate()
            self.logger.info("Configuration validated successfully")
            
            # Initialize Discord bot
            self.bot = create_bot()
            self.logger.info("Discord bot created")
            
            # Initialize blockchain monitor
            self.monitor = BlockchainMonitor()
            self.logger.info("Blockchain monitor created")
            
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to initialize service: {e}")
            return False
    
    async def start_discord_bot(self):
        """Start the Discord bot."""
        try:
            await self.bot.start(Config.DISCORD_BOT_TOKEN)
        except Exception as e:
            self.logger.error(f"Discord bot error: {e}")
    
    async def monitor_and_notify(self):
        """Monitor blockchain and send notifications."""
        try:
            async for yield_distribution in self.monitor.start_monitoring():
                if not self.running:
                    break
                
                # Send Discord notification
                success = await self.bot.send_yield_notification(
                    transaction_hash=yield_distribution['transaction_hash'],
                    amount=yield_distribution['amount'],
                    block_number=yield_distribution['block_number'],
                    transaction_type=yield_distribution.get('transaction_type', 'unknown'),
                    involves_rewards_manager=yield_distribution.get('involves_rewards_manager', False),
                    involves_slvlusd=yield_distribution.get('involves_slvlusd', False),
                    events=yield_distribution.get('events', [])
                )
                
                if success:
                    self.logger.info(f"Notification sent for transaction: {yield_distribution['transaction_hash']}")
                else:
                    self.logger.error(f"Failed to send notification for transaction: {yield_distribution['transaction_hash']}")
        
        except Exception as e:
            self.logger.error(f"Monitor and notify error: {e}")
    
    async def start(self):
        """Start the service."""
        self.logger.info("Starting YieldBot service...")
        
        if not await self.initialize():
            self.logger.error("Failed to initialize service")
            return False
        
        self.running = True
        
        # Start both Discord bot and monitoring concurrently
        tasks = [
            asyncio.create_task(self.start_discord_bot()),
            asyncio.create_task(self.monitor_and_notify())
        ]
        
        try:
            await asyncio.gather(*tasks)
        except Exception as e:
            self.logger.error(f"Service error: {e}")
        finally:
            await self.stop()
    
    async def stop(self):
        """Stop the service."""
        self.logger.info("Stopping YieldBot service...")
        self.running = False
        
        if self.bot:
            await self.bot.close()
        
        self.logger.info("YieldBot service stopped")

# Global service instance
service = YieldBotService()

def signal_handler(signum, frame):
    """Handle shutdown signals."""
    print(f"\nReceived signal {signum}, shutting down...")
    asyncio.create_task(service.stop())

async def main():
    """Main entry point."""
    # Set up signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        await service.start()
    except KeyboardInterrupt:
        print("\nShutdown requested by user")
    except Exception as e:
        logging.error(f"Fatal error: {e}")
    finally:
        await service.stop()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nGoodbye!")
    except Exception as e:
        logging.error(f"Failed to start service: {e}")
        sys.exit(1)
