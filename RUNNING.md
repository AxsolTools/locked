# Running the XRP Locker Application

This document provides instructions on how to run the XRP Locker application for both development and production environments.

## Development Setup

### Prerequisites
- Node.js (v16 or later)
- npm (v7 or later)

### Installation
1. Clone the repository:
   ```
   git clone [repository-url]
   cd XrpLockerManager
   ```

2. Install dependencies:
   ```
   npm install
   ```

### Running in Development Mode

The application has two main components:
1. API Server (Express) - Runs on port 5000
2. Frontend (Vite) - Runs on port 5173

#### Option 1: Run both simultaneously (recommended)
```
npm run dev
```
This will start both the API server and the frontend Vite server concurrently.

#### Option 2: Run each component separately
To run just the API server:
```
npm run dev:api
```

To run just the frontend:
```
npm run dev:frontend
```

### Accessing the Application
- API Server: http://localhost:5000
- Frontend: http://localhost:5173

## Troubleshooting

### Wallet Connection Issues
If you're experiencing issues with wallet connection:

1. Make sure both servers are running (API on port 5000 and frontend on port 5173)
2. Check the browser console for any error messages
3. The API server logs all wallet connection attempts - check the terminal where the API is running

### 404 Errors on API Endpoints
If you're seeing 404 errors when trying to access API endpoints:

1. Make sure the API server is running on port 5000
2. Confirm you're using the correct endpoint URL format (should be `/api/...`)
3. Check the server logs for any error messages

### Clearing Local Storage
If you need to reset the application state:

1. Open your browser developer tools
2. Go to Application > Storage > Local Storage
3. Find and delete the `xrp-locker-wallet-data` entry
4. Refresh the page

## Production Deployment

To build the application for production:

```
npm run build
```

To start the production server:
```
npm start
```

In production mode, the Express server serves both the API endpoints and the static frontend files from the `public` directory. 