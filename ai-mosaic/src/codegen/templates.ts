export interface GeneratedFile {
  path: string;
  content: string;
  description: string;
}

function pascalCase(name: string): string {
  return name
    .split(/[-_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function kebabCase(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

export function generateComponent(options: {
  name: string;
  featurePath: string;
  presentational?: boolean;
  withStory?: boolean;
}): GeneratedFile[] {
  const className = pascalCase(options.name);
  const selector = `app-${kebabCase(options.name)}`;
  const base = options.featurePath.replace(/\\/g, "/").replace(/\/$/, "");
  const isDumb = options.presentational ?? true;

  const ts = `import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: '${selector}',
  standalone: true,
  templateUrl: './${kebabCase(options.name)}.component.html',
  styleUrl: './${kebabCase(options.name)}.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ${className}Component {
  /** Primary data for the view — keep presentational; no service injection here. */
  readonly data = input.required<unknown>();

  /** Emits user intent upward; container handles side effects. */
  readonly action = output<void>();
}
`;

  const html = `<section class="${kebabCase(options.name)}">
  <!-- Presentational template: no business logic, no subscriptions -->
</section>
`;

  const scss = `.${kebabCase(options.name)} {
  display: block;
}
`;

  const files: GeneratedFile[] = [
    {
      path: `${base}/${kebabCase(options.name)}.component.ts`,
      content: ts,
      description: `${isDumb ? "Presentational" : "Smart"} standalone component (OnPush, signals API)`,
    },
    {
      path: `${base}/${kebabCase(options.name)}.component.html`,
      content: html,
      description: "Template — keep within one scroll; extract sub-sections if it grows",
    },
    {
      path: `${base}/${kebabCase(options.name)}.component.scss`,
      content: scss,
      description: "Component-scoped styles",
    },
  ];

  if (options.withStory) {
    const story = generateStory({
      componentName: className,
      selector,
      importPath: `./${kebabCase(options.name)}.component`,
    });
    story.path = `${base}/${kebabCase(options.name)}.stories.ts`;
    files.push(story);
  }

  return files;
}

export function generateFeature(options: {
  name: string;
  basePath: string;
  withStorybook?: boolean;
}): { files: GeneratedFile[]; structure: string } {
  const feature = kebabCase(options.name);
  const base = `${options.basePath.replace(/\\/g, "/").replace(/\/$/, "")}/${feature}`;
  const className = pascalCase(options.name);

  const files: GeneratedFile[] = [
    {
      path: `${base}/index.ts`,
      content: `/** Public API — export only what other features may import */\nexport * from './containers/${feature}.container';\n`,
      description: "Feature public barrel — keep narrow",
    },
    {
      path: `${base}/containers/${feature}.container.ts`,
      content: `import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-${feature}-container',
  standalone: true,
  imports: [RouterOutlet],
  template: \`<router-outlet />\`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ${className}Container {
  // Orchestration only: routing, facades, store — no presentational markup
}
`,
      description: "Smart container — orchestration and routing shell",
    },
    {
      path: `${base}/routes.ts`,
      content: `import { Routes } from '@angular/router';

export const ${feature.toUpperCase().replace(/-/g, "_")}_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./containers/${feature}.container').then((m) => m.${className}Container),
  },
];
`,
      description: "Lazy feature routes",
    },
    {
      path: `${base}/services/${feature}.facade.ts`,
      content: `import { Injectable, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ${className}Facade {
  // Coordinate feature use-cases; hide store/http from components
}
`,
      description: "Feature facade — single entry for data orchestration",
    },
    {
      path: `${base}/models/index.ts`,
      content: `/** Domain types for ${feature} — no UI or HTTP shapes mixed in */\n`,
      description: "Domain models",
    },
  ];

  if (options.withStorybook) {
    files.push(
      ...generateComponent({
        name: `${feature}-placeholder`,
        featurePath: `${base}/components`,
        presentational: true,
        withStory: true,
      })
    );
  }

  const structure = [
    `${feature}/`,
    "  index.ts              # public API",
    "  routes.ts             # lazy routes",
    "  containers/           # smart: orchestration",
    "  components/           # dumb: @Input/@Output or signals",
    "  services/             # feature-scoped facades",
    "  models/               # domain types",
    options.withStorybook ? "  *.stories.ts          # Storybook for shared UI" : "",
  ]
    .filter(Boolean)
    .join("\n");

  return { files, structure };
}

export function generateStory(options: {
  componentName: string;
  selector: string;
  importPath: string;
}): GeneratedFile {
  const storyName = `${options.componentName}Component`;
  const fileName = `${kebabCase(options.componentName.replace(/Component$/, ""))}.stories.ts`;

  return {
    path: fileName,
    content: `import type { Meta, StoryObj } from '@storybook/angular';
import { ${storyName} } from '${options.importPath}';

const meta: Meta<${storyName}> = {
  title: 'Components/${options.componentName}',
  component: ${storyName},
  tags: ['autodocs'],
  argTypes: {
    action: { action: 'action' },
  },
};

export default meta;
type Story = StoryObj<${storyName}>;

export const Default: Story = {
  args: {
    data: {},
  },
};
`,
    description: "Storybook story with autodocs and controls",
  };
}

export function planRefactor(options: {
  goal: string;
  filePath: string;
  violations: string[];
}): string {
  return [
    `# Refactor Plan: ${options.goal}`,
    "",
    `Target: \`${options.filePath}\``,
    "",
    "## Detected issues",
    ...options.violations.map((v) => `- ${v}`),
    "",
    "## Steps (apply in order)",
    "1. **Isolate presentation** — extract template sections into child components",
    "2. **Modernize API** — migrate to input()/output() and signals for local state",
    "3. **Change detection** — add OnPush; remove template function calls",
    "4. **RxJS hygiene** — replace manual subscribe with async pipe or takeUntilDestroyed",
    "5. **Verify** — run scan_violations again; add/update Storybook story if UI component",
    "6. **Apply** — call apply_changes with confirm:true after review",
    "",
    "## Rollback",
    "Commit before apply_changes; revert if tests or Storybook fail.",
  ].join("\n");
}
