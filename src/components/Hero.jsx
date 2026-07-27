import heroImage from '../assets/pen-image-Photoroom1.png'
import Button from './Button'

function Hero() { 
  return (
    <section className="hero" aria-label="Vector coming soon">
      <div className="hero-visual">
        <img
          className="hero-image"
          src={heroImage}
          alt="Vector pen product preview"
          loading="eager"
          decoding="async"
        />
      </div>

      <div className="hero-actions">
        <Button href="mailto:kirtanlakhotia@email.com">Connect With Us</Button>
      </div>
    </section>
  )
}

export default Hero
