import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
let code=await readFile(new URL('../listening-queue.js',import.meta.url),'utf8');
const support=await readFile(new URL('../speech-support.js',import.meta.url),'utf8');
code=code.replace("'./speech-support.js'",JSON.stringify('data:text/javascript;base64,'+Buffer.from(support).toString('base64')));
const {categoryQueue}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const manifest=JSON.parse(await readFile(new URL('../listening-index.json',import.meta.url),'utf8'));
test('site categories exactly preserve catalog-resolved source category membership and order',async()=>{
 const catalog=new Map(manifest.articles.map(a=>[a.path.split('/').at(-1),a.path]));
 assert.deepEqual(manifest.categories.map(c=>c.id),['art-fairs','museums','nyc','artists','international','culture']);
 for(const c of manifest.categories){
  const html=await readFile(new URL('..'+c.source_path,import.meta.url),'utf8');
  const paths=[...html.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(m=>m[1].split('/').at(-1).replace(/\.html$/,'').toLowerCase()).filter(b=>catalog.has(b)).map(b=>catalog.get(b));
  assert.deepEqual(c.article_paths,[...new Set(paths)],c.id);
  assert.deepEqual(categoryQueue(manifest,c.id).map(a=>a.path),c.article_paths,c.id);
 }
});
test('Museums has exactly four source-category articles and excludes the extra editorial theme entry',()=>{
 const queue=categoryQueue(manifest,'museums');assert.equal(queue.length,4);assert.equal(queue[0].path,'/pages/sarahszeandnewmoma');assert(!queue.some(a=>a.path==='/pages/inthebight'));
 assert(manifest.articles.find(a=>a.path==='/pages/inthebight').themes.includes('Museums'),'editorial themes intentionally remain separate');
});
test('unknown categories and missing/duplicate/cross-origin category paths reject rather than silently becoming all articles',()=>{
 assert.throws(()=>categoryQueue(manifest,'invented'));
 for(const paths of [['/pages/absent'],['https://other.test/secret'],[manifest.articles[0].path,manifest.articles[0].path]])assert.throws(()=>categoryQueue({...manifest,categories:[{id:'test',label:'Test',source_path:'/pages/test.html',article_paths:paths}]},'test'));
 assert.equal(categoryQueue(manifest,'').length,41);
});
