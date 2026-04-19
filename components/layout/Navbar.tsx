"use client"

import Link from "next/link"
import { Bell, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface NavbarProps {
  userName: string
  unreadCount: number
  onMenuToggle: () => void
  menuOpen: boolean
}

export default function Navbar({
  userName,
  unreadCount,
  onMenuToggle,
  menuOpen,
}: NavbarProps) {
  return (
    <header
      data-navbar
      className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
    <div className="h-14 flex items-center px-4 md:px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden mr-2 h-9 w-9"
        onClick={onMenuToggle}
      >
        {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile logo */}
      <Link href="/oficiales" className="md:hidden flex items-center gap-2">
        <img src="/logo-cpb.jpg" alt="CPB" className="h-7 w-7 object-contain" />
        <span className="font-bold text-sm">CPB</span>
      </Link>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        {/* Notifications bell */}
        <Link href="/oficiales/notificaciones">
          <Button variant="ghost" size="icon" className="relative h-9 w-9">
            <Bell className="h-[18px] w-[18px] text-gray-500" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        </Link>

        {/* User name */}
        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-gray-100">
          <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-sm font-medium text-gray-700">{userName}</span>
        </div>
      </div>
    </div>
    </header>
  )
}
