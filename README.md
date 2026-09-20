# @mestuka/rjsf-visual-builder

A drag-and-drop **visual builder component** for
[react-jsonschema-form (RJSF)](https://github.com/rjsf-team/react-jsonschema-form). Drop it into
any React app to let users construct a JSON Schema + `uiSchema` by dragging fields onto a canvas,
nesting objects/arrays/`oneOf`/`anyOf` branches, and editing each field's properties in an
inspector panel — with a live RJSF preview alongside.

This repository publishes a single npm package (`@mestuka/rjsf-visual-builder`) and also contains a local
demo app (`src/demo`) used to develop and manually test the component. Only `src/lib` is published.
The library injects its styles automatically when imported; an explicit
`@mestuka/rjsf-visual-builder/style.css` import is also available for applications that prefer
managing stylesheets themselves.

The builder opens in **Visual** mode by default and includes a **Code** tab with an editable
`{ schema, uiSchema, formData }` JSON document beside a live RJSF form preview. Code changes are
applied explicitly with the **Apply changes** button; invalid JSON leaves the current visual
document and rendered form unchanged.
Visual panels are collapsible and reorderable, and open panels can be resized horizontally by
dragging the separators between them.

## Install

```bash
pnpm add @mestuka/rjsf-visual-builder @rjsf/core @rjsf/utils @rjsf/validator-ajv8
```

`react`, `react-dom`, and the `@rjsf/*` packages are peer dependencies — install whichever
versions your app already uses.

## Usage

```tsx
import { RjsfFormBuilder } from '@mestuka/rjsf-visual-builder'
import '@mestuka/rjsf-visual-builder/style.css'

function EditFormPage() {
  return (
    <RjsfFormBuilder
      schema={existingSchema}
      uiSchema={existingUiSchema}
      formData={existingFormData}
    />
  )
}
```

### Props

| Prop                       | Type                                              | Description                                                                                                    |
| --------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `schema`                    | `RJSFSchema` (optional)                            | Initial JSON Schema to load into the builder. Defaults to an empty object schema when omitted or undefined.       |
| `uiSchema`                  | `UiSchema` (optional)                              | Initial RJSF uiSchema. Defaults to `{}`.                                                                          |
| `formData`                  | `unknown` (optional)                                | Initial sample data shown in the live preview.                                                                    |
| `onChange`                  | `(document: BuilderDocument) => void` (optional)    | Called after the builder mounts and whenever the edited schema, uiSchema, or preview form data changes. Use this to track dirty state or provide the current document to host-owned Save and Download controls. |
| `onPreviewSubmit`           | `(formData: unknown) => void` (optional)            | Called when the embedded live-preview form is submitted (separate from Save).                                     |
| `onPreviewValidationError`  | `() => void` (optional)                             | Called when the live-preview form fails RJSF validation on submit.                                                |
| `widgets`                   | `RegistryWidgetsType` (optional)                    | Custom RJSF widgets, keyed by the name referenced via `ui:widget`. Passed through to the live preview's `<Form>`, and offered as extra choices in the Inspector's Widget picker for string/number/integer/boolean fields. |
| `fields`                    | `RegistryFieldsType` (optional)                     | Custom RJSF field components, keyed by the name referenced via `ui:field`. Passed through to the live preview's `<Form>`, and offered in the Inspector's Field component picker (available for any selected field). |
| `templates`                 | `Partial<TemplatesType>` (optional)                 | Custom RJSF templates (e.g. `FieldTemplate`, `ArrayFieldTemplate`), passed straight through to the live preview's `<Form>`. |
| `className`                 | `string` (optional)                                 | Additional CSS classes applied to the builder's root element. Use this for host layout or custom styling; the builder's built-in classes are preserved. |
| `style`                     | `CSSProperties` (optional, custom properties allowed) | Inline styles for the component's root element — the easiest way to override the `--rvb-*` theme variables for a single instance. See [Theming](#theming). |

The component does not render Save or Download controls. The host application owns those
controls and can use its own state or callbacks to persist/export the current document.
The component never shows toasts or notifications itself.

`onChange` receives the complete `{ schema, uiSchema, formData }` document. It is called once
with the initial document after mount and again whenever any part of the document changes, making
it suitable for tracking whether the builder has unsaved changes.

`RegistryWidgetsType`, `RegistryFieldsType`, and `TemplatesType` are re-exported from
`rjsf-visual-builder` for convenience (they're just the `@rjsf/utils` types):

```tsx
import { RjsfFormBuilder, type RegistryWidgetsType, type RegistryFieldsType } from 'rjsf-visual-builder'

const widgets: RegistryWidgetsType = { color: ColorWidget }
const fields: RegistryFieldsType = { highlighted: HighlightedField }

<RjsfFormBuilder schema={schema} widgets={widgets} fields={fields} />
```

### State model

`RjsfFormBuilder` manages its editing state internally, seeded once from the `schema`/`uiSchema`/
`formData` props on first render. Changing those props on a later render does **not** reset the
builder — to load a different schema, remount the component with a different `key`:

```tsx
<RjsfFormBuilder key={formId} schema={schema} />
```

### Theming

Every color/radius the component uses is a CSS custom property, scoped under the component's own
`.rvb-root` wrapper class (not `:root`), so nothing leaks into or is affected by your app's global
styles. All of it is designed to be easy to override from the host app:

- **Zero-specificity defaults** — the variables ship inside `:where(.rvb-root)`, which has *zero*
  CSS specificity. A completely ordinary rule in your own stylesheet, loaded in any order, will
  win over the library's defaults with no `!important` needed:

  ```css
  /* your-app.css */
  .rvb-root {
    --rvb-primary: #2563eb;
    --rvb-radius: 0.25rem;
  }
  ```

- **Per-instance overrides** via the `style` prop — useful when different builder instances in the
  same app need different themes:

  ```tsx
  <RjsfFormBuilder schema={schema} style={{ '--rvb-primary': '#2563eb' }} />
  ```

- **Dark mode** — following the common shadcn/ui convention, add a `.dark` class to any ancestor
  element (e.g. `<html class="dark">`, toggled by your own theme switcher) and the component picks
  up its built-in dark palette automatically. `.rvb-root.dark` also works if you'd rather scope it
  to the component itself.

- **`className`/`style` passthrough** — both props land on the component's root element, so you
  can also reach it with a plain CSS selector (e.g. `.my-wrapper .rvb-root`) if you'd prefer that
  over `:where`-based overrides.

Available custom properties (all optional to override — any you don't set keep their default):

| Variable                        | Purpose                                  |
| -------------------------------- | ------------------------------------------ |
| `--rvb-radius`                   | Base corner radius (buttons, inputs, cards) |
| `--rvb-background` / `--rvb-foreground` | Page-level background/text color     |
| `--rvb-card` / `--rvb-card-foreground`  | Panel backgrounds (Inspector, canvas, preview) |
| `--rvb-popover` / `--rvb-popover-foreground` | Dropdown/select menu surfaces    |
| `--rvb-primary` / `--rvb-primary-foreground` | Submit button and active states |
| `--rvb-secondary` / `--rvb-secondary-foreground` | Secondary buttons/badges       |
| `--rvb-muted` / `--rvb-muted-foreground` | Placeholder/help text, subtle backgrounds |
| `--rvb-accent` / `--rvb-accent-foreground` | Hover/selected states                  |
| `--rvb-destructive`               | Delete buttons, validation error text     |
| `--rvb-border` / `--rvb-input`    | Borders and form control outlines         |
| `--rvb-ring`                      | Focus ring color                          |

The live RJSF preview (plain HTML form controls styled by `rjsf-preview.css`) reads from the same
variables, so overriding them re-themes the whole component consistently — palette, canvas,
inspector, and preview alike. If you need to fully replace the preview's look (e.g. to match a
specific design system), pass your own `templates` prop instead of relying on the built-in
minimal styling.

## Tech stack

- **React + TypeScript**, built with **Vite** in library mode
- **@rjsf/core**, **@rjsf/utils**, **@rjsf/validator-ajv8** (peer deps) — the RJSF form engine
- **@dnd-kit** — drag-and-drop
- **Tailwind CSS v4 + shadcn/ui primitives** — bundled into the component; `style.css` ships only
  Tailwind's theme + utility layers (no global preflight/reset) with all CSS variables scoped
  under a `.rvb-root` wrapper class, so importing it won't clobber your app's global styles

## Repository structure

```
src/
  lib/                      # the published package — everything here ships to npm
    index.ts                 # public entry: RjsfFormBuilder, RjsfFormBuilderProps, BuilderDocument
    RjsfFormBuilder.tsx       # the exported component
    styles.css                # Tailwind theme/utilities + scoped CSS variables
    types.ts                  # BuilderDocument type
    visual/                   # framework-agnostic tree model (schema <-> tree conversion, reducer)
    components/               # FormPreviewPanel + the visual builder's internal UI pieces
    ui/                        # shadcn/ui primitives used by the component
  demo/                      # local playground only — never published
    App.tsx, main.tsx, Toolbar.tsx, presets/, storage.ts, export.ts
index.html                  # dev entry point, loads src/demo/main.tsx
vite.config.ts               # dev server / demo build config
vite.lib.config.ts           # library build config (produces dist/ for npm)
```

## Development

```bash
pnpm install
pnpm dev          # run the local demo app (imports the library from source)
pnpm build        # build the publishable library into dist/ (alias for build:lib)
pnpm build:lib    # same as above, explicit
pnpm build:demo   # type-check + build the demo app (not published)
pnpm test         # TypeScript test/type-check
pnpm lint         # oxlint
```

`pnpm dev` and `pnpm build:demo` use `vite.config.ts` and `index.html`/`src/demo`. `pnpm build:lib`
uses `vite.lib.config.ts` to bundle `src/lib` into `dist/index.js` (ESM), `dist/index.cjs.js`
(CJs), `dist/index.d.ts`, and `dist/style.css` for publishing.

## GitHub Pages

The workflow at [`.github/workflows/pages.yml`](./.github/workflows/pages.yml) runs on pull
requests and pushes to `main`. It installs dependencies with the frozen lockfile, runs the
TypeScript test/type-check and linter, builds both the npm library and demo, and deploys the demo
build to GitHub Pages after pushes or manual workflow runs. Pull requests run the checks and build
but do not deploy.

To enable the deployment for a repository, open **Settings → Pages** and set **Source** to
**GitHub Actions**. The Vite demo uses relative asset URLs so it works at the repository's
project-site URL (for example, `https://<owner>.github.io/<repository>/`).

## npm publishing

The workflow at [`.github/workflows/publish.yml`](./.github/workflows/publish.yml) publishes the
package when a semantic version tag matching `v*.*.*` is pushed, or when the workflow is started
manually. It runs the test/type-check, linter, library build, and `npm pack --dry-run` before
publishing. The package is published publicly from the `dist` directory described by the
`files` field in [package.json](./package.json).

This workflow uses npm trusted publishing through GitHub Actions OIDC; no `NPM_TOKEN` secret is
needed. On npmjs.com, open the package's **Settings → Trusted Publisher**, select **GitHub
Actions**, and configure:

- **Repository owner:** the GitHub user or organization that owns this repository
- **Repository name:** the GitHub repository name
- **Workflow filename:** `publish.yml`
- **Environment:** leave empty unless the workflow is configured with a GitHub environment

The GitHub Actions workflow must retain `id-token: write`, which allows npm to exchange the
short-lived GitHub OIDC identity for publish authorization. Then update the version and push a tag:

```bash
pnpm version patch
git push origin main --follow-tags
```

Trusted publishing automatically generates npm provenance. The scoped package is published as
`@mestuka/rjsf-visual-builder`. The npm account or organization must own the `mestuka` scope,
and subsequent tags must contain a new version. If npm requires the package to exist before a
trusted publisher can be configured, bootstrap the first version once with an interactive,
2FA-approved local publish, configure trusted publishing, and use OIDC for every later release.

## Demo app features

The demo (`src/demo`) is a thin harness for manually testing the component: a preset picker to
load different starting schemas, buttons to download the last-saved document as JSON or copy
a standalone React snippet, and a tiny `color` custom widget + `highlighted` custom field
(`src/demo/customWidgets.tsx`) passed in via the `widgets`/`fields` props to demonstrate that
consumers can bring their own RJSF widgets/fields. It uses `sonner` for toasts around
`onPreviewSubmit`/`onPreviewValidationError` purely to demonstrate that the library leaves
notifications to the host app — none of `src/demo` is part of the published package.

## Visual builder limitations

- Fields can be reordered within their own container (root, object, array item, or branch) but
  cannot be **dragged across containers** — delete and re-add as a workaround.
- Arrays support a single, homogeneous item schema (no per-index heterogeneous items).
- `oneOf`/`anyOf` are modeled as property-level polymorphism (one property whose value matches one
  of several branch schemas). Schemas built with the `dependencies` keyword, or other advanced
  keywords (`allOf`, `if`/`then`/`else`, `$ref`, `patternProperties`), aren't visually editable —
  they round-trip through the builder unchanged as a read-only "unsupported" field.
- Duplicate property names within the same container aren't detected; the last one wins when the
  schema is generated.
