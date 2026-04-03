import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const iso = typeof date === "string" ? date : date.toISOString()
  const [year, month, day] = iso.split("T")[0].split("-").map(Number)
  return new Date(year, month - 1, day).toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export function formatCurrency(amount: number): string {
  return `Gs. ${amount.toLocaleString("es-PY")}`
}
