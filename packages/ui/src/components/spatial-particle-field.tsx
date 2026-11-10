'use client';

import React, { useEffect, useRef } from 'react';

export interface SpatialParticleFieldProps {
  className?: string;
  density?: 'low' | 'medium' | 'high';
  interactive?: boolean;
  networkLines?: boolean;
}

interface Particle4D {
  x: number;
  y: number;
  z: number; // Simulated depth layer: 0.2 (distant) to 1.0 (foreground)
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  baseAlpha: number;
  color: string;
  phase: number;
  speed: number;
}

const PARTICLE_PALETTE = [
  'rgba(148, 163, 184, ', // Slate / Titanium
  'rgba(56, 189, 248, ', // Icy Cyan / Sky
  'rgba(129, 140, 248, ', // Electric Indigo
  'rgba(192, 132, 252, ', // Spatial Violet
  'rgba(241, 245, 249, ', // Pure Star White
];

export function SpatialParticleField({
  className = '',
  density = 'medium',
  interactive = true,
  networkLines = true,
}: SpatialParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);
  const mousePos = useRef<{ x: number; y: number; active: boolean }>({
    x: -9999,
    y: -9999,
    active: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Detect reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReducedMotion = mediaQuery.matches;

    const handleMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion = e.matches;
    };
    mediaQuery.addEventListener('change', handleMotionChange);

    let width = 0;
    let height = 0;
    let particles: Particle4D[] = [];

    const getDensityCount = (w: number): number => {
      let base = 50;
      if (density === 'low') base = 30;
      if (density === 'high') base = 85;

      // Adapt to viewport size
      if (w < 640) return Math.floor(base * 0.4);
      if (w < 1024) return Math.floor(base * 0.7);
      return base;
    };

    const initParticles = () => {
      const count = getDensityCount(width);
      particles = [];

      for (let i = 0; i < count; i++) {
        const z = 0.2 + Math.random() * 0.8; // Depth factor
        const baseRadius = (0.8 + Math.random() * 1.8) * z;
        const colorBase = PARTICLE_PALETTE[Math.floor(Math.random() * PARTICLE_PALETTE.length)] ?? PARTICLE_PALETTE[0]!;

        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          z,
          vx: (Math.random() - 0.5) * 0.4 * z,
          vy: (Math.random() - 0.5) * 0.4 * z,
          radius: baseRadius,
          baseRadius,
          baseAlpha: 0.15 + z * 0.35,
          color: colorBase,
          phase: Math.random() * Math.PI * 2,
          speed: 0.001 + Math.random() * 0.002,
        });
      }
    };

    const handleResize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.parentElement?.clientHeight || window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
      initParticles();
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const handlePointerMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      mousePos.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };

    const handlePointerLeave = () => {
      mousePos.current = { x: -9999, y: -9999, active: false };
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    document.addEventListener('mouseleave', handlePointerLeave);

    let isDocumentVisible = !document.hidden;
    const handleVisibilityChange = () => {
      isDocumentVisible = !document.hidden;
      if (isDocumentVisible && !animFrameId.current) {
        lastTime = performance.now();
        animFrameId.current = requestAnimationFrame(render);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    let lastTime = performance.now();

    const render = (currentTime: number) => {
      if (!isDocumentVisible) {
        animFrameId.current = null;
        return;
      }

      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      ctx.clearRect(0, 0, width, height);

      // Render network links between close particles in similar depth layers
      if (networkLines && !prefersReducedMotion) {
        const maxDist = 95;
        for (let i = 0; i < particles.length; i++) {
          const p1 = particles[i]!;
          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j]!;
            const depthDiff = Math.abs(p1.z - p2.z);
            if (depthDiff > 0.4) continue; // Only connect particles in adjacent depth planes

            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dist = Math.hypot(dx, dy);

            if (dist < maxDist) {
              const alpha = (1 - dist / maxDist) * 0.12 * Math.min(p1.z, p2.z);
              ctx.beginPath();
              ctx.strokeStyle = `rgba(148, 163, 184, ${alpha})`;
              ctx.lineWidth = 0.6 * Math.min(p1.z, p2.z);
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        }
      }

      // Update and draw particles in 4D space
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]!;

        if (!prefersReducedMotion) {
          // Time-dependent harmonic flow (T-dimension)
          p.phase += p.speed * 60 * dt;
          const harmonicX = Math.sin(p.phase + p.z * 4) * 0.25 * p.z;
          const harmonicY = Math.cos(p.phase * 0.8 + p.z * 3) * 0.25 * p.z;

          // Pointer proximity spatial repulsion (subtle Apple spatial lens effect)
          if (mousePos.current.active && interactive) {
            const mdx = p.x - mousePos.current.x;
            const mdy = p.y - mousePos.current.y;
            const mdist = Math.hypot(mdx, mdy);
            const maxMouseDist = 130;

            if (mdist < maxMouseDist && mdist > 0) {
              const force = (1 - mdist / maxMouseDist) * 0.8 * p.z;
              p.x += (mdx / mdist) * force;
              p.y += (mdy / mdist) * force;
            }
          }

          p.x += (p.vx + harmonicX) * 60 * dt;
          p.y += (p.vy + harmonicY) * 60 * dt;

          // Wrap around spatial boundaries smoothly
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;
          if (p.y < -10) p.y = height + 10;
          if (p.y > height + 10) p.y = -10;
        }

        // Pulse alpha gently with harmonic time
        const currentAlpha = prefersReducedMotion
          ? p.baseAlpha
          : p.baseAlpha * (0.85 + 0.15 * Math.sin(p.phase * 1.5));

        // Draw particle with depth illumination
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${currentAlpha})`;
        ctx.fill();

        // High depth foreground particles get a subtle halo glow
        if (p.z > 0.75 && !prefersReducedMotion) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `${p.color}${currentAlpha * 0.2})`;
          ctx.fill();
        }
      }

      animFrameId.current = requestAnimationFrame(render);
    };

    animFrameId.current = requestAnimationFrame(render);

    return () => {
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
      mediaQuery.removeEventListener('change', handleMotionChange);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handlePointerMove);
      document.removeEventListener('mouseleave', handlePointerLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [density, interactive, networkLines]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 z-0 h-full w-full opacity-70 transition-opacity duration-1000 ${className}`}
    />
  );
}
