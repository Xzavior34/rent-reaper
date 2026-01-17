import { useCallback } from 'react';
import confetti from 'canvas-confetti';

export const useConfetti = () => {
  const fireConfetti = useCallback(() => {
    // Green and gold themed confetti for SOL reclaim
    const colors = ['#00FF88', '#22c55e', '#FFD700', '#f59e0b'];

    // First burst - left side
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 0.2, y: 0.6 },
      colors,
      disableForReducedMotion: true,
    });

    // Second burst - right side
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 0.8, y: 0.6 },
      colors,
      disableForReducedMotion: true,
    });

    // Central explosion after a small delay
    setTimeout(() => {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { x: 0.5, y: 0.5 },
        colors,
        startVelocity: 45,
        gravity: 0.8,
        disableForReducedMotion: true,
      });
    }, 150);

    // Coin shower effect
    setTimeout(() => {
      const defaults = {
        spread: 360,
        ticks: 100,
        gravity: 0.5,
        decay: 0.94,
        startVelocity: 20,
        colors: ['#FFD700', '#FFA500', '#00FF88'],
        disableForReducedMotion: true,
      };

      confetti({
        ...defaults,
        particleCount: 50,
        origin: { x: 0.3, y: 0.2 },
      });

      confetti({
        ...defaults,
        particleCount: 50,
        origin: { x: 0.7, y: 0.2 },
      });
    }, 300);
  }, []);

  const fireSuccess = useCallback(() => {
    // Simple success animation
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#00FF88', '#22c55e', '#10b981'],
      disableForReducedMotion: true,
    });
  }, []);

  return { fireConfetti, fireSuccess };
};
