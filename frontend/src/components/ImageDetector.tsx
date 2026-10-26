import { useState, useRef, DragEvent } from 'react'
import ResultCard from './ResultCard'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function ImageDetector() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (f: File) => {
    if (!f.type.startsWith('image/')) {
      setError('Envie um arquivo de imagem (PNG, JPG, WEBP, etc.)')
      return
    }
    setFile(f)
    setResult(null)
    setError('')
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target?.result as string)
    reader.readAsDataURL(f)
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

      const res = await fetch(`${API_URL}/detect/image`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Erro na análise')
      }
      const data = await res.json()
      setResult(data)
    } catch (e: any) {
      setError(e.message || 'Não foi possível conectar ao servidor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="cyber-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-cyan-400 text-lg">🖼️</span>
        <h2 className="text-slate-200 font-mono font-semibold">Análise de Imagem</h2>
      </div>

      {/* Drop zone */}
      <div
        className={`drop-zone p-8 text-center cursor-pointer ${dragOver ? 'drag-over' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
      >
        {preview ? (
          <div className="flex flex-col items-center gap-3">
            <img
              src={preview}
              alt="Preview"
              className="max-h-56 max-w-full rounded-lg border border-purple-800/50 object-contain"
            />
            <p className="text-xs text-slate-500 font-mono">{file?.name}</p>
            <p className="text-xs text-purple-400 font-mono">Clique para trocar a imagem</p>
          </div>
        ) : (
          <div className="text-slate-500">
            <div className="text-5xl mb-3">🔍</div>
            <p className="font-mono text-sm text-slate-400 mb-1">
              Arraste uma imagem aqui ou clique para selecionar
            </p>
            <p className="text-xs text-slate-600">PNG, JPG, WEBP · Máx. 10MB</p>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
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
            Analisando imagem...
          </span>
        ) : (
          '🔬 ANALISAR IMAGEM'
        )}
      </button>

      {result && <ResultCard result={result} />}
    </div>
  )
}
