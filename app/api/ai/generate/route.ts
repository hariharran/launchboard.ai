import { createErrorResponse, createSuccessResponse } from "@/lib/api";
import { generateInitialSite } from "@/lib/ai/service";
import { validateInitialGenerationInput } from "@/lib/ai/validation";
import type { AIProjectFiles, AIProjectTreeNode } from "@/types/ai";

function buildProjectTree(projectFiles: AIProjectFiles): AIProjectTreeNode[] {
  const root: AIProjectTreeNode[] = [];

  for (const [path, content] of Object.entries(projectFiles)) {
    const segments = path.split("/").filter(Boolean);
    let currentLevel = root;
    let currentPath = "";

    segments.forEach((segment, index) => {
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;
      const isFile = index === segments.length - 1;

      let node = currentLevel.find((entry) => entry.name === segment);

      if (!node) {
        node = {
          name: segment,
          path: currentPath,
          type: isFile ? "file" : "folder",
          ...(isFile ? { content } : { children: [] }),
        };
        currentLevel.push(node);
      }

      if (!isFile) {
        node.children ??= [];
        currentLevel = node.children;
      }
    });
  }

  const sortNodes = (nodes: AIProjectTreeNode[]) => {
    nodes.sort((left, right) => {
      if (left.type !== right.type) {
        return left.type === "folder" ? -1 : 1;
      }

      return left.name.localeCompare(right.name);
    });

    nodes.forEach((node) => {
      if (node.children) {
        sortNodes(node.children);
      }
    });
  };

  sortNodes(root);
  return root;
}

export async function POST(request: Request) {
  try {
    const payload = validateInitialGenerationInput(await request.json());
    const result = await generateInitialSite(payload);

    const projectTree = buildProjectTree(result.projectFiles ?? {});

    return createSuccessResponse({
      ...result,
      projectTree,
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
