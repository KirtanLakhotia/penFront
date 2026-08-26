import { useState } from 'react'

function formatAnswer(answer) {
  if (answer === null || answer === undefined || answer === '') return 'No answer was returned.'
  if (typeof answer === 'object') return JSON.stringify(answer, null, 2)
  return String(answer)
}

function renderInlineMarkdown(text, keyPrefix) {
  const parts = String(text).split(/(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*]+\*|_[^_]+_)/g)

  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`

    if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
      return <strong key={key}>{part.slice(2, -2)}</strong>
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={key}>{part.slice(1, -1)}</code>
    }

    if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
      return <em key={key}>{part.slice(1, -1)}</em>
    }

    return part
  })
}

function AnswerContent({ text }) {
  const lines = String(text).split(/\r?\n/)
  const blocks = []
  let listItems = []

  const flushList = () => {
    if (!listItems.length) return
    blocks.push(
      <ul key={`list-${blocks.length}`}>
        {listItems.map((item, index) => (
          <li key={`item-${index}`}>{renderInlineMarkdown(item, `list-${blocks.length}-${index}`)}</li>
        ))}
      </ul>
    )
    listItems = []
  }

  lines.forEach((line, index) => {
    const bulletMatch = line.match(/^\s*[-*]\s+(.+)$/)

    if (bulletMatch) {
      listItems.push(bulletMatch[1])
      return
    }

    flushList()

    if (!line.trim()) {
      return
    }

    blocks.push(
      <p key={`line-${index}`}>
        {renderInlineMarkdown(line, `line-${index}`)}
      </p>
    )
  })

  flushList()

  return <div className="qa-answer-content">{blocks}</div>
}

function QuestionAnswerPanel({
  title,
  description,
  placeholder,
  askLabel = 'Ask',
  onAsk,
  disabledReason = '',
}) {
  const [question, setQuestion] = useState('')
  const [exchange, setExchange] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const trimmedQuestion = question.trim()
  const inputId = `${title.replace(/\s+/g, '-').toLowerCase()}-question`
  const isSubmitDisabled = isLoading || !trimmedQuestion || Boolean(disabledReason)

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!trimmedQuestion) {
      setError('Please enter a question.')
      return
    }

    if (disabledReason) {
      setError(disabledReason)
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const result = await onAsk(trimmedQuestion)
      setExchange({
        question: trimmedQuestion,
        answer: formatAnswer(result.answer),
      })
      setQuestion('')
    } catch (err) {
      setError(err.message || 'Unable to get an answer. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="qa-panel">
      <div className="detail-panel__heading qa-panel__heading">
        <div>
          <h3>{title}</h3>
          {description ? <p>{description}</p> : null}
        </div>
      </div>

      <form className="qa-form" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor={inputId}>
          {title}
        </label>
        <input
          id={inputId}
          type="text"
          value={question}
          placeholder={placeholder}
          onChange={(event) => setQuestion(event.target.value)}
          disabled={isLoading}
        />
        <button type="submit" className="primary-action" disabled={isSubmitDisabled}>
          {isLoading ? 'Asking...' : askLabel}
        </button>
      </form>

      {disabledReason ? <p className="qa-error">{disabledReason}</p> : null}
      {error ? <p className="qa-error" role="alert">{error}</p> : null}

      {exchange ? (
        <div className="qa-exchange">
          <div className="qa-message qa-message--user">
            <span>Question</span>
            <p>{exchange.question}</p>
          </div>
          <div className="qa-message qa-message--answer">
            <span>Answer</span>
            <AnswerContent text={exchange.answer} />
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default QuestionAnswerPanel
