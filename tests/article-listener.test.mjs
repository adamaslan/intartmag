import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
// Load the browser ESM without adding a package or changing module settings.
let code = await readFile(new URL('../article-listener.js', import.meta.url), 'utf8');
const support = await readFile(new URL('../speech-support.js',import.meta.url),'utf8');
code=code.replace("'./speech-support.js'",JSON.stringify('data:text/javascript;base64,'+Buffer.from(support).toString('base64')));
const { chunkArticleText } = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
for (const text of ['', 'Short article.', 'Words and punctuation. '.repeat(1000), 'x'.repeat(1500), 'Unicode café 日本語 👋 '.repeat(300), 'x'.repeat(219) + '👋' + 'y'.repeat(220)]) {
  test('chunking preserves text of length ' + text.length, () => {
    const chunks = chunkArticleText(text);
    assert.equal(chunks.join(''), text);
    assert(chunks.every(part => part.length > 0 && part.length <= 220));
    assert(chunks.every(part => !/[\uD800-\uDBFF]$/.test(part)));
    assert(chunks.every(part => !/^[\uDC00-\uDFFF]/.test(part)));
  });
}
