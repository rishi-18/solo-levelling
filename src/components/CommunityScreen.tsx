import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Trophy, Users, TrendingUp, Share2, Calendar, Target, Zap, Award } from 'lucide-react';
import { UserData } from '../App';
import { authFetch } from '../utils/supabase/client';

interface CommunityScreenProps {
  userData: UserData;
}

interface LeaderboardUser {
  id: string;
  name: string;
  email: string;
  xp: number;
  level: number;
  streak: number;
  rank: number;
  badge: string;
  callsign: string;
  growthRate: number;
  isCurrentUser?: boolean;
}

const activeChallenges = [
  {
    id: '1',
    title: 'OPERATION_SIP_STREAK',
    description: 'Execute SIP investments for 7 consecutive days',
    participants: 156,
    timeLeft: '3 DAYS',
    reward: 100,
    progress: 42,
    icon: '📈',
    status: 'ACTIVE',
    difficulty: 'MEDIUM'
  },
  {
    id: '2',
    title: 'KNOWLEDGE_ACQUISITION',
    description: 'Complete 5 financial intelligence modules',
    participants: 89,
    timeLeft: '5 DAYS',
    reward: 75,
    progress: 60,
    icon: '📚',
    status: 'ACTIVE',
    difficulty: 'EASY'
  },
  {
    id: '3',
    title: 'SAVINGS_PROTOCOL_1K',
    description: 'Allocate minimum ₹1000 daily for 7 days',
    participants: 234,
    timeLeft: '2 DAYS',
    reward: 80,
    progress: 28,
    icon: '💰',
    status: 'CRITICAL',
    difficulty: 'HARD'
  }
];

const achievements = [
  {
    id: '1',
    title: 'FIRST_DEPLOYMENT',
    description: 'Executed initial SIP investment',
    icon: '🎯',
    unlocked: true,
    unlockedDate: '2024-02-15',
    rarity: 'COMMON'
  },
  {
    id: '2',
    title: 'STREAK_COMMANDER',
    description: 'Maintained 30-day mission streak',
    icon: '🔥',
    unlocked: false,
    progress: 23,
    rarity: 'RARE'
  },
  {
    id: '3',
    title: 'KNOWLEDGE_OPERATIVE',
    description: 'Completed 10 intelligence modules',
    icon: '📘',
    unlocked: true,
    unlockedDate: '2024-03-10',
    rarity: 'UNCOMMON'
  },
  {
    id: '4',
    title: 'NETWORK_ARCHITECT',
    description: 'Connected with 50 agents',
    icon: '🤝',
    unlocked: false,
    progress: 32,
    rarity: 'EPIC'
  }
];

const rarityColors = {
  COMMON: 'text-muted-foreground',
  UNCOMMON: 'text-chart-2',
  RARE: 'text-primary',
  EPIC: 'text-accent'
};

export function CommunityScreen({ userData }: CommunityScreenProps) {
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [joinedChallenges, setJoinedChallenges] = useState<string[]>(['2']);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const response = await authFetch('/leaderboard');
      const data = await response.json();
      
      if (data.success && data.leaderboard) {
        // Format leaderboard data with badges and callsigns
        const formatted = data.leaderboard.map((user: any, index: number) => {
          const badges = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
          const callsigns = ['ALPHA', 'PHOENIX', 'ORION', 'NOVA', 'TITAN', 'TITAN', 'ZEUS', 'ATLAS'];
          
          // Calculate growth rate (simplified - would need historical data)
          const growthRate = 5 + Math.random() * 10;
          
          return {
            id: user.email || index.toString(),
            name: user.name || 'Agent',
            email: user.email,
            xp: user.xp || 0,
            level: user.level || Math.floor((user.xp || 0) / 100),
            growthRate: parseFloat(growthRate.toFixed(1)),
            streak: user.streak || 0,
            rank: user.rank || index + 1,
            badge: badges[index] || `${index + 1}️⃣`,
            callsign: callsigns[index] || 'AGENT',
            isCurrentUser: user.isCurrentUser || false
          };
        });
        setLeaderboardData(formatted);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate user's rank
  const userRank = leaderboardData.findIndex(u => u.isCurrentUser) + 1;

  const handleJoinChallenge = (challengeId: string) => {
    setJoinedChallenges(prev => [...prev, challengeId]);
  };

  const handleShareAchievement = (achievementId: string) => {
    // In a real app, this would open sharing options
    console.log(`Sharing achievement ${achievementId}`);
  };

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
            NETWORK_HUB
          </h1>
          <div className="font-data text-sm text-primary mb-2">
            [ AGENT_COLLABORATION_CENTER ]
          </div>
          <p className="text-muted-foreground">
            Connect with fellow operatives and share victories
          </p>
        </motion.div>
      </div>

      {/* User Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-3 gap-3 mb-8"
      >
        <div className="glass-card rounded-lg p-4 hud-corner text-center relative overflow-hidden">
          <div className="scanlines absolute inset-0"></div>
          <div className="relative z-10">
            <div className="text-2xl mb-1">🏆</div>
            <p className="font-heading text-xl text-primary glow-text">
              {userRank > 0 ? `${userRank}${userRank === 1 ? 'ST' : userRank === 2 ? 'ND' : userRank === 3 ? 'RD' : 'TH'}` : 'N/A'}
            </p>
            <p className="font-data text-xs text-muted-foreground">RANK</p>
          </div>
        </div>

        <div className="glass-card rounded-lg p-4 hud-corner text-center relative overflow-hidden">
          <div className="scanlines absolute inset-0"></div>
          <div className="relative z-10">
            <div className="text-2xl mb-1">⚡</div>
            <p className="font-heading text-xl text-accent glow-text">{userData.xpLevel}</p>
            <p className="font-data text-xs text-muted-foreground">XP_TOTAL</p>
          </div>
        </div>

        <div className="glass-card rounded-lg p-4 hud-corner text-center relative overflow-hidden">
          <div className="scanlines absolute inset-0"></div>
          <div className="relative z-10">
            <div className="text-2xl mb-1">📈</div>
            <p className="font-heading text-xl text-chart-3 glow-text">
              {leaderboardData.find(u => u.isCurrentUser)?.growthRate?.toFixed(1) || '0'}%
            </p>
            <p className="font-data text-xs text-muted-foreground">GROWTH</p>
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
          <TabsList className="grid w-full grid-cols-3 mb-8 glass-card p-1">
            <TabsTrigger 
              value="leaderboard"
              className="font-data data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
            >
              RANKS
            </TabsTrigger>
            <TabsTrigger 
              value="challenges"
              className="font-data data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
            >
              MISSIONS
            </TabsTrigger>
            <TabsTrigger 
              value="achievements"
              className="font-data data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
            >
              BADGES
            </TabsTrigger>
          </TabsList>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-4">
            <div className="glass-card rounded-lg p-6 hud-corner">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-heading text-xl text-foreground mb-1">TOP_OPERATIVES</h3>
                  <div className="font-data text-xs text-primary">[ WEEKLY_RANKINGS ]</div>
                </div>
                <Trophy className="w-6 h-6 text-primary" />
              </div>
              
              <div className="space-y-3">
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading leaderboard...
                  </div>
                ) : leaderboardData.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No leaderboard data available yet.
                  </div>
                ) : (
                  leaderboardData.map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={`glass-card rounded-lg p-4 glitch-hover ${
                      user.isCurrentUser 
                        ? 'border-2 border-primary' 
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className="text-2xl">{user.badge || `${user.rank}️⃣`}</div>

                      {/* Avatar & Info */}
                      <div className="flex items-center gap-3 flex-1">
                        <Avatar className="w-10 h-10 border-2 border-primary/30">
                          <AvatarFallback className="bg-primary/20 text-primary font-data">
                            {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-data text-sm text-foreground">
                              {user.callsign || user.name}
                              {user.isCurrentUser && (
                                <span className="text-primary ml-2">[YOU]</span>
                              )}
                            </p>
                            <Badge className="font-data text-xs bg-primary/20 text-primary border-primary/30">
                              LVL_{user.level}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-3 font-data text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Zap className="w-3 h-3 text-primary" />
                              {user.xp}
                            </span>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3 text-accent" />
                              +{user.growthRate?.toFixed(1) || '0'}%
                            </span>
                            <span>🔥 {user.streak || 0}D</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )))}
              </div>
            </div>

            {/* Social Sharing */}
            <div className="glass-card rounded-lg p-6 hud-corner text-center">
              <div className="text-4xl mb-3">🎉</div>
              <h3 className="font-heading text-xl text-foreground mb-2">
                BROADCAST_PROGRESS
              </h3>
              <p className="text-sm text-muted-foreground mb-4 font-data">
                Share your achievements with your network
              </p>
              <div className="flex gap-3 justify-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 glass-card border-border hover:border-primary hover:bg-primary/10 font-data glitch-hover"
                >
                  <Share2 className="w-4 h-4" />
                  LINKEDIN
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 glass-card border-border hover:border-primary hover:bg-primary/10 font-data glitch-hover"
                >
                  <Share2 className="w-4 h-4" />
                  TWITTER
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Challenges Tab */}
          <TabsContent value="challenges" className="space-y-4">
            {activeChallenges.map((challenge, index) => (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="glass-card rounded-lg p-6 hud-corner relative overflow-hidden">
                  <div className="scanlines absolute inset-0"></div>
                  <div className="relative z-10">
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">{challenge.icon}</div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-data text-sm text-foreground">
                            {challenge.title}
                          </h4>
                          <Badge 
                            className={`font-data text-xs ${
                              challenge.status === 'CRITICAL' 
                                ? 'bg-accent/20 text-accent border-accent/30' 
                                : 'bg-primary/20 text-primary border-primary/30'
                            }`}
                          >
                            {challenge.status}
                          </Badge>
                        </div>
                        
                        <p className="text-xs text-muted-foreground mb-3">
                          {challenge.description}
                        </p>
                        
                        <div className="flex items-center gap-4 mb-3 font-data text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {challenge.participants}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {challenge.timeLeft}
                          </span>
                          <span className="flex items-center gap-1">
                            <Target className="w-3 h-3 text-primary" />
                            +{challenge.reward} XP
                          </span>
                        </div>

                        {joinedChallenges.includes(challenge.id) && (
                          <div className="mb-3">
                            <div className="flex justify-between font-data text-xs text-muted-foreground mb-1">
                              <span>PROGRESS</span>
                              <span>{challenge.progress}%</span>
                            </div>
                            <Progress value={challenge.progress} className="h-2" />
                          </div>
                        )}
                        
                        <div className="flex justify-end">
                          {joinedChallenges.includes(challenge.id) ? (
                            <Badge className="bg-primary text-primary-foreground font-data">
                              DEPLOYED
                            </Badge>
                          ) : (
                            <Button 
                              size="sm"
                              onClick={() => handleJoinChallenge(challenge.id)}
                              className="bg-primary hover:bg-primary/90 text-primary-foreground font-data glitch-hover"
                            >
                              ACCEPT_MISSION
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {achievements.map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className={`glass-card rounded-lg p-6 hud-corner relative overflow-hidden ${
                    achievement.unlocked 
                      ? 'border-primary' 
                      : ''
                  }`}>
                    <div className="scanlines absolute inset-0"></div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-4">
                        <div className={`text-4xl ${
                          achievement.unlocked ? 'grayscale-0' : 'grayscale opacity-40'
                        }`}>
                          {achievement.icon}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className={`font-data text-sm ${
                              achievement.unlocked ? 'text-foreground' : 'text-muted-foreground'
                            }`}>
                              {achievement.title}
                            </h4>
                            {achievement.unlocked && (
                              <Badge className="bg-primary text-primary-foreground font-data text-xs">
                                UNLOCKED
                              </Badge>
                            )}
                            <Badge 
                              variant="outline" 
                              className={`font-data text-xs ml-auto ${rarityColors[achievement.rarity as keyof typeof rarityColors]}`}
                            >
                              {achievement.rarity}
                            </Badge>
                          </div>
                          
                          <p className="text-xs text-muted-foreground mb-2">
                            {achievement.description}
                          </p>
                          
                          {achievement.unlocked && achievement.unlockedDate && (
                            <p className="font-data text-xs text-primary">
                              UNLOCKED: {new Date(achievement.unlockedDate).toLocaleDateString()}
                            </p>
                          )}
                          
                          {!achievement.unlocked && achievement.progress && (
                            <div>
                              <div className="flex justify-between font-data text-xs text-muted-foreground mb-1">
                                <span>PROGRESS</span>
                                <span>{achievement.progress}/50</span>
                              </div>
                              <Progress value={(achievement.progress / 50) * 100} className="h-2" />
                            </div>
                          )}
                        </div>
                        
                        {achievement.unlocked && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleShareAchievement(achievement.id)}
                            className="gap-2 glass-card border-border hover:border-primary hover:bg-primary/10 font-data glitch-hover"
                          >
                            <Share2 className="w-3 h-3" />
                            SHARE
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
