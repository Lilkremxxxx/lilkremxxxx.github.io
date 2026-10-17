// Blog content blocks: normalisation + HTML rendering, shared by the public reader and the admin preview.

export const BLOCK_TYPES = ['paragraph', 'heading', 'image', 'code', 'quote', 'link', 'table'];

export function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function escapeAttribute(text) {
  return escapeHtml(text).replace(/`/g, '&#96;');
}

// Only http(s), mailto, tel and site-relative URLs reach href/src.
export function safeUrl(url, fallback = '#') {
  const value = String(url ?? '').trim();
  if (!value) return fallback;
  if (/^(https?:|mailto:|tel:)/i.test(value) || value.startsWith('/') || value.startsWith('#')) return value;
  return fallback;
}

export function normalizeBlockData(type, data = {}) {
  const value = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  if (type === 'heading') {
    return { level: Math.min(4, Math.max(1, Number(value.level || 2))), text: String(value.text || '') };
  }
  if (type === 'image') {
    return { url: String(value.url || ''), alt: String(value.alt || ''), caption: String(value.caption || '') };
  }
  if (type === 'code') {
    return { language: String(value.language || 'python'), code: String(value.code || '') };
  }
  if (type === 'quote') {
    return { text: String(value.text || ''), cite: String(value.cite || '') };
  }
  if (type === 'link') {
    return { label: String(value.label || ''), url: String(value.url || '') };
  }
  if (type === 'table') {
    return {
      title: String(value.title || ''),
      headers: Array.isArray(value.headers) ? value.headers.map((item) => String(item)) : [],
      rows: Array.isArray(value.rows) ? value.rows.map((row) => (Array.isArray(row) ? row.map((item) => String(item)) : [])) : []
    };
  }
  return { text: String(value.text || '') };
}

export function sanitizeBlocks(blocks) {
  return (Array.isArray(blocks) ? blocks : [])
    .map((block, index) => {
      if (!block || typeof block !== 'object') return null;
      const type = String(block.type || '').trim();
      if (!type) return null;
      return { id: String(block.id || `block-${index + 1}`), type, data: normalizeBlockData(type, block.data) };
    })
    .filter(Boolean);
}

function decodeCodeText(text) {
  return String(text || '').replace(/\\n/g, '\n').replace(/\\t/g, '\t');
}

function highlightCode(text, language = '') {
  const escaped = escapeHtml(decodeCodeText(text));
  const lang = language.toLowerCase();
  if (lang.includes('cpp') || lang.includes('c++')) {
    return escaped
      .replace(/\b(string|cout|cerr|endl|vector|map|unordered_map|const|auto|return|class|struct|if|else|for|while|switch|case|break|continue|void|int|double|float|bool|true|false)\b/g, '<span class="tok-key">$1</span>')
      .replace(/&quot;([^&]*?)&quot;/g, '<span class="tok-str">&quot;$1&quot;</span>')
      .replace(/\/\/.*$/gm, '<span class="tok-com">$&</span>');
  }
  if (lang.includes('bash') || lang.includes('shell')) {
    return escaped
      .replace(/\b(python|pip|cd|git|curl|psql|node|npm|yarn|make|cmake|docker)\b/g, '<span class="tok-key">$1</span>')
      .replace(/&#39;([^&]*?)&#39;/g, '<span class="tok-str">&#39;$1&#39;</span>')
      .replace(/(^|\n)(\s*)([-]{1,2}[a-zA-Z0-9_-]+)/g, '$1$2<span class="tok-flag">$3</span>');
  }
  if (lang.includes('python')) {
    return escaped
      .replace(/\b(def|class|import|from|return|if|elif|else|for|while|with|as|try|except|True|False|None|print)\b/g, '<span class="tok-key">$1</span>')
      .replace(/&quot;([^&]*?)&quot;/g, '<span class="tok-str">&quot;$1&quot;</span>')
      .replace(/&#39;([^&]*?)&#39;/g, '<span class="tok-str">&#39;$1&#39;</span>')
      .replace(/(?<!&)#(?!\d+;).*$/gm, '<span class="tok-com">$&</span>');
  }
  return escaped;
}

// Code samples are only shown under method/implementation-style sections (owner's editorial rule).
export function isCodeVisibleInSection(sectionLabel = '', language = '') {
  const text = String(sectionLabel || '').toLowerCase();
  const lang = String(language || '').toLowerCase();
  const sectionMatch = /(method|methodology|materials|preprocessing|pipeline|deployment|experiment|results|implementation|model|feature|data|analysis)/.test(text);
  const languageMatch = /(python|bash|shell|cpp|c\+\+)/.test(lang);
  return sectionMatch && languageMatch;
}

function blockToHtml(block, figureIndex) {
  const data = block.data;
  const id = escapeAttribute(block.id);
  if (block.type === 'heading') {
    const level = Math.max(2, Math.min(4, Number(data.level || 2)));
    return `<h${level} id="${id}" class="blk-heading blk-h${level}">${escapeHtml(data.text)}</h${level}>`;
  }
  if (block.type === 'image') {
    const caption = data.caption ? `Figure ${figureIndex}. ${data.caption}` : `Figure ${figureIndex}.`;
    return `
      <figure id="${id}" class="blk-figure">
        <img src="${escapeAttribute(safeUrl(data.url, ''))}" alt="${escapeAttribute(data.alt)}" loading="lazy" decoding="async">
        <figcaption>${escapeHtml(caption)}</figcaption>
      </figure>`;
  }
  if (block.type === 'code') {
    const lines = decodeCodeText(data.code).split('\n');
    return `
      <figure id="${id}" class="blk-code">
        <div class="blk-code__bar"><span class="blk-code__lang">${escapeHtml(data.language || 'code')}</span></div>
        <div class="blk-code__body">
          <div class="blk-code__gutter" aria-hidden="true">${lines.map((_, index) => `<span>${index + 1}</span>`).join('')}</div>
          <pre><code>${highlightCode(data.code, data.language)}</code></pre>
        </div>
      </figure>`;
  }
  if (block.type === 'quote') {
    return `
      <blockquote id="${id}" class="blk-quote">
        <p>${escapeHtml(data.text)}</p>
        ${data.cite ? `<footer>${escapeHtml(data.cite)}</footer>` : ''}
      </blockquote>`;
  }
  if (block.type === 'link') {
    return `
      <p class="blk-link-row"><a id="${id}" class="blk-link" href="${escapeAttribute(safeUrl(data.url))}" target="_blank" rel="noopener noreferrer">
        <span>${escapeHtml(data.label || data.url || 'Link')}</span><span class="icon" aria-hidden="true">north_east</span>
      </a></p>`;
  }
  if (block.type === 'table') {
    return `
      <figure id="${id}" class="blk-table">
        ${data.title ? `<figcaption>${escapeHtml(data.title)}</figcaption>` : ''}
        <div class="blk-table__scroll">
          <table>
            <thead><tr>${data.headers.map((header) => `<th scope="col">${escapeHtml(header)}</th>`).join('')}</tr></thead>
            <tbody>${data.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody>
          </table>
        </div>
      </figure>`;
  }
  return `<p id="${id}" class="blk-paragraph">${escapeHtml(data.text)}</p>`;
}

export function blocksToHtml(blocks, { emptyText = 'No content yet.' } = {}) {
  let figureCounter = 0;
  let activeSection = '';
  const html = sanitizeBlocks(blocks)
    .map((block) => {
      if (block.type === 'heading') activeSection = block.data.text || activeSection;
      if (block.type === 'code' && !isCodeVisibleInSection(activeSection, block.data.language)) return '';
      const figureIndex = block.type === 'image' ? ++figureCounter : figureCounter;
      return blockToHtml(block, figureIndex);
    })
    .join('');
  return html || `<p class="blk-empty">${escapeHtml(emptyText)}</p>`;
}

export function blocksToMarkdown(blocks) {
  return sanitizeBlocks(blocks)
    .map(({ type, data }) => {
      if (type === 'heading') return `${'#'.repeat(data.level)} ${data.text}`.trim();
      if (type === 'image') return `![${data.alt}](${data.url})${data.caption ? `\n\n_${data.caption}_` : ''}`;
      if (type === 'code') return `\`\`\`${data.language}\n${data.code}\n\`\`\``;
      if (type === 'quote') return `> ${data.text.replace(/\n/g, '\n> ')}${data.cite ? `\n>\n> — ${data.cite}` : ''}`;
      if (type === 'link') return `[${data.label || data.url || 'link'}](${data.url || '#'})`;
      if (type === 'table') return `${data.title || 'Table'}\n${data.headers.join(' | ')}\n${data.rows.map((row) => row.join(' | ')).join('\n')}`;
      return data.text;
    })
    .join('\n\n');
}

export function buildToc(blocks, postTitle = '') {
  const title = String(postTitle).trim().toLowerCase();
  return sanitizeBlocks(blocks)
    .filter((block) => block.type === 'heading' && block.data.level === 2 && block.data.text.trim() && block.data.text.trim().toLowerCase() !== title)
    .map((block) => ({ id: block.id, label: block.data.text }));
}

export function estimateReadingMinutes(blocks) {
  const words = blocksToMarkdown(blocks).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
