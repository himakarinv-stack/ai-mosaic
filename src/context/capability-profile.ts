export interface CapabilityProfile {
  key: string;
  label: string;
  required: string[];
  recommended: string[];
  deprecated: string[];
  unavailable: string[];
}

const PROFILES: Record<string, CapabilityProfile> = {
  v19: {
    key: "v19",
    label: "Angular 19",
    required: [
      "Standalone components for new code",
      "ChangeDetectionStrategy.OnPush for new components",
      "Typed reactive forms for new forms",
      "inject() over constructor DI for new services",
    ],
    recommended: [
      "signal(), computed() for component-local state",
      "input(), output() for new component APIs",
      "Control flow: @if, @for (with track), @switch",
      "takeUntilDestroyed() for component-scoped subscriptions",
    ],
    deprecated: [
      "*ngIf, *ngFor, *ngSwitch in new templates",
      "@Input/@Output in new components",
      "Default change detection in new components",
      "NgModule-based feature shells for greenfield code",
    ],
    unavailable: ["Full zoneless as default (experimental in 19)"],
  },
  v20: {
    key: "v20",
    label: "Angular 20",
    required: [
      "Standalone components",
      "OnPush change detection",
      "Control flow syntax (@if, @for, @switch)",
      "Signals for component-local reactive state",
      "input()/output() for component public API",
    ],
    recommended: [
      "Zoneless-ready patterns (no implicit CD triggers)",
      "computed() for derived UI state",
      "effect() only for intentional side effects",
      "@defer for heavy or below-fold content",
    ],
    deprecated: [
      "Legacy structural directives",
      "Template function calls and recalculating getters",
      "Manual subscribe without teardown strategy",
      "Mutable component fields synced imperatively",
    ],
    unavailable: [],
  },
  v21: {
    key: "v21",
    label: "Angular 21+",
    required: [
      "All v20 requirements",
      "Zoneless-friendly architecture (no zone.js assumptions in new code)",
      "Stable track expressions in every @for",
      "Presentational components testable in isolation (Storybook-ready)",
    ],
    recommended: [
      "Signal-based inputs with transform functions where needed",
      "Resource API / linkedSignal for async state where applicable",
      "Feature-level lazy boundaries with clear public APIs",
      "Storybook autodocs + controls for shared UI components",
    ],
    deprecated: [
      "Zone.js-dependent patterns in new features",
      "Constructor subscriptions and lifecycle orchestration",
      "God components mixing routing, state, and rendering",
    ],
    unavailable: [],
  },
};

export function getCapabilityProfile(profileKey: string): CapabilityProfile {
  return PROFILES[profileKey] ?? PROFILES.v21;
}

export function formatProfile(profile: CapabilityProfile): string {
  const section = (title: string, items: string[]) =>
    items.length ? [`## ${title}`, ...items.map((i) => `- ${i}`), ""] : [];

  return [
    `# Capability Profile: ${profile.label}`,
    "",
    ...section("Required (new code)", profile.required),
    ...section("Recommended", profile.recommended),
    ...section("Deprecated (flag in review)", profile.deprecated),
    ...section("Not yet available", profile.unavailable),
  ].join("\n");
}
