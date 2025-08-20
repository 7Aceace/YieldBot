# 🚀 YieldBot Run Guide

## 📋 **Current Repository Structure**

Your YieldBot repository is now clean and organized:

```
YieldBot/
├── 📁 src/                          # Viem Implementation (RECOMMENDED)
│   ├── index.js                     # 🔧 Main application entry
│   ├── blockchain-monitor.js        # ⛓️ Blockchain monitoring with Viem
│   ├── discord-bot.js               # 🤖 Discord integration
│   ├── config.js                    # ⚙️ Configuration management
│   ├── test.js                      # 🧪 Full test suite
│   └── test-block.js                # 🔍 Block-specific testing
├── 📁 Python Implementation/        # Python Alternative
│   ├── main.py                      # 🐍 Python main application
│   ├── blockchain_monitor.py        # ⛓️ Python blockchain monitoring
│   ├── discord_bot.py               # 🤖 Python Discord bot
│   ├── config.py                    # ⚙️ Python configuration
│   ├── requirements.txt             # 📦 Python dependencies
│   └── config.example.env           # 📄 Python config template
├── 📁 Deployment/                   # Ready for production
│   ├── Dockerfile                   # 🐳 Docker configuration
│   ├── docker-compose.yml           # 🐙 Docker Compose
│   ├── Procfile                     # 🚂 Railway/Heroku
│   ├── railway.json                 # 🚅 Railway config
│   └── runtime.txt                  # 🐍 Python version
├── package.json                     # 📦 Node.js dependencies
├── .env.example                     # 🔐 Environment template
├── .gitignore                       # 🚫 Git ignore rules
└── README.md                        # 📖 Complete documentation
```

## 🎯 **What Your Bot Does**

**YieldBot monitors the RewardsManager contract and Discord notifies when:**

1. **Treasury multisig** calls `reward` on `0xBD05B8B22fE4ccf093a6206C63Cc39f02345E0DA`
2. **Method ID** `0x6a761202` is detected
3. **Rewarded events** are emitted with yield amounts
4. **slvlUSD distribution** occurs

**Perfect alignment with your requirements!** ✅

## 🚀 **How to Run (Choose Your Version)**

### **Option A: Viem Version (RECOMMENDED)**

#### **1. Setup**
```bash
# Install Node.js dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Discord token, RPC URL, etc.
```

#### **2. Test with Your Known Event**
```bash
# Test the actual event from your screenshot
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
```

#### **3. Run Full Tests**
```bash
npm test
```

#### **4. Start the Bot**
```bash
npm start
```

### **Option B: Python Version**

#### **1. Setup**
```bash
cd "Python Implementation"
pip install -r requirements.txt
cp config.example.env .env
# Edit .env with your values
```

#### **2. Start the Bot**
```bash
python main.py
```

## 📱 **Expected Discord Notifications**

When yield is distributed, you'll see:

```
🏆 Rewarded Event Detected!
Protocol yield distribution via Rewarded event

💰 Amount: 31,338.00 USDC
📦 Block Number: 23,174,914
🔗 Transaction Hash: [View on Explorer](https://etherscan.io/tx/0x...)

ℹ️ Details: 🏛️ RewardsManager method 0x6a761202 executed • 💰 Asset: 0xa0b... • 👤 Recipient: 0xdf9...

YieldBot • Monitoring Protocol Yield Distributions
```

## 🔧 **Required Configuration**

Edit your `.env` file:

```env
# Discord Bot Configuration
DISCORD_BOT_TOKEN=your_actual_discord_bot_token
DISCORD_CHANNEL_ID=your_actual_channel_id

# Blockchain Configuration
RPC_URL=https://your-rpc-endpoint.com
REWARDS_MANAGER_ADDRESS=0xBD05B8B22fE4ccf093a6206C63Cc39f02345E0DA
SLVLUSD_ADDRESS=your_slvlusd_address

# Network Settings
CHAIN_ID=1
BLOCK_CONFIRMATIONS=3
POLL_INTERVAL=30
```

## ✅ **Verification Checklist**

### **Before Running:**
- [ ] Discord bot created and token obtained
- [ ] Bot invited to your Discord server
- [ ] Channel ID copied and configured
- [ ] RPC endpoint set up (Infura/Alchemy)
- [ ] Environment variables configured

### **Testing:**
- [ ] `npm test` passes all tests
- [ ] `npm run test-block 23174914` detects the known event
- [ ] Discord bot responds to `!status`

### **Live Monitoring:**
- [ ] Bot connects to Discord successfully
- [ ] Blockchain connection established
- [ ] Monitoring starts from latest block
- [ ] Ready for next yield distribution!

## 🧪 **Test Commands**

```bash
# Test everything
npm test

# Test specific block (your screenshot event)
npm run test-block 23174914

# Test Discord bot
# In Discord: !status
# In Discord: !test
```

## 🐛 **Troubleshooting**

### **Bot Won't Start**
```bash
# Check configuration
npm test

# Verify environment
cat .env  # or type .env on Windows
```

### **No Notifications**
- ✅ Verify Discord channel ID is correct
- ✅ Check bot permissions in Discord
- ✅ Test with known block: `npm run test-block 23174914`

### **Connection Issues**
- ✅ Verify RPC URL is accessible
- ✅ Check network connectivity
- ✅ Ensure sufficient RPC rate limits

## 🌐 **Deployment Options**

### **Local Machine**
```bash
npm start  # Keep terminal open
```

### **VPS/Cloud Server**
```bash
screen -S yieldbot
npm start
# Ctrl+A, D to detach
```

### **Railway (Free)**
1. Push to GitHub
2. Connect repo to Railway
3. Set environment variables
4. Deploy automatically

### **Docker**
```bash
docker-compose up -d
```

## 📊 **Monitoring Status**

### **Success Indicators:**
```
✅ Configuration validated successfully
✅ Discord bot created
✅ Blockchain monitor created
🚀 Starting blockchain monitoring from block [X]
📊 Calculated Rewarded event signature: 0x6876a213...
✅ Target channel found: #yield-event
```

### **When Yield is Detected:**
```
🎯 Found yield distribution transaction: 0x...
✅ Found Rewarded event with amount: [X] USDC
📤 Yield notification sent to channel [ID]
```

## 🎯 **Perfect for Your Use Case**

Your YieldBot is specifically configured for:

- ✅ **Contract**: `0xBD05B8B22fE4ccf093a6206C63Cc39f02345E0DA` (RewardsManager)
- ✅ **Method**: `0x6a761202` (reward function)
- ✅ **Event**: `Rewarded(address asset, address to, uint256 amount)`
- ✅ **Process**: Treasury multisig → reward call → slvlUSD distribution → Discord notification

## 🚀 **Ready to Run!**

Your repository is clean, organized, and ready for deployment. Choose your preferred version (Viem recommended) and follow the steps above.

**The bot will automatically detect and notify your Discord server whenever the protocol distributes yield!** 🎉

---

### **Quick Start Summary:**

1. **Setup**: `npm install` + configure `.env`
2. **Test**: `npm run test-block 23174914`
3. **Run**: `npm start`
4. **Deploy**: Push to GitHub → Deploy to Railway/Heroku/VPS

**Your yield monitoring solution is ready!** 🚀
