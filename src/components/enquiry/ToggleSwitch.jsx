export default function ToggleSwitch({
  id,
  checked,
  onChange,
  label,
  disabled = false,
}) {
  return (
    <label className="enquiry-modal__toggle" htmlFor={id}>
      <span className="enquiry-modal__toggle-label">{label}</span>
      <span className="enquiry-modal__toggle-control">
        <input
          id={id}
          type="checkbox"
          className="enquiry-modal__toggle-input"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          disabled={disabled}
        />
        <span className="enquiry-modal__toggle-track" aria-hidden="true">
          <span className="enquiry-modal__toggle-thumb" />
        </span>
      </span>
    </label>
  );
}
