import { getProjectForCurrentUser } from "@/actions/projects";
import { GeneratorWorkspace } from "@/components/generator/generator-workspace";
import { Container } from "@/components/ui/container";

export default async function GeneratorPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const { projectId } = await searchParams;
  const initialProject = projectId ? await getProjectForCurrentUser(projectId) : null;

  return (
    <Container className="py-10">
      <GeneratorWorkspace initialProject={initialProject} />
    </Container>
  );
}
