"use client";

import { AlertTriangle, BadgeCheck, Gavel, Loader2, Sparkles, UserCheck } from "lucide-react";
import type { KeyboardEvent, ReactNode } from "react";
import type { WorkflowResult } from "@/types/jury";
import { getWorkflowStage, routeLabels, type WorkspaceView } from "../_lib/workspace";

export function WorkspaceTabs({
  activeView,
  onChange,
  result,
  isRunning,
  hasUnrunChanges,
  elapsedSeconds
}: {
  activeView: WorkspaceView;
  onChange: (view: WorkspaceView) => void;
  result: WorkflowResult | null;
  isRunning: boolean;
  hasUnrunChanges: boolean;
  elapsedSeconds: number;
}) {
  const stage = getWorkflowStage(elapsedSeconds);
  const views: {
    id: WorkspaceView;
    label: string;
    summary: string;
    icon: ReactNode;
  }[] = [
    {
      id: "hud",
      label: "HUD",
      summary: "Case route, evidence, risk, and reviewer action",
      icon: <Gavel className="h-4 w-4" aria-hidden="true" />
    },
    {
      id: "human-review",
      label: "Human Review",
      summary: "Final verdict, rationale, and handoff record",
      icon: <UserCheck className="h-4 w-4" aria-hidden="true" />
    },
    {
      id: "ai-jury",
      label: "AI Jury Panel",
      summary: "Agent reasoning, disagreement, and audit trail",
      icon: <Sparkles className="h-4 w-4" aria-hidden="true" />
    }
  ];
  const statusText = isRunning
    ? stage.label
    : hasUnrunChanges
      ? "Changes made"
      : result?.route.routeKind
        ? routeLabels[result.route.routeKind]
        : "Awaiting workflow";

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
      return;
    }

    event.preventDefault();
    const nextIndex = event.key === "ArrowRight"
      ? (index + 1) % views.length
      : (index - 1 + views.length) % views.length;
    const nextView = views[nextIndex];
    onChange(nextView.id);
    window.requestAnimationFrame(() => {
      document.getElementById(`workspace-tab-${nextView.id}`)?.focus();
    });
  }

  return (
    <nav
      aria-label="Reviewer workspace views"
      className="grid gap-3 rounded-md border border-line bg-white p-2 shadow-soft lg:grid-cols-[minmax(0,1fr)_auto]"
    >
      <div className="grid gap-2 md:grid-cols-3" role="tablist" aria-label="Workspace view">
        {views.map((view, index) => {
          const selected = activeView === view.id;
          return (
            <button
              key={view.id}
              id={`workspace-tab-${view.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`workspace-panel-${view.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(view.id)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
              className={`min-h-16 rounded-md border px-3 py-2 text-left transition ${
                selected
                  ? "border-teal bg-[#fff7f4] text-ink shadow-brand"
                  : "border-transparent bg-white text-graphite hover:border-[#fdb098] hover:bg-[#fff7f4]"
              }`}
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <span className={selected ? "text-teal" : "text-graphite"}>{view.icon}</span>
                {view.label}
              </span>
              <span className="mt-1 block text-xs leading-5">{view.summary}</span>
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between gap-3 rounded-md border border-line bg-[#f5f5f5] px-3 py-2 lg:min-w-64">
        <div>
          <p className="text-xs font-semibold uppercase text-graphite">Workspace status</p>
          <p className="mt-1 text-sm font-semibold text-ink">{statusText}</p>
        </div>
        {isRunning ? (
          <Loader2 className="h-5 w-5 animate-spin text-teal" aria-hidden="true" />
        ) : hasUnrunChanges ? (
          <AlertTriangle className="h-5 w-5 text-[#7a4d00]" aria-hidden="true" />
        ) : (
          <BadgeCheck className="h-5 w-5 text-teal" aria-hidden="true" />
        )}
      </div>
    </nav>
  );
}
