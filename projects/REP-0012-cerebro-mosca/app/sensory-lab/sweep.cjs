const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const worker = fs.readFileSync(path.join(root, 'js/sim-worker.js'), 'utf8');
const compressed = fs.readFileSync(path.join(root, 'data/connectome.bin.gz'));
const buffer = zlib.gunzipSync(compressed);
const meta = JSON.parse(fs.readFileSync(path.join(root,'data/neuron_meta.json')));
let message;
const context = {performance,console,setTimeout:()=>0,self:{postMessage:m=>{if(m.type==='tick')message=m;}}};
vm.createContext(context);vm.runInContext(worker,context);
context.parseBinary(buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength));context.buildGroupStructures();
const groups = meta.groups.filter(g=>context.groupOffset[g.id+1]>context.groupOffset[g.id]);
const nameToID = Object.fromEntries(groups.map(g=>[g.name,g.id]));
const indices = group => Uint32Array.from({length:context.groupOffset[group+1]-context.groupOffset[group]},(_,i)=>i+context.groupOffset[group]);
const sources=[['visual-slow','VIS_R1R6'],['visual-fast','VIS_R1R6'],['light','VIS_R1R6'],['food','OLF_ORN_FOOD'],['vibration','MECH_JO'],['touch','MECH_BRISTLE'],['blank',null]];
function current(name,step){if(step<10||step>=70||name==='blank')return 0;const t=(step-10)*.1;if(name==='visual-slow'||name==='visual-fast'){const speed=name==='visual-fast'?4.4:1.1;const distance=Math.max(.8,5-speed*t);const rate= speed/(distance*distance+.25);return .02+.48*Math.min(1,rate/.3);}return name==='vibration'?(step%10<3?.3:0):.3;}
const runs=[];
for(const threshold of [1,.3,.1,.03,.01])for(const [condition,source] of sources){
 context.self.onmessage({data:{type:'reset'}});context.tickCount=0;context.self.onmessage({data:{type:'setParams',threshold,leakRate:.95,refractoryPeriod:3}});
 const inputID=source===null?-1:nameToID[source],ids=inputID<0?new Uint32Array():indices(inputID);
 const summary=groups.map(g=>({id:g.id,name:g.name,neurons:context.groupOffset[g.id+1]-context.groupOffset[g.id],spikes:0,peakPositiveV:0,minV:0,firstSpike:null}));const samples=[];
 for(let step=0;step<100;step++){
  const value=current(condition,step);context.self.onmessage({data:{type:'setStimulusState',indices:ids,intensities:new Float32Array(ids.length).fill(value)}});context.tick();
  const peaks=[],mins=[];
  for(const g of summary){let peak=0,min=0;for(let n=context.groupOffset[g.id];n<context.groupOffset[g.id+1];n++){peak=Math.max(peak,context.V[n]);min=Math.min(min,context.V[n]);}const count=message.groupSpikeCounts[g.id]||0;g.spikes+=count;g.peakPositiveV=Math.max(g.peakPositiveV,peak);g.minV=Math.min(g.minV,min);if(count&&g.firstSpike===null)g.firstSpike=step;peaks[g.id]=peak;mins[g.id]=min;}
  samples.push({step,current:value,spikes:Array.from(message.groupSpikeCounts),peakV:peaks,minV:mins});
 }
 runs.push({threshold,condition,source,summary,samples});
 console.log(JSON.stringify({threshold,condition,downstream:summary.filter(g=>g.id!==inputID&&g.spikes).map(g=>[g.name,g.spikes]),GNG:summary.find(g=>g.name==='GNG_DESC')}));
}
fs.writeFileSync(path.join(__dirname,'sweep.json'),JSON.stringify({version:1,workerSHA256:crypto.createHash('sha256').update(worker).digest('hex'),connectomeSHA256:crypto.createHash('sha256').update(compressed).digest('hex'),groups,protocol:{steps:100,inputStarts:10,inputEnds:70,dtNominal:.1,thresholds:[1,.3,.1,.03,.01],leak:.95,refractory:3,note:'Visual profiles share duration and saturate at minimum distance; fixed-sensor diagnostic, not biological calibration. Voltage measured after threshold/reset.'},runs}));
