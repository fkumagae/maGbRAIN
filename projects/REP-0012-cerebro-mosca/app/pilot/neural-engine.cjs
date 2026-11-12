const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
module.exports=function createEngine(){
 const map=JSON.parse(fs.readFileSync(path.join(__dirname,'sensory-map.json'),'utf8'));
 const source=fs.readFileSync(path.join(root,'js/sim-worker.js'),'utf8').replace(/\r\n/g,'\n');
 const compressed=fs.readFileSync(path.join(root,'data/connectome.bin.gz'));
 const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
 if(sha(source)!==map.canonicalWorkerSHA256||sha(compressed)!==map.connectomeSHA256)throw Error('Model mismatch');
 const buffer=zlib.gunzipSync(compressed);
 const access=fs.readFileSync(path.join(__dirname,'engine-access.js'),'utf8');
 return new Function('self','performance','setTimeout','binary','map',source+'\n'+access+'\nparseBinary(binary);buildGroupStructures();return createPilotEngine(map);')({postMessage:()=>{}},performance,()=>0,buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength),map);
};
