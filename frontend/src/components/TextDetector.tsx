import { useState } from 'react'
import ResultCard from './ResultCard'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function TextDetector() {
  const [text, setText] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dots, setDots] = useState('.')

  const analyze = async () => {
    if (text.trim().length < 20) {
      setError('Digite pelo menos 20 caracteres para análise.')
      return
    }
    setError('')
    setResult(null)
    setLoading(true)

    // Animated dots
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? '.' : d + '.')
    }, 400)

    try {
      const res = await fetch(`${API_URL}/detect/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Erro na análise')
      }
      const data = await res.json()
      setResult(data)
    } catch (e: any) {
      setError(e.message || 'Não foi possível conectar ao servidor. Verifique se o backend está rodando.')
    } finally {
      clearInterval(interval)
      setLoading(false)
    }
  }

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length
  const charCount = text.length

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
        placeholder="Cole aqui o texto que deseja analisar&#10;&#10;Pode ser um artigo, redação, e-mail, post, etc.&#10;Mínimo de 20 caracteres."
        value={text}
        onChange={e => setText(e.target.value)}
        disabled={loading}
      />

      {error && (
        <div className="mt-3 px-4 py-2 bg-red-950/40 border border-red-800/50 rounded-lg text-red-400 text-xs font-mono">
          ⚠️ {error}
        </div>
      )}

      <button
        className="cyber-btn w-full py-3 mt-4 text-sm font-semibold tracking-wider"
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

      {loading && (
        <div className="mt-4 text-center text-xs text-slate-600 font-mono animate-pulse">
          Carregando modelo de detecção · Primeira análise pode demorar mais
        </div>
      )}

      {result && <ResultCard result={result} />}
    </div>
  )
}
