"use server";

import { landingTemplate } from "@/templates/landing";
import type { GeneratedSite } from "@/types/site";

type CreateProjectInput = {
  idea: string;
  audience: string;
  tone: string;
};

export async function createProjectDraft(
  input: CreateProjectInput,
): Promise<GeneratedSite> {
  void input;

  return {
    ...landingTemplate,
  };
}
