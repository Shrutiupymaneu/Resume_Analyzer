export default function ScoreGauge({ score }) {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  let color = 'var(--coral)'
  let label = 'Needs work'
  if (score >= 80) {
    color = 'var(--green)'
    label = 'Strong'
  } else if (score >= 55) {
    color = 'var(--amber)'
    label = 'Getting there'
  }

  return (
    <div className="score-gauge">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="var(--ink-line)" strokeWidth="10" />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dashoffset 900ms ease, stroke 400ms ease' }}
        />
      </svg>
      <div className="score-gauge__readout">
        <span className="score-gauge__number">{score}</span>
        <span className="score-gauge__max">/100</span>
      </div>
      <div className="score-gauge__label" style={{ color }}>{label}</div>
    </div>
  )
}