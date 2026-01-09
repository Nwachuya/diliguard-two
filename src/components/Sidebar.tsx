'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { signOut } from '@/lib/pocketbase'
import {
  LayoutDashboard,
  Search,
  CreditCard,
  Settings,
  MessageSquare,
  Users,
  Menu,
  X,
  LogOut,
  ShieldCheck
} from 'lucide-react'
import type { AccountWithUser } from '@/types'

interface SidebarProps {
  account: AccountWithUser | null
}

export default function Sidebar({ account }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const isAdmin = account?.role === 'admin'

  // --- LOGOUT LOGIC ---
  const handleSignOut = async () => {
    await signOut()
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, show: true },
    { name: 'New Search', href: '/search/new', icon: Search, show: true },
    { name: 'Billing', href: '/billing', icon: CreditCard, show: true },
    { name: 'Account', href: '/account', icon: Settings, show: true },
    { name: 'Feedback', href: '/feedback', icon: MessageSquare, show: true },
  ]

  const adminNavigation = [
    { name: 'Admin Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Searches', href: '/admin/searches', icon: Search },
  ]

  const NavLink = ({ item }: { item: any }) => {
    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
    
    return (
      <Link
        href={item.href}
        onClick={() => setIsMobileOpen(false)}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors mb-1',
          isActive
            ? 'bg-gray-900 text-white shadow-sm'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        )}
      >
        <item.icon className="h-5 w-5" />
        {item.name}
      </Link>
    )
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* 1. Header / Logo */}
      <div className="px-6 py-6 flex items-center gap-2.5">
        <div className="bg-blue-600 p-1.5 rounded-lg">
          <ShieldCheck className="h-6 w-6 text-white" />
        </div>
        <Link href="/dashboard" onClick={() => setIsMobileOpen(false)}>
          <span className="text-xl font-bold text-gray-900 tracking-tight">Diliguard</span>
        </Link>
      </div>

      {/* 2. Scrollable Nav Items */}
      <div className="flex-1 flex flex-col overflow-y-auto px-3 py-2">
        <nav className="space-y-1">
          {navigation.map((item) => item.show && <NavLink key={item.name} item={item} />)}
        </nav>

        {isAdmin && (
          <div className="mt-8">
            <div className="px-3 mb-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Admin Controls
              </p>
            </div>
            <nav className="space-y-1">
              {adminNavigation.map((item) => (
                <NavLink key={item.name} item={item} />
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* 3. Footer: User Profile & Logout */}
      <div className="p-4 border-t border-gray-200 bg-gray-50/50">
        
        {/* User Info */}
        <div className="flex items-center gap-3 px-2 mb-4">
           <div className="h-9 w-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-blue-600 font-bold text-sm shadow-sm">
              {account?.expand?.user?.name?.[0]?.toUpperCase() || 'U'}
           </div>
           <div className="overflow-hidden">
             <p className="text-sm font-semibold text-gray-900 truncate">
                {account?.expand?.user?.name || 'User'}
             </p>
             <p className="text-xs text-gray-500 truncate max-w-[140px]">
                {account?.expand?.user?.email}
             </p>
           </div>
        </div>

        {/* LOGOUT BUTTON */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors border border-red-100"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Trigger */}
      <div className="lg:hidden fixed top-4 left-4 z-40">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 bg-white border border-gray-200 text-gray-900 rounded-md shadow-sm"
        >
          {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar Panel */}
      <aside
        className={cn(
          'lg:hidden fixed inset-y-0 left-0 w-72 z-50 transform transition-transform duration-300 ease-in-out shadow-2xl',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar Panel */}
      <aside className="hidden lg:flex lg:w-64 lg:fixed lg:inset-y-0 shadow-sm z-30">
        <SidebarContent />
      </aside>
    </>
  )
}