"use client";

import { useEffect, useRef } from "react";

interface Paw {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
}

const PAW_EMOJI = "🐾";
const COUNT = 25;

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function ParticlesPaws() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;

    const paws: Paw[] = [];

    function resize() {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    }

    function init() {
      paws.length = 0;
      for (let i = 0; i < COUNT; i++) {
        paws.push({
          x: randomBetween(0, width),
          y: randomBetween(0, height),
          vx: randomBetween(-0.4, 0.4),
          vy: randomBetween(-0.4, 0.4),
          size: randomBetween(12, 32),
          opacity: randomBetween(0.06, 0.12),
          rotation: randomBetween(0, Math.PI * 2),
          rotationSpeed: randomBetween(-0.005, 0.005),
        });
      }
    }

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      for (const p of paws) {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        // Bounce at edges with damping
        if (p.x < -p.size) p.x = width + p.size;
        else if (p.x > width + p.size) p.x = -p.size;
        if (p.y < -p.size) p.y = height + p.size;
        else if (p.y > height + p.size) p.y = -p.size;

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.font = `${p.size}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        // White tint via filter
        ctx.filter = "grayscale(1) brightness(100)";
        ctx.fillText(PAW_EMOJI, 0, 0);
        ctx.restore();
      }

      animId = requestAnimationFrame(draw);
    }

    resize();
    init();
    draw();

    const ro = new ResizeObserver(() => {
      resize();
    });
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}
