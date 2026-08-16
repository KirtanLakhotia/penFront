import { useEffect, useState } from 'react'
import { uploadRecordingFile } from '../services/uploadService'
import { getRecordings } from '../services/recordingService'

export function useRecordings() {
  const [recordings, setRecordings] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const recs = await getRecordings()
      if (mounted) setRecordings(recs)
    })()
    return () => { mounted = false }
  }, [])

  const uploadRecording = async (file) => {
    setIsUploading(true)
    setUploadProgress(0)

    try {
      const uploaded = await uploadRecordingFile(file, setUploadProgress)
      // show uploaded immediately
      setRecordings(prev => [uploaded, ...prev])
      // refresh in background to sync with bucket
      getRecordings().then((recs) => setRecordings(recs)).catch(() => {})
    } finally {
      setIsUploading(false)
      setTimeout(() => setUploadProgress(0), 500)
    }
  }

  return {
    recordings,
    uploadRecording,
    isUploading,
    uploadProgress,
  }
}
