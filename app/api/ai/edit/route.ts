import { createErrorResponse, createSuccessResponse } from "@/lib/api";
import { editGeneratedSite } from "@/lib/ai/service";
import { validatePromptEditInput } from "@/lib/ai/validation";
import { requireCurrentDbUser } from "@/lib/auth";
import { hasClerkServerEnv } from "@/lib/env";

export async function POST(request: Request) {
  try {
    if (hasClerkServerEnv) {
      await requireCurrentDbUser();
    }

    const payload = validatePromptEditInput(await request.json());
    const result = await editGeneratedSite(payload);

    return createSuccessResponse(result);
  } catch (error) {
    return createErrorResponse(error);
  }
}
