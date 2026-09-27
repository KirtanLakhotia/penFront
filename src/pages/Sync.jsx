import { useMemo, useState } from 'react'
import PenBluetooth from '../services/penBluetooth'
import { getCurrentUserId, getRecordingNames } from '../services/recordingService'
import { uploadRecordingFile } from '../services/uploadService'

const normaliseName = (name) => String(name || '').trim().toLocaleLowerCase()

function Sync() {
  const [pen, setPen] = useState(null)
  const [status, setStatus] = useState('Connect your pen to begin')
  const [deviceRecordings, setDeviceRecordings] = useState([])
  const [websiteRecordings, setWebsiteRecordings] = useState([])
  const [syncState, setSyncState] = useState('idle')
  const [syncItems, setSyncItems] = useState([])
  const [activeFile, setActiveFile] = useState('')
  const [downloadingFile, setDownloadingFile] = useState('')
  const [error, setError] = useState('')

  const completedCount = useMemo(() => syncItems.filter((item) => item.state === 'complete').length, [syncItems])
  const percent = syncItems.length ? Math.round((completedCount / syncItems.length) * 100) : 0
  const isBusy = syncState === 'running'

  const connectPen = async () => {
    try {
      setError('')
      setStatus('Looking for your pen…')
      const newPen = new PenBluetooth()
      newPen.onMessage = (data) => { if (data.type === 'status') setStatus(data.message) }
      await newPen.connect()
      setPen(newPen)
      setStatus('Pen connected and ready to sync')
    } catch (connectionError) {
      setError(connectionError.message)
      setStatus('Could not connect to the pen')
    }
  }

  const disconnectPen = () => {
    pen?.disconnect()
    setPen(null)
    setStatus('Pen disconnected')
  }

  const readDeviceRecordings = async () => new Promise((resolve, reject) => {
    const found = []
    const previousHandler = pen.onMessage
    let timer
    const finish = () => { clearTimeout(timer); pen.onMessage = previousHandler; resolve(found) }
    const fail = (listError) => { clearTimeout(timer); pen.onMessage = previousHandler; reject(listError) }
    pen.onMessage = (data) => {
      previousHandler?.(data)
      if (data.type !== 'ble') return
      const message = data.message.trim()
      if (message.startsWith('FILE:')) {
        const name = message.slice(5).trim()
        if (name && !found.some((item) => normaliseName(item) === normaliseName(name))) found.push(name)
        setDeviceRecordings([...found])
        clearTimeout(timer)
        timer = setTimeout(finish, 450)
      } else if (message.startsWith('ERROR:')) fail(new Error(message))
    }
    timer = setTimeout(finish, 1200)
    pen.listRecordings().catch(fail)
  })

  const syncPen = async () => {
    if (!pen) return
    setSyncState('running')
    setError('')
    setSyncItems([])
    setActiveFile('')
    try {
      setStatus('Checking recordings already on the website…')
      const websiteNames = await getRecordingNames(getCurrentUserId())
      setWebsiteRecordings(websiteNames)
      setStatus('Reading recordings from your pen…')
      setDeviceRecordings([])
      const deviceNames = await readDeviceRecordings()
      const websiteSet = new Set(websiteNames.map(normaliseName))
      const missing = deviceNames.filter((name) => !websiteSet.has(normaliseName(name)))
      setSyncItems(missing.map((name) => ({ name, state: 'pending', progress: 0 })))
      if (!missing.length) {
        setSyncState('complete')
        setStatus('Everything is already synced')
        return
      }

      for (const filename of missing) {
        try {
        setActiveFile(filename)
        setStatus(`Downloading ${filename} from the pen…`)
        const blob = await pen.downloadFile(filename, ({ receivedBytes, totalBytes }) => {
          const progress = totalBytes ? Math.round((receivedBytes / totalBytes) * 50) : 0
          setSyncItems((items) => items.map((item) => item.name === filename ? { ...item, state: 'downloading', progress } : item))
        })
        if (!blob.size) throw new Error(`The pen returned an empty file for ${filename}`)
        setStatus(`Uploading ${filename} to the website…`)
        const file = new File([blob], filename, { type: blob.type || 'audio/wav' })
        await uploadRecordingFile(file, (uploadProgress) => {
          const progress = 50 + Math.round(uploadProgress / 2)
          setSyncItems((items) => items.map((item) => item.name === filename ? { ...item, state: 'uploading', progress } : item))
        })
        setSyncItems((items) => items.map((item) => item.name === filename ? { ...item, state: 'complete', progress: 100 } : item))
        } catch (fileError) {
          console.error(`Failed to sync ${filename}:`, fileError)
          setSyncItems((items) => items.map((item) => item.name === filename ? { ...item, state: 'failed' } : item))
          continue
        }
      }
      setSyncState('complete')
      setStatus(`Sync complete — ${missing.length} recording${missing.length === 1 ? '' : 's'} uploaded`)
      setActiveFile('')
    } catch (syncError) {
      setSyncState('error')
      setError(syncError.message)
      setStatus('Sync stopped')
    }
  }

  const scanPen = async () => {
    if (!pen || isBusy) return
    try {
      setError('')
      setStatus('Reading recordings from your pen…')
      setDeviceRecordings(await readDeviceRecordings())
      setStatus('Recordings ready to download')
    } catch (scanError) {
      setError(scanError.message)
      setStatus('Could not read recordings')
    }
  }

  const downloadDeviceRecording = async (filename) => {
    if (!pen || isBusy || downloadingFile) return
    try {
      setError('')
      setDownloadingFile(filename)
      setStatus(`Downloading ${filename}…`)
      const blob = await pen.downloadFile(filename, ({ receivedBytes, totalBytes }) => {
        const progress = totalBytes ? Math.round((receivedBytes / totalBytes) * 100) : 0
        setStatus(`Downloading ${filename}… ${progress}%`)
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      setStatus(`Downloaded ${filename} (${blob.size.toLocaleString()} bytes)`)
    } catch (downloadError) {
      setError(downloadError.message)
      setStatus('Download failed')
    } finally {
      setDownloadingFile('')
    }
  }

  return (
    <section className="section-wrap sync-page">
      <div className="sync-hero"><div><p className="eyebrow">Your recordings, together</p><h1>Sync your pen</h1><p className="sync-hero__copy">Bring new recordings from your pen into Trace Your. We’ll check what’s already here and upload only what’s missing.</p></div><div className={`sync-connection ${pen ? 'sync-connection--connected' : ''}`}><span className="sync-connection__dot" />{pen ? 'Pen connected' : 'Pen not connected'}</div></div>
      <div className="sync-layout">
        <div className="sync-card sync-card--main"><div className="sync-card__header"><div><p className="sync-card__kicker">Step 1</p><h2>Connect your pen</h2></div>{pen && <span className="sync-check">✓ Ready</span>}</div><p className="sync-card__description">Keep the pen nearby and make sure Bluetooth is enabled in your browser.</p><div className="sync-actions">{!pen ? <button className="sync-button sync-button--primary" onClick={connectPen}>Connect pen</button> : <button className="sync-button sync-button--secondary" onClick={disconnectPen} disabled={isBusy}>Disconnect</button>}<button className="sync-button sync-button--secondary" onClick={scanPen} disabled={!pen || isBusy}>Read files</button><button className="sync-button sync-button--primary" onClick={syncPen} disabled={!pen || isBusy}>{isBusy ? 'Syncing…' : 'Sync recordings'} <span>→</span></button></div><p className="sync-status"><span className={isBusy ? 'sync-status__pulse' : ''} />{status}</p>{error && <p className="sync-error" role="alert">{error}</p>}</div>
        <div className="sync-card sync-card--progress"><div className="sync-card__header"><div><p className="sync-card__kicker">Step 2</p><h2>Sync progress</h2></div><strong className="sync-progress__percent">{percent}%</strong></div><div className="sync-progress"><span style={{ width: `${percent}%` }} /></div><p className="sync-progress__summary">{syncItems.length ? `${completedCount} of ${syncItems.length} new recordings uploaded` : 'Your sync activity will appear here'}</p>{activeFile && <p className="sync-active">Working on <strong>{activeFile}</strong></p>}{syncItems.length > 0 && <div className="sync-file-list">{syncItems.map((item) => <div className="sync-file" key={item.name}><span className={`sync-file__icon sync-file__icon--${item.state}`}>{item.state === 'complete' ? '✓' : item.state === 'pending' ? '·' : '↗'}</span><span className="sync-file__name">{item.name}</span><span className="sync-file__state">{item.state === 'complete' ? 'Uploaded' : item.state === 'pending' ? 'Waiting' : `${item.progress}%`}</span></div>)}</div>}</div>
      </div>
      <div className="sync-card sync-card--files"><div className="sync-card__header"><div><p className="sync-card__kicker">Inspect first</p><h2>Files on your pen</h2></div><span className="sync-card__hint">Downloads stay on your computer</span></div>{deviceRecordings.length === 0 ? <p className="sync-progress__summary">Click “Read files” to see and download recordings individually.</p> : <div className="sync-device-list">{deviceRecordings.map((filename) => <div className="sync-device-file" key={filename}><span className="sync-file__name">{filename}</span><button className="sync-download-button" onClick={() => downloadDeviceRecording(filename)} disabled={isBusy || Boolean(downloadingFile)}>{downloadingFile === filename ? 'Downloading…' : 'Download'}</button></div>)}</div>}</div>
      <div className="sync-metrics"><div><strong>{deviceRecordings.length}</strong><span>On your pen</span></div><div><strong>{websiteRecordings.length}</strong><span>On the website</span></div><div><strong>{syncItems.length}</strong><span>Selected for sync</span></div></div><p className="sync-footnote">Recordings are matched by filename. Existing recordings stay untouched.</p>
    </section>
  )
}

export default Sync
