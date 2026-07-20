export default function EnquiryField({
  label,
  htmlFor,
  required = false,
  error,
  hint,
  children,
  className = '',
}) {
  return (
    <div className={`enquiry-modal__field ${className}`.trim()}>
      {label ? (
        <label className="enquiry-modal__label" htmlFor={htmlFor}>
          {label}
          {required ? <span className="enquiry-modal__required">*</span> : null}
        </label>
      ) : null}
      {children}
      {error ? <span className="enquiry-modal__error">{error}</span> : null}
      {!error && hint ? <span className="enquiry-modal__hint">{hint}</span> : null}
    </div>
  );
}
