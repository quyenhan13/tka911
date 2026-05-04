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

      const size = Math.random() * 3 + 1.5;
      particle.style.width = size + 'px';
      particle.style.height = size + 'px';
      particle.style.left = Math.random() * window.innerWidth + 'px';
      
      const spawnY = window.innerHeight + 20;
      const travel = window.innerHeight + 120;
      
      particle.style.top = (spawnY + Math.random() * 18 - 9) + 'px';
      particle.style.color = colors[Math.floor(Math.random() * colors.length)];
      
      const duration = (Math.random() * 8 + 10).toFixed(2) + 's';
      const drift = (Math.random() * 100 - 50).toFixed(2) + 'px';
      const opacity = (Math.random() * 0.2 + 0.25).toFixed(2);
      const travelDistance = (-travel - Math.random() * 100).toFixed(2) + 'px';

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
      }, window.innerWidth < 768 ? 250 : 150);
    };

    const stopEmitter = () => {
      if (emitterTimer === null) return;
      clearInterval(emitterTimer);
      emitterTimer = null;
    };

    for (let i = 0; i < 20; i++) {
      setTimeout(spawnParticle, i * 150);
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
      {/* Enhanced Multi-Layer Nebula */}
      <div className="nebula-layer n-1" />
      <div className="nebula-layer n-2" />
      <div className="nebula-layer n-3" />
      
      {/* Background Stars */}
      <div className="static-stars" />
      <div id="universe-stream" ref={containerRef} />

      <style>{`
        .universe-stream-page {
          background: #05070a;
        }

        .nebula-layer {
          position: fixed;
          inset: -50%;
          filter: blur(120px);
          opacity: 0.5;
          mix-blend-mode: screen;
          pointer-events: none;
          z-index: -2;
        }

        .n-1 {
          background: radial-gradient(circle at 20% 30%, rgba(0, 242, 255, 0.12), transparent 40%);
          animation: nebulaDrift 40s ease-in-out infinite alternate;
        }

        .n-2 {
          background: radial-gradient(circle at 80% 70%, rgba(112, 0, 255, 0.15), transparent 45%);
          animation: nebulaDrift 35s ease-in-out infinite alternate-reverse;
        }

        .n-3 {
          background: radial-gradient(circle at 50% 50%, rgba(255, 0, 200, 0.08), transparent 35%);
          animation: nebulaDrift 50s ease-in-out infinite alternate;
        }

        @keyframes nebulaDrift {
          from { transform: translate(-5%, -5%) scale(1); }
          to { transform: translate(5%, 5%) scale(1.1); }
        }

        .static-stars {
          position: fixed;
          inset: 0;
          background-image: 
            radial-gradient(1px 1px at 10% 10%, #fff, transparent),
            radial-gradient(1px 1px at 20% 35%, #fff, transparent),
            radial-gradient(1px 1px at 45% 85%, #fff, transparent),
            radial-gradient(1.5px 1.5px at 75% 25%, #00f2ff, transparent),
            radial-gradient(1px 1px at 85% 65%, #fff, transparent),
            radial-gradient(1px 1px at 35% 15%, #fff, transparent),
            radial-gradient(1.5px 1.5px at 65% 55%, #7000ff, transparent);
          background-size: 50% 50%;
          opacity: 0.3;
          animation: twinkle 4s ease-in-out infinite alternate;
        }

        @keyframes twinkle {
          from { opacity: 0.2; }
          to { opacity: 0.5; }
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
          background: radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.95), currentColor 60%, rgba(255, 255, 255, 0) 100%);
          box-shadow:
            0 0 8px currentColor,
            0 0 16px currentColor;
          opacity: 0;
          will-change: transform, opacity;
          animation: universeStreamRise var(--duration, 15s) linear forwards;
        }

        @keyframes universeStreamRise {
          0% {
            transform: translate3d(0, 0, 0) scale(0.6);
            opacity: 0;
          }
          15% {
            opacity: var(--opacity, 0.5);
          }
          85% {
            opacity: var(--opacity, 0.5);
          }
          100% {
            transform: translate3d(var(--drift, 0px), var(--travel, -800px), 0) scale(1.1);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default UniverseBackground;
