import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { clearLeadStore, exportLeads, listLeads, upsertLead } from "../src/lib/leads/store";

const prevDriver = process.env.GAIALYNK_LEADS_STORE;
const prevFile = process.env.GAIALYNK_LEADS_FILE;
let tempDir: string | null = null;

afterEach(async () => {
  process.env.GAIALYNK_LEADS_STORE = prevDriver;
  process.env.GAIALYNK_LEADS_FILE = prevFile;
  await clearLeadStore();
  if (tempDir) {
    rmSync(tempDir, { recursive: true, force: true });
    tempDir = null;
  }
});

describe("lead store", () => {
  test("deduplicates by email + useCase", async () => {
    tempDir = mkdtempSync(path.join(tmpdir(), "gaialynk-leads-"));
    process.env.GAIALYNK_LEADS_STORE = "file";
    process.env.GAIALYNK_LEADS_FILE = path.join(tempDir, "leads.json");
    await clearLeadStore();

    const first = await upsertLead({
      type: "waitlist",
      locale: "en",
      name: "Alex",
      email: "alex@example.com",
      company: "Gaia",
      useCase: "Developer onboarding",
      source: "waitlist_form",
    });
    const second = await upsertLead({
      type: "waitlist",
      locale: "en",
      name: "Alex",
      email: "alex@example.com",
      company: "Gaia",
      useCase: "Developer onboarding",
      source: "waitlist_form",
    });

    expect(first.isDuplicate).toBe(false);
    expect(second.isDuplicate).toBe(true);
  });

  test("exports leads by type filter", async () => {
    process.env.GAIALYNK_LEADS_STORE = "memory";
    await clearLeadStore();
    await upsertLead({
      type: "demo",
      locale: "en",
      name: "A",
      email: "a@example.com",
      company: "A Co",
      useCase: "Risk flow",
      source: "demo_form",
    });
    await upsertLead({
      type: "waitlist",
      locale: "en",
      name: "B",
      email: "b@example.com",
      company: "B Co",
      useCase: "Docs flow",
      source: "waitlist_form",
    });

    const demos = await exportLeads({ type: "demo" });
    expect(demos).toHaveLength(1);
    expect(demos[0]?.type).toBe("demo");
  });

  test("lists leads with pagination and query", async () => {
    process.env.GAIALYNK_LEADS_STORE = "memory";
    await clearLeadStore();
    await upsertLead({
      type: "demo",
      locale: "en",
      name: "Alice",
      email: "alice@example.com",
      company: "A Co",
      useCase: "Risk flow",
      source: "demo_form",
    });
    await upsertLead({
      type: "waitlist",
      locale: "en",
      name: "Bob",
      email: "bob@example.com",
      company: "B Co",
      useCase: "Docs flow",
      source: "waitlist_form",
    });

    const page1 = await listLeads({ q: "alice", page: 1, pageSize: 1, order: "desc" });
    expect(page1.total).toBe(1);
    expect(page1.records[0]?.email).toBe("alice@example.com");
  });
});
