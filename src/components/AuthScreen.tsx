import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Shield, User, Lock, Mail, ChevronRight, Zap, Rocket, AlertCircle } from 'lucide-react';
import { getServerUrl } from '../utils/supabase/client';
import { publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface AuthScreenProps {
  onLogin: (accessToken: string, userData: any) => void;
  onSignup: (userId: string) => void;
}

export function AuthScreen({ onLogin, onSignup }: AuthScreenProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    confirmPassword: '' 
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('Attempting login with:', loginData.email);
      const url = getServerUrl('/login');
      console.log('Login URL:', url);
      
      let response;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            email: loginData.email,
            password: loginData.password,
          }),
        });
      } catch (fetchError: any) {
        console.error('Network/Fetch error:', fetchError);
        throw new Error(`Network error: ${fetchError.message}. Is the server running?`);
      }

      console.log('Login response status:', response.status);
      console.log('Login response ok:', response.ok);
      
      let data;
      try {
        const text = await response.text();
        console.log('Login response text:', text);
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('Server returned invalid response. Check if the server is running.');
      }
      
      console.log('Login response data:', data);

      if (!response.ok) {
        throw new Error(data.error || `Login failed with status ${response.status}`);
      }

      // Store auth token and user data
      localStorage.setItem('solo_levelling_token', data.accessToken);
      localStorage.setItem('solo_levelling_user', JSON.stringify(data.userData));
      
      toast.success('Access granted! Welcome back, Agent.');
      onLogin(data.accessToken, data.userData);
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err.message || 'Failed to login. Check console for details.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (signupData.password !== signupData.confirmPassword) {
      setError('Passwords do not match');
      toast.error('Access codes do not match');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Attempting signup with:', signupData.email, signupData.name);
      const url = getServerUrl('/signup');
      console.log('Signup URL:', url);
      
      let response;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            email: signupData.email,
            password: signupData.password,
            name: signupData.name,
          }),
        });
      } catch (fetchError: any) {
        console.error('Network/Fetch error:', fetchError);
        throw new Error(`Network error: ${fetchError.message}. Is the server running?`);
      }

      console.log('Signup response status:', response.status);
      console.log('Signup response ok:', response.ok);
      
      let data;
      try {
        const text = await response.text();
        console.log('Signup response text:', text);
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('Server returned invalid response. Check if the server is running.');
      }
      
      console.log('Signup response data:', data);

      if (!response.ok) {
        throw new Error(data.error || `Signup failed with status ${response.status}`);
      }

      // Store auth token
      localStorage.setItem('solo_levelling_token', data.accessToken);
      localStorage.setItem('solo_levelling_user', data.userId);

      toast.success('Agent profile created! Initializing onboarding...');
      onSignup(data.userId);
    } catch (err: any) {
      console.error('Signup error:', err);
      const errorMessage = err.message || 'Failed to create account. Check console for details.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      {/* Starfield Background */}
      <div className="starfield">
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className="star"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${Math.random() * 2 + 2}s`
            }}
          />
        ))}
      </div>

      {/* Animated Grid Background */}
      <div className="absolute inset-0 z-0 opacity-10">
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: `
              linear-gradient(rgba(240, 141, 70, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(240, 141, 70, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* HUD Corner Elements */}
      <div className="fixed top-4 left-4 z-10 font-data text-xs text-muted-foreground">
        <div className="data-stream">
          SYSTEM: STANDBY<br/>
          AUTH: REQUIRED<br/>
          TIME: {new Date().toLocaleTimeString()}
        </div>
      </div>

      <div className="fixed top-4 right-4 z-10 font-data text-xs text-primary text-right">
        <div className="data-stream">
          PROJECT: CYGNUS<br/>
          VERSION: v2.0.1<br/>
          STATUS: ONLINE
        </div>
      </div>

      {/* Main Auth Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo/Header Section */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full glass-card mb-4 glow-border"
          >
            <Shield className="w-10 h-10 text-primary" />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="font-heading text-4xl text-foreground mb-2 glow-text"
          >
            SOLO LEVELLING
          </motion.h1>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="font-data text-sm text-primary mb-2"
          >
            [ WEALTH_INTELLIGENCE_SYSTEM ]
          </motion.div>
          
          <p className="text-muted-foreground text-sm">
            Access the command center to level up your wealth
          </p>
        </div>

        {/* Auth Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="glass-card rounded-lg p-8 hud-corner relative overflow-hidden"
        >
          <div className="scanlines absolute inset-0"></div>
          
          <div className="relative z-10">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')}>
              <TabsList className="grid w-full grid-cols-2 mb-8 glass-card p-1">
                <TabsTrigger 
                  value="login" 
                  className="font-data data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
                >
                  ACCESS
                </TabsTrigger>
                <TabsTrigger 
                  value="signup"
                  className="font-data data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
                >
                  REGISTER
                </TabsTrigger>
              </TabsList>

              {/* Login Form */}
              <TabsContent value="login" className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    <span className="font-data text-xs text-primary">AUTHENTICATION_PROTOCOL</span>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 glass-card border border-red-500/50 rounded-lg flex items-center gap-2 text-red-400">
                      <AlertCircle className="w-4 h-4" />
                      <span className="font-data text-xs">{error}</span>
                    </div>
                  )}

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="font-data text-xs text-foreground">
                        EMAIL_ADDRESS
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="agent@cygnus.com"
                          value={loginData.email}
                          onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                          className="pl-10 glass-card border-border bg-input-background font-data text-foreground placeholder:text-muted-foreground focus:border-primary"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="font-data text-xs text-foreground">
                        ACCESS_CODE
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="••••••••"
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          className="pl-10 glass-card border-border bg-input-background font-data text-foreground placeholder:text-muted-foreground focus:border-primary"
                          required
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-data mt-6 glitch-hover group"
                    >
                      {isLoading ? 'AUTHENTICATING...' : 'INITIATE_ACCESS'}
                      <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </form>

                  <div className="mt-4 text-center">
                    <button className="text-xs text-muted-foreground hover:text-primary transition-colors font-data">
                      FORGOT_ACCESS_CODE?
                    </button>
                  </div>
                </motion.div>
              </TabsContent>

              {/* Signup Form */}
              <TabsContent value="signup" className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                    <span className="font-data text-xs text-accent">NEW_AGENT_REGISTRATION</span>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 glass-card border border-red-500/50 rounded-lg flex items-center gap-2 text-red-400">
                      <AlertCircle className="w-4 h-4" />
                      <span className="font-data text-xs">{error}</span>
                    </div>
                  )}

                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name" className="font-data text-xs text-foreground">
                        AGENT_NAME
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="Enter your name"
                          value={signupData.name}
                          onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                          className="pl-10 glass-card border-border bg-input-background font-data text-foreground placeholder:text-muted-foreground focus:border-primary"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="font-data text-xs text-foreground">
                        EMAIL_ADDRESS
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="agent@cygnus.com"
                          value={signupData.email}
                          onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                          className="pl-10 glass-card border-border bg-input-background font-data text-foreground placeholder:text-muted-foreground focus:border-primary"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="font-data text-xs text-foreground">
                        ACCESS_CODE
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="••••••••"
                          value={signupData.password}
                          onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                          className="pl-10 glass-card border-border bg-input-background font-data text-foreground placeholder:text-muted-foreground focus:border-primary"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm-password" className="font-data text-xs text-foreground">
                        CONFIRM_CODE
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signup-confirm-password"
                          type="password"
                          placeholder="••••••••"
                          value={signupData.confirmPassword}
                          onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                          className="pl-10 glass-card border-border bg-input-background font-data text-foreground placeholder:text-muted-foreground focus:border-primary"
                          required
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-data mt-6 glitch-hover group"
                    >
                      {isLoading ? 'CREATING_PROFILE...' : 'CREATE_AGENT_PROFILE'}
                      <Rocket className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </form>
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-8 grid grid-cols-3 gap-4"
        >
          <div className="glass-card rounded-lg p-4 text-center">
            <Zap className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="font-data text-xs text-muted-foreground">AI_POWERED</p>
          </div>
          <div className="glass-card rounded-lg p-4 text-center">
            <Shield className="w-6 h-6 text-accent mx-auto mb-2" />
            <p className="font-data text-xs text-muted-foreground">SECURE</p>
          </div>
          <div className="glass-card rounded-lg p-4 text-center">
            <Rocket className="w-6 h-6 text-chart-3 mx-auto mb-2" />
            <p className="font-data text-xs text-muted-foreground">GAMIFIED</p>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="font-data text-xs text-muted-foreground">
            © 2025 PROJECT_CYGNUS | WEALTH_INTELLIGENCE_DIVISION
          </p>
        </div>
      </motion.div>
    </div>
  );
}