import { NextResponse } from "next/server";

import {
  deleteProjectForCurrentUser,
  getProjectForCurrentUser,
} from "@/actions/projects";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;
    const project = await getProjectForCurrentUser(projectId);

    if (!project) {
      return NextResponse.json(
        {
          ok: false,
          error: "Project not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      data: project,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to load project.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;
    await deleteProjectForCurrentUser(projectId);

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to delete project.",
      },
      { status: 500 },
    );
  }
}
