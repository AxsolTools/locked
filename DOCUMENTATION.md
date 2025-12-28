# XRP Locker Dice Game Documentation

## Overview

The XRP Locker Dice Game is a provably fair gambling game built on the XRP Ledger. Players predict whether a random number between 0 and 100 will be higher or lower than their chosen target value. The game uses cryptographic techniques to ensure verifiable fairness and transparency.

## Table of Contents

- [Game Mechanics](#game-mechanics)
- [Provable Fairness](#provable-fairness)
- [Mathematical Concepts](#mathematical-concepts)
- [API Endpoints](#api-endpoints)
- [Frontend Implementation](#frontend-implementation)
- [Development and Testing](#development-and-testing)

## Game Mechanics

### Basic Gameplay

1. The player selects a target number between 1 and 99
2. The player chooses to bet on the result being "over" or "under" the target
3. The player specifies their bet amount (within min/max limits)
4. A random number between 0 and 100 is generated
5. If the player correctly predicted whether the number would be higher or lower than their target, they win

### Win Probability

The probability of winning depends on the target number and the prediction type:
- For "under" bets: probability = target/100
- For "over" bets: probability = (100-target)/100

Examples:
- Target 25, "under" bet: 25% chance to win
- Target 75, "over" bet: 25% chance to win
- Target 50, either bet type: 50% chance to win

### Payout Calculation

Payouts are inversely proportional to the win probability, with a small house edge applied:

1. Base multiplier = 100 / win probability
2. Actual multiplier = Base multiplier × (1 - house edge/100)
3. Potential profit = Bet amount × Actual multiplier - Bet amount

Example with 1% house edge:
- 50% win chance: multiplier = (100/50) × 0.99 = 1.98×
- 25% win chance: multiplier = (100/25) × 0.99 = 3.96×
- 10% win chance: multiplier = (100/10) × 0.99 = 9.9×

## Provable Fairness

Provable fairness is a cryptographic technique that ensures the game operator cannot manipulate the outcome of the game after the player has placed their bet.

### How It Works

1. **Server Seed Generation**: The server generates a random seed and creates a hash of it (SHA-256)
2. **Seed Commitment**: The server sends only the hash of the seed to the client before the bet
3. **Client Seed**: The player provides their own random seed
4. **Combined Seed**: After the bet is placed, both seeds are combined
5. **Result Generation**: The combined seed is hashed to produce the random number
6. **Verification**: The server reveals its original unhashed seed so the player can verify the result

### Verification Process

After a roll, players can verify that the result was fair by:
1. Confirming the revealed server seed hashes to the server seed hash they received before betting
2. Combining the client seed they provided with the revealed server seed
3. Hashing the combined value using SHA-256
4. Converting the hash to a number between 0-100 using the same algorithm
5. Verifying this calculated number matches the roll result

## Mathematical Concepts

### Random Number Generation

The game converts a cryptographic hash into a number between 0 and 100 with two decimal places:

```javascript
const hexToNumber = (hash) => {
  const first8Chars = hash.slice(0, 8);
  const decimal = parseInt(first8Chars, 16);
  return decimal % 10001 / 100; // 0 to 100.00 with 2 decimal places
};
```

This provides 10,001 possible outcomes (0.00 to 100.00) with uniform distribution.

### House Edge and Expected Value

In a perfectly fair game, the expected value (EV) for the player would be zero:
EV = (win probability × win amount) - (loss probability × loss amount)

The house edge creates a slight negative expected value for the player:
- For a 50% game with 1% house edge, EV = (0.5 × 0.98 × bet) - (0.5 × bet) = -0.01 × bet

Over many plays, the house can expect to retain approximately the house edge percentage of all wagered amounts.

### Bankroll Management and Risk

The game limits maximum bet sizes and maximum profits to manage risk:
1. Max bet limits reduce the maximum amount a player can win on a single bet
2. Max profit limits ensure that even high-multiplier bets (low probability) have capped payouts

This allows the game to maintain sufficient reserves to pay out winners while remaining solvent over time.

## API Endpoints

### GET /api/dice/config

Retrieves game configuration including betting limits and house edge.

**Response:**
```json
{
  "enabled": true,
  "minBetAmount": "10",
  "maxBetAmount": "1000",
  "decimalPlaces": 2,
  "payoutEnabled": true,
  "houseEdge": 1
}
```

### POST /api/dice/bet

Records a new bet and generates cryptographic materials.

**Request:**
```json
{
  "userId": 123,
  "walletAddress": "rXYZ...",
  "betAmount": "100",
  "clientSeed": "abc123...",
  "target": 75,
  "isOver": false
}
```

**Response:**
```json
{
  "betId": "1a2b3c...",
  "serverSeedHash": "d4e5f6...",
  "winChance": 75,
  "multiplier": "1.32"
}
```

### POST /api/dice/roll

Performs the dice roll and returns the result.

**Request:**
```json
{
  "betId": "1a2b3c...",
  "walletAddress": "rXYZ..."
}
```

**Response:**
```json
{
  "result": {
    "roll": 42.68,
    "won": true,
    "profit": "32",
    "multiplier": "1.32",
    "verification": {
      "clientSeed": "abc123...",
      "serverSeed": "def456...",
      "serverSeedHash": "d4e5f6...",
      "combinedSeed": "abc123...def456...",
      "combinedHash": "7g8h9i...",
      "rollHex": "a1b2c3..."
    }
  }
}
```

### GET /api/dice/leaderboard

Retrieves the leaderboard of top players.

**Response:**
```json
{
  "leaderboard": [
    {
      "address": "rXYZ...",
      "profit": "1500",
      "winRate": "52.5",
      "totalBets": 240
    },
    // ...more entries
  ]
}
```

## Frontend Implementation

The dice game UI is implemented in React and includes these main components:

1. **DiceGame.tsx**: Main game component with betting interface and roll animation
2. **VerifyRoll.tsx**: Component for verifying roll fairness
3. **Leaderboard.tsx**: Component for displaying top players

Key UI features:
- Interactive slider for selecting target number
- Real-time calculation of win probability and potential profit
- Animated roll result display
- Detailed bet history with verification links
- Responsive design for mobile and desktop

## Development and Testing

### Local Development

To run the dice game locally:

1. Start the backend API server:
```
npm run dev:api
```

2. Start the frontend development server:
```
npm run dev:frontend
```

3. Access the game at http://localhost:5173/dice-game

### Testing Fairness

The fairness of the dice game can be tested by:

1. Making a large number of bets (1000+) and verifying the win rate matches the theoretical probability
2. Manually verifying individual roll results using the verification tool
3. Using statistical analysis to confirm the random number distribution is uniform

Tools for this are available in the `/tools/fairness-tester` directory.

### Future Enhancements

Planned improvements to the dice game:
- Integration with real XRP Ledger transactions
- Automatic payouts via smart contracts
- Additional game modes (double dice, target range)
- Player achievements and rewards system
- Social features (chat, challenges, competitions) 