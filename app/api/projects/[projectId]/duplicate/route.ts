import { NextResponse } from "next/server";

import { duplicateProjectForCurrentUser } from "@/actions/projects";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;
    const duplicated = await duplicateProjectForCurrentUser(projectId);

    return NextResponse.json({
      ok: true,
      data: duplicated,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to duplicate project.",
      },
      { status: 500 },
    );
  }
}
