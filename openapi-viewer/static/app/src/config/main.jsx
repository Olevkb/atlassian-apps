// Macro configuration: choose the attached OpenAPI file and the display options.
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { view } from '@forge/bridge';
import { attachmentText, specAttachments } from '../shared/confluence.js';
import { describe, externalRefs, parseSpec, readOptions, searchText } from '../shared/spec.js';
import { Message, styles } from '../shared/ui.jsx';

const s = {
  page: { fontFamily: styles.box.fontFamily, fontSize: 14, color: '#172b4d', padding: 20, maxWidth: 720 },
  label: { display: 'block', fontWeight: 600, fontSize: 12, color: '#44546f', margin: '16px 0 4px' },
  input: { width: '100%', padding: '6px 8px', fontSize: 14, border: '2px solid #dfe1e6', borderRadius: 3,
           boxSizing: 'border-box', background: '#fff' },
  row: { display: 'flex', gap: 8, alignItems: 'center', margin: '6px 0' },
  hint: { fontSize: 12, color: '#626f86', marginTop: 4 },
  note: { fontSize: 13, color: '#172b4d', background: '#e9f2ff', border: '1px solid #cce0ff', borderRadius: 3,
          padding: '8px 10px', marginTop: 8 },
  ok: { fontSize: 13, color: '#216e4e', marginTop: 6 },
  bad: { fontSize: 13, color: '#ae2e24', marginTop: 6 },
  buttons: { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 24 },
  primary: { background: '#0c66e4', color: '#fff', border: 0, borderRadius: 3, padding: '8px 14px', fontWeight: 500,
             cursor: 'pointer' },
  secondary: { background: 'transparent', color: '#44546f', border: 0, padding: '8px 14px', cursor: 'pointer' },
};

function Config() {
  const [pageId, setPageId] = useState(null);
  const [files, setFiles] = useState(null);           // null = loading
  const [error, setError] = useState(null);
  const [chosen, setChosen] = useState('');
  const [check, setCheck] = useState(null);           // { ok, text, spec }
  const [options, setOptions] = useState(readOptions(''));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const context = await view.getContext();
        const ext = context.extension || {};
        const id = ext.content && ext.content.id;
        setPageId(id);
        const config = ext.config || {};
        setOptions(readOptions(config.options));
        const list = id ? await specAttachments(id) : [];
        setFiles(list);
        const keep = list.find((f) => f.id === config.attachmentId);
        setChosen(keep ? keep.id : (list[0] && list[0].id) || '');
      } catch (err) {
        setError(err.message || String(err));
        setFiles([]);
      }
    })();
  }, []);

  // Check the chosen file as soon as it is selected, so problems show up before saving
  useEffect(() => {
    if (!chosen || !pageId) { setCheck(null); return; }
    let cancelled = false;
    setCheck({ ok: null, text: 'Checking the file…' });
    (async () => {
      try {
        const file = files.find((f) => f.id === chosen);
        const { spec } = parseSpec(await attachmentText(pageId, chosen), file && file.name);
        const refs = externalRefs(spec);
        const text = describe(spec) + (refs.length ? ` — note: refers to other files (${refs.join(', ')})` : '');
        if (!cancelled) setCheck({ ok: true, text, spec });
      } catch (err) {
        if (cancelled) return;
        if (err.code === 'unpublished') {
          // New page: the file cannot be read yet, but the choice can be saved and works after publishing
          setCheck({ ok: null, unpublished: true, text: 'This page has not been published yet. Confluence shares '
            + 'attached files with apps only after publishing, so the file is checked then. You can save now; the '
            + 'documentation appears when you publish. To make the endpoints searchable, open these settings once '
            + 'more after publishing and click Save.' });
        } else {
          setCheck({ ok: false, text: err.message || String(err) });
        }
      }
    })();
    return () => { cancelled = true; };
  }, [chosen, pageId, files]);

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setOptions((o) => ({ ...o, [key]: value }));
  };

  const save = async () => {
    const file = files.find((f) => f.id === chosen);
    setSaving(true);
    await view.submit({
      config: {
        attachmentId: chosen,
        attachmentName: file ? file.name : '',
        options: JSON.stringify(readOptions(options)),
        searchText: check && check.spec ? searchText(check.spec) : '',
      },
    });
  };

  if (files === null) return <div style={s.page}><Message>Looking for API files on this page…</Message></div>;

  return (
    <div style={s.page}>
      {error && <Message title="Attachments could not be loaded" error>{error}</Message>}

      <label style={s.label} htmlFor="file">API file attached to this page</label>
      {files.length === 0 ? (
        <Message title="No API file on this page yet">
          Attach your OpenAPI or Swagger file (.json, .yaml or .yml) to this page, then open these settings again.
          When you upload a new version of the file, the page shows it automatically.
        </Message>
      ) : (
        <>
          <select id="file" style={s.input} value={chosen} onChange={(e) => setChosen(e.target.value)}>
            {files.map((f) => (
              <option key={f.id} value={f.id}>{f.name}{f.version ? ` (version ${f.version})` : ''}</option>
            ))}
          </select>
          {check && <div style={check.ok === false ? s.bad : check.ok ? s.ok : check.unpublished ? s.note : s.hint}>
            {check.text}</div>}
        </>
      )}

      <label style={s.label} htmlFor="expand">Expand responses</label>
      <select id="expand" style={s.input} value={options.expandResponses} onChange={set('expandResponses')}>
        <option value="success">Successful responses (2xx)</option>
        <option value="all">All responses</option>
        <option value="none">None</option>
      </select>

      <label style={s.label} htmlFor="height">Height</label>
      <select id="height" style={s.input} value={options.height} onChange={set('height')}>
        <option value="auto">Full length (scroll with the page)</option>
        <option value="600">600 px with its own scroll bar</option>
        <option value="800">800 px with its own scroll bar</option>
        <option value="1200">1200 px with its own scroll bar</option>
      </select>

      <label style={s.label} htmlFor="color">Accent colour</label>
      <input id="color" type="color" value={options.primaryColor} onChange={set('primaryColor')}
             style={{ ...s.input, width: 60, padding: 2, height: 32 }} />

      <div style={{ marginTop: 16 }}>
        <label style={s.row}><input type="checkbox" checked={options.hideDownloadButton} onChange={set('hideDownloadButton')} />
          Hide the "Download" button</label>
        <label style={s.row}><input type="checkbox" checked={options.hideHostname} onChange={set('hideHostname')} />
          Hide server addresses in endpoint URLs</label>
        <label style={s.row}><input type="checkbox" checked={options.sortTags} onChange={set('sortTags')} />
          Sort groups (tags) alphabetically</label>
      </div>
      <div style={s.hint}>The API summary (title and endpoints) is added to Confluence search, so people can find
        this page by endpoint name. Nothing leaves Atlassian.</div>

      <div style={s.buttons}>
        <button type="button" style={s.secondary} onClick={() => view.close()}>Cancel</button>
        <button type="button" style={{ ...s.primary, opacity: !chosen || saving || (check && check.ok === false) ? 0.5 : 1 }}
                disabled={!chosen || saving || (check && check.ok === false)} onClick={save}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<Config />);
