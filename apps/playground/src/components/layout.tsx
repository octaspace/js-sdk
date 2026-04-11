import { Outlet } from '@tanstack/react-router'
import { RequestLog } from './request-log'
import { Sidebar } from './sidebar'

export function Layout() {
  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-100">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
      <RequestLog />
    </div>
  )
}
