import React from 'react';
import { motion } from 'motion/react';
import { Screen } from '../App';

interface BottomNavigationProps {
  currentScreen: Screen;
  onScreenChange: (screen: Screen) => void;
}

const navItems = [
  { 
    key: 'dashboard' as Screen, 
    label: 'COMMAND', 
    icon: '🏠',
    activeIcon: '🏠',
    code: 'CMD'
  },
  { 
    key: 'missions' as Screen, 
    label: 'MISSIONS', 
    icon: '⚔️',
    activeIcon: '⚔️',
    code: 'MSN'
  },
  { 
    key: 'progress' as Screen, 
    label: 'ANALYTICS', 
    icon: '📊',
    activeIcon: '📊',
    code: 'ANA'
  },
  { 
    key: 'community' as Screen, 
    label: 'NETWORK', 
    icon: '👥',
    activeIcon: '👥',
    code: 'NET'
  },
];

export function BottomNavigation({ currentScreen, onScreenChange }: BottomNavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 glass-card border-t border-border px-4 py-3 safe-area-pb">
      {/* HUD Status Bar */}
      <div className="flex justify-between items-center mb-3 px-2">
        <div className="font-data text-xs text-primary">
          [NAV_SYSTEM_ONLINE]
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 bg-primary rounded-full animate-pulse"></div>
          <div className="font-data text-xs text-muted-foreground">
            ACTIVE_MODULE: {navItems.find(item => item.key === currentScreen)?.code}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = currentScreen === item.key;
          
          return (
            <motion.button
              key={item.key}
              onClick={() => onScreenChange(item.key)}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all relative hud-corner ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              {/* Active indicator background */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary/10 rounded-lg border border-primary/30"
                  initial={false}
                  transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                />
              )}
              
              {/* Icon with glow effect */}
              <motion.div
                className={`relative text-xl mb-1 ${isActive ? 'glow-text' : ''}`}
                animate={{ 
                  scale: isActive ? 1.1 : 1,
                  rotateY: isActive ? [0, 10, -10, 0] : 0,
                }}
                transition={{ 
                  duration: 0.3,
                  rotateY: { duration: 0.6 }
                }}
              >
                {isActive ? item.activeIcon : item.icon}
              </motion.div>
              
              {/* Label */}
              <span className={`font-data text-xs relative ${
                isActive ? 'text-primary glow-text' : 'text-muted-foreground'
              }`}>
                {item.label}
              </span>
              
              {/* Active HUD indicator */}
              {isActive && (
                <>
                  <motion.div
                    className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-primary"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  />
                  <motion.div
                    className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-primary"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  />
                  <motion.div
                    className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4 }}
                  />
                </>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Bottom Status Line */}
      <div className="flex justify-center mt-2">
        <div className="font-data text-xs text-muted-foreground">
          {new Date().toLocaleTimeString()} // SYSTEM_STABLE
        </div>
      </div>
    </div>
  );
}