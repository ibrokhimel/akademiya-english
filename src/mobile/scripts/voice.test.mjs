import assert from 'node:assert/strict';
import test from 'node:test';
import { amplifyVoiceWav } from '../src/lib/wav.ts';

function wav(samples) {
  const bytes=new Uint8Array(44+samples.length*2),v=new DataView(bytes.buffer);
  for(const [at,text] of [[0,'RIFF'],[8,'WAVE'],[12,'fmt '],[36,'data']])
    for(let i=0;i<4;i++)bytes[at+i]=text.charCodeAt(i);
  v.setUint32(4,bytes.length-8,true);v.setUint32(16,16,true);v.setUint16(20,1,true);
  v.setUint16(22,1,true);v.setUint32(24,16000,true);v.setUint32(28,32000,true);
  v.setUint16(32,2,true);v.setUint16(34,16,true);v.setUint32(40,samples.length*2,true);
  samples.forEach((sample,i)=>v.setInt16(44+i*2,sample,true));return bytes;
}
test('quiet recordings play louder without modifying original samples or WAV headers',()=>{
  const original=wav([0,3000,-3000,1500,-1500]),before=original.slice(),result=amplifyVoiceWav(original);
  assert.ok(result.gain>9 && result.gain<10);
  const samples=new DataView(result.bytes.buffer);
  assert.ok(samples.getInt16(46,true)>27000);
  assert.ok(samples.getInt16(48,true)<-27000);
  assert.deepEqual(original,before);
  assert.deepEqual(result.bytes.slice(0,44),original.slice(0,44));
});
test('voice gain is bounded and loud audio is neither amplified nor clipped',()=>{
  assert.equal(amplifyVoiceWav(wav([1,-1])).gain,16);
  const loud=wav([32767,-32768]);assert.equal(amplifyVoiceWav(loud).gain,1);
  assert.deepEqual(amplifyVoiceWav(loud).bytes,loud);
  assert.equal(amplifyVoiceWav(wav([0,0])).silent,true);
});
test('other formats and malformed recordings are not treated as PCM',()=>{
  assert.equal(amplifyVoiceWav(new Uint8Array([1,2,3])),null);
  const broken=wav([100]);new DataView(broken.buffer).setUint32(40,9000,true);
  assert.equal(amplifyVoiceWav(broken),null);
  const encoded=wav([100]);new DataView(encoded.buffer).setUint16(20,3,true);
  assert.equal(amplifyVoiceWav(encoded),null);
});
