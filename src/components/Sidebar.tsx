'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Search,
  CreditCard,
  Settings,
  FileText,
  MessageSquare,
  Users,
  Menu,
  X,
} from 'lucide-react'
import type { Account } from '@/types'

interface SidebarProps {
  account: Account | null
}

export default function Sidebar({ account }: SidebarProps) {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const isAdmin = account?.role === 'admin'

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

  const legalNavigation = [
    { name: 'Privacy Policy', href: '/privacy', icon: FileText },
    { name: 'Terms of Service', href: '/terms', icon: FileText },
  ]

  const NavLink = ({ item }: { item: any }) => {
    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
    
    return (
      <Link
        href={item.href}
        onClick={() => setIsMobileOpen(false)}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
          isActive
            ? 'bg-gray-900 text-white'
            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
        )}
      >
        <item.icon className="h-5 w-5" />
        {item.name}
      </Link>
    )
  }

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="px-3 py-4">
        <Link href="/dashboard" onClick={() => setIsMobileOpen(false)}>
          <h1 className="text-2xl font-bold text-gray-900">Diliguard</h1>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigation.map((item) => item.show && <NavLink key={item.name} item={item} />)}
      </nav>

      {/* Admin Navigation */}
      {isAdmin && (
        <>
          <div className="px-3 py-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Admin
            </p>
          </div>
          <nav className="px-2 space-y-1">
            {adminNavigation.map((item) => (
              <NavLink key={item.name} item={item} />
            ))}
          </nav>
        </>
      )}

      {/* Legal Links */}
      <div className="border-t border-gray-200 mt-auto">
        <div className="px-3 py-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Legal
          </p>
        </div>
        <nav className="px-2 pb-4 space-y-1">
          {legalNavigation.map((item) => (
            <NavLink key={item.name} item={item} />
          ))}
        </nav>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 bg-gray-900 text-white rounded-md hover:bg-gray-800"
        >
          {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'lg:hidden fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-gray-200 z-40 transform transition-transform duration-300 ease-in-out flex flex-col',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200">
        <SidebarContent />
      </aside>
    </>
  )
}