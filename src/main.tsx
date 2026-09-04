import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import FlowSure from './FlowSure.tsx'
import './style.css'

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <FlowSure />
  </StrictMode>,
)
