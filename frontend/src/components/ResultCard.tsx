import { useState } from 'react'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'
import type { ResultData } from '../App'

interface ResultCardProps {
  result: ResultData
}

export default function ResultCard({ result }: ResultCardProps) {
  const isAI = result.verdict === 'IA'
  const [toast, setToast] = useState('')

  const shareResult = () => {
    const payload = btoa(JSON.stringify(result))
    const url = `${window.location.origin}${window.location.pathname}?r=${payload}`
    navigator.clipboard.writeText(url).then(() => {
      setToast('🔗 Link copiado!')
      setTimeout(() => setToast(''), 2000)
    }).catch(() => {
      setToast('❌ Erro ao copiar')
      setTimeout(() => setToast(''), 2000)
    })
  }

  const downloadReport = () => {
    const lines = [
      '═══════════════════════════════════════════',
      '       CYBERCONSCIENTE — Relatório de Análise',
      '═══════════════════════════════════════════',
      '',
      `Veredicto    : ${result.verdict}`,
      `Score IA     : ${result.ai_score}%`,
      `Score Humano : ${result.human_score}%`,
      `Confiança    : ${result.confidence}%`,
      result.language ? `Idioma       : ${result.language}` : '',
      result.chars_extracted !== undefined
        ? `Chars extraídos: ${result.chars_extracted}` : '',
      '',
      'Sinais detectados:',
      ...(result.signals ?? []).map(s => `  [${s.type.toUpperCase()}] ${s.label}`),
      '',
      `Gerado em    : ${new Date().toLocaleString('pt-BR')}`,
      '═══════════════════════════════════════════',
    ].filter(l => l !== null)

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `cyberconsciente-relatorio-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const gaugeColor = isAI
    ? { path: '#ef4444', trail: '#7f1d1d', text: '#ef4444' }
    : { path: '#10b981', trail: '#064e3b', text: '#10b981' }

  return (
    <div
      className={`cyber-card p-6 mt-6 transition-all duration-700 ${
        isAI ? 'verdict-ai' : 'verdict-human'
      }`}
    >
      {/* Verdict badge */}
      <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
        {/* Circular gauge */}
        <div className="w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0">
          <CircularProgressbar
            value={result.ai_score}
            text={`${result.ai_score}%`}
            styles={buildStyles({
              pathColor: gaugeColor.path,
              trailColor: gaugeColor.trail,
              textColor: gaugeColor.text,
              textSize: '22px',
              pathTransitionDuration: 0.8,
            })}
          />
        </div>

        <div className="flex-1 text-center sm:text-left">
          <p className="text-xs text-slate-500 font-mono mb-1 uppercase tracking-widest">Veredicto</p>
          <div
            className={`badge-pulse inline-flex items-center gap-2 px-4 py-2 rounded-full border font-black font-mono text-lg mb-2 ${
              isAI
                ? 'bg-red-950/50 border-red-600/50 text-red-400'
                : 'bg-emerald-950/50 border-emerald-600/50 text-emerald-400'
            }`}
            style={{ fontFamily: "'Orbitron', monospace" }}
          >
            <span>{isAI ? '🤖' : '✅'}</span>
            <span>{isAI ? 'IA DETECTADA' : 'CONTEÚDO HUMANO'}</span>
          </div>
          <p className="text-slate-400 text-sm">
            {isAI
              ? 'Este conteúdo provavelmente foi gerado por IA'
              : 'Este conteúdo parece ser de origem humana'}
          </p>

          {/* Language badge */}
          {result.language && (
            <span className="mt-2 inline-block text-xs font-mono px-2 py-1 rounded-full bg-blue-950/40 border border-blue-800/50 text-blue-300">
              {result.language === 'pt' ? '🇧🇷 Português'
                : result.language === 'en' ? '🇺🇸 English'
                : result.language === 'es' ? '🇪🇸 Español'
                : `🌐 ${result.language}`}
            </span>
          )}

          {/* Chars extracted */}
          {result.chars_extracted !== undefined && (
            <span className="mt-2 ml-2 inline-block text-xs font-mono px-2 py-1 rounded-full bg-slate-800/60 border border-slate-700 text-slate-400">
              📝 {result.chars_extracted} chars
            </span>
          )}
        </div>

        <div className="text-center sm:text-right">
          <p className="text-xs text-slate-500 font-mono uppercase tracking-widest mb-1">Confiança</p>
          <p
            className={`text-3xl font-black font-mono ${
              isAI ? 'text-red-400' : 'text-emerald-400'
            }`}
          >
            {result.confidence}%
          </p>
        </div>
      </div>

      {/* Score bars */}
      <div className="space-y-3 mb-6">
        <div>
          <div className="flex justify-between text-xs font-mono mb-1">
            <span className="text-red-400">🤖 IA</span>
            <span className="text-red-400">{result.ai_score}%</span>
          </div>
          <div className="h-2 bg-black/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-700 to-red-400 rounded-full progress-bar-fill"
              style={{ width: `${result.ai_score}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs font-mono mb-1">
            <span className="text-emerald-400">✅ Humano</span>
            <span className="text-emerald-400">{result.human_score}%</span>
          </div>
          <div className="h-2 bg-black/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-700 to-emerald-400 rounded-full progress-bar-fill"
              style={{ width: `${result.human_score}%` }}
            />
          </div>
        </div>
      </div>

      {/* Signals */}
      {result.signals && result.signals.length > 0 && (
        <div className="mb-6">
          <p className="text-xs text-slate-500 font-mono uppercase tracking-widest mb-3">
            Sinais detectados
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {result.signals.map((signal, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono ${
                  signal.type === 'ai'
                    ? 'bg-red-950/40 border border-red-900/50 text-red-300'
                    : 'bg-emerald-950/40 border border-emerald-900/50 text-emerald-300'
                }`}
              >
                <span>{signal.type === 'ai' ? '⚠️' : '✔️'}</span>
                {signal.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
        <button
          onClick={shareResult}
          className="cyber-btn-secondary flex items-center gap-1.5"
        >
          🔗 Compartilhar resultado
        </button>
        <button
          onClick={downloadReport}
          className="cyber-btn-secondary flex items-center gap-1.5"
        >
          ⬇️ Baixar relatório
        </button>
      </div>

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
