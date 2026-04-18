import { createErrorResponse, createSuccessResponse } from "@/lib/api";
import { regenerateProjectSection } from "@/lib/ai/service";
import { validateSectionRegenerationInput } from "@/lib/ai/validation";
import { requireCurrentDbUser } from "@/lib/auth";
import { hasClerkServerEnv } from "@/lib/env";

export async function POST(request: Request) {
  try {
    if (hasClerkServerEnv) {
      await requireCurrentDbUser();
    }

    const payload = validateSectionRegenerationInput(await request.json());
    const result = await regenerateProjectSection(payload);

    return createSuccessResponse(result);
  } catch (error) {
    return createErrorResponse(error);
  }
}
