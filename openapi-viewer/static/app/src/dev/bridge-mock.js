// Stand-in for @forge/bridge in local development: a fake Confluence page with sample attachments.
const FILES = [
  { id: 'att1', title: 'invoice-api.yaml', fileSize: 3000, version: { number: 3, createdAt: '2026-10-14T10:00:00Z' } },
  { id: 'att2', title: 'legacy-swagger.json', fileSize: 900, version: { number: 1, createdAt: '2026-10-01T10:00:00Z' } },
  { id: 'att3', title: 'broken.yaml', fileSize: 20, version: { number: 1, createdAt: '2026-09-01T10:00:00Z' } },
  { id: 'att5', title: 'on-unpublished-page.yaml', fileSize: 100, version: { number: 1, createdAt: '2026-08-01T10:00:00Z' } },
  { id: 'att4', title: 'readme.txt', fileSize: 20, version: { number: 1, createdAt: '2026-09-01T10:00:00Z' } },
];
const SAMPLE = { att1: 'invoice-api.yaml', att2: 'legacy-swagger.json', att3: 'broken.yaml' };

function savedConfig() {
  try { return JSON.parse(localStorage.getItem('openapi-viewer-config') || '{}'); } catch { return {}; }
}

export const view = {
  async getContext() {
    return { extension: { type: 'macro', content: { id: '42', type: 'page' }, config: savedConfig() } };
  },
  async submit({ config }) {
    localStorage.setItem('openapi-viewer-config', JSON.stringify(config));
    window.parent.postMessage({ type: 'config-saved', config }, '*');
    document.body.insertAdjacentHTML('beforeend', '<p id="saved" style="font:14px sans-serif;color:#216e4e;padding:0 20px">Saved (local test). Reload the viewer.</p>');
  },
  async close() { document.body.insertAdjacentHTML('beforeend', '<p id="closed">Closed</p>'); },
};

export async function requestConfluence(path) {
  await new Promise((r) => setTimeout(r, 150));
  const list = path.match(/\/wiki\/api\/v2\/pages\/[^/]+\/attachments/);
  if (list) return new Response(JSON.stringify({ results: FILES, _links: {} }), { status: 200 });
  // att5 behaves like a file on a page that was never published: download 404, page itself only a draft
  if (/\/wiki\/api\/v2\/pages\/[^/?]+$/.test(path)) {
    const draft = (savedConfig().attachmentId === 'att5') || window.__draftPage;
    return new Response(JSON.stringify({ id: '42', status: draft ? 'draft' : 'current' }), { status: 200 });
  }
  const dl = path.match(/attachment\/([^/]+)\/download/);
  if (dl) {
    const name = SAMPLE[dl[1]];
    if (!name) { window.__draftPage = dl[1] === 'att5'; return new Response('not found', { status: 404 }); }
    return fetch(`/dev/samples/${name}`);
  }
  return new Response('not found', { status: 404 });
}
