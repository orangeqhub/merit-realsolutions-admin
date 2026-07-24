import { FiSearch } from 'react-icons/fi';
import Input from '../../components/ui/input/Input';

export default function PlotSearch({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search plot, block, status, area, price, facing…',
}) {
  return (
    <div className="plot-map-search">
      <FiSearch aria-hidden="true" />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSubmit?.();
        }}
        placeholder={placeholder}
      />
    </div>
  );
}
