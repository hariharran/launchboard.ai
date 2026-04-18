"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Copy, ExternalLink, PencilLine, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PersistedProjectSummary } from "@/types/project";

type SavedProjectsViewProps = {
  initialProjects: PersistedProjectSummary[];
};

export function SavedProjectsView({ initialProjects }: SavedProjectsViewProps) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [query, setQuery] = useState("");
  const [styleFilter, setStyleFilter] = useState("All");
  const [busyProjectId, setBusyProjectId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const styles = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          projects
            .map((project) => project.selectedStyle)
            .filter((style): style is string => Boolean(style)),
        ),
      ),
    ],
    [projects],
  );

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const haystack = `${project.brandName ?? ""} ${project.startupIdea}`.toLowerCase();
      const matchesQuery = haystack.includes(query.toLowerCase());
      const matchesStyle =
        styleFilter === "All" || project.selectedStyle === styleFilter;

      return matchesQuery && matchesStyle;
    });
  }, [projects, query, styleFilter]);

  async function handleDuplicate(projectId: string) {
    setBusyProjectId(projectId);
    setMessage(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/duplicate`, {
        method: "POST",
      });
      const result = (await response.json()) as {
        ok: boolean;
        data?: PersistedProjectSummary;
        error?: string;
      };

      if (!response.ok || !result.ok || !result.data) {
        throw new Error(result.error ?? "Unable to duplicate project.");
      }

      setProjects((current) => [result.data!, ...current]);
      setMessage("Project duplicated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to duplicate project.");
    } finally {
      setBusyProjectId(null);
    }
  }

  async function handleDelete(projectId: string) {
    setBusyProjectId(projectId);
    setMessage(null);

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });
      const result = (await response.json()) as {
        ok: boolean;
        error?: string;
      };

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Unable to delete project.");
      }

      setProjects((current) => current.filter((project) => project.id !== projectId));
      setMessage("Project deleted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to delete project.");
    } finally {
      setBusyProjectId(null);
    }
  }

  function handleContinueEditing(projectId: string) {
    router.push(`/generator?projectId=${projectId}`);
  }

  return (
    <div className="surface p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="eyebrow">Saved Projects</div>
          <h1 className="mt-5 text-4xl text-slate-950">All your website drafts in one place.</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
            Search, filter, reopen, duplicate, and clean up projects as your ideas evolve.
          </p>
        </div>
        <Link href="/new-project" className={cn(buttonVariants({ size: "lg" }))}>
          Create new project
        </Link>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-[1fr_auto]">
        <label className="flex items-center gap-3 rounded-[22px] border border-slate-200 bg-white px-4 py-3">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by project name or startup idea"
            className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
        </label>

        <select
          value={styleFilter}
          onChange={(event) => setStyleFilter(event.target.value)}
          className="rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
        >
          {styles.map((style) => (
            <option key={style} value={style}>
              {style}
            </option>
          ))}
        </select>
      </div>

      {message ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
          {message}
        </div>
      ) : null}

      <div className="mt-8 space-y-4">
        {filteredProjects.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
            No projects match your current search.
          </div>
        ) : (
          filteredProjects.map((project) => {
            const isBusy = busyProjectId === project.id;

            return (
              <div
                key={project.id}
                className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-5"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <div className="text-lg font-semibold text-slate-950">
                      {project.brandName ?? "Untitled Project"}
                    </div>
                    <div className="mt-2 text-sm leading-7 text-slate-600">{project.startupIdea}</div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.22em] text-slate-500">
                      <span className="rounded-full bg-white px-3 py-2">{project.selectedStyle ?? "Auto"}</span>
                      <span className="rounded-full bg-white px-3 py-2">
                        SEO {project.seoScore ?? "N/A"}
                      </span>
                      <span className="rounded-full bg-white px-3 py-2">{project.templateType}</span>
                    </div>
                    <div className="mt-4 text-sm text-slate-500">
                      Created {new Date(project.createdAt).toLocaleString()} • Updated{" "}
                      {new Date(project.updatedAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/projects/${project.id}`}
                      className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open project
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleContinueEditing(project.id)}
                      className={cn(buttonVariants({ size: "sm" }))}
                    >
                      <PencilLine className="h-4 w-4" />
                      Continue editing
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleDuplicate(project.id)}
                      className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
                    >
                      <Copy className="h-4 w-4" />
                      Duplicate
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleDelete(project.id)}
                      className="inline-flex h-9 items-center gap-2 rounded-full border border-red-200 bg-white px-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
