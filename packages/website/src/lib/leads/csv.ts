import type { LeadRecord } from "./store";

export function leadsToCsv(rows: LeadRecord[]): string {
  const headers = ["id", "type", "locale", "name", "email", "company", "useCase", "source", "createdAt"];
  const escape = (value: string) => `"${value.replaceAll("\"", "\"\"")}"`;
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((key) => escape(String(row[key as keyof LeadRecord] || ""))).join(","));
  }
  return lines.join("\n");
}
