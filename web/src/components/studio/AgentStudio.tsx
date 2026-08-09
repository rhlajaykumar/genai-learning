"use client";

import { ReactNode } from "react";
import { StudioSteps } from "./StudioSteps";
import { TryChatPanel } from "./TryChatPanel";
import { StudioStepId } from "./types";

type AgentStudioProps = {
  title: string;
  toolbarActions?: ReactNode;
  step: StudioStepId;
  done: Partial<Record<StudioStepId, boolean>>;
  onStepChange: (id: StudioStepId) => void;
  agentId: string | null;
  tryDisabledReason?: string;
  children: ReactNode;
};

export function AgentStudio({
  title,
  toolbarActions,
  step,
  done,
  onStepChange,
  agentId,
  tryDisabledReason,
  children,
}: AgentStudioProps) {
  return (
    <div className="studio">
      <StudioSteps active={step} done={done} onSelect={onStepChange} />
      <div className="studio-main">
        <div className="studio-toolbar">
          <h1>{title}</h1>
          {toolbarActions ? <div className="row">{toolbarActions}</div> : null}
        </div>
        <div className="studio-workspace">{children}</div>
      </div>
      <TryChatPanel agentId={agentId} disabledReason={tryDisabledReason} />
    </div>
  );
}
