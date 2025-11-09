import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Tooltip, CartesianGrid } from 'recharts';
import { TrendingUp, Target, Calendar, DollarSign, ArrowUpRight } from 'lucide-react';
import { UserData } from '../App';
import { authFetch } from '../utils/supabase/client';

interface ProgressScreenProps {
  userData: UserData;
}

interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'saving' | 'investment';
  amount: number;
  category?: string;
  description?: string;
  date: string;
}

interface Milestone {
  id: number;
  title: string;
  amount: number;
  icon: string;
  completed: boolean;
  completedDate?: string;
  progress?: number;
  description: string;
  category: string;
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

export function ProgressScreen({ userData }: ProgressScreenProps) {
  const [activeTab, setActiveTab] = useState('journey');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const response = await authFetch('/transactions');
      const data = await response.json();
      
      if (data.success) {
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate milestones from real data
  const calculateMilestones = (): Milestone[] => {
    const totalSavings = transactions
      .filter(t => t.type === 'saving')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalInvestments = transactions
      .filter(t => t.type === 'investment')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const currentNetWorth = userData.currentNetWorth;
    const monthlyIncome = userData.monthlyIncome || 50000;
    const emergencyFund6M = monthlyIncome * 6;

    const milestones: Milestone[] = [
      {
        id: 1,
        title: 'EMERGENCY_FUND_10K',
        amount: 10000,
        icon: '🛡️',
        completed: totalSavings >= 10000,
        completedDate: totalSavings >= 10000 ? new Date().toISOString() : undefined,
        description: 'Build basic financial security',
        category: 'SECURITY',
        progress: Math.min((totalSavings / 10000) * 100, 100)
      },
      {
        id: 2,
        title: 'FIRST_SIP_INVESTMENT',
        amount: 5000,
        icon: '📈',
        completed: totalInvestments >= 5000,
        completedDate: totalInvestments >= 5000 ? new Date().toISOString() : undefined,
        description: 'Start systematic investing',
        category: 'INVESTMENT',
        progress: Math.min((totalInvestments / 5000) * 100, 100)
      },
      {
        id: 3,
        title: 'SAVINGS_TARGET_50K',
        amount: 50000,
        icon: '💰',
        completed: totalSavings >= 50000,
        description: 'Build substantial savings base',
        category: 'SAVINGS',
        progress: Math.min((totalSavings / 50000) * 100, 100)
      },
      {
        id: 4,
        title: 'EMERGENCY_BUFFER_6M',
        amount: emergencyFund6M,
        icon: '🏦',
        completed: totalSavings >= emergencyFund6M,
        description: 'Complete financial security',
        category: 'SECURITY',
        progress: Math.min((totalSavings / emergencyFund6M) * 100, 100)
      },
      {
        id: 5,
        title: 'NET_WORTH_5L_MILESTONE',
        amount: 500000,
        icon: '🎯',
        completed: currentNetWorth >= 500000,
        description: 'Major wealth milestone',
        category: 'WEALTH',
        progress: Math.min((currentNetWorth / 500000) * 100, 100)
      },
      {
        id: 6,
        title: 'FINANCIAL_FREEDOM_1CR',
        amount: 10000000,
        icon: '👑',
        completed: currentNetWorth >= 10000000,
        description: 'Ultimate goal achieved',
        category: 'FREEDOM',
        progress: Math.min((currentNetWorth / 10000000) * 100, 100)
      }
    ];

    return milestones;
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
        const txDate = new Date(t.date);
        return txDate.getMonth() === monthDate.getMonth() && 
               txDate.getFullYear() === monthDate.getFullYear();
      });

      const savings = monthTransactions
        .filter(t => t.type === 'saving')
        .reduce((sum, t) => sum + t.amount, 0);

      const investments = monthTransactions
        .filter(t => t.type === 'investment')
        .reduce((sum, t) => sum + t.amount, 0);

      // Calculate net worth for this month
      const transactionsAfterMonth = transactions.filter(t => {
        const txDate = new Date(t.date);
        return txDate > new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      });
      
      let netWorth = userData.currentNetWorth;
      netWorth = transactionsAfterMonth.reduce((sum, t) => {
        if (t.type === 'income' || t.type === 'saving' || t.type === 'investment') {
          return sum - t.amount;
        } else {
          return sum + t.amount;
        }
      }, netWorth);

      chartData.push({
        month: monthLabel,
        monthKey,
        amount: netWorth,
        savings,
        investments
      });
    }

    return chartData;
  };

  // Calculate savings rate data
  const calculateSavingsRateData = () => {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const currentDate = new Date();
    const data: any[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthLabel = months[monthDate.getMonth()];
      
      const monthTransactions = transactions.filter(t => {
        const txDate = new Date(t.date);
        return txDate.getMonth() === monthDate.getMonth() && 
               txDate.getFullYear() === monthDate.getFullYear();
      });

      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const savings = monthTransactions
        .filter(t => t.type === 'saving')
        .reduce((sum, t) => sum + t.amount, 0);

      const rate = income > 0 ? (savings / income) * 100 : 0;

      data.push({
        month: monthLabel,
        rate: Math.round(rate),
        target: 25
      });
    }

    return data;
  };

  // Calculate monthly breakdown
  const calculateMonthlyBreakdown = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthTransactions = transactions.filter(t => {
      const txDate = new Date(t.date);
      return txDate.getMonth() === currentMonth && 
             txDate.getFullYear() === currentYear;
    });

    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const savings = monthTransactions
      .filter(t => t.type === 'saving')
      .reduce((sum, t) => sum + t.amount, 0);

    const investments = monthTransactions
      .filter(t => t.type === 'investment')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return [
      { category: 'INCOME', amount: income || userData.monthlyIncome || 0, color: '#F08D46' },
      { category: 'SAVINGS', amount: savings, color: '#D4AF37' },
      { category: 'INVESTMENTS', amount: investments, color: '#FF7A00' },
      { category: 'EXPENSES', amount: expenses, color: '#FF5028' },
    ];
  };

  const milestones = calculateMilestones();
  const netWorthHistory = generateChartData();
  const savingsRateData = calculateSavingsRateData();
  const monthlyBreakdown = calculateMonthlyBreakdown();

  const completedMilestones = milestones.filter(m => m.completed).length;
  const currentNetWorthProgress = (userData.currentNetWorth / 10000000) * 100;

  // Calculate monthly growth
  const monthlyGrowth = netWorthHistory.length >= 2
    ? netWorthHistory[netWorthHistory.length - 1].amount - netWorthHistory[netWorthHistory.length - 2].amount
    : 0;
  
  const growthRate = netWorthHistory.length >= 2 && netWorthHistory[netWorthHistory.length - 2].amount > 0
    ? ((monthlyGrowth / netWorthHistory[netWorthHistory.length - 2].amount) * 100).toFixed(1)
    : '0';

  // Calculate current savings rate
  const currentSavingsRate = savingsRateData.length > 0
    ? savingsRateData[savingsRateData.length - 1].rate
    : 0;

  return (
    <div className="min-h-screen bg-background px-4 py-6 pb-24">
      {/* Header */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-heading text-4xl text-foreground mb-2 glow-text">
            ANALYTICS_CENTER
          </h1>
          <div className="font-data text-sm text-primary mb-2">
            [ WEALTH_TRACKING_PROTOCOL ]
          </div>
          <p className="text-muted-foreground">
            Real-time journey visualization and milestone tracking
          </p>
        </motion.div>
      </div>

      {/* Key Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-2 gap-4 mb-8"
      >
        <div className="glass-card rounded-lg p-4 hud-corner relative overflow-hidden">
          <div className="scanlines absolute inset-0"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-data text-xs text-primary">NET_WORTH</p>
                <p className="font-heading text-xl text-foreground glow-text">
                  ₹{(userData.currentNetWorth / 1000).toFixed(0)}K
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-lg p-4 hud-corner relative overflow-hidden">
          <div className="scanlines absolute inset-0"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/20 rounded-lg">
                <Target className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="font-data text-xs text-accent">MILESTONES</p>
                <p className="font-heading text-xl text-foreground glow-text">
                  {completedMilestones}/6 COMPLETE
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-8 glass-card p-1">
            <TabsTrigger 
              value="journey"
              className="font-data data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
            >
              JOURNEY
            </TabsTrigger>
            <TabsTrigger 
              value="analytics"
              className="font-data data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
            >
              ANALYTICS
            </TabsTrigger>
          </TabsList>

          {/* Wealth Journey Tab */}
          <TabsContent value="journey" className="space-y-6">
            {/* Progress to ₹1Cr */}
            <div className="glass-card rounded-lg p-6 hud-corner">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <h3 className="font-heading text-xl text-foreground">PATH_TO_FREEDOM</h3>
                <span className="text-2xl ml-auto">🎯</span>
              </div>
              
              <div className="mb-6">
                <div className="flex justify-between font-data text-xs text-muted-foreground mb-2">
                  <span>CURRENT: ₹{(userData.currentNetWorth / 100000).toFixed(1)}L</span>
                  <span>TARGET: ₹100L</span>
                </div>
                <Progress value={currentNetWorthProgress} className="h-3 mb-2" />
                <p className="font-data text-xs text-primary">
                  COMPLETION: {currentNetWorthProgress.toFixed(2)}%
                </p>
              </div>
              
              <div className="text-center glass-card rounded-lg p-4">
                <p className="font-data text-xs text-muted-foreground mb-1">REMAINING_BALANCE</p>
                <p className="font-heading text-3xl text-primary glow-text mb-1">
                  ₹{((10000000 - userData.currentNetWorth) / 100000).toFixed(1)}L
                </p>
                <p className="font-data text-xs text-muted-foreground">
                  ETA: {userData.targetAge - userData.age} YEARS
                </p>
              </div>
            </div>

            {/* Milestone Timeline */}
            <div className="glass-card rounded-lg p-6 hud-corner">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-heading text-xl text-foreground mb-1">MILESTONE_PROTOCOL</h3>
                  <div className="font-data text-xs text-primary">[ ACHIEVEMENT_TRACKING ]</div>
                </div>
                <Badge className="font-data bg-primary/20 text-primary border-primary/30">
                  {completedMilestones}/6
                </Badge>
              </div>
              
              <div className="space-y-4">
                {milestones.map((milestone, index) => (
                  <motion.div
                    key={milestone.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="relative"
                  >
                    {/* Timeline connector */}
                    {index < milestones.length - 1 && (
                      <div className="absolute left-6 top-16 w-0.5 h-8 bg-border"></div>
                    )}
                    
                    <div className="glass-card rounded-lg p-4 glitch-hover">
                      <div className="flex items-start gap-4">
                        {/* Status indicator */}
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg border-2 ${
                          milestone.completed 
                            ? 'bg-primary/20 border-primary text-primary' 
                            : 'bg-transparent border-border text-muted-foreground'
                        }`}>
                          {milestone.completed ? '✓' : milestone.icon}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className={`font-data text-sm ${
                              milestone.completed ? 'text-primary' : 'text-foreground'
                            }`}>
                              {milestone.title}
                            </h4>
                            {milestone.completed && (
                              <Badge className="font-data text-xs bg-primary/20 text-primary border-primary/30">
                                COMPLETE
                              </Badge>
                            )}
                            <Badge variant="outline" className="font-data text-xs ml-auto">
                              {milestone.category}
                            </Badge>
                          </div>
                          
                          <p className="text-xs text-muted-foreground mb-2">
                            {milestone.description}
                          </p>
                          
                          {!milestone.completed && milestone.progress && (
                            <div>
                              <Progress value={milestone.progress} className="h-2 mb-1" />
                              <p className="font-data text-xs text-primary">
                                PROGRESS: {milestone.progress}%
                              </p>
                            </div>
                          )}
                          
                          {milestone.completedDate && (
                            <p className="font-data text-xs text-muted-foreground">
                              COMPLETED: {new Date(milestone.completedDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {/* Net Worth Growth */}
            <div className="glass-card rounded-lg p-6 hud-corner">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-heading text-xl text-foreground mb-1">NET_WORTH_EVOLUTION</h3>
                  <div className="font-data text-xs text-primary">[ GROWTH_ANALYSIS ]</div>
                </div>
              </div>
              
              <div className="h-48 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={netWorthHistory} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                      name="Net Worth"
                    />
                  </AreaChart>
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

            {/* Savings Rate Trend */}
            <div className="glass-card rounded-lg p-6 hud-corner">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-heading text-xl text-foreground mb-1">SAVINGS_RATE_ANALYSIS</h3>
                  <div className="font-data text-xs text-primary">[ EFFICIENCY_METRICS ]</div>
                </div>
              </div>
              
              <div className="h-40 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={savingsRateData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="rate" 
                      stroke="#F08D46" 
                      strokeWidth={3}
                      dot={{ fill: '#F08D46', r: 4 }}
                      name="Rate"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="target" 
                      stroke="#FF5028" 
                      strokeDasharray="8 8"
                      strokeWidth={2}
                      dot={false}
                      name="Target"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="glass-card rounded p-3 text-center">
                  <p className="font-heading text-2xl text-primary glow-text">{currentSavingsRate}%</p>
                  <p className="font-data text-xs text-primary">CURRENT_RATE</p>
                </div>
                <div className="glass-card rounded p-3 text-center">
                  <p className="font-heading text-2xl text-accent glow-text">25%</p>
                  <p className="font-data text-xs text-accent">TARGET_RATE</p>
                </div>
              </div>
            </div>

            {/* Monthly Breakdown */}
            <div className="glass-card rounded-lg p-6 hud-corner">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-heading text-xl text-foreground mb-1">RESOURCE_ALLOCATION</h3>
                  <div className="font-data text-xs text-primary">[ MONTHLY_BREAKDOWN ]</div>
                </div>
              </div>
              
              <div className="h-40 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyBreakdown} layout="horizontal" margin={{ top: 20, right: 30, left: 80, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(240, 141, 70, 0.1)" />
                    <XAxis 
                      type="number" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#D0D0D0', fontFamily: 'Roboto Mono' }}
                      tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="category" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#D0D0D0', fontFamily: 'Roboto Mono' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="amount" fill="#F08D46" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="space-y-2">
                {monthlyBreakdown.map((item, index) => (
                  <div key={index} className="glass-card rounded p-3 flex items-center justify-between glitch-hover">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="font-data text-xs text-foreground">{item.category}</span>
                    </div>
                    <span className="font-data text-sm text-primary">
                      ₹{item.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
