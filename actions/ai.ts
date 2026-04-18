"use server";

import {
  editGeneratedSite,
  generateInitialSite,
  regenerateProjectSection,
} from "@/lib/ai/service";
import { requireCurrentDbUser } from "@/lib/auth";
import { hasClerkServerEnv } from "@/lib/env";
import type {
  InitialGenerationInput,
  PromptEditInput,
  SectionRegenerationInput,
} from "@/types/ai";

export async function runInitialGeneration(input: InitialGenerationInput) {
  return generateInitialSite(input);
}

export async function runPromptBasedEdit(input: PromptEditInput) {
  if (hasClerkServerEnv) {
    await requireCurrentDbUser();
  }

  return editGeneratedSite(input);
}

export async function runSectionRegeneration(input: SectionRegenerationInput) {
  if (hasClerkServerEnv) {
    await requireCurrentDbUser();
  }

  return regenerateProjectSection(input);
}
