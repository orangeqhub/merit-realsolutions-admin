import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FiChevronUp, FiChevronDown } from "react-icons/fi";
import { useBreakpoint } from "@shared/hooks/useBreakpoint";
import Pagination from "./Pagination";
import LoadingSkeleton from "../layout/LoadingSkeleton";
import "./DataTable.css";

export default function DataTable({
  columns = [],
  data = [],
  rowKey = "id",
  pageSizeOptions = [10, 25, 50],
  defaultPageSize = 10,
  emptyState = null,
  onRowClick,
  loading = false,
  stickyHeader = true,
  hiddenColumns = [],
  paginated = true,
}) {
  const { isMobile } = useBreakpoint();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [sort, setSort] = useState({ key: null, dir: "asc" });

  const visibleColumns = columns.filter((c) => !hiddenColumns.includes(c.key));

  const sortedData = useMemo(() => {
    if (!sort.key) return data;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return data;
    const accessor = col.sortAccessor || ((row) => row[sort.key]);
    return [...data].sort((a, b) => {
      const av = accessor(a);
      const bv = accessor(b);
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") {
        return sort.dir === "asc" ? av - bv : bv - av;
      }
      return sort.dir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }, [data, sort, columns]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const pageData = useMemo(() => {
    if (!paginated) return sortedData;
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize, paginated]);

  const resolveKey = (row, index) =>
    typeof rowKey === "function" ? rowKey(row) : row[rowKey] ?? index;

  const rangeStart = sortedData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, sortedData.length);

  const toggleSort = (col) => {
    if (!col.sortable) return;
    setSort((prev) =>
      prev.key === col.key
        ? { key: col.key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key: col.key, dir: "asc" }
    );
  };

  if (loading) {
    return (
      <div className="data-table__card">
        <LoadingSkeleton variant="table" count={defaultPageSize > 6 ? 6 : defaultPageSize} />
      </div>
    );
  }

  if (data.length === 0 && emptyState) {
    return <div className="data-table__card">{emptyState}</div>;
  }

  return (
    <div className="data-table__card">
      {isMobile ? (
        <div className="data-table__cards">
          {pageData.map((row, index) => (
            <motion.article
              key={resolveKey(row, index)}
              className={`data-table__card-row ${onRowClick ? "is-clickable" : ""}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.3,
                delay: index * 0.03,
                ease: [0.22, 1, 0.36, 1],
              }}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              onKeyDown={
                onRowClick
                  ? (event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onRowClick(row);
                      }
                    }
                  : undefined
              }
              role={onRowClick ? "button" : undefined}
              tabIndex={onRowClick ? 0 : undefined}
            >
              {visibleColumns.map((col) => (
                <div key={col.key} className="data-table__card-field">
                  <span className="data-table__card-label">{col.header}</span>
                  <span className="data-table__card-value">
                    {col.render ? col.render(row, index) : row[col.key]}
                  </span>
                </div>
              ))}
            </motion.article>
          ))}
        </div>
      ) : (
      <div className="data-table__scroll erp-scroll">
        <table className={`data-table ${stickyHeader ? "data-table--sticky" : ""}`}>
          <thead>
            <tr>
              {visibleColumns.map((col) => {
                const isSorted = sort.key === col.key;
                return (
                  <th
                    key={col.key}
                    className={`data-table__th data-table__th--${col.align || "left"} ${
                      col.sortable ? "is-sortable" : ""
                    } ${col.className || ""}`}
                    scope="col"
                    onClick={() => toggleSort(col)}
                  >
                    <span className="data-table__th-inner">
                      {col.header}
                      {col.sortable && (
                        <span className="data-table__sort">
                          <FiChevronUp
                            className={isSorted && sort.dir === "asc" ? "is-on" : ""}
                          />
                          <FiChevronDown
                            className={isSorted && sort.dir === "desc" ? "is-on" : ""}
                          />
                        </span>
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageData.map((row, index) => (
              <motion.tr
                key={resolveKey(row, index)}
                className={`data-table__row ${onRowClick ? "is-clickable" : ""}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.03,
                  ease: [0.22, 1, 0.36, 1],
                }}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {visibleColumns.map((col) => (
                  <td
                    key={col.key}
                    className={`data-table__td data-table__td--${col.align || "left"} ${
                      col.className || ""
                    }`}
                  >
                    {col.render ? col.render(row, index) : row[col.key]}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {paginated && (
        <div className="data-table__footer">
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            totalItems={sortedData.length}
            pageSize={pageSize}
            pageSizeOptions={pageSizeOptions}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </div>
      )}
    </div>
  );
}
