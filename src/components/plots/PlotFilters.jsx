import { FiRotateCcw, FiFilter } from "react-icons/fi";
import Input from "../ui/input/Input";
import Select from "../ui/select/Select";
import {
  FACINGS,
  PLOT_STATUSES,
  SORT_OPTIONS,
  AREA_RANGES,
  PRICE_RANGES,
} from "../../pages/plotInventory/constants";

export default function PlotFilters({
  values,
  onChange,
  onReset,
  ventures = [],
  layouts = [],
  agents = [],
  hasFilters,
  resultCount,
}) {
  const set = (key) => (value) => onChange({ ...values, [key]: value });

  return (
    <div className="plot-filters">
      <div className="plot-filters__head">
        <span className="plot-filters__title">
          <FiFilter /> Filters
        </span>
        <span className="plot-filters__count">{resultCount} plots</span>
      </div>

      <div className="plot-filters__search">
        <Input
          type="search"
          value={values.search}
          onChange={(e) => onChange({ ...values, search: e.target.value })}
          placeholder="Search by plot number, customer, layout..."
        />
      </div>

      <div className="plot-filters__grid">
        <Select
          value={values.venture}
          onChange={set("venture")}
          options={[{ value: "", label: "All Ventures" }, ...ventures.map((v) => ({ value: v, label: v }))]}
          placeholder="Venture"
          searchable
        />
        <Select
          value={values.layout}
          onChange={set("layout")}
          options={[{ value: "", label: "All Layouts" }, ...layouts.map((l) => ({ value: l, label: l }))]}
          placeholder="Layout"
          searchable
        />
        <Select
          value={values.facing}
          onChange={set("facing")}
          options={[{ value: "", label: "All Facings" }, ...FACINGS.map((f) => ({ value: f, label: f }))]}
          placeholder="Facing"
        />
        <Select
          value={values.status}
          onChange={set("status")}
          options={[{ value: "", label: "All Status" }, ...PLOT_STATUSES.map((s) => ({ value: s, label: s }))]}
          placeholder="Status"
        />
        <Select
          value={values.area}
          onChange={set("area")}
          options={AREA_RANGES}
          placeholder="Area Range"
        />
        <Select
          value={values.price}
          onChange={set("price")}
          options={PRICE_RANGES}
          placeholder="Price Range"
        />
        <Select
          value={values.agent}
          onChange={set("agent")}
          options={[{ value: "", label: "All Agents" }, ...agents.map((a) => ({ value: a, label: a }))]}
          placeholder="Assigned Agent"
          searchable
        />
        <Select
          value={values.sort}
          onChange={set("sort")}
          options={SORT_OPTIONS}
          placeholder="Sort"
        />
      </div>

      <button
        type="button"
        className="plot-filters__reset"
        onClick={onReset}
        disabled={!hasFilters}
      >
        <FiRotateCcw /> Reset Filters
      </button>
    </div>
  );
}
