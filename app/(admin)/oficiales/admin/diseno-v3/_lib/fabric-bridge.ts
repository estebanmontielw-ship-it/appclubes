// Wrapper para cargar fabric.js solo en el cliente.
// Fabric v5 es CommonJS y tiene referencias a `window/document` → no puede
// correr en SSR. Esta función se llama dentro de useEffect.


let cached: any = null

export async function loadFabric(): Promise<any> {
  if (cached) return cached
  if (typeof window === "undefined") {
    throw new Error("loadFabric() solo puede usarse en el cliente")
  }
  const mod = await import("fabric")
  // fabric v5: expone `.fabric`; v6: expone los objetos directamente.
  cached = (mod as any).fabric ?? mod
  return cached
}

export type Fabric = any
