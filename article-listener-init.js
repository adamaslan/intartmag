import { mountArticleListener } from '/article-listener.js';
function init() {
  // Whole article page is needed for legacy prose outside <article> tags.
  mountArticleListener(document.body);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
