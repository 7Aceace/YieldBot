import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Discord Configuration
  DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
  DISCORD_CHANNEL_ID: process.env.DISCORD_CHANNEL_ID,
  
  // Blockchain Configuration
  RPC_URL: process.env.RPC_URL,
  REWARDS_MANAGER_ADDRESS: process.env.REWARDS_MANAGER_ADDRESS || '0xBD05B8B22fE4ccf093a6206C63Cc39f02345E0DA',
  SLVLUSD_ADDRESS: process.env.SLVLUSD_ADDRESS,
  
  // Network Configuration
  CHAIN_ID: parseInt(process.env.CHAIN_ID) || 1,
  
  // Monitoring Configuration
  BLOCK_CONFIRMATIONS: parseInt(process.env.BLOCK_CONFIRMATIONS) || 3,
  POLL_INTERVAL: parseInt(process.env.POLL_INTERVAL) || 30,
  
  // Event Configuration
  YIELD_DISTRIBUTION_METHOD: '0x6a761202',
  USDC_ADDRESS: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
};

export function validateConfig() {
  const required = [
    'DISCORD_BOT_TOKEN',
    'DISCORD_CHANNEL_ID', 
    'RPC_URL',
    'REWARDS_MANAGER_ADDRESS'
  ];
  
  const missing = required.filter(key => !config[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }
  
  return true;
}
