import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const checks: Record<string, string> = {}

  // Check env vars
  checks.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ? "OK" : "MISSING"
  checks.supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "OK" : "MISSING"
  checks.supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY ? "OK" : "MISSING"
  checks.databaseUrl = process.env.DATABASE_URL ? "OK" : "MISSING"
  checks.directUrl = process.env.DIRECT_URL ? "OK" : "MISSING"

  // Check DB connection
  try {
    const count = await prisma.usuario.count()
    checks.database = `OK (${count} usuarios)`
  } catch (err: any) {
    checks.database = `ERROR: ${err.message?.substring(0, 200)}`
  }

  return NextResponse.json(checks)
}
