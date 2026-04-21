export function isNative(): boolean {
  return typeof window !== "undefined" && !!(window as any).Capacitor?.isNative
}
