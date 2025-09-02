import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Discord Configuration
  DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
  DISCORD_CHANNEL_ID: process.env.DISCORD_CHANNEL_ID,
  
  // Blockchain Configuration  
  RPC_URL: process.env.RPC_URL,
  // Multiple RPC endpoints for redundancy
  RPC_URLS: [
    process.env.RPC_URL,
    process.env.RPC_URL_BACKUP_1 || 'https://ethereum-rpc.publicnode.com',
    process.env.RPC_URL_BACKUP_2 || 'https://rpc.ankr.com/eth',
    process.env.RPC_URL_BACKUP_3 || 'https://eth.llamarpc.com',
    process.env.RPC_URL_BACKUP_4 || 'https://ethereum.blockpi.network/v1/rpc/public'
  ].filter(Boolean),
  REWARDS_MANAGER_ADDRESS: process.env.REWARDS_MANAGER_ADDRESS || '0xBD05B8B22fE4ccf093a6206C63Cc39f02345E0DA',
  SLVLUSD_ADDRESS: process.env.SLVLUSD_ADDRESS,
  // Specific interaction (To) address requirement
  INTERACTION_TO_ADDRESS: process.env.INTERACTION_TO_ADDRESS || '0xcEa14C3e9Afc5822d44ADe8d006fCFBAb60f7a21',
  
  // Network Configuration
  CHAIN_ID: parseInt(process.env.CHAIN_ID) || 1,
  
  // Monitoring Configuration
  BLOCK_CONFIRMATIONS: parseInt(process.env.BLOCK_CONFIRMATIONS) || 3,
  POLL_INTERVAL: parseInt(process.env.POLL_INTERVAL) || 45, // Increased from 30 to reduce rate limiting
  POLL_INTERVAL_BACKOFF: parseInt(process.env.POLL_INTERVAL_BACKOFF) || 120, // Backoff interval on rate limit
  
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
