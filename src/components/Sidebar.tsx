'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { signOut } from '@/lib/pocketbase'
import pb from '@/lib/pocketbase'
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
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const isAdmin = account?.role === 'admin'

  const handleSignOut = async () => {
    await signOut()
  }

  // Get avatar URL if available
  const userData = account?.expand?.user
  const getAvatarUrl = () => {
    if (userData?.avatar) {
      return pb.files.getUrl(userData, userData.avatar)
    }
    return null
  }
  const avatarUrl = getAvatarUrl()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'New Search', href: '/search/new', icon: Search },
    { name: 'Billing', href: '/billing', icon: CreditCard },
    { name: 'Account', href: '/account', icon: Settings },
    { name: 'Feedback', href: '/feedback', icon: MessageSquare },
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
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
          isActive
            ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        )}
      >
        <item.icon className="h-5 w-5" />
        {item.name}
      </Link>
    )
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-screen bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-gray-100">
        <Link 
          href="/dashboard" 
          onClick={() => setIsMobileOpen(false)}
          className="flex items-center gap-2.5"
        >
          <div className="bg-blue-600 p-1.5 rounded-lg shadow-sm shadow-blue-600/20">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">Diliguard</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => (
          <NavLink key={item.name} item={item} />
        ))}

        {isAdmin && (
          <>
            <div className="pt-6 pb-2 px-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Admin
              </p>
            </div>
            {adminNavigation.map((item) => (
              <NavLink key={item.name} item={item} />
            ))}
          </>
        )}
      </nav>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt="Profile" 
              className="h-10 w-10 rounded-full object-cover border border-gray-200"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm shadow-blue-600/20">
              {userData?.name?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {userData?.name || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {userData?.email}
            </p>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
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
          className="p-2 bg-white border border-gray-200 text-gray-900 rounded-lg shadow-sm"
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

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'lg:hidden fixed inset-y-0 left-0 w-72 z-50 transform transition-transform duration-300 ease-in-out shadow-2xl',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block lg:w-64 lg:fixed lg:inset-y-0 z-30">
        <SidebarContent />
      </aside>
    </>
  )
}