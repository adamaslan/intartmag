// Usage: node scripts/check-listening-catalog.mjs https://your-preview.example
// Audit the queue's actual no-redirect contract, not a follow-redirect HTTP check.
import {readFile} from 'node:fs/promises';
const origin=new URL(process.argv[2]);
if(!['http:','https:'].includes(origin.protocol)||origin.username||origin.password||origin.pathname!=='/'||origin.search||origin.hash)throw new Error('Pass an HTTP(S) origin without credentials, path, query or fragment');
const manifest=JSON.parse(await readFile(new URL('../listening-index.json',import.meta.url),'utf8'));
const results=await Promise.all(manifest.articles.map(async a=>{
 const url=new URL(a.path,origin);
 if(url.origin!==origin.origin)throw new Error('Cross-origin article');
 try{
  const r=await fetch(url,{redirect:'manual',credentials:'omit',signal:AbortSignal.timeout(15000)});
  const type=r.headers.get('content-type')||'';
  const html=await r.text();
  return {path:a.path,status:r.status,location:r.headers.get('location'),type,pass:r.status===200&&type.includes('text/html')&&html.includes('<body')};
 }catch(error){return {path:a.path,pass:false,error:String(error)}}
}));
console.log(JSON.stringify({origin:origin.origin,total:results.length,passed:results.filter(r=>r.pass).length,results},null,2));
if(results.some(r=>!r.pass))process.exitCode=1;
