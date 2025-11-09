import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { ChevronDown, ChevronRight, Zap, Target, Clock, Award } from 'lucide-react';
import { toast } from 'sonner';
import { UserData } from '../App';
import { authFetch, testBackendConnection } from '../utils/supabase/client';

// Types
interface MissionScreenProps {
  userData: UserData;
  setUserData: (data: UserData) => void;
}

interface Mission {
  id: string;
  title: string;
  description: string;
  icon: string;
  xp: number;
  category: 'SAVE' | 'LEARN' | 'EARN' | 'NETWORK';
  completed: boolean;
  timeEstimate: string;
  whyItMatters: string;
  tips: string[];
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  classification: 'ALPHA' | 'BETA' | 'GAMMA' | 'DELTA';
}

// Constants
const categoryColors = {
  SAVE: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30', accent: 'bg-primary' },
  LEARN: { bg: 'bg-chart-2/10', text: 'text-chart-2', border: 'border-chart-2/30', accent: 'bg-chart-2' },
  EARN: { bg: 'bg-accent/10', text: 'text-accent', border: 'border-accent/30', accent: 'bg-accent' },
  NETWORK: { bg: 'bg-chart-3/10', text: 'text-chart-3', border: 'border-chart-3/30', accent: 'bg-chart-3' },
};

const priorityColors = {
  CRITICAL: 'text-accent',
  HIGH: 'text-primary',
  MEDIUM: 'text-chart-2',
  LOW: 'text-muted-foreground'
};

const classificationColors = {
  ALPHA: 'text-accent',
  BETA: 'text-primary',
  GAMMA: 'text-chart-2',
  DELTA: 'text-muted-foreground'
};

// Main Component
export function MissionScreen({ userData, setUserData }: MissionScreenProps) {
  // State
  const [missionStates, setMissionStates] = useState<Mission[]>([]);
  const [expandedMission, setExpandedMission] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Effects
  useEffect(() => {
    loadMissions();
  }, []);

  // Computed values
  const completedCount = missionStates.filter(m => m.completed).length;
  const totalXP = missionStates.filter(m => m.completed).reduce((sum, m) => sum + m.xp, 0);
  const completionPercentage = missionStates.length > 0 ? (completedCount / missionStates.length) * 100 : 0;

  // Mission loading and generation
  const loadMissions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Try to load missions from backend first
      try {
        const response = await authFetch('/missions');
        const data = await response.json();
        
        if (response.ok && data.success && data.data?.missions && Array.isArray(data.data.missions) && data.data.missions.length > 0) {
          // Format missions from backend
          const formattedMissions = data.data.missions.map((m: any) => ({
            id: m.id || `mission_${Date.now()}`,
            title: m.title || 'Mission',
            description: m.description || '',
            icon: m.icon || '🎯',
            xp: m.xp || 20,
            category: (m.category || 'LEARN') as 'SAVE' | 'LEARN' | 'EARN' | 'NETWORK',
            completed: m.completed || false,
            timeEstimate: m.timeEstimate || '10_MIN',
            priority: (m.priority || 'MEDIUM') as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
            classification: (m.classification || 'BETA') as 'ALPHA' | 'BETA' | 'GAMMA' | 'DELTA',
            whyItMatters: m.whyItMatters || 'This mission helps you progress towards your financial goals.',
            tips: Array.isArray(m.tips) ? m.tips : ['Complete this mission to earn XP']
          }));
          setMissionStates(formattedMissions);
          return;
        }
      } catch (backendError: any) {
        console.warn('Failed to load missions from backend, generating locally:', backendError.message);
      }
      
      // Fallback to local mission generation
      const missions = generateLocalMissions();
      setMissionStates(missions);
      
      // Try to save local missions to backend
      try {
        await authFetch('/missions', {
          method: 'POST',
          body: JSON.stringify({ missions: missions.map(m => ({ ...m, completed: false })) })
        });
      } catch (saveError) {
        console.warn('Could not save missions to backend:', saveError);
      }
    } catch (err: any) {
      console.error('Failed to load missions:', err);
      setError(err.message || 'Failed to load missions');
      toast.error('Failed to load missions');
      // Still show local missions as fallback
      setMissionStates(generateLocalMissions());
    } finally {
      setIsLoading(false);
    }
  };

  const generateLocalMissions = (): Mission[] => {
    const monthlyIncome = userData.monthlyIncome || 50000;
    const goal = userData.interests?.[0] || 'wealth freedom';
    
    return [
      {
        id: `mission_1_${Date.now()}`,
        title: 'Execute savings protocol',
        description: `Allocate ₹${Math.max(200, Math.floor(monthlyIncome * 0.05))} to emergency buffer`,
        icon: '💰',
        xp: 20,
        category: 'SAVE',
        completed: false,
        timeEstimate: '2_MIN',
        priority: 'HIGH',
        classification: 'ALPHA',
        whyItMatters: 'Emergency fund protocols create financial stability barriers against unexpected system failures.',
        tips: ['Implement automatic transfer protocols', 'Round-up transaction algorithms']
      },
      {
        id: `mission_2_${Date.now()}`,
        title: 'Knowledge acquisition module',
        description: goal === 'business' ? 'Research 2 startup ideas' : 'Complete investment strategy learning protocol',
        icon: '📘',
        xp: 15,
        category: 'LEARN',
        completed: false,
        timeEstimate: '5_MIN',
        priority: 'HIGH',
        classification: 'BETA',
        whyItMatters: 'Financial intelligence upgrades optimize decision-making algorithms and prevent costly system errors.',
        tips: ['Active note-taking during data acquisition', 'Apply learned algorithms to portfolio systems']
      },
      {
        id: `mission_3_${Date.now()}`,
        title: 'Revenue stream expansion',
        description: goal === 'business' ? 'Create business plan outline' : 'Submit 2 freelance proposals',
        icon: '💼',
        xp: 30,
        category: 'EARN',
        completed: false,
        timeEstimate: '30_MIN',
        priority: 'HIGH',
        classification: 'ALPHA',
        whyItMatters: 'Multiple revenue streams accelerate wealth accumulation velocity and provide system redundancy.',
        tips: ['Customize each proposal for target client systems', 'Highlight relevant skill matrices']
      },
      {
        id: `mission_4_${Date.now()}`,
        title: 'Network expansion protocol',
        description: 'Establish 2 professional node connections',
        icon: '🤝',
        xp: 25,
        category: 'NETWORK',
        completed: false,
        timeEstimate: '15_MIN',
        priority: 'MEDIUM',
        classification: 'GAMMA',
        whyItMatters: 'Network node expansion increases opportunity discovery rates and collaborative wealth generation potential.',
        tips: ['Deploy personalized connection requests', 'Reference mutual network nodes']
      },
      {
        id: `mission_5_${Date.now()}`,
        title: 'Investment analysis protocol',
        description: 'Research 3 investment opportunity matrices',
        icon: '📊',
        xp: 25,
        category: 'LEARN',
        completed: false,
        timeEstimate: '20_MIN',
        priority: 'HIGH',
        classification: 'BETA',
        whyItMatters: 'Investment analysis protocols optimize return algorithms and minimize risk exposure vectors.',
        tips: ['Analyze expense ratio metrics', 'Review fund management intelligence']
      }
    ];
  };

  // Event handlers
  const handleMissionComplete = async (missionId: string) => {
    const mission = missionStates.find(m => m.id === missionId);
    if (!mission || isLoading || mission.completed) return;

    try {
      setIsLoading(true);
      
      // Call backend API to complete mission
      try {
        const response = await authFetch('/missions/complete', {
          method: 'POST',
          body: JSON.stringify({
            missionId,
            xpEarned: mission.xp
          })
        });

        const data = await response.json();
        
        if (response.ok && data.success) {
          // Update local state
          setMissionStates(prev => 
            prev.map(m => m.id === missionId ? { ...m, completed: true } : m)
          );

          // Update user data with new XP
          setUserData({
            ...userData,
            xpLevel: data.newXP || (userData.xpLevel || 0) + mission.xp
          });

          toast.success(`Mission completed! +${mission.xp} XP earned`);
          
          // Reload missions to get updated state from backend
          await loadMissions();
        } else {
          throw new Error(data.error || 'Failed to complete mission');
        }
      } catch (apiError: any) {
        console.error('Error calling mission completion API:', apiError);
        
        // Fallback: Update local state only if API fails
        setMissionStates(prev => 
          prev.map(m => m.id === missionId ? { ...m, completed: true } : m)
        );

        setUserData({
          ...userData,
          xpLevel: (userData.xpLevel || 0) + mission.xp
        });

        toast.warning(`Mission marked complete locally. +${mission.xp} XP (backend sync failed)`);
      }
    } catch (error: any) {
      console.error('Error completing mission:', error);
      toast.error(`Failed to complete mission: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMissionDetails = (missionId: string) => {
    setExpandedMission(expandedMission === missionId ? null : missionId);
  };

  // Render helpers
  const renderMissionCard = (mission: Mission, index: number) => {
    const colors = categoryColors[mission.category];
    const isExpanded = expandedMission === mission.id;

    return (
      <motion.div
        key={mission.id}
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: index * 0.1 }}
        className="relative pl-20"
      >
        {/* Mission card content */}
        <div className={`glass-card rounded-lg ${
          mission.completed ? 'border-primary glow-border' : 'border-border'
        }`}>
          <Collapsible>
            <CollapsibleTrigger asChild>
              <div 
                className="w-full p-6 cursor-pointer"
                onClick={() => toggleMissionDetails(mission.id)}
              >
                {/* Mission header content */}
                <div className="flex items-start gap-4">
                  <span className="text-3xl">{mission.icon}</span>
                  <div className="flex-1">
                    {/* Mission title and badges */}
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className={`font-heading text-lg ${
                        mission.completed ? 'text-primary' : 'text-foreground'
                      }`}>
                        {mission.title}
                      </h4>
                      <Badge className={`font-data text-xs ${colors.bg} ${colors.text} ${colors.border}`}>
                        {mission.category}
                      </Badge>
                    </div>
                    
                    {/* Mission description and metadata */}
                    <p className="text-sm text-muted-foreground mb-3">
                      {mission.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span className="font-data text-muted-foreground">
                          {mission.timeEstimate}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-primary" />
                        <span className="font-data text-primary">+{mission.xp} XP</span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-3">
                    {!mission.completed && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMissionComplete(mission.id);
                        }}
                        className="bg-primary hover:bg-accent text-primary-foreground font-data"
                      >
                        EXECUTE
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CollapsibleTrigger>

            {/* Expandable mission details */}
            <AnimatePresence>
              {isExpanded && (
                <CollapsibleContent>
                  {/* Mission details content */}
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="px-6 pb-6 border-t border-border/50"
                  >
                    {/* Mission analysis and tips */}
                    <div className="pt-6 space-y-6">
                      <div className="glass-card rounded p-4">
                        <h5 className="font-data text-sm text-primary mb-3">
                          STRATEGIC_ANALYSIS
                        </h5>
                        <p className="text-sm text-muted-foreground">
                          {mission.whyItMatters}
                        </p>
                      </div>

                      {/* Tactical Guidelines */}
                      <div className="glass-card rounded p-4">
                        <h5 className="font-data text-sm text-accent mb-3 flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          TACTICAL_PROTOCOLS
                        </h5>
                        <ul className="space-y-2">
                          {mission.tips.map((tip, tipIndex) => (
                            <li key={tipIndex} className="text-sm text-muted-foreground flex items-start gap-3">
                              <span className="text-primary font-data text-xs mt-1">
                                [{(tipIndex + 1).toString().padStart(2, '0')}]
                              </span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                </CollapsibleContent>
              )}
            </AnimatePresence>
          </Collapsible>
        </div>
      </motion.div>
    );
  };

  // Main render
  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <h1 className="font-heading text-4xl text-foreground mb-2">
          MISSION_CONTROL
        </h1>
        <p className="text-muted-foreground">
          Execute daily protocols to advance wealth optimization
        </p>
      </motion.div>

      {/* Progress overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mb-8"
      >
        <div className="glass-card rounded-lg p-6">
          <Progress value={completionPercentage} className="mb-4" />
          <div className="flex justify-between text-sm">
            <span>{completedCount}/{missionStates.length} Complete</span>
            <span>XP Earned: {totalXP}</span>
          </div>
        </div>
      </motion.div>

      {/* Generate Missions Button */}
      {missionStates.length === 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-6"
        >
          <div className="glass-card rounded-lg p-6 text-center">
            <p className="text-muted-foreground mb-4">No missions available. Generate personalized missions to get started!</p>
            <Button 
              onClick={async () => {
                try {
                  setIsLoading(true);
                  toast.loading('Generating personalized missions...', { id: 'generate-missions' });
                  
                  // Try to generate missions from backend
                  try {
                    const backendOk = await testBackendConnection();
                    if (backendOk) {
                      const response = await authFetch('/missions/generate', { method: 'POST' });
                      if (response.ok) {
                        const data = await response.json();
                        if (data.success && data.missions && Array.isArray(data.missions) && data.missions.length > 0) {
                          const formattedMissions = data.missions.map((m: any) => ({
                            id: m.id || `mission_${Date.now()}`,
                            title: m.title || 'Mission',
                            description: m.description || '',
                            icon: m.icon || '🎯',
                            xp: m.xp || 20,
                            category: (m.category || 'LEARN') as 'SAVE' | 'LEARN' | 'EARN' | 'NETWORK',
                            completed: false,
                            timeEstimate: m.timeEstimate || '10_MIN',
                            priority: (m.priority || 'MEDIUM') as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
                            classification: (m.classification || 'BETA') as 'ALPHA' | 'BETA' | 'GAMMA' | 'DELTA',
                            whyItMatters: m.whyItMatters || 'This mission helps you progress towards your financial goals.',
                            tips: Array.isArray(m.tips) ? m.tips : ['Complete this mission to earn XP']
                          }));
                          setMissionStates(formattedMissions);
                          toast.success(`Generated ${formattedMissions.length} missions successfully!`, { id: 'generate-missions' });
                          return;
                        }
                      }
                    }
                  } catch (backendError: any) {
                    console.warn('Backend mission generation failed, using local fallback:', backendError.message);
                  }
                  
                  // Fallback to local mission generation
                  const localMissions = generateLocalMissions();
                  setMissionStates(localMissions);
                  
                  // Try to save to backend
                  try {
                    await authFetch('/missions', {
                      method: 'POST',
                      body: JSON.stringify({ missions: localMissions.map(m => ({ ...m, completed: false })) })
                    });
                  } catch (saveError) {
                    console.warn('Could not save missions to backend:', saveError);
                  }
                  
                  toast.success(`Generated ${localMissions.length} missions!`, { id: 'generate-missions' });
                } catch (error: any) {
                  console.error('Error generating missions:', error);
                  toast.error(`Failed to generate missions: ${error.message || 'Unknown error'}`, { id: 'generate-missions' });
                } finally {
                  setIsLoading(false);
                }
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-data"
              disabled={isLoading}
            >
              {isLoading ? 'GENERATING...' : 'GENERATE_MISSIONS'}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Mission list */}
      <div className="space-y-6">
        {isLoading && missionStates.length === 0 ? (
          <div className="text-center py-12">Loading missions...</div>
        ) : missionStates.length === 0 ? (
          null // Handled by generate button above
        ) : (
          missionStates.map((mission, index) => renderMissionCard(mission, index))
        )}
      </div>
    </div>
  );
}