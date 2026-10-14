// Talking to Confluence from the browser through Forge's requestConfluence (stays inside Atlassian).
import { requestConfluence } from '@forge/bridge';
import { isSpecFileName } from './spec.js';

/**
 * Error with a code the UI can act on:
 * - 'unpublished': Confluence does not hand out attachments of pages that were never published (tested 14-10-2026)
 * - 'not-found': the attachment is gone, or the user may not see it
 * - 'failed': anything else
 */
export class ConfluenceError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

async function json(path) {
  const res = await requestConfluence(path, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new ConfluenceError(res.status === 403 || res.status === 404 ? 'not-found' : 'failed',
      res.status === 403 || res.status === 404
        ? 'The page or attachment is not available (deleted, or you have no permission to see it).'
        : `Confluence answered with status ${res.status}.`);
  }
  return res.json();
}

/** Attachments of a page that can hold an OpenAPI document (.json, .yaml, .yml), newest first. */
export async function specAttachments(pageId) {
  const out = [];
  let path = `/wiki/api/v2/pages/${encodeURIComponent(pageId)}/attachments?limit=250`;
  for (let i = 0; path && i < 20; i += 1) {
    const data = await json(path);
    for (const a of data.results || []) {
      if (isSpecFileName(a.title)) {
        out.push({ id: a.id, name: a.title, size: a.fileSize, version: a.version && a.version.number,
                   modified: a.version && a.version.createdAt });
      }
    }
    const next = data._links && data._links.next;
    path = next ? `/wiki${next.replace(/^\/wiki/, '')}` : null;
  }
  return out.sort((x, y) => String(y.modified || '').localeCompare(String(x.modified || '')));
}

/** True if the page has a published version (a brand-new page in the editor is only a draft). */
async function isPublished(pageId) {
  const res = await requestConfluence(`/wiki/api/v2/pages/${encodeURIComponent(pageId)}`,
                                      { headers: { Accept: 'application/json' } });
  if (!res.ok) return false;
  const page = await res.json();
  return page.status === 'current' || page.status === 'archived';
}

/** Text of the latest version of an attachment. */
export async function attachmentText(pageId, attachmentId) {
  // Download endpoint of the classic API: always returns the newest version of the attachment
  const res = await requestConfluence(
    `/wiki/rest/api/content/${encodeURIComponent(pageId)}/child/attachment/${encodeURIComponent(attachmentId)}/download`);
  if (res.ok) return res.text();
  if (res.status === 404 && !(await isPublished(pageId))) {
    throw new ConfluenceError('unpublished',
      'Confluence shares attached files with apps only after the page has been published once.');
  }
  throw new ConfluenceError(res.status === 404 || res.status === 403 ? 'not-found' : 'failed',
    res.status === 404 || res.status === 403
      ? 'The attachment was not found. It may have been deleted, moved to another page, or you may not have permission to see it.'
      : `Downloading the attachment failed (status ${res.status}).`);
}
