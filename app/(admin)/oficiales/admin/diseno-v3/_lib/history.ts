// Undo/redo sencillo basado en snapshots JSON del canvas.
// Guarda hasta MAX_STATES estados. Se pausa durante operaciones de carga
// para no contaminar el historial.


const MAX_STATES = 60

const CANVAS_JSON_FIELDS = [
  "id",
  "name",
  "role",
  "excludeFromSnap",
  "editable",
  "lockMovementX",
  "lockMovementY",
  "selectable",
]

export interface HistoryHandle {
  snapshot: () => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  pause: () => void
  resume: () => void
  dispose: () => void
}

export function attachHistory(canvas: any, onChange?: () => void): HistoryHandle {
  const past: string[] = []
  const future: string[] = []
  let paused = false

  function serialize(): string {
    return JSON.stringify(canvas.toJSON(CANVAS_JSON_FIELDS))
  }

  function load(json: string) {
    paused = true
    canvas.loadFromJSON(json, () => {
      canvas.requestRenderAll()
      paused = false
      onChange?.()
    })
  }

  function snapshot() {
    if (paused) return
    const state = serialize()
    const last = past[past.length - 1]
    if (state === last) return
    past.push(state)
    if (past.length > MAX_STATES) past.shift()
    future.length = 0
    onChange?.()
  }

  function undo() {
    if (past.length < 2) return
    const current = past.pop()!
    future.push(current)
    const prev = past[past.length - 1]
    load(prev)
  }

  function redo() {
    const next = future.pop()
    if (!next) return
    past.push(next)
    load(next)
  }

  const onMod = () => snapshot()

  canvas.on("object:modified", onMod)
  canvas.on("object:added", onMod)
  canvas.on("object:removed", onMod)
  canvas.on("path:created", onMod)

  // Estado inicial
  past.push(serialize())

  return {
    snapshot,
    undo,
    redo,
    canUndo: () => past.length > 1,
    canRedo: () => future.length > 0,
    pause: () => { paused = true },
    resume: () => { paused = false },
    dispose() {
      canvas.off("object:modified", onMod)
      canvas.off("object:added", onMod)
      canvas.off("object:removed", onMod)
      canvas.off("path:created", onMod)
    },
  }
}
