/**
 * NOVA AI Chat — Full UX AI Interface
 *
 * Interactive AI conversation with multi-engine dispatch,
 * φ-confidence scoring, and mode switching.
 *
 * Casa de Medina — Architectos de Architectura Inteligente
 */

import { Link } from 'react-router-dom'
import { useAIStore, type AIMode } from '../lib/ai-store'
import { ENGINES, getEngineStats } from '../lib/engine-registry'
import { useState } from 'react'

const MODE_LABELS: Record<AIMode, { label: string; description: string; icon: string }> = {
  chat: { label: 'Chat', description: 'Natural conversation', icon: '💬' },
  reason: { label: 'Reason', description: 'Structured multi-agent reasoning', icon: '🧠' },
  verify: { label: 'Verify', description: 'Formal proof verification', icon: '✓' },
  orchestrate: { label: 'Orchestrate', description: 'Multi-engine dispatch', icon: '⚡' },
}

export default function AIChat() {
  const {
    messages,
    isProcessing,
    currentInput,
    mode,
    multiEngineMode,
    selectedEngineId,
    activeEngines,
    totalInferences,
    avgConfidence,
    sendMessage,
    setInput,
    setMode,
    selectEngine,
    setMultiEngineMode,
    clearConversation,
  } = useAIStore()

  const [showEnginePanel, setShowEnginePanel] = useState(false)
  const stats = getEngineStats()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (currentInput.trim() && !isProcessing) {
      sendMessage(currentInput)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <>
      <Link to="/" className="back-link">← Back</Link>

      <div className="ai-layout">
        {/* Left Panel: Chat */}
        <div className="ai-chat-panel">
          <div className="ai-chat-header">
            <h1 className="ai-title">NOVA <span>AI</span></h1>
            <div className="ai-mode-selector">
              {(Object.keys(MODE_LABELS) as AIMode[]).map((m) => (
                <button
                  key={m}
                  className={`ai-mode-btn ${mode === m ? 'active' : ''}`}
                  onClick={() => setMode(m)}
                  title={MODE_LABELS[m].description}
                >
                  <span className="ai-mode-icon">{MODE_LABELS[m].icon}</span>
                  <span className="ai-mode-label">{MODE_LABELS[m].label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="ai-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`ai-msg ai-msg--${msg.role}`}>
                <div className="ai-msg-header">
                  <span className="ai-msg-role">
                    {msg.role === 'user' ? 'You' :
                     msg.role === 'system' ? 'System' :
                     msg.engineName || 'NOVA AI'}
                  </span>
                  {msg.confidence !== undefined && (
                    <span className="ai-msg-confidence" title="φ-confidence score">
                      φ {msg.confidence.toFixed(3)}
                    </span>
                  )}
                  {msg.executionTimeMs !== undefined && (
                    <span className="ai-msg-latency">
                      {msg.executionTimeMs}ms
                    </span>
                  )}
                </div>
                <div className="ai-msg-content">
                  {msg.content.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="ai-msg ai-msg--assistant ai-msg--processing">
                <div className="ai-msg-header">
                  <span className="ai-msg-role">Processing...</span>
                </div>
                <div className="ai-msg-content">
                  <div className="ai-typing">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form className="ai-input-form" onSubmit={handleSubmit}>
            <div className="ai-input-controls">
              <button
                type="button"
                className={`ai-toggle-engines ${showEnginePanel ? 'active' : ''}`}
                onClick={() => setShowEnginePanel(!showEnginePanel)}
                title="Toggle engine panel"
              >
                ⚙ {activeEngines.length}
              </button>
              <label className="ai-multi-toggle" title="Multi-engine mode">
                <input
                  type="checkbox"
                  checked={multiEngineMode}
                  onChange={(e) => setMultiEngineMode(e.target.checked)}
                />
                Multi
              </label>
            </div>
            <textarea
              className="ai-input"
              value={currentInput}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask NOVA AI (${MODE_LABELS[mode].label} mode)...`}
              rows={2}
              disabled={isProcessing}
            />
            <div className="ai-input-actions">
              <button type="button" className="ai-clear-btn" onClick={clearConversation}>
                Clear
              </button>
              <button
                type="submit"
                className="ai-send-btn"
                disabled={isProcessing || !currentInput.trim()}
              >
                {isProcessing ? '...' : 'Send →'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Panel: Engine Info */}
        {showEnginePanel && (
          <div className="ai-engine-panel">
            <h3 className="ai-panel-title">Active Engines</h3>
            <div className="ai-engine-stats">
              <div className="ai-stat">
                <span className="ai-stat-value">{stats.onlineEngines}</span>
                <span className="ai-stat-label">Online</span>
              </div>
              <div className="ai-stat">
                <span className="ai-stat-value">{stats.languages}</span>
                <span className="ai-stat-label">Languages</span>
              </div>
              <div className="ai-stat">
                <span className="ai-stat-value">{totalInferences}</span>
                <span className="ai-stat-label">Inferences</span>
              </div>
              <div className="ai-stat">
                <span className="ai-stat-value">{avgConfidence.toFixed(2)}</span>
                <span className="ai-stat-label">Avg φ-Conf</span>
              </div>
            </div>

            <div className="ai-engine-list">
              {ENGINES.filter(e => e.status === 'online').slice(0, 8).map((engine) => (
                <button
                  key={engine.id}
                  className={`ai-engine-item ${selectedEngineId === engine.id ? 'selected' : ''} ${activeEngines.includes(engine.id) ? 'active' : ''}`}
                  onClick={() => selectEngine(selectedEngineId === engine.id ? null : engine.id)}
                >
                  <span className="ai-engine-name">{engine.name}</span>
                  <span className="ai-engine-lang">{engine.language}</span>
                  <span className="ai-engine-latency">{engine.latencyMs}ms</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
