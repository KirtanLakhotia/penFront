import { formatFileSize, formatUploadDate } from '../utils/formatters'

function RecordingCard({ recording, onClick, compact = false }) {
  const handleKeyDown = (event) => {
    if (!onClick) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick()
    }
  }

  if (compact) {
    return (
      <article
        className="recording-card recording-card--compact"
        onClick={onClick}
        onKeyDown={handleKeyDown}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        aria-label={`Open recording details for ${recording.name}`}
      >
        <div className="recording-card__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="img">
            <path d="M9 18V6a3 3 0 0 1 6 0v12a3 3 0 0 1-6 0Z" />
            <path d="M5 11v7a7 7 0 0 0 14 0v-7M12 21v2" />
          </svg>
        </div>
        <div className="recording-card__body--compact">
          <h3 className="recording-card__name">{recording.name}</h3>
          <span className="recording-card__status">{recording.transcriptionStatus}</span>
        </div>
      </article>
    )
  }

  return (
    <article
      className="recording-card"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`Open recording details for ${recording.name}`}
    >
      <div className="recording-card__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" role="img">
          <path d="M9 18V6a3 3 0 0 1 6 0v12a3 3 0 0 1-6 0Z" />
          <path d="M5 11v7a7 7 0 0 0 14 0v-7M12 21v2" />
        </svg>
      </div>

      <div className="recording-card__body">
        <h3>{recording.name}</h3>
        <dl>
          <div>
            <dt>Uploaded</dt>
            <dd>{formatUploadDate(recording.uploadedAt)}</dd>
          </div>
          <div>
            <dt>Size</dt>
            <dd>{formatFileSize(recording.size)}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{recording.status}</dd>
          </div>
          <div>
            <dt>Transcription</dt>
            <dd>{recording.transcriptionStatus}</dd>
          </div>
        </dl>
      </div>
    </article>
  )
}

export default RecordingCard
