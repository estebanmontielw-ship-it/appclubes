interface SectionTitleProps {
  title: string
  subtitle?: string
  className?: string
  centered?: boolean
}

export default function SectionTitle({ title, subtitle, className, centered }: SectionTitleProps) {
  return (
    <div className={`${centered ? "text-center" : ""} ${className || ""}`}>
      <h2 className="font-heading text-3xl sm:text-4xl text-gray-900 tracking-wide">{title}</h2>
      {subtitle && <p className="mt-2 text-gray-500 text-base">{subtitle}</p>}
    </div>
  )
}
