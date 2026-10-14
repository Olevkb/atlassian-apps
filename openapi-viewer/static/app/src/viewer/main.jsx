// The macro on the page: loads the attached OpenAPI document and shows it with Redoc.
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { RedocStandalone } from 'redoc';
import { view } from '@forge/bridge';
import { attachmentText } from '../shared/confluence.js';
import { externalRefs, parseSpec, readOptions, redocOptions } from '../shared/spec.js';
import { Message, styles } from '../shared/ui.jsx';

function Viewer() {
  const [state, setState] = useState({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const context = await view.getContext();
        const ext = context.extension || {};
        const config = ext.config || {};
        const pageId = ext.content && ext.content.id;
        if (!config.attachmentId) {
          setState({ status: 'empty' });
          return;
        }
        const text = await attachmentText(pageId, config.attachmentId);
        const { spec } = parseSpec(text, config.attachmentName);
        if (!cancelled) {
          setState({ status: 'ready', spec, options: readOptions(config.options), refs: externalRefs(spec),
                     name: config.attachmentName });
        }
      } catch (err) {
        if (!cancelled) setState({ status: err.code === 'unpublished' ? 'unpublished' : 'error',
                                   message: err.message || String(err) });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (state.status === 'loading') return <Message>Loading API documentation…</Message>;
  if (state.status === 'empty') {
    return <Message title="No API file chosen">Edit this macro and choose a .json or .yaml file attached to this page.</Message>;
  }
  if (state.status === 'unpublished') {
    return <Message title="API documentation appears after publishing">{state.message} Publish the page to see it.</Message>;
  }
  if (state.status === 'error') return <Message title="The API documentation cannot be shown" error>{state.message}</Message>;

  const fixedHeight = state.options.height !== 'auto';
  return (
    <div style={fixedHeight ? { height: `${state.options.height}px`, overflow: 'auto' } : undefined}>
      {state.refs.length > 0 && (
        <div style={styles.warning}>
          This file refers to other files ({state.refs.join(', ')}). References to other files cannot be loaded;
          bundle the API into one file (for example with <code>redocly bundle</code>).
        </div>
      )}
      <RedocStandalone spec={state.spec} options={redocOptions(state.options)} />
    </div>
  );
}

createRoot(document.getElementById('root')).render(<Viewer />);
