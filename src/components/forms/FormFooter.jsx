import "./FormFooter.css";

export default function FormFooter({
  children,
  left,
  align = "right",
  sticky = false,
  className = "",
}) {
  return (
    <footer
      className={`form-footer form-footer--${align} ${
        sticky ? "form-footer--sticky" : ""
      } ${className}`.trim()}
    >
      {left && <div className="form-footer__left">{left}</div>}
      <div className="form-footer__actions">{children}</div>
    </footer>
  );
}
