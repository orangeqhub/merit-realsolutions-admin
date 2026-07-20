/* ===================================================================
   Merit Real Solutions ERP — Design System barrel exports
   Import shared components from a single entry point, e.g.
     import { Button, DataTable, RightDrawer } from "components";
   =================================================================== */

/* ui */
export { default as Button } from "./ui/button/Button";
export { default as Input } from "./ui/input/Input";
export { default as Textarea } from "./ui/textarea/Textarea";
export { default as Select } from "./ui/select/Select";
export { default as Checkbox } from "./ui/checkbox/Checkbox";
export { default as RadioGroup, Radio } from "./ui/radio/Radio";
export { default as Switch } from "./ui/switch/Switch";
export { default as Upload } from "./ui/upload/Upload";
export { default as Avatar } from "./ui/avatar/Avatar";
export { default as Badge } from "./ui/badge/Badge";
export { default as Chip } from "./ui/chip/Chip";
export { default as Tooltip } from "./ui/tooltip/Tooltip";
export { default as Dropdown } from "./ui/dropdown/Dropdown";

/* layout */
export { default as PageHeader } from "./layout/PageHeader";
export { default as Breadcrumb } from "./layout/Breadcrumb";
export { default as PageContainer } from "./layout/PageContainer";
export { default as SectionHeader } from "./layout/SectionHeader";
export { default as EmptyState } from "./layout/EmptyState";
export { default as LoadingSkeleton } from "./layout/LoadingSkeleton";
export { default as QuickActions } from "./layout/QuickActions";

/* cards */
export { default as StatsCard } from "./cards/StatsCard";
export { default as SummaryCard } from "./cards/SummaryCard";
export { default as MetricCard } from "./cards/MetricCard";
export { default as InfoCard } from "./cards/InfoCard";

/* table */
export { default as DataTable } from "./table/DataTable";
export { default as TableToolbar } from "./table/TableToolbar";
export { default as Pagination } from "./table/Pagination";
export { default as ColumnSelector } from "./table/ColumnSelector";
export { default as FilterBar } from "./table/FilterBar";

/* forms */
export { default as FormSection } from "./forms/FormSection";
export { default as Stepper } from "./forms/Stepper";
export { default as FormFooter } from "./forms/FormFooter";
export { default as ValidationMessage } from "./forms/ValidationMessage";

/* navigation */
export { default as Tabs } from "./navigation/Tabs";
export { default as Pills } from "./navigation/Pills";
export { default as SideTabs } from "./navigation/SideTabs";

/* drawer */
export { default as RightDrawer } from "./drawer/RightDrawer";

/* modal */
export { default as ConfirmationModal } from "./modal/ConfirmationModal";
export { default as AlertModal } from "./modal/AlertModal";

/* feedback */
export { ToastProvider, useToast } from "./feedback/Toast";
export { default as Loader } from "./feedback/Loader";
export { default as ProgressBar } from "./feedback/ProgressBar";

/* timeline */
export { default as Timeline } from "./timeline/Timeline";
export { default as ActivityCard } from "./timeline/ActivityCard";

/* gallery */
export { default as ImageGrid } from "./gallery/ImageGrid";
export { default as ImageUploader } from "./gallery/ImageUploader";
export { default as Lightbox } from "./gallery/Lightbox";

/* charts */
export { default as ChartCard } from "./charts/ChartCard";
export { default as BarChart } from "./charts/BarChart";
export { default as LineChart } from "./charts/LineChart";
export { default as DonutChart } from "./charts/DonutChart";

/* dashboard */
export { default as KPIGrid } from "./dashboard/KPIGrid";
export { default as AnalyticsCard } from "./dashboard/AnalyticsCard";
