import { useEffect, useMemo, useState } from 'react'
import { formatDateTime, formatDuration, formatFileSize } from '../utils/formatters'
import { getRecordingById, mapRecording } from '../services/recordingService'

const PRIMARY_FIELDS = new Set([
  'recording_id',
  'id',
  'user_id',
  'userId',
  'title',
  'name',
  'created_at',
  'createdAt',
  'uploaded_at',
  'updated_at',
  'updatedAt',
  'audio_path',
  'audioPath',
  'audio_url',
  'signedUrl',
  'publicUrl',
  'url',
  'audio_file_name',
  'file_name',
  'filename',
  'file_size',
  'size',
  'filesize',
  'mime_type',
  'type',
  'duration_seconds',
  'durationSeconds',
  'duration',
  'transcript',
  'rawTranscript',
  'transcript_text',
  'text',
  'transcription_status',
  'transcriptionStatus',
  'summary',
  'summary_text',
  'todos',
  'action_items',
  'todos_list',
])

function isVideoRecording(recording) {
  return (
    recording.type?.startsWith('video') ||
    recording.audioPath?.toLowerCase?.().endsWith('.mp4') ||
    recording.url?.toLowerCase?.().includes('.mp4')
  )
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') return 'Not available'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}

function prettifyLabel(key) {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function getTranscriptMessage(status) {
  const normalized = status?.toLowerCase?.() || ''

  if (normalized.includes('fail') || normalized.includes('error')) {
    return 'Transcription failed for this recording.'
  }

  if (normalized.includes('process') || normalized.includes('pending') || normalized.includes('queue')) {
    return 'Transcription is still processing.'
  }

  return 'No transcript is available for this recording.'
}

function InfoItem({ label, value, className = '' }) {
  return (
    <div className={`detail-info-item ${className}`}>
      <dt>{label}</dt>
      <dd>{value || 'Not available'}</dd>
    </div>
  )
}

function RecordingDetail({ recordingId, recordingProp, onBack }) {
  const propRecording = useMemo(
    () => (recordingProp ? mapRecording(recordingProp.raw || recordingProp) : null),
    [recordingProp]
  )
  const [fetchState, setFetchState] = useState({
    error: null,
    recording: null,
    requestedId: null,
  })

  useEffect(() => {
    let isMounted = true

    if (recordingProp) {
      return undefined
    }

    if (!recordingId) {
      return undefined
    }

    getRecordingById(recordingId)
      .then((found) => {
        if (!isMounted) return
        setFetchState({
          error: null,
          recording: found,
          requestedId: recordingId,
        })
      })
      .catch((err) => {
        if (!isMounted) return
        setFetchState({
          error: err.message || 'Unable to load recording details.',
          recording: null,
          requestedId: recordingId,
        })
      })

    return () => {
      isMounted = false
    }
  }, [recordingId, recordingProp])

  const hasFetchedCurrentRecording = fetchState.requestedId === recordingId
  const recording = propRecording || (hasFetchedCurrentRecording ? fetchState.recording : null)
  const showLoading = !propRecording && !!recordingId && !hasFetchedCurrentRecording
  const showError = !propRecording && hasFetchedCurrentRecording && fetchState.error

  const metadataEntries = useMemo(() => {
    const raw = recording?.raw || {}

    return Object.entries(raw)
      .filter(([key, value]) => !PRIMARY_FIELDS.has(key) && value !== null && value !== undefined && value !== '')
      .map(([key, value]) => [prettifyLabel(key), formatValue(value)])
  }, [recording])

  if (showLoading) {
    return (
      <section className="recording-detail section-wrap" aria-busy="true">
        <button type="button" onClick={onBack} className="back">Back</button>
        <div className="detail-state">Loading recording details...</div>
      </section>
    )
  }

  if (showError) {
    return (
      <section className="recording-detail section-wrap">
        <button type="button" onClick={onBack} className="back">Back</button>
        <div className="detail-state detail-state--error">{showError}</div>
      </section>
    )
  }

  if (!recording) {
    return (
      <section className="recording-detail section-wrap">
        <button type="button" onClick={onBack} className="back">Back</button>
        <div className="detail-state">Recording not found.</div>
      </section>
    )
  }

  const transcript = recording.transcript || ''
  const todos = recording.todos || []
  const hasAudio = Boolean(recording.url)

  return (
    <section className="recording-detail section-wrap">
      <header className="recording-detail__header">
        <div>
          <p className="eyebrow">Recording details</p>
          <h2 className="recording-detail__title">{recording.name}</h2>
          <p className="recording-detail__subtitle">{formatDateTime(recording.uploadedAt)}</p>
        </div>
        <div className="recording-detail__header-actions">
          <span className="status-pill">{recording.transcriptionStatus}</span>
          <button type="button" onClick={onBack} className="back">Back</button>
        </div>
      </header>

      <div className="recording-detail__layout">
        <div className="recording-detail__main">
          <section className="detail-panel">
            <div className="detail-panel__heading">
              <h3>Audio</h3>
              <span>{formatDuration(recording.durationSeconds)}</span>
            </div>
            {hasAudio ? (
              <>
                {isVideoRecording(recording) ? (
                  <video src={recording.url} controls className="recording-player" />
                ) : (
                  <audio src={recording.url} controls className="recording-player" />
                )}
                <a className="recording-download" href={recording.url} target="_blank" rel="noreferrer">
                  Open audio source
                </a>
              </>
            ) : (
              <p className="detail-empty">Audio is unavailable for this recording.</p>
            )}
          </section>

          <section className="detail-panel">
            <div className="detail-panel__heading">
              <h3>Transcript</h3>
              <span>{recording.transcriptionStatus}</span>
            </div>
            {transcript ? (
              <div className="transcript-text">{transcript}</div>
            ) : (
              <p className="detail-empty">{getTranscriptMessage(recording.transcriptionStatus)}</p>
            )}
          </section>

          <section className="detail-panel">
            <div className="detail-panel__heading">
              <h3>Summary</h3>
            </div>
            <p className="detail-copy">{recording.summary || 'No summary is available for this recording.'}</p>
          </section>

          <section className="detail-panel">
            <div className="detail-panel__heading">
              <h3>Action Items</h3>
              <span>{todos.length} total</span>
            </div>
            {todos.length > 0 ? (
              <ul className="recording-todos">
                {todos.map((todo, index) => (
                  <li key={`${todo.text || todo}-${index}`} className={todo.is_done ? 'done' : ''}>
                    <label>
                      <input type="checkbox" checked={!!todo.is_done} readOnly />
                      <span>{todo.text || (typeof todo === 'string' ? todo : formatValue(todo))}</span>
                    </label>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="detail-empty">No action items are available.</p>
            )}
          </section>
        </div>

        <aside className="recording-detail__aside">
          <section className="detail-panel">
            <div className="detail-panel__heading">
              <h3>File Information</h3>
            </div>
            <dl className="detail-info-list">
              <InfoItem label="File name" value={recording.audioFileName} />
              <InfoItem label="File type" value={recording.type} />
              <InfoItem label="File size" value={formatFileSize(recording.size)} />
              <InfoItem label="Duration" value={formatDuration(recording.durationSeconds)} />
              <InfoItem label="Audio path" value={recording.audioPath} className="detail-info-item--long" />
              <InfoItem label="Audio URL" value={recording.url} className="detail-info-item--long" />
            </dl>
          </section>

          <section className="detail-panel">
            <div className="detail-panel__heading">
              <h3>Recording Metadata</h3>
            </div>
            <dl className="detail-info-list">
              <InfoItem label="Recording ID" value={recording.recordingId || recording.id} className="detail-info-item--long" />
              <InfoItem label="User ID" value={recording.userId} />
              <InfoItem label="Created" value={formatDateTime(recording.uploadedAt)} />
              <InfoItem label="Updated" value={formatDateTime(recording.updatedAt)} />
              <InfoItem label="Status" value={recording.status} />
              <InfoItem label="Transcript status" value={recording.transcriptionStatus} />
              {metadataEntries.map(([label, value]) => (
                <InfoItem key={label} label={label} value={value} className="detail-info-item--long" />
              ))}
            </dl>
          </section>
        </aside>
      </div>
    </section>
  )
}

export default RecordingDetail
