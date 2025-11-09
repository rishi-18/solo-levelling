import React, { useState, useEffect } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { OnboardingScreen } from './components/OnboardingScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { MissionScreen } from './components/MissionScreen';
import { ProgressScreen } from './components/ProgressScreen';
import { CommunityScreen } from './components/CommunityScreen';
import { BottomNavigation } from './components/BottomNavigation';
import { Toaster } from './components/ui/sonner';
import { authFetch } from './utils/supabase/client';

export interface UserData {
  age: number;
  targetAge: number;
  monthlyIncome: number;
  currentSavings: number;
  currentNetWorth: number;
  xpLevel: number;
  streak: number;
  savingsRate: number;
  isOnboarded: boolean;
  roleModel?: string;
  interests?: string[];
}

export type Screen = 'auth' | 'onboarding' | 'dashboard' | 'missions' | 'progress' | 'community';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<Screen>('auth');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [userData, setUserData] = useState<UserData>({
    age: 25,
    targetAge: 35,
    monthlyIncome: 0,
    currentSavings: 0,
    currentNetWorth: 0,
    xpLevel: 0,
    streak: 0,
    savingsRate: 0,
    isOnboarded: false,
  });

  // Check localStorage for existing auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('solo_levelling_token');
        
        if (!token) {
          // No token, show auth screen
          setIsCheckingAuth(false);
          setIsAuthenticated(false);
          setCurrentScreen('auth');
          return;
        }

        // Verify token with server and get user data
        try {
          const response = await authFetch('/profile');
          
          // Handle non-OK responses
          if (!response.ok) {
            let errorData;
            try {
              errorData = await response.json();
            } catch {
              errorData = { error: 'Authentication failed' };
            }
            
            console.warn('Auth check failed:', response.status, errorData);
            
            // Clear invalid token
            localStorage.removeItem('solo_levelling_token');
            localStorage.removeItem('solo_levelling_user');
            setIsCheckingAuth(false);
            setIsAuthenticated(false);
            setCurrentScreen('auth');
            return;
          }
          
          const data = await response.json();
          
          if (data.success) {
            setIsAuthenticated(true);
            
            // Check if user has completed onboarding
            if (data.userData && data.userData.isOnboarded) {
              setUserData(prev => ({ ...prev, ...data.userData, isOnboarded: true }));
              setCurrentScreen('dashboard');
            } else {
              setCurrentScreen('onboarding');
            }
          } else {
            // Invalid token, clear storage
            localStorage.removeItem('solo_levelling_token');
            localStorage.removeItem('solo_levelling_user');
            setIsAuthenticated(false);
            setCurrentScreen('auth');
          }
        } catch (error: any) {
          console.error('Auth check error:', error);
          
          // Clear token on any error
          localStorage.removeItem('solo_levelling_token');
          localStorage.removeItem('solo_levelling_user');
          setIsAuthenticated(false);
          setCurrentScreen('auth');
        }
      } catch (error: any) {
        console.error('Unexpected error during auth check:', error);
        setIsAuthenticated(false);
        setCurrentScreen('auth');
      } finally {
        setIsCheckingAuth(false);
      }
    };
    
    checkAuth();
  }, []);

  const handleLogin = (accessToken: string, serverUserData: any) => {
    console.log('handleLogin called with userData:', serverUserData);
    console.log('isOnboarded flag:', serverUserData?.isOnboarded);
    
    setIsCheckingAuth(false);
    setIsAuthenticated(true);
    
    // Check if user has completed onboarding
    if (serverUserData && serverUserData.isOnboarded) {
      console.log('User has completed onboarding, navigating to dashboard');
      setUserData(prev => ({ ...prev, ...serverUserData, isOnboarded: true }));
      setCurrentScreen('dashboard');
    } else {
      console.log('User has NOT completed onboarding, navigating to onboarding screen');
      setCurrentScreen('onboarding');
    }
  };

  const handleSignup = (userId: string) => {
    setIsCheckingAuth(false);
    setIsAuthenticated(true);
    // New users always go through onboarding
    setCurrentScreen('onboarding');
  };

  const handleOnboardingComplete = async (data: Partial<UserData>) => {
    const updatedUserData = { ...data, isOnboarded: true };
    
    // Save onboarding data to server first
    try {
      console.log('Saving onboarding data to server:', updatedUserData);
      const response = await authFetch('/update-profile', {
        method: 'POST',
        body: JSON.stringify(updatedUserData),
      });
      
      const result = await response.json();
      console.log('Server response:', result);
      
      if (!response.ok) {
        console.error('Failed to save onboarding data:', result.error);
        throw new Error(result.error || 'Failed to save onboarding data');
      }
      
      console.log('Onboarding data saved successfully!');
      
      // Only update local state and navigate after successful save
      setUserData(prev => ({ ...prev, ...updatedUserData }));
      setCurrentScreen('dashboard');
      
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      // Still navigate but show error
      setUserData(prev => ({ ...prev, ...updatedUserData }));
      setCurrentScreen('dashboard');
    }
  };

  const renderScreen = () => {
    // Show loading state while checking authentication
    if (isCheckingAuth) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="font-data text-sm text-muted-foreground">INITIALIZING_SYSTEM...</p>
          </div>
        </div>
      );
    }

    // Always show auth screen if not authenticated
    if (!isAuthenticated) {
      return <AuthScreen onLogin={handleLogin} onSignup={handleSignup} />;
    }

    // Render authenticated screens
    switch (currentScreen) {
      case 'onboarding':
        return <OnboardingScreen onComplete={handleOnboardingComplete} />;
      case 'dashboard':
        return <DashboardScreen userData={userData} setUserData={setUserData} />;
      case 'missions':
        return <MissionScreen userData={userData} setUserData={setUserData} />;
      case 'progress':
        return <ProgressScreen userData={userData} />;
      case 'community':
        return <CommunityScreen userData={userData} />;
      default:
        return <DashboardScreen userData={userData} setUserData={setUserData} />;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 relative">
      <Toaster position="top-center" richColors />
      
      {/* Show background elements only when authenticated */}
      {isAuthenticated && (
        <>
          {/* Starfield Background */}
          <div className="starfield">
            {[...Array(50)].map((_, i) => (
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
          
          {/* HUD Corner Elements */}
          <div className="fixed top-4 left-4 z-10 font-data text-xs text-muted-foreground">
            <div className="data-stream">
              SYSTEM: ACTIVE<br/>
              USER: AUTHENTICATED<br/>
              TIME: {new Date().toLocaleTimeString()}
            </div>
          </div>
          
          <div className="fixed top-4 right-4 z-10 font-data text-xs text-muted-foreground text-right">
            <div className="data-stream">
              NET_WORTH: ₹{userData.currentNetWorth.toLocaleString()}<br/>
              STREAK: {userData.streak}D<br/>
              LEVEL: {Math.floor(userData.xpLevel / 1000)}
            </div>
          </div>
        </>
      )}

      {renderScreen()}
      
      {isAuthenticated && userData.isOnboarded && (
        <BottomNavigation 
          currentScreen={currentScreen} 
          onScreenChange={setCurrentScreen} 
        />
      )}
    </div>
  );
}