import { describe as group, expect, it } from 'vitest';
import { DEFAULT_OPTIONS, describe, externalRefs, isSpecFileName, operations, parseSpec, readOptions, redocOptions,
  searchText, SEARCH_TEXT_MAX } from '../src/shared/spec.js';

const YAML = `openapi: 3.0.3
info:
  title: Invoice API
  version: 1.2.0
  description: |
    Create and send **invoices**. See [docs](https://example.org).
tags:
  - name: invoices
    description: Everything about invoices
paths:
  /invoices:
    get:
      summary: List invoices
      operationId: listInvoices
      tags: [invoices]
      responses: { '200': { description: ok } }
    post:
      summary: Create an invoice
      responses: { '201': { description: created } }
  /invoices/{id}:
    parameters: [{ name: id, in: path, required: true, schema: { type: string } }]
    delete:
      summary: Delete an invoice
      responses: { '204': { description: deleted } }
`;

group('file names', () => {
  it('accepts json and yaml', () => {
    expect(['a.json', 'b.yaml', 'c.YML', 'api.v2.json'].every(isSpecFileName)).toBe(true);
    expect(['a.txt', 'b.pdf', '', undefined, 'json'].some(isSpecFileName)).toBe(false);
  });
});

group('parseSpec', () => {
  it('reads OpenAPI 3 from YAML', () => {
    const { spec, kind, version } = parseSpec(YAML, 'api.yaml');
    expect(kind).toBe('openapi');
    expect(version).toBe('3.0.3');
    expect(spec.info.title).toBe('Invoice API');
  });

  it('reads Swagger 2.0 from JSON', () => {
    const r = parseSpec(JSON.stringify({ swagger: '2.0', info: { title: 'Old', version: '1' }, paths: {} }), 'x.json');
    expect([r.kind, r.version]).toEqual(['swagger', '2.0']);
  });

  it('reads JSON content in a file without extension', () => {
    expect(parseSpec('{"openapi":"3.1.0","info":{"title":"T","version":"1"},"paths":{}}').kind).toBe('openapi');
  });

  it('explains what is wrong', () => {
    expect(() => parseSpec('', 'a.yaml')).toThrow(/empty/);
    expect(() => parseSpec('{"openapi": ', 'a.json')).toThrow(/not valid JSON/);
    expect(() => parseSpec('a: [b', 'a.yaml')).toThrow(/not valid YAML/);
    expect(() => parseSpec('- a\n- b', 'a.yaml')).toThrow(/object at the top level/);
    expect(() => parseSpec('asyncapi: 2.6.0\ninfo: {title: x}', 'a.yaml')).toThrow(/AsyncAPI/);
    expect(() => parseSpec('openapi: 2.0\ninfo: {title: x}', 'a.yaml')).toThrow(/not an OpenAPI 3.x or Swagger 2.0/);
    expect(() => parseSpec('title: hello', 'a.yaml')).toThrow(/not an OpenAPI/);
  });
});

group('operations and search text', () => {
  const { spec } = parseSpec(YAML, 'api.yaml');

  it('lists every operation', () => {
    expect(operations(spec).map((o) => `${o.method} ${o.path}`)).toEqual(
      ['GET /invoices', 'POST /invoices', 'DELETE /invoices/{id}']);
  });

  it('describes the API', () => {
    expect(describe(spec)).toBe('Invoice API 1.2.0 · 3 endpoints');
  });

  it('builds plain search text', () => {
    const t = searchText(spec);
    expect(t).toContain('Invoice API');
    expect(t).toContain('version 1.2.0');
    expect(t).toContain('Create and send invoices. See docs.');
    expect(t).toContain('GET /invoices List invoices listInvoices');
    expect(t).toContain('invoices: Everything about invoices');
    expect(t).not.toMatch(/\*\*|\]\(/);                        // markdown removed
  });

  it('stays under the size limit', () => {
    const paths = {};
    for (let i = 0; i < 2000; i += 1) paths[`/resource/${i}`] = { get: { summary: `Get resource number ${i}` } };
    const t = searchText({ openapi: '3.0.0', info: { title: 'Big' }, paths });
    expect(t.length).toBeLessThanOrEqual(SEARCH_TEXT_MAX + 2);
    expect(t.endsWith('…')).toBe(true);
  });
});

group('external references', () => {
  it('finds refs to other files and urls, not local ones', () => {
    const spec = { paths: { '/a': { get: { responses: { 200: { $ref: '#/components/responses/Ok' } } } },
                            '/b': { $ref: 'paths/b.yaml' } },
                   components: { schemas: { X: { $ref: 'https://example.org/x.json#/X' } } } };
    expect(externalRefs(spec).sort()).toEqual(['https://example.org/x.json', 'paths/b.yaml']);
  });
});

group('options', () => {
  it('fills defaults and rejects bad values', () => {
    expect(readOptions('')).toEqual(DEFAULT_OPTIONS);
    expect(readOptions('not json')).toEqual(DEFAULT_OPTIONS);
    const o = readOptions(JSON.stringify({ expandResponses: 'x', height: '50', primaryColor: 'red', hideHostname: 1 }));
    expect([o.expandResponses, o.height, o.primaryColor, o.hideHostname]).toEqual(['success', 'auto', '#0c66e4', true]);
    expect(readOptions({ height: '900' }).height).toBe('900');
  });

  it('maps to Redoc options', () => {
    const r = redocOptions(readOptions({ expandResponses: 'all', sortTags: true }));
    expect(r.expandResponses).toBe('all');
    expect(r.sortTagsAlphabetically).toBe(true);
    expect(r.disableSearch).toBe(true);
    expect(redocOptions(readOptions({ expandResponses: 'none' })).expandResponses).toBe('');
  });
});
