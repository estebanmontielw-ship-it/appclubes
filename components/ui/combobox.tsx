"use client"

import * as React from "react"
import { Check, ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ComboboxOption {
  value: string
  label: string
  group?: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  disabled?: boolean
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Seleccioná...",
  searchPlaceholder = "Buscá...",
  emptyMessage = "Sin resultados",
  className,
  disabled,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const containerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1)

  const selectedLabel = options.find((o) => o.value === value)?.label || ""

  const filtered = React.useMemo(() => {
    if (!search) return options
    const term = search.toLowerCase()
    return options.filter((o) => o.label.toLowerCase().includes(term))
  }, [options, search])

  // Group filtered options
  const grouped = React.useMemo(() => {
    const groups: { group: string; items: ComboboxOption[] }[] = []
    const seen = new Set<string>()
    for (const opt of filtered) {
      const g = opt.group || ""
      if (!seen.has(g)) {
        seen.add(g)
        groups.push({ group: g, items: [] })
      }
      groups.find((gr) => gr.group === g)!.items.push(opt)
    }
    return groups
  }, [filtered])

  // Flat list for keyboard navigation
  const flatFiltered = React.useMemo(() => {
    return grouped.flatMap((g) => g.items)
  }, [grouped])

  React.useEffect(() => {
    setHighlightedIndex(-1)
  }, [search])

  // Close on click outside
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch("")
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleSelect = (val: string) => {
    onValueChange(val)
    setOpen(false)
    setSearch("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlightedIndex((prev) => Math.min(prev + 1, flatFiltered.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlightedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (highlightedIndex >= 0 && highlightedIndex < flatFiltered.length) {
        handleSelect(flatFiltered[highlightedIndex].value)
      }
    } else if (e.key === "Escape") {
      setOpen(false)
      setSearch("")
    }
  }

  // Scroll highlighted item into view
  React.useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("[data-combobox-item]")
      items[highlightedIndex]?.scrollIntoView({ block: "nearest" })
    }
  }, [highlightedIndex])

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setOpen(!open)
          if (!open) setTimeout(() => inputRef.current?.focus(), 0)
        }}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          !value && "text-muted-foreground"
        )}
      >
        <span className="line-clamp-1 text-left">{value ? selectedLabel : placeholder}</span>
        <div className="flex items-center gap-1">
          {value && (
            <span
              role="button"
              tabIndex={-1}
              className="rounded-sm p-0.5 hover:bg-accent"
              onClick={(e) => {
                e.stopPropagation()
                onValueChange("")
              }}
            >
              <X className="h-3.5 w-3.5 opacity-50" />
            </span>
          )}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </div>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
          <div className="p-2">
            <input
              ref={inputRef}
              type="text"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div ref={listRef} className="max-h-60 overflow-y-auto p-1">
            {flatFiltered.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>
            ) : (
              grouped.map((group) => (
                <React.Fragment key={group.group}>
                  {group.group && (
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      {group.group}
                    </div>
                  )}
                  {group.items.map((option) => {
                    const flatIndex = flatFiltered.indexOf(option)
                    return (
                      <div
                        key={option.value}
                        data-combobox-item
                        role="option"
                        aria-selected={value === option.value}
                        className={cn(
                          "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none",
                          value === option.value && "font-medium",
                          flatIndex === highlightedIndex
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-accent hover:text-accent-foreground"
                        )}
                        onClick={() => handleSelect(option.value)}
                      >
                        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                          {value === option.value && <Check className="h-4 w-4" />}
                        </span>
                        {option.label}
                      </div>
                    )
                  })}
                </React.Fragment>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
