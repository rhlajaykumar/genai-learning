export type StudioStepId = "basics" | "knowledge" | "chunking" | "review";

export type StudioStep = {
  id: StudioStepId;
  label: string;
  hint: string;
};

export const STUDIO_STEPS: StudioStep[] = [
  { id: "basics", label: "Basics", hint: "Name & system prompt" },
  { id: "knowledge", label: "Knowledge", hint: "Upload source docs" },
  { id: "chunking", label: "Chunking", hint: "Split & embed" },
  { id: "review", label: "Review", hint: "Check readiness" },
];
