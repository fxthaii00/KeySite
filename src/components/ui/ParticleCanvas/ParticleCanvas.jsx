import { useEffect, useRef } from 'react';
import styles from './ParticleCanvas.module.css';

export default function ParticleCanvas({ opacity = 0.42 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    let W, H, particles, lines, rafId;

    const mkP = () => ({
      x:  Math.random() * W,
      y:  Math.random() * H,
      r:  Math.random() * 1.3 + 0.3,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      a:  Math.random() * 0.55 + 0.08,
      p:  Math.random() * Math.PI * 2,
      ps: Math.random() * 0.011 + 0.004,
    });

    const mkL = () => {
      const side = Math.random() < 0.5 ? 0 : 1;
      return {
        x:       side === 0 ? -60 : Math.random() * W,
        y:       side === 0 ? Math.random() * H : -20,
        angle:   Math.PI / 4 + (Math.random() - 0.5) * 0.3,
        speed:   Math.random() * 0.38 + 0.12,
        len:     Math.random() * 110 + 50,
        a:       Math.random() * 0.16 + 0.03,
        w:       Math.random() * 0.9 + 0.2,
        life:    0,
        maxLife: Math.random() * 380 + 180,
      };
    };

    const resize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };

    const init = () => {
      resize();
      particles = Array.from({ length: 65 }, mkP);
      lines     = Array.from({ length: 7  }, mkL);
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      for (const p of particles) {
        p.x += p.vx; p.y += p.vy; p.p += p.ps;
        if (p.x < -4) p.x = W + 4; if (p.x > W + 4) p.x = -4;
        if (p.y < -4) p.y = H + 4; if (p.y > H + 4) p.y = -4;
        const al = p.a * (0.55 + 0.45 * Math.sin(p.p));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(140,60,255,${al})`;
        ctx.fill();
      }

      for (let i = 0; i < lines.length; i++) {
        const l = lines[i];
        l.life++;
        l.x += Math.cos(l.angle) * l.speed;
        l.y += Math.sin(l.angle) * l.speed;
        const pr   = l.life / l.maxLife;
        const fade = pr < 0.15 ? pr / 0.15 : pr > 0.8 ? (1 - pr) / 0.2 : 1;
        ctx.beginPath();
        ctx.moveTo(l.x, l.y);
        ctx.lineTo(l.x - Math.cos(l.angle) * l.len, l.y - Math.sin(l.angle) * l.len);
        ctx.strokeStyle = `rgba(160,64,255,${l.a * fade})`;
        ctx.lineWidth   = l.w;
        ctx.stroke();
        if (l.life > l.maxLife || l.x > W + 80 || l.y > H + 80) lines[i] = mkL();
      }

      // Radial glow
      const gx = W / 2, gy = H * 0.5;
      const gr = ctx.createRadialGradient(gx, gy, 0, gx, gy, W * 0.42);
      gr.addColorStop(0, 'rgba(80,10,170,.1)');
      gr.addColorStop(1, 'rgba(80,10,170,0)');
      ctx.beginPath();
      ctx.ellipse(gx, gy, W * 0.42, H * 0.32, 0, 0, Math.PI * 2);
      ctx.fillStyle = gr;
      ctx.fill();

      rafId = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    init();
    draw();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
      style={{ opacity }}
      aria-hidden="true"
    />
  );
}
