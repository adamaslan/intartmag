import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const code=await readFile(new URL('../speech-support.js',import.meta.url),'utf8');
const {estimateSeconds,timeLabel,voiceError}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
test('time remaining is deterministic text/rate estimate, not exact duration',()=>{
 assert.equal(estimateSeconds('word '.repeat(180),1),60);
 assert.equal(estimateSeconds('word '.repeat(180),2.5),24);
 assert.equal(estimateSeconds('',1),0);
 assert.equal(timeLabel(61.1),'1:02');assert.equal(timeLabel(0),'0:00');
});
test('voice diagnostics preserve platform error and distinguish blocked/network output',()=>{
 assert(voiceError('network').includes('device voice'));
 assert(voiceError('not-allowed').includes('blocked'));
 assert(voiceError('synthesis-failed').includes('(synthesis-failed)'));
});
