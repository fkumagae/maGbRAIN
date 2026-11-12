#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),zlib=require('node:zlib');
const ROOT=path.resolve(__dirname,'../..');
const sha=data=>crypto.createHash('sha256').update(data).digest('hex');
const readJSON=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
const canonical=text=>text.replace(/\r\n/g,'\n');
function keys(object,allowed){if(!object||typeof object!=='object'||Array.isArray(object))throw Error('Expected object');for(const k of Object.keys(object))if(!allowed.includes(k))throw Error('Unknown field: '+k);}
function number(value,min,max,name,integer=false){if(!Number.isFinite(value)||value<min||value>max||(integer&&!Number.isInteger(value)))throw Error('Invalid '+name);}
function validate(config,meta){
 keys(config,['version','name','parameters','watch','cases']);if(config.version!==1||typeof config.name!=='string')throw Error('Invalid version/name');
 keys(config.parameters,['threshold','leak','refractory']);number(config.parameters.threshold,.01,2,'threshold');number(config.parameters.leak,0,1,'leak');number(config.parameters.refractory,0,100,'refractory',true);
 const indices=(items,name)=>{if(!Array.isArray(items)||items.length>256)throw Error('Invalid '+name);items.forEach(i=>number(i,0,meta.neuron_count-1,name,true));};
 indices(config.watch,'watch');if(!Array.isArray(config.cases)||!config.cases.length||config.cases.length>10000)throw Error('Invalid cases');
 const names=new Set();let steps=0;
 for(const c of config.cases){keys(c,['id','steps','stimuli','disconnectAll','disconnectOutgoing']);if(typeof c.id!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(c.id)||names.has(c.id))throw Error('Invalid/duplicate case id');names.add(c.id);number(c.steps,1,100000,'steps',true);steps+=c.steps;
  if(c.disconnectAll!==undefined&&typeof c.disconnectAll!=='boolean')throw Error('disconnectAll must be boolean');indices(c.disconnectOutgoing||[],'disconnectOutgoing');
  if(!Array.isArray(c.stimuli)||c.stimuli.length>32)throw Error('Invalid stimuli');
  for(const s of c.stimuli){keys(s,['group','start','end','current','profile','period','on']);const group=meta.groups.find(g=>g.name===s.group);if(!group||!group.neuron_count)throw Error('Unknown/empty group: '+s.group);number(s.start,0,c.steps-1,'start',true);number(s.end,s.start+1,c.steps,'end',true);number(s.current,0,.5,'current');if(!['constant','ramp','pulse'].includes(s.profile))throw Error('Invalid profile');if(s.profile==='pulse'){number(s.period,1,c.steps,'period',true);number(s.on,1,s.period,'on',true);}else if(s.period!==undefined||s.on!==undefined)throw Error('Pulse fields require pulse profile');}
 }
 if(steps>10000000)throw Error('Campaign exceeds 10 million steps; split configuration');return config;
}
function createEngine(source,buffer){
 const self={postMessage:()=>{}};
 // Only trusted local worker source is compiled; JSON configuration is never evaluated.
 return new Function('self','performance','setTimeout','binary',source+`
 parseBinary(binary);buildGroupStructures();
 var originalWeights=values.slice(), counts,peaks;
 return {
 reset:function(p,c){self.onmessage({data:{type:'reset'}});tickCount=0;self.onmessage({data:{type:'setParams',threshold:p.threshold,leakRate:p.leak,refractoryPeriod:p.refractory}});values.set(originalWeights);if(c.disconnectAll)values.fill(0);for(var i of c.disconnectOutgoing||[])values.fill(0,rowPtr[i],rowPtr[i+1]);counts=new Uint32Array(N);peaks=new Float32Array(N);},
 step:function(inputs,watch){var ids=[],currents=[];for(var input of inputs)for(var n=groupOffset[input.group];n<groupOffset[input.group+1];n++){ids.push(n);currents.push(input.current);}self.onmessage({data:{type:'setStimulusState',indices:new Uint32Array(ids),intensities:new Float32Array(currents)}});tick();var spikes=new Array(numGroups).fill(0);for(var i=0;i<N;i++){counts[i]+=fired[i];peaks[i]=Math.max(peaks[i],V[i]);spikes[groupId[i]]+=fired[i];}return {spikes,neurons:watch.map(i=>({sortedIndex:i,spike:fired[i],voltage:V[i]}))};},
 response:function(excluded){var out=[];for(var i=0;i<N;i++)if(!excluded.includes(groupId[i])&&(counts[i]||peaks[i]>=.1))out.push({sortedIndex:i,groupId:groupId[i],spikes:counts[i],peakV:peaks[i]});return out;}
 };`)(self,performance,()=>0,buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength));
}
function inputAt(c,step,meta){const sums=new Map();for(const s of c.stimuli){let current=step>=s.start&&step<s.end?s.current:0;if(s.profile==='ramp')current*=Math.max(0,Math.min(1,(step-s.start)/Math.max(1,s.end-s.start-1)));if(s.profile==='pulse'&&(step-s.start)%s.period>=s.on)current=0;const group=meta.groups.find(g=>g.name===s.group).id;sums.set(group,(sums.get(group)||0)+current);}const result=[...sums].map(([group,current])=>({group,current}));if(result.some(s=>s.current>.5+1e-9))throw Error('Overlapping stimuli exceed 0.5 current');return result;}
function atomic(file,data){fs.writeFileSync(file+'.tmp',data);fs.renameSync(file+'.tmp',file);}
async function runCampaign({config,output,resume=false,maxCases=Infinity,shouldStop=()=>false,onProgress=()=>{}}){
 const meta=readJSON(path.join(ROOT,'data/neuron_meta.json'));validate(config,meta);
 for(const c of config.cases)for(let t=0;t<c.steps;t++)inputAt(c,t,meta); // Fail before writing any output.
 const worker=canonical(fs.readFileSync(path.join(ROOT,'js/sim-worker.js'),'utf8')),compressed=fs.readFileSync(path.join(ROOT,'data/connectome.bin.gz'));
 const provenance={workerSHA256:sha(worker),connectomeSHA256:sha(compressed),runnerSHA256:sha(canonical(fs.readFileSync(__filename,'utf8'))),node:process.version};
 const fingerprint=sha(JSON.stringify({config,provenance}));output=path.resolve(output);
 if(fs.existsSync(output)&&!resume)throw Error('Output exists; choose a new directory or --resume');
 if(resume&&!fs.existsSync(path.join(output,'checkpoint.json')))throw Error('No checkpoint to resume');
 fs.mkdirSync(output,{recursive:true});const lock=path.join(output,'.lock');let locked=false;
 try{
  const fd=fs.openSync(lock,'wx');locked=true;fs.writeFileSync(fd,JSON.stringify({pid:process.pid}));fs.closeSync(fd);
  let checkpoint=resume?readJSON(path.join(output,'checkpoint.json')):{fingerprint,completed:[]};
  if(checkpoint.fingerprint!==fingerprint)throw Error('Configuration, model, runner or Node version changed; resume refused');
  for(const entry of checkpoint.completed){const c=config.cases[entry.index];if(!c||entry.id!==c.id)throw Error('Invalid checkpoint');for(const suffix of ['ndjson','summary.json'])if(sha(fs.readFileSync(path.join(output,c.id+'.'+suffix)))!==entry.hashes[suffix])throw Error('Completed result changed: '+c.id);}
  atomic(path.join(output,'checkpoint.json'),JSON.stringify(checkpoint,null,2));atomic(path.join(output,'config.json'),JSON.stringify(config,null,2));
  const engine=createEngine(worker,zlib.gunzipSync(compressed));let executed=0;
  for(let index=0;index<config.cases.length;index++){
   if(checkpoint.completed.some(e=>e.index===index))continue;if(shouldStop()||executed>=maxCases)break;
   const c=config.cases[index];engine.reset(config.parameters,c);const tmp=path.join(output,c.id+'.ndjson.partial'),fd=fs.openSync(tmp,'w');let stopped=false;const groupTotals=new Array(meta.group_count).fill(0);
   try{for(let step=0;step<c.steps;step++){
    if(shouldStop()){stopped=true;break;}const inputs=inputAt(c,step,meta);const result=engine.step(inputs,config.watch);result.spikes.forEach((n,g)=>groupTotals[g]+=n);
    fs.writeSync(fd,JSON.stringify({caseId:c.id,step,inputs,...result})+'\n');if(step%25===24)await new Promise(resolve=>setImmediate(resolve));
   }}finally{fs.closeSync(fd);}if(stopped)break;
   const inputGroups=[...new Set(c.stimuli.map(s=>meta.groups.find(g=>g.name===s.group).id))];
   const summary={id:c.id,steps:c.steps,inputGroups,groupTotals,downstreamSpikes:groupTotals.reduce((sum,n,g)=>sum+(inputGroups.includes(g)?0:n),0),responders:engine.response(inputGroups)};
   fs.renameSync(tmp,path.join(output,c.id+'.ndjson'));atomic(path.join(output,c.id+'.summary.json'),JSON.stringify(summary));
   checkpoint.completed.push({index,id:c.id,hashes:Object.fromEntries(['ndjson','summary.json'].map(s=>[s,sha(fs.readFileSync(path.join(output,c.id+'.'+s)))]))});
   atomic(path.join(output,'checkpoint.json'),JSON.stringify(checkpoint,null,2));executed++;onProgress({completed:checkpoint.completed.length,total:config.cases.length,id:c.id});
  }
  const report={schema:'maglab-report-v1',name:config.name,status:checkpoint.completed.length===config.cases.length?'complete':'partial',fingerprint,provenance,config,groups:meta.groups,results:checkpoint.completed.map(e=>readJSON(path.join(output,e.id+'.summary.json')))};
  atomic(path.join(output,'report.json'),JSON.stringify(report));
  atomic(path.join(output,'report.md'),`# ${config.name}\n\nStatus: ${report.status}. ${report.results.length}/${config.cases.length} ensaios. Sem chamadas de IA.\n\n| Ensaio | Passos | Disparos fora da entrada | Candidatos |\n|---|---:|---:|---:|\n`+report.results.map(r=>`| ${r.id} | ${r.steps} | ${r.downstreamSpikes} | ${r.responders.length} |`).join('\n')+'\n\nÍndices são internos ao modelo identificado pelos hashes. Candidatos: disparo ou potencial pós-atualização >= 0,1. Não são comandos motores validados. Retomada preserva ensaios completos e reinicia o ensaio interrompido.\n');return report;
 }finally{if(locked)fs.unlinkSync(lock);}
}
module.exports={runCampaign,validate,inputAt};
if(require.main===module){
 (async()=>{const args=process.argv.slice(2),options={};for(let i=0;i<args.length;i++){if(args[i]==='--resume')options.resume=true;else if(['--config','--out','--max-cases'].includes(args[i])){const key=args[i];if(!args[i+1]||args[i+1].startsWith('--'))throw Error('Missing value: '+key);options[key]=args[++i];}else throw Error('Unknown argument: '+args[i]);}
 if(!options['--config']||!options['--out'])throw Error('Usage: node run.cjs --config campaign.json --out results/new-run [--resume] [--max-cases N]');
 let stop=false;process.on('SIGINT',()=>{stop=true;console.log('Stopping; completed cases will be preserved…');});const maxCases=options['--max-cases']===undefined?Infinity:Number(options['--max-cases']);if(maxCases!==Infinity)number(maxCases,1,10000,'max-cases',true);
 const report=await runCampaign({config:readJSON(options['--config']),output:options['--out'],resume:options.resume,maxCases,shouldStop:()=>stop,onProgress:p=>console.log(`${p.completed}/${p.total} ${p.id}`)});console.log(`${report.status}: ${path.resolve(options['--out'],'report.json')}`);
 })().catch(e=>{console.error(e.message);process.exitCode=1;});
}
