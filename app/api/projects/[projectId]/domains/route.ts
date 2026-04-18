import { NextResponse } from "next/server";

import { refreshProjectDomainsForCurrentUser } from "@/actions/projects";
import { DomainLookupError } from "@/lib/domain/service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;
    const payload = (await request.json().catch(() => ({}))) as { query?: string };
    const project = await refreshProjectDomainsForCurrentUser(projectId, payload.query);

    return NextResponse.json({
      ok: true,
      data: project,
    });
  } catch (error) {
    if (error instanceof DomainLookupError) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to refresh domains.",
      },
      { status: 500 },
    );
  }
}
