import { useRef, useState } from 'react'
import { extractTextFromPdf } from '../utils/pdfExtract'

export default function UploadPanel({
  resumeText,
  setResumeText,
  jobText,
  setJobText,
  onScan,
  scanning,
}) {
  const fileInputRef = useRef(null)
  const [fileName, setFileName] = useState('')
  const [fileError, setFileError] = useState('')
  const [dragActive, setDragActive] = useState(false)

  async function handleFile(file) {
    if (!file) return
    setFileError('')
    setFileName(file.name)
    try {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const text = await extractTextFromPdf(file)
        if (!text || text.length < 20) {
          setFileError('Could not find readable text in that PDF — try pasting the text instead.')
        }
        setResumeText(text)
      } else if (file.type.startsWith('text/') || file.name.toLowerCase().endsWith('.txt')) {
        const text = await file.text()
        setResumeText(text)
      } else {
        setFileError('Unsupported file type. Upload a .pdf or .txt file, or paste your resume text below.')
      }
    } catch (err) {
      setFileError('Something went wrong reading that file. Try pasting your resume text instead.')
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    handleFile(file)
  }

  const canScan = resumeText.trim().length > 0 && !scanning

  return (
    <div className="panel">
      <div className="panel__section">
        <div className="panel__eyebrow">01 — Resume</div>
        <div
          className={`dropzone ${dragActive ? 'dropzone--active' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,text/plain,application/pdf"
            hidden
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <span className="dropzone__title">
            {fileName ? fileName : 'Drop your resume here'}
          </span>
          <span className="dropzone__hint">PDF or .txt — or click to browse</span>
        </div>
        {fileError && <div className="field-error">{fileError}</div>}

        <textarea
          className="textarea"
          placeholder="...or paste your resume text here"
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          rows={9}
        />
      </div>

      <div className="panel__section">
        <div className="panel__eyebrow">02 — Job description <span className="panel__optional">(optional, recommended)</span></div>
        <textarea
          className="textarea"
          placeholder="Paste the job description to check keyword match against it"
          value={jobText}
          onChange={(e) => setJobText(e.target.value)}
          rows={7}
        />
      </div>

      <button className="scan-button" onClick={onScan} disabled={!canScan}>
        {scanning ? 'Scanning…' : 'Scan resume'}
      </button>
    </div>
  )
}