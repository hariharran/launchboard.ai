import { createErrorResponse, createSuccessResponse } from "@/lib/api";
import { generateInitialSite } from "@/lib/ai/service";
import { validateInitialGenerationInput } from "@/lib/ai/validation";

export async function POST(request: Request) {
  try {
    const payload = validateInitialGenerationInput(await request.json());
    const result = await generateInitialSite(payload);

    return createSuccessResponse(result);
  } catch (error) {
    return createErrorResponse(error);
  }
}
