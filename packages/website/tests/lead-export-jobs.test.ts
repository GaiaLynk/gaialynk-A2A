import { afterEach, describe, expect, test } from "vitest";
import { clearLeadExportJobs, createLeadExportJob, listLeadExportJobs } from "../src/lib/leads/export-jobs";
import { clearLeadStore, upsertLead } from "../src/lib/leads/store";

afterEach(async () => {
  await clearLeadStore();
  await clearLeadExportJobs();
});

describe("lead export jobs", () => {
  test("creates completed csv export job", async () => {
    await upsertLead({
      type: "waitlist",
      locale: "en",
      name: "Alex",
      email: "alex@example.com",
      company: "Gaia",
      useCase: "Dev onboarding",
      source: "waitlist_form",
    });

    const job = await createLeadExportJob({
      format: "csv",
      filter: {},
    });

    expect(job.status).toBe("completed");
    expect(job.resultCount).toBe(1);
    expect(job.csvContent).toContain("alex@example.com");
    const list = await listLeadExportJobs({ page: 1, pageSize: 10 });
    expect(list.jobs.length).toBeGreaterThanOrEqual(1);
    expect(list.jobs[0]?.id).toBe(job.id);
  });

  test("filters jobs by status", async () => {
    await upsertLead({
      type: "demo",
      locale: "en",
      name: "Tom",
      email: "tom@example.com",
      company: "Gaia",
      useCase: "Trust panel",
      source: "demo_form",
    });
    await createLeadExportJob({
      format: "json",
      filter: {},
    });
    const completedOnly = await listLeadExportJobs({ page: 1, pageSize: 10, status: "completed" });
    expect(completedOnly.jobs.length).toBeGreaterThanOrEqual(1);
    expect(completedOnly.jobs.every((job) => job.status === "completed")).toBe(true);
  });

  test("supports paginated history queries", async () => {
    await upsertLead({
      type: "waitlist",
      locale: "en",
      name: "Mila",
      email: "mila@example.com",
      company: "Gaia",
      useCase: "Node onboarding",
      source: "waitlist_form",
    });
    await createLeadExportJob({ format: "json", filter: {} });
    await createLeadExportJob({ format: "csv", filter: {} });
    const page1 = await listLeadExportJobs({ page: 1, pageSize: 1 });
    const page2 = await listLeadExportJobs({ page: 2, pageSize: 1 });
    expect(page1.jobs.length).toBe(1);
    expect(page2.jobs.length).toBe(1);
    expect(page1.jobs[0]?.id).not.toBe(page2.jobs[0]?.id);
  });
});
