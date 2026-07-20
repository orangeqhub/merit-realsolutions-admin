import { FiRotateCcw } from "react-icons/fi";
import Select from "../ui/select/Select";
import "./FilterBar.css";

export default function FilterBar({
  filters = [],
  values = {},
  onChange,
  onReset,
  className = "",
}) {
  const hasActive = Object.values(values).some((v) => v && v !== "all");

  return (
    <div className={`filter-bar ${className}`.trim()}>
      {filters.map((filter) => (
        <div className="filter-bar__item" key={filter.key}>
          <Select
            label={filter.label}
            value={values[filter.key] ?? filter.defaultValue ?? ""}
            options={filter.options}
            placeholder={filter.placeholder || `All ${filter.label}`}
            onChange={(val) => onChange?.(filter.key, val)}
            searchable={filter.searchable}
          />
        </div>
      ))}

      {onReset && hasActive && (
        <button type="button" className="filter-bar__reset" onClick={onReset}>
          <FiRotateCcw />
          Reset
        </button>
      )}
    </div>
  );
}
