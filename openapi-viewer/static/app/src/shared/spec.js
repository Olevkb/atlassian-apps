// Reading and checking OpenAPI / Swagger documents. Pure functions, no Forge or browser APIs, so they can be tested.
import yaml from 'js-yaml';

export const MAX_BYTES = 15 * 1024 * 1024;           // larger files make the browser slow; we refuse them politely
export const SEARCH_TEXT_MAX = 4000;                  // characters stored in the indexed macro parameter
const SPEC_EXTENSIONS = /\.(json|ya?ml)$/i;

/** True for attachment names that can hold an OpenAPI document. */
export function isSpecFileName(name) {
  return SPEC_EXTENSIONS.test(name || '');
}

/**
 * Parse the text of a JSON or YAML file and check that it is an OpenAPI 3.x or Swagger 2.0 document.
 * Returns { spec, kind, version } or throws an Error with a message for the user.
 */
export function parseSpec(text, name = '') {
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('The file is empty.');
  }
  if (new Blob([text]).size > MAX_BYTES) {
    throw new Error('The file is larger than 15 MB. Split the API into smaller files.');
  }
  let spec;
  const looksJson = /\.json$/i.test(name) || /^\s*[{[]/.test(text);
  try {
    spec = looksJson ? JSON.parse(text) : yaml.load(text, { json: true });
  } catch (err) {
    if (looksJson) {
      try {
        spec = yaml.load(text, { json: true });   // YAML is a superset of JSON; gives a better position in errors
      } catch {
        throw new Error(`This is not valid JSON: ${shortError(err)}`);
      }
    } else {
      throw new Error(`This is not valid YAML: ${shortError(err)}`);
    }
  }
  if (!spec || typeof spec !== 'object' || Array.isArray(spec)) {
    throw new Error('The file does not contain an OpenAPI document (expected an object at the top level).');
  }
  if (typeof spec.openapi === 'string' && /^3\./.test(spec.openapi)) {
    return { spec, kind: 'openapi', version: spec.openapi };
  }
  if (String(spec.swagger) === '2.0') {
    return { spec, kind: 'swagger', version: '2.0' };
  }
  if (spec.asyncapi) {
    throw new Error('This is an AsyncAPI document. Only OpenAPI 3.x and Swagger 2.0 are supported.');
  }
  throw new Error('This is not an OpenAPI 3.x or Swagger 2.0 document (no "openapi" or "swagger" field found).');
}

function shortError(err) {
  return String(err && err.message ? err.message : err).split('\n')[0].slice(0, 160);
}

const METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];

/** List of operations: { method, path, summary, operationId, tags }. */
export function operations(spec) {
  const out = [];
  for (const [path, item] of Object.entries(spec.paths || {})) {
    if (!item || typeof item !== 'object') continue;
    for (const method of METHODS) {
      const op = item[method];
      if (op && typeof op === 'object') {
        out.push({ method: method.toUpperCase(), path, summary: op.summary || '', operationId: op.operationId || '',
                   tags: Array.isArray(op.tags) ? op.tags : [] });
      }
    }
  }
  return out;
}

/**
 * Plain text that Confluence indexes for search: title, version, description and every endpoint with its summary.
 * Kept under SEARCH_TEXT_MAX characters; the most useful parts come first.
 */
export function searchText(spec) {
  const info = spec.info || {};
  const parts = [info.title, info.version && `version ${info.version}`, stripMarkdown(info.description)];
  for (const tag of spec.tags || []) {
    if (tag && tag.name) parts.push(`${tag.name}${tag.description ? ': ' + stripMarkdown(tag.description) : ''}`);
  }
  for (const op of operations(spec)) {
    parts.push([op.method, op.path, op.summary, op.operationId].filter(Boolean).join(' '));
  }
  let text = parts.filter(Boolean).join('\n').replace(/[ \t]+/g, ' ').trim();
  if (text.length > SEARCH_TEXT_MAX) {
    text = text.slice(0, SEARCH_TEXT_MAX).replace(/\s+\S*$/, '') + ' …';
  }
  return text;
}

function stripMarkdown(text) {
  if (!text) return '';
  return String(text)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#*_`>|]/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .replace(/ ([.,;:!?])/g, '$1')
    .trim()
    .slice(0, 600);
}

/** Short description for the macro placeholder and the configuration screen. */
export function describe(spec) {
  const info = spec.info || {};
  const n = operations(spec).length;
  return `${info.title || 'Untitled API'}${info.version ? ' ' + info.version : ''} · ${n} endpoint${n === 1 ? '' : 's'}`;
}

/** External $refs (other files or URLs) cannot be resolved inside Atlassian; list them so we can warn the user. */
export function externalRefs(spec, limit = 5) {
  const found = new Set();
  const stack = [spec];
  while (stack.length && found.size < limit) {
    const node = stack.pop();
    if (Array.isArray(node)) {
      stack.push(...node);
    } else if (node && typeof node === 'object') {
      for (const [key, value] of Object.entries(node)) {
        if (key === '$ref' && typeof value === 'string' && !value.startsWith('#')) {
          found.add(value.split('#')[0]);
        } else if (value && typeof value === 'object') {
          stack.push(value);
        }
      }
    }
  }
  return [...found];
}

/** Viewer options with defaults; stored as one JSON string in the macro configuration. */
export const DEFAULT_OPTIONS = {
  expandResponses: 'success',     // 'none' | 'success' (2xx) | 'all'
  hideDownloadButton: false,
  hideHostname: false,
  sortTags: false,
  height: 'auto',                 // 'auto' or a number of pixels as text, e.g. '800'
  primaryColor: '#0c66e4',
};

export function readOptions(raw) {
  let parsed = {};
  if (raw && typeof raw === 'object') parsed = raw;
  else if (typeof raw === 'string' && raw.trim()) {
    try { parsed = JSON.parse(raw); } catch { parsed = {}; }
  }
  const o = { ...DEFAULT_OPTIONS, ...parsed };
  if (!['none', 'success', 'all'].includes(o.expandResponses)) o.expandResponses = DEFAULT_OPTIONS.expandResponses;
  if (o.height !== 'auto' && !(Number(o.height) >= 200 && Number(o.height) <= 5000)) o.height = 'auto';
  if (!/^#[0-9a-f]{6}$/i.test(o.primaryColor)) o.primaryColor = DEFAULT_OPTIONS.primaryColor;
  o.hideDownloadButton = Boolean(o.hideDownloadButton);
  o.hideHostname = Boolean(o.hideHostname);
  o.sortTags = Boolean(o.sortTags);
  return o;
}

// Atlassian's system font stack, so the documentation looks like the rest of the Confluence page
const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';

/** Redoc options for our viewer options. Search uses a web worker that Forge's sandbox does not allow: off. */
export function redocOptions(o) {
  return {
    expandResponses: o.expandResponses === 'all' ? 'all' : o.expandResponses === 'success' ? '200,201,202,204' : '',
    hideDownloadButton: o.hideDownloadButton,
    hideHostname: o.hideHostname,
    sortTagsAlphabetically: o.sortTags,
    disableSearch: true,
    nativeScrollbars: true,
    hideLoading: true,
    scrollYOffset: 0,
    theme: {
      colors: { primary: { main: o.primaryColor } },
      typography: { fontFamily: FONT, fontSize: '14px', headings: { fontFamily: FONT, fontWeight: '600' },
                    code: { fontFamily: MONO } },
      sidebar: { fontFamily: FONT },
    },
  };
}
