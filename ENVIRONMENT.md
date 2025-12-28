# Environment Variables Configuration

This document describes all the environment variables needed to run the LOCKED application.

Create a `.env` file in the root directory with the following variables:

## Server Configuration

```bash
PORT=5000
NODE_ENV=development
```

## Solana Configuration

```bash
# Solana RPC URLs (comma-separated for failover)
# Use your own RPC provider for production (QuickNode, Alchemy, Helius, etc.)
SOLANA_RPC_URLS=https://api.mainnet-beta.solana.com

# Optional: WebSocket URL for real-time updates
SOLANA_WS_URL=wss://api.mainnet-beta.solana.com
```

## LOCKED Token Configuration

```bash
# The SPL Token mint address for LOCKED token
LOCKED_TOKEN_MINT=YOUR_LOCKED_TOKEN_MINT_ADDRESS_HERE

# Token decimals (default is 9 for most SPL tokens)
LOCKED_TOKEN_DECIMALS=9

# Token symbol for display
SPL_TOKEN_SYMBOL=LOCKED
```

## House Wallet Configuration

```bash
# House wallet secret key (Base58 encoded)
# This wallet receives deposits and sends payouts
# ⚠️ CRITICAL: Keep this secret and never commit to git!
HOUSE_WALLET_SECRET=YOUR_HOUSE_WALLET_SECRET_KEY_BASE58

# House wallet public address (for reference, derived from secret)
HOUSE_WALLET_ADDRESS=YOUR_HOUSE_WALLET_PUBLIC_ADDRESS
```

## Dice Game Configuration

```bash
# Enable/disable the dice game
DICE_ENABLED=true

# Minimum and maximum bet amounts
MIN_BET_AMOUNT=1
MAX_BET_AMOUNT=10000

# Maximum profit per bet (to limit house exposure)
MAX_PROFIT=5000

# House edge percentage (1.5 = 1.5% house edge)
HOUSE_EDGE=1.5

# Minimum withdrawal amount
MIN_WITHDRAWAL=1
```

## Admin Configuration

```bash
# Admin wallet address (for admin panel access)
ADMIN_WALLET_ADDRESS=YOUR_ADMIN_WALLET_PUBLIC_ADDRESS

# Fee wallet for collecting platform fees (if different from house)
FEE_WALLET_ADDRESS=YOUR_FEE_WALLET_PUBLIC_ADDRESS
```

## Frontend Configuration (Vite)

```bash
# Solana RPC URL for frontend
VITE_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Admin wallet address for frontend
VITE_ADMIN_WALLET_ADDRESS=YOUR_ADMIN_WALLET_PUBLIC_ADDRESS
```

## Security Notes

1. **Never commit your `.env` file to git** - Add it to `.gitignore`
2. **Use a dedicated house wallet** - Don't use your personal wallet
3. **Back up your house wallet private key** - Store it securely offline
4. **Use a private RPC provider** for production - Public endpoints have rate limits
5. **Monitor your house wallet balance** - Ensure it has enough funds for payouts

## Setting Up the House Wallet

1. Generate a new Solana keypair:
   ```bash
   solana-keygen new --outfile house-wallet.json
   ```

2. Get the public address:
   ```bash
   solana-keygen pubkey house-wallet.json
   ```

3. Export to Base58 format for the environment variable:
   ```bash
   # The file contains the secret key as a JSON array
   # You'll need to convert it to Base58 format
   ```

4. Fund the wallet with SOL (for transaction fees) and LOCKED tokens (for payouts)

