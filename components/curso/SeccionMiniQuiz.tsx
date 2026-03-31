"use client"

import { useState } from "react"
import { CheckCircle, XCircle, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface QuizOption {
  texto: string
  correcta: boolean
  explicacion?: string
}

interface QuizQuestion {
  pregunta: string
  opciones: QuizOption[]
}

interface Props {
  titulo: string
  contenido: string
  metadata?: string // JSON with questions
}

export default function SeccionMiniQuiz({ titulo, contenido, metadata }: Props) {
  let questions: QuizQuestion[] = []
  try {
    if (metadata) questions = JSON.parse(metadata)
  } catch {}

  const [currentQ, setCurrentQ] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  if (questions.length === 0) {
    return (
      <div className="rounded-xl border-2 border-purple-200 bg-purple-50 p-6">
        <p className="text-purple-800">{contenido}</p>
      </div>
    )
  }

  const q = questions[currentQ]
  const isCorrect = selected !== null && q.opciones[selected]?.correcta

  const handleSelect = (idx: number) => {
    if (answered) return
    setSelected(idx)
  }

  const handleConfirm = () => {
    if (selected === null) return
    setAnswered(true)
    if (q.opciones[selected]?.correcta) {
      setScore((s) => s + 1)
    }
  }

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ((c) => c + 1)
      setSelected(null)
      setAnswered(false)
    } else {
      setFinished(true)
    }
  }

  if (finished) {
    const pct = Math.round((score / questions.length) * 100)
    return (
      <div className="rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 p-6 text-center space-y-3">
        <div className="flex items-center gap-2 justify-center">
          <HelpCircle className="h-5 w-5 text-purple-600" />
          <h3 className="font-bold text-purple-800">Quiz completado</h3>
        </div>
        <div className="text-4xl font-bold text-purple-700">{pct}%</div>
        <p className="text-purple-600">{score} de {questions.length} correctas</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setCurrentQ(0)
            setSelected(null)
            setAnswered(false)
            setScore(0)
            setFinished(false)
          }}
        >
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-purple-600" />
          <h3 className="font-bold text-purple-800">Quiz rápido</h3>
        </div>
        <span className="text-xs text-purple-500 font-medium">
          {currentQ + 1} / {questions.length}
        </span>
      </div>

      <p className="font-medium text-purple-900">{q.pregunta}</p>

      <div className="space-y-2">
        {q.opciones.map((opt, idx) => {
          let borderColor = "border-purple-100 hover:border-purple-300"
          let bgColor = "bg-white"

          if (answered && idx === selected) {
            borderColor = isCorrect ? "border-green-400" : "border-red-400"
            bgColor = isCorrect ? "bg-green-50" : "bg-red-50"
          } else if (answered && opt.correcta) {
            borderColor = "border-green-400"
            bgColor = "bg-green-50"
          } else if (selected === idx) {
            borderColor = "border-purple-400"
            bgColor = "bg-purple-50"
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={answered}
              className={`w-full text-left p-3 rounded-lg border-2 transition-all text-sm ${borderColor} ${bgColor}`}
            >
              <div className="flex items-center gap-2">
                {answered && opt.correcta && <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />}
                {answered && idx === selected && !opt.correcta && <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />}
                <span dangerouslySetInnerHTML={{ __html: opt.texto.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
              </div>
              {answered && idx === selected && opt.explicacion && (
                <p className="text-xs text-gray-600 mt-2 ml-6">{opt.explicacion}</p>
              )}
            </button>
          )
        })}
      </div>

      {!answered ? (
        <Button
          onClick={handleConfirm}
          disabled={selected === null}
          className="w-full"
          variant="outline"
        >
          Verificar respuesta
        </Button>
      ) : (
        <Button onClick={handleNext} className="w-full">
          {currentQ < questions.length - 1 ? "Siguiente pregunta" : "Ver resultado"}
        </Button>
      )}
    </div>
  )
}
