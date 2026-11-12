/* Access adapter only. Original LIF equations and weights remain in sim-worker.js. */
function createPilotEngine(map,handleOriginal=self.onmessage){
 const saved=values.slice(),left=map.left.map(n=>n.index),right=map.right.map(n=>n.index),all=new Uint32Array([...left,...right]),currents=new Float32Array(all.length);
 return {
  reset(disconnected=false){handleOriginal({data:{type:'reset'}});tickCount=0;values.set(saved);if(disconnected)values.fill(0);},
  step(l,r){if(!Number.isFinite(l)||!Number.isFinite(r)||l<0||r<0||l>.5||r>.5)throw Error('Invalid sensory current');currents.fill(l,0,left.length);currents.fill(r,left.length);handleOriginal({data:{type:'setStimulusState',indices:all,intensities:currents}});tick();return map.readout.map(n=>({voltage:V[n.index],spike:fired[n.index]}));}
 };
}
