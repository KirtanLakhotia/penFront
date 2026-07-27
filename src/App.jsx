import Hero from './components/Hero'
import Footer from './components/Footer'
import './App.css'

function App() {
  return (
    <div className="page-shell">
      <header className="topbar" aria-label="Primary">
        <div className="brand-mark">Vector</div>
      </header>
      <main className="page-main">
        <Hero />
      </main>
      <Footer />
    </div>
  )
}

export default App
