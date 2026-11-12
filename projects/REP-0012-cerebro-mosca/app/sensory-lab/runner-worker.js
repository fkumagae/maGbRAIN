/* Controlled stepping of the unchanged LIF worker. No game or autonomous movement. */
importScripts('../js/sim-worker.js');
const originalHandler=self.onmessage;
const send=self.postMessage.bind(self);
let lastTick, busy=false, paused=false, cancelled=false;
self.postMessage=message=>{if(message.type==='tick')lastTick=message;else send(message);};
const delay=()=>new Promise(resolve=>setTimeout(resolve,10));
self.onmessage=async ({data})=>{
 if(data.type==='init'){originalHandler({data});return;}
 if(data.type==='pause'){paused=true;return;}
 if(data.type==='resume'){paused=false;return;}
 if(data.type==='cancel'){cancelled=true;paused=false;return;}
 if(data.type!=='experiment'||busy)return;
 busy=true;cancelled=false;paused=false;
 const savedWeights=values.slice();
 try {
  const {cases,watch}=data;
  if(!Array.isArray(cases)||cases.length>32||!Array.isArray(watch)||watch.length>32||watch.some(i=>!Number.isInteger(i)||i<0||i>=N))throw Error('Protocolo inválido');
  for(let caseIndex=0;caseIndex<cases.length&&!cancelled;caseIndex++){
   const c=cases[caseIndex];
   if(!Number.isInteger(c.group)||c.group < -1||c.group>=numGroups||!Number.isFinite(c.current)||c.current<0||c.current>.5)throw Error('Entrada inválida');
   originalHandler({data:{type:'reset'}});tickCount=0;
   originalHandler({data:{type:'setParams',threshold:1,leakRate:.95,refractoryPeriod:3}});
   values.set(savedWeights);if(c.disconnected)values.fill(0);
   const ids=c.group<0?new Uint32Array():Uint32Array.from({length:groupOffset[c.group+1]-groupOffset[c.group]},(_,i)=>i+groupOffset[c.group]);
   for(let step=0;step<100&&!cancelled;step++){
    while(paused&&!cancelled)await delay();if(cancelled)break;
    let current=step>=10&&step<70?c.current:0;
    if(c.profile==='slow')current*=Math.min(1,Math.max(0,(step-10)/59));
    if(c.profile==='fast')current*=Math.min(1,Math.max(0,(step-10)/9));
    originalHandler({data:{type:'setStimulusState',indices:ids,intensities:new Float32Array(ids.length).fill(current)}});
    tick();
    send({type:'sample',caseIndex,step,input:{group:c.group,current,disconnected:!!c.disconnected},spikes:Array.from(lastTick.groupSpikeCounts),neurons:watch.map(i=>({sortedIndex:i,spike:fired[i],voltage:V[i]}))});
    if(step%5===4)await delay();
   }
   if(!cancelled)send({type:'caseDone',caseIndex});
  }
  send({type:'finished',cancelled});
 }catch(e){send({type:'error',message:e.message});}
 finally{values.set(savedWeights);originalHandler({data:{type:'reset'}});busy=false;}
};
