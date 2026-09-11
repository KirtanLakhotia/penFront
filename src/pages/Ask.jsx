import { useEffect, useMemo, useRef, useState } from 'react'
import {
  askUserQuestion,
  createUserConversation,
  getCurrentUserId,
  getUserConversationMessages,
  getUserConversations,
} from '../services/recordingService'

function conversationIdOf(conversation) {
  return conversation?.conversation_id || conversation?.conversationId || conversation?.id
}

function formatConversationDate(conversation) {
  const value = conversation?.created_at || conversation?.createdAt
  if (!value) return 'New conversation'

  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(value))
}

function Ask() {
  const userId = getCurrentUserId()
  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [messagesByConversation, setMessagesByConversation] = useState({})
  const [question, setQuestion] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [messagesLoadedId, setMessagesLoadedId] = useState(null)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef(null)

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversationIdOf(conversation) === activeId),
    [activeId, conversations]
  )
  const messages = useMemo(
    () => (activeId ? messagesByConversation[activeId] || [] : []),
    [activeId, messagesByConversation]
  )
  const isMessagesLoading = Boolean(activeId && messagesLoadedId !== activeId)

  useEffect(() => {
    let mounted = true

    getUserConversations(userId)
      .then(async (found) => {
        if (!mounted) return
        if (found.length) {
          setConversations(found)
          setActiveId(conversationIdOf(found[0]))
          return
        }

        const conversation = await createUserConversation(userId)
        if (!mounted) return
        setConversations([conversation])
        setActiveId(conversationIdOf(conversation))
      })
      .catch((err) => {
        if (mounted) setError(err.message || 'Unable to load conversations.')
      })
      .finally(() => {
        if (mounted) setIsLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [userId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isSending])

  useEffect(() => {
    let mounted = true

    if (!activeId) return undefined

    getUserConversationMessages(activeId)
      .then((savedMessages) => {
        if (!mounted) return
        setMessagesByConversation((current) => ({
          ...current,
          [activeId]: savedMessages.map((message) => ({
            id: message.message_id || message.id || `${message.role}-${message.created_at || Date.now()}`,
            role: message.role === 'user' ? 'user' : 'assistant',
            content: message.content ?? message.text ?? '',
          })),
        }))
        setMessagesLoadedId(activeId)
      })
      .catch((err) => {
        if (!mounted) return
        setError(err.message || 'Unable to load conversation messages.')
        setMessagesLoadedId(activeId)
      })

    return () => {
      mounted = false
    }
  }, [activeId])

  const handleNewChat = async () => {
    setError('')
    try {
      const conversation = await createUserConversation(userId)
      setConversations((current) => [conversation, ...current])
      setActiveId(conversationIdOf(conversation))
      setQuestion('')
    } catch (err) {
      setError(err.message || 'Unable to create a new conversation.')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const trimmedQuestion = question.trim()
    if (!trimmedQuestion || isSending) return

    let conversationId = activeId
    setError('')

    try {
      if (!conversationId) {
        const conversation = await createUserConversation(userId)
        conversationId = conversationIdOf(conversation)
        setConversations((current) => [conversation, ...current])
        setActiveId(conversationId)
      }

      const userMessage = { id: `pending-${Date.now()}`, role: 'user', content: trimmedQuestion }
      setMessagesByConversation((current) => ({
        ...current,
        [conversationId]: [...(current[conversationId] || []), userMessage],
      }))
      setQuestion('')
      setIsSending(true)

      const result = await askUserQuestion(userId, trimmedQuestion, conversationId)
      setMessagesByConversation((current) => ({
        ...current,
        [conversationId]: [
          ...(current[conversationId] || []),
          { id: `answer-${Date.now()}`, role: 'assistant', content: result.answer || 'No answer was returned.' },
        ],
      }))
    } catch (err) {
      setError(err.message || 'Unable to get an answer. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <section className="ask-page" aria-label="Ask your recordings">
      <aside className="ask-sidebar">
        <div className="ask-sidebar__top">
          <div className="ask-sidebar__brand"><span className="ask-sidebar__dot" />Vector AI</div>
          <button type="button" className="ask-new-chat" onClick={handleNewChat} disabled={isLoading}>
            <span aria-hidden="true">+</span> New chat
          </button>
        </div>
        <div className="ask-history">
          <p className="ask-history__label">Your conversations</p>
          {isLoading ? <p className="ask-muted">Loading chats...</p> : null}
          {!isLoading && !conversations.length ? <p className="ask-muted">No conversations yet.</p> : null}
          {conversations.map((conversation, index) => {
            const id = conversationIdOf(conversation)
            const conversationMessages = messagesByConversation[id] || []
            const firstQuestion = conversationMessages.find((message) => message.role === 'user')?.content

            return (
              <button
                type="button"
                className={`ask-history__item ${id === activeId ? 'ask-history__item--active' : ''}`}
                key={id || index}
                onClick={() => setActiveId(id)}
              >
                <span className="ask-history__icon" aria-hidden="true">⌁</span>
                <span className="ask-history__copy">
                  <strong>{firstQuestion || 'New conversation'}</strong>
                  <small>{formatConversationDate(conversation)}</small>
                </span>
              </button>
            )
          })}
        </div>
        <div className="ask-sidebar__footer">Ask across your saved recordings</div>
      </aside>

      <div className="ask-workspace">
        <header className="ask-header">
          <div>
            <p className="ask-kicker">Personal knowledge</p>
            <h1>{activeConversation ? 'Ask anything' : 'Start a conversation'}</h1>
            <p>Search and understand everything in your recordings.</p>
          </div>
          <div className="ask-status"><span /> Your recordings</div>
        </header>

        <div className="ask-messages" aria-live="polite">
          {isMessagesLoading ? <p className="ask-loading-message">Loading conversation...</p> : null}
          {!isMessagesLoading && !messages.length && !isSending ? (
            <div className="ask-empty">
              <div className="ask-empty__mark">✦</div>
              <h2>What would you like to know?</h2>
              <p>Ask about decisions, ideas, people, or moments from your recordings.</p>
              <div className="ask-suggestions">
                {['Summarize my latest recording', 'What decisions were made?', 'Find my action items'].map((suggestion) => (
                  <button type="button" key={suggestion} onClick={() => setQuestion(suggestion)}>{suggestion}</button>
                ))}
              </div>
            </div>
          ) : null}
          {messages.map((message) => (
            <div className={`ask-message ask-message--${message.role}`} key={message.id}>
              <div className="ask-message__avatar">{message.role === 'user' ? 'You' : 'V'}</div>
              <div className="ask-message__body">
                <span>{message.role === 'user' ? 'You' : 'Vector AI'}</span>
                <p>{message.content}</p>
              </div>
            </div>
          ))}
          {isSending ? <div className="ask-message ask-message--assistant"><div className="ask-message__avatar">V</div><div className="ask-message__body"><span>Vector AI</span><p className="ask-thinking">Thinking<span>•••</span></p></div></div> : null}
          <div ref={messagesEndRef} />
        </div>

        <div className="ask-composer-wrap">
          {error ? <p className="ask-error" role="alert">{error}</p> : null}
          <form className="ask-composer" onSubmit={handleSubmit}>
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  event.currentTarget.form.requestSubmit()
                }
              }}
              placeholder="Message Vector AI..."
              rows="1"
              disabled={isLoading || isSending || isMessagesLoading}
              aria-label="Message Vector AI"
            />
            <button type="submit" aria-label="Send message" disabled={isLoading || isSending || isMessagesLoading || !question.trim()}>↑</button>
          </form>
          <p className="ask-composer-hint">Vector AI can make mistakes. Check important information in your recordings.</p>
        </div>
      </div>
    </section>
  )
}

export default Ask
