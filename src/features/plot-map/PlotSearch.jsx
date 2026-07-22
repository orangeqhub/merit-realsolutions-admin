import { FiSearch } from 'react-icons/fi';
import Input from '../../components/ui/input/Input';

export default function PlotSearch({
  value,
  onChange,
  placeholder = 'Search plot, area, facing, status, customer…',
}) {
  return (
    <div className="plot-map-search">
      <FiSearch aria-hidden="true" />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
