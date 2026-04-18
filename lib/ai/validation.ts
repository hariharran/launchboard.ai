import {
  outputModes,
  styleSelections,
  type AIProjectSnapshot,
  type InitialGenerationInput,
  type OutputModeSelection,
  type PromptEditInput,
  type SectionRegenerationInput,
  type StyleSelection,
} from "@/types/ai";
import { AIValidationError } from "@/lib/ai/errors";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown, field: string, required = true): string {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  if (!required && (value === undefined || value === null || value === "")) {
    return "";
  }

  throw new AIValidationError(`Invalid field: ${field}`, [
    `${field} must be a non-empty string.`,
  ]);
}

function validateStartupIdeaQuality(value: string) {
  const trimmed = value.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);

  if (trimmed.length < 12) {
    throw new AIValidationError("Startup idea is too short.", [
      "Add a few more details about the product, audience, or positioning.",
    ]);
  }

  if (words.length < 3) {
    throw new AIValidationError("Startup idea needs more context.", [
      "Include what the startup does and who it is for.",
    ]);
  }

  return trimmed;
}

function validateEditInstructionQuality(value: unknown, field: string) {
  const trimmed = readString(value, field);

  if (trimmed.length < 4) {
    throw new AIValidationError(`Invalid field: ${field}`, [
      `${field} should include a more specific instruction.`,
    ]);
  }

  return trimmed;
}

function readEnum<T extends readonly string[]>(
  value: unknown,
  choices: T,
  field: string,
): T[number] {
  if (typeof value === "string" && choices.includes(value)) {
    return value as T[number];
  }

  throw new AIValidationError(`Invalid field: ${field}`, [
    `${field} must be one of: ${choices.join(", ")}.`,
  ]);
}

function readSnapshot(value: unknown, field: string): AIProjectSnapshot {
  if (isRecord(value)) {
    return value as AIProjectSnapshot;
  }

  throw new AIValidationError(`Invalid field: ${field}`, [
    `${field} must be an object.`,
  ]);
}

function readPalette(value: unknown, field: string) {
  if (value === undefined || value === null) {
    return null;
  }

  if (!Array.isArray(value) || value.length === 0) {
    throw new AIValidationError(`Invalid field: ${field}`, [
      `${field} must be an array of 4 to 6 hex colors.`,
    ]);
  }

  const colors = value.map((item) => {
    if (typeof item !== "string") {
      throw new AIValidationError(`Invalid field: ${field}`, [
        `${field} must contain only hex color strings.`,
      ]);
    }

    const trimmed = item.trim();

    if (!/^#([0-9A-Fa-f]{6})$/.test(trimmed)) {
      throw new AIValidationError(`Invalid field: ${field}`, [
        `${field} must contain valid 6-digit hex colors like #243B6B.`,
      ]);
    }

    return trimmed.toUpperCase();
  });

  if (colors.length < 4 || colors.length > 6) {
    throw new AIValidationError(`Invalid field: ${field}`, [
      `${field} must include between 4 and 6 hex colors.`,
    ]);
  }

  return colors;
}

function deriveStartupIdeaFromSnapshot(snapshot: AIProjectSnapshot) {
  const candidates = [
    snapshot.productPositioning,
    snapshot.tagline && snapshot.brand
      ? `${snapshot.brand} — ${snapshot.tagline}`
      : snapshot.tagline,
    snapshot.brand && snapshot.audience
      ? `${snapshot.brand} for ${snapshot.audience}`
      : snapshot.brand,
  ];

  const derived = candidates.find((value) => typeof value === "string" && value.trim().length >= 12);

  if (!derived) {
    throw new AIValidationError("Startup idea needs more context.", [
      "Provide startupIdea or include richer existing project metadata for edit and regeneration requests.",
    ]);
  }

  return derived.trim();
}

function validateBaseInput(payload: unknown): {
  startupIdea: string;
  styleSelection: StyleSelection;
  outputMode: OutputModeSelection;
  palette: string[] | null;
} {
  if (!isRecord(payload)) {
    throw new AIValidationError("Invalid payload.", [
      "Request body must be a JSON object.",
    ]);
  }

  return {
    startupIdea: validateStartupIdeaQuality(readString(payload.startupIdea, "startupIdea")),
    styleSelection: readEnum(payload.styleSelection, styleSelections, "styleSelection"),
    outputMode: readEnum(payload.outputMode, outputModes, "outputMode"),
    palette: readPalette(payload.palette, "palette"),
  };
}

export function validateInitialGenerationInput(payload: unknown): InitialGenerationInput {
  const base = validateBaseInput(payload);

  if (isRecord(payload) && payload.existingProjectData !== undefined && payload.existingProjectData !== null) {
    return {
      ...base,
      existingProjectData: readSnapshot(payload.existingProjectData, "existingProjectData"),
    };
  }

  return {
    ...base,
    existingProjectData: null,
  };
}

export function validatePromptEditInput(payload: unknown): PromptEditInput {
  if (!isRecord(payload)) {
    throw new AIValidationError("Invalid payload.", ["Request body must be a JSON object."]);
  }

  const existingProjectData = readSnapshot(payload.existingProjectData, "existingProjectData");
  const startupIdea =
    typeof payload.startupIdea === "string" && payload.startupIdea.trim().length > 0
      ? validateStartupIdeaQuality(payload.startupIdea)
      : validateStartupIdeaQuality(deriveStartupIdeaFromSnapshot(existingProjectData));
  const base = {
    startupIdea,
    styleSelection: readEnum(payload.styleSelection, styleSelections, "styleSelection"),
    outputMode: readEnum(payload.outputMode, outputModes, "outputMode"),
    palette: readPalette(payload.palette, "palette"),
  };

  return {
    ...base,
    existingProjectData,
    editInstructions: validateEditInstructionQuality(payload.editInstructions, "editInstructions"),
  };
}

export function validateSectionRegenerationInput(
  payload: unknown,
): SectionRegenerationInput {
  if (!isRecord(payload)) {
    throw new AIValidationError("Invalid payload.", ["Request body must be a JSON object."]);
  }

  const existingProjectData = readSnapshot(payload.existingProjectData, "existingProjectData");
  const startupIdea =
    typeof payload.startupIdea === "string" && payload.startupIdea.trim().length > 0
      ? validateStartupIdeaQuality(payload.startupIdea)
      : validateStartupIdeaQuality(deriveStartupIdeaFromSnapshot(existingProjectData));
  const base = {
    startupIdea,
    styleSelection: readEnum(payload.styleSelection, styleSelections, "styleSelection"),
    outputMode: readEnum(payload.outputMode, outputModes, "outputMode"),
    palette: readPalette(payload.palette, "palette"),
  };

  return {
    ...base,
    existingProjectData,
    sectionId: readString(payload.sectionId, "sectionId"),
    editInstructions: readString(payload.editInstructions, "editInstructions", false) || undefined,
  };
}
