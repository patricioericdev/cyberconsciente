import { useState, useRef } from 'react'
import type { DragEvent } from 'react'
import ResultCard from './ResultCard'
import type { ResultData } from '../App'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface ImageDetectorProps {
  onAnalyzed: (result: ResultData, preview: string) => void
}

async function compressImage(file: File, maxPx = 1024): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const { width, height } = img
      const scale = Math.min(1, maxPx / Math.max(width, height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(width * scale)
      canvas.height = Math.round(height * scale)
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(blob => resolve(blob ?? file), 'image/jpeg', 0.88)
    }
    img.src = url
  })
}

export default function ImageDetector({ onAnalyzed }: ImageDetectorProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<ResultData | null>(null)
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
      const compressed = await compressImage(file)
      const formData = new FormData()
      formData.append('file', compressed, file.name)

      const res = await fetch(`${API_URL}/detect/image`, {
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
          <div className="flex flex-col items-center gap-3 relative">
            <img
              src={preview}
              alt="Preview"
              className="max-h-56 max-w-full rounded-lg border border-purple-800/50 object-contain"
            />
            {result && (
              <div
                className={`absolute inset-0 flex items-center justify-center rounded-lg bg-black/60 backdrop-blur-sm`}
                onClick={e => e.stopPropagation()}
              >
                <span
                  className={`text-2xl font-black font-mono px-4 py-2 rounded-full border ${
                    result.verdict === 'IA'
                      ? 'bg-red-950/80 border-red-500 text-red-300'
                      : 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                  }`}
                  style={{ fontFamily: "'Orbitron', monospace" }}
                >
                  {result.verdict === 'IA' ? '🤖 IA' : '✅ HUMANO'}
                </span>
              </div>
            )}
            <p className="text-xs text-slate-500 font-mono">{file?.name}</p>
            <p className="text-xs text-purple-400 font-mono">Clique para trocar a imagem</p>
          </div>
        ) : (
          <div className="text-slate-500">
            <div className="text-5xl mb-3">🖼️</div>
            <p className="font-mono text-sm text-slate-400 mb-1">
              Arraste uma imagem aqui ou clique para selecionar
            </p>
            <p className="text-xs text-slate-600">PNG, JPG, WEBP · Máx. 10MB · comprimido para 1024px</p>
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
          '🖼️ ANALISAR IMAGEM'
        )}
      </button>

      {result && <ResultCard result={result} />}
    </div>
  )
}
