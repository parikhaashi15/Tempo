import React, { useEffect, useRef } from 'react';

interface AnimatedFireplaceCanvasProps {
  className?: string;
  intensity?: number; // 0.5 to 1.5
  overlayMode?: boolean; // if true, renders over background image
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  life: number;
  maxLife: number;
  colorType: 'core' | 'mid' | 'tip' | 'spark';
  opacity: number;
}

export const AnimatedFireplaceCanvas: React.FC<AnimatedFireplaceCanvasProps> = ({
  className = '',
  intensity = 1.0,
  overlayMode = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.scale(dpr, dpr);
    };

    resize();
    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(canvas);

    // Particle arrays
    const flames: Particle[] = [];
    const sparks: Particle[] = [];
    const maxFlames = Math.floor(55 * intensity);
    const maxSparks = Math.floor(40 * intensity);

    let time = 0;

    const createFlame = (): Particle => {
      // Fireplace bed spans the bottom central portion of the card
      const hearthWidth = Math.min(width * 0.75, 420);
      const startX = width / 2 + (Math.random() - 0.5) * hearthWidth;
      const startY = height - 12 - Math.random() * 20;
      const maxLife = 35 + Math.random() * 45;
      const baseRadius = (16 + Math.random() * 24) * intensity;

      return {
        x: startX,
        y: startY,
        vx: (Math.random() - 0.5) * 1.2,
        vy: -(2.2 + Math.random() * 3.4) * intensity,
        radius: baseRadius,
        baseRadius,
        life: 0,
        maxLife,
        colorType: Math.random() < 0.25 ? 'core' : Math.random() < 0.65 ? 'mid' : 'tip',
        opacity: 0.7 + Math.random() * 0.3,
      };
    };

    const createSpark = (): Particle => {
      const hearthWidth = Math.min(width * 0.65, 360);
      const startX = width / 2 + (Math.random() - 0.5) * hearthWidth;
      const startY = height - 25 - Math.random() * 30;
      const maxLife = 60 + Math.random() * 90;

      return {
        x: startX,
        y: startY,
        vx: (Math.random() - 0.5) * 1.8,
        vy: -(1.5 + Math.random() * 2.8),
        radius: 1.2 + Math.random() * 2.2,
        baseRadius: 1.2 + Math.random() * 2.2,
        life: 0,
        maxLife,
        colorType: 'spark',
        opacity: 0.8 + Math.random() * 0.2,
      };
    };

    // Pre-populate particles
    for (let i = 0; i < maxFlames; i++) {
      const f = createFlame();
      f.life = Math.random() * f.maxLife;
      f.y += f.vy * f.life;
      flames.push(f);
    }
    for (let i = 0; i < maxSparks; i++) {
      const s = createSpark();
      s.life = Math.random() * s.maxLife;
      s.y += s.vy * s.life;
      sparks.push(s);
    }

    const render = () => {
      time += 0.05;
      ctx.clearRect(0, 0, width, height);

      // 1. Warm Hearth Glow across the bottom and glass
      const glowPulse = 0.85 + Math.sin(time * 3.2) * 0.08 + Math.cos(time * 1.7) * 0.07;
      const glowY = height - 20;
      const glowGrad = ctx.createRadialGradient(
        width / 2, glowY, 10,
        width / 2, glowY, Math.min(width * 0.6, 380)
      );
      glowGrad.addColorStop(0, `rgba(255, 110, 20, ${0.45 * glowPulse * intensity})`);
      glowGrad.addColorStop(0.35, `rgba(240, 70, 10, ${0.25 * glowPulse * intensity})`);
      glowGrad.addColorStop(0.7, `rgba(180, 40, 0, ${0.1 * glowPulse * intensity})`);
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, height - 220, width, 220);

      // If not overlaying a photo, draw cozy glowing ember logs & fireplace grate bed
      if (!overlayMode) {
        // Linear glowing glass bed
        const bedWidth = Math.min(width * 0.8, 440);
        const bedX = (width - bedWidth) / 2;
        const bedY = height - 28;

        // Coal/Ember bed gradient
        const emberBedGrad = ctx.createLinearGradient(bedX, bedY, bedX + bedWidth, bedY);
        emberBedGrad.addColorStop(0, 'rgba(60, 20, 10, 0.4)');
        emberBedGrad.addColorStop(0.2, 'rgba(255, 60, 0, 0.85)');
        emberBedGrad.addColorStop(0.5, 'rgba(255, 180, 40, 0.95)');
        emberBedGrad.addColorStop(0.8, 'rgba(255, 60, 0, 0.85)');
        emberBedGrad.addColorStop(1, 'rgba(60, 20, 10, 0.4)');

        ctx.fillStyle = emberBedGrad;
        ctx.beginPath();
        ctx.ellipse(width / 2, height - 16, bedWidth / 2, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Modern hearth glass line reflection
        ctx.strokeStyle = `rgba(255, 200, 100, ${0.3 * glowPulse})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(bedX - 20, height - 6);
        ctx.lineTo(bedX + bedWidth + 20, height - 6);
        ctx.stroke();
      }

      // Set blend mode for incandescent fire luminosity
      ctx.globalCompositeOperation = 'screen';

      // 2. Render and update Flames
      while (flames.length < maxFlames) {
        flames.push(createFlame());
      }

      for (let i = flames.length - 1; i >= 0; i--) {
        const p = flames[i];
        p.life += 1;
        const progress = p.life / p.maxLife;

        if (progress >= 1) {
          flames.splice(i, 1);
          continue;
        }

        // Rising motion with subtle turbulent draft swaying
        p.x += p.vx + Math.sin(time * 2 + p.life * 0.15) * 0.8;
        p.y += p.vy;

        // Shrink particle as it ascends
        const currentRadius = p.baseRadius * (1 - progress * 0.85);
        if (currentRadius <= 0.5) continue;

        // Alpha fades as it reaches tip
        const alpha = (1 - progress) * p.opacity;

        const radGrad = ctx.createRadialGradient(
          p.x, p.y, currentRadius * 0.1,
          p.x, p.y, currentRadius
        );

        if (p.colorType === 'core') {
          // White-hot core with golden rim
          radGrad.addColorStop(0, `rgba(255, 255, 240, ${alpha * 0.9})`);
          radGrad.addColorStop(0.4, `rgba(255, 210, 80, ${alpha * 0.7})`);
          radGrad.addColorStop(0.8, `rgba(255, 120, 20, ${alpha * 0.3})`);
          radGrad.addColorStop(1, 'rgba(255, 40, 0, 0)');
        } else if (p.colorType === 'mid') {
          // Vibrant amber-orange body
          radGrad.addColorStop(0, `rgba(255, 200, 50, ${alpha * 0.85})`);
          radGrad.addColorStop(0.5, `rgba(255, 110, 10, ${alpha * 0.6})`);
          radGrad.addColorStop(0.8, `rgba(210, 40, 5, ${alpha * 0.25})`);
          radGrad.addColorStop(1, 'rgba(120, 10, 0, 0)');
        } else {
          // Deep fiery ruby flame tip
          radGrad.addColorStop(0, `rgba(255, 140, 20, ${alpha * 0.7})`);
          radGrad.addColorStop(0.6, `rgba(230, 50, 10, ${alpha * 0.4})`);
          radGrad.addColorStop(0.9, `rgba(160, 20, 0, ${alpha * 0.15})`);
          radGrad.addColorStop(1, 'rgba(80, 5, 0, 0)');
        }

        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Render and update Floating Ember Sparks
      while (sparks.length < maxSparks) {
        sparks.push(createSpark());
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life += 1;
        const progress = s.life / s.maxLife;

        if (progress >= 1 || s.y < 20) {
          sparks.splice(i, 1);
          continue;
        }

        // Air draft sway
        s.x += s.vx + Math.sin(time * 3 + s.y * 0.05) * 0.7;
        s.y += s.vy;

        // Flicker intensity
        const flicker = 0.6 + Math.sin(time * 12 + i * 3) * 0.4;
        const sparkAlpha = (1 - progress) * s.opacity * flicker;

        ctx.fillStyle = `rgba(255, ${Math.floor(190 + Math.random() * 50)}, 60, ${sparkAlpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius * (1 - progress * 0.4), 0, Math.PI * 2);
        ctx.fill();
      }

      // Reset blend mode
      ctx.globalCompositeOperation = 'source-over';

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, [intensity, overlayMode]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none select-none absolute inset-0 w-full h-full ${className}`}
    />
  );
};
