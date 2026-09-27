import { useEffect, useState } from 'react'
import { getTodos, setTodoDone } from '../services/recordingService'

function Todos() {
  const [state, setState] = useState({
    error: null,
    loading: true,
    todos: [],
  })

  useEffect(() => {
    let isMounted = true

    getTodos()
      .then((todos) => {
        if (!isMounted) return
        setState({ error: null, loading: false, todos })
      })
      .catch((error) => {
        if (!isMounted) return
        setState({ error: error.message || 'Unable to load action items.', loading: false, todos: [] })
      })

    return () => {
      isMounted = false
    }
  }, [])

  const completedCount = state.todos.filter((todo) => todo.is_done).length

  const handleTodoChange = async (todo) => {
    const nextIsDone = !todo.is_done
    const previousTodos = state.todos

    setState((current) => ({
      ...current,
      error: null,
      todos: current.todos.map((item) => (
        item.todo_id === todo.todo_id ? { ...item, is_done: nextIsDone } : item
      )),
    }))

    try {
      await setTodoDone(todo.todo_id, nextIsDone)
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error.message || 'Unable to update action item.',
        todos: previousTodos,
      }))
    }
  }

  return (
    <section className="todos-page section-wrap" aria-labelledby="todos-title">
      <header className="todos-page__header">
        <div>
          <p className="eyebrow">Your workspace</p>
          <h1 id="todos-title">Action items</h1>
          <p>Keep every follow-up task in one place.</p>
        </div>
        <div className="todos-page__stats" aria-label={`${completedCount} of ${state.todos.length} action items completed`}>
          <strong>{completedCount}</strong>
          <span>of {state.todos.length} done</span>
        </div>
      </header>

      {state.loading ? <p className="detail-state">Loading action items...</p> : null}
      {!state.loading && state.error && !state.todos.length ? (
        <p className="detail-state detail-state--error">{state.error}</p>
      ) : null}
      {!state.loading && !state.todos.length && !state.error ? (
        <div className="todos-empty">
          <strong>No action items yet</strong>
          <span>Upload a recording with follow-up tasks and they will appear here.</span>
        </div>
      ) : null}

      {state.todos.length > 0 ? (
        <div className="todos-list">
          {state.todos.map((todo, index) => {
            return (
              <article className={`todo-card ${todo.is_done ? 'todo-card--done' : ''}`} key={todo.todo_id || `${todo.text}-${index}`}>
                <label className="todo-card__check">
                  <input
                    type="checkbox"
                    checked={!!todo.is_done}
                    onChange={() => handleTodoChange(todo)}
                  />
                  <span className="todo-card__mark" aria-hidden="true" />
                  <span className="todo-card__content">
                    <strong>{todo.text || 'Untitled action item'}</strong>
                  </span>
                </label>
              </article>
            )
          })}
        </div>
      ) : null}

      {state.error && state.todos.length ? <p className="todos-inline-error">{state.error}</p> : null}
    </section>
  )
}

export default Todos