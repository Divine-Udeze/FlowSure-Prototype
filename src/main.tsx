import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import FlowSure from './FlowSure.tsx'

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <FlowSure />
  </StrictMode>,
)
