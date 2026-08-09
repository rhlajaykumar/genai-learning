"use client";

import { STUDIO_STEPS, StudioStepId } from "./types";

type StudioStepsProps = {
  active: StudioStepId;
  done: Partial<Record<StudioStepId, boolean>>;
  onSelect: (id: StudioStepId) => void;
};

export function StudioSteps({ active, done, onSelect }: StudioStepsProps) {
  return (
    <aside className="studio-steps">
      <h2 className="studio-steps-title">Agent studio</h2>
      {STUDIO_STEPS.map((step, index) => {
        const isActive = step.id === active;
        const isDone = Boolean(done[step.id]);
        return (
          <button
            key={step.id}
            type="button"
            className={`studio-step${isActive ? " active" : ""}${isDone ? " done" : ""}`}
            onClick={() => onSelect(step.id)}
          >
            <span className="studio-step-index">{isDone && !isActive ? "✓" : index + 1}</span>
            <span>
              <div className="studio-step-label">{step.label}</div>
              <div className="studio-step-hint">{step.hint}</div>
            </span>
          </button>
        );
      })}
    </aside>
  );
}
