import Link from "next/link";
import { notFound } from "next/navigation";

import { getProjectForCurrentUser } from "@/actions/projects";
import { Container } from "@/components/ui/container";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await getProjectForCurrentUser(projectId);

  if (!project) {
    notFound();
  }

  return (
    <Container className="py-10">
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="surface p-8">
          <div className="eyebrow">Project Detail</div>
          <h1 className="mt-5 text-4xl text-slate-950">
            {project.brandName ?? project.startupIdea}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
            {project.startupIdea}
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] bg-slate-50 p-5">
              <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Style</div>
              <div className="mt-2 text-lg font-semibold text-slate-950">
                {project.selectedStyle ?? "Auto"}
              </div>
            </div>
            <div className="rounded-[24px] bg-slate-50 p-5">
              <div className="text-xs uppercase tracking-[0.22em] text-slate-500">SEO score</div>
              <div className="mt-2 text-lg font-semibold text-slate-950">
                {project.seoScore ?? "N/A"}
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/generator?projectId=${project.id}`} className={cn(buttonVariants())}>
              Continue editing
            </Link>
            <Link
              href="/projects"
              className={cn(buttonVariants({ variant: "secondary" }))}
            >
              Back to saved projects
            </Link>
          </div>
        </section>

        <section className="surface-dark p-8 text-white">
          <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Saved pages</div>
          <div className="mt-6 space-y-4">
            {project.pages.map((page) => (
              <div key={page.id} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <div className="text-lg font-semibold text-white">{page.title}</div>
                <div className="mt-2 text-sm uppercase tracking-[0.22em] text-slate-400">
                  /{page.slug}
                </div>
                <div className="mt-3 text-sm leading-7 text-slate-300">
                  Structure and preview HTML saved for future editing and rendering.
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Container>
  );
}
