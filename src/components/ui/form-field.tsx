import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type FormFieldProps = {
  label: ReactNode;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
};

export function FormField({ label, required = false, hint, error, children, className }: FormFieldProps) {
  return (
    <label className={cn('block space-y-2', className)}>
      <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <span>{label}</span>
        {required ? <span className="text-red-600">*</span> : null}
      </span>
      {children}
      {error ? <span className="block text-xs leading-5 text-red-600">{error}</span> : null}
      {!error && hint ? <span className="block text-xs leading-5 text-slate-500">{hint}</span> : null}
    </label>
  );
}
