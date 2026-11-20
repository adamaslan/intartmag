import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
let code=await readFile(new URL('../listening-queue.js',import.meta.url),'utf8');
const support=await readFile(new URL('../speech-support.js',import.meta.url),'utf8');
code=code.replace("'./speech-support.js'",JSON.stringify('data:text/javascript;base64,'+Buffer.from(support).toString('base64')));
const {chunkText,publicPath}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const manifest=JSON.parse(await readFile(new URL('../listening-index.json',import.meta.url),'utf8'));
test('public catalog has unique same-origin paths, titles and nonempty theme membership',()=>{
 const seen=new Set();
 for(const a of manifest.articles){assert(a.title.trim());assert(a.themes.length);assert(!seen.has(a.path));seen.add(a.path);publicPath(a.path,'https://example.test');}
});
test('remote/protocol-relative URLs, queries and fragments are rejected',()=>{
 for(const p of ['//evil.test/x','https://evil.test/x','/x?q=1','/x#part'])assert.throws(()=>publicPath(p,'https://example.test'));
});
test('chunking keeps all text and whole Unicode characters',()=>{
 for(const text of ['','A short article','Text 👋 日本語. '.repeat(500),'x'.repeat(219)+'👋'+'y'.repeat(500)]){
  const parts=chunkText(text);assert.equal(parts.join(''),text);assert(parts.every(p=>p.length<=220));assert(parts.every(p=>!/[\uD800-\uDBFF]$/.test(p)&&!/^[\uDC00-\uDFFF]/.test(p)));
 }
});

test('catalog paths resolve to local editorial HTML',async()=>{
 const files=await readdir(new URL('../pages/',import.meta.url));
 for(const a of manifest.articles){const name=a.path.slice('/pages/'.length)+'.html';const source=files.find(f=>f.toLowerCase()===name.toLowerCase());assert(source,a.path);const html=await readFile(new URL('../pages/'+source,import.meta.url),'utf8');assert(html.includes('<body'),a.path);}
});

test('Netlify pretty-URL catalog paths use canonical lowercase spelling',()=>{
 for(const a of manifest.articles)assert.equal(a.path,a.path.toLowerCase(),a.path);
});

test('featured excerpt is excluded while the two full legacy wine articles remain',()=>{
 const paths=new Set(manifest.articles.map(a=>a.path));
 assert(!paths.has('/pages/tastythings'));
 assert(paths.has('/pages/naturalwine'));assert(paths.has('/pages/3valuereds'));
});

test('legacy wine articles close navigation before full editorial prose',async()=>{
 for(const name of ['naturalwine','3valuereds']){
  const html=await readFile(new URL('../pages/'+name+'.html',import.meta.url),'utf8');
  assert(html.includes('</div>\n<article data-listening-article>'));
  assert(html.includes('</article>\n<p data-no-read><strong>Related on I.A.M.:</strong>'));
 }
});
