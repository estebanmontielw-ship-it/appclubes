import MacroCalendar from "@/components/admin/MacroCalendar"

export default function CalendarioMacroPage() {
  return (
    <div className="p-4 sm:p-6 max-w-[1400px]">
      <div className="mb-6">
        <h1 className="text-xl font-black text-gray-900 tracking-tight">Calendario Macro</h1>
        <p className="text-sm text-gray-500 mt-0.5">Vista unificada — LNB · LNBF · U22 Masc · U22 Fem</p>
      </div>
      <MacroCalendar />
    </div>
  )
}
