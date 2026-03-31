"use client"

interface Props {
  titulo: string
  contenido: string
}

export default function SeccionContenido({ titulo, contenido }: Props) {
  const renderContent = (text: string) => {
    return text.split("\n\n").map((paragraph, i) => {
      // Headers
      if (paragraph.startsWith("**") && paragraph.endsWith("**")) {
        return (
          <h3 key={i} className="text-lg font-bold text-gray-900 mt-8 mb-3">
            {paragraph.replace(/\*\*/g, "")}
          </h3>
        )
      }
      // Horizontal rule
      if (paragraph.startsWith("---")) {
        return <hr key={i} className="my-6 border-gray-200" />
      }
      // Lists
      if (paragraph.includes("\n-") || paragraph.startsWith("-")) {
        const lines = paragraph.split("\n")
        const title = lines[0].startsWith("-") ? null : lines[0]
        const items = lines.filter((l) => l.startsWith("-") || l.startsWith("  -"))
        return (
          <div key={i} className="my-4">
            {title && (
              <p
                className="font-semibold text-gray-800 mb-2"
                dangerouslySetInnerHTML={{
                  __html: title.replace(
                    /\*\*(.*?)\*\*/g,
                    '<strong class="text-gray-900">$1</strong>'
                  ),
                }}
              />
            )}
            <ul className="space-y-2 ml-1">
              {items.map((item, j) => (
                <li key={j} className="flex items-start gap-2.5 text-gray-700 leading-relaxed">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                  <span
                    dangerouslySetInnerHTML={{
                      __html: item
                        .replace(/^-\s*/, "")
                        .replace(
                          /\*\*(.*?)\*\*/g,
                          '<strong class="text-gray-900">$1</strong>'
                        ),
                    }}
                  />
                </li>
              ))}
            </ul>
          </div>
        )
      }
      // Paragraphs with bold
      if (paragraph.includes("**")) {
        return (
          <p
            key={i}
            className="text-gray-700 leading-relaxed my-3"
            dangerouslySetInnerHTML={{
              __html: paragraph.replace(
                /\*\*(.*?)\*\*/g,
                '<strong class="text-gray-900">$1</strong>'
              ),
            }}
          />
        )
      }
      // Regular paragraph
      return (
        <p key={i} className="text-gray-700 leading-relaxed my-3">
          {paragraph}
        </p>
      )
    })
  }

  return <div className="max-w-none">{renderContent(contenido)}</div>
}
