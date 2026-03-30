import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"

export function createServerClient() {
  const cookieStore = cookies()
  return createClient(cookieStore)
}
