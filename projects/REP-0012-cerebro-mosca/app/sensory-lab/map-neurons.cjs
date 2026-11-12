// Run the original worker equations; record individual model indices and edge-ablation controls.
const fs = require('node:fs'), path = require('node:path'), zlib = require('node:zlib'), crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const worker = fs.readFileSync(path.join(root, 'js/sim-worker.js'), 'utf8');
const compressed = fs.readFileSync(path.join(root, 'data/connectome.bin.gz'));
const bytes = zlib.gunzipSync(compressed);
const meta = JSON.parse(fs.readFileSync(path.join(root, 'data/neuron_meta.json')));
const context = {performance, console, setTimeout:()=>0, self:{postMessage:()=>{}}, binary:bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset+bytes.byteLength), meta};
const execute = new Function('self', 'performance', 'console', 'setTimeout', 'binary', 'meta', worker + `
parseBinary(binary); buildGroupStructures();
var intactWeights = values.slice();
var cases = [['blank',null],['visual','VIS_R1R6'],['food','OLF_ORN_FOOD'],['vibration','MECH_JO'],['touch','MECH_BRISTLE']];
var runs = [];
for (var limit of [1,.3]) for(var ablated of [false,true]) for (var testCase of cases) {
 self.onmessage({data:{type:'reset'}}); tickCount=0;
 self.onmessage({data:{type:'setParams',threshold:limit,leakRate:.95,refractoryPeriod:3}});
 values.set(intactWeights); if(ablated) values.fill(0);
 var inputGroup = meta.groups.find(g=>g.name===testCase[1])?.id ?? -1;
 var inputIndices = inputGroup<0 ? new Uint32Array() : Uint32Array.from({length:groupOffset[inputGroup+1]-groupOffset[inputGroup]},(_,i)=>i+groupOffset[inputGroup]);
 var counts=new Uint32Array(N), peaks=new Float32Array(N), first=new Int32Array(N).fill(-1);
 for(var step=0;step<100;step++) {
  var current=step>=10&&step<70 ? .3 : 0;
  self.onmessage({data:{type:'setStimulusState',indices:inputIndices,intensities:new Float32Array(inputIndices.length).fill(current)}});
  tick();
  for(var i=0;i<N;i++) {counts[i]+=fired[i];if(fired[i]&&first[i]<0)first[i]=step;peaks[i]=Math.max(peaks[i],V[i]);}
 }
 var candidates=[];var downstreamSpikes=0;var directSpikes=0;
 for(var i=0;i<N;i++) {
  if(groupId[i]===inputGroup){directSpikes+=counts[i];continue;}
  downstreamSpikes+=counts[i];
  if(counts[i]||peaks[i]>=.1)candidates.push({sortedIndex:i,group:meta.groups[groupId[i]].name,spikes:counts[i],peakV:peaks[i],firstSpike:first[i]<0?null:first[i]});
 }
 candidates.sort((a,b)=>b.spikes-a.spikes||b.peakV-a.peakV);
 runs.push({condition:testCase[0],source:testCase[1],threshold:limit,ablated,directSpikes,downstreamSpikes,candidates});
 console.log(JSON.stringify({condition:testCase[0],threshold:limit,ablated,downstreamSpikes,candidates:candidates.length}));
}
return runs;
`);
context.runs = execute(context.self, performance, console, context.setTimeout, context.binary, meta);
const result={version:1,workerSHA256:crypto.createHash('sha256').update(worker).digest('hex'),connectomeSHA256:crypto.createHash('sha256').update(compressed).digest('hex'),protocol:{steps:100,start:10,end:70,current:.3,thresholds:[1,.3],ablation:'All synaptic weights set to zero; input injection preserved.',indexMeaning:'Worker group-sorted index, valid only for the hashed connectome and worker. Not a FlyWire root_id.',candidateCriterion:'Any downstream spike or post-update potential >= 0.1. Deterministic model; these are not biological replications.',vibration:'Constant injection in this mapping run; pulsed in sweep.cjs.'},runs:context.runs};
for(const r of result.runs.filter(r=>r.ablated||r.condition==='blank'))if(r.downstreamSpikes||r.candidates.length)throw Error('Negative control failed');
fs.writeFileSync(path.join(__dirname,'neuron-map.json'),JSON.stringify(result,null,2));
