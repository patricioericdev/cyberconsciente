import { useState, useRef } from 'react'
import type { DragEvent } from 'react'
import ResultCard from './ResultCard'
import type { ResultData } from '../App'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface AudioDetectorProps {
  onAnalyzed: (result: ResultData, preview: string) => void
}

const ACCEPTED_EXT = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac']
const ACCEPTED_MIME = [
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg',
  'audio/mp4', 'audio/m4a', 'audio/aac', 'audio/flac', 'audio/x-flac',
]

function isAudioFile(f: File): boolean {
  return (
    ACCEPTED_MIME.includes(f.type) ||
    ACCEPTED_EXT.some(ext => f.name.toLowerCase().endsWith(ext))
  )
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function AudioDetector({ onAnalyzed }: AudioDetectorProps) {
  const [file, setFile] = useState<File | null>(null)
  const [duration, setDuration] = useState<number | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [result, setResult] = useState<ResultData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (f: File) => {
    if (!isAudioFile(f)) {
      setError('Envie um arquivo de áudio (MP3, WAV, OGG, M4A, AAC, FLAC)')
      return
    }
    // Revoke old URL
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    const url = URL.createObjectURL(f)
    setFile(f)
    setAudioUrl(url)
    setResult(null)
    setError('')
    setDuration(null)

    // Try to read duration
    const audio = document.createElement('audio')
    audio.onloadedmetadata = () => setDuration(audio.duration)
    audio.src = url
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

      const res = await fetch(`${API_URL}/detect/audio`, {
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
        <span className="text-green-400 text-lg">🎙️</span>
        <h2 className="text-slate-200 font-mono font-semibold">Análise de Áudio</h2>
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
            <div className="text-5xl">🎙️</div>
            <div>
              <p className="font-mono text-sm text-slate-300 font-semibold">{file.name}</p>
              <p className="text-xs text-slate-500 mt-1">
                {ext}
                {duration !== null && ` · ${formatDuration(duration)}`}
                {` · ${(file.size / 1024).toFixed(1)} KB`}
              </p>
            </div>
            {audioUrl && (
              <audio
                controls
                src={audioUrl}
                className="w-full max-w-xs h-8 mt-1"
                onClick={e => e.stopPropagation()}
              />
            )}
            <p className="text-xs text-purple-400 font-mono">Clique para trocar o arquivo</p>
          </div>
        ) : (
          <div className="text-slate-500">
            <div className="text-5xl mb-3">🎙️</div>
            <p className="font-mono text-sm text-slate-400 mb-1">
              Arraste um áudio aqui ou clique para selecionar
            </p>
            <p className="text-xs text-slate-600">MP3, WAV, OGG, M4A · Máx. 50MB</p>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac"
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
            Transcrevendo e analisando...
          </span>
        ) : (
          '🎙️ ANALISAR ÁUDIO'
        )}
      </button>

      {loading && (
        <div className="mt-3 text-center text-xs text-slate-600 font-mono animate-pulse">
          Transcrevendo áudio · Pode levar alguns segundos
        </div>
      )}

      {result && <ResultCard result={result} />}
    </div>
  )
}
