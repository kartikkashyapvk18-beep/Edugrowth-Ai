@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
@import "tailwindcss";

@theme {
  --font-sans: "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;
}

body {
  font-family: var(--font-sans);
  background-color: #0b0f19;
  color: #f1f5f9;
}

/* Custom Neon Glow Shadow Helpers */
.neon-glow-blue {
  box-shadow: 0 0 15px rgba(59, 130, 246, 0.35);
  border-color: rgba(59, 130, 246, 0.45) !important;
}

.neon-glow-red {
  box-shadow: 0 0 15px rgba(220, 38, 38, 0.35);
  border-color: rgba(220, 38, 38, 0.45) !important;
}

.neon-glow-emerald {
  box-shadow: 0 0 15px rgba(16, 185, 129, 0.35);
  border-color: rgba(16, 185, 129, 0.45) !important;
}

.neon-glow-amber {
  box-shadow: 0 0 15px rgba(245, 158, 11, 0.35);
  border-color: rgba(245, 158, 11, 0.45) !important;
}

.neon-glow-indigo {
  box-shadow: 0 0 15px rgba(99, 102, 241, 0.35);
  border-color: rgba(99, 102, 241, 0.45) !important;
}

/* Glassmorphism Styles */
.glass-pane {
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.glass-card {
  background: rgba(30, 41, 59, 0.45);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.glass-input {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #f1f5f9;
}

.glass-input:focus {
  border-color: rgba(99, 102, 241, 0.6);
  box-shadow: 0 0 10px rgba(99, 102, 241, 0.25);
  outline: none;
}

/* Slide in animation */
@keyframes slideLeft {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slide-left {
  animation: slideLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

