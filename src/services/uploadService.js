const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

export function uploadRecordingFile(file, onProgress = () => {}) {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE.replace(/\/$/, '')}/api/files/upload`
    const form = new FormData()
    form.append('file', file)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', url)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100)
        onProgress(percent)
      }
    }

    xhr.onload = () => {
      try {
        if (xhr.status >= 200 && xhr.status < 300) {
          const data = JSON.parse(xhr.responseText)
          // backend returns { success, message, path }
          if (data && data.success) {
            resolve({
              id: data.path || crypto.randomUUID(),
              name: data.name || file.name,
              size: data.size || file.size,
              type: data.mimeType || file.type || 'audio/unknown',
              uploadedAt: new Date().toISOString(),
              status: 'Uploaded',
              transcriptionStatus: 'Pending',
              url: data.signedUrl || data.publicUrl || null,
            })
          } else {
            reject(new Error(data?.message || 'Upload failed'))
          }
        } else {
          reject(new Error(`Upload failed (${xhr.status})`))
        }
      } catch (err) {
        reject(err)
      }
    }

    xhr.onerror = () => reject(new Error('Network error during upload'))
    xhr.send(form)
  })
}
