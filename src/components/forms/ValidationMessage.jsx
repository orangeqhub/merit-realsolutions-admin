import {
  FiAlertCircle,
  FiCheckCircle,
  FiAlertTriangle,
  FiInfo,
} from "react-icons/fi";
import "./ValidationMessage.css";

const ICONS = {
  error: <FiAlertCircle />,
  success: <FiCheckCircle />,
  warning: <FiAlertTriangle />,
  info: <FiInfo />,
};

export default function ValidationMessage({ type = "error", children, message }) {
  const content = children ?? message;
  if (!content) return null;
  return (
    <p className={`validation-message validation-message--${type}`} role="alert">
      <span className="validation-message__icon">{ICONS[type]}</span>
      {content}
    </p>
  );
}
