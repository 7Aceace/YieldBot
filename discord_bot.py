import discord
from discord.ext import commands
import asyncio
import logging
from datetime import datetime
from config import Config

class YieldBot(commands.Bot):
    def __init__(self):
        intents = discord.Intents.default()
        # Only use non-privileged intents
        intents.guilds = True
        intents.guild_messages = True
        super().__init__(command_prefix='!', intents=intents)
        
        self.channel_id = Config.DISCORD_CHANNEL_ID
        self.logger = logging.getLogger(__name__)
        
    async def on_ready(self):
        """Called when the bot is ready."""
        self.logger.info(f'{self.user} has connected to Discord!')
        self.logger.info(f'Bot is in {len(self.guilds)} guilds')
        
        # Debug: List all available channels
        for guild in self.guilds:
            self.logger.info(f'Guild: {guild.name} (ID: {guild.id})')
            for channel in guild.text_channels:
                self.logger.info(f'  Channel: #{channel.name} (ID: {channel.id})')
        
        # Check if target channel is accessible
        target_channel = self.get_channel(self.channel_id)
        if target_channel:
            self.logger.info(f'✅ Target channel found: #{target_channel.name}')
        else:
            self.logger.error(f'❌ Target channel {self.channel_id} not found or not accessible')
        
    async def send_yield_notification(self, transaction_hash: str, amount: str, block_number: int, transaction_type: str = 'unknown', involves_rewards_manager: bool = False, involves_slvlusd: bool = False, events: list = None):
        """Send a yield distribution notification to the configured channel."""
        try:
            channel = self.get_channel(self.channel_id)
            if not channel:
                self.logger.error(f"Could not find channel with ID: {self.channel_id}")
                return False
                
            # Create title and description based on transaction type
            if transaction_type == 'yield_distribution_call':
                title = "🎉 Yield Distribution Detected!"
                description = f"RewardsManager method 0x6a761202 called - Protocol yield distribution triggered!"
                color = 0x00ff00  # Green color
            elif transaction_type == 'slvlusd_interaction':
                title = "💎 slvlUSD Interaction Detected!"
                description = "slvlUSD contract interaction related to yield"
                color = 0x0099ff  # Blue color
            else:
                title = "🔍 Yield-Related Transaction Detected!"
                description = "A yield-related transaction has been processed"
                color = 0x888888  # Gray color
            
            # Check if we have Rewarded events for enhanced notification
            rewarded_events = []
            if events:
                rewarded_events = [event for event in events if event.get('type') == 'Rewarded']
            
            if rewarded_events:
                title = "🏆 Rewarded Event Detected!"
                description = "Protocol yield distribution via Rewarded event - yield has been distributed!"
                color = 0xffd700  # Gold color
            
            # Create an embedded message for better formatting
            embed = discord.Embed(
                title=title,
                description=description,
                color=color,
                timestamp=datetime.utcnow()
            )
            
            embed.add_field(
                name="💰 Amount",
                value=f"{amount}",
                inline=True
            )
            
            embed.add_field(
                name="📦 Block Number",
                value=f"{block_number:,}",
                inline=True
            )
            
            embed.add_field(
                name="🔗 Transaction Hash",
                value=f"[View on Explorer](https://etherscan.io/tx/{transaction_hash})",
                inline=False
            )
            
            # Add details based on what contracts are involved
            details_parts = []
            if involves_rewards_manager:
                details_parts.append("🏛️ RewardsManager method 0x6a761202 executed")
            if involves_slvlusd:
                details_parts.append("💎 slvlUSD contract interaction")
            
            # Add Rewarded event details
            if rewarded_events:
                for event in rewarded_events:
                    if event.get('asset'):
                        details_parts.append(f"💰 Asset: {event['asset']}")
                    if event.get('recipient'):
                        details_parts.append(f"👤 Recipient: {event['recipient']}")
            
            if not details_parts:
                details_parts.append("Protocol yield distribution event detected")
            
            embed.add_field(
                name="ℹ️ Details",
                value=" • ".join(details_parts),
                inline=False
            )
            
            embed.set_footer(text="YieldBot • Monitoring Protocol Yield Distributions")
            
            await channel.send(embed=embed)
            self.logger.info(f"Yield notification sent to channel {self.channel_id}")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to send yield notification: {e}")
            return False
    
    async def send_simple_notification(self, message: str):
        """Send a simple text notification to the configured channel."""
        try:
            channel = self.get_channel(self.channel_id)
            if not channel:
                self.logger.error(f"Could not find channel with ID: {self.channel_id}")
                return False
                
            await channel.send(message)
            self.logger.info(f"Simple notification sent to channel {self.channel_id}")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to send simple notification: {e}")
            return False
    
    @commands.command(name='status')
    async def status_command(self, ctx):
        """Check bot status."""
        embed = discord.Embed(
            title="🤖 YieldBot Status",
            description="Bot is online and monitoring yield distributions",
            color=0x0099ff
        )
        
        embed.add_field(
            name="Monitoring",
            value="✅ Active",
            inline=True
        )
        
        embed.add_field(
            name="Chain",
            value=f"Chain ID: {Config.CHAIN_ID}",
            inline=True
        )
        
        await ctx.send(embed=embed)
    
    @commands.command(name='test')
    async def test_notification(self, ctx):
        """Send a test yield notification."""
        await self.send_yield_notification(
            transaction_hash="0x1234567890abcdef1234567890abcdef12345678",
            amount="1,000.50",
            block_number=18500000,
            transaction_type="yield_distribution_call",
            involves_rewards_manager=True,
            involves_slvlusd=False
        )
        await ctx.send("Test notification sent!")

def create_bot():
    """Create and return a YieldBot instance."""
    return YieldBot()
