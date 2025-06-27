import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
// import ParticlesBackground from './components/Particles.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* <ParticlesBackground/> */}
    <App />
  </StrictMode>,
)
