# LOCKED ROOM - Environment Configuration

Copy the configuration below to a `.env` file in the project root and fill in your values.

**Never commit your actual `.env` file to version control!**

```bash
# ===========================================
# LOCKED ROOM - Environment Configuration
# ===========================================

# ===========================================
# Server Configuration
# ===========================================
PORT=5000
NODE_ENV=development

# ===========================================
# Solana Network Configuration
# ===========================================
# Comma-separated list of RPC endpoints for failover support
# The system will automatically switch between endpoints if one fails
# For production, use paid RPC providers like Helius, QuickNode, or Alchemy
SOLANA_RPC_URLS=https://api.mainnet-beta.solana.com,https://solana-api.projectserum.com

# Optional: WebSocket URL for real-time updates
SOLANA_WS_URL=wss://api.mainnet-beta.solana.com

# ===========================================
# House Wallet Configuration (CRITICAL)
# ===========================================
# The house wallet holds funds for payouts and receives deposits
# This is the wallet that manages the game's treasury
# Format: Base58 encoded secret key OR JSON array of bytes
# SECURITY WARNING: Keep this secret! Never share or commit!
HOUSE_WALLET_SECRET=your_base58_encoded_secret_key_here

# ===========================================
# LOCKED Token Configuration
# ===========================================
# The SPL token mint address for your token
# This controls which token the platform uses for all operations
# Change this to use any SPL token (your own or any existing)
LOCKED_TOKEN_MINT=your_locked_token_mint_address_here

# Token decimals (standard is 9 for SPL tokens)
TOKEN_DECIMALS=9

# Token symbol for display (shown in UI, API responses, etc.)
# Set to your token's ticker symbol - automatically reflects everywhere
LOCKED_TOKEN_SYMBOL=LOCKED

# Token name for display (optional)
LOCKED_TOKEN_NAME=LOCKED Token

# ===========================================
# Dice Game Configuration
# ===========================================
# Enable/disable the dice game
DICE_ENABLED=true

# House edge percentage (e.g., 1.5 = 1.5% house edge)
HOUSE_EDGE=1.5

# Minimum bet amount in LOCKED tokens
MIN_BET_AMOUNT=1

# Maximum bet amount in LOCKED tokens
MAX_BET_AMOUNT=10000

# Maximum profit per bet in LOCKED tokens
MAX_PROFIT=5000

# ===========================================
# Fee Configuration
# ===========================================
# Wallet address to receive platform fees (optional)
FEE_WALLET_ADDRESS=

# ===========================================
# Admin Configuration
# ===========================================
# Admin wallet addresses (comma-separated for multiple admins)
ADMIN_WALLET_ADDRESSES=

# Admin email for notifications (optional)
ADMIN_EMAIL=

# ===========================================
# Security Configuration
# ===========================================
# Rate limiting window in milliseconds
RATE_LIMIT_WINDOW_MS=60000

# Maximum requests per window
RATE_LIMIT_MAX_REQUESTS=100

# ===========================================
# Logging Configuration
# ===========================================
# Log level: debug, info, warn, error
LOG_LEVEL=info

# ===========================================
# Vesting Configuration
# ===========================================
# Duration is specified in SECONDS for maximum flexibility
# Examples:
#   - 60 = 1 minute
#   - 3600 = 1 hour  
#   - 86400 = 1 day
#   - 604800 = 1 week
#   - 2592000 = 30 days
#   - 31536000 = 1 year

# Minimum vesting duration in seconds (default: 1 second)
MIN_VESTING_SECONDS=1

# Maximum vesting duration in seconds (default: ~10 years)
MAX_VESTING_SECONDS=315360000

# ===========================================
# Development Only
# ===========================================
# Set to true to enable debug endpoints
DEBUG_MODE=false
```

## Required Environment Variables

The following variables are **required** for the application to function:

| Variable | Description |
|----------|-------------|
| `SOLANA_RPC_URLS` | At least one Solana RPC endpoint |
| `HOUSE_WALLET_SECRET` | Base58 encoded secret key for the house wallet |
| `LOCKED_TOKEN_MINT` | SPL token mint address for LOCKED tokens |

## Security Notes

1. **Never commit your `.env` file** - It contains sensitive credentials
2. **Use strong RPC providers in production** - Free public endpoints have rate limits
3. **Secure your house wallet secret** - This wallet controls all payouts
4. **Rotate secrets regularly** - Update credentials periodically for security

