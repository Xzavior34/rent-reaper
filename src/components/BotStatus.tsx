import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Clock, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SweepLog {
  timestamp: string;
  signature: string;
  accountsClosed: number;
  solReclaimed: number;
  status: 'success' | 'partial' | 'failed';
}

interface SweepHistory {
  lastSweep: string | null;
  totalReclaimed: number;
  totalAccountsClosed: number;
  logs: SweepLog[];
}

interface BotStatusProps {
  className?: string;
}

export function BotStatus({ className = '' }: BotStatusProps) {
  const [isActive, setIsActive] = useState(false);
  const [lastSweep, setLastSweep] = useState<string | null>(null);
  const [totalReclaimed, setTotalReclaimed] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // Check for sweep history (in production, this would fetch from API/storage)
    const checkBotStatus = async () => {
      try {
        // Try to load from localStorage for demo purposes
        const stored = localStorage.getItem('korakeep-sweep-history');
        if (stored) {
          const history: SweepHistory = JSON.parse(stored);
          setLastSweep(history.lastSweep);
          setTotalReclaimed(history.totalReclaimed);
          setIsActive(true);
        } else {
          // Check if bot environment is configured
          // In production, this would be an API call
          setIsActive(false);
        }
      } catch {
        setIsActive(false);
      }
    };

    checkBotStatus();
    // Refresh every 30 seconds
    const interval = setInterval(checkBotStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatTimeAgo = (timestamp: string) => {
    const now = Date.now();
    const then = new Date(timestamp).getTime();
    const diff = now - then;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const statusConfig = isActive
    ? {
        icon: Bot,
        label: 'Bot Active',
        color: 'text-primary',
        bgColor: 'bg-primary/10',
        borderColor: 'border-primary/30',
        pulseColor: 'bg-primary',
      }
    : {
        icon: Bot,
        label: 'Bot Inactive',
        color: 'text-muted-foreground',
        bgColor: 'bg-muted/50',
        borderColor: 'border-muted-foreground/20',
        pulseColor: 'bg-muted-foreground',
      };

  const StatusIcon = statusConfig.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full border ${statusConfig.bgColor} ${statusConfig.borderColor} cursor-pointer select-none ${className}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Pulse indicator */}
            {isActive && (
              <motion.span
                className={`absolute left-2 w-2 h-2 rounded-full ${statusConfig.pulseColor}`}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [1, 0.5, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            )}
            
            <StatusIcon className={`w-4 h-4 ${statusConfig.color} ${isActive ? 'ml-2' : ''}`} />
            
            <span className={`text-sm font-medium ${statusConfig.color}`}>
              {statusConfig.label}
            </span>

            <AnimatePresence>
              {isActive && isHovered && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex items-center gap-1.5 overflow-hidden"
                >
                  <span className="text-xs text-muted-foreground">•</span>
                  <Zap className="w-3 h-3 text-accent" />
                  <span className="text-xs font-medium text-accent whitespace-nowrap">
                    {totalReclaimed.toFixed(4)} SOL
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </TooltipTrigger>
        
        <TooltipContent 
          side="bottom" 
          className="max-w-xs p-4 bg-card border border-border"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {isActive ? (
                <CheckCircle2 className="w-4 h-4 text-primary" />
              ) : (
                <AlertCircle className="w-4 h-4 text-muted-foreground" />
              )}
              <span className="font-semibold">
                {isActive ? 'Auto-Sweep Active' : 'Auto-Sweep Not Configured'}
              </span>
            </div>
            
            {isActive ? (
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    Last sweep: {lastSweep ? formatTimeAgo(lastSweep) : 'Never'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Total reclaimed: {totalReclaimed.toFixed(4)} SOL</span>
                </div>
                <p className="pt-1 text-xs">
                  The bot runs every 6 hours to automatically sweep dust accounts.
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Configure the KORA_OPERATOR_KEY environment variable and deploy 
                the cron job to enable automatic sweeping.
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default BotStatus;
