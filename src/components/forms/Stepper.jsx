import { FiCheck } from "react-icons/fi";
import "./Stepper.css";

export default function Stepper({
  steps = [],
  current = 0,
  onStepClick,
  orientation = "horizontal",
  className = "",
}) {
  return (
    <div
      className={`stepper stepper--${orientation} ${className}`.trim()}
      role="tablist"
      aria-orientation={orientation}
    >
      {steps.map((step, index) => {
        const isCompleted = index < current;
        const isActive = index === current;
        const status = isCompleted ? "completed" : isActive ? "active" : "upcoming";
        const clickable = onStepClick && index <= current;

        return (
          <div
            key={step.label || index}
            className={`stepper__step stepper__step--${status} ${
              clickable ? "is-clickable" : ""
            }`}
            onClick={clickable ? () => onStepClick(index) : undefined}
            role="tab"
            aria-selected={isActive}
          >
            <div className="stepper__indicator">
              <span className="stepper__bubble">
                {isCompleted ? <FiCheck /> : step.icon || index + 1}
              </span>
              {index < steps.length - 1 && (
                <span className="stepper__line" />
              )}
            </div>
            <div className="stepper__text">
              <span className="stepper__label">{step.label}</span>
              {step.description && (
                <span className="stepper__description">{step.description}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
