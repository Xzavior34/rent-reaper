import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

interface StatCardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  icon: LucideIcon;
  variant?: 'default' | 'warning' | 'success';
  delay?: number;
}

export const StatCard = ({
  label,
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  icon: Icon,
  variant = 'default',
  delay = 0,
}: StatCardProps) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(value, increment * step);
      setDisplayValue(current);

      if (step >= steps) {
        clearInterval(timer);
        setDisplayValue(value);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  const variantStyles = {
    default: 'border-border',
    warning: 'border-accent/50 glow-orange',
    success: 'border-primary/50 glow-green',
  };

  const textStyles = {
    default: 'text-foreground',
    warning: 'text-accent text-glow-orange',
    success: 'text-primary text-glow-green',
  };

  const iconStyles = {
    default: 'text-muted-foreground bg-secondary',
    warning: 'text-accent bg-accent/10',
    success: 'text-primary bg-primary/10',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className={`p-6 rounded-xl bg-card border ${variantStyles[variant]} backdrop-blur-sm`}
    >
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
        <div className={`p-2 rounded-lg ${iconStyles[variant]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className={`text-4xl font-bold font-mono ${textStyles[variant]}`}>
        {prefix && <span className="text-lg mr-0.5">{prefix}</span>}
        {decimals > 0 ? displayValue.toFixed(decimals) : Math.floor(displayValue)}
        {suffix && <span className="text-lg ml-1 text-muted-foreground">{suffix}</span>}
      </p>
    </motion.div>
  );
};
