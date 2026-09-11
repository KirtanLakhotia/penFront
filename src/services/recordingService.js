const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
const DEFAULT_USER_ID = import.meta.env.VITE_USER_ID || 1
const API_ROOT = API_BASE.replace(/\/$/, '')

export function mapRecording(r) {
  const transcript = r.transcript || r.rawTranscript || r.transcript_text || r.text || null

  return {
    id: r.recording_id || r.id || r.audio_path || r.path,
    recordingId: r.recording_id || r.id || null,
    userId: r.user_id || r.userId || null,
    name: r.title || r.name || r.audio_file_name || r.recording_id || r.id || 'Untitled recording',
    size: r.file_size || r.size || r.filesize || r.storage_metadata?.size || 0,
    type: r.mime_type || r.type || r.storage_metadata?.mimetype || r.storage_metadata?.mimeType || null,
    uploadedAt: r.created_at || r.createdAt || r.uploaded_at || r.storage_created_at || null,
    updatedAt: r.updated_at || r.updatedAt || r.storage_updated_at || null,
    durationSeconds: r.duration_seconds || r.durationSeconds || r.duration || null,
    audioPath: r.audio_path || r.audioPath || r.path || null,
    audioFileName: r.audio_file_name || r.file_name || r.filename || r.name || null,
    url: r.audio_url || r.signedUrl || r.publicUrl || r.url || null,
    transcript,
    summary: r.summary || r.summary_text || null,
    todos: r.todos || r.action_items || r.todos_list || [],
    status: r.status || 'Uploaded',
    transcriptionStatus: r.transcription_status || r.transcriptionStatus || (transcript ? 'Completed' : 'Pending'),
    raw: r,
  }
}

async function fetchRecordings(userId = DEFAULT_USER_ID) {
  const url = `${API_ROOT}/recordings`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  })

  if (!res.ok) throw new Error('Failed to fetch recordings')
  const json = await res.json()
  if (!json || !json.success) throw new Error(json?.message || 'Invalid response')

  return json.recordings
    .filter((r) => !(r.title === '.emptyFolderPlaceholder' || r.title?.startsWith?.('.')))
    .map(mapRecording)
}

export async function getRecordings(userId = DEFAULT_USER_ID) {
  try {
    return await fetchRecordings(userId)
  } catch (err) {
    console.error('getRecordings error', err)
    return []
  }
}

export async function getRecordingById(recordingId, userId = DEFAULT_USER_ID) {
  const recordings = await fetchRecordings(userId)
  const targetId = String(recordingId)

  return recordings.find((recording) => {
    const raw = recording.raw || {}

    return (
      String(recording.id) === targetId ||
      String(recording.recordingId) === targetId ||
      String(raw.recording_id) === targetId ||
      String(raw.id) === targetId ||
      String(raw.title) === targetId ||
      String(raw.name) === targetId
    )
  }) || null
}

async function postQuestion(path, body) {
  const res = await fetch(`${API_ROOT}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const json = await res.json().catch(() => null)

  if (!res.ok || !json?.success) {
    throw new Error(json?.message || 'Unable to get an answer')
  }

  return {
    answer: json.answer || '',
    documents: json.documents || [],
  }
}

export function getCurrentUserId() {
  return DEFAULT_USER_ID
}

export function askRecordingQuestion(recordingId, question) {
  return postQuestion('/askRecordingLevel', { recordingId, question })
}

export async function getRecordingConversation(userId, recordingId) {
  const res = await fetch(`${API_ROOT}/getConversationMessages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, recordingId }),
  })

  if (res.status === 404) return []

  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.success) {
    throw new Error(json?.message || 'Unable to load the conversation')
  }

  return Array.isArray(json.messages) ? [...json.messages].reverse() : []
}

export function askRecordingLevelChat(recordingId, userId, question) {
  return postQuestion('/askRecordingLevelChat', { recordingId, userId, question })
}

export async function createUserConversation(userId = DEFAULT_USER_ID) {
  const res = await fetch(`${API_ROOT}/createConversation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  })

  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.success || !json.conversation) {
    throw new Error(json?.message || 'Unable to create a new conversation')
  }

  return json.conversation
}

export async function getUserConversations(userId = DEFAULT_USER_ID) {
  const res = await fetch(`${API_ROOT}/getConversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  })

  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.success) {
    throw new Error(json?.message || 'Unable to load conversations')
  }

  if (Array.isArray(json.conversation)) return json.conversation
  return json.conversation ? [json.conversation] : []
}

export async function getUserConversationMessages(conversationId) {
  const res = await fetch(`${API_ROOT}/getUserLevelConversationMessages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId }),
  })

  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.success) {
    throw new Error(json?.message || 'Unable to load conversation messages')
  }

  return Array.isArray(json.messages) ? [...json.messages].reverse() : []
}

export function askUserQuestion(userId = DEFAULT_USER_ID, question, conversationId) {
  return postQuestion('/askUserLevelChat', { userId, question, conversationId })
}

export function saveRecording(recording) {
  // No-op for local storage. DB is authoritative.
  return [recording]
}
