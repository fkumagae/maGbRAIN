const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),createEngine=require('./neural-engine.cjs'),core=require('./core.js');
const engine=createEngine(),calibration=core.calibrate(engine);const runs=[];
const starts=[{x:-4,y:-3,heading:0},{x:-4,y:3,heading:0},{x:4,y:-4,heading:Math.PI/2},{x:0,y:4,heading:Math.PI},{x:-3,y:0,heading:-Math.PI/2},{x:3,y:3,heading:Math.PI/2}];
const sources=[{x:3,y:2},{x:-2,y:-2}];
for(const source of sources)for(const start of starts)for(const mode of ['neural','disconnected','no-readout','rules']){const run=core.trial(engine,calibration,start,source,mode,1200);runs.push(run);console.log(JSON.stringify({mode,start,source,reached:run.reached,steps:run.steps,finalDistance:run.finalDistance}));}
const provenance=Object.fromEntries(['core.js','engine-access.js','neural-engine.cjs','sensory-map.json'].map(name=>[name,crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,name),'utf8').replace(/\r\n/g,'\n')).digest('hex')]));
fs.writeFileSync(path.join(__dirname,'evaluation.json'),JSON.stringify({params:core.params,calibration,provenance,runs}));
console.log(Object.fromEntries(['neural','disconnected','no-readout','rules'].map(mode=>[mode,runs.filter(r=>r.mode===mode&&r.reached).length])));
