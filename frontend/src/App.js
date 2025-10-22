import React, { useState, useEffect, createContext, useContext } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  CreditCard,
  Target,
  Plus,
  Wallet,
  BarChart3,
  Calendar,
  Filter,
  LogOut,
  User,
  Mail,
  KeyRound,
  ShieldCheck,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar
} from 'recharts';


// ================== API CONFIG ==================
import { getApiUrl, FINNHUB_CONFIG } from './config/api';
const API_BASE_URL_FULL = getApiUrl(''); // Remove the extra /api since getApiUrl already handles endpoints

// ================== STOCK API SERVICE ==================
class StockApiService {
  constructor() {
    this.apiKey = FINNHUB_CONFIG.apiKey;
    this.baseURL = FINNHUB_CONFIG.baseURL;
    
    // Test if API key is loaded
    console.log('🔍 Finnhub API Key:', this.apiKey ? '✅ Loaded' : '❌ Missing');
    console.log('🔍 Base URL:', this.baseURL);
    console.log('🔍 Environment Variable:', process.env.REACT_APP_FINNHUB_API_KEY);
    
    // Test API immediately
    this.testAPI();
  }

  async testAPI() {
    if (this.apiKey) {
      try {
        console.log('🔍 Testing Finnhub API...');
        console.log('🔍 API Key:', this.apiKey ? '✅ Present' : '❌ Missing');
        console.log('🔍 Base URL:', this.baseURL);
        
        // Test Finnhub search API
        const response = await fetch(
          `${this.baseURL}/search?q=AAPL&token=${this.apiKey}`
        );
        
        console.log('🔍 Test Response Status:', response.status);
        console.log('🔍 Test Response Headers:', response.headers);
        
        const data = await response.json();
        console.log('🔍 FULL Test Finnhub Data:', JSON.stringify(data, null, 2));
        console.log('🔍 Test Data keys:', Object.keys(data));
      
        if (data.result && data.result.length > 0) {
          console.log('🔍 Found', data.result.length, 'matches for AAPL');
          console.log('🔍 First match:', data.result[0]);
        } else {
          console.log('🔍 No results found in Finnhub response');
          console.log('🔍 Available fields:', Object.keys(data));
        }
      } catch (error) {
        console.log('🔍 Finnhub API Test Failed:', error);
      }
    } else {
      console.log('🔍 No Finnhub API key available for testing');
    }
  }

  async searchStocks(keywords) {
    console.log('🔍 Searching for:', keywords);
    
    try {
      if (this.apiKey) {
        console.log('🔍 Using Finnhub API key:', this.apiKey.substring(0, 8) + '...');
        
        // Finnhub symbol search API
        const response = await fetch(
          `${this.baseURL}/search?q=${encodeURIComponent(keywords)}&token=${this.apiKey}`
        );
        
        console.log('🔍 Finnhub API Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('🔍 Finnhub API Data received');
          
          if (data.result && data.result.length > 0) {
            const results = data.result.map(item => ({
              symbol: item.symbol,
              name: item.description,
              type: item.type || 'Stock',
              region: item.primaryExchange || 'US',
              marketOpen: '09:30',
              marketClose: '16:00',
              timezone: 'America/New_York',
              currency: 'USD',
              matchScore: item.score || 1.0
            }));
            console.log('🔍 Found', results.length, 'stocks for', keywords);
            return results;
          } else {
            console.log('🔍 No results found in Finnhub response');
          }
        } else {
          console.log('🔍 Finnhub API request failed with status:', response.status);
        }
      } else {
        console.log('🔍 No Finnhub API key available');
      }
    } catch (error) {
      console.log('🔍 Finnhub API Error:', error);
    }
    
    console.log('🔍 No results found');
    return [];
  }

  async getStockQuote(symbol) {
    console.log('🔍 Getting quote for:', symbol);
    
    try {
      if (this.apiKey) {
        // Finnhub quote API
        const response = await fetch(
          `${this.baseURL}/quote?symbol=${encodeURIComponent(symbol)}&token=${this.apiKey}`
        );
        
        console.log('🔍 Finnhub Quote Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('🔍 Finnhub Quote data received');
          
          if (data.c && data.c > 0) {
            // Preserve exact decimal precision
            const price = data.c.toString();
            console.log('🔍 Current Price (exact):', price);
            return price;
          } else {
            console.log('🔍 No valid price data in Finnhub response');
          }
        } else {
          console.log('🔍 Finnhub Quote request failed with status:', response.status);
        }
      } else {
        console.log('🔍 No Finnhub API key available for quote');
      }
    } catch (error) {
      console.log('🔍 Finnhub Quote Error:', error);
    }
    
    console.log('🔍 Could not get price from Finnhub API');
    return null;
  }

}

const stockApiService = new StockApiService();

// ================== API SERVICE ==================
// ================== API SERVICE ==================
class ApiService {
  constructor() {
            this.baseURL = API_BASE_URL_FULL;
  }

  getAuthHeader() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
        ...(options.headers || {}),
      },
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      if (response.status === 401 && localStorage.getItem('token')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
        throw new Error('Authentication expired. Please login again.');
      }
      
      const maybeJson = response.headers.get('content-type')?.includes('application/json');
      const payload = maybeJson ? await response.json() : {};
      const message = payload?.message || `HTTP ${response.status}`;
      throw new Error(message);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return response;
  }

  // -------- Auth --------
  async login(credentials) {
    return this.request('signin', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }
  async register(userData) {
    return this.request('signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // -------- Forgot Password --------
  async sendPasswordResetOtp(email) {
    return this.request('password-reset', {
      method: 'POST',
      body: JSON.stringify({ email, action: 'send_otp' }),
    });
  }
  async verifyPasswordResetOtp(email, otp) {
    return this.request('password-reset', {
      method: 'POST',
      body: JSON.stringify({ email, otp, action: 'verify_otp' }),
    });
  }
  async resetPassword(email, otp, newPassword, confirmNewPassword) {
    return this.request('password-reset', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword, action: 'verify_otp' }),
    });
  }

  // -------- Transactions --------
  async getTransactions() {
    return this.request('transactions-get', { method: 'GET' });
  }
  async createTransaction(tx) {
    return this.request('transactions-create', {
      method: 'POST',
      body: JSON.stringify(tx),
    });
  }
  async updateTransaction(id, tx) {
    return this.request(`transactions-update`, {
      method: 'PUT',
      body: JSON.stringify(tx),
    });
  }
  async deleteTransaction(id) {
    return this.request(`transactions-delete?id=${id}`, {
      method: 'DELETE',
    });
  }

  // -------- Budgets --------
  async getBudgets() {
    return this.request('budgets-get', { method: 'GET' });
  }
  async createBudget(b) {
    return this.request('budgets-create', {
      method: 'POST',
      body: JSON.stringify(b),
    });
  }
  async updateBudget(id, b) {
    return this.request(`budgets-update`, {
      method: 'PUT',
      body: JSON.stringify(b),
    });
  }
  async deleteBudget(id) {
    return this.request(`budgets-delete?id=${id}`, {
      method: 'DELETE',
    });
  }

  // -------- Investments --------
  async getInvestments() {
    return this.request('investments-get', { method: 'GET' });
  }

  async createInvestment(investment) {
    return this.request('investments-create', {
      method: 'POST',
      body: JSON.stringify(investment),
    });
  }

  async deleteInvestment(id) {
    return this.request(`investments-delete?id=${id}`, {
      method: 'DELETE',
    });
  }

}


const apiService = new ApiService();

// ================== AUTH CONTEXT ==================
const AuthContext = createContext();
const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) setUser(JSON.parse(userData));
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const res = await apiService.login(credentials);
    localStorage.setItem('token', res.accessToken);
    localStorage.setItem('user', JSON.stringify({ id: res.id, username: res.username, email: res.email }));
    setUser({ id: res.id, username: res.username, email: res.email });
    return res;
  };

  const register = async (payload) => apiService.register(payload);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// ================== SMALL UI HELPERS ==================
const Alert = ({ type = 'info', title, message }) => {
  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warn: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  }[type];

  const Icon = {
    success: CheckCircle,
    error: AlertCircle,
    info: AlertCircle,
    warn: AlertCircle,
  }[type];

  return (
    <div className={`border rounded-lg p-4 flex items-start space-x-3 ${styles}`}>
      <Icon className="h-5 w-5 mt-0.5" />
      <div>
        {title && <div className="font-semibold mb-0.5">{title}</div>}
        {message && <div className="text-sm">{message}</div>}
      </div>
    </div>
  );
};

const StepPill = ({ index, label, active, done }) => (
  <div className="flex items-center space-x-2">
    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold
      ${done ? 'bg-green-600 text-white' : active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
      {done ? <CheckCircle className="h-4 w-4" /> : index}
    </div>
    <span className={`text-sm ${active ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>{label}</span>
  </div>
);

// ================== ANIMATED BACKGROUND COMPONENTS ==================
const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 animate-gradient-slow"></div>
      
      {/* Floating Currency Icons - Fixed positioning */}
      <div className="absolute inset-0">
        <div className="absolute text-white/20 text-5xl font-bold animate-float" style={{ left: '5%', top: '10%' }}>$</div>
        <div className="absolute text-white/20 text-5xl font-bold animate-float" style={{ left: '85%', top: '15%', animationDelay: '2s' }}>€</div>
        <div className="absolute text-white/20 text-5xl font-bold animate-float" style={{ left: '10%', top: '80%', animationDelay: '4s' }}>£</div>
        <div className="absolute text-white/20 text-5xl font-bold animate-float" style={{ left: '80%', top: '75%', animationDelay: '6s' }}>¥</div>
        <div className="absolute text-white/20 text-5xl font-bold animate-float" style={{ left: '75%', top: '25%', animationDelay: '1s' }}>₹</div>
        <div className="absolute text-white/20 text-5xl font-bold animate-float" style={{ left: '20%', top: '20%', animationDelay: '3s' }}>₿</div>
      </div>

      {/* Animated Line Graph */}
      <div className="absolute bottom-0 left-0 right-0 h-32 opacity-20">
        <svg className="w-full h-full" viewBox="0 0 1200 200">
          <path
            d="M0,150 Q300,50 600,100 T1200,80"
            stroke="white"
            strokeWidth="3"
            fill="none"
            className="animate-draw-line"
          />
          <path
            d="M0,180 Q300,80 600,130 T1200,110"
            stroke="white"
            strokeWidth="2"
            fill="none"
            className="animate-draw-line-delayed"
          />
        </svg>
      </div>

      {/* Floating Finance Icons - Fixed positioning */}
      <div className="absolute inset-0">
        <div className="absolute text-4xl animate-float-gentle" style={{ left: '8%', top: '35%' }}></div>
        <div className="absolute text-4xl animate-float-gentle" style={{ left: '82%', top: '40%', animationDelay: '1s' }}></div>
        <div className="absolute text-4xl animate-float-gentle" style={{ left: '15%', top: '70%', animationDelay: '2s' }}></div>
        <div className="absolute text-4xl animate-float-gentle" style={{ left: '78%', top: '65%', animationDelay: '3s' }}></div>
        <div className="absolute text-4xl animate-float-gentle" style={{ left: '88%', top: '50%', animationDelay: '4s' }}></div>
      </div>

      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0">
        <div className="absolute w-2 h-2 bg-white/40 rounded-full animate-float-slow" style={{ left: '15%', top: '25%' }}></div>
        <div className="absolute w-2 h-2 bg-white/40 rounded-full animate-float-slow" style={{ left: '85%', top: '30%', animationDelay: '2s' }}></div>
        <div className="absolute w-2 h-2 bg-white/40 rounded-full animate-float-slow" style={{ left: '20%', top: '75%', animationDelay: '4s' }}></div>
        <div className="absolute w-2 h-2 bg-white/40 rounded-full animate-float-slow" style={{ left: '80%', top: '70%', animationDelay: '6s' }}></div>
        <div className="absolute w-2 h-2 bg-white/40 rounded-full animate-float-slow" style={{ left: '70%', top: '20%', animationDelay: '1s' }}></div>
        <div className="absolute w-2 h-2 bg-white/40 rounded-full animate-float-slow" style={{ left: '25%', top: '15%', animationDelay: '3s' }}></div>
      </div>
    </div>
  );
};

const FinanceQuote = () => {
  const quotes = [
    "The best investment you can make is in yourself.",
    "Financial freedom is available to those who learn about it and work for it.",
    "Money is only a tool. It will take you wherever you wish, but it will not replace you as the driver.",
    "The goal isn't more money. The goal is living life on your terms.",
    "Invest in yourself. Your career is the engine of your wealth."
  ];

  const [currentQuote, setCurrentQuote] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % quotes.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [quotes.length]);

  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center text-white/80 max-w-2xl px-4">
      <div className="text-lg font-medium mb-2"> Financial Wisdom</div>
      <div className="text-sm leading-relaxed animate-fade-in-out">
        "{quotes[currentQuote]}"
      </div>
    </div>
  );
};

// ================== ENHANCED AUTH SCREENS ==================
const LoginForm = ({ onToggle, onForgot }) => {
  const [credentials, setCredentials] = useState({ usernameOrEmail: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await login(credentials);
    } catch (ex) {
      setErr(ex.message || 'Invalid username/email or password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />
      <FinanceQuote />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 max-w-md w-full border border-white/20">
          <div className="text-center mb-8">
            <div className="relative">
              <DollarSign className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-bounce" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <TrendingUp className="h-3 w-3 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600 text-lg">Sign in to your Finwise dashboard</p>
          </div>

          {err && <Alert type="error" title="Sign-in failed" message={err} />}

          <form onSubmit={submit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Username or Email</label>
              <div className="relative">
                <User className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  value={credentials.usernameOrEmail}
                  onChange={(e) => setCredentials({ ...credentials, usernameOrEmail: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Password</label>
              <div className="relative">
                <KeyRound className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                  style={{ zIndex: 10 }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 transform hover:scale-105 active:scale-95"
            >
              {busy ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="flex items-center justify-between mt-6">
            <button 
              onClick={onForgot} 
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
            >
              Forgot password?
            </button>
            <button 
              onClick={onToggle} 
              className="text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
            >
              Create account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const RegisterForm = ({ onToggle }) => {
  const [userData, setUserData] = useState({
    username: '', email: '', password: '', confirmPassword: '',
    firstName: '', lastName: '', phoneCountryCode: '', phoneNumber: ''
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register } = useAuth();

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr(''); setOk('');

    if (userData.password !== userData.confirmPassword) {
      setErr('Passwords do not match.');
      setBusy(false);
      return;
    }

    try {
      const payload = {
        username: userData.username, email: userData.email,
        password: userData.password, confirmPassword: userData.confirmPassword,
        firstName: userData.firstName, lastName: userData.lastName,
        phoneCountryCode: userData.phoneCountryCode, phoneNumber: userData.phoneNumber
      };
      await register(payload);
      setOk('Registration successful! You can now sign in.');
      setUserData({
        username: '', email: '', password: '', confirmPassword: '',
        firstName: '', lastName: '', phoneCountryCode: '', phoneNumber: ''
      });
    } catch (ex) {
      setErr(ex.message || 'Registration failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />
      <FinanceQuote />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 max-w-md w-full border border-white/20">
          <div className="text-center mb-8">
            <div className="relative">
              <DollarSign className="h-16 w-16 text-purple-600 mx-auto mb-4 animate-pulse" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <Target className="h-3 w-3 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Create Account</h1>
            <p className="text-gray-600 text-lg">Start your Finwise journey today</p>
          </div>

          {err && <Alert type="error" title="Registration failed" message={err} />}
          {ok && <Alert type="success" title="All set!" message={ok} />}

          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  value={userData.firstName}
                  onChange={(e) => setUserData({ ...userData, firstName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  value={userData.lastName}
                  onChange={(e) => setUserData({ ...userData, lastName: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                value={userData.username}
                onChange={(e) => setUserData({ ...userData, username: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                value={userData.email}
                onChange={(e) => setUserData({ ...userData, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Country Code</label>
                <input
                  type="text"
                  placeholder="+1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  value={userData.phoneCountryCode}
                  onChange={(e) => setUserData({ ...userData, phoneCountryCode: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="1234567890"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  value={userData.phoneNumber}
                  onChange={(e) => setUserData({ ...userData, phoneNumber: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength="6"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  value={userData.password}
                  onChange={(e) => setUserData({ ...userData, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                  style={{ zIndex: 10 }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  minLength="6"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  value={userData.confirmPassword}
                  onChange={(e) => setUserData({ ...userData, confirmPassword: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                  style={{ zIndex: 10 }}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 transform hover:scale-105 active:scale-95"
            >
              {busy ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating account...
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="text-center mt-6">
            <p className="text-gray-600">
              Already have an account?{' '}
              <button onClick={onToggle} className="text-purple-600 hover:text-purple-700 font-semibold transition-colors duration-200">
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ForgotPasswordFlow = ({ onBackToLogin }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const clearMsg = () => setMsg({ type: '', text: '' });

  const handleSendOtp = async (e) => {
    e.preventDefault();
    clearMsg();
    setBusy(true);
    try {
      const res = await apiService.sendPasswordResetOtp(email);
      setMsg({ type: 'success', text: res.message || 'If the email exists, an OTP has been sent.' });
      setStep(2);
    } catch (ex) {
      setMsg({ type: 'error', text: ex.message || 'Could not send OTP. Try again.' });
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    clearMsg();
    setBusy(true);
    try {
      const res = await apiService.verifyPasswordResetOtp(email, otp);
      setMsg({ type: 'success', text: res.message || 'OTP verified. You can set a new password.' });
      setStep(3);
    } catch (ex) {
      setMsg({ type: 'error', text: ex.message || 'Invalid or expired OTP.' });
    } finally {
      setBusy(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    clearMsg();

    if (newPwd !== confirmPwd) {
      setMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setBusy(true);
    try {
      const res = await apiService.resetPassword(email, otp, newPwd, confirmPwd);
      setMsg({ type: 'success', text: res.message || 'Password reset successfully!' });
      setTimeout(onBackToLogin, 1500);
    } catch (ex) {
      setMsg({ type: 'error', text: ex.message || 'Could not reset password.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />
      <FinanceQuote />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 max-w-md w-full border border-white/20">
          {/* Back Button */}
          <button onClick={onBackToLogin} className="flex items-center text-gray-500 hover:text-gray-700 mb-4 transition-colors duration-200">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Sign In
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="relative">
              <ShieldCheck className="h-16 w-16 text-indigo-600 mx-auto mb-3 animate-pulse" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="h-3 w-3 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Reset Your Password</h1>
            <p className="text-gray-600">We'll help you securely get back into Finwise.</p>
          </div>

          {/* Step Indicators */}
          <div className="flex items-center justify-between mb-6">
            <StepPill index={1} label="Send OTP" active={step === 1} done={step > 1} />
            <div className="flex-1 h-[2px] bg-gray-200 mx-2" />
            <StepPill index={2} label="Verify OTP" active={step === 2} done={step > 2} />
            <div className="flex-1 h-[2px] bg-gray-200 mx-2" />
            <StepPill index={3} label="Reset" active={step === 3} done={false} />
          </div>

          {/* Alerts */}
          {msg.text && (
            <div className="mb-4">
              <Alert
                type={msg.type === 'error' ? 'error' : 'success'}
                title={msg.type === 'error' ? 'Oops' : 'Success'}
                message={msg.text}
              />
            </div>
          )}

          {/* Step 1: Send OTP */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <label className="block text-sm font-semibold text-gray-700">Email</label>
              <div className="relative">
                <Mail className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-2.5 rounded-xl transition-all duration-200 disabled:opacity-50 transform hover:scale-105 active:scale-95"
              >
                {busy ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </div>
                ) : (
                  'Send OTP'
                )}
              </button>
            </form>
          )}

          {/* Step 2: Verify OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700">OTP Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  required
                  placeholder="••••••"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.trim())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent tracking-widest transition-all duration-200"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-2.5 rounded-xl transition-all duration-200 disabled:opacity-50 transform hover:scale-105 active:scale-95"
              >
                {busy ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </div>
                ) : (
                  'Verify OTP'
                )}
              </button>
            </form>
          )}

          {/* Step 3: Reset Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                    style={{ zIndex: 10 }}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                    style={{ zIndex: 10 }}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-2.5 rounded-xl transition-all duration-200 disabled:opacity-50 transform hover:scale-105 active:scale-95"
              >
                {busy ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// ================== MAIN APP (AFTER LOGIN) ==================
const FinanceApp = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();

  const [newExpense, setNewExpense] = useState({
    description: '', amount: '', category: 'Food', type: 'EXPENSE'
  });
  const [newBudget, setNewBudget] = useState({
    category: '', budgetedAmount: '', period: 'MONTHLY'
  });

  useEffect(() => { loadAll(); }, []);
  const loadAll = async () => {
    setLoading(true);
    try {
      await Promise.all([loadTransactions(), loadBudgets(), loadInvestments()]);
    } finally { setLoading(false); }
  };

  const loadTransactions = async () => setExpenses(await apiService.getTransactions());
  const loadBudgets = async () => {
    try {
      const result = await apiService.getBudgets();
      console.log('🔍 Budgets loaded:', result);
      if (Array.isArray(result)) {
        setBudgets(result);
      } else {
        console.error('🔍 Budgets result is not an array:', result);
        setBudgets([]);
      }
    } catch (error) {
      console.error('🔍 Failed to load budgets:', error);
      setBudgets([]);
    }
  };
  const loadInvestments = async () => setInvestments(await apiService.getInvestments());

  // Updated calculations
  const totalIncome = expenses.filter(e => e.type === 'INCOME').reduce((s, e) => s + parseFloat(e.amount), 0);
  const totalExpenses = expenses.filter(e => e.type === 'EXPENSE').reduce((s, e) => s + parseFloat(e.amount), 0);
  
  // Calculate total invested amount (what user has spent on investments)
  const totalInvestmentCost = investments.reduce((s, inv) => s + inv.shares * parseFloat(inv.purchasePrice), 0);
  
  // Net Income now represents AVAILABLE CASH (income - expenses - investments)
  const netIncome = totalIncome - totalExpenses - totalInvestmentCost;
  
  // Investment portfolio value (current market value)
  const totalInvestmentValue = investments.reduce((s, inv) => s + inv.shares * parseFloat(inv.currentPrice), 0);
  const investmentGainLoss = totalInvestmentValue - totalInvestmentCost;

  const expenseCategories = expenses.filter(e => e.type === 'EXPENSE').reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + parseFloat(e.amount);
    return acc;
  }, {});
  const pieData = Object.entries(expenseCategories).map(([name, value]) => ({ name, value }));
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

  // Calculate real monthly data from actual transactions
  const calculateMonthlyData = () => {
    console.log('🔍 Calculating monthly data from expenses:', expenses);
    
    if (expenses.length === 0) {
      console.log('🔍 No expenses found, returning no data');
      return [{ month: 'No Data', income: 0, expenses: 0 }];
    }

    // Group transactions by month
    const monthlyTransactions = expenses.reduce((acc, transaction) => {
      console.log('🔍 Processing transaction:', transaction);
      
      // Handle different date formats
      let date;
      if (transaction.transactionDate) {
        date = new Date(transaction.transactionDate);
      } else if (transaction.created_at) {
        date = new Date(transaction.created_at);
      } else {
        console.log('🔍 No date found for transaction:', transaction);
        return acc;
      }
      
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthName,
          income: 0,
          expenses: 0,
          date: date
        };
      }
      
      if (transaction.type === 'INCOME') {
        acc[monthKey].income += parseFloat(transaction.amount);
      } else if (transaction.type === 'EXPENSE') {
        acc[monthKey].expenses += parseFloat(transaction.amount);
      }
      
      return acc;
    }, {});

    console.log('🔍 Monthly transactions grouped:', monthlyTransactions);

    // Convert to array and sort by date
    const monthlyData = Object.values(monthlyTransactions)
      .sort((a, b) => a.date - b.date)
      .map(item => ({
        month: item.month,
        income: item.income,
        expenses: item.expenses
      }));

    console.log('🔍 Final monthly data:', monthlyData);
    return monthlyData.length > 0 ? monthlyData : [{ month: 'No Data', income: 0, expenses: 0 }];
  };

  const monthlyData = calculateMonthlyData();

  const addExpense = async () => {
    if (!newExpense.description || !newExpense.amount) return;
    const tx = { ...newExpense, amount: parseFloat(newExpense.amount), transactionDate: new Date().toISOString().split('T')[0] };
    await apiService.createTransaction(tx);
    await loadTransactions();
    setNewExpense({ description: '', amount: '', category: 'Food', type: 'EXPENSE' });
  };

  const addBudget = async () => {
    if (!newBudget.category || !newBudget.budgetedAmount) return;
    const b = { ...newBudget, budgetedAmount: parseFloat(newBudget.budgetedAmount) };
    await apiService.createBudget(b);
    await loadBudgets();
    setNewBudget({ category: '', budgetedAmount: '', period: 'MONTHLY' });
  };

  // Add these new functions for updating and deleting
  const updateExpense = async (id, updatedData) => {
    try {
      await apiService.updateTransaction(id, updatedData);
      await loadTransactions();
    } catch (error) {
      if (error.message.includes('Authentication expired')) {
        return; // Don't show error, user will be redirected
      }
      throw error;
    }
  };

  const deleteExpense = async (id) => {
    try {
      await apiService.deleteTransaction(id);
      await loadTransactions();
    } catch (error) {
      if (error.message.includes('Authentication expired')) {
        return; // Don't show error, user will be redirected
      }
      throw error;
    }
  };

  const updateBudget = async (id, updatedData) => {
    try {
      await apiService.updateBudget(id, updatedData);
      await loadBudgets();
    } catch (error) {
      console.error('Budget update error:', error);
      alert(`Failed to update budget: ${error.message}`);
    }
  };

  const deleteBudget = async (id) => {
    try {
      await apiService.deleteBudget(id);
      await loadBudgets();
    } catch (error) {
      console.error('Budget delete error:', error);
      alert(`Failed to delete budget: ${error.message}`);
    }
  };

  // Add investment management functions
  const addInvestment = async (investmentData) => {
    const investmentCost = investmentData.shares * parseFloat(investmentData.purchasePrice);
    
    // Check if user has sufficient available cash
    if (investmentCost > netIncome) {
      alert(`Insufficient funds! You cannot buy this investment.\n\nInvestment cost: $${investmentCost.toFixed(2)}\nAvailable cash: $${netIncome.toFixed(2)}\n\nPlease reduce the number of shares or purchase price to proceed.`);
      return false;
    }
    
    try {
      await apiService.createInvestment(investmentData);
      await loadInvestments(); // This will update the dashboard automatically
      return true;
    } catch (error) {
      console.error('Failed to create investment:', error);
      alert(`Failed to create investment: ${error.message}`);
      return false;
    }
  };

  const deleteInvestment = async (id) => {
    try {
      await apiService.deleteInvestment(id);
      await loadInvestments(); // This will update the dashboard automatically
    } catch (error) {
      console.error('Failed to delete investment:', error);
      alert(`Failed to delete investment: ${error.message}`);
    }
  };

  const Dashboard = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Finwise Dashboard</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Income</p>
              <p className="text-2xl font-bold">${totalIncome.toFixed(2)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Total Expenses</p>
              <p className="text-2xl font-bold">${totalExpenses.toFixed(2)}</p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-200" />
          </div>
        </div>

        <div className={`bg-gradient-to-r ${netIncome >= 0 ? 'from-green-500 to-green-600' : 'from-orange-500 to-orange-600'} rounded-xl p-6 text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-opacity-80 text-sm">Available Cash</p>
              <p className="text-2xl font-bold">${netIncome.toFixed(2)}</p>
              <p className="text-xs text-white text-opacity-70">(Income - Expenses - Investments)</p>
            </div>
            <Wallet className="h-8 w-8 text-white text-opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Investment Portfolio</p>
              <p className="text-2xl font-bold">${totalInvestmentValue.toFixed(2)}</p>
              <p className={`text-sm ${investmentGainLoss >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                {investmentGainLoss >= 0 ? '+' : ''}${investmentGainLoss.toFixed(2)}
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Income vs Expenses Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Expense Categories</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={pieData}
                cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Recent Transactions</h3>
        <div className="space-y-3">
          {expenses.slice(-5).reverse().map(expense => (
            <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${expense.type === 'INCOME' ? 'bg-green-100' : 'bg-red-100'}`}>
                  {expense.type === 'INCOME'
                    ? <TrendingUp className="h-4 w-4 text-green-600" />
                    : <TrendingDown className="h-4 w-4 text-red-600" />
                  }
                </div>
                <div>
                  <p className="font-medium">{expense.description}</p>
                  <p className="text-sm text-gray-500">{expense.category} • {expense.transactionDate}</p>
                </div>
              </div>
              <span className={`font-semibold ${expense.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                {expense.type === 'INCOME' ? '+' : '-'}${parseFloat(expense.amount).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your financial data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <DollarSign className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Finwise</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Welcome back, {user?.username || user?.email}!</span>
              <button onClick={logout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors">
                <LogOut className="h-5 w-5" /><span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'expenses', label: 'Expenses', icon: CreditCard },
              { id: 'budgets', label: 'Budgets', icon: Target },
              { id: 'investments', label: 'Investments', icon: TrendingUp },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 transition-colors ${
                  activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>
                <tab.icon className="h-5 w-5" /><span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'expenses' && <ExpenseTracker 
          expenses={expenses}
          newExpense={newExpense}
          setNewExpense={setNewExpense}
          addExpense={addExpense}
          updateExpense={updateExpense}
          deleteExpense={deleteExpense}
        />}
        {activeTab === 'budgets' && <BudgetManager 
          budgets={budgets}
          newBudget={newBudget}
          setNewBudget={setNewBudget}
          addBudget={addBudget}
          updateBudget={updateBudget}
          deleteBudget={deleteBudget}
        />}
        {activeTab === 'investments' && <InvestmentPortfolio 
          investments={investments}
          addInvestment={addInvestment}
          deleteInvestment={deleteInvestment}
          netIncome={netIncome}
          totalInvestmentCost={totalInvestmentCost}
          totalIncome={totalIncome}
          totalExpenses={totalExpenses}
        />}
      </main>
    </div>
  );
};

// Move ExpenseTracker outside of FinanceApp
const ExpenseTracker = ({ expenses, newExpense, setNewExpense, addExpense, updateExpense, deleteExpense }) => {
  const [editingExpense, setEditingExpense] = useState(null);
  const [editForm, setEditForm] = useState({
    description: '',
    amount: '',
    category: 'Food',
    type: 'EXPENSE'
  });

  const handleEdit = (expense) => {
    setEditingExpense(expense.id);
    setEditForm({
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category,
      type: expense.type
    });
  };

  const handleSaveEdit = async () => {
    if (!editForm.description || !editForm.amount) return;
    
    try {
      await updateExpense(editingExpense, {
        ...editForm,
        amount: parseFloat(editForm.amount)
      });
      setEditingExpense(null);
      setEditForm({ description: '', amount: '', category: 'Food', type: 'EXPENSE' });
    } catch (error) {
      console.error('Failed to update transaction:', error);
      alert('Failed to update transaction. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingExpense(null);
    setEditForm({ description: '', amount: '', category: 'Food', type: 'EXPENSE' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await deleteExpense(id);
      } catch (error) {
        console.error('Failed to delete transaction:', error);
        alert('Failed to delete transaction. Please try again.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Expense Tracker</h2>

      {/* Add New Expense */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Add New Transaction</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <input
            type="text"
            placeholder="Description"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={newExpense.description}
            onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
          />
          <input
            type="number"
            placeholder="Amount"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={newExpense.amount}
            onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
          />
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={newExpense.category}
            onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
          >
            <option value="Salary">Salary</option>
            <option value="Food">Food</option>
            <option value="Transportation">Transportation</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Shopping">Shopping</option>
            <option value="Healthcare">Healthcare</option>
          </select>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={newExpense.type}
            onChange={(e) => setNewExpense({ ...newExpense, type: e.target.value })}
          >
            <option value="EXPENSE">Expense</option>
            <option value="INCOME">Income</option>
          </select>
          <button
            onClick={addExpense}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Expense List */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-4">All Transactions</h3>
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold">Date</th>
                <th className="text-left py-3 px-4 font-semibold">Description</th>
                <th className="text-left py-3 px-4 font-semibold">Category</th>
                <th className="text-left py-3 px-4 font-semibold">Type</th>
                <th className="text-right py-3 px-4 font-semibold">Amount</th>
                <th className="text-center py-3 px-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">{expense.transactionDate}</td>
                  <td className="py-3 px-4 font-medium">
                    {editingExpense === expense.id ? (
                      <input
                        type="text"
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      />
                    ) : (
                      expense.description
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {editingExpense === expense.id ? (
                      <select
                        className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        value={editForm.category}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      >
                        <option value="Salary">Salary</option>
                        <option value="Food">Food</option>
                        <option value="Transportation">Transportation</option>
                        <option value="Entertainment">Entertainment</option>
                        <option value="Shopping">Shopping</option>
                        <option value="Healthcare">Healthcare</option>
                      </select>
                    ) : (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {expense.category}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {editingExpense === expense.id ? (
                      <select
                        className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        value={editForm.type}
                        onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                      >
                        <option value="EXPENSE">Expense</option>
                        <option value="INCOME">Income</option>
                      </select>
                    ) : (
                      <span
                        className={`px-2 py-1 rounded-full text-sm ${
                          expense.type === "INCOME"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {expense.type}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {editingExpense === expense.id ? (
                      <input
                        type="number"
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-right"
                        value={editForm.amount}
                        onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                      />
                    ) : (
                      <span
                        className={`font-semibold ${
                          expense.type === "INCOME" ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {expense.type === "INCOME" ? "+" : "-"}${parseFloat(expense.amount).toFixed(2)}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {editingExpense === expense.id ? (
                      <div className="flex space-x-2 justify-center">
                        <button
                          onClick={handleSaveEdit}
                          className="text-green-600 hover:text-green-800 font-medium text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="text-gray-600 hover:text-gray-800 font-medium text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex space-x-2 justify-center">
                        <button
                          onClick={() => handleEdit(expense)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="text-red-600 hover:text-red-800 font-medium text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Move BudgetManager outside of FinanceApp
const BudgetManager = ({ budgets, newBudget, setNewBudget, addBudget, updateBudget, deleteBudget }) => {
  const [editingBudget, setEditingBudget] = useState(null);
  const [editForm, setEditForm] = useState({
    category: '',
    budgetedAmount: '',
    period: 'MONTHLY'
  });

  const handleEdit = (budget) => {
    setEditingBudget(budget.id);
    setEditForm({
      category: budget.category,
      budgetedAmount: budget.budgetedAmount.toString(),
      period: budget.period
    });
  };

  const handleSaveEdit = async () => {
    if (!editForm.category || !editForm.budgetedAmount) return;
    
    try {
      await updateBudget(editingBudget, {
        ...editForm,
        budgetedAmount: parseFloat(editForm.budgetedAmount)
      });
      setEditingBudget(null);
      setEditForm({ category: '', budgetedAmount: '', period: 'MONTHLY' });
    } catch (error) {
      console.error('Failed to update budget:', error);
      alert('Failed to update budget. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingBudget(null);
    setEditForm({ category: '', budgetedAmount: '', period: 'MONTHLY' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      try {
        await deleteBudget(id);
      } catch (error) {
        console.error('Failed to delete budget:', error);
        alert('Failed to delete budget. Please try again.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Budget Manager</h2>

      {/* Add New Budget */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Create New Budget</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input type="text" placeholder="Category"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={newBudget.category}
            onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
          />
          <input type="number" placeholder="Budget Amount"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={newBudget.budgetedAmount}
            onChange={(e) => setNewBudget({ ...newBudget, budgetedAmount: e.target.value })}
          />
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={newBudget.period}
            onChange={(e) => setNewBudget({ ...newBudget, period: e.target.value })}
          >
            <option value="MONTHLY">Monthly</option>
            <option value="WEEKLY">Weekly</option>
            <option value="YEARLY">Yearly</option>
          </select>
          <button onClick={addBudget}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors">
            <Target className="h-4 w-4" /><span>Create</span>
          </button>
        </div>
      </div>

      {/* Budget Overview */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Budget Overview</h3>
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold">Category</th>
                <th className="text-left py-3 px-4 font-semibold">Period</th>
                <th className="text-right py-3 px-4 font-semibold">Budgeted Amount</th>
                <th className="text-right py-3 px-4 font-semibold">Spent Amount</th>
                <th className="text-right py-3 px-4 font-semibold">Remaining</th>
                <th className="text-center py-3 px-4 font-semibold">Progress</th>
                <th className="text-center py-3 px-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {budgets.map(budget => {
                const percentage = (parseFloat(budget.spentAmount) / parseFloat(budget.budgetedAmount)) * 100;
                const isOver = percentage > 100;
                const remaining = parseFloat(budget.budgetedAmount) - parseFloat(budget.spentAmount);
                
                return (
                  <tr key={budget.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {editingBudget === budget.id ? (
                        <input
                          type="text"
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          value={editForm.category}
                          onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                        />
                      ) : (
                        <span className="font-medium">{budget.category}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {editingBudget === budget.id ? (
                        <select
                          className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          value={editForm.period}
                          onChange={(e) => setEditForm({ ...editForm, period: e.target.value })}
                        >
                          <option value="MONTHLY">Monthly</option>
                          <option value="WEEKLY">Weekly</option>
                          <option value="YEARLY">Yearly</option>
                        </select>
                      ) : (
                        <span className="text-sm text-gray-500">{budget.period}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {editingBudget === budget.id ? (
                        <input
                          type="number"
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-right"
                          value={editForm.budgetedAmount}
                          onChange={(e) => setEditForm({ ...editForm, budgetedAmount: e.target.value })}
                        />
                      ) : (
                        <span className="font-semibold">${parseFloat(budget.budgetedAmount).toFixed(2)}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-semibold">${parseFloat(budget.spentAmount).toFixed(2)}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-semibold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${remaining.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-2">
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div className={`h-3 rounded-full transition-all duration-300 ${isOver ? 'bg-red-500' : 'bg-green-500'}`}
                               style={{ width: `${Math.min(percentage, 100)}%` }} />
                        </div>
                        <div className="text-center">
                          <span className={`text-sm font-medium ${isOver ? 'text-red-600' : 'text-green-600'}`}>
                            {percentage.toFixed(1)}% used
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {editingBudget === budget.id ? (
                        <div className="flex space-x-2 justify-center">
                          <button
                            onClick={handleSaveEdit}
                            className="text-green-600 hover:text-green-800 font-medium text-sm"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-gray-600 hover:text-gray-800 font-medium text-sm"
                          >
                            Cancel
                        </button>
                        </div>
                      ) : (
                        <div className="flex space-x-2 justify-center">
                          <button
                            onClick={() => handleEdit(budget)}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(budget.id)}
                            className="text-red-600 hover:text-red-800 font-medium text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Updated InvestmentPortfolio with stock lookup functionality
const InvestmentPortfolio = ({ investments, addInvestment, deleteInvestment, netIncome, totalInvestmentCost, totalIncome, totalExpenses }) => {
  const [newInvestment, setNewInvestment] = useState({
    symbol: "",
    name: "",
    shares: "",
    purchasePrice: "",
    currentPrice: ""
  });

  const [stockSearchResults, setStockSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);

  // Trigger search when typing
  useEffect(() => {
    if (newInvestment.symbol && newInvestment.symbol.length >= 1) {
      const timeoutId = setTimeout(async () => {
        console.log('🔍 useEffect triggered for:', newInvestment.symbol);
        try {
          setSearchLoading(true);
          const results = await stockApiService.searchStocks(newInvestment.symbol);
          console.log('🔍 Setting search results:', results);
          setStockSearchResults(results || []);
          setShowDropdown((results || []).length > 0);
    } catch (error) {
          console.log('🔍 Search error:', error);
          setStockSearchResults([]);
          setShowDropdown(false);
    } finally {
      setSearchLoading(false);
    }
      }, 200);

    return () => clearTimeout(timeoutId);
    } else {
      setStockSearchResults([]);
      setShowDropdown(false);
    }
  }, [newInvestment.symbol]);

  const handleStockSelect = async (stock) => {
    console.log('🔍 Stock selected:', stock);
    
    setSelectedStock(stock);
    setNewInvestment(prev => ({
      ...prev,
      symbol: stock.symbol,
      name: stock.name
    }));
    
    // Get current price with full precision
    const currentPrice = await stockApiService.getStockQuote(stock.symbol);
    console.log('🔍 Setting current price (exact):', currentPrice);
    
    if (currentPrice) {
        setNewInvestment(prev => ({
          ...prev,
        currentPrice: currentPrice // Keep as string to preserve precision
      }));
    } else {
      // If API fails, set a placeholder and show message
      setNewInvestment(prev => ({
        ...prev,
        currentPrice: "0.00"
      }));
      alert(`Could not fetch current price for ${stock.symbol}. Please enter manually.`);
    }
    
    // Hide dropdown
    setStockSearchResults([]);
    setShowDropdown(false);
  };

  const handleSymbolChange = (e) => {
    const value = e.target.value;
    setNewInvestment({ ...newInvestment, symbol: value });
    setSelectedStock(null);
    
    // Clear name and current price when symbol changes
    if (value.length === 0) {
    setNewInvestment(prev => ({ ...prev, name: "", currentPrice: "" }));
      setStockSearchResults([]);
    }
  };

  const handleAddInvestment = async () => {
    if (!newInvestment.symbol || !newInvestment.name || !newInvestment.shares || !newInvestment.purchasePrice || !newInvestment.currentPrice) {
      alert('Please fill in all fields');
      return;
    }

    const investmentData = {
      ...newInvestment,
      shares: parseInt(newInvestment.shares),
      purchasePrice: parseFloat(newInvestment.purchasePrice),
      currentPrice: parseFloat(newInvestment.currentPrice)
    };

    const success = await addInvestment(investmentData);
    if (success) {
      setNewInvestment({ symbol: "", name: "", shares: "", purchasePrice: "", currentPrice: "" });
      setSelectedStock(null);
    }
  };

  // Calculate summary totals
  const totalInvestmentValue = investments.reduce((sum, inv) => sum + inv.shares * parseFloat(inv.currentPrice), 0);
  const investmentGainLoss = totalInvestmentValue - totalInvestmentCost;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Investment Portfolio</h2>

      {/* Funds Status */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Cash Flow Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Income</p>
            <p className="text-2xl font-bold text-green-600">${totalIncome.toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600">${totalExpenses.toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Invested</p>
            <p className="text-2xl font-bold text-blue-600">${totalInvestmentCost.toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Available Cash</p>
            <p className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${netIncome.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">(Income - Expenses - Investments)</p>
          </div>
        </div>
      </div>

      {/* Add New Investment Form */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Add New Investment</h3>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {/* Symbol with autocomplete */}
          <div className="relative">
            <input 
              placeholder="Symbol" 
              value={newInvestment.symbol} 
              onChange={handleSymbolChange}
              onFocus={() => setShowDropdown(true)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {showDropdown && stockSearchResults && stockSearchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {searchLoading ? (
                  <div className="px-3 py-2 text-gray-500">Searching...</div>
                ) : (
                  stockSearchResults.map((stock, index) => (
                    <div
                      key={index}
                      onClick={() => handleStockSelect(stock)}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-semibold text-blue-600">{stock.symbol}</div>
                      <div className="text-sm text-gray-600 truncate">{stock.name}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Name (auto-filled) */}
          <input 
            placeholder="Name" 
            value={newInvestment.name} 
            readOnly
            className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
          />

          {/* Shares */}
          <input 
            type="number" 
            placeholder="Shares" 
            value={newInvestment.shares} 
            onChange={(e) => setNewInvestment({...newInvestment, shares: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          {/* Purchase Price */}
          <input 
            type="number" 
            step="0.01"
            placeholder="Purchase Price" 
            value={newInvestment.purchasePrice} 
            onChange={(e) => setNewInvestment({...newInvestment, purchasePrice: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          {/* Current Price (auto-filled) */}
          <input 
            type="number" 
            step="0.01"
            placeholder="Current Price" 
            value={newInvestment.currentPrice} 
            onChange={(e) => setNewInvestment({...newInvestment, currentPrice: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          {/* Add Button */}
          <button 
            onClick={handleAddInvestment} 
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Add
          </button>
        </div>

        {/* API Status */}
        <div className="mt-4 text-sm text-gray-600">
          <p>💡 <strong>Tip:</strong> Start typing a stock symbol (e.g., "AAPL") or company name to see suggestions</p>
          <p>📊 <strong>Auto-fill:</strong> Company name and current price are automatically filled when you select a stock</p>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Total Value</h3>
          <p className="text-3xl font-bold text-blue-600">${totalInvestmentValue.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Total Cost</h3>
          <p className="text-3xl font-bold text-gray-600">${totalInvestmentCost.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Gain/Loss</h3>
          <p className={`text-3xl font-bold ${investmentGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {investmentGainLoss >= 0 ? '+' : ''}${investmentGainLoss.toFixed(2)}
          </p>
          <p className={`text-sm ${investmentGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ({((investmentGainLoss / totalInvestmentCost) * 100 || 0).toFixed(2)}%)
          </p>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Holdings</h3>
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b border-gray-200">
                <th>Symbol</th>
                <th>Name</th>
                <th className="text-right">Shares</th>
                <th className="text-right">Purchase Price</th>
                <th className="text-right">Current Price</th>
                <th className="text-right">Total Value</th>
                <th className="text-right">Gain/Loss</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {investments.map(inv => {
                const totalValue = inv.shares * parseFloat(inv.currentPrice);
                const totalCost  = inv.shares * parseFloat(inv.purchasePrice);
                const gainLoss   = totalValue - totalCost;
                const pct        = (gainLoss / totalCost) * 100;
                return (
                  <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-bold text-blue-600">{inv.symbol}</td>
                    <td className="py-3 px-4">{inv.name}</td>
                    <td className="py-3 px-4 text-right">{inv.shares}</td>
                    <td className="py-3 px-4 text-right">${parseFloat(inv.purchasePrice).toFixed(2)}</td>
                    <td className="py-3 px-4 text-right">${parseFloat(inv.currentPrice).toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-semibold">${totalValue.toFixed(2)}</td>
                    <td className={`py-3 px-4 text-right font-semibold ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {gainLoss >= 0 ? '+' : ''}${gainLoss.toFixed(2)}
                      <br /><span className="text-sm">({(pct || 0).toFixed(2)}%)</span>
                    </td>
                    <td>
                      <button onClick={() => deleteInvestment(inv.id)} className="text-red-500 hover:underline">Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ================== ROOT (AUTH SWITCH) ==================
const App = () => {
  const [view, setView] = useState('login'); // login | register | forgot
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    if (view === 'login')   return <LoginForm onToggle={() => setView('register')} onForgot={() => setView('forgot')} />;
    if (view === 'register')return <RegisterForm onToggle={() => setView('login')} />;
    if (view === 'forgot')  return <ForgotPasswordFlow onBackToLogin={() => setView('login')} />;
  }

  return <FinanceApp />;
};

const FinanceAppRoot = () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);

export default FinanceAppRoot;
