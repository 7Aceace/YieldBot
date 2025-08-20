# YieldBot 🤖

A Discord bot that monitors blockchain transactions for yield distributions and posts notifications to your Discord server when the RewardsManager contract emits Rewarded events (method ID: 0x6a761202).

## Features

- 🔍 **Real-time Monitoring**: Continuously monitors blockchain for yield distribution transactions
- 💬 **Discord Notifications**: Sends rich embedded messages to Discord when yield is distributed
- 🛡️ **Robust Error Handling**: Comprehensive error handling and logging
- ⚙️ **Configurable**: Easy configuration via environment variables
- 🧪 **Testing Tools**: Built-in testing utilities to verify setup
- 📊 **Event Analysis**: Analyzes transaction logs to identify yield distribution events

## Architecture

The bot consists of several components:

1. **Discord Bot** (`discord_bot.py`): Handles Discord connectivity and message posting
2. **Blockchain Monitor** (`blockchain_monitor.py`): Monitors blockchain for yield distribution events
3. **Configuration** (`config.py`): Manages environment variables and settings
4. **Main Service** (`main.py`): Orchestrates the bot and monitor
5. **Utilities** (`utils.py`): Testing and validation tools

## Setup

### Prerequisites

- Python 3.8 or higher
- Discord bot token
- RPC endpoint (Infura, Alchemy, or your own node)
- Contract addresses for RewardsManager and slvlUSD

### Installation

1. **Clone the repository** (or create the files):
   ```bash
   git clone <your-repo> # or create the directory manually
   cd YieldBot
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Create environment file**:
   ```bash
   cp config.example.env .env
   ```

4. **Configure environment variables** in `.env`:
   ```env
   # Discord Bot Configuration
   DISCORD_BOT_TOKEN=your_discord_bot_token_here
   DISCORD_CHANNEL_ID=your_channel_id_here

   # Blockchain Configuration
   RPC_URL=https://your-rpc-endpoint.com
   REWARDS_MANAGER_ADDRESS=0xBD05B8B22fE4ccf093a6206C63Cc39f02345E0DA
   SLVLUSD_ADDRESS=0x...

   # Network Configuration
   CHAIN_ID=1  # 1 for Ethereum mainnet

   # Monitoring Configuration
   BLOCK_CONFIRMATIONS=3
   POLL_INTERVAL=30  # seconds
   ```

### Discord Bot Setup

1. **Create a Discord Application**:
   - Go to https://discord.com/developers/applications
   - Click "New Application"
   - Give it a name (e.g., "YieldBot")

2. **Create a Bot**:
   - Go to the "Bot" section
   - Click "Add Bot"
   - Copy the bot token and add it to your `.env` file

3. **Set Bot Permissions**:
   - In the "Bot" section, enable these permissions:
     - Send Messages
     - Embed Links
     - Read Message History
   - Generate an invite link in the "OAuth2" > "URL Generator" section

4. **Invite Bot to Server**:
   - Use the generated invite link
   - Select your Discord server
   - Authorize the bot

5. **Get Channel ID**:
   - Enable Developer Mode in Discord (User Settings > Advanced > Developer Mode)
   - Right-click on the target channel
   - Click "Copy ID"
   - Add this ID to your `.env` file

### Contract Addresses

The bot is pre-configured to monitor:
- **RewardsManager**: `0xBD05B8B22fE4ccf093a6206C63Cc39f02345E0DA` (handles reward distributions)
- **slvlUSD**: Set this to your slvlUSD contract address

The bot specifically monitors for:
- **Method ID**: `0x6a761202` (yield distribution function calls)
- **Event**: `Rewarded(address asset, address to, uint256 amount)` events

## Usage

### Running the Bot

1. **Test your configuration** (recommended):
   ```bash
   python utils.py
   ```
   This will run comprehensive tests to ensure everything is configured correctly.

2. **Start the bot**:
   ```bash
   python main.py
   ```

The bot will:
- Connect to Discord
- Start monitoring the blockchain
- Send notifications when yield distributions are detected

### Bot Commands

In Discord, you can use these commands:

- `!status` - Check bot status
- `!test` - Send a test notification

### Monitoring

The bot will:
- Check for new blocks every 30 seconds (configurable)
- Wait for 3 block confirmations before processing (configurable)
- Monitor transactions to RewardsManager contract (0xBD05B8B22fE4ccf093a6206C63Cc39f02345E0DA)
- Detect method calls with ID 0x6a761202
- Parse Rewarded events and extract yield amounts
- Send Discord notifications with proper token formatting (USDC, ETH, etc.)

## Configuration Options

| Variable | Description | Default |
|----------|-------------|---------|
| `DISCORD_BOT_TOKEN` | Discord bot token | Required |
| `DISCORD_CHANNEL_ID` | Target Discord channel ID | Required |
| `RPC_URL` | Blockchain RPC endpoint | Required |
| `REWARDS_MANAGER_ADDRESS` | RewardsManager contract address | Required |
| `SLVLUSD_ADDRESS` | slvlUSD contract address | Required |
| `CHAIN_ID` | Blockchain network ID | 1 |
| `BLOCK_CONFIRMATIONS` | Blocks to wait for confirmation | 3 |
| `POLL_INTERVAL` | Seconds between blockchain polls | 30 |

## Notification Format

When a yield distribution is detected, the bot sends a rich embedded message containing:

- 💰 **Amount**: The amount of tokens distributed
- 📦 **Block Number**: The block where the transaction occurred
- 🔗 **Transaction Hash**: Link to view the transaction on Etherscan
- ℹ️ **Details**: Description of the yield distribution process

## Troubleshooting

### Common Issues

1. **Bot not connecting to Discord**:
   - Verify your bot token is correct
   - Ensure the bot has proper permissions
   - Check that the channel ID is correct

2. **Not detecting yield distributions**:
   - Verify contract addresses are correct
   - Check RPC endpoint connectivity
   - Ensure the contracts are on the correct network

3. **Missing notifications**:
   - Check logs for errors
   - Verify the bot has permission to send messages
   - Ensure the target channel exists

### Logs

The bot logs to both console and `yieldbot.log` file. Check logs for detailed error information.

### Testing

Use the testing utility to diagnose issues:

```bash
python utils.py
```

This will test:
- Environment configuration
- Contract address validation
- Blockchain connectivity
- Discord connectivity
- Notification sending

## Development

### Project Structure

```
YieldBot/
├── main.py                 # Main application entry point
├── discord_bot.py          # Discord bot functionality
├── blockchain_monitor.py   # Blockchain monitoring
├── config.py              # Configuration management
├── utils.py               # Testing and utilities
├── requirements.txt       # Python dependencies
├── config.example.env     # Example environment file
└── README.md             # This file
```

### Adding Features

To extend the bot:

1. **New Event Types**: Add event signatures to `blockchain_monitor.py`
2. **Message Formatting**: Modify `discord_bot.py` notification methods
3. **Additional Commands**: Add commands to the `YieldBot` class
4. **Configuration**: Add new settings to `config.py`

### Event Detection

The bot detects yield distributions by:

1. Monitoring transactions to target contracts
2. Analyzing transaction logs for relevant events
3. Decoding transfer amounts and event data
4. Filtering for yield-related activities

## Security Considerations

- Keep your Discord bot token secure
- Use read-only RPC endpoints
- The bot only reads blockchain data, never writes
- Consider rate limiting for high-traffic networks

## Support

For issues or questions:

1. Check the logs for error details
2. Run the test utility to diagnose problems
3. Verify all configuration is correct
4. Ensure contract addresses are up to date

## License

This project is open source and available under the MIT License.
