import { useEffect, useRef } from "react";

export default function ConstellationBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: false }); // Optimization: No alpha channel if background is solid

    let particles = [];
    let animationFrameId;
    
    // Performance Tweak: Detection
    const isMobile = window.innerWidth < 768;
    const count = isMobile ? 40 : 120; // Drastically reduce stars on mobile
    const connectionDist = isMobile ? 90 : 140; // Shorter lines on mobile

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles(); // Re-init so stars aren't lost on rotation
    }

    function initParticles() {
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * (isMobile ? 0.2 : 0.3),
          vy: (Math.random() - 0.5) * (isMobile ? 0.2 : 0.3),
          size: Math.random() * 1.5 + 1,
        });
      }
    }

    window.addEventListener("resize", resize);
    resize();

    function animate() {
      // Use a slightly opaque clear to create a faint trail effect if desired, 
      // or standard clear for performance
      ctx.fillStyle = "#020617"; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 1. Update and Draw Particles
      for (let i = 0; i < count; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 220, 255, 0.8)";
        
        // PERF: Disable expensive ShadowBlur on mobile
        if (!isMobile) {
          ctx.shadowBlur = 8;
          ctx.shadowColor = "#66e0ff";
        }
        
        ctx.fill();
        if (!isMobile) ctx.shadowBlur = 0; // Reset for lines
      }

      // 2. Draw Lines (The "lag" part)
      ctx.lineWidth = 0.5;
      for (let i = 0; i < count; i++) {
        for (let j = i + 1; j < count; j++) {
          const a = particles[i];
          const b = particles[j];
          
          // Optimization: Check simple X/Y distance before doing heavy Math.hypot
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          
          if (Math.abs(dx) < connectionDist && Math.abs(dy) < connectionDist) {
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < connectionDist) {
              ctx.strokeStyle = `rgba(120, 255, 255, ${1 - dist / connectionDist})`;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-20 pointer-events-none bg-[#020617]"
    />
  );
}
