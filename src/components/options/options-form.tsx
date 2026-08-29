"use client";

import type { OptionField } from "@/lib/tools/types";

interface Props {
  fields: OptionField[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  disabled?: boolean;
}

export function OptionsForm({ fields, values, onChange, disabled }: Props) {
  const visible = fields.filter((f) => f.type !== "hidden");
  if (!visible.length) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {visible.map((field) => {
        const value = values[field.key];
        const id = `opt-${field.key}`;
        return (
          <div key={field.key} className={field.wide ? "sm:col-span-2" : ""}>
            <label htmlFor={id} className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {field.label}
            </label>

            {field.type === "select" && (
              <select
                id={id}
                className="input-p"
                value={value ?? field.default ?? ""}
                disabled={disabled}
                onChange={(e) => onChange(field.key, e.target.value)}
              >
                {field.options?.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            )}

            {(field.type === "text" || field.type === "password") && (
              <input
                id={id}
                type={field.type === "password" ? "password" : "text"}
                className="input-p"
                placeholder={field.placeholder}
                value={value ?? ""}
                disabled={disabled}
                autoComplete={field.type === "password" ? "new-password" : undefined}
                onChange={(e) => onChange(field.key, e.target.value)}
              />
            )}

            {field.type === "number" && (
              <input
                id={id}
                type="number"
                className="input-p"
                min={field.min}
                max={field.max}
                placeholder={field.placeholder}
                value={value ?? field.default ?? ""}
                disabled={disabled}
                onChange={(e) => onChange(field.key, e.target.value)}
              />
            )}

            {field.type === "range" && (
              <div className="flex items-center gap-3">
                <input
                  id={id}
                  type="range"
                  className="h-1.5 w-full accent-brand-500"
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  value={value ?? field.default ?? 0}
                  disabled={disabled}
                  onChange={(e) => onChange(field.key, parseFloat(e.target.value))}
                />
                <span className="w-12 rounded-md bg-brand-500/10 py-0.5 text-center text-xs font-bold text-brand-500">
                  {String(value ?? field.default)}
                </span>
              </div>
            )}

            {field.type === "checkbox" && (
              <label className="flex cursor-pointer items-center gap-2.5 py-1 text-sm font-medium">
                <input
                  id={id}
                  type="checkbox"
                  className="h-4 w-4 accent-brand-500"
                  checked={!!(value ?? field.default)}
                  disabled={disabled}
                  onChange={(e) => onChange(field.key, e.target.checked)}
                />
                {field.label}
              </label>
            )}

            {field.type === "color" && (
              <div className="flex items-center gap-3">
                <input
                  id={id}
                  type="color"
                  className="h-9 w-14 cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--card)] p-1"
                  value={value ?? field.default ?? "#000000"}
                  disabled={disabled}
                  onChange={(e) => onChange(field.key, e.target.value)}
                />
                <code className="text-xs text-slate-400">{value ?? field.default}</code>
              </div>
            )}

            {field.type === "file" && (
              <input
                id={id}
                type="file"
                accept={field.accept?.join(",")}
                className="input-p file:mr-3 file:rounded-lg file:border-0 file:bg-brand-500/15 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-brand-500"
                disabled={disabled}
                onChange={(e) => onChange(field.key, e.target.files?.[0])}
              />
            )}

            {field.hint && <p className="mt-1 text-xs text-slate-400">{field.hint}</p>}
          </div>
        );
      })}
    </div>
  );
}

export function defaultOptionValues(fields?: OptionField[]): Record<string, any> {
  const out: Record<string, any> = {};
  fields?.forEach((f) => {
    if (f.type !== "hidden") out[f.key] = f.default;
    else out[f.key] = f.default;
  });
  return out;
}
