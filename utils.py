import asyncio
import logging
from typing import Optional, Dict, Any
from web3 import Web3
from config import Config
from blockchain_monitor import BlockchainMonitor
from discord_bot import create_bot

class YieldBotUtils:
    """Utility functions for YieldBot."""
    
    @staticmethod
    def setup_logging(log_level: str = "INFO") -> None:
        """Set up logging configuration."""
        level = getattr(logging, log_level.upper(), logging.INFO)
        
        logging.basicConfig(
            level=level,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('yieldbot.log'),
                logging.StreamHandler()
            ]
        )
    
    @staticmethod
    async def test_discord_connection() -> bool:
        """Test Discord bot connection."""
        try:
            bot = create_bot()
            
            print("Logging into Discord...")
            await bot.login(Config.DISCORD_BOT_TOKEN)
            print("✅ Login successful")
            
            print("Connecting to Discord gateway...")
            # Start the bot connection but don't run indefinitely
            async def check_connection():
                await bot.wait_until_ready()
                
                print(f"✅ Bot is ready! Connected to {len(bot.guilds)} server(s)")
                
                # List all available channels for debugging
                print("\n📋 Available channels:")
                for guild in bot.guilds:
                    print(f"  Server: {guild.name}")
                    for channel in guild.text_channels:
                        print(f"    #{channel.name} (ID: {channel.id})")
                
                # Check if we can find the target channel
                channel = bot.get_channel(Config.DISCORD_CHANNEL_ID)
                if not channel:
                    print(f"\n❌ Could not find Discord channel with ID: {Config.DISCORD_CHANNEL_ID}")
                    print("💡 Make sure:")
                    print("   1. The channel ID is correct")
                    print("   2. The bot has permission to view the channel")
                    print("   3. The bot is in the correct server")
                    return False
                
                print(f"\n✅ Target channel found: #{channel.name} in {channel.guild.name}")
                return True
            
            # Start the bot and run the check
            task = asyncio.create_task(bot.start(Config.DISCORD_BOT_TOKEN))
            check_task = asyncio.create_task(check_connection())
            
            # Wait for either the check to complete or timeout
            try:
                result = await asyncio.wait_for(check_task, timeout=10.0)
                await bot.close()
                return result
            except asyncio.TimeoutError:
                print("❌ Connection timeout")
                await bot.close()
                return False
            
        except Exception as e:
            print(f"❌ Discord connection failed: {e}")
            return False
    
    @staticmethod
    def test_blockchain_connection() -> bool:
        """Test blockchain connection."""
        try:
            w3 = Web3(Web3.HTTPProvider(Config.RPC_URL))
            
            if not w3.is_connected():
                print(f"❌ Failed to connect to RPC endpoint: {Config.RPC_URL}")
                return False
            
            chain_id = w3.eth.chain_id
            latest_block = w3.eth.block_number
            
            print(f"✅ Blockchain connection successful")
            print(f"   Chain ID: {chain_id}")
            print(f"   Latest block: {latest_block:,}")
            
            return True
            
        except Exception as e:
            print(f"❌ Blockchain connection failed: {e}")
            return False
    
    @staticmethod
    def validate_addresses() -> bool:
        """Validate contract addresses."""
        try:
            # Check if addresses are valid Ethereum addresses
            rewards_manager = Config.REWARDS_MANAGER_ADDRESS
            slvlusd = Config.SLVLUSD_ADDRESS
            
            if not Web3.is_address(rewards_manager):
                print(f"❌ Invalid RewardsManager address: {rewards_manager}")
                return False
            
            if not Web3.is_address(slvlusd):
                print(f"❌ Invalid slvlUSD address: {slvlusd}")
                return False
            
            print(f"✅ Contract addresses are valid")
            print(f"   RewardsManager: {rewards_manager}")
            print(f"   slvlUSD: {slvlusd}")
            
            return True
            
        except Exception as e:
            print(f"❌ Address validation failed: {e}")
            return False
    
    @staticmethod
    async def send_test_notification() -> bool:
        """Send a test notification to Discord."""
        try:
            bot = create_bot()
            
            print("Logging into Discord for test notification...")
            await bot.login(Config.DISCORD_BOT_TOKEN)
            
            print("Connecting to Discord gateway...")
            # Start the bot and wait for it to be ready
            async def send_notification():
                await bot.wait_until_ready()
                
                print(f"Bot ready! Sending test notification to channel {Config.DISCORD_CHANNEL_ID}")
                
                success = await bot.send_yield_notification(
                    transaction_hash="0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
                    amount="1,337.42",
                    block_number=18500000,
                    transaction_type="yield_distribution_call",
                    involves_rewards_manager=True,
                    involves_slvlusd=False
                )
                
                return success
            
            # Start the bot and run the notification
            task = asyncio.create_task(bot.start(Config.DISCORD_BOT_TOKEN))
            notification_task = asyncio.create_task(send_notification())
            
            # Wait for notification to complete or timeout
            try:
                success = await asyncio.wait_for(notification_task, timeout=15.0)
                await bot.close()
                
                if success:
                    print("✅ Test notification sent successfully")
                    return True
                else:
                    print("❌ Failed to send test notification")
                    return False
                    
            except asyncio.TimeoutError:
                print("❌ Test notification timeout")
                await bot.close()
                return False
                
        except Exception as e:
            print(f"❌ Test notification failed: {e}")
            return False
    
    @staticmethod
    def check_environment() -> bool:
        """Check if all environment variables are set."""
        try:
            Config.validate()
            print("✅ All required environment variables are set")
            return True
        except ValueError as e:
            print(f"❌ Environment check failed: {e}")
            return False
    
    @staticmethod
    async def run_full_test() -> bool:
        """Run all tests."""
        print("🤖 YieldBot System Test")
        print("=" * 50)
        
        tests = [
            ("Environment Variables", YieldBotUtils.check_environment),
            ("Contract Addresses", YieldBotUtils.validate_addresses),
            ("Blockchain Connection", YieldBotUtils.test_blockchain_connection),
            ("Discord Connection", YieldBotUtils.test_discord_connection),
            ("Test Notification", YieldBotUtils.send_test_notification)
        ]
        
        all_passed = True
        
        for test_name, test_func in tests:
            print(f"\n🧪 Testing {test_name}...")
            try:
                if asyncio.iscoroutinefunction(test_func):
                    result = await test_func()
                else:
                    result = test_func()
                
                if not result:
                    all_passed = False
            except Exception as e:
                print(f"❌ {test_name} test crashed: {e}")
                all_passed = False
        
        print("\n" + "=" * 50)
        if all_passed:
            print("🎉 All tests passed! YieldBot is ready to run.")
        else:
            print("💥 Some tests failed. Please check your configuration.")
        
        return all_passed

async def main():
    """Main function for testing."""
    await YieldBotUtils.run_full_test()

if __name__ == "__main__":
    asyncio.run(main())
