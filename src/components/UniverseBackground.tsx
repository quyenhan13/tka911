import React, { useEffect, useRef } from 'react';

const UniverseBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const colors = ['#00f2ff', '#39ffba', '#ffffff', '#7000ff', '#ff00d4', '#fff700'];
    const stream = containerRef.current;
    let emitterTimer: any = null;

    const spawnParticle = () => {
      if (!stream) return;
      const particle = document.createElement('div');
      particle.className = 'stream-particle';

      const size = Math.random() * 2.5 + 1;
      particle.style.width = size + 'px';
      particle.style.height = size + 'px';
      particle.style.left = Math.random() * window.innerWidth + 'px';
      
      const spawnY = window.innerHeight + 20;
      const travel = window.innerHeight + 120;
      
      particle.style.top = (spawnY + Math.random() * 18 - 9) + 'px';
      particle.style.color = colors[Math.floor(Math.random() * colors.length)];
      
      const duration = (Math.random() * 8 + 12).toFixed(2) + 's';
      const drift = (Math.random() * 120 - 60).toFixed(2) + 'px';
      const opacity = (Math.random() * 0.25 + 0.3).toFixed(2);
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
      }, window.innerWidth < 768 ? 150 : 100);
    };

    const stopEmitter = () => {
      if (emitterTimer === null) return;
      clearInterval(emitterTimer);
      emitterTimer = null;
    };

    for (let i = 0; i < 30; i++) {
      setTimeout(spawnParticle, i * 100);
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

  // Helper to generate a massive field of stars via box-shadow
  const generateStars = (count: number) => {
    let stars = '';
    for (let i = 0; i < count; i++) {
      const x = Math.floor(Math.random() * 2000);
      const y = Math.floor(Math.random() * 2000);
      stars += `${x}px ${y}px #fff${i % 5 === 0 ? '' : ', '}`;
    }
    return stars.trim().replace(/,$/, '');
  };

  return (
    <div className="universe-stream-page fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-[#010206]">
      {/* Intense Multi-Layer Nebula */}
      <div className="nebula-layer n-1" />
      <div className="nebula-layer n-2" />
      <div className="nebula-layer n-3" />
      
      {/* Massive Star Fields */}
      <div className="star-field s-1" />
      <div className="star-field s-2" />
      <div className="star-field s-3" />
      
      <div id="universe-stream" ref={containerRef} />

      <style>{`
        .universe-stream-page {
          background: #010206;
        }

        .nebula-layer {
          position: fixed;
          inset: -50%;
          filter: blur(140px);
          opacity: 0.6;
          mix-blend-mode: screen;
          pointer-events: none;
          z-index: -2;
        }

        .n-1 {
          background: radial-gradient(circle at 20% 30%, rgba(0, 242, 255, 0.15), transparent 40%);
          animation: nebulaDrift 50s ease-in-out infinite alternate;
        }

        .n-2 {
          background: radial-gradient(circle at 80% 70%, rgba(112, 0, 255, 0.18), transparent 45%);
          animation: nebulaDrift 45s ease-in-out infinite alternate-reverse;
        }

        .n-3 {
          background: radial-gradient(circle at 50% 50%, rgba(255, 0, 200, 0.1), transparent 35%);
          animation: nebulaDrift 60s ease-in-out infinite alternate;
        }

        @keyframes nebulaDrift {
          from { transform: translate(-8%, -8%) scale(1); }
          to { transform: translate(8%, 8%) scale(1.15); }
        }

        .star-field {
          position: fixed;
          top: 0;
          left: 0;
          width: 2px;
          height: 2px;
          background: transparent;
          pointer-events: none;
        }

        .s-1 {
          box-shadow: ${generateStars(300)};
          animation: spaceFly 100s linear infinite;
          opacity: 0.5;
        }

        .s-2 {
          width: 1px;
          height: 1px;
          box-shadow: ${generateStars(500)};
          animation: spaceFly 150s linear infinite;
          opacity: 0.3;
        }

        .s-3 {
          width: 3px;
          height: 3px;
          box-shadow: ${generateStars(100)};
          animation: spaceFly 80s linear infinite;
          opacity: 0.2;
          filter: blur(1px);
        }

        @keyframes spaceFly {
          from { transform: translateY(0); }
          to { transform: translateY(-2000px); }
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
          background: radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.98), currentColor 65%, rgba(255, 255, 255, 0) 100%);
          box-shadow:
            0 0 10px currentColor,
            0 0 20px currentColor;
          opacity: 0;
          will-change: transform, opacity;
          animation: universeStreamRise var(--duration, 15s) linear forwards;
        }

        @keyframes universeStreamRise {
          0% {
            transform: translate3d(0, 0, 0) scale(0.6);
            opacity: 0;
          }
          10% {
            opacity: var(--opacity, 0.5);
          }
          90% {
            opacity: var(--opacity, 0.5);
          }
          100% {
            transform: translate3d(var(--drift, 0px), var(--travel, -850px), 0) scale(1.2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default UniverseBackground;
