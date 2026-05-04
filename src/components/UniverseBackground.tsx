import React, { useEffect, useRef } from 'react';

const UniverseBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const colors = ['#00f2ff', '#39ffba', '#ffffff', '#7000ff', '#ff00d4'];
    const stream = containerRef.current;
    let emitterTimer: any = null;

    const spawnParticle = () => {
      if (!stream) return;
      const particle = document.createElement('div');
      particle.className = 'stream-particle';

      const size = Math.random() * 3 + 2;
      particle.style.width = size + 'px';
      particle.style.height = size + 'px';
      particle.style.left = Math.random() * window.innerWidth + 'px';
      
      // Spawn from bottom
      const spawnY = window.innerHeight + 20;
      const travel = window.innerHeight + 120;
      
      particle.style.top = (spawnY + Math.random() * 18 - 9) + 'px';
      particle.style.color = colors[Math.floor(Math.random() * colors.length)];
      
      const duration = (Math.random() * 6 + 8).toFixed(2) + 's';
      const drift = (Math.random() * 80 - 40).toFixed(2) + 'px';
      const opacity = (Math.random() * 0.18 + 0.30).toFixed(2);
      const travelDistance = (-travel - Math.random() * 80).toFixed(2) + 'px';

      particle.style.setProperty('--duration', duration);
      particle.style.setProperty('--drift', drift);
      particle.style.setProperty('--opacity', opacity);
      particle.style.setProperty('--travel', travelDistance);

      stream.appendChild(particle);

      const ttl = (parseFloat(duration) * 1000) + 500;
      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      }, ttl);
    };

    const startEmitter = () => {
      if (emitterTimer !== null) return;
      emitterTimer = setInterval(() => {
        if (!document.hidden) spawnParticle();
      }, window.innerWidth < 768 ? 180 : 110);
    };

    const stopEmitter = () => {
      if (emitterTimer === null) return;
      clearInterval(emitterTimer);
      emitterTimer = null;
    };

    // Initial burst
    for (let i = 0; i < 14; i++) {
      setTimeout(spawnParticle, i * 90);
    }

    startEmitter();

    const handleVisibility = () => {
      if (document.hidden) stopEmitter();
      else startEmitter();
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stopEmitter();
      document.removeEventListener('visibilitychange', handleVisibility);
      if (stream) stream.innerHTML = '';
    };
  }, []);

  return (
    <div className="universe-stream-page fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-[#05070a]">
      {/* Original Web Nebulas */}
      <div className="nebula-main" />
      <div className="nebula-secondary" />
      <div id="universe-stream" ref={containerRef} />

      <style>{`
        .universe-stream-page {
          background:
            radial-gradient(circle at 18% 20%, rgba(0, 242, 255, 0.08), transparent 28%),
            radial-gradient(circle at 82% 12%, rgba(112, 0, 255, 0.10), transparent 32%),
            radial-gradient(circle at 75% 78%, rgba(255, 0, 200, 0.06), transparent 26%),
            #05070a !important;
        }

        .nebula-main {
          content: "";
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: -2;
          background:
            radial-gradient(circle at 20% 30%, rgba(0, 242, 255, 0.10), transparent 40%),
            radial-gradient(circle at 80% 70%, rgba(112, 0, 255, 0.12), transparent 40%);
          animation: universeNebulaPulse 15s ease-in-out infinite alternate;
        }

        .nebula-secondary {
          content: "";
          position: fixed;
          width: 520px;
          height: 520px;
          top: 72px;
          right: -140px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(123, 140, 255, 0.18), rgba(90, 109, 216, 0.08) 42%, transparent 72%);
          filter: blur(90px);
          pointer-events: none;
          z-index: -2;
          opacity: 0.7;
        }

        #universe-stream {
          position: fixed;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
          z-index: 1;
        }

        .stream-particle {
          position: absolute;
          border-radius: 999px;
          background: radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.92), currentColor 58%, rgba(255, 255, 255, 0) 100%);
          box-shadow:
            0 0 6px currentColor,
            0 0 14px currentColor;
          filter: blur(0.2px);
          opacity: 0;
          will-change: transform, opacity;
          animation: universeStreamRise var(--duration, 14s) linear forwards;
        }

        @keyframes universeStreamRise {
          0% {
            transform: translate3d(0, 0, 0) scale(0.7);
            opacity: 0;
          }
          10% {
            opacity: var(--opacity, 0.52);
          }
          70% {
            opacity: var(--opacity, 0.52);
          }
          100% {
            transform: translate3d(var(--drift, 0px), var(--travel, -700px), 0) scale(1.08);
            opacity: 0;
          }
        }

        @keyframes universeNebulaPulse {
          from {
            opacity: 0.45;
            transform: scale(1);
          }
          to {
            opacity: 0.8;
            transform: scale(1.04);
          }
        }
      `}</style>
    </div>
  );
};

export default UniverseBackground;
