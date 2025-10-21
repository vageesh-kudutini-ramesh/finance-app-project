# Finance App Frontend

This is the React frontend for the Finance App project.

## Environment Setup

### Required Environment Variables

Create a `.env` file in the frontend directory with the following variables:

```bash
# Alpha Vantage API Configuration
REACT_APP_ALPHA_VANTAGE_API_KEY=your_api_key_here
```

### Getting Alpha Vantage API Key

1. Go to [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
2. Sign up for a free account
3. Get your API key
4. Add it to the `.env` file

### Security Notes

- **Never commit API keys to version control**
- The `.env` file is already in `.gitignore`
- All React environment variables must start with `REACT_APP_`
- API keys are only used in the frontend for stock lookups

## Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## Features

- User authentication (login/register)
- Password reset via OTP
- Transaction tracking
- Budget management
- Investment portfolio with real-time stock data
- Responsive design with Tailwind CSS
