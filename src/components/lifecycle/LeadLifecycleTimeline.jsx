import { FiCheck, FiCircle, FiClock } from 'react-icons/fi';
import './LeadLifecycleTimeline.css';

function StepIcon({ status }) {
  if (status === 'completed') return <FiCheck aria-hidden />;
  if (status === 'current') return <FiClock aria-hidden />;
  return <FiCircle aria-hidden />;
}

export default function LeadLifecycleTimeline({ steps = [], history = [], showHistory = false }) {
  if (!steps.length) return <p className="lead-lifecycle-timeline__empty">No lifecycle data yet.</p>;

  return (
    <div className="lead-lifecycle-timeline">
      <ol className="lead-lifecycle-timeline__steps">
        {steps.map((step) => (
          <li
            key={step.key}
            className={`lead-lifecycle-timeline__step lead-lifecycle-timeline__step--${step.status}`}
          >
            <span className="lead-lifecycle-timeline__icon"><StepIcon status={step.status} /></span>
            <div className="lead-lifecycle-timeline__content">
              <strong>{step.label}</strong>
              <span className="lead-lifecycle-timeline__status-label">
                {step.status === 'completed' ? 'Completed' : step.status === 'current' ? 'Current' : 'Upcoming'}
              </span>
            </div>
          </li>
        ))}
      </ol>

      {showHistory && history.length > 0 ? (
        <div className="lead-lifecycle-timeline__history">
          <h4>Stage History</h4>
          <ul>
            {history.map((entry) => (
              <li key={entry.id}>
                <strong>{entry.previousStageLabel || 'Start'} → {entry.newStageLabel}</strong>
                <span>{entry.changedBy} · {entry.changedAt ? new Date(entry.changedAt).toLocaleString('en-IN') : ''}</span>
                {entry.remarks ? <p>{entry.remarks}</p> : null}
                {entry.sourceModule ? <small>{entry.sourceModule}</small> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
