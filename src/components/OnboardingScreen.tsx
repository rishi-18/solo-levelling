import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent } from './ui/card';
import { Progress } from './ui/progress';
import { UserData } from '../App';

interface OnboardingScreenProps {
  onComplete: (data: Partial<UserData>) => void;
}

const goalOptions = [
  { value: 'wealth_freedom', label: 'Financial Freedom', icon: '🎯', description: 'Build wealth to achieve independence' },
  { value: 'business', label: 'Start a Business', icon: '🚀', description: 'Create and scale your own venture' },
  { value: 'career_growth', label: 'Career Growth', icon: '📈', description: 'Advance in your professional journey' },
];

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedGoal, setSelectedGoal] = useState('');
  const [targetAge, setTargetAge] = useState([35]);
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleComplete = async () => {
    setIsProcessing(true);
    
    // Simulate AI processing with boot sequence
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    onComplete({
      targetAge: targetAge[0],
      monthlyIncome: parseInt(monthlyIncome) || 50000,
      currentSavings: Math.floor((parseInt(monthlyIncome) || 50000) * 0.5), // Start with reasonable savings
      currentNetWorth: Math.floor((parseInt(monthlyIncome) || 50000) * 2.5), // Start with reasonable net worth
      xpLevel: 0, // Start at 0
      streak: 0,
      savingsRate: 20,
      interests: [selectedGoal],
    });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return selectedGoal !== '';
      case 2: return targetAge[0] > 25;
      case 3: return monthlyIncome !== '';
      default: return false;
    }
  };

  const progressValue = (currentStep / 3) * 100;

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Background Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(240, 141, 70, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(240, 141, 70, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Floating Abstract Elements */}
      <div className="absolute inset-0">
        {[
          { icon: '₹', top: '15%', left: '8%', size: 'text-4xl', delay: 0 },
          { icon: '📊', top: '25%', right: '12%', size: 'text-3xl', delay: 0.5 },
          { icon: '💹', top: '45%', left: '15%', size: 'text-3xl', delay: 1 },
          { icon: '🎯', top: '60%', right: '20%', size: 'text-4xl', delay: 1.5 },
          { icon: '💰', bottom: '20%', left: '10%', size: 'text-3xl', delay: 2 },
        ].map((item, index) => (
          <motion.div
            key={index}
            className={`absolute ${item.size} text-primary/20 glow-text`}
            style={{
              top: item.top,
              bottom: item.bottom,
              left: item.left,
              right: item.right,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.4, 0.2],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              delay: item.delay,
              ease: "easeInOut",
            }}
          >
            {item.icon}
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <div className="pt-20 pb-8 px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="mb-8">
              <h1 className="font-heading text-5xl text-foreground mb-3 glow-text">
                SOLO LEVELLING
              </h1>
              <div className="font-data text-sm text-primary mb-4">
                [ INITIALIZING WEALTH PROTOCOL ]
              </div>
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                Advanced AI-powered wealth optimization system
              </p>
            </div>
          </motion.div>
          
          {/* HUD Progress Display */}
          <div className="max-w-sm mx-auto">
            <div className="relative w-24 h-24 mx-auto mb-6 hud-corner">
              <div className="absolute inset-2">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="rgba(240, 141, 70, 0.2)"
                    strokeWidth="4"
                    fill="none"
                  />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="#F08D46"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${2.83 * 45}`}
                    initial={{ strokeDashoffset: 2.83 * 45 }}
                    animate={{ strokeDashoffset: 2.83 * 45 * (1 - progressValue / 100) }}
                    transition={{ duration: 0.8 }}
                    className="glow-border"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="font-data text-2xl text-primary glow-text">
                      {Math.round(progressValue)}%
                    </div>
                    <div className="font-data text-xs text-muted-foreground">
                      INIT
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="font-data text-sm text-muted-foreground">
              PHASE {currentStep} OF 3 // SYSTEM CONFIGURATION
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 px-6 max-w-lg mx-auto w-full">
          {/* Step 1: Goal Selection */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="glass-card rounded-lg p-8 hud-corner">
                <div className="text-center mb-8">
                  <h2 className="font-heading text-3xl text-foreground mb-3 glow-text">
                    MISSION PARAMETERS
                  </h2>
                  <div className="font-data text-xs text-primary mb-4">
                    [ SELECT PRIMARY OBJECTIVE ]
                  </div>
                  <p className="text-muted-foreground">
                    Define your wealth-building protocol
                  </p>
                </div>

                <div className="space-y-4">
                  <Label className="font-data text-primary">OBJECTIVE_TYPE:</Label>
                  <Select value={selectedGoal} onValueChange={setSelectedGoal}>
                    <SelectTrigger className="h-14 bg-input-background border-border text-foreground font-data">
                      <SelectValue placeholder=">> SELECT MISSION TYPE" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {goalOptions.map((goal) => (
                        <SelectItem key={goal.value} value={goal.value} className="py-4 font-data">
                          <div className="flex items-center gap-4">
                            <span className="text-2xl">{goal.icon}</span>
                            <div>
                              <p className="font-medium text-foreground">{goal.label}</p>
                              <p className="text-sm text-muted-foreground">{goal.description}</p>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Target Age */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="glass-card rounded-lg p-8 hud-corner">
                <div className="text-center mb-8">
                  <h2 className="font-heading text-3xl text-foreground mb-3 glow-text">
                    TIMELINE CONFIGURATION
                  </h2>
                  <div className="font-data text-xs text-primary mb-4">
                    [ SET TARGET PARAMETERS ]
                  </div>
                  <p className="text-muted-foreground">
                    When do you want to achieve financial freedom?
                  </p>
                </div>

                <div className="text-center mb-8">
                  <div className="text-6xl mb-4 glow-text">🎯</div>
                  <div className="glass-card rounded-lg p-6 mb-6">
                    <div className="font-data text-4xl text-primary glow-text mb-2">
                      AGE {targetAge[0]}
                    </div>
                    <div className="font-data text-sm text-muted-foreground">
                      TARGET: ₹10,00,000 BY {targetAge[0]}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <Label className="font-data text-primary mb-4 block">
                      TARGET_AGE: {targetAge[0]} YEARS
                    </Label>
                    <Slider
                      value={targetAge}
                      onValueChange={setTargetAge}
                      max={45}
                      min={25}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between font-data text-xs text-muted-foreground mt-2">
                      <span>25</span>
                      <span>45</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Current Income */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="glass-card rounded-lg p-8 hud-corner">
                <div className="text-center mb-8">
                  <h2 className="font-heading text-3xl text-foreground mb-3 glow-text">
                    RESOURCE ASSESSMENT
                  </h2>
                  <div className="font-data text-xs text-primary mb-4">
                    [ INPUT CURRENT PARAMETERS ]
                  </div>
                  <p className="text-muted-foreground">
                    Current monthly resource allocation
                  </p>
                </div>

                <div className="text-center mb-8">
                  <div className="text-6xl mb-4 glow-text">💼</div>
                </div>

                <div className="space-y-6">
                  <div>
                    <Label className="font-data text-primary mb-3 block">
                      MONTHLY_INCOME (₹):
                    </Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary text-xl font-data">
                        ₹
                      </span>
                      <Input
                        type="number"
                        value={monthlyIncome}
                        onChange={(e) => setMonthlyIncome(e.target.value)}
                        className="pl-12 h-16 text-xl bg-input-background border-border text-foreground font-data"
                        placeholder="50000"
                      />
                    </div>
                  </div>
                </div>

                {!isProcessing && (
                  <Button
                    onClick={handleComplete}
                    disabled={!canProceed()}
                    className="w-full h-14 mt-8 bg-primary hover:bg-accent text-primary-foreground font-data text-lg shadow-lg disabled:opacity-50 glow-border glitch-hover"
                  >
                    [ INITIATE SOLO LEVELLING PROTOCOL ]
                  </Button>
                )}

                {isProcessing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center mt-8"
                  >
                    <div className="glass-card rounded-lg p-6 mb-4">
                      <motion.div
                        animate={{ 
                          rotate: 360,
                          scale: [1, 1.1, 1] 
                        }}
                        transition={{ 
                          rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                          scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
                        }}
                        className="text-5xl mb-4 glow-text"
                      >
                        ⚡
                      </motion.div>
                      <div className="font-data text-primary glow-text mb-2">
                        INITIALIZING AI WEALTH PROTOCOL...
                      </div>
                      <div className="font-data text-xs text-muted-foreground">
                        CALIBRATING FINANCIAL ALGORITHMS<br/>
                        OPTIMIZING INVESTMENT STRATEGIES<br/>
                        GENERATING PERSONALIZED MISSIONS
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Navigation Footer */}
        {!isProcessing && currentStep < 3 && (
          <div className="px-6 pb-8">
            <div className="max-w-lg mx-auto">
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="w-full h-14 bg-primary hover:bg-accent text-primary-foreground font-data text-lg shadow-lg disabled:opacity-50 glow-border glitch-hover"
              >
                [ CONTINUE PROTOCOL ]
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}