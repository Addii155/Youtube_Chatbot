
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

// Particles Background Component
const ParticlesBackground = () => {
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
        background: `
          radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 2px, transparent 2px),
          radial-gradient(circle at 75% 75%, rgba(59, 130, 246, 0.08) 1px, transparent 1px),
          radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.05) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px, 40px 40px, 25px 25px',
        animation: 'float 25s ease-in-out infinite'
      }}
    >
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          33% { transform: translateY(-15px) translateX(8px); }
          66% { transform: translateY(8px) translateX(-8px); }
        }
      `}</style>
    </div>
  );
};
export default ParticlesBackground