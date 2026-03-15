import { NextResponse } from "next/server";
import { validateLeadsAccess } from "@/lib/leads/auth";
import { getLeadExportJob } from "@/lib/leads/export-jobs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = validateLeadsAccess(request.headers);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const job = await getLeadExportJob(id);
  if (!job) {
    return NextResponse.json({ ok: false, error: "Export job not found." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    job: {
      id: job.id,
      status: job.status,
      format: job.format,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      resultCount: job.resultCount || 0,
      error: job.error || null,
    },
    result:
      job.status === "completed"
        ? {
            records: job.records || null,
            csv: job.csvContent || null,
          }
        : null,
  });
}
