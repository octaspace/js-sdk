import { RouterProvider } from '@tanstack/react-router'
import { createRoot } from 'react-dom/client'
import './app.css'
import { router } from './router'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element #root not found')

createRoot(rootEl).render(<RouterProvider router={router} />)
