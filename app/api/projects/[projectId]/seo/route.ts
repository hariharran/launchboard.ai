import { NextResponse } from "next/server";

import { saveSeoSummaryForCurrentUser } from "@/actions/projects";
import type { SeoSummary } from "@/lib/seo/checker";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;
    const payload = (await request.json()) as { summary: SeoSummary };
    const project = await saveSeoSummaryForCurrentUser(projectId, payload.summary);

    return NextResponse.json({
      ok: true,
      data: project,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to save SEO summary.",
      },
      { status: 500 },
    );
  }
}
