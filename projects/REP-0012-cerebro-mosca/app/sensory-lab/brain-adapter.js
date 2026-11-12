/* Stimulus bench: each channel is an explicit experimental injection mapping. */
(() => {
  const root = new URL('../', document.currentScript.src);
  const mappings = {light:'VIS_R1R6',food:'OLF_ORN_FOOD',vibration:'MECH_JO',touch:'MECH_BRISTLE'};
  function visualInput(distance, speed) {
    const d=Math.max(.8,distance),v=Math.max(0,speed),angularRate=v/(d*d+.25);
    return {distance:d,closingSpeed:v,angularRate,current:.02+.48*Math.min(1,angularRate/.3)};
  }
  function create(options={}) {
    let worker, meta, groups=[], sizes=[], indices={}, ready=false, samples=[], epoch=0, pending=false;
    let config={threshold:1,looming:true,light:0,food:0,vibration:0,touch:0};
    let input=visualInput(5,0), lastSent=0, applied={}, totalSpikes={};
    function status(message){options.onStatus?.({ready,message});}
    function reset(){samples=[];totalSpikes={};epoch++;input=visualInput(5,0);if(ready){worker.postMessage({type:'reset',epoch});worker.postMessage({type:'setParams',threshold:config.threshold,leakRate:.95,refractoryPeriod:3});send(true);}}
    function send(force=false){
      if(!ready||(!force&&performance.now()-lastSent<95))return;
      lastSent=performance.now();const currents={};
      currents.VIS_R1R6=Math.min(.5,(config.looming?input.current:0)+config.light);
      for(const channel of ['food','vibration','touch'])currents[mappings[channel]]=config[channel];
      const ids=[],values=[];
      for(const [group,value] of Object.entries(currents)){if(value>0)for(const n of indices[group]||[]){ids.push(n);values.push(value);}}
      applied={...currents};worker.postMessage({type:'setStimulusState',indices:new Uint32Array(ids),intensities:new Float32Array(values)});
    }
    async function init(){
      if(pending)return;pending=true;
      try{
        status('Carregando rede e medidores…');
        const [mr,br]=await Promise.all([fetch(new URL('data/neuron_meta.json',root)),fetch(new URL('data/connectome.bin.gz',root))]);
        if(!mr.ok||!br.ok)throw Error('Falha nos recursos locais');
        meta=await mr.json();const buffer=await br.arrayBuffer();
        worker=new Worker(new URL('sensory-lab/instrumented-worker.js',root));
        worker.onerror=e=>{ready=false;status('Erro neural: '+e.message);};
        worker.onmessage=({data})=>{
          if(data.type==='error'){ready=false;status(data.message);return;}
          if(data.type==='ready'){
            meta.groups.forEach(g=>{indices[g.name]=[];});data.groupId.forEach((id,i)=>indices[meta.groups[id].name].push(i));
            groups=meta.groups.filter(g=>indices[g.name].length);sizes=meta.groups.map(g=>indices[g.name].length);
            ready=true;reset();status('Rede instrumentada ativa');worker.postMessage({type:'start'});return;
          }
          if(data.type!=='tick'||data.epoch!==epoch)return;
          const activity=groups.map(g=>{
            const count=data.groupSpikeCounts[g.id]||0;totalSpikes[g.name]=(totalSpikes[g.name]||0)+count;
            return {name:g.name,region:g.region,neurons:sizes[g.id],injected:(applied[g.name]||0)>0,spikes:count,total:totalSpikes[g.name],fraction:count/sizes[g.id],peakV:data.peakV[g.id],minV:data.minV[g.id]};
          });
          const visual=activity.find(g=>g.name==='VIS_R1R6'),descending=activity.find(g=>g.name==='GNG_DESC');
          const sample={step:data.tickCount,epoch,config:{...config},inputs:{...applied},distance:input.distance,closingSpeed:input.closingSpeed,activity,visualFraction:visual.fraction,descendingFraction:descending.fraction,usableEscapeSignal:false};
          samples.push(sample);if(samples.length>1200)samples.shift();options.onSample?.(sample);
        };
        worker.postMessage({type:'init',buffer},[buffer]);
      }catch(error){ready=false;status('Falha neural: '+error.message);}
    }
    return {init,reset,usableEscapeSignal:false,get ready(){return ready;},setApproach(d,v){input=visualInput(d,v);send();return input;},getSamples:()=>structuredClone(samples),getConfig:()=>({...config}),
      configure(next){const proposed={...config,...next};if(![1,.3,.1,.03,.01].includes(proposed.threshold))throw Error('Limiar inválido');for(const key of ['light','food','vibration','touch'])if(!Number.isFinite(proposed[key])||proposed[key]<0||proposed[key]>.5)throw Error('Corrente inválida');config=proposed;reset();},
      dispose(){worker?.terminate();ready=false;}};
  }
  window.GuideBrain={create,visualInput};
})();
