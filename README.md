# Finwise - Finance Management Application

![Finwise Logo](https://img.shields.io/badge/Finwise-Personal%20Finance-blue?style=for-the-badge&logo=react)

A comprehensive, full-stack finance management application built with modern web technologies. Finwise helps users track expenses, manage budgets, monitor investments, and gain insights into their financial health through interactive dashboards and real-time analytics.

## Live Demo

**Try Finwise now:** [https://finance-app-fawn-gamma.vercel.app/](https://finance-app-fawn-gamma.vercel.app/)

*Experience the full application with real-time data, interactive dashboards, and all features working live.*

## Features

### Financial Management
- **Expense Tracking**: Add, categorize, and monitor daily expenses
- **Income Management**: Track income sources and patterns
- **Budget Planning**: Set and monitor budget goals with real-time alerts
- **Investment Portfolio**: Track stock investments with live market data

### Analytics & Insights
- **Dynamic Dashboards**: Real-time financial overview with interactive charts
- **Income vs Expense Trends**: Visualize spending patterns over time
- **Category-wise Analysis**: Understand spending habits by category
- **Investment Performance**: Monitor portfolio gains/losses and performance

### Security & Authentication
- **Secure Authentication**: Username/email login with password reset
- **Data Privacy**: Row Level Security (RLS) ensuring user data isolation
- **Password Management**: Secure password handling with visibility toggles
- **OTP Verification**: Email-based one-time password for account recovery

## Tech Stack

### Frontend
- **React.js** - Modern UI framework
- **JavaScript ES6+** - Core programming language
- **Recharts.js** - Interactive data visualization
- **Tailwind CSS** - Responsive styling
- **Lucide React** - Modern icon library

### Backend
- **Supabase** - Backend-as-a-Service platform
- **PostgreSQL** - Relational database
- **Edge Functions** - Serverless backend logic
- **Row Level Security** - Database security policies

### APIs & Integrations
- **Finnhub API** - Real-time stock market data (50,000+ stocks)
- **Brevo API** - Email service for OTP delivery
- **Supabase Auth** - User authentication and management

### DevOps & Deployment
- **Vercel** - Frontend hosting and CI/CD
- **GitHub** - Version control and collaboration
- **Environment Variables** - Secure configuration management

## Project Structure

```
finance-app-project/
├── frontend/                 # React.js frontend application
│   ├── src/
│   │   ├── App.js           # Main application component
│   │   └── config/          # API configuration
│   ├── package.json         # Frontend dependencies
│   └── .env                 # Environment variables
├── supabase/
│   └── functions/          # Edge Functions for backend logic
│       ├── signin/         # User authentication
│       ├── signup/         # User registration
│       ├── password-reset/ # Password recovery
│       ├── transactions-* # Expense/income management
│       ├── budgets-*      # Budget operations
│       └── investments-*  # Investment portfolio
├── vercel.json             # Vercel deployment configuration
└── README.md              # Project documentation
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn package manager
- Supabase account
- Finnhub API key (free tier available)
- Brevo API key (free tier available)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/finance-app-project.git
   cd finance-app-project
   ```

2. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Configure environment variables**
   ```bash
   # Create .env file in frontend directory
   cp .env.example .env
   ```
   
   Add your API keys to `.env`:
   ```env
   REACT_APP_FINNHUB_API_KEY=your_finnhub_api_key_here
   REACT_APP_SUPABASE_URL=your_supabase_project_url_here
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

4. **Set up Supabase backend**
   - Create a new Supabase project
   - Run the database migrations
   - Deploy Edge Functions
   - Configure Row Level Security policies

5. **Start the development server**
   ```bash
   npm start
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## 🔧 Configuration

### Environment Variables

#### Frontend (.env)
```env
REACT_APP_FINNHUB_API_KEY=your_finnhub_api_key
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Supabase Edge Functions
```env
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
BREVO_API_KEY=your_brevo_api_key_here
```

### API Keys Setup

1. **Finnhub API**: Get free API key from [Finnhub.io](https://finnhub.io)
2. **Brevo API**: Get free API key from [Brevo.com](https://brevo.com)
3. **Supabase**: Create project at [Supabase.com](https://supabase.com)

## Database Schema

### Core Tables
- **users**: User profiles and authentication data
- **transactions**: Income and expense records
- **budgets**: Budget planning and tracking
- **investments**: Investment portfolio data

### Security
- **Row Level Security (RLS)**: Ensures data isolation between users
- **Service Role Key**: Used by Edge Functions for admin operations
- **JWT Tokens**: Secure user authentication

## Deployment

### Vercel Deployment
1. **Connect GitHub repository** to Vercel
2. **Configure environment variables** in Vercel dashboard
3. **Deploy automatically** on every push to main branch

### Manual Deployment
```bash
# Build the application
cd frontend
npm run build

# Deploy to Vercel
npx vercel --prod
```

## Testing

### Manual Testing Checklist
- [ ] User registration and login
- [ ] Password reset functionality
- [ ] Expense tracking (add, edit, delete)
- [ ] Budget management
- [ ] Investment portfolio tracking
- [ ] Dashboard analytics
- [ ] Responsive design on mobile/desktop

## Performance Features

- **Real-time Data**: Live stock prices and financial calculations
- **Optimized Queries**: Efficient database operations with RLS
- **Debounced Search**: Smooth stock symbol search experience
- **Responsive Design**: Works seamlessly across all devices
- **Fast Loading**: Optimized bundle size and lazy loading

## Security Features

- **Data Encryption**: All sensitive data encrypted in transit and at rest
- **User Isolation**: RLS policies prevent cross-user data access
- **Secure Authentication**: JWT-based token authentication
- **API Key Protection**: Environment variables for sensitive keys
- **Input Validation**: Server-side validation for all user inputs

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**Vageesh Kudutini Ramesh**
- GitHub: [@vageesh-kudutini-ramesh](https://github.com/vageesh-kudutini-ramesh)
- LinkedIn: [Vageesh Kudutini Ramesh](https://linkedin.com/in/vageesh-kudutini-ramesh)

## Acknowledgments

- **Supabase** for providing an excellent backend platform
- **Finnhub** for comprehensive stock market data
- **Brevo** for reliable email services
- **Vercel** for seamless deployment and hosting
- **React.js** community for excellent documentation and support

## Support

If you have any questions or need help with the application, please:
1. Check the [Issues](https://github.com/your-username/finance-app-project/issues) page
2. Create a new issue with detailed description
3. Contact the author directly

---

**Built with ❤️ for better financial management**
