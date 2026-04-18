import { NextResponse } from "next/server";

import {
  listProjectsForCurrentUser,
  saveGeneratedProject,
} from "@/actions/projects";
import { AuthRequiredError } from "@/lib/auth";

export async function GET() {
  try {
    const projects = await listProjectsForCurrentUser();

    return NextResponse.json({
      ok: true,
      data: projects,
    });
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
        },
        { status: 401 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to load projects.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Parameters<typeof saveGeneratedProject>[0];
    const savedProject = await saveGeneratedProject(payload);

    return NextResponse.json({
      ok: true,
      data: savedProject,
    });
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
        },
        { status: 401 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to save project.",
      },
      { status: 500 },
    );
  }
}
