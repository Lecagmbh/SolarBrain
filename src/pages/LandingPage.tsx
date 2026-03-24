import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const yearRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (yearRef.current) {
      yearRef.current.textContent = new Date().getFullYear().toString();
    }

    let animationId: number;

    const initThreeJS = async () => {
      const THREE = await import('three');
      const canvas = canvasRef.current;
      if (!canvas) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 50;

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      const particleCount = 500;
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      const sizes = new Float32Array(particleCount);

      const colorPrimary = new THREE.Color(0x22C55E);
      const colorSecondary = new THREE.Color(0x38BDF8);

      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 150;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 150;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
        const color = colorPrimary.clone().lerp(colorSecondary, Math.random());
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
        sizes[i] = Math.random() * 2 + 0.5;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

      const particleMaterial = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: `
          attribute float size;
          attribute vec3 color;
          varying vec3 vColor;
          varying float vAlpha;
          uniform float uTime;
          void main() {
            vColor = color;
            vec3 pos = position;
            pos.x += sin(uTime * 0.15 + position.y * 0.015) * 1.5;
            pos.y += cos(uTime * 0.12 + position.x * 0.015) * 1.5;
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            gl_PointSize = size * (45.0 / -mvPosition.z);
            gl_PointSize = clamp(gl_PointSize, 0.5, 6.0);
            vAlpha = smoothstep(100.0, 20.0, -mvPosition.z) * 0.5;
          }
        `,
        fragmentShader: `
          varying vec3 vColor;
          varying float vAlpha;
          void main() {
            float dist = length(gl_PointCoord - vec2(0.5));
            if (dist > 0.5) discard;
            gl_FragColor = vec4(vColor, smoothstep(0.5, 0.0, dist) * vAlpha);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });

      const particles = new THREE.Points(geometry, particleMaterial);
      scene.add(particles);

      const clock = new THREE.Clock();
      const animate = () => {
        animationId = requestAnimationFrame(animate);
        particleMaterial.uniforms.uTime.value = clock.getElapsedTime();
        particles.rotation.y = clock.getElapsedTime() * 0.015;
        renderer.render(scene, camera);
      };
      animate();

      const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener('resize', handleResize);

      return () => {
        cancelAnimationFrame(animationId);
        window.removeEventListener('resize', handleResize);
        renderer.dispose();
      };
    };

    initThreeJS();
    return () => { if (animationId) cancelAnimationFrame(animationId); };
  }, []);

  return (
    <>
      <style>{`
        :root {
          --color-primary: #22C55E;
          --color-primary-light: #4ADE80;
          --color-secondary: #38BDF8;
          --color-bg: #030014;
          --color-surface: #0A0A1A;
          --color-text: #F1F5F9;
          --color-text-soft: #94A3B8;
          --color-border: rgba(34, 197, 94, 0.2);
          --font-display: 'Space Grotesk', sans-serif;
          --font-body: 'Inter', sans-serif;
        }
        .landing-page * { margin: 0; padding: 0; box-sizing: border-box; }
        .landing-page {
          font-family: var(--font-body);
          background: var(--color-bg);
          color: var(--color-text);
          line-height: 1.7;
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }
        .landing-page a { color: var(--color-secondary); text-decoration: none; transition: color 0.2s; }
        .landing-page a:hover { color: var(--color-primary); }
        #canvas-container { position: fixed; inset: 0; z-index: -1; pointer-events: none; }
        #three-canvas { width: 100%; height: 100%; }
        .bg-gradient {
          position: fixed; inset: 0; pointer-events: none; z-index: -1;
          background: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(34, 197, 94, 0.12), transparent),
                      radial-gradient(ellipse 60% 40% at 100% 0%, rgba(56, 189, 248, 0.08), transparent);
        }
        .nav { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 1000; width: calc(100% - 40px); max-width: 1000px; }
        .nav-inner {
          display: flex; align-items: center; justify-content: space-between; gap: 1.5rem;
          padding: 0.75rem 1.5rem; background: rgba(10, 10, 26, 0.9); backdrop-filter: blur(20px);
          border: 1px solid var(--color-border); border-radius: 100px;
        }
        .nav-logo { display: flex; align-items: center; gap: 0.75rem; text-decoration: none; color: inherit; }
        .nav-logo-mark {
          width: 36px; height: 36px; background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
          border-radius: 10px; display: flex; align-items: center; justify-content: center;
          font-family: var(--font-display); font-weight: 700; font-size: 0.85rem; color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }
        .nav-logo-text { display: flex; flex-direction: column; line-height: 1.2; }
        .nav-logo-name { font-family: var(--font-display); font-weight: 600; font-size: 1rem; }
        .nav-logo-tagline { font-size: 0.7rem; color: var(--color-text-soft); }
        .nav-links { display: flex; align-items: center; gap: 2rem; }
        .nav-link { font-size: 0.85rem; color: var(--color-text-soft); transition: color 0.2s; }
        .nav-link:hover { color: var(--color-text); }
        .nav-btn {
          padding: 0.5rem 1.25rem; border-radius: 100px; font-size: 0.85rem; font-weight: 500;
          transition: all 0.3s; display: flex; align-items: center; gap: 0.4rem;
        }
        .nav-btn--primary { background: linear-gradient(135deg, var(--color-primary), #16A34A); color: #fff; font-weight: 600; text-shadow: 0 1px 2px rgba(0,0,0,0.2); }
        .nav-btn--primary:hover { box-shadow: 0 4px 20px rgba(34, 197, 94, 0.4); transform: translateY(-1px); color: #fff; }
        section { position: relative; z-index: 1; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; }

        .hero { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 120px 1.5rem 80px; }
        .hero-content { text-align: center; max-width: 900px; }
        .hero-tag {
          display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem;
          background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.2);
          border-radius: 100px; font-size: 0.85rem; color: var(--color-primary); margin-bottom: 1.5rem;
        }
        .hero-title { font-family: var(--font-display); font-size: clamp(2.5rem, 6vw, 4rem); font-weight: 700; line-height: 1.1; margin-bottom: 1.5rem; }
        .hero-title .highlight { background: linear-gradient(135deg, var(--color-primary), var(--color-secondary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .hero-subtitle { font-size: 1.2rem; color: var(--color-text-soft); margin-bottom: 2.5rem; max-width: 700px; margin-left: auto; margin-right: auto; }
        .hero-buttons { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
        .btn {
          display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.9rem 1.75rem;
          border-radius: 100px; font-size: 0.95rem; font-weight: 500; transition: all 0.3s; border: none; cursor: pointer;
        }
        .btn--primary { background: linear-gradient(135deg, var(--color-primary), #16A34A); color: #fff; font-weight: 600; box-shadow: 0 4px 20px rgba(34, 197, 94, 0.3); text-shadow: 0 1px 2px rgba(0,0,0,0.2); }
        .btn--primary:hover { box-shadow: 0 6px 30px rgba(34, 197, 94, 0.5); transform: translateY(-2px); color: #fff; }
        .btn--secondary { background: rgba(255, 255, 255, 0.05); border: 1px solid var(--color-border); color: var(--color-text); }
        .btn--secondary:hover { background: rgba(255, 255, 255, 0.1); border-color: rgba(34, 197, 94, 0.3); }

        .stats-bar { display: flex; justify-content: center; gap: 3rem; margin-top: 4rem; flex-wrap: wrap; }
        .stat-item { text-align: center; }
        .stat-number { font-family: var(--font-display); font-size: 2rem; font-weight: 700; color: var(--color-primary); }
        .stat-label { font-size: 0.85rem; color: var(--color-text-soft); }

        .section { padding: 100px 0; }
        .section-header { text-align: center; margin-bottom: 4rem; }
        .section-tag { display: inline-flex; padding: 0.4rem 1rem; background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.2); border-radius: 100px; font-size: 0.8rem; color: var(--color-primary); margin-bottom: 1rem; }
        .section-title { font-family: var(--font-display); font-size: clamp(1.75rem, 4vw, 2.5rem); font-weight: 700; margin-bottom: 0.75rem; }
        .section-subtitle { color: var(--color-text-soft); font-size: 1rem; max-width: 600px; margin: 0 auto; }

        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 1.5rem; }
        .feature-card {
          background: rgba(10, 10, 26, 0.6); backdrop-filter: blur(10px); border: 1px solid var(--color-border);
          border-radius: 1.25rem; padding: 2rem; transition: all 0.3s; position: relative; overflow: hidden;
        }
        .feature-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, var(--color-primary), var(--color-secondary)); opacity: 0; transition: opacity 0.3s; }
        .feature-card:hover { transform: translateY(-4px); border-color: rgba(34, 197, 94, 0.3); }
        .feature-card:hover::before { opacity: 1; }
        .feature-icon { width: 48px; height: 48px; background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(56, 189, 248, 0.2)); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 1.25rem; color: var(--color-primary); }
        .feature-card h3 { font-family: var(--font-display); font-size: 1.15rem; font-weight: 600; margin-bottom: 0.75rem; }
        .feature-card p { color: var(--color-text-soft); font-size: 0.9rem; margin-bottom: 1rem; }
        .feature-list { list-style: none; }
        .feature-list li { display: flex; align-items: center; gap: 0.5rem; color: var(--color-text-soft); font-size: 0.85rem; margin-bottom: 0.4rem; }
        .feature-list li::before { content: ''; width: 6px; height: 6px; background: var(--color-primary); border-radius: 50%; }

        .workflow-section { background: linear-gradient(180deg, transparent, rgba(34, 197, 94, 0.02), transparent); }
        .workflow-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
        .workflow-step { text-align: center; padding: 1.5rem; position: relative; }
        .workflow-step::after { content: ''; position: absolute; top: 40px; right: -10px; width: 20px; height: 2px; background: linear-gradient(90deg, var(--color-primary), transparent); }
        .workflow-step:last-child::after { display: none; }
        .workflow-number { width: 56px; height: 56px; background: var(--color-surface); border: 2px solid var(--color-primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-weight: 700; font-size: 1.25rem; color: var(--color-primary); margin: 0 auto 1rem; box-shadow: 0 0 20px rgba(34, 197, 94, 0.2); }
        .workflow-step h4 { font-family: var(--font-display); font-size: 1rem; margin-bottom: 0.5rem; }
        .workflow-step p { color: var(--color-text-soft); font-size: 0.85rem; }

        .channels-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
        .channel-card { background: rgba(10, 10, 26, 0.5); border: 1px solid var(--color-border); border-radius: 1rem; padding: 2rem; text-align: center; transition: all 0.3s; }
        .channel-card:hover { border-color: rgba(34, 197, 94, 0.3); transform: translateY(-4px); }
        .channel-card.highlight { border-color: var(--color-primary); background: linear-gradient(180deg, rgba(34, 197, 94, 0.05), rgba(10, 10, 26, 0.5)); }
        .channel-icon { width: 64px; height: 64px; background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(56, 189, 248, 0.15)); border-radius: 1rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem; color: var(--color-primary); }
        .channel-card h3 { font-family: var(--font-display); font-size: 1.25rem; margin-bottom: 0.5rem; }
        .channel-card p { color: var(--color-text-soft); font-size: 0.9rem; margin-bottom: 1rem; }
        .channel-badge { display: inline-block; padding: 0.25rem 0.75rem; background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.2); border-radius: 100px; font-size: 0.75rem; color: var(--color-primary); }

        .solutions-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
        .solution-card { background: rgba(10, 10, 26, 0.6); border: 1px solid var(--color-border); border-radius: 1.25rem; padding: 2rem; text-align: center; transition: all 0.3s; position: relative; }
        .solution-card.featured { border-color: var(--color-secondary); }
        .solution-card:hover { transform: translateY(-4px); }
        .solution-badge { position: absolute; top: -10px; left: 50%; transform: translateX(-50%); padding: 0.25rem 1rem; background: linear-gradient(135deg, var(--color-secondary), #0EA5E9); color: #fff; border-radius: 100px; font-size: 0.75rem; font-weight: 600; }
        .solution-icon { width: 64px; height: 64px; background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(56, 189, 248, 0.1)); border-radius: 1rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem; color: var(--color-primary); }
        .solution-card h3 { font-family: var(--font-display); font-size: 1.25rem; margin-bottom: 0.5rem; }
        .solution-card p { color: var(--color-text-soft); font-size: 0.9rem; margin-bottom: 1.25rem; }
        .solution-features { list-style: none; text-align: left; }
        .solution-features li { display: flex; align-items: center; gap: 0.5rem; color: var(--color-text-soft); font-size: 0.85rem; margin-bottom: 0.5rem; }
        .solution-features li::before { content: ''; width: 6px; height: 6px; background: var(--color-primary); border-radius: 50%; }
        .app-badges { display: flex; gap: 0.5rem; justify-content: center; margin-top: 1rem; }
        .app-badge { display: flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.75rem; background: rgba(255,255,255,0.05); border: 1px solid var(--color-border); border-radius: 0.5rem; font-size: 0.75rem; color: var(--color-text); }

        .benefits-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; }
        .benefit-card { background: rgba(10, 10, 26, 0.4); border: 1px solid var(--color-border); border-radius: 1rem; padding: 1.5rem; text-align: center; transition: all 0.3s; }
        .benefit-card:hover { border-color: rgba(34, 197, 94, 0.25); }
        .benefit-icon { width: 48px; height: 48px; background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(56, 189, 248, 0.15)); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; color: var(--color-primary); }
        .benefit-card h3 { font-family: var(--font-display); font-size: 0.95rem; font-weight: 600; margin-bottom: 0.5rem; }
        .benefit-card p { color: var(--color-text-soft); font-size: 0.8rem; }

        .cta-section { padding: 80px 0; }
        .cta-box { background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(56, 189, 248, 0.1)); border: 1px solid var(--color-border); border-radius: 1.5rem; padding: 3.5rem 2rem; text-align: center; }
        .cta-box h2 { font-family: var(--font-display); font-size: clamp(1.5rem, 3vw, 2rem); margin-bottom: 1rem; }
        .cta-box p { color: var(--color-text-soft); margin-bottom: 2rem; max-width: 500px; margin-left: auto; margin-right: auto; }
        .cta-buttons { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }

        .footer { border-top: 1px solid var(--color-border); padding: 3rem 1.5rem; margin-top: 2rem; }
        .footer-inner { max-width: 1200px; margin: 0 auto; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1.5rem; }
        .footer-brand { display: flex; align-items: center; gap: 0.75rem; }
        .footer-logo-mark { width: 32px; height: 32px; background: linear-gradient(135deg, var(--color-primary), var(--color-secondary)); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-weight: 700; font-size: 0.75rem; color: #fff; }
        .footer-brand span { color: var(--color-text-soft); font-size: 0.9rem; }
        .footer-links { display: flex; gap: 1.5rem; }
        .footer-links a { font-size: 0.85rem; color: var(--color-text-soft); }
        .footer-bottom { width: 100%; display: flex; flex-wrap: wrap; justify-content: space-between; gap: 1rem; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.05); font-size: 0.8rem; color: var(--color-text-soft); }

        @media (max-width: 968px) {
          .nav-links { display: none; }
          .workflow-grid { grid-template-columns: repeat(2, 1fr); }
          .workflow-step::after { display: none; }
          .channels-grid, .solutions-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .nav { width: calc(100% - 20px); top: 10px; }
          .hero-buttons { flex-direction: column; align-items: center; }
          .btn { width: 100%; max-width: 280px; justify-content: center; }
          .stats-bar { gap: 2rem; }
          .features-grid { grid-template-columns: 1fr; }
          .workflow-grid { grid-template-columns: 1fr; }
          .footer-inner { flex-direction: column; text-align: center; }
          .footer-links { justify-content: center; }
          .footer-bottom { flex-direction: column; text-align: center; }
        }
      `}</style>

      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />

      <div className="landing-page">
        <div id="canvas-container"><canvas id="three-canvas" ref={canvasRef}></canvas></div>
        <div className="bg-gradient"></div>

        {/* Navigation */}
        <header className="nav">
          <div className="nav-inner">
            <a href="/" className="nav-logo">
              <div className="nav-logo-mark">GN</div>
              <div className="nav-logo-text">
                <span className="nav-logo-name">Baunity</span>
                <span className="nav-logo-tagline">Netzanmeldungen</span>
              </div>
            </a>
            <nav className="nav-links">
              <a href="#funktionen" className="nav-link">Funktionen</a>
              <a href="#workflow" className="nav-link">Ablauf</a>
              <a href="#loesungen" className="nav-link">Lösungen</a>
              <Link to="/download" className="nav-link">Desktop App</Link>
              <Link to="/partner" className="nav-link">Partner</Link>
              <Link to="/unternehmen" className="nav-link">Unternehmen</Link>
              <a href="#kontakt" className="nav-link">Kontakt</a>
            </nav>
            <Link to="/login" className="nav-btn nav-btn--primary">
              Portal Login
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>
        </header>

        {/* Hero */}
        <section className="hero">
          <div className="hero-content">
            <div className="hero-tag">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              Die digitale Plattform für Elektro-Fachbetriebe
            </div>
            <h1 className="hero-title">
              Netzanmeldungen<br/><span className="highlight">komplett automatisiert.</span>
            </h1>
            <p className="hero-subtitle">
              Das zentrale Portal für PV-Anlagen, Speicher und Wallboxen.
              Automatische Dokumentenerstellung, Netzbetreiber-Kommunikation und Status-Tracking -
              alles in einer Plattform.
            </p>
            <div className="hero-buttons">
              <Link to="/login" className="btn btn--primary">
                Jetzt Portal nutzen
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <a href="#funktionen" className="btn btn--secondary">Funktionen entdecken</a>
            </div>
            <div className="stats-bar">
              <div className="stat-item">
                <div className="stat-number">850+</div>
                <div className="stat-label">Netzbetreiber</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">15.000+</div>
                <div className="stat-label">Produkte in DB</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">100%</div>
                <div className="stat-label">Automatisiert</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="section" id="funktionen">
          <div className="container">
            <div className="section-header">
              <div className="section-tag">Portal-Funktionen</div>
              <h2 className="section-title">Alles für die Netzanmeldung</h2>
              <p className="section-subtitle">Von der Datenerfassung bis zur fertigen Genehmigung - durchgängig digital.</p>
            </div>

            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <h3>Automatische Dokumentenerstellung</h3>
                <p>Alle erforderlichen Unterlagen werden automatisch generiert - rechtssicher und netzbetreiberkonform.</p>
                <ul className="feature-list">
                  <li>Übersichtsschaltplan (technische Zeichnung)</li>
                  <li>Lageplan mit Satellitenansicht</li>
                  <li>VDE-Formulare E.1 bis E.8</li>
                  <li>Vollmacht Netzbetreiber</li>
                  <li>Inbetriebnahmeprotokoll</li>
                </ul>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                  </svg>
                </div>
                <h3>Produktdatenbank</h3>
                <p>Zugriff auf über 15.000 Komponenten mit allen technischen Daten und Zertifizierungen.</p>
                <ul className="feature-list">
                  <li>PV-Module aller Hersteller</li>
                  <li>Wechselrichter mit ZEREZ-IDs</li>
                  <li>Batteriespeicher</li>
                  <li>Wallboxen und Ladestationen</li>
                  <li>Automatische Datenblatt-Zuordnung</li>
                </ul>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <h3>Netzbetreiber-Integration</h3>
                <p>Alle 850+ deutschen Netzbetreiber hinterlegt - automatische Zuordnung und Anforderungen.</p>
                <ul className="feature-list">
                  <li>PLZ-basierte Erkennung</li>
                  <li>NB-spezifische Formulare</li>
                  <li>Portal-Zugangsverwaltung</li>
                  <li>Direkte Einreichung</li>
                  <li>Status-Synchronisation</li>
                </ul>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>
                  </svg>
                </div>
                <h3>Dashboard & Tracking</h3>
                <p>Behalten Sie den Überblick über alle Anlagen mit Echtzeit-Status und Priorisierung.</p>
                <ul className="feature-list">
                  <li>Kanban, Tabelle oder Kartenansicht</li>
                  <li>Prioritäts-Sortierung</li>
                  <li>Fälligkeits-Tracking</li>
                  <li>Benachrichtigungen</li>
                  <li>Export (CSV, PDF)</li>
                </ul>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <h3>Email-Automation</h3>
                <p>Automatische Benachrichtigungen bei Statusänderungen und Netzbetreiber-Rückmeldungen.</p>
                <ul className="feature-list">
                  <li>Status-Updates an Kunden</li>
                  <li>Erinnerungen bei offenen Aufgaben</li>
                  <li>NB-Rückfragen weiterleiten</li>
                  <li>Anpassbare Vorlagen</li>
                  <li>Versand-Protokollierung</li>
                </ul>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
                  </svg>
                </div>
                <h3>Team & Rollen</h3>
                <p>Verwalten Sie Ihr Team mit differenzierten Zugriffsrechten und Aufgabenzuweisungen.</p>
                <ul className="feature-list">
                  <li>Admin, Mitarbeiter, Kunde</li>
                  <li>Aufgaben zuweisen</li>
                  <li>Aktivitäts-Protokoll</li>
                  <li>Handelsvertreter-Modul</li>
                  <li>Subunternehmer-Anbindung</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Data Entry Channels */}
        <section className="section" style={{ background: 'linear-gradient(180deg, transparent, rgba(56, 189, 248, 0.02), transparent)' }}>
          <div className="container">
            <div className="section-header">
              <div className="section-tag">Datenerfassung</div>
              <h2 className="section-title">Anlagen erfassen - wie Sie möchten</h2>
              <p className="section-subtitle">Drei Wege führen zur fertigen Netzanmeldung.</p>
            </div>

            <div className="channels-grid">
              <div className="channel-card highlight">
                <div className="channel-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>
                  </svg>
                </div>
                <h3>Web-Portal</h3>
                <p>Der vollständige Wizard führt Schritt für Schritt durch alle erforderlichen Daten.</p>
                <span className="channel-badge">Empfohlen</span>
              </div>

              <div className="channel-card">
                <div className="channel-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <h3>WhatsApp</h3>
                <p>Anlagendaten per Chat senden - unser KI-Assistent erfasst alles automatisch.</p>
                <span className="channel-badge">NEU: KI-gestützt</span>
              </div>

              <div className="channel-card">
                <div className="channel-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>
                  </svg>
                </div>
                <h3>GridFlow App</h3>
                <p>Native App für iOS und Android - Anlagen direkt von der Baustelle erfassen.</p>
                <span className="channel-badge">Mobile</span>
              </div>
            </div>
          </div>
        </section>

        {/* Workflow */}
        <section className="section workflow-section" id="workflow">
          <div className="container">
            <div className="section-header">
              <div className="section-tag">Ablauf</div>
              <h2 className="section-title">Von der Erfassung zur Genehmigung</h2>
              <p className="section-subtitle">Der vollautomatische Prozess im Überblick.</p>
            </div>

            <div className="workflow-grid">
              <div className="workflow-step">
                <div className="workflow-number">1</div>
                <h4>Daten erfassen</h4>
                <p>Anlagendaten über Portal, WhatsApp oder App eingeben. Komponenten werden automatisch erkannt.</p>
              </div>
              <div className="workflow-step">
                <div className="workflow-number">2</div>
                <h4>Dokumente generieren</h4>
                <p>Schaltplan, Lageplan, VDE-Formulare und Vollmacht werden automatisch erstellt.</p>
              </div>
              <div className="workflow-step">
                <div className="workflow-number">3</div>
                <h4>Beim NB einreichen</h4>
                <p>Unterlagen werden beim zuständigen Netzbetreiber eingereicht. Status-Updates in Echtzeit.</p>
              </div>
              <div className="workflow-step">
                <div className="workflow-number">4</div>
                <h4>Genehmigung erhalten</h4>
                <p>Nach Freigabe durch den NB sind alle Dokumente im Portal verfügbar.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Solutions */}
        <section className="section" id="loesungen">
          <div className="container">
            <div className="section-header">
              <div className="section-tag">Lösungen</div>
              <h2 className="section-title">Für jeden Bedarf die richtige Lösung</h2>
              <p className="section-subtitle">Vom Einzelinstallateur bis zum Großunternehmen.</p>
            </div>

            <div className="solutions-grid">
              <div className="solution-card">
                <div className="solution-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>
                  </svg>
                </div>
                <h3>Baunity Portal</h3>
                <p>Das vollständige Web-Portal für professionelle Netzanmeldungen.</p>
                <ul className="solution-features">
                  <li>Unbegrenzte Anlagen</li>
                  <li>Alle Automatisierungen</li>
                  <li>Team-Funktionen</li>
                  <li>API-Zugang</li>
                </ul>
              </div>

              <div className="solution-card featured">
                <div className="solution-badge">App</div>
                <div className="solution-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>
                  </svg>
                </div>
                <h3>GridFlow App</h3>
                <p>Native App für Erfassung direkt vor Ort auf der Baustelle.</p>
                <ul className="solution-features">
                  <li>Offline-fähig</li>
                  <li>Kamera für Fotos</li>
                  <li>Push-Benachrichtigungen</li>
                  <li>Schnellerfassung</li>
                </ul>
                <div className="app-badges">
                  <span className="app-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                    iOS
                  </span>
                  <span className="app-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.802 8.99l-2.303 2.303-8.635-8.635z"/></svg>
                    Android
                  </span>
                </div>
              </div>

              <div className="solution-card">
                <div className="solution-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <h3>White-Label</h3>
                <p>Das komplette System unter Ihrer eigenen Marke.</p>
                <ul className="solution-features">
                  <li>Eigenes Branding</li>
                  <li>Eigene Domain</li>
                  <li>Kundenportal</li>
                  <li>Dedizierter Support</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="section">
          <div className="container">
            <div className="section-header">
              <div className="section-tag">Vorteile</div>
              <h2 className="section-title">Warum Baunity?</h2>
            </div>

            <div className="benefits-grid">
              <div className="benefit-card">
                <div className="benefit-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
                </div>
                <h3>Zeitersparnis</h3>
                <p>Automatisierte Dokumentenerstellung spart Stunden pro Anlage.</p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
                </div>
                <h3>Rechtssicher</h3>
                <p>Alle Dokumente entsprechen aktuellen VDE-Normen.</p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
                </div>
                <h3>Produktdaten</h3>
                <p>15.000+ Komponenten mit ZEREZ-IDs und Datenblättern.</p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <h3>850+ NB</h3>
                <p>Alle deutschen Netzbetreiber mit Anforderungen hinterlegt.</p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                </div>
                <h3>WhatsApp</h3>
                <p>Anlagen per Chat erfassen mit KI-Unterstützung.</p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>
                </div>
                <h3>Mobile App</h3>
                <p>GridFlow App für Erfassung direkt vor Ort.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta-section" id="kontakt">
          <div className="container">
            <div className="cta-box">
              <h2>Bereit für automatisierte Netzanmeldungen?</h2>
              <p>Testen Sie das Portal und erleben Sie, wie einfach Netzanmeldungen sein können.</p>
              <div className="cta-buttons">
                <Link to="/login" className="btn btn--primary">
                  Portal öffnen
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
                <Link to="/download" className="btn btn--secondary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                  Desktop App
                </Link>
                <a href="mailto:info@baunity.de" className="btn btn--secondary">Kontakt aufnehmen</a>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-inner">
            <div className="footer-brand">
              <div className="footer-logo-mark">GN</div>
              <span>Baunity - Digitale Netzanmeldungen</span>
            </div>
            <div className="footer-links">
              <Link to="/download">Desktop App</Link>
              <Link to="/partner">Partner</Link>
              <Link to="/unternehmen">Unternehmen</Link>
              <Link to="/impressum">Impressum</Link>
              <Link to="/datenschutz">Datenschutz</Link>
              <Link to="/agb">AGB</Link>
            </div>
            <div className="footer-bottom">
              <span>&copy; <span ref={yearRef}></span> Baunity. Alle Rechte vorbehalten.</span>
              <span>Software-Dienstleistungen für Elektro-Fachbetriebe</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
