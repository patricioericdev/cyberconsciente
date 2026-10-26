interface Signal {
  label: string
  type: 'ai' | 'human'
}

interface ResultData {
  verdict: 'IA' | 'HUMANO'
  ai_score: number
  human_score: number
  confidence: number
  signals: Signal[]
}

interface ResultCardProps {
  result: ResultData
}

export default function ResultCard({ result }: ResultCardProps) {
  const isAI = result.verdict === 'IA'

  return (
    <div
      className={`cyber-card p-6 mt-6 transition-all duration-700 ${
        isAI ? 'verdict-ai' : 'verdict-human'
      }`}
    >
      {/* Verdict banner */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-slate-500 font-mono mb-1 uppercase tracking-widest">Veredicto</p>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{isAI ? '🤖' : '✅'}</span>
            <div>
              <h2
                className={`text-2xl font-black font-mono ${
                  isAI ? 'text-red-400' : 'text-emerald-400'
                }`}
                style={{ fontFamily: "'Orbitron', monospace" }}
              >
                {isAI ? 'IA DETECTADA' : 'CONTEÚDO HUMANO'}
              </h2>
              <p className="text-slate-400 text-sm">
                {isAI
                  ? 'Este conteúdo provavelmente foi gerado por IA'
                  : 'Este conteúdo parece ser de origem humana'}
              </p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 font-mono uppercase tracking-widest mb-1">Confiança</p>
          <p
            className={`text-4xl font-black font-mono ${
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
        <div>
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
    </div>
  )
}
