import { useRef, useState } from 'react'

const ACCEPTED_TYPES = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/ogg', 'video/mp4']
const ACCEPT_ATTRIBUTE = '.mp3,.wav,.m4a,.aac,.ogg,.mp4,audio/*,video/mp4'

function UploadArea({ isUploading, uploadProgress, onUpload }) {
  const inputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState('')

  const openFileDialog = () => inputRef.current?.click()

  const validateFile = (file) => {
    if (!file) return false

    const extension = file.name.split('.').pop()?.toLowerCase()
    const isSupported =
      ACCEPTED_TYPES.includes(file.type) ||
      ['mp3', 'wav', 'm4a', 'aac', 'ogg'].includes(extension)

    if (!isSupported) {
      setError('Please upload MP3, WAV, M4A, AAC, or OGG recordings.')
      return false
    }

    setError('')
    return true
  }

  const handleFile = async (file) => {
    if (!validateFile(file)) return
    await onUpload(file)
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setIsDragging(false)
    handleFile(event.dataTransfer.files?.[0])
  }

  return (
    <section className="upload-section section-wrap" aria-labelledby="upload-title">
      <div className="section-heading">
        <p className="eyebrow">Upload recording</p>
        <h2 id="upload-title">Drop a session into your workspace.</h2>
      </div>

      <div
        className={`upload-panel ${isDragging ? 'upload-panel--dragging' : ''}`}
        onDragEnter={() => setIsDragging(true)}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept={ACCEPT_ATTRIBUTE}
          onChange={(event) => handleFile(event.target.files?.[0])}
        />

        <div className="upload-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="img">
            <path d="M12 16V5m0 0 4.2 4.2M12 5 7.8 9.2" />
            <path d="M5 15.5V17a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1.5" />
          </svg>
        </div>

        <div className="upload-copy">
          <h3>Drag and drop your recording here</h3>
          <p>or click to browse from your device</p>
          <span>Supported: MP3, WAV, M4A, AAC, OGG</span>
        </div>

        <div className="progress-shell" aria-label="Upload progress">
          <span style={{ width: `${uploadProgress}%` }} />
        </div>

        {error ? <p className="form-error" role="alert">{error}</p> : null}

        <button className="primary-action" type="button" onClick={openFileDialog} disabled={isUploading}>
          {isUploading ? `Uploading ${uploadProgress}%` : 'Upload recording'}
        </button>
      </div>
    </section>
  )
}

export default UploadArea
