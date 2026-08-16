import { useState } from 'react'

const NAV_ITEMS = [{ label: 'Upload', value: 'upload' }]

function Navbar({ activeView, onNavigate }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const closeMenu = () => setIsMenuOpen(false)

  const handleNavigate = (value) => {
    onNavigate(value)
    closeMenu()
  }

  return (
    <header className="navbar">
      <button
        className="brand"
        type="button"
        aria-label="Labros Vector home"
        onClick={() => handleNavigate('home')}
      >
        <span className="brand__icon" aria-hidden="true">L</span>
        <span className="brand__text">Labros Vector</span>
      </button>

      <button
        className="nav-toggle"
        type="button"
        aria-label="Toggle navigation menu"
        aria-expanded={isMenuOpen}
        onClick={() => setIsMenuOpen((current) => !current)}
      >
        <span />
        <span />
      </button>

      <nav className={`nav-links ${isMenuOpen ? 'nav-links--open' : ''}`} aria-label="Primary navigation">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.value}
            type="button"
            className={`nav-link ${activeView === item.value ? 'nav-link--active' : ''}`}
            onClick={() => handleNavigate(item.value)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </header>
  )
}

export default Navbar
