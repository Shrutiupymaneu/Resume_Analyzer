import { useState } from 'react'
import UploadPanel from './components/UploadPanel'
import ResultsPanel from './components/ResultsPanel'
import { analyzeResume } from './utils/analyzer'
import './App.css'

export default function App() {
  const [resumeText, setResumeText] = useState('')
  const [jobText, setJobText] = useState('')
  const [result, setResult] = useState(null)
  const [scanning, setScanning] = useState(false)

  function handleScan() {
    if (!resumeText.trim()) return
    setScanning(true)
    setResult(null)
    setTimeout(() => {
      const analysis = analyzeResume(resumeText, jobText)
      setResult(analysis)
      setScanning(false)
    }, 900)
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__eyebrow">AI RESUME ANALYZER</div>
        <h1 className="app-header__title">Scanline</h1>
        <p className="app-header__subtitle">
          Drop in your resume and, optionally, a job description. Get an instant score,
          an ATS keyword match, and a concrete fix-it list — entirely in your browser.
        </p>
      </header>

      <main className="app-grid">
        <UploadPanel
          resumeText={resumeText}
          setResumeText={setResumeText}
          jobText={jobText}
          setJobText={setJobText}
          onScan={handleScan}
          scanning={scanning}
        />
        <ResultsPanel result={result} scanning={scanning} />
      </main>

      <footer className="app-footer">
        Runs fully client-side — your resume never leaves your browser.
      </footer>
    </div>
  )
}