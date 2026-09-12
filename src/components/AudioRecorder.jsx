import { useEffect, useRef, useState } from 'react'

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0')
  const remainingSeconds = (seconds % 60).toString().padStart(2, '0')
  return `${minutes}:${remainingSeconds}`
}

function getAudioMimeType() {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || ''
}

function getRecordedFileName() {
  const now = new Date()
  const timestamp = now.toISOString().replace(/[:.]/g, '-').replace('T', '_').replace('Z', '')
  return `audio-${timestamp}.webm`
}

function AudioRecorder({ isUploading, onUpload }) {
  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [recordedFile, setRecordedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isRecording || isPaused) return undefined

    const timer = window.setInterval(() => setElapsed((current) => current + 1), 1000)
    return () => window.clearInterval(timer)
  }, [isPaused, isRecording])

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  const resetRecording = () => {
    setRecordedFile(null)
    setElapsed(0)
    setIsPaused(false)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl('')
  }

  const startRecording = async () => {
    setError('')
    resetRecording()

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError('Audio recording is not supported in this browser.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = getAudioMimeType()
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)

      streamRef.current = stream
      mediaRecorderRef.current = recorder
      chunksRef.current = []
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        const type = recorder.mimeType || mimeType || 'audio/webm'
        const blob = new Blob(chunksRef.current, { type })
        const extension = type.includes('mp4') ? 'm4a' : type.includes('ogg') ? 'ogg' : 'webm'
        const fileName = getRecordedFileName().replace('.webm', `.${extension}`)
        const file = new File([blob], fileName, { type })
        setRecordedFile(file)
        setPreviewUrl(URL.createObjectURL(blob))
      }

      recorder.start()
      setIsRecording(true)
    } catch (err) {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      setError(err.name === 'NotAllowedError' ? 'Microphone access was denied.' : 'Unable to start recording.')
    }
  }

  const togglePause = () => {
    const recorder = mediaRecorderRef.current
    if (!recorder) return

    if (recorder.state === 'paused') {
      recorder.resume()
      setIsPaused(false)
    } else if (recorder.state === 'recording') {
      recorder.pause()
      setIsPaused(true)
    }
  }

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current
    if (!recorder || recorder.state === 'inactive') return
    recorder.stop()
    streamRef.current?.getTracks().forEach((track) => track.stop())
    setIsRecording(false)
    setIsPaused(false)
  }

  const uploadRecording = async () => {
    if (!recordedFile) return

    setError('')
    setIsSubmitting(true)
    try {
      await onUpload(recordedFile)
      resetRecording()
    } catch (err) {
      setError(err.message || 'Unable to upload the recording.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="recorder-panel" aria-labelledby="recorder-title">
      <div className="recorder-panel__topline">
        <div className="recorder-panel__icon" aria-hidden="true">●</div>
        <span className={isRecording ? 'recorder-live' : ''}>{isRecording ? 'Recording' : 'Voice recorder'}</span>
      </div>
      <h3 id="recorder-title">Record audio</h3>
      <p className="recorder-panel__description">Capture a thought or meeting directly from your browser.</p>

      <div className={`recorder-timer ${isRecording ? 'recorder-timer--active' : ''}`} aria-live="polite">
        {formatTime(elapsed)}
      </div>

      {isRecording ? (
        <div className="recorder-controls">
          <button type="button" className="recorder-control recorder-control--pause" onClick={togglePause}>
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <button type="button" className="recorder-control recorder-control--stop" onClick={stopRecording}>Stop</button>
        </div>
      ) : recordedFile ? (
        <div className="recorder-result">
          <audio className="recorder-audio" controls src={previewUrl} aria-label="Recorded audio preview" />
          <p className="recorder-filename" title={recordedFile.name}>{recordedFile.name}</p>
          <div className="recorder-controls">
            <button type="button" className="recorder-control" onClick={startRecording} disabled={isSubmitting || isUploading}>Record again</button>
            <button type="button" className="recorder-control recorder-control--upload" onClick={uploadRecording} disabled={isSubmitting || isUploading}>
              {isSubmitting || isUploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="recorder-start" onClick={startRecording} disabled={isUploading}>
          <span className="recorder-start__dot" aria-hidden="true" /> Start recording
        </button>
      )}

      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <p className="recorder-panel__hint">Your audio will be named with the current date and time.</p>
    </section>
  )
}

export default AudioRecorder
