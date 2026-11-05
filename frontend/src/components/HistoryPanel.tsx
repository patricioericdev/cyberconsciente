import type { HistoryItem, TabType } from '../App'

interface HistoryPanelProps {
  items: HistoryItem[]
  open: boolean
  onClose: () => void
  onClear: () => void
}

const TYPE_ICONS: Record<TabType, string> = {
  text:     '📝',
  image:    '🖼️',
  document: '📄',
  audio:    '🎙️',
}

const TYPE_LABELS: Record<TabType, string> = {
  text:     'Texto',
  image:    'Imagem',
  document: 'Doc',
  audio:    'Áudio',
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function HistoryPanel({ items, open, onClose, onClear }: HistoryPanelProps) {
  return (
    <aside className={`history-panel ${open ? 'open' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-purple-900/40 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-purple-400">🕐</span>
          <h2 className="text-slate-200 font-mono font-semibold text-sm">Histórico</h2>
          {items.length > 0 && (
            <span className="bg-purple-900/60 text-purple-300 text-xs rounded-full px-2 py-0.5 font-mono">
              {items.length}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-slate-200 transition-colors text-lg leading-none"
          aria-label="Fechar histórico"
        >
          ✕
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 font-mono text-xs gap-2 py-16">
            <span className="text-3xl">🗂️</span>
            <p>Nenhuma análise ainda</p>
          </div>
        ) : (
          <ul>
            {items.map(item => (
              <li key={item.id} className="history-item">
                <div className="flex items-start gap-3">
                  {/* Type icon */}
                  <div className="flex-shrink-0 text-xl mt-0.5">
                    {TYPE_ICONS[item.type]}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs text-slate-500 font-mono">
                        {TYPE_LABELS[item.type]}
                      </span>
                      <span
                        className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded-full ${
                          item.verdict === 'IA'
                            ? 'bg-red-950/60 text-red-400 border border-red-800/50'
                            : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'
                        }`}
                      >
                        {item.verdict === 'IA' ? '🤖 IA' : '✅ Humano'}
                      </span>
                      <span className="text-xs font-mono text-slate-400 ml-auto">
                        {item.score}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono truncate">
                      {item.preview || '—'}
                    </p>
                    <p className="text-xs text-slate-700 font-mono mt-1">
                      {formatTime(item.timestamp)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      {items.length > 0 && (
        <div className="flex-shrink-0 px-4 py-3 border-t border-purple-900/40">
          <button
            onClick={onClear}
            className="w-full cyber-btn-secondary text-red-400 border-red-900/50 hover:border-red-600"
          >
            🗑️ Limpar histórico
          </button>
        </div>
      )}
    </aside>
  )
}
