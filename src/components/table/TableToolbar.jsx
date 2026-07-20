import { FiSearch } from "react-icons/fi";
import Input from "../ui/input/Input";
import "./TableToolbar.css";

export default function TableToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters,
  actions,
  className = "",
}) {
  return (
    <div className={`table-toolbar ${className}`.trim()}>
      <div className="table-toolbar__left">
        {onSearchChange && (
          <div className="table-toolbar__search">
            <Input
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              icon={<FiSearch />}
            />
          </div>
        )}
        {filters && <div className="table-toolbar__filters">{filters}</div>}
      </div>
      {actions && <div className="table-toolbar__actions">{actions}</div>}
    </div>
  );
}
