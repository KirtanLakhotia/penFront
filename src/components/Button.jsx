function Button({ href, children }) {
  return (
    <a className="cta-button" href={href}>
      {children}
    </a>
  )
}

export default Button
