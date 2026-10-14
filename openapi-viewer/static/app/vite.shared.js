// Build step shared by the Vite configurations.

// Redoc shows "API docs by Redocly" with a logo loaded from cdn.redoc.ly. That would be a request outside Atlassian
// (and is blocked by Forge anyway). Replace the logo with an empty inline image; the text credit stays.
const LOGO = 'https://cdn.redoc.ly/redoc/logo-mini.svg';
const EMPTY = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/%3E";

export function noExternalLogo() {
  return {
    name: 'no-external-logo',
    enforce: 'pre',
    transform(code, id) {
      if (id.includes('redoc') && code.includes(LOGO)) {
        return { code: code.split(LOGO).join(EMPTY), map: null };
      }
      return null;
    },
  };
}
