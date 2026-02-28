import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useThemeStore } from '@/stores/themeStore'

// Initialize theme before React renders to prevent flash of wrong theme
useThemeStore.getState().initTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
