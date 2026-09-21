Kendo React theme overrides

```css
/* kendo-theme-override.css */
.rvb-root {
  --rvb-radius: var(--kendo-border-radius-md, 0.25rem);
  --rvb-font-family: var(--kendo-font-family, inherit);

  --rvb-background: var(--kendo-color-app-surface, #fff);
  --rvb-foreground: var(--kendo-color-on-app-surface, #3d3d3d);

  --rvb-card: var(--kendo-color-surface, #fff);
  --rvb-card-foreground: var(--kendo-color-on-app-surface, #3d3d3d);

  --rvb-popover: var(--kendo-color-surface-alt, #fff);
  --rvb-popover-foreground: var(--kendo-color-on-app-surface, #3d3d3d);

  --rvb-primary: var(--kendo-color-primary, #ff6358);
  --rvb-primary-foreground: var(--kendo-color-on-primary, #fff);

  --rvb-secondary: var(--kendo-color-base-subtle, #f5f5f5);
  --rvb-secondary-foreground: var(--kendo-color-base-on-subtle, #3d3d3d);

  --rvb-muted: var(--kendo-color-base-subtle, #f5f5f5);
  --rvb-muted-foreground: var(--kendo-color-subtle, #737373);

  --rvb-accent: var(--kendo-color-base-subtle-hover, #e6e6e6);
  --rvb-accent-foreground: var(--kendo-color-on-base, #3d3d3d);

  --rvb-destructive: var(--kendo-color-error, #f31700);

  --rvb-border: var(--kendo-color-border, #d6d6d6);
  --rvb-input: var(--kendo-color-border, #d6d6d6);
  --rvb-ring: var(--kendo-color-primary, #ff6358);
}

```