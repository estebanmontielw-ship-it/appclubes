"use client"

import Link from "next/link"
import { Bell, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"

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
    <header className="sticky top-0 z-40 bg-white border-b h-16 flex items-center px-4 md:px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden mr-2"
        onClick={onMenuToggle}
      >
        {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      <div className="flex-1" />

      <div className="flex items-center gap-4">
        {/* Notifications bell */}
        <Link href="/oficiales/notificaciones" className="relative">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Link>

        {/* User name */}
        <span className="text-sm font-medium hidden sm:inline">{userName}</span>
      </div>
    </header>
  )
}
