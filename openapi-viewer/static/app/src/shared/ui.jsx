// Small shared UI parts in Atlassian's visual style (system font, Atlassian colours).
import React from 'react';

export const styles = {
  box: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontSize: 14,
         color: '#172b4d', padding: 16, border: '1px solid #dfe1e6', borderRadius: 4, background: '#fafbfc' },
  error: { borderColor: '#ffbdad', background: '#ffebe6' },
  title: { fontWeight: 600, marginBottom: 4 },
  warning: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontSize: 13,
             color: '#172b4d', background: '#fffae6', border: '1px solid #ffe380', borderRadius: 4,
             padding: '8px 12px', margin: '0 0 8px' },
};

export function Message({ title, children, error }) {
  return (
    <div role={error ? 'alert' : 'status'} style={{ ...styles.box, ...(error ? styles.error : {}) }}>
      {title && <div style={styles.title}>{title}</div>}
      <div>{children}</div>
    </div>
  );
}
