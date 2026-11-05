import { useState } from 'react'
import ResultCard from './ResultCard'
import type { ResultData } from '../App'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface TextDetectorProps {
  onAnalyzed: (result: ResultData, preview: string) => void
}

function detectLanguage(text: string): string {
  // Simple heuristic — API should return the real language
  const ptWords = /\b(que|não|com|uma|para|por|como|mais|isso|este|esta)\b/i
  const enWords = /\b(the|and|that|this|with|from|have|they|were|been)\b/i
  const matches_pt = (text.match(ptWords) ?? []).length
  const matches_en = (text.match(enWords) ?? []).length
  if (matches_pt >= matches_en) return 'pt'
  return 'en'
}

export default function TextDetector({ onAnalyzed }: TextDetectorProps) {
  const [text, setText] = useState('')
  const [result, setResult] = useState<ResultData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dots, setDots] = useState('.')

  const wordCount = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0
  const charCount = text.length

  const analyze = async () => {
    if (text.trim().length < 20) {
      setError('Digite pelo menos 20 caracteres para análise.')
      return
    }
    setError('')
    setResult(null)
    setLoading(true)

    const interval = setInterval(() => {
      setDots(d => (d.length >= 3 ? '.' : d + '.'))
    }, 400)

    try {
      const res = await fetch(`${API_URL}/detect/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error((err as { detail?: string }).detail || 'Erro na análise')
      }
      const data = await res.json() as ResultData
      // Enrich with language if not provided
      if (!data.language) {
        data.language = detectLanguage(text)
      }
      setResult(data)
      onAnalyzed(data, text.substring(0, 50))
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Não foi possível conectar ao servidor.'
      setError(msg)
    } finally {
      clearInterval(interval)
      setLoading(false)
    }
  }

  const clear = () => {
    setText('')
    setResult(null)
    setError('')
  }

  return (
    <div className="cyber-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-purple-400 text-lg">📝</span>
        <h2 className="text-slate-200 font-mono font-semibold">Análise de Texto</h2>
        <span className="ml-auto text-xs text-slate-600 font-mono">
          {wordCount} palavras · {charCount} chars
        </span>
      </div>

      <textarea
        className="cyber-input w-full h-48 p-4 text-sm leading-relaxed"
        placeholder={`Cole aqui o texto que deseja analisar\n\nPode ser um artigo, redação, e-mail, post, etc.\nMínimo de 20 caracteres.`}
        value={text}
        onChange={e => setText(e.target.value)}
        disabled={loading}
      />

      {error && (
        <div className="mt-3 px-4 py-2 bg-red-950/40 border border-red-800/50 rounded-lg text-red-400 text-xs font-mono">
          ⚠️ {error}
        </div>
      )}

      <div className="flex gap-2 mt-4">
        {text && (
          <button
            className="cyber-btn-secondary"
            onClick={clear}
            disabled={loading}
          >
            🗑️ Limpar
          </button>
        )}
        <button
          className="cyber-btn flex-1 py-3 text-sm font-semibold tracking-wider"
          onClick={analyze}
          disabled={loading || text.trim().length < 20}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Analisando{dots}
            </span>
          ) : (
            '⚡ ANALISAR TEXTO'
          )}
        </button>
      </div>

      {loading && (
        <div className="mt-4 text-center">
          <div className="step-loader justify-center mb-2">
            <div className="step-loader-dot" />
            <div className="step-loader-dot" />
            <div className="step-loader-dot" />
          </div>
          <span className="text-xs text-slate-600 font-mono">
            Carregando modelo de detecção · Primeira análise pode demorar mais
          </span>
        </div>
      )}

      {result && <ResultCard result={result} />}
    </div>
  )
}
