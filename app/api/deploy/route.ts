import { NextResponse } from "next/server";

import { saveDeploymentUrlForCurrentUser } from "@/actions/projects";
import { AuthRequiredError } from "@/lib/auth";
import { createErrorResponse } from "@/lib/api";

export async function POST(req: Request) {
  try {
    const { site, brandName, projectId } = await req.json();

    const VERCEL_TOKEN = process.env.CLIENT_DEPLOY_TOKEN;
    const VERCEL_TEAM_ID = process.env.CLIENT_DEPLOY_TEAM_ID;

    if (!VERCEL_TOKEN) {
      throw new Error("VERCEL-TOKEN is not configured in environment variables.");
    }

    // 1. Prepare the files for Vercel
    // We deploy as a static site for speed and simplicity in this hackathon
    const files = Object.entries(site.htmlByPage).map(([slug, html]) => {
      const normalizedSlug = String(slug || "home").trim() || "home";
      const fileName = normalizedSlug === "home" ? "index.html" : `${normalizedSlug}/index.html`;
      return {
        file: fileName,
        data: html,
      };
    });

    // 2. Call Vercel API to create deployment
    const projectName = (brandName || "launchboard-site")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-") // Only alphanumeric and hyphens
      .replace(/^-+|-+$/g, "");    // Remove leading/trailing hyphens

    const queryParams = VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : "";

    const response = await fetch(`https://api.vercel.com/v13/deployments${queryParams}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: projectName,
        files: files,
        projectSettings: {
          framework: null, // Static deployment
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Vercel API error: ${errorData.error?.message || "Unknown error"}`);
    }

    const data = await response.json();
    const url = `https://${data.url}`;

    const savedProject = projectId
      ? await saveDeploymentUrlForCurrentUser(projectId, url)
      : null;

    return NextResponse.json({
      ok: true,
      url,
      deploymentId: data.id,
      project: savedProject,
    });
  } catch (error) {
    console.error("Deployment failed:", error);

    if (error instanceof AuthRequiredError) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
        },
        { status: 401 },
      );
    }

    return createErrorResponse(error);
  }
}
