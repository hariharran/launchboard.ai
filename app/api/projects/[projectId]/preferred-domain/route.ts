import { NextResponse } from "next/server";

import { savePreferredDomainForCurrentUser } from "@/actions/projects";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;
    const payload = (await request.json()) as { fullDomain: string };
    const project = await savePreferredDomainForCurrentUser(projectId, payload.fullDomain);

    return NextResponse.json({
      ok: true,
      data: project,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to save preferred domain.",
      },
      { status: 500 },
    );
  }
}
