(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.PilotCore=api;})(globalThis,()=>{
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const params={dt:.1,neuralTicks:10,speed:.45,turnGain:1.8,antennaForward:.4,antennaSide:.6,odorSigma:4,currentMin:.055,currentMax:.1,bounds:7,goalRadius:.6};
 function sensors(body,source,p=params){const c=Math.cos(body.heading),s=Math.sin(body.heading);return [1,-1].map(side=>{const x=body.x+p.antennaForward*c-side*p.antennaSide*s,y=body.y+p.antennaForward*s+side*p.antennaSide*c;const odor=Math.exp(-((x-source.x)**2+(y-source.y)**2)/(2*p.odorSigma**2));return p.currentMin+(p.currentMax-p.currentMin)*odor;});}
 // Decoder only sees neural readout. Source and position never enter here.
 function decode(readout,calibration){const [[a,c],[b,d]]=calibration.matrix;const determinant=a*d-b*c;const left=Math.max(0,(d*readout[0]-c*readout[1])/determinant),right=Math.max(0,(-b*readout[0]+a*readout[1])/determinant);return {left,right,turn:clamp(params.turnGain*(left-right)/(left+right+1e-5),-1.3,1.3),speed:params.speed};}
 function advance(body,motor,source){body.heading+=motor.turn*params.dt;body.x+=motor.speed*Math.cos(body.heading)*params.dt;body.y+=motor.speed*Math.sin(body.heading)*params.dt;let collision=false;if(Math.abs(body.x)>params.bounds||Math.abs(body.y)>params.bounds){collision=true;body.x=clamp(body.x,-params.bounds,params.bounds);body.y=clamp(body.y,-params.bounds,params.bounds);body.heading+=Math.PI*.75;}return {collision,reached:Math.hypot(body.x-source.x,body.y-source.y)<params.goalRadius};}
 function calibrate(engine){const columns=[];for(const input of [[.1,0],[0,.1]]){engine.reset();const sum=[0,0];for(let t=0;t<400;t++){const out=engine.step(...input);if(t>=100)out.forEach((n,i)=>sum[i]+=n.voltage);}columns.push(sum.map(v=>v/300));}return {matrix:[[columns[0][0],columns[1][0]],[columns[0][1],columns[1][1]]],note:'Two single-side 0.1 current calibration trials. Voltage readout, engineering decoder, no claimed motor identity.'};}
 function trial(engine,calibration,start,source,mode='neural',steps=1800){engine.reset(mode==='disconnected');const body={...start},smooth=[0,0],trace=[];let collisions=0,reached=false;
  for(let step=0;step<steps;step++){const inputs=sensors(body,source);for(let t=0;t<params.neuralTicks;t++){const out=engine.step(...inputs);out.forEach((n,i)=>smooth[i]+=.02*(n.voltage-smooth[i]));}
   let motor=decode(smooth,calibration);if(mode==='no-readout')motor={turn:0,speed:params.speed};if(mode==='rules')motor={turn:clamp(8*(inputs[0]-inputs[1])/(inputs[0]+inputs[1]),-1.3,1.3),speed:params.speed};
   const state=advance(body,motor,source);collisions+=state.collision?1:0;trace.push({step,x:body.x,y:body.y,heading:body.heading,inputs,voltage:[...smooth],motor});if(state.reached){reached=true;break;}
  }return {mode,start,source,reached,collisions,steps:trace.length,finalDistance:Math.hypot(body.x-source.x,body.y-source.y),trace};
 }
 return {params,sensors,decode,advance,calibrate,trial};
});
