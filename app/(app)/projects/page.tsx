import { listProjectsForCurrentUser } from "@/actions/projects";
import { SavedProjectsView } from "@/components/projects/saved-projects-view";
import { Container } from "@/components/ui/container";
import { hasClerkServerEnv, hasDatabaseEnv } from "@/lib/env";

const fallbackProjects = [
  { id: "demo-1", name: "Launchboard marketing", updated: "2 hours ago", status: "SEO review" },
  { id: "demo-2", name: "Atlas CRM site", updated: "Yesterday", status: "Draft ready" },
  { id: "demo-3", name: "Nimbus analytics", updated: "3 days ago", status: "Needs edits" },
];

export default async function SavedProjectsPage() {
  const projects =
    hasClerkServerEnv && hasDatabaseEnv
      ? await listProjectsForCurrentUser()
      : fallbackProjects.map((project) => ({
          id: project.id,
          startupIdea: project.name,
          brandName: project.name,
          tagline: null,
          selectedStyle: "Premium",
          templateType: "SAAS",
          outputMode: "LANDING_PAGE",
          seoScore: null,
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        }));

  return (
    <Container className="py-10">
      <SavedProjectsView initialProjects={projects} />
    </Container>
  );
}
