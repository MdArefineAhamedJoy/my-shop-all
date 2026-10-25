import { InputHTMLAttributes, ReactNode } from "react";
export const control =
  "border border-slate-200 rounded-lg px-3 py-2 bg-white w-full";
export function Field({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block text-sm font-medium space-y-1">
      <span>{label}</span>
      <input {...props} className={control} />
    </label>
  );
}
export function Action({
  children,
  onClick,
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type={onClick ? "button" : "submit"}
      onClick={onClick}
      disabled={disabled}
      className="bg-slate-950 text-white text-sm rounded-lg px-4 py-2 disabled:opacity-50"
    >
      {children}
    </button>
  );
}
export function Notice({ error }: { error: string }) {
  return error ? (
    <p
      role="alert"
      className="bg-red-50 text-red-700 border border-red-100 p-4 rounded-lg"
    >
      {error}
    </p>
  ) : null;
}
export function Pagination({
  hasNext,
  hasPrevious,
  next,
  previous,
}: {
  hasNext: boolean;
  hasPrevious: boolean;
  next: () => void;
  previous: () => void;
}) {
  return (
    <div className="flex gap-3 mt-5">
      <Action onClick={previous} disabled={!hasPrevious}>
        Previous
      </Action>
      <Action onClick={next} disabled={!hasNext}>
        Next
      </Action>
    </div>
  );
}
