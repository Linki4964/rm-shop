// src/components/Confetti/Confetti.tsx
import { useEffect, useRef } from 'react';
import styles from './Confetti.module.css';

interface Props {
  active: boolean;
  onDone?: () => void;
}

const COLORS = ['#2563eb', '#e07a5f', '#f59e0b', '#22c55e', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316'];
const PARTICLE_COUNT = 120;

const Confetti = ({ active, onDone }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    interface Particle {
      x: number; y: number; vx: number; vy: number;
      w: number; h: number; color: string; rotation: number; rotSpeed: number;
      gravity: number; opacity: number;
    }

    const particles: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * canvas.height * 0.4,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * 4 + 2,
        w: Math.random() * 10 + 6,
        h: Math.random() * 6 + 4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.3,
        gravity: 0.08 + Math.random() * 0.06,
        opacity: 1,
      });
    }

    let frame = 0;
    const maxFrames = 180; // ~3 seconds at 60fps

    const animate = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.x += p.vx;
        p.vy += p.gravity;
        p.y += p.vy;
        p.vx *= 0.99;
        p.rotation += p.rotSpeed;
        if (frame > maxFrames - 40) p.opacity = Math.max(0, p.opacity - 0.025);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });

      if (frame < maxFrames) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        onDone?.();
      }
    };
    animRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animRef.current);
  }, [active, onDone]);

  if (!active) return null;

  return <canvas ref={canvasRef} className={styles.canvas} />;
};

export default Confetti;
