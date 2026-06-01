/**
 * NOVA Multi-Engine Dashboard
 *
 * Full overview of all engines across all languages and categories.
 * Real-time status, metrics, and capability exploration.
 *
 * Casa de Medina — Architectos de Architectura Inteligente
 */

import { Link } from 'react-router-dom'
import { useState } from 'react'
import {
  ENGINES,
  getEngineStats,
  type Engine,
  type EngineCategory,
  type EngineLanguage,
} from '../lib/engine-registry'

type ViewMode = 'grid' | 'list' | 'graph';
type GroupBy = 'category' | 'language' | 'status';

const CATEGORY_LABELS: Record<EngineCategory, { label: string; color: string }> = {
  computation: { label: 'Computation', color: '#4fc3f7' },
  governance: { label: 'Governance', color: '#ce93d8' },
  organism: { label: 'Organism', color: '#81c784' },
  verification: { label: 'Verification', color: '#fff176' },
  ai: { label: 'AI / Inference', color: '#ef5350' },
  bridge: { label: 'Bridge', color: '#ffb74d' },
}

const LANGUAGE_LABELS: Record<EngineLanguage, string> = {
  javascript: 'JavaScript',
  python: 'Python',
  julia: 'Julia',
  motoko: 'Motoko',
  rust: 'Rust',
  haskell: 'Haskell',
  lean4: 'Lean4',
  coq: 'Coq',
  agda: 'Agda',
  idris2: 'Idris2',
  fsharp: 'F#',
}

export default function MultiEngine() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [groupBy, setGroupBy] = useState<GroupBy>('category')
  const [selectedEngine, setSelectedEngine] = useState<Engine | null>(null)
  const [filterLang, setFilterLang] = useState<EngineLanguage | ''>('')

  const stats = getEngineStats()

  const filteredEngines = filterLang
    ? ENGINES.filter(e => e.language === filterLang)
    : ENGINES

  const groupedEngines = (): Record<string, Engine[]> => {
    const groups: Record<string, Engine[]> = {}
    for (const engine of filteredEngines) {
      const key = groupBy === 'category' ? engine.category
        : groupBy === 'language' ? engine.language
        : engine.status
      if (!groups[key]) groups[key] = []
      groups[key].push(engine)
    }
    return groups
  }

  const groups = groupedEngines()

  return (
    <>
      <Link to="/" className="back-link">← Back</Link>

      <div className="page-hero">
        <h1>Multi-Engine <span>Architecture</span></h1>
        <p className="subheading">
          {stats.totalEngines} engines across {stats.languages} languages —
          {stats.totalCapabilities} capabilities — {stats.totalThroughput} req/s aggregate throughput
        </p>
      </div>

      {/* Stats Bar */}
      <div className="me-stats-bar">
        <div className="me-stat-card">
          <div className="me-stat-value">{stats.onlineEngines}/{stats.totalEngines}</div>
          <div className="me-stat-label">Engines Online</div>
        </div>
        <div className="me-stat-card">
          <div className="me-stat-value">{stats.languages}</div>
          <div className="me-stat-label">Languages</div>
        </div>
        <div className="me-stat-card">
          <div className="me-stat-value">{stats.totalCapabilities}</div>
          <div className="me-stat-label">Capabilities</div>
        </div>
        <div className="me-stat-card">
          <div className="me-stat-value">{stats.avgLatencyMs}ms</div>
          <div className="me-stat-label">Avg Latency</div>
        </div>
        <div className="me-stat-card">
          <div className="me-stat-value">{stats.totalThroughput}</div>
          <div className="me-stat-label">Req/s Total</div>
        </div>
        <div className="me-stat-card">
          <div className="me-stat-value" style={{ color: stats.health > 0.9 ? '#81c784' : '#ffb74d' }}>
            {(stats.health * 100).toFixed(0)}%
          </div>
          <div className="me-stat-label">Health</div>
        </div>
      </div>

      {/* Controls */}
      <div className="me-controls">
        <div className="me-control-group">
          <label>Group by:</label>
          <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as GroupBy)}>
            <option value="category">Category</option>
            <option value="language">Language</option>
            <option value="status">Status</option>
          </select>
        </div>
        <div className="me-control-group">
          <label>Filter:</label>
          <select value={filterLang} onChange={(e) => setFilterLang(e.target.value as EngineLanguage | '')}>
            <option value="">All Languages</option>
            {Object.entries(LANGUAGE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <div className="me-control-group">
          <label>View:</label>
          <div className="me-view-toggle">
            <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')}>Grid</button>
            <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}>List</button>
          </div>
        </div>
      </div>

      {/* Engine Groups */}
      <div className="me-groups">
        {Object.entries(groups).map(([groupKey, engines]) => (
          <div key={groupKey} className="me-group">
            <h3 className="me-group-title">
              {groupBy === 'category' && (
                <span style={{ color: CATEGORY_LABELS[groupKey as EngineCategory]?.color || '#888' }}>
                  {CATEGORY_LABELS[groupKey as EngineCategory]?.label || groupKey}
                </span>
              )}
              {groupBy === 'language' && (
                <span>{LANGUAGE_LABELS[groupKey as EngineLanguage] || groupKey}</span>
              )}
              {groupBy === 'status' && (
                <span className={`me-status me-status--${groupKey}`}>{groupKey}</span>
              )}
              <span className="me-group-count">{engines.length}</span>
            </h3>

            <div className={`me-engine-grid ${viewMode === 'list' ? 'me-engine-grid--list' : ''}`}>
              {engines.map((engine) => (
                <div
                  key={engine.id}
                  className={`me-engine-card ${selectedEngine?.id === engine.id ? 'me-engine-card--selected' : ''}`}
                  onClick={() => setSelectedEngine(selectedEngine?.id === engine.id ? null : engine)}
                >
                  <div className="me-engine-card-header">
                    <span className={`me-engine-status me-engine-status--${engine.status}`} />
                    <span className="me-engine-name">{engine.name}</span>
                    <span className="me-engine-version">v{engine.version}</span>
                  </div>
                  <div className="me-engine-card-body">
                    <div className="me-engine-meta">
                      <span className="me-engine-lang-badge">{engine.language}</span>
                      <span className="me-engine-cat-badge" style={{ borderColor: CATEGORY_LABELS[engine.category]?.color }}>
                        {engine.category}
                      </span>
                    </div>
                    <p className="me-engine-desc">{engine.description}</p>
                    <div className="me-engine-metrics">
                      <span title="Latency">⏱ {engine.latencyMs}ms</span>
                      <span title="Throughput">📊 {engine.throughput}/s</span>
                      <span title="φ-Weight">φ {engine.phiWeight.toFixed(2)}</span>
                    </div>
                  </div>

                  {selectedEngine?.id === engine.id && (
                    <div className="me-engine-detail">
                      <h4>Capabilities</h4>
                      <ul className="me-cap-list">
                        {engine.capabilities.map((cap) => (
                          <li key={cap.id}>
                            <strong>{cap.name}</strong> — {cap.description}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
