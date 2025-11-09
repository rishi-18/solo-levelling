import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Progress } from './ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  CartesianGrid,
  ComposedChart
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Target, PiggyBank, BarChart3, ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react';
import { UserData } from '../App';
import { authFetch, testBackendConnection } from '../utils/supabase/client';
import { toast } from 'sonner';

interface DashboardScreenProps {
  userData: UserData;
  setUserData: (data: UserData) => void;
}

interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'saving' | 'investment';
  amount: number;
  category?: string;
  description?: string;
  date: string;
}

interface Mission {
  id: string;
  title: string;
  description: string;
  icon: string;
  xp: number;
  category: string;
  completed: boolean;
  priority?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 rounded-lg shadow-xl">
        <p className="font-data text-sm text-primary mb-2">[{label}]</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="font-data text-xs" style={{ color: entry.color }}>
            {entry.name}: ₹{entry.value?.toLocaleString('en-IN')}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function DashboardScreen({ userData, setUserData }: DashboardScreenProps) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'income' | 'expense' | 'saving' | 'investment'>('income');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionDescription, setTransactionDescription] = useState('');
  const [transactionCategory, setTransactionCategory] = useState('');

  // Load data on mount
  useEffect(() => {
    // Test backend connection first
    testBackendConnection().then(isConnected => {
      console.log('Backend connection:', isConnected ? 'OK' : 'FAILED');
      if (!isConnected) {
        toast.error('Cannot connect to backend. Please check your connection.');
      }
    });
    
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load missions
      const missionsResponse = await authFetch('/missions');
      const missionsData = await missionsResponse.json();
      
      if (missionsData.success && missionsData.data?.missions && missionsData.data.missions.length > 0) {
        const formattedMissions = missionsData.data.missions.map((m: any) => ({
          id: m.id || `mission_${Date.now()}`,
          title: m.title || 'Mission',
          description: m.description || '',
          icon: m.icon || '🎯',
          xp: m.xp || 20,
          category: m.category || 'LEARN',
          completed: m.completed || false,
          priority: m.priority || 'MEDIUM'
        }));
        setMissions(formattedMissions.slice(0, 4)); // Show first 4 missions on dashboard
      } else {
        // Generate missions if none exist
        console.log('No missions found, generating new ones...');
        // Don't await - generate in background to avoid blocking
        generateMissions().catch(err => {
          console.error('Background mission generation error:', err);
        });
      }

      // Load transactions
      const transactionsResponse = await authFetch('/transactions');
      const transactionsData = await transactionsResponse.json();
      
      if (transactionsData.success) {
        setTransactions(transactionsData.transactions || []);
      }

      // Refresh user data
      const profileResponse = await authFetch('/profile');
      const profileData = await profileResponse.json();
      
      if (profileData.success && profileData.userData) {
        setUserData({ ...userData, ...profileData.userData });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate missions locally as fallback
  const generateLocalMissions = () => {
    const monthlyIncome = userData.monthlyIncome || 50000;
    const goal = userData.interests?.[0] || 'wealth freedom';
    
    const localMissions = [
      {
        id: `mission_1_${Date.now()}`,
        title: 'Execute savings protocol',
        description: `Allocate ₹${Math.max(200, Math.floor(monthlyIncome * 0.05))} to emergency buffer`,
        icon: '💰',
        xp: 20,
        category: 'SAVE',
        completed: false,
        priority: 'HIGH'
      },
      {
        id: `mission_2_${Date.now()}`,
        title: 'Knowledge acquisition module',
        description: goal === 'business' ? 'Research 2 startup ideas' : 'Complete investment strategy learning protocol',
        icon: '📘',
        xp: 15,
        category: 'LEARN',
        completed: false,
        priority: 'HIGH'
      },
      {
        id: `mission_3_${Date.now()}`,
        title: 'Revenue stream expansion',
        description: goal === 'business' ? 'Create business plan outline' : 'Submit 2 freelance proposals',
        icon: '💼',
        xp: 30,
        category: 'EARN',
        completed: false,
        priority: 'HIGH'
      },
      {
        id: `mission_4_${Date.now()}`,
        title: 'Network expansion protocol',
        description: 'Establish 2 professional node connections',
        icon: '🤝',
        xp: 25,
        category: 'NETWORK',
        completed: false,
        priority: 'MEDIUM'
      },
      {
        id: `mission_5_${Date.now()}`,
        title: 'Investment analysis protocol',
        description: 'Research 3 investment opportunity matrices',
        icon: '📊',
        xp: 25,
        category: 'LEARN',
        completed: false,
        priority: 'HIGH'
      }
    ];
    
    return localMissions;
  };

  const generateMissions = async () => {
    try {
      console.log('=== GENERATING MISSIONS ===');
      setIsLoading(true);
      toast.loading('Generating personalized missions...', { id: 'generate-missions' });
      
      const token = localStorage.getItem('solo_levelling_token');
      console.log('Auth token exists:', !!token);
      
      // Try backend first
      try {
        const backendOk = await testBackendConnection();
        console.log('Backend connection test:', backendOk);
        
        if (backendOk) {
          const response = await authFetch('/missions/generate', {
            method: 'POST'
          });
          
          console.log('Mission generation response status:', response.status);
          
          if (response.ok) {
            const data = await response.json();
            console.log('Mission generation response data:', JSON.stringify(data, null, 2));
            
            if (data.success && data.missions && Array.isArray(data.missions) && data.missions.length > 0) {
              const formattedMissions = data.missions.map((m: any) => ({
                id: m.id || `mission_${Date.now()}_${Math.random()}`,
                title: m.title || 'Mission',
                description: m.description || '',
                icon: m.icon || '🎯',
                xp: m.xp || 20,
                category: m.category || 'LEARN',
                completed: m.completed || false,
                priority: m.priority || 'MEDIUM'
              }));
              
              console.log('Formatted missions from backend:', formattedMissions);
              setMissions(formattedMissions.slice(0, 4));
              toast.success(`Generated ${formattedMissions.length} missions successfully!`, { id: 'generate-missions' });
              
              setTimeout(() => {
                loadDashboardData();
              }, 500);
              return;
            }
          } else {
            const errorText = await response.text();
            console.error('Backend returned error:', response.status, errorText);
          }
        }
      } catch (backendError: any) {
        console.warn('Backend mission generation failed, using local fallback:', backendError.message);
      }
      
      // Fallback to local mission generation
      console.log('Using local mission generation fallback');
      const localMissions = generateLocalMissions();
      setMissions(localMissions.slice(0, 4));
      
      // Try to save to backend if possible
      try {
        await authFetch('/missions', {
          method: 'POST',
          body: JSON.stringify({
            missions: localMissions
          })
        });
        console.log('Missions saved to backend');
      } catch (saveError) {
        console.warn('Could not save missions to backend:', saveError);
      }
      
      toast.success(`Generated ${localMissions.length} missions!`, { id: 'generate-missions' });
      
    } catch (error: any) {
      console.error('=== MISSION GENERATION ERROR ===');
      console.error('Error:', error);
      
      // Even on error, use local missions
      const localMissions = generateLocalMissions();
      setMissions(localMissions.slice(0, 4));
      toast.success(`Generated ${localMissions.length} missions locally!`, { id: 'generate-missions' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenTransactionDialog = (type: 'income' | 'expense' | 'saving' | 'investment') => {
    try {
      console.log('Opening transaction dialog for type:', type);
      setTransactionType(type);
      setTransactionAmount('');
      setTransactionDescription('');
      setTransactionCategory('');
      setIsTransactionDialogOpen(true);
      console.log('Dialog state set to open, isTransactionDialogOpen should be true');
    } catch (error) {
      console.error('Error opening transaction dialog:', error);
      toast.error('Failed to open transaction dialog');
    }
  };

  const handleCloseTransactionDialog = () => {
    setIsTransactionDialogOpen(false);
    // Reset form after a small delay to allow dialog close animation
    setTimeout(() => {
      setTransactionAmount('');
      setTransactionDescription('');
      setTransactionCategory('');
    }, 200);
  };

  const handleAddTransaction = async () => {
    console.log('handleAddTransaction called', { transactionType, transactionAmount });
    
    if (!transactionAmount || parseFloat(transactionAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      const transactionData = {
        type: transactionType,
        amount: parseFloat(transactionAmount),
        description: transactionDescription || '',
        category: transactionCategory || ''
      };
      
      console.log('Sending transaction:', transactionData);
      
      const response = await authFetch('/transactions', {
        method: 'POST',
        body: JSON.stringify(transactionData)
      });

      console.log('Transaction response status:', response.status);
      const data = await response.json();
      console.log('Transaction response data:', data);
      
      if (data.success) {
        const transactionLabels = {
          income: 'Income',
          expense: 'Expense',
          saving: 'Saving',
          investment: 'Investment'
        };
        
        toast.success(`${transactionLabels[transactionType]} added successfully!`);
        
        // Update user data
        if (data.newNetWorth !== undefined) {
          setUserData({
            ...userData,
            currentNetWorth: data.newNetWorth,
            currentSavings: data.newSavings || userData.currentSavings
          });
        }

        // Reload transactions and dashboard data
        await loadDashboardData();

        // Reset form and close dialog
        handleCloseTransactionDialog();
      } else {
        console.error('Transaction failed:', data);
        toast.error(data.error || 'Failed to add transaction');
      }
    } catch (error: any) {
      console.error('Error adding transaction:', error);
      toast.error(`Failed to add transaction: ${error.message || 'Unknown error'}`);
    }
  };

  const getDialogTitle = () => {
    switch (transactionType) {
      case 'income':
        return 'ADD_INCOME';
      case 'expense':
        return 'LOG_EXPENSE';
      case 'investment':
        return 'ADD_INVESTMENT';
      case 'saving':
        return 'ADD_SAVING';
      default:
        return 'ADD_TRANSACTION';
    }
  };

  const getDialogPlaceholders = () => {
    switch (transactionType) {
      case 'income':
        return {
          amount: '5000',
          description: 'Salary, Freelance, etc.',
          category: 'Salary'
        };
      case 'expense':
        return {
          amount: '500',
          description: 'Food, Transport, etc.',
          category: 'Food'
        };
      case 'investment':
        return {
          amount: '10000',
          description: 'Mutual Fund, Stocks, etc.',
          category: 'Mutual Funds'
        };
      case 'saving':
        return {
          amount: '2000',
          description: 'Emergency fund, Savings account, etc.',
          category: 'Emergency Fund'
        };
      default:
        return {
          amount: '0',
          description: '',
          category: ''
        };
    }
  };

  const getButtonLabel = () => {
    switch (transactionType) {
      case 'income':
        return 'ADD INCOME';
      case 'expense':
        return 'LOG EXPENSE';
      case 'investment':
        return 'ADD INVESTMENT';
      case 'saving':
        return 'ADD SAVING';
      default:
        return 'ADD TRANSACTION';
    }
  };

  // Calculate metrics from transactions
  const calculateMetrics = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Filter current month transactions
    const currentMonthTransactions = transactions.filter(t => {
      const txDate = new Date(t.date);
      return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
    });

    const monthlyIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpenses = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlySavings = currentMonthTransactions
      .filter(t => t.type === 'saving')
      .reduce((sum, t) => sum + t.amount, 0);

    const savingsRate = monthlyIncome > 0 
      ? ((monthlySavings / monthlyIncome) * 100).toFixed(1)
      : '0';

    // Calculate net worth change (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentTransactions = transactions.filter(t => new Date(t.date) >= thirtyDaysAgo);
    const netWorthChange = recentTransactions.reduce((sum, t) => {
      if (t.type === 'income' || t.type === 'saving' || t.type === 'investment') {
        return sum + t.amount;
      } else {
        return sum - t.amount;
      }
    }, 0);

    // Calculate monthly growth rate
    const lastMonthTransactions = transactions.filter(t => {
      const txDate = new Date(t.date);
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return txDate.getMonth() === lastMonth && txDate.getFullYear() === lastMonthYear;
    });

    const lastMonthNetWorth = lastMonthTransactions.reduce((sum, t) => {
      if (t.type === 'income' || t.type === 'saving' || t.type === 'investment') {
        return sum + t.amount;
      } else {
        return sum - t.amount;
      }
    }, userData.currentNetWorth - netWorthChange);

    const monthlyGrowthRate = lastMonthNetWorth > 0
      ? ((netWorthChange / lastMonthNetWorth) * 100).toFixed(1)
      : '0';

    // Calculate ROI (simplified - based on investment returns)
    const totalInvestments = transactions
      .filter(t => t.type === 'investment')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const roi = totalInvestments > 0
      ? ((netWorthChange / totalInvestments) * 100).toFixed(1)
      : '0';

    return {
      monthlyIncome,
      monthlyExpenses,
      monthlySavings,
      savingsRate,
      netWorthChange,
      monthlyGrowthRate,
      roi
    };
  };

  // Generate chart data from transactions
  const generateChartData = () => {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const chartData: any[] = [];
    const currentDate = new Date();
    
    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = `${months[monthDate.getMonth()]}_${monthDate.getFullYear().toString().slice(2)}`;
      const monthLabel = months[monthDate.getMonth()];
      
      const monthTransactions = transactions.filter(t => {
        if (!t.date) return false;
        try {
          const txDate = new Date(t.date);
          return txDate.getMonth() === monthDate.getMonth() && 
                 txDate.getFullYear() === monthDate.getFullYear();
        } catch {
          return false;
        }
      });

      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const savings = monthTransactions
        .filter(t => t.type === 'saving')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      // Calculate net worth for this month
      // Start from current net worth and work backwards
      const transactionsAfterMonth = transactions.filter(t => {
        if (!t.date) return false;
        try {
          const txDate = new Date(t.date);
          return txDate > new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
        } catch {
          return false;
        }
      });
      
      let netWorth = userData.currentNetWorth || 0;
      netWorth = transactionsAfterMonth.reduce((sum, t) => {
        const amount = t.amount || 0;
        if (t.type === 'income' || t.type === 'saving' || t.type === 'investment') {
          return sum - amount;
        } else if (t.type === 'expense') {
          return sum + amount;
        }
        return sum;
      }, netWorth);

      // Calculate target net worth (linear progression to 1 crore by target age)
      const yearsToTarget = (userData.targetAge || 35) - (userData.age || 25);
      const monthsToTarget = Math.max(yearsToTarget * 12, 1);
      const currentMonthIndex = i;
      const progress = 1 - (currentMonthIndex / 6);
      const targetNetWorth = (10000000 * progress) / (monthsToTarget / 6);

      chartData.push({
        month: monthLabel,
        monthKey,
        income: income || 0,
        expenses: expenses || 0,
        savings: savings || 0,
        net: (income || 0) - (expenses || 0),
        amount: Math.max(0, netWorth),
        target: Math.min(Math.max(0, targetNetWorth), 10000000)
      });
    }

    // If no data, provide at least one data point with current values
    if (chartData.length === 0 || chartData.every(d => d.amount === 0 && d.income === 0)) {
      const currentMonth = months[currentDate.getMonth()];
      const monthKey = `${currentMonth}_${currentDate.getFullYear().toString().slice(2)}`;
      return [{
        month: currentMonth,
        monthKey,
        income: userData.monthlyIncome || 0,
        expenses: 0,
        savings: 0,
        net: userData.monthlyIncome || 0,
        amount: userData.currentNetWorth || 0,
        target: 10000000
      }];
    }

    return chartData;
  };

  const metrics = calculateMetrics();
  const chartData = generateChartData();
  
  // Ensure we always have data for charts
  const netWorthData = chartData.length > 0 ? chartData.map(d => ({
    month: d.monthKey || d.month,
    amount: d.amount || 0,
    target: d.target || 0,
    savings: d.savings || 0
  })) : [{
    month: 'CURRENT',
    amount: userData.currentNetWorth || 0,
    target: 10000000,
    savings: 0
  }];
  
  const cashFlowData = chartData.length > 0 ? chartData.map(d => ({
    month: d.month || 'CURRENT',
    income: d.income || 0,
    expenses: d.expenses || 0,
    savings: d.savings || 0,
    net: d.net || 0
  })) : [{
    month: 'CURRENT',
    income: userData.monthlyIncome || 0,
    expenses: 0,
    savings: 0,
    net: userData.monthlyIncome || 0
  }];

  const performanceMetrics = [
    {
      title: 'NET_WORTH',
      value: `₹${(userData.currentNetWorth / 1000).toFixed(0)}K`,
      change: metrics.netWorthChange >= 0 ? `+₹${(metrics.netWorthChange / 1000).toFixed(0)}K` : `₹${(metrics.netWorthChange / 1000).toFixed(0)}K`,
      percentage: `${metrics.monthlyGrowthRate}%`,
      trend: metrics.netWorthChange >= 0 ? 'up' : 'down',
      icon: DollarSign,
      color: metrics.netWorthChange >= 0 ? 'text-primary' : 'text-accent',
      status: 'OPTIMAL'
    },
    {
      title: 'MONTHLY_SAVINGS',
      value: `₹${(metrics.monthlySavings / 1000).toFixed(0)}K`,
      change: metrics.monthlySavings > 0 ? `+₹${(metrics.monthlySavings / 1000).toFixed(0)}K` : '₹0',
      percentage: `${metrics.savingsRate}%`,
      trend: 'up',
      icon: PiggyBank,
      color: 'text-accent',
      status: 'EXCEEDING'
    },
    {
      title: 'SAVINGS_RATE',
      value: `${metrics.savingsRate}%`,
      change: `TARGET: 25%`,
      percentage: parseFloat(metrics.savingsRate) >= 25 ? 'ACHIEVED' : 'IN PROGRESS',
      trend: 'up',
      icon: Target,
      color: 'text-chart-2',
      status: parseFloat(metrics.savingsRate) >= 25 ? 'ACHIEVED' : 'PROGRESS'
    },
    {
      title: 'ROI_YIELD',
      value: `${metrics.roi}%`,
      change: 'YTD',
      percentage: 'STRONG',
      trend: 'up',
      icon: BarChart3,
      color: 'text-chart-3',
      status: 'STRONG'
    },
  ];
  
  const completedMissions = missions.filter(m => m.completed).length;
  const wealthProgress = Math.min((userData.currentNetWorth / 10000000) * 100, 100);

  const handleMissionToggle = async (missionId: string) => {
    const mission = missions.find(m => m.id === missionId);
    if (!mission) return;

    try {
      const response = await authFetch('/missions/complete', {
        method: 'POST',
        body: JSON.stringify({
          missionId,
          xpEarned: mission.xp
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setUserData({
          ...userData,
          xpLevel: data.newXP
        });
        
    setMissions(prev => 
          prev.map(m => 
            m.id === missionId ? { ...m, completed: true } : m
          )
        );
        
        toast.success(`Mission completed! +${mission.xp} XP earned`);
      }
    } catch (error) {
      console.error('Error completing mission:', error);
      toast.error('Failed to complete mission');
    }
  };

  const priorityColors = {
    HIGH: 'text-accent',
    MEDIUM: 'text-primary',
    MED: 'text-primary',
    LOW: 'text-chart-2',
    CRITICAL: 'text-accent'
  };

  // Calculate monthly growth from chart data
  const monthlyGrowth = chartData.length >= 2
    ? chartData[chartData.length - 1].amount - chartData[chartData.length - 2].amount
    : 0;
  
  const growthRate = chartData.length >= 2 && chartData[chartData.length - 2].amount > 0
    ? ((monthlyGrowth / chartData[chartData.length - 2].amount) * 100).toFixed(1)
    : '0';

  return (
    <>
      {/* Transaction Dialog - Moved outside to ensure proper rendering */}
      <Dialog open={isTransactionDialogOpen} onOpenChange={(open) => {
        if (!open) {
          handleCloseTransactionDialog();
        }
      }}>
        <DialogContent className="glass-card border-border max-w-md bg-background">
          <DialogHeader>
            <DialogTitle className="font-heading text-primary">{getDialogTitle()}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="font-data text-primary">AMOUNT (₹)</Label>
              <Input
                type="number"
                value={transactionAmount}
                onChange={(e) => setTransactionAmount(e.target.value)}
                placeholder={getDialogPlaceholders().amount}
                className="mt-2"
                autoFocus
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <Label className="font-data text-primary">DESCRIPTION</Label>
              <Input
                value={transactionDescription}
                onChange={(e) => setTransactionDescription(e.target.value)}
                placeholder={getDialogPlaceholders().description}
                className="mt-2"
              />
            </div>
            <div>
              <Label className="font-data text-primary">CATEGORY</Label>
              <Input
                value={transactionCategory}
                onChange={(e) => setTransactionCategory(e.target.value)}
                placeholder={getDialogPlaceholders().category}
                className="mt-2"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                onClick={handleCloseTransactionDialog}
                className="flex-1"
              >
                CANCEL
              </Button>
              <Button 
                onClick={(e) => {
                  e.preventDefault();
                  handleAddTransaction();
                }}
                className="flex-1 bg-primary hover:bg-primary/90"
                disabled={!transactionAmount || parseFloat(transactionAmount) <= 0}
              >
                {getButtonLabel()}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    <div className="min-h-screen bg-background px-4 py-6 pb-24">
      {/* Header */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-heading text-4xl text-foreground mb-2 glow-text">
                COMMAND CENTER
              </h1>
              <div className="font-data text-sm text-primary">
                [ WEALTH_OPTIMIZATION_PROTOCOL_ACTIVE ]
              </div>
              <p className="text-muted-foreground mt-1">
                Real-time financial intelligence dashboard
              </p>
            </div>
            <div className="text-right">
              <div className="glass-card rounded-lg p-4 hud-corner">
                <p className="font-data text-xs text-primary">CURRENT_MISSION</p>
                <p className="font-data text-lg text-foreground">₹10L_BY_35</p>
                <div className="font-data text-xs text-muted-foreground mt-1">
                  STATUS: {wealthProgress.toFixed(1)}% COMPLETE
                </div>
              </div>
            </div>
          </div>

          {/* System Status Bar */}
          <div className="glass-card rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <span className="font-data text-xs text-primary">SYSTEM_ONLINE</span>
                </div>
                <div className="font-data text-xs text-muted-foreground">
                  STREAK: {userData.streak}D | XP: {userData.xpLevel} | LEVEL: {Math.floor(userData.xpLevel / 1000)}
                </div>
              </div>
              <div className="font-data text-xs text-primary">
                {new Date().toLocaleString()}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Performance Metrics Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-2 gap-4 mb-8"
      >
        {performanceMetrics.map((metric, index) => (
          <div key={index} className="glass-card rounded-lg p-4 hud-corner relative overflow-hidden">
            <div className="scanlines absolute inset-0"></div>
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="font-data text-xs text-primary mb-1">{metric.title}</div>
                  <div className="font-heading text-2xl text-foreground mb-1 glow-text">{metric.value}</div>
                  <div className="flex items-center gap-2">
                    {metric.trend === 'up' ? (
                      <ArrowUpRight className="w-3 h-3 text-primary" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 text-accent" />
                    )}
                    <span className={`font-data text-xs ${metric.color}`}>
                      {metric.change}
                    </span>
                    <span className="font-data text-xs text-muted-foreground">
                      {metric.percentage}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="p-2 bg-primary/20 rounded-lg mb-2">
                    <metric.icon className="w-4 h-4 text-primary" />
                  </div>
                  <Badge className="font-data text-xs bg-primary/20 text-primary border-primary/30">
                    {metric.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 gap-6 mb-8">
        {/* Net Worth Evolution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="glass-card rounded-lg p-6 hud-corner">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-heading text-xl text-foreground mb-1">NET_WORTH_EVOLUTION</h3>
                <div className="font-data text-xs text-primary">[ WEALTH_ACCUMULATION_PROTOCOL ]</div>
              </div>
              <div className="flex items-center gap-4 text-xs font-data">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <span className="text-primary">ACTUAL</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border border-primary rounded-full"></div>
                  <span className="text-muted-foreground">TARGET</span>
                </div>
              </div>
            </div>
            
            <div className="h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={netWorthData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F08D46" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#F08D46" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(240, 141, 70, 0.1)" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#D0D0D0', fontFamily: 'Roboto Mono' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#D0D0D0', fontFamily: 'Roboto Mono' }}
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#F08D46"
                    fill="url(#netWorthGradient)"
                    strokeWidth={3}
                    dot={{ fill: '#F08D46', strokeWidth: 2, r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="target"
                    stroke="#FF5028"
                    strokeDasharray="8 8"
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card rounded p-3 text-center">
                <p className="font-data text-xs text-primary">MONTHLY_GROWTH</p>
                <p className="font-heading text-xl text-primary glow-text">
                  {monthlyGrowth >= 0 ? '+' : ''}₹{(monthlyGrowth / 1000).toFixed(0)}K
                </p>
              </div>
              <div className="glass-card rounded p-3 text-center">
                <p className="font-data text-xs text-accent">GROWTH_RATE</p>
                <p className="font-heading text-xl text-accent glow-text">
                  {growthRate >= 0 ? '+' : ''}{growthRate}%
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Cash Flow Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="glass-card rounded-lg p-6 hud-corner">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-heading text-xl text-foreground mb-1">CASH_FLOW_ANALYSIS</h3>
                <div className="font-data text-xs text-primary">[ RESOURCE_ALLOCATION_MATRIX ]</div>
              </div>
            </div>
            
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashFlowData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(240, 141, 70, 0.1)" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#D0D0D0', fontFamily: 'Roboto Mono' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#D0D0D0', fontFamily: 'Roboto Mono' }}
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="income" fill="#F08D46" radius={[2, 2, 0, 0]} name="Income" />
                  <Bar dataKey="expenses" fill="#FF5028" radius={[2, 2, 0, 0]} name="Expenses" />
                  <Bar dataKey="savings" fill="#D4AF37" radius={[2, 2, 0, 0]} name="Savings" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Mission Control */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mb-8"
      >
        <div className="glass-card rounded-lg p-6 hud-corner">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-heading text-xl text-foreground mb-1">MISSION_CONTROL</h3>
              <div className="font-data text-xs text-primary">[ DAILY_OBJECTIVES_PROTOCOL ]</div>
            </div>
            <div className="flex items-center gap-3">
              {missions.length > 0 && (
              <Badge className="font-data bg-primary/20 text-primary border-primary/30">
                {completedMissions}/{missions.length} COMPLETE
              </Badge>
              )}
              {missions.length === 0 && (
                <Button 
                  size="sm"
                  onClick={generateMissions}
                  className="bg-primary hover:bg-primary/90"
                  disabled={isLoading}
                >
                  {isLoading ? 'Generating...' : 'Generate'}
                </Button>
              )}
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            </div>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading missions...
              </div>
            ) : missions.length === 0 ? (
              <div className="text-center py-8 space-y-4">
                <p className="text-muted-foreground mb-4">No missions available.</p>
                <Button 
                  onClick={generateMissions}
                  className="bg-primary hover:bg-primary/90"
                  disabled={isLoading}
                >
                  {isLoading ? 'Generating...' : 'Generate Missions'}
                </Button>
              </div>
            ) : (
              missions.map((mission, index) => (
              <motion.div
                key={mission.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`glass-card rounded-lg p-4 transition-all duration-200 glitch-hover ${
                  mission.completed ? 'border-primary' : 'border-border'
                }`}
              >
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={mission.completed}
                    onCheckedChange={() => handleMissionToggle(mission.id)}
                      disabled={mission.completed}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  
                  <div className="flex items-center gap-3 flex-1">
                      <span className="text-2xl">{mission.icon || '🎯'}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <p className={`font-medium ${
                          mission.completed ? 'text-primary line-through' : 'text-foreground'
                        }`}>
                          {mission.title}
                        </p>
                          {mission.priority && (
                            <Badge className={`font-data text-xs ${priorityColors[mission.priority as keyof typeof priorityColors] || 'text-primary'} bg-transparent border-current`}>
                          {mission.priority}
                        </Badge>
                          )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {mission.description}
                      </p>
                      <div className="flex items-center gap-3 text-xs">
                        <Badge className="font-data bg-secondary text-secondary-foreground">
                          {mission.category}
                        </Badge>
                        <span className="font-data text-primary">+{mission.xp} XP</span>
                      </div>
                    </div>
                  </div>

                  {mission.completed && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-primary text-xl"
                    >
                      <Zap className="w-5 h-5" />
                    </motion.div>
                  )}
                </div>
              </motion.div>
              ))
            )}
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <div className="glass-card rounded-lg p-6 hud-corner">
          <div className="mb-6">
            <h3 className="font-heading text-xl text-foreground mb-1">QUICK_ACTIONS</h3>
            <div className="font-data text-xs text-primary">[ RAPID_DEPLOYMENT_PROTOCOLS ]</div>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2 glass-card border-border hover:border-primary hover:bg-primary/10 glitch-hover"
              onClick={() => handleOpenTransactionDialog('income')}
            >
              <span className="text-2xl">💰</span>
              <span className="font-data text-sm">ADD_INCOME</span>
            </Button>

            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2 glass-card border-border hover:border-primary hover:bg-primary/10 glitch-hover"
              onClick={() => handleOpenTransactionDialog('investment')}
            >
              <span className="text-2xl">📈</span>
              <span className="font-data text-sm">INVEST</span>
            </Button>

            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2 glass-card border-border hover:border-primary hover:bg-primary/10 glitch-hover"
              onClick={() => handleOpenTransactionDialog('expense')}
            >
              <span className="text-2xl">💳</span>
              <span className="font-data text-sm">LOG_EXPENSE</span>
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
    </>
  );
}