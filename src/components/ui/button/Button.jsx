import { Link } from "react-router-dom";
import "./Button.css";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  to,
  href,
  type = "button",
  onClick,
  disabled = false,
  loading = false,
  fullWidth = false,
  iconOnly = false,
  className = "",
  ...rest
}) {
  const classes = [
    "btn",
    `btn--${variant}`,
    `btn--${size}`,
    fullWidth ? "btn--full" : "",
    iconOnly ? "btn--icon" : "",
    loading ? "btn--loading" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      {loading && <span className="btn__spinner" aria-hidden="true" />}
      <span className="btn__content">{children}</span>
    </>
  );

  if (to && !disabled) {
    return (
      <Link to={to} className={classes} {...rest}>
        {content}
      </Link>
    );
  }

  if (href && !disabled) {
    return (
      <a href={href} className={classes} target="_blank" rel="noopener noreferrer" {...rest}>
        {content}
      </a>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled || loading}
      {...rest}
    >
      {content}
    </button>
  );
}
