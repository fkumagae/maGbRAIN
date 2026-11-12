const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const read=n=>JSON.parse(fs.readFileSync(path.join(__dirname,n),'utf8').replace(/^\uFEFF/,''));
const e=read('evaluation.json'),m=read('sensory-map.json');
assert.equal(m.left.length,912);assert.equal(m.right.length,925);
const all=[...m.left,...m.right];assert.equal(new Set(all.map(n=>n.index)).size,1837);assert.ok(all.every(n=>typeof n.rootId==='string'));assert.ok(m.readout.every(n=>!all.some(s=>s.index===n.index)));
for(const [file,hash] of Object.entries(e.provenance))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,file),'utf8').replace(/\r\n/g,'\n')).digest('hex'),hash,file);
assert.equal(e.runs.length,48);const successes={};
for(const r of e.runs){assert.ok(Number.isFinite(r.finalDistance));assert.equal(r.steps,r.trace.length);assert.ok(r.trace.every(s=>[s.x,s.y,s.heading,...s.inputs,...s.voltage,s.motor.turn].every(Number.isFinite)));if(r.reached)successes[r.mode]=(successes[r.mode]||0)+1;}
assert.deepEqual(successes,{neural:11,disconnected:2,'no-readout':2,rules:12});
for(const r of e.runs.filter(r=>r.mode==='disconnected')){assert.ok(r.trace.every(s=>s.voltage.every(v=>v===0)&&s.motor.turn===0));const other=e.runs.find(s=>s.mode==='no-readout'&&JSON.stringify(s.start)===JSON.stringify(r.start)&&JSON.stringify(s.source)===JSON.stringify(r.source));assert.deepEqual(r.trace.map(s=>[s.x,s.y,s.heading]),other.trace.map(s=>[s.x,s.y,s.heading]));}
const result={passed:true,scenarios:12,runs:48,successes,checks:['input identities/disjointness','source hashes','finite trajectories','paired disconnected/no-readout movement']};fs.writeFileSync(path.join(__dirname,'test-results.json'),JSON.stringify(result,null,2)+'\n');console.log(result);
