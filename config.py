import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    # Discord Configuration
    DISCORD_BOT_TOKEN = os.getenv('DISCORD_BOT_TOKEN')
    DISCORD_CHANNEL_ID = int(os.getenv('DISCORD_CHANNEL_ID', 0))
    
    # Blockchain Configuration
    RPC_URL = os.getenv('RPC_URL')
    REWARDS_MANAGER_ADDRESS = os.getenv('REWARDS_MANAGER_ADDRESS')
    SLVLUSD_ADDRESS = os.getenv('SLVLUSD_ADDRESS')
    
    # Network Configuration
    CHAIN_ID = int(os.getenv('CHAIN_ID', 1))
    
    # Monitoring Configuration
    BLOCK_CONFIRMATIONS = int(os.getenv('BLOCK_CONFIRMATIONS', 3))
    POLL_INTERVAL = int(os.getenv('POLL_INTERVAL', 30))
    
    @classmethod
    def validate(cls):
        """Validate that all required configuration is present."""
        required_fields = [
            'DISCORD_BOT_TOKEN',
            'DISCORD_CHANNEL_ID',
            'RPC_URL',
            'REWARDS_MANAGER_ADDRESS',
            'SLVLUSD_ADDRESS'
        ]
        
        missing_fields = []
        for field in required_fields:
            if not getattr(cls, field):
                missing_fields.append(field)
        
        if missing_fields:
            raise ValueError(f"Missing required configuration: {', '.join(missing_fields)}")
        
        return True
