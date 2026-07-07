import ScoreGauge from './ScoreGauge'

function Pill({ children, tone = 'neutral' }) {
  return <span className={`pill pill--${tone}`}>{children}</span>
}

export default function ResultsPanel({ result, scanning }) {
  if (scanning) {
    return (
      <div className="panel panel--results">
        <div className="scanner">
          <div className="scanner__doc">
            <div className="scanner__line" />
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="scanner__doc-line" style={{ width: `${60 + (i % 3) * 12}%` }} />
            ))}
          </div>
          <div className="scanner__status">Reading resume…</div>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="panel panel--results panel--empty">
        <div className="empty-state">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <rect x="14" y="8" width="36" height="48" rx="3" stroke="var(--paper-dim)" strokeWidth="1.5" />
            <line x1="21" y1="20" x2="43" y2="20" stroke="var(--paper-dim)" strokeWidth="1.5" />
            <line x1="21" y1="28" x2="43" y2="28" stroke="var(--paper-dim)" strokeWidth="1.5" />
            <line x1="21" y1="36" x2="35" y2="36" stroke="var(--paper-dim)" strokeWidth="1.5" />
          </svg>
          <p className="empty-state__title">No scan yet</p>
          <p className="empty-state__body">Paste or upload a resume on the left, then run a scan to see your score, keyword match, and fixes.</p>
        </div>
      </div>
    )
  }

  const { overall, sectionChecks, keywordResult, suggestions, wordCount, hasQuantifiedImpact, lengthStatus } = result

  return (
    <div className="panel panel--results">
      <div className="results-top">
        <ScoreGauge score={overall} />
        <div className="results-top__meta">
          <div className="meta-row"><span>Word count</span><strong>{wordCount}</strong></div>
          <div className="meta-row">
            <span>Length</span>
            <strong>{lengthStatus === 'good' ? 'On target' : lengthStatus === 'short' ? 'Too short' : 'Too long'}</strong>
          </div>
          <div className="meta-row">
            <span>Quantified impact</span>
            <strong>{hasQuantifiedImpact ? 'Yes' : 'Weak'}</strong>
          </div>
          {keywordResult.matchPercent !== null && (
            <div className="meta-row"><span>Keyword match</span><strong>{keywordResult.matchPercent}%</strong></div>
          )}
        </div>
      </div>

      <div className="results-section">
        <h3 className="results-section__title">Structure checklist</h3>
        <div className="checklist">
          {sectionChecks.map((s) => (
            <div key={s.key} className="checklist__item">
              <span className={`checklist__dot ${s.passed ? 'checklist__dot--pass' : 'checklist__dot--fail'}`} />
              {s.label}
            </div>
          ))}
        </div>
      </div>

      {keywordResult.topKeywords.length > 0 && (
        <div className="results-section">
          <h3 className="results-section__title">Keyword match against job description</h3>
          <div className="keyword-group">
            <div className="keyword-group__label">Matched ({keywordResult.matched.length})</div>
            <div className="pill-row">
              {keywordResult.matched.length
                ? keywordResult.matched.map((k) => <Pill key={k} tone="green">{k}</Pill>)
                : <span className="keyword-group__none">None yet</span>}
            </div>
          </div>
          <div className="keyword-group">
            <div className="keyword-group__label">Missing ({keywordResult.missing.length})</div>
            <div className="pill-row">
              {keywordResult.missing.length
                ? keywordResult.missing.map((k) => <Pill key={k} tone="coral">{k}</Pill>)
                : <span className="keyword-group__none">Nice — nothing major missing</span>}
            </div>
          </div>
        </div>
      )}

      <div className="results-section">
        <h3 className="results-section__title">Fix-it list</h3>
        <ul className="suggestions">
          {suggestions.map((s, i) => (
            <li key={i} className={`suggestions__item suggestions__item--${s.severity}`}>
              <span className="suggestions__tag">{s.severity}</span>
              <span>{s.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}