import { useState, useRef } from 'react'
import type { DragEvent } from 'react'
import ResultCard from './ResultCard'
import type { ResultData } from '../App'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface DocumentDetectorProps {
  onAnalyzed: (result: ResultData, preview: string) => void
}

const ACCEPTED = ['.pdf', '.docx', '.doc']
const ACCEPT_MIME = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
]

function isDocFile(f: File): boolean {
  return (
    ACCEPT_MIME.includes(f.type) ||
    ACCEPTED.some(ext => f.name.toLowerCase().endsWith(ext))
  )
}

export default function DocumentDetector({ onAnalyzed }: DocumentDetectorProps) {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<ResultData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (f: File) => {
    if (!isDocFile(f)) {
      setError('Envie um arquivo PDF ou Word (.pdf, .docx, .doc)')
      return
    }
    setFile(f)
    setResult(null)
    setError('')
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const analyze = async () => {
    if (!file) return
    setError('')
    setResult(null)
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`${API_URL}/detect/document`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error((err as { detail?: string }).detail || 'Erro na análise')
      }
      const data = await res.json() as ResultData
      setResult(data)
      onAnalyzed(data, file.name)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Não foi possível conectar ao servidor.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const ext = file?.name.split('.').pop()?.toUpperCase() ?? ''

  return (
    <div className="cyber-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-blue-400 text-lg">📄</span>
        <h2 className="text-slate-200 font-mono font-semibold">Análise de Documento</h2>
      </div>

      {/* Drop zone */}
      <div
        className={`drop-zone p-8 text-center cursor-pointer ${dragOver ? 'drag-over' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
      >
        {file ? (
          <div className="flex flex-col items-center gap-3">
            <div className="text-5xl">📄</div>
            <div>
              <p className="font-mono text-sm text-slate-300 font-semibold">{file.name}</p>
              <p className="text-xs text-slate-500 mt-1">
                {ext} · {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            {result?.chars_extracted !== undefined && (
              <span className="text-xs text-blue-300 font-mono bg-blue-950/40 border border-blue-800/50 px-3 py-1 rounded-full">
                📝 Extraídos {result.chars_extracted} caracteres
              </span>
            )}
            <p className="text-xs text-purple-400 font-mono">Clique para trocar o arquivo</p>
          </div>
        ) : (
          <div className="text-slate-500">
            <div className="text-5xl mb-3">📄</div>
            <p className="font-mono text-sm text-slate-400 mb-1">
              Arraste um documento ou clique para selecionar
            </p>
            <p className="text-xs text-slate-600">PDF, DOCX · Máx. 20MB</p>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {error && (
        <div className="mt-3 px-4 py-2 bg-red-950/40 border border-red-800/50 rounded-lg text-red-400 text-xs font-mono">
          ⚠️ {error}
        </div>
      )}

      <button
        className="cyber-btn w-full py-3 mt-4 text-sm font-semibold tracking-wider"
        onClick={analyze}
        disabled={!file || loading}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Extraindo e analisando...
          </span>
        ) : (
          '📄 ANALISAR DOCUMENTO'
        )}
      </button>

      {loading && (
        <div className="mt-3 text-center text-xs text-slate-600 font-mono animate-pulse">
          Extraindo texto do documento · Pode levar alguns segundos
        </div>
      )}

      {result && <ResultCard result={result} />}
    </div>
  )
}
