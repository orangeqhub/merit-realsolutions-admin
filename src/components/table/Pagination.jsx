import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import "./Pagination.css";

function getPageItems(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const items = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) items.push("…");
  for (let i = start; i <= end; i += 1) items.push(i);
  if (end < total - 1) items.push("…");
  items.push(total);
  return items;
}

export default function Pagination({
  page,
  totalPages,
  totalItems = 0,
  pageSize,
  pageSizeOptions = [10, 25, 50],
  onPageChange,
  onPageSizeChange,
  rangeStart,
  rangeEnd,
}) {
  return (
    <div className="erp-pagination">
      {onPageSizeChange && (
        <div className="erp-pagination__size">
          <span>Rows per page</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Rows per page"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      )}

      <p className="erp-pagination__range">
        {rangeStart}–{rangeEnd} of {totalItems}
      </p>

      <div className="erp-pagination__controls">
        <button
          type="button"
          className="erp-pagination__btn"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          aria-label="Previous page"
        >
          <FiChevronLeft />
        </button>

        {getPageItems(page, totalPages).map((item, index) =>
          item === "…" ? (
            <span key={`ellipsis-${index}`} className="erp-pagination__ellipsis">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              className={`erp-pagination__btn ${item === page ? "is-active" : ""}`}
              onClick={() => onPageChange(item)}
            >
              {item}
            </button>
          )
        )}

        <button
          type="button"
          className="erp-pagination__btn"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          aria-label="Next page"
        >
          <FiChevronRight />
        </button>
      </div>
    </div>
  );
}
