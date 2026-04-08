"use client"

import { useEditor, EditorContent, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import { useEffect } from "react"
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Undo2,
  Redo2,
  Pilcrow,
} from "lucide-react"

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`h-8 w-8 inline-flex items-center justify-center rounded-md text-sm transition-colors ${
        active
          ? "bg-primary text-white"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      } disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  )
}

function Toolbar({ editor }: { editor: Editor }) {
  const addLink = () => {
    const previous = editor.getAttributes("link").href
    const url = window.prompt("URL del enlace", previous || "https://")
    if (url === null) return
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }

  return (
    <div className="flex items-center flex-wrap gap-0.5 px-2 py-1.5 border-b border-gray-200 bg-gray-50/60 rounded-t-lg">
      <ToolbarButton
        onClick={() => editor.chain().focus().setParagraph().run()}
        active={editor.isActive("paragraph") && !editor.isActive("heading")}
        title="Párrafo"
      >
        <Pilcrow className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
        title="Título grande"
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive("heading", { level: 3 })}
        title="Subtítulo"
      >
        <Heading3 className="h-4 w-4" />
      </ToolbarButton>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        title="Negrita (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        title="Cursiva (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive("underline")}
        title="Subrayado (Ctrl+U)"
      >
        <UnderlineIcon className="h-4 w-4" />
      </ToolbarButton>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        title="Lista con viñetas"
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        title="Lista numerada"
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
        title="Cita"
      >
        <Quote className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={addLink}
        active={editor.isActive("link")}
        title="Enlace"
      >
        <LinkIcon className="h-4 w-4" />
      </ToolbarButton>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Deshacer (Ctrl+Z)"
      >
        <Undo2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Rehacer (Ctrl+Shift+Z)"
      >
        <Redo2 className="h-4 w-4" />
      </ToolbarButton>
    </div>
  )
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Empezá a escribir...",
  minHeight = 260,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: "text-primary underline",
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap-editor focus:outline-none",
        style: `min-height: ${minHeight}px`,
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      // Tiptap returns <p></p> for an empty doc — treat that as empty string
      onChange(html === "<p></p>" ? "" : html)
    },
  })

  // Sync incoming value changes (e.g. after AI generation) without
  // clobbering the user's cursor while they're typing.
  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    const next = value || "<p></p>"
    if (next !== current) {
      editor.commands.setContent(next, { emitUpdate: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor])

  if (!editor) {
    return (
      <div
        className="rounded-lg border border-gray-200 bg-white animate-pulse"
        style={{ minHeight: minHeight + 42 }}
      />
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-shadow">
      <Toolbar editor={editor} />
      <div className="px-4 py-3">
        <EditorContent editor={editor} data-placeholder={placeholder} />
      </div>
    </div>
  )
}
