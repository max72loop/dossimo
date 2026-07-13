export type QuoteField = { key: string; label: string; type: "text" | "number" | "boolean"; unit: string | null; required: boolean; min_value: number | null; max_value: number | null };
export type QuoteLine = { type: "designation" | "mention" | "cee" | "performance"; template: string };

export function generateQuote(params: { fields: QuoteField[]; lines: QuoteLine[]; values: Record<string, string>; context: Record<string, string> }) {
  const errors: Record<string, string> = {};
  for (const field of params.fields) {
    const value = params.values[field.key]?.trim() ?? "";
    if (field.required && !value) errors[field.key] = `${field.label} est requis.`;
    if (field.type === "number" && value) {
      const n = Number(value.replace(",", "."));
      if (!Number.isFinite(n)) errors[field.key] = `${field.label} doit être un nombre.`;
      else if (field.min_value != null && n < field.min_value) errors[field.key] = `${field.label} doit être supérieur ou égal à ${field.min_value}.`;
      else if (field.max_value != null && n > field.max_value) errors[field.key] = `${field.label} doit être inférieur ou égal à ${field.max_value}.`;
    }
  }
  const dictionary = { ...params.context, ...params.values };
  const render = (template: string) => template.replace(/{{\s*([\w_]+)\s*}}/g, (_, key: string) => dictionary[key]?.trim() || `[${key} à compléter]`);
  return { ok: Object.keys(errors).length === 0, errors, lines: params.lines.map((line) => ({ ...line, text: render(line.template) })) };
}
