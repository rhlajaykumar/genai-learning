"use client";

import { Suspense } from "react";
import AgentStudioPage from "./studio-page";

export default function AgentPage() {
  return (
    <Suspense fallback={<div className="studio-try-disabled">Loading studio…</div>}>
      <AgentStudioPage />
    </Suspense>
  );
}
