import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { SourceOption } from "@/features/sources/api/sources.api";

type SourceFiltersProps = {
  searchValue: string;
  sourceTypeValue: string;
  departmentValue: string;
  sourceTypes: SourceOption[];
  departments: SourceOption[];
  onSearchChange: (value: string) => void;
  onSourceTypeChange: (value: string) => void;
  onDepartmentChange: (value: string) => void;
  onReset: () => void;
};

export function SourceFilters({ searchValue, sourceTypeValue, departmentValue, sourceTypes, departments, onSearchChange, onSourceTypeChange, onDepartmentChange, onReset }: SourceFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
        Search by source number or title. On mobile, each source appears as a compact card you can tap to open.
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr_auto]">
        <Input
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by source no, title, reference, or summary"
          className="md:col-span-2 xl:col-span-1"
        />

        <Select value={sourceTypeValue} onChange={(event) => onSourceTypeChange(event.target.value)}>
          <option value="">All source types</option>
          {sourceTypes.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>

        <Select value={departmentValue} onChange={(event) => onDepartmentChange(event.target.value)}>
          <option value="">All departments</option>
          {departments.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>

        <Button type="button" variant="outline" onClick={onReset}>Reset</Button>
      </div>
    </div>
  );
}
