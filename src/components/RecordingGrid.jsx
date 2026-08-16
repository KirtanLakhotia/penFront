import RecordingCard from './RecordingCard'

function RecordingGrid({ recordings, onSelect, compact = false }) {
  return (
    <section className="recordings-section section-wrap" aria-labelledby="recordings-title">
      <div className="section-heading section-heading--row">
        <div>
          <p className="eyebrow">Recording dashboard</p>
          <h2 id="recordings-title">Previously uploaded recordings</h2>
        </div>
        <span className="recording-count">{recordings.length} total</span>
      </div>

      {recordings.length > 0 ? (
        <div className="recording-grid">
          {recordings.map((recording) => (
            <RecordingCard
              key={recording.id}
              recording={recording}
              compact={compact}
              onClick={() => onSelect?.(recording)}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span aria-hidden="true">No recordings yet</span>
          <p>Your uploaded sessions will appear here with size, status, and transcription progress.</p>
        </div>
      )}
    </section>
  )
}

export default RecordingGrid
