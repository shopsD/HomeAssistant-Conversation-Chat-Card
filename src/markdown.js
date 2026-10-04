import { safe } from './utils.js';

const markdown = globalThis.markdownit({ html: false, linkify: true, breaks: true });

markdown.renderer.rules.image = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  const source = token.attrGet('src') || '';
  const resolved = typeof env?.resolveImageUrl === 'function' ? env.resolveImageUrl(source) : null;
  const alt = self.renderInlineAsText(token.children || [], options, env);
  if (!resolved) {
    return `<span class="md-image-blocked">[${markdown.utils.escapeHtml(alt || 'Image blocked')}]</span>`;
  }
  const title = token.attrGet('title');
  return [
    '<img src="', markdown.utils.escapeHtml(resolved),
    '" alt="', markdown.utils.escapeHtml(alt),
    '" loading="lazy" decoding="async" referrerpolicy="no-referrer"',
    title ? ` title="${markdown.utils.escapeHtml(title)}"` : '',
    '>',
  ].join('');
};

const defaultLink = markdown.renderer.rules.link_open || ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));
markdown.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  tokens[idx].attrSet('target', '_blank');
  tokens[idx].attrSet('rel', 'noopener noreferrer');
  return defaultLink(tokens, idx, options, env, self);
};

export function renderMarkdown(source, resolveImageUrl) {
  return markdown.render(safe(source), { resolveImageUrl });
}
