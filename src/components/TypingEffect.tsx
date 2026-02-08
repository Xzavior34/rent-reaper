import { useState, useEffect, forwardRef } from 'react';
import { motion } from 'framer-motion';

interface TypingEffectProps {
  text: string;
  delay?: number;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}

export const TypingEffect = forwardRef<HTMLSpanElement, TypingEffectProps>(({
  text,
  delay = 0,
  speed = 50,
  className = '',
  onComplete,
}, ref) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let currentIndex = 0;

    const startTyping = () => {
      const typeNextChar = () => {
        if (currentIndex < text.length) {
          setDisplayedText(text.slice(0, currentIndex + 1));
          currentIndex++;
          timeout = setTimeout(typeNextChar, speed);
        } else {
          setIsComplete(true);
          onComplete?.();
        }
      };

      timeout = setTimeout(typeNextChar, delay);
    };

    startTyping();

    return () => clearTimeout(timeout);
  }, [text, delay, speed, onComplete]);

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={className}
    >
      {displayedText}
      {!isComplete && <span className="cursor-blink" />}
    </motion.span>
  );
});

TypingEffect.displayName = 'TypingEffect';
