import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section className="empty-state">
      <h1>Page not found</h1>
      <p>The requested calculator does not exist yet.</p>
      <Link className="button-link" to="/">Return home</Link>
    </section>
  )
}
