import { useState } from 'react'
import TextDetector from './components/TextDetector'
import ImageDetector from './components/ImageDetector'
import './index.css'

type Tab = 'text' | 'image'

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('text')

  return (
    <div className="min-h-screen relative z-10">
      <div className="scanline" />

      {/* Header */}
      <header className="text-center py-10 px-4">
        <div className="inline-block mb-3">
          <span className="text-xs font-mono text-purple-400 tracking-widest uppercase border border-purple-800 px-3 py-1 rounded-full">
            v1.0 · Sistema de Detecção
          </span>
        </div>
        <h1
          className="glitch text-5xl md:text-7xl font-black tracking-tight mb-2"
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
      <main className="max-w-3xl mx-auto px-4 pb-16">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-black/30 p-1 rounded-xl border border-purple-900/40">
          <button
            onClick={() => setActiveTab('text')}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-mono font-semibold transition-all duration-300 ${
              activeTab === 'text'
                ? 'bg-purple-700/40 text-purple-300 border border-purple-600/50'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            📝 Texto
          </button>
          <button
            onClick={() => setActiveTab('image')}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-mono font-semibold transition-all duration-300 ${
              activeTab === 'image'
                ? 'bg-cyan-700/40 text-cyan-300 border border-cyan-600/50'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            🖼️ Imagem
          </button>
        </div>

        {/* Detector panels */}
        {activeTab === 'text' ? <TextDetector /> : <ImageDetector />}

        {/* Footer */}
        <p className="text-center text-slate-700 text-xs mt-10 font-mono">
          CYBERCONSCIENTE · Detecção de IA · 2026
        </p>
      </main>
    </div>
  )
}

export default App
