import { useState, useCallback, useEffect } from 'react'
import { Particles, ParticlesProvider } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import type { Engine } from '@tsparticles/engine'
import TextDetector from './components/TextDetector'
import ImageDetector from './components/ImageDetector'
import DocumentDetector from './components/DocumentDetector'
import AudioDetector from './components/AudioDetector'
import HistoryPanel from './components/HistoryPanel'
import './index.css'

export type TabType = 'text' | 'image' | 'document' | 'audio'

export interface Signal {
  label: string
  type: 'ai' | 'human'
}

export interface ResultData {
  verdict: 'IA' | 'HUMANO'
  ai_score: number
  human_score: number
  confidence: number
  signals: Signal[]
  language?: string
  chars_extracted?: number
}

export interface HistoryItem {
  id: string
  type: TabType
  verdict: 'IA' | 'HUMANO'
  score: number
  preview: string
  timestamp: number
}

const HISTORY_KEY = 'cyberconsciente_history'
const MAX_HISTORY = 10

function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? (JSON.parse(raw) as HistoryItem[]) : []
  } catch {
    return []
  }
}

function persistHistory(items: HistoryItem[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items))
}

const TAB_CONFIG: { id: TabType; label: string; icon: string; color: string }[] = [
  { id: 'text',     label: 'Texto',     icon: '📝', color: 'purple' },
  { id: 'image',    label: 'Imagem',    icon: '🖼️',  color: 'cyan'   },
  { id: 'document', label: 'Documento', icon: '📄', color: 'blue'   },
  { id: 'audio',    label: 'Áudio',     icon: '🎙️', color: 'green'  },
]

const TAB_ACTIVE_CLASSES: Record<string, string> = {
  purple: 'bg-purple-700/40 text-purple-300 border border-purple-600/50',
  cyan:   'bg-cyan-700/40 text-cyan-300 border border-cyan-600/50',
  blue:   'bg-blue-700/40 text-blue-300 border border-blue-600/50',
  green:  'bg-green-700/40 text-green-300 border border-green-600/50',
}

const PARTICLES_OPTIONS = {
  background: { color: { value: 'transparent' } },
  fpsLimit: 40,
  particles: {
    color: { value: ['#7c3aed', '#06b6d4'] },
    links: {
      enable: true,
      color: '#7c3aed',
      opacity: 0.08,
      distance: 120,
    },
    move: { enable: true, speed: 0.4 },
    number: { value: 35 },
    opacity: { value: { min: 0.05, max: 0.2 } },
    size:    { value: { min: 1, max: 2 } },
  },
  detectRetina: true,
}

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabType>('text')
  const [lightMode, setLightMode] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>(loadHistory)

  useEffect(() => {
    if (lightMode) {
      document.body.classList.add('light-mode')
    } else {
      document.body.classList.remove('light-mode')
    }
  }, [lightMode])

  const saveToHistory = useCallback(
    (result: ResultData, preview: string, type: TabType) => {
      const item: HistoryItem = {
        id: Date.now().toString(),
        type,
        verdict: result.verdict,
        score: result.ai_score,
        preview: preview.substring(0, 50),
        timestamp: Date.now(),
      }
      setHistory(prev => {
        const updated = [item, ...prev].slice(0, MAX_HISTORY)
        persistHistory(updated)
        return updated
      })
    },
    []
  )

  const clearHistory = useCallback(() => {
    setHistory([])
    persistHistory([])
  }, [])

  return (
    <div className="min-h-screen relative z-10">
      {/* Scanline */}
      <div className="scanline" />

      {/* Particles background */}
      <Particles
        id="tsparticles"
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 0 }}
        options={PARTICLES_OPTIONS}
      />

      {/* History overlay + panel */}
      <div
        className={`history-panel-overlay ${historyOpen ? 'open' : ''}`}
        onClick={() => setHistoryOpen(false)}
      />
      <HistoryPanel
        items={history}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onClear={clearHistory}
      />

      {/* Header */}
      <header className="relative z-10 text-center py-8 px-4">
        {/* Top bar */}
        <div className="flex items-center justify-between max-w-3xl mx-auto mb-6">
          <button
            onClick={() => setHistoryOpen(true)}
            className="cyber-btn-secondary flex items-center gap-1.5"
          >
            🕐 Histórico
            {history.length > 0 && (
              <span className="bg-purple-700 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {history.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setLightMode(m => !m)}
            className="cyber-btn-secondary text-base"
            title="Alternar tema"
          >
            {lightMode ? '☀️' : '🌙'}
          </button>
        </div>

        <div className="inline-block mb-3">
          <span className="text-xs font-mono text-purple-400 tracking-widest uppercase border border-purple-800 px-3 py-1 rounded-full">
            v2.0 · Sistema de Detecção
          </span>
        </div>
        <h1
          className="glitch text-4xl md:text-6xl font-black tracking-tight mb-2"
          data-text="CYBERCONSCIENTE"
          style={{
            fontFamily: "'Orbitron', monospace",
            background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          CYBERCONSCIENTE
        </h1>
        <p className="text-slate-400 text-sm md:text-base mt-4 font-mono">
          Identifique conteúdo gerado por{' '}
          <span className="text-purple-400">Inteligência Artificial</span> ou produzido por{' '}
          <span className="text-cyan-400">Humanos</span>
        </p>
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-3xl mx-auto px-4 pb-16">
        {/* Tabs */}
        <div className="tab-bar flex gap-1 mb-6 bg-black/30 p-1 rounded-xl border border-purple-900/40">
          {TAB_CONFIG.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 px-2 rounded-lg text-xs font-mono font-semibold transition-all duration-300 flex items-center justify-center gap-1 ${
                activeTab === tab.id
                  ? TAB_ACTIVE_CLASSES[tab.color]
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Detector panels */}
        {activeTab === 'text' && (
          <TextDetector
            onAnalyzed={(result, preview) => saveToHistory(result, preview, 'text')}
          />
        )}
        {activeTab === 'image' && (
          <ImageDetector
            onAnalyzed={(result, preview) => saveToHistory(result, preview, 'image')}
          />
        )}
        {activeTab === 'document' && (
          <DocumentDetector
            onAnalyzed={(result, preview) => saveToHistory(result, preview, 'document')}
          />
        )}
        {activeTab === 'audio' && (
          <AudioDetector
            onAnalyzed={(result, preview) => saveToHistory(result, preview, 'audio')}
          />
        )}

        {/* Footer */}
        <p className="text-center text-slate-700 text-xs mt-10 font-mono">
          CYBERCONSCIENTE · Detecção de IA · 2026
        </p>
      </main>
    </div>
  )
}

async function initParticles(engine: Engine): Promise<void> {
  await loadSlim(engine)
}

function App() {
  return (
    <ParticlesProvider init={initParticles}>
      <AppContent />
    </ParticlesProvider>
  )
}

export default App
