import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import { config } from './config.js';

export class DiscordBot {
  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
      ]
    });
    
    this.channelId = config.DISCORD_CHANNEL_ID;
    this.readyResolve = null;
    this.setupEventHandlers();
    
  }
  
  setupEventHandlers() {
    this.client.once('ready', () => {
      console.log(`🤖 ${this.client.user.tag} has connected to Discord!`);
      console.log(`📊 Bot is in ${this.client.guilds.cache.size} guilds`);
      
      // Debug: List all available channels
      this.client.guilds.cache.forEach(guild => {
        console.log(`🏛️ Guild: ${guild.name} (ID: ${guild.id})`);
        guild.channels.cache
          .filter(channel => channel.type === 0) // Text channels
          .forEach(channel => {
            console.log(`   📝 Channel: #${channel.name} (ID: ${channel.id})`);
          });
      });
      
      // Check target channel
      this.client.channels.fetch(this.channelId)
        .then(channel => {
          if (channel) {
            console.log(`✅ Target channel found: #${channel.name}`);
          } else {
            console.error(`❌ Target channel ${this.channelId} not found or not accessible`);
          }
          
          // Resolve the start promise after channel verification
          if (this.readyResolve) {
            this.readyResolve();
          }
        })
        .catch(err => {
          console.error(`❌ Error fetching target channel ${this.channelId}: ${err.message}`);
          
          // Still resolve even if channel fetch fails
          if (this.readyResolve) {
            this.readyResolve();
          }
        });
    });
    
    this.client.on('messageCreate', async (message) => {
      if (message.author.bot) return;
      
      if (message.content === '!status') {
        await this.sendStatusMessage(message.channel);
      } else if (message.content === '!test') {
        await this.sendTestNotification(message.channel);
      }
    });
  }
  
  async start() {
    return new Promise((resolve, reject) => {
      // Store the resolve function so the ready handler can call it
      this.readyResolve = resolve;
      
      // Set up error handling
      this.client.once('error', (error) => {
        reject(error);
      });
      
      // Start the login process
      this.client.login(config.DISCORD_BOT_TOKEN).catch(reject);
    });
  }
  
  async stop() {
    if (this.client) {
      await this.client.destroy();
    }
  }
  
  async sendYieldNotification(yieldDistribution) {
    try {
      const channel = await this.client.channels.fetch(this.channelId).catch(() => null);
      if (!channel) {
        console.error(`❌ Could not find or access channel with ID: ${this.channelId}`);
        return false;
      }
      
      const { transactionHash, amount, blockNumber, transactionType, involvesRewardsManager, events } = yieldDistribution;
      
      // Create title and description based on transaction type
      let title, description, color;
      
      // Check for Rewarded events
      const rewardedEvents = events?.filter(event => event.type === 'Rewarded') || [];
      
      if (rewardedEvents.length > 0) {
        title = '🏆 Rewarded Event Detected!';
        description = 'SlvlUSD yield distribution ';
        color = 0xffd700; // Gold
      } else if (transactionType === 'yield_distribution_call') {
        title = '🎉 Yield Distribution Detected!';
        description = 'RewardsManager method 0x6a761202 called - Protocol yield distribution triggered!';
        color = 0x00ff00; // Green
      } else if (transactionType === 'slvlusd_interaction') {
        title = '💎 slvlUSD Interaction Detected!';
        description = 'slvlUSD contract interaction related to yield';
        color = 0x0099ff; // Blue
      } else {
        title = '🔍 Yield-Related Transaction Detected!';
        description = 'A yield-related transaction has been processed';
        color = 0x888888; // Gray
      }
      
      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        .setTimestamp()
        .addFields(
          {
            name: '💰 Amount',
            value: amount || 'Unknown',
            inline: true
          },
          {
            name: '📦 Block Number',
            value: blockNumber.toLocaleString(),
            inline: true
          },
          {
            name: '🔗 Transaction Hash',
            value: `[View on Explorer](https://etherscan.io/tx/${transactionHash})`,
            inline: false
          }
        );
      
      // Add details
      const detailsParts = [];
      if (involvesRewardsManager) {
        detailsParts.push('🏛️ RewardsManager method 0x6a761202 executed');
      }
      
      // Add Rewarded event details
      rewardedEvents.forEach(event => {
        if (event.asset) {
          detailsParts.push(`💰 Asset: ${event.asset}`);
        }
        if (event.recipient) {
          detailsParts.push(`👤 Recipient: ${event.recipient}`);
        }
      });
      
      if (detailsParts.length === 0) {
        detailsParts.push('Protocol yield distribution event detected');
      }
      // Append weekly breakdown link
      detailsParts.push('For weekly breakdown: https://app.level.money/transparency?tab=apy');
      
      embed.addFields({
        name: 'ℹ️ Details',
        value: detailsParts.join(' • '),
        inline: false
      });
      
      embed.setFooter({ text: 'YieldBot • Monitoring Protocol Yield Distributions' });
      
      await channel.send({ embeds: [embed] });
      console.log(`📤 Yield notification sent to channel ${this.channelId}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Failed to send yield notification: ${error.message}`);
      return false;
    }
  }
  
  async sendStatusMessage(channel) {
    const embed = new EmbedBuilder()
      .setTitle('🤖 YieldBot Status')
      .setDescription('Bot is online and monitoring yield distributions')
      .setColor(0x0099ff)
      .addFields(
        {
          name: 'Monitoring',
          value: '✅ Active',
          inline: true
        },
        {
          name: 'Chain',
          value: `Chain ID: ${config.CHAIN_ID}`,
          inline: true
        }
      )
      .setTimestamp();
    
    await channel.send({ embeds: [embed] });
  }
  
  async sendTestNotification(channel) {
    const testDistribution = {
      transactionHash: '0x1234567890abcdef1234567890abcdef12345678',
      amount: '31,338.00 USDC',
      blockNumber: 18500000,
      transactionType: 'yield_distribution_call',
      involvesRewardsManager: true,
      events: [{
        type: 'Rewarded',
        asset: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        recipient: '0xdf95bb71581b224bd42eb19ceaff5e92816e181e'
      }]
    };
    
    await this.sendYieldNotification(testDistribution);
    await channel.send('✅ Test notification sent!');
  }
}
