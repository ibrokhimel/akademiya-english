import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { serviceURL, releaseSettings } from '../src/lib/releasePolicy.ts';
import { reminderPlan, reminderDestination, localDay, validTime } from '../src/lib/reminderPlan.ts';
const require = createRequire(import.meta.url);
const { applyReleaseSigning } = require('../plugins/withAndroidReleaseSigning.js');

test('public services require HTTPS and reject local addresses and URL credentials', () => {
  for (const value of ['', 'http://api.example.com', 'https://localhost', 'https://127.0.0.1', 'https://10.0.0.2', 'https://192.168.1.2', 'https://172.16.2.3', 'https://[::1]', 'https://user:pass@example.com', 'https://example.com?token=x', 'not-a-url'])
    assert.equal(serviceURL(value), '', value);
  assert.equal(serviceURL(' https://api.example.com/v1/ '), 'https://api.example.com/v1');
  assert.equal(serviceURL('http://127.0.0.1:8090', true), 'http://127.0.0.1:8090');
});
test('a public upgrade keeps learner data while neutralizing test server/date/unlock settings', () => {
  const old = {server:'http://127.0.0.1:8090',speechServer:'http://127.0.0.1:8795',openAll:true,dayShift:34,needAccount:true,name:'Learner',reminder:'01:30',sound:true};
  const next = releaseSettings(old, '', '', false);
  assert.deepEqual(next, {...old,server:'',speechServer:'',openAll:false,dayShift:0,needAccount:false});
  assert.equal(old.dayShift,34);
  assert.equal(releaseSettings(old,'https://api.example.com','',false).server,'https://api.example.com');
  assert.equal(releaseSettings(old,'','',true).dayShift,34);
});
const input = () => ({time:'19:00',now:new Date(2026,9,21,12),days:365,completed:[],copies:['A','B','C']});
test('one future invitation per day is prepared for a year, with varied copy', () => {
  const plan=reminderPlan(input());
  assert.equal(plan.length,365);
  assert.equal(new Set(plan.map(p=>p.identifier)).size,365);
  assert.ok(plan.every(p=>p.at>input().now && p.at.getHours()===19 && p.at.getMinutes()===0));
  assert.equal(new Set(plan.map(p=>p.body)).size,3);
});
test('permission/time-off plans cannot schedule and past times are skipped', () => {
  for(const time of [null,'24:00','19:99','1:30','']) assert.equal(reminderPlan({...input(),time}).length,0);
  assert.ok(validTime('00:00')); assert.ok(validTime('23:59'));
  assert.equal(reminderPlan({...input(),now:new Date(2026,9,21,20)})[0].identifier,'practice-2026-10-22');
});
test('finishing a lesson suppresses that day without suppressing tomorrow', () => {
  const plan=reminderPlan({...input(),completed:[new Date(2026,9,21,10).toISOString()]});
  assert.equal(plan.length,364); assert.equal(plan[0].identifier,'practice-2026-10-22');
});
test('saved-lesson and streak claims do not leak into future reminders', () => {
  const plan=reminderPlan({...input(),resume:'l1',streak:6});
  assert.equal(plan[0].url,'/lesson/l1');
  assert.equal(plan[1].url,'/(tabs)');
  assert.ok(!plan[1].body.includes('6'));
  assert.equal(reminderPlan({...input(),checkpoint:'c1'})[0].url,'/lesson/c1');
});
test('calendar scheduling stays at the selected local time through daylight-saving changes', () => {
  const old=process.env.TZ; process.env.TZ='America/New_York';
  try {
    const plan=reminderPlan({...input(),now:new Date(2026,9,31,12),days:4});
    assert.ok(plan.every(p=>p.at.getHours()===19));
    assert.equal(plan[1].at-plan[0].at,25*3600000);
    assert.equal(localDay(plan[1].at),'2026-11-01');
  } finally { if(old===undefined) delete process.env.TZ; else process.env.TZ=old; }
});
test('notification taps accept only existing lesson IDs and never external or unknown paths', () => {
  for(const value of [null,'https://example.com','/settings','/lesson/l999','/lesson/l1?reset=1','/lesson/../../settings'])
    assert.equal(reminderDestination(value,['l1','c1']),'/(tabs)');
  assert.equal(reminderDestination('/lesson/l1',['l1']),'/lesson/l1');
});
test('the signing plugin is idempotent and leaves debug signing only behind an explicit test switch', () => {
  const original=`android {\n    signingConfigs {\n        debug {\n        }\n    }\n    buildTypes {\n        debug {\n            signingConfig signingConfigs.debug\n        }\n        release {\n            signingConfig signingConfigs.debug\n        }\n    }\n}`;
  const once=applyReleaseSigning(original);
  assert.equal(applyReleaseSigning(once),once);
  assert.match(once,/release \{\s+signingConfig \(akademiyaTestSigner \?/);
  assert.match(once,/System.getenv\('AKADEMIYA_STORE_PASSWORD'\)/);
  assert.throws(()=>applyReleaseSigning('a changed template'));
});
test('public builds fail before Gradle if their key is missing or internal fixtures are enabled', () => {
  for(const extra of [{AKADEMIYA_SIGNING_CONFIG:'does-not-exist.json'}, {EXPO_PUBLIC_VISUAL_AUDIT:'1'}]) {
    const run=spawnSync(process.execPath,['scripts/build-android.js','release','arm64-v8a'],{cwd:new URL('..',import.meta.url),env:{...process.env,AKADEMIYA_TEST_SIGNING:'0',EXPO_PUBLIC_INTERNAL_BUILD:'0',EXPO_PUBLIC_VISUAL_AUDIT:'0',...extra},encoding:'utf8'});
    assert.notEqual(run.status,0);
    assert.match(run.stderr,/never fall back|cannot contain/);
  }
});
