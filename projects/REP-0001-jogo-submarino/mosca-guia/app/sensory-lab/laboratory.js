(() => {
 const $=id=>document.getElementById(id);
 let atlas,meta,worker,record=null,busy=false,paused=false,ready=false,workerHash;
 const table=items=>{const t=document.createElement('table');for(const item of items){const r=t.insertRow();for(const v of [item.rootId,item.group,item.rawWeight])r.insertCell().textContent=v;}return t;};
 function details(){const n=atlas.candidates.find(n=>n.sortedIndex===Number($('neuron').value));if(!n)return;
  $('identity').textContent=`root_id ${n.rootId} · índice ${n.sortedIndex} · ${n.group} · ${n.incoming.length} entradas / ${n.outgoing.length} saídas. Anotações: ${Object.entries(n.annotations).filter(([k,v])=>v&&k!=='root_id').map(([k,v])=>k+': '+v).join('; ')}`;
  $('incoming').replaceChildren(table(n.incoming));$('outgoing').replaceChildren(table(n.outgoing));
 }
 function filter(){const query=$('search').value.toLowerCase();const found=atlas.candidates.filter(n=>[n.rootId,n.sortedIndex,n.group].join(' ').toLowerCase().includes(query));$('neuron').replaceChildren(...found.map(n=>new Option(`${n.sortedIndex} · ${n.group} · ${n.rootId}`,n.sortedIndex)));if(found.length)details();else{$('identity').textContent='Nenhuma célula encontrada';$('incoming').replaceChildren();$('outgoing').replaceChildren();}}
 function buttons(){$('run').disabled=busy||!ready;$('pause').disabled=!busy;$('cancel').disabled=!busy;$('export').disabled=!record?.samples.length;$('pause').textContent=paused?'Continuar':'Pausar';}
 function render(){if(!record)return;$('runs').replaceChildren(...record.cases.map((c,i)=>{const row=document.createElement('tr');const samples=record.samples.filter(s=>s.caseIndex===i);const count=samples.reduce((sum,s)=>sum+s.spikes.reduce((a,n,g)=>a+(g===c.group?0:n),0),0);for(const value of [c.name,samples.length,count,record.completed.includes(i)?'Concluído':samples.length?'Parcial':'Aguardando']){const cell=document.createElement('td');cell.textContent=value;row.append(cell);}return row;}));}
 const sha=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
 async function load(url){const r=await fetch(url);if(!r.ok)throw Error(url+': HTTP '+r.status);return r;}
 async function init(){try{
  const [a,m,b,w]=await Promise.all([load('atlas.json'),load('../data/neuron_meta.json'),load('../data/connectome.bin.gz'),load('../js/sim-worker.js')]);
  atlas=await a.json();meta=await m.json();const buffer=await b.arrayBuffer();workerHash=await sha(new TextEncoder().encode((await w.text()).replace(/\r\n/g,'\n')));
  if(workerHash!==atlas.canonicalWorkerSHA256)throw Error('Worker diferente do atlas');
  if(await sha(buffer)!==atlas.connectomeSHA256)throw Error('Conectoma diferente do atlas');
  $('verification').textContent=`${atlas.candidates.length} candidatos identificados. ${atlas.neuronCount} neurônios e ${atlas.edgeCount} conexões conferidos contra os CSVs originais. IDs preservados como texto.`;
  $('search').oninput=filter;$('neuron').onchange=details;filter();$('neuron').value='99987';details();
  worker=new Worker('runner-worker.js');worker.onerror=e=>fail(e.message);
  worker.onmessage=({data})=>{
   if(data.type==='ready'){ready=true;$('status').textContent='Rede pronta. Selecione uma célula e execute a bateria.';buttons();}
   if(data.type==='sample'){record.samples.push(data);$('progress').value=record.samples.length;$('status').textContent=`${record.cases[data.caseIndex].name} · passo ${data.step} · ${record.samples.length}/1600`;if(data.step%10===9){render();buttons();}}
   if(data.type==='caseDone'){record.completed.push(data.caseIndex);render();}
   if(data.type==='finished'){busy=false;paused=false;record.status=data.cancelled?'cancelled':'complete';$('status').textContent=data.cancelled?'Cancelado. Registro parcial disponível.':'Bateria concluída. Exporte o registro para análise.';render();buttons();}
   if(data.type==='error')fail(data.message);
  };worker.postMessage({type:'init',buffer},[buffer]);
 }catch(e){fail(e.message);}}
 function fail(message){busy=false;ready=false;if(record)record.status='error';$('status').textContent='Erro: '+message;buttons();}
 $('run').onclick=()=>{
  const id=name=>meta.groups.find(g=>g.name===name).id;
  const cases=[{name:'Controle vazio',group:-1,current:0}];
  for(const [name,group] of [['Luz','VIS_R1R6'],['Odor','OLF_ORN_FOOD'],['Vibração','MECH_JO'],['Toque','MECH_BRISTLE']])for(const current of [.1,.2,.3])cases.push({name:`${name} ${current}`,group:id(group),current});
  cases.push({name:'Odor sem conexões',group:id('OLF_ORN_FOOD'),current:.3,disconnected:true});
  for(const profile of ['slow','fast'])cases.push({name:'Rampa visual '+profile,group:id('VIS_R1R6'),current:.3,profile});
  const selected=Number($('neuron').value);const watch=[...new Set([99987,100133,100555,...($('neuron').value?[selected]:[])])];
  record={version:1,started:new Date().toISOString(),status:'running',connectomeSHA256:atlas.connectomeSHA256,workerSHA256:workerHash,protocol:{steps:100,start:10,end:70,threshold:1,leak:.95,refractory:3,note:'Model steps, not calibrated physiological time. Post-update voltages. No motion.'},groups:meta.groups,watch:watch.map(i=>{const n=atlas.candidates.find(n=>n.sortedIndex===i);return {sortedIndex:i,rootId:n.rootId,group:n.group};}),cases,samples:[],completed:[]};
  busy=true;paused=false;$('progress').value=0;buttons();render();worker.postMessage({type:'experiment',cases,watch});
 };
 $('pause').onclick=()=>{paused=!paused;worker.postMessage({type:paused?'pause':'resume'});buttons();};
 $('cancel').onclick=()=>worker.postMessage({type:'cancel'});
 $('export').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(record)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='flybrain-experiment.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 window.NeuralLab={snapshot:()=>structuredClone(record),get ready(){return ready;}};init();
})();
