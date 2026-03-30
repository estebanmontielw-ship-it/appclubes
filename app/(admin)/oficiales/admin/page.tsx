"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, Clock, DollarSign } from "lucide-react"

interface AdminStats {
  totalUsuarios: number
  verificados: number
  pendientes: number
  pagosPendientes: number
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then(setStats)
      .catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard Admin</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          title="Usuarios totales"
          value={stats?.totalUsuarios ?? "..."}
          href="/oficiales/admin/usuarios"
        />
        <StatCard
          icon={<UserCheck className="h-5 w-5" />}
          title="Verificados"
          value={stats?.verificados ?? "..."}
          href="/oficiales/admin/usuarios"
          color="text-green-600 bg-green-100"
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          title="Pendientes"
          value={stats?.pendientes ?? "..."}
          href="/oficiales/admin/usuarios"
          color="text-yellow-600 bg-yellow-100"
        />
        <StatCard
          icon={<DollarSign className="h-5 w-5" />}
          title="Pagos pendientes"
          value={stats?.pagosPendientes ?? "..."}
          href="/oficiales/admin/pagos"
          color="text-blue-600 bg-blue-100"
        />
      </div>
    </div>
  )
}

function StatCard({
  icon,
  title,
  value,
  href,
  color = "text-primary bg-primary/10",
}: {
  icon: React.ReactNode
  title: string
  value: number | string
  href: string
  color?: string
}) {
  return (
    <Link href={href}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-3xl font-bold mt-1">{value}</p>
            </div>
            <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
