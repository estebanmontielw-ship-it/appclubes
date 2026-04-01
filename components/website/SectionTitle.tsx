interface SectionTitleProps {
  title: string
  subtitle?: string
  className?: string
}

export default function SectionTitle({ title, subtitle, className }: SectionTitleProps) {
  return (
    <div className={className}>
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h2>
      {subtitle && <p className="mt-2 text-gray-500">{subtitle}</p>}
    </div>
  )
}
