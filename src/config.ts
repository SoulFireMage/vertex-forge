// Public configuration. The Skapi project ID is not a secret: it identifies the
// project, and what each user may read or write is enforced by Skapi itself.
// Copied from the parent apps; change it if you want a separate project.

export const SKAPI_PROJECT_ID = '5GJ5SJePWQUiq0jvYr-2ZVgaOLUqOhnse3Hcl8M4d';

// Prefixed (spec §11) so this app can share a Skapi project with the Rhetoric and
// Systems Forges without any of them reading each other's data.
export const TABLES = {
  telemetry: 'vx_telemetry',
} as const;

export const APP_TITLE = 'The Vertex Forge';
