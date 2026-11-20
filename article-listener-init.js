import { mountArticleListener } from '/article-listener.js';
export function canonicalArticlePath(path) { return path.toLowerCase().replace(/\.html$/, ''); }
async function init() {
  // Category indexes must lead to their article queue, never narrate their link list.
  try {
    const response = await fetch('/listening-index.json', {credentials:'omit', redirect:'error'});
    if (!response.ok) return;
    const manifest = await response.json(), path = canonicalArticlePath(location.pathname);
    const category = (manifest.categories || []).find(c => canonicalArticlePath(c.source_path) === path);
    if (category || path === '/pages/guide') {
      const panel = document.createElement('p'); panel.dataset.noRead = ''; panel.dataset.categoryListening = '';
      const link = document.createElement('a');
      link.href = category ? '/listen.html?category=' + encodeURIComponent(category.id) : '/listen.html';
      link.textContent = category ? `Listen to ${category.label}: ${category.article_paths.length} articles in category order` : 'Listen by category or play all articles';
      link.style.cssText = 'display:inline-block;padding:12px;border:1px solid currentColor;border-radius:6px'; panel.append(link);
      const heading = document.querySelector('.post-header'); if (heading) heading.after(panel); else document.body.prepend(panel);
      return;
    }
    if (manifest.articles.some(a => canonicalArticlePath(a.path) === path)) mountArticleListener(document.body);
  } catch { /* No guessed article/category player when the catalog is unavailable. */ }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
