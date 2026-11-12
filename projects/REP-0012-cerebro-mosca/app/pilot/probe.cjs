const fs=require('node:fs'),path=require('node:path'),engine=require('./neural-engine.cjs')();
const results=[];
for(const disconnected of [false,true])for(const [l,r] of [[0,0],[.1,0],[0,.1],[.3,0],[0,.3],[.3,.3],[.45,.15],[.15,.45]]){
 engine.reset(disconnected);const sum=[0,0],spikes=[0,0],samples=[];
 for(let t=0;t<200;t++){const out=engine.step(t>=20&&t<160?l:0,t>=20&&t<160?r:0);if(t>=60&&t<160)out.forEach((n,i)=>{sum[i]+=n.voltage+n.spike;spikes[i]+=n.spike;});samples.push({t,out});}
 results.push({left:l,right:r,disconnected,readoutMean:sum.map(n=>n/100),spikes,samples});
}
fs.writeFileSync(path.join(__dirname,'probe-results.json'),JSON.stringify(results));
console.log(results.map(({samples,...r})=>r));
