function HeroSection() {
  return (
    <section className="hero-section section-wrap" id="home" aria-labelledby="hero-title">
      <div className="hero-main">
        <div className="hero-content">
          <p className="eyebrow">AI recording intelligence</p>
          <h1 id="hero-title">Turn raw recordings into searchable insight.</h1>
          <p className="hero-description">
            Labros Vector is a modern workspace for uploading, organizing, and preparing recordings
            for transcription, summaries, and AI-powered review workflows.
          </p>
          <div className="hero-highlights" aria-label="Key capabilities">
            <span>Instant organization</span>
            <span>AI-ready review</span>
            <span>Searchable memory</span>
          </div>
        </div>

        <div className="hero-orbit" aria-hidden="true">
          <div className="orbital orbital--outer" />
          <div className="orbital orbital--middle" />
          <div className="hero-core" />
          <div className="signal-card signal-card--primary">
            <span className="signal-card__label">Audio Stream</span>
            <span className="signal-card__value">Ready</span>
          </div>
          <div className="signal-card signal-card--secondary">
            <span className="signal-card__label">AI Queue</span>
            <span className="signal-card__value">Next</span>
          </div>
          <div className="waveform">
            {Array.from({ length: 18 }).map((_, index) => (
              <span key={index} style={{ '--bar-index': index }} />
            ))}
          </div>
        </div>
      </div>

      <div className="hero-bottom" aria-label="Why Labros Vector">
        <article className="hero-card">
          <p className="hero-card__eyebrow">Built for speed</p>
          <h3>Bring every recording into one streamlined workspace.</h3>
          <p>Organize files, review them faster, and keep your audio projects moving without friction.</p>
        </article>
        <article className="hero-card hero-card--accent">
          <p className="hero-card__eyebrow">Designed for focus</p>
          <h3>Stay calm, clear, and ready for AI-powered review.</h3>
          <p>From uploading to preparing your recordings, everything is centered around clarity and flow.</p>
        </article>
      </div>
    </section>
  )
}

export default HeroSection
