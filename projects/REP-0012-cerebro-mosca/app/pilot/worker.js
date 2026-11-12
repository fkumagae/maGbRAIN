importScripts('../js/sim-worker.js','engine-access.js','core.js');
const originalHandler=self.onmessage,send=self.postMessage.bind(self);
self.postMessage=()=>{}; // Suppress the original visualization's per-tick transport.
let engine,calibration,map,body,source,mode='neural',smooth=[0,0],step=0,collisions=0,active=false,timer=null,lastMotor={turn:0,speed:0},lastInputs=[0,0];
const digest=async b=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b)),n=>n.toString(16).padStart(2,'0')).join('');
function halt(){active=false;clearTimeout(timer);timer=null;}
function snapshot(reached=false){send({type:'state',body:{...body},source:{...source},mode,step,collisions,inputs:lastInputs,voltage:[...smooth],motor:lastMotor,active,reached});}
function reset(){halt();engine.reset(mode==='disconnected');body={x:-4,y:-3,heading:0};source={x:3,y:2,enabled:true};smooth=[0,0];step=0;collisions=0;lastMotor={turn:0,speed:0};lastInputs=[0,0];snapshot();}
function loop(){if(!active)return;try{
 const inputs=source.enabled?PilotCore.sensors(body,source):[0,0];lastInputs=inputs;
 for(let t=0;t<PilotCore.params.neuralTicks;t++)engine.step(...inputs).forEach((n,i)=>smooth[i]+=.02*(n.voltage-smooth[i]));
 lastMotor=PilotCore.decode(smooth,calibration);
 if(mode==='no-readout')lastMotor={turn:0,speed:PilotCore.params.speed};
 if(mode==='rules')lastMotor={turn:Math.max(-1.3,Math.min(1.3,8*(inputs[0]-inputs[1])/(inputs[0]+inputs[1]+1e-9))),speed:PilotCore.params.speed};
 const state=PilotCore.advance(body,lastMotor,source);collisions+=state.collision?1:0;step++;const reached=source.enabled&&state.reached;
 if(reached||step>=1200)halt();send({type:'inputs',inputs});snapshot(reached);if(active)timer=setTimeout(loop,30);
 }catch(e){halt();send({type:'error',message:e.message});}}
self.onmessage=async({data})=>{try{
 if(data.type==='init'){
  if(engine)return;const responses=await Promise.all([fetch('sensory-map.json'),fetch('../data/connectome.bin.gz'),fetch('../js/sim-worker.js')]);if(responses.some(r=>!r.ok))throw Error('Falha ao carregar rede');
  map=await responses[0].json();const zipped=await responses[1].arrayBuffer(),code=(await responses[2].text()).replace(/\r\n/g,'\n');
  if(await digest(zipped)!==map.connectomeSHA256||await digest(new TextEncoder().encode(code))!==map.canonicalWorkerSHA256)throw Error('Rede incompatível com mapa');
  const binary=await decompressGzip(zipped);parseBinary(binary);buildGroupStructures();engine=createPilotEngine(map,originalHandler);calibration=PilotCore.calibrate(engine);reset();send({type:'ready',calibration,map:{readout:map.readout,connectomeSHA256:map.connectomeSHA256}});return;
 }
 if(!engine)return;
 if(data.type==='start'&&!active){if(step>=1200)reset();active=true;loop();}
 if(data.type==='pause'){halt();snapshot();}
 if(data.type==='reset')reset();
 if(data.type==='mode'){if(!['neural','disconnected','no-readout','rules'].includes(data.mode))throw Error('Modo inválido');mode=data.mode;reset();}
 if(data.type==='source'){if(!Number.isFinite(data.x)||!Number.isFinite(data.y))throw Error('Posição inválida');source={x:Math.max(-6,Math.min(6,data.x)),y:Math.max(-6,Math.min(6,data.y)),enabled:true};snapshot();}
 if(data.type==='odor'){source.enabled=!!data.enabled;snapshot();}
 }catch(e){halt();send({type:'error',message:e.message});}};
