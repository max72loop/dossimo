import type { UseFormRegisterReturn } from "react-hook-form";
import type { ReactNode } from "react";

/** Only the `message` is consumed, so accept any RHF error shape. */
type FieldErrorLike = { message?: string };

const inputClass =
  "h-11 w-full rounded border border-filigrane bg-blanc-casse px-3.5 text-sm text-encre placeholder:text-encre-claire outline-none transition focus:border-tampon focus:ring-2 focus:ring-tampon/15 disabled:bg-papier-fonce aria-[invalid=true]:border-erreur";

const labelClass = "mb-1.5 block text-sm font-medium text-ardoise";
const errorClass = "mt-1 text-xs text-erreur";
const hintClass = "mt-1 text-xs text-encre-claire";

function FieldShell({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: FieldErrorLike;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className={labelClass}>
        {label}
        {required && <span className="text-terre-cuite"> *</span>}
      </span>
      {children}
      {hint && !error && <p className={hintClass}>{hint}</p>}
      {error && <p className={errorClass}>{error.message}</p>}
    </label>
  );
}

export function TextField({
  label,
  register,
  error,
  required,
  hint,
  type = "text",
  placeholder,
  step,
  inputMode,
}: {
  label: string;
  register: UseFormRegisterReturn;
  error?: FieldErrorLike;
  required?: boolean;
  hint?: ReactNode;
  type?: string;
  placeholder?: string;
  step?: string;
  inputMode?: "numeric" | "decimal" | "text";
}) {
  return (
    <FieldShell label={label} required={required} error={error} hint={hint}>
      <input
        type={type}
        step={step}
        inputMode={inputMode}
        placeholder={placeholder}
        aria-invalid={!!error}
        className={inputClass}
        {...register}
      />
    </FieldShell>
  );
}

export function SelectField({
  label,
  register,
  error,
  required,
  hint,
  options,
  placeholder = "Sélectionner…",
}: {
  label: string;
  register: UseFormRegisterReturn;
  error?: FieldErrorLike;
  required?: boolean;
  hint?: ReactNode;
  options: Record<string, string>;
  placeholder?: string;
}) {
  return (
    <FieldShell label={label} required={required} error={error} hint={hint}>
      <select
        aria-invalid={!!error}
        className={inputClass}
        defaultValue=""
        {...register}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {Object.entries(options).map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="rounded border border-filigrane bg-blanc-casse p-6 shadow-sm">
      <legend className="px-1 font-serif text-lg font-semibold text-encre">
        {title}
      </legend>
      {description && (
        <p className="mb-4 text-sm text-ardoise">{description}</p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}
