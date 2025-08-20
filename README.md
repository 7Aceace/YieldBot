# 🤖 YieldBot - Discord Yield Distribution Monitor

A Discord bot that monitors the RewardsManager contract for yield distributions and sends real-time notifications to your Discord server.

## 🎯 **What It Does**

YieldBot monitors the Ethereum blockchain for yield distribution events on the RewardsManager contract:

- **Contract**: `0xBD05B8B22fE4ccf093a6206C63Cc39f02345E0DA`
- **Method**: `0x6a761202` (reward function calls)
- **Event**: `Rewarded(address asset, address to, uint256 amount)`

When the protocol treasury multisig calls `reward` on the RewardsManager to distribute yield, YieldBot instantly detects it and sends a beautiful Discord notification with the yield amount.

## ✨ **Features**

- 🔍 **Real-time Monitoring**: Continuous blockchain monitoring with 30-second polling
- 💬 **Rich Discord Notifications**: Beautiful embeds with yield amounts, transaction links, and details
- 🎯 **Accurate Detection**: Specifically monitors method ID `0x6a761202` and `Rewarded` events
- 💰 **Smart Amount Formatting**: Automatically formats USDC (6 decimals) vs ETH (18 decimals)
- 🧪 **Block Testing**: Test specific blocks to verify event detection
- 🛡️ **Robust Error Handling**: Comprehensive logging and error recovery
- ⚡ **Modern Stack**: Built with Viem for optimal performance

## 🏗️ **Repository Structure**

```
YieldBot/
├── 📁 src/                          # Main application code
│   ├── 🔧 index.js                  # Application entry point
│   ├── ⛓️ blockchain-monitor.js      # Blockchain monitoring with Viem
│   ├── 🤖 discord-bot.js            # Discord integration
│   ├── ⚙️ config.js                 # Configuration management
│   ├── 🧪 test.js                   # Comprehensive test suite
│   └── 🔍 test-block.js             # Block-specific testing tool
├── 🐍 Python Implementation/        # Alternative Python version
│   ├── 📄 main.py                   # Python main application
│   ├── ⛓️ blockchain_monitor.py     # Python blockchain monitoring
│   ├── 🤖 discord_bot.py            # Python Discord bot
│   └── ⚙️ config.py                 # Python configuration
├── 🚀 Deployment Files/
│   ├── 🐳 Dockerfile                # Docker configuration
│   ├── 📦 docker-compose.yml        # Docker Compose setup
│   ├── 🚂 Procfile                  # Railway/Heroku deployment
│   ├── ⚙️ railway.json              # Railway configuration
│   └── 🐍 runtime.txt               # Python version specification
├── 📋 Configuration/
│   ├── 📝 .env.example              # Environment variables template
│   ├── 📄 config.example.env        # Python config template
│   ├── 📦 package.json              # Node.js dependencies
│   ├── 🐍 requirements.txt          # Python dependencies
│   └── 🚫 .gitignore                # Git ignore rules
└── 📚 Documentation/
    └── 📖 README.md                 # This file
```

## 🚀 **Quick Start Guide**

### **Prerequisites**
- Node.js 18+ (for Viem version) OR Python 3.8+ (for Python version)
- Discord bot token
- Ethereum RPC endpoint (Infura, Alchemy, etc.)

### **Option 1: Viem Version (Recommended)**

#### **1. Install Dependencies**
   ```bash
npm install
   ```

#### **2. Configure Environment**
   ```bash
cp .env.example .env
   ```

Edit `.env` with your values:
   ```env
   # Discord Bot Configuration
   DISCORD_BOT_TOKEN=your_discord_bot_token_here
   DISCORD_CHANNEL_ID=your_channel_id_here

   # Blockchain Configuration
   RPC_URL=https://your-rpc-endpoint.com
REWARDS_MANAGER_ADDRESS=0xBD05B8B22fE4ccf093a6206C63Cc39f02345E0DA
SLVLUSD_ADDRESS=your_slvlusd_address_here

   # Network Configuration
CHAIN_ID=1
   BLOCK_CONFIRMATIONS=3
POLL_INTERVAL=30
```

#### **3. Test Your Setup**
```bash
# Run comprehensive tests
npm test

# Test specific block (example from Etherscan)
npm run test-block 23174914
```

#### **4. Start the Bot**
```bash
npm start
```

### **Option 2: Python Version**

#### **1. Install Dependencies**
```bash
pip install -r requirements.txt
```

#### **2. Configure Environment**
   ```bash
cp config.example.env .env
# Edit .env with your values (same format as above)
   ```

#### **3. Start the Bot**
   ```bash
   python main.py
   ```

## 🔧 **Discord Bot Setup**

### **1. Create Discord Application**
1. Go to https://discord.com/developers/applications
2. Click "New Application"
3. Name it "YieldBot"

### **2. Create Bot**
1. Go to "Bot" section
2. Click "Add Bot"
3. Copy the bot token → add to `.env`

### **3. Set Permissions**
Required bot permissions:
- ✅ Send Messages
- ✅ Embed Links
- ✅ Read Message History

### **4. Invite Bot to Server**
1. Go to "OAuth2" → "URL Generator"
2. Select "bot" scope
3. Select required permissions
4. Use generated invite link

### **5. Get Channel ID**
1. Enable Developer Mode in Discord (User Settings → Advanced)
2. Right-click target channel → "Copy ID"
3. Add to `.env`

## 🧪 **Testing & Verification**

### **Test Known Event**
Test with the actual yield distribution from your screenshot:
```bash
npm run test-block 23174914
```

**Expected Output:**
```
🎯 Found yield distribution transaction: 0x855d6b3b6a...
✅ Found Rewarded event with amount: 31,338.00 USDC
🏆 DETECTED YIELD DISTRIBUTIONS:
1. Transaction: 0x855d6b3b6a...
   💰 Amount: 31,338.00 USDC
   🏛️ RewardsManager: ✅
   📝 Events (1):
      1. Rewarded: 31,338.00 USDC
         Asset: 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48
         Recipient: 0xdf95bb71581b224bd42eb19ceaff5e92816e181e
```

### **Comprehensive Testing**
```bash
npm test
```

Tests:
- ✅ Configuration validation
- ✅ Blockchain connectivity
- ✅ Discord connectivity
- ✅ Event signature calculation
- ✅ Block processing

## 📱 **Discord Notification Format**

When yield is distributed, you'll receive:

```
🏆 Rewarded Event Detected!
Protocol yield distribution via Rewarded event

💰 Amount: 31,338.00 USDC
📦 Block Number: 23,174,914
🔗 Transaction Hash: [View on Explorer](https://etherscan.io/tx/0x...)

ℹ️ Details: 🏛️ RewardsManager method 0x6a761202 executed • 💰 Asset: 0xa0b... • 👤 Recipient: 0xdf9...

YieldBot • Monitoring Protocol Yield Distributions
```

## 🎮 **Bot Commands**

In Discord:
- `!status` - Check bot status and connection
- `!test` - Send a test notification

## 📊 **Monitoring Logic**

### **Detection Process:**
1. **Poll Blockchain**: Every 30 seconds (configurable)
2. **Check Transactions**: Look for calls to `0xBD05B8B22fE4ccf093a6206C63Cc39f02345E0DA`
3. **Verify Method**: Confirm method ID is `0x6a761202`
4. **Parse Events**: Extract `Rewarded` events from transaction logs
5. **Format Amount**: Convert amounts based on token (USDC: 6 decimals, ETH: 18 decimals)
6. **Send Notification**: Post rich embed to Discord

### **What Gets Detected:**
- ✅ Treasury multisig calls `reward` on RewardsManager (`0x6a761202`)
- ✅ `Rewarded(address asset, address to, uint256 amount)` events
- ✅ Yield distribution amounts (properly formatted)
- ✅ Asset and recipient addresses

## 🚀 **Deployment Options**

### **Local Machine**
```bash
npm start  # Keep terminal open
```

### **VPS/Cloud Server**
```bash
# Use screen/tmux for persistent sessions
screen -S yieldbot
npm start
# Ctrl+A, D to detach
```

### **Railway (Free)**
1. Connect GitHub repo to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically using existing `Procfile`

### **Docker**
```bash
docker-compose up -d
```

### **Heroku**
Uses existing `Procfile` configuration

## 🔧 **Configuration Options**

| Variable | Description | Default |
|----------|-------------|---------|
| `DISCORD_BOT_TOKEN` | Discord bot token | Required |
| `DISCORD_CHANNEL_ID` | Target Discord channel ID | Required |
| `RPC_URL` | Ethereum RPC endpoint | Required |
| `REWARDS_MANAGER_ADDRESS` | RewardsManager contract | `0xBD05B...` |
| `SLVLUSD_ADDRESS` | slvlUSD contract address | Optional |
| `CHAIN_ID` | Blockchain network ID | `1` |
| `BLOCK_CONFIRMATIONS` | Blocks to wait for confirmation | `3` |
| `POLL_INTERVAL` | Seconds between blockchain polls | `30` |

## 🐛 **Troubleshooting**

### **Bot Not Starting**
- ✅ Check `.env` file exists and has correct values
- ✅ Verify Discord bot token is valid
- ✅ Ensure RPC URL is accessible

### **No Notifications**
- ✅ Verify Discord channel ID is correct
- ✅ Check bot has permissions in target channel
- ✅ Test with `npm run test-block 23174914`

### **Connection Issues**
- ✅ Check RPC endpoint rate limits
- ✅ Verify network connectivity
- ✅ Run `npm test` for diagnostics

## 📝 **Logs**

Bot creates detailed logs in:
- **Console**: Real-time monitoring output
- **yieldbot.log**: Persistent log file (Python version)

**Success Indicators:**
```
✅ Found method 0x6a761202 call to RewardsManager
✅ Found Rewarded event with amount: 31,338.00 USDC
📤 Yield notification sent to channel
```

## 🔐 **Security**

- 🛡️ **Read-Only**: Bot only reads blockchain data, never writes
- 🔒 **Environment Variables**: Sensitive data protected by `.gitignore`
- 🌐 **RPC Only**: Uses standard Ethereum RPC endpoints
- 👤 **Discord Permissions**: Minimal required permissions only

## 📄 **License**

MIT License - Open source and free to use.

---

## 🎯 **Summary**

YieldBot is now ready to monitor your RewardsManager contract (`0xBD05B8B22fE4ccf093a6206C63Cc39f02345E0DA`) for yield distributions. When the treasury multisig calls the reward function (`0x6a761202`), your Discord server will be instantly notified with beautiful, detailed messages showing the yield amount and transaction details.

**Ready to deploy? Choose your preferred version (Viem or Python) and follow the Quick Start Guide above!** 🚀