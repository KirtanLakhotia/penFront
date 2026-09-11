import { useState } from 'react'
import { useRecordings } from '../hooks/useRecordings'
import Navbar from '../components/Navbar'
import HeroSection from '../components/HeroSection'
import UploadArea from '../components/UploadArea'
import RecordingGrid from '../components/RecordingGrid'
import RecordingDetail from './RecordingDetail'
import Ask from './Ask'

function Home() {
  const [activeView, setActiveView] = useState('home')
  const { recordings, uploadRecording, isUploading, uploadProgress } = useRecordings()
  const [selectedRecording, setSelectedRecording] = useState(null)

  return (
    <div className="app-shell">
      <Navbar activeView={activeView} onNavigate={setActiveView} />
      <main>
        {activeView === 'home' ? <HeroSection /> : null}
        {activeView === 'upload' ? (
          selectedRecording ? (
            <RecordingDetail recordingProp={selectedRecording} onBack={() => setSelectedRecording(null)} />
          ) : (
            <>
              <UploadArea
                isUploading={isUploading}
                uploadProgress={uploadProgress}
                onUpload={uploadRecording}
              />
              <RecordingGrid recordings={recordings} compact={true} onSelect={(r) => setSelectedRecording(r)} />
            </>
          )
        ) : null}
        {activeView === 'ask' ? (
          <Ask />
        ) : null}
      </main>

      <footer className="site-footer">
        <div className="footer-minimal">
          <span className="footer-copy">Labros Vector</span>
          <span className="footer-product">Vector</span>
        </div>
      </footer>
    </div>
  )
}

export default Home
