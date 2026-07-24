import { memo } from 'react';
import { LayoutHealthValidationService } from '../../services/layoutGeneration';

function IssueList({ items = [], onHighlight, emptyLabel }) {
  if (!items.length) {
    return <p className="layout-health-card__empty">{emptyLabel}</p>;
  }

  return (
    <ul className="layout-health-card__issues">
      {items.slice(0, 8).map((issue) => (
        <li key={`${issue.rule}-${issue.message}`}>
          <button
            type="button"
            className="layout-health-card__issue-btn"
            onClick={() => onHighlight?.(issue)}
          >
            {issue.message}
          </button>
        </li>
      ))}
      {items.length > 8 ? (
        <li className="layout-health-card__more">+{items.length - 8} more</li>
      ) : null}
    </ul>
  );
}

export default memo(function LayoutHealthCard({ health, onViewIssues, onHighlightIssue }) {
  if (!health) return null;

  const score = health.healthPercent ?? health.score ?? 100;

  return (
    <div className="layout-health-card">
      <div className="layout-health-card__head">
        <div>
          <p className="layout-health-card__title">Layout Health</p>
          <strong className="layout-health-card__score">{score}%</strong>
        </div>
        <div className="layout-health-card__counts">
          <span>Warnings <strong>{health.warningCount ?? health.warnings?.length ?? 0}</strong></span>
          <span>Errors <strong>{health.errorCount ?? health.errors?.length ?? 0}</strong></span>
        </div>
      </div>

      {(health.errors?.length || health.warnings?.length) ? (
        <>
          <IssueList
            items={health.errors}
            onHighlight={onHighlightIssue}
            emptyLabel="No errors"
          />
          <IssueList
            items={health.warnings}
            onHighlight={onHighlightIssue}
            emptyLabel="No warnings"
          />
          <button
            type="button"
            className="layout-health-card__review"
            onClick={() =>
              onViewIssues?.(LayoutHealthValidationService.collectHighlightPlotIds(health))
            }
          >
            View Issues on Map
          </button>
        </>
      ) : (
        <p className="layout-health-card__ok">Layout passed all health checks.</p>
      )}
    </div>
  );
});
