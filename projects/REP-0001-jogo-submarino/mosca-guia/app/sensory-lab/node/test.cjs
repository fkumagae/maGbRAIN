const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {runCampaign,validate,inputAt}=require('./run.cjs');
(async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'maglab-test-'));
 const config=JSON.parse(fs.readFileSync(path.join(__dirname,'mobility-inputs.json'),'utf8'));
 const meta=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../data/neuron_meta.json'),'utf8'));
 const full=await runCampaign({config,output:path.join(root,'full')});
 assert.equal(full.status,'complete');assert.equal(full.results.find(r=>r.id==='odor-3').downstreamSpikes,7);assert.equal(full.results.find(r=>r.id==='blank').downstreamSpikes,0);assert.equal(full.results.find(r=>r.id==='odor-disconnected').downstreamSpikes,0);
 const odor=full.results.find(r=>r.id==='odor-3').responders.filter(n=>n.spikes);assert.deepEqual(odor.map(n=>[n.sortedIndex,n.spikes]),[[99987,3],[100133,3],[100555,1]]);
 const partial=await runCampaign({config,output:path.join(root,'resume'),maxCases:2});assert.equal(partial.status,'partial');assert.equal(partial.results.length,2);
 const resumed=await runCampaign({config,output:path.join(root,'resume'),resume:true});assert.deepEqual(resumed,full);
 let stop=false;const interrupted=await runCampaign({config,output:path.join(root,'interrupt'),onProgress:()=>{stop=true;},shouldStop:()=>stop});assert.equal(interrupted.results.length,1);
 assert.deepEqual(await runCampaign({config,output:path.join(root,'interrupt'),resume:true}),full);
 let checks=0;const midcase=await runCampaign({config,output:path.join(root,'midcase'),shouldStop:()=>++checks>15});assert.equal(midcase.results.length,0);assert.deepEqual(await runCampaign({config,output:path.join(root,'midcase'),resume:true}),full);
 const changed=structuredClone(config);changed.parameters.threshold=.3;await assert.rejects(runCampaign({config:changed,output:path.join(root,'resume'),resume:true}),/changed/);
 await assert.rejects(runCampaign({config,output:path.join(root,'full')}),/exists/);
 fs.appendFileSync(path.join(root,'resume','blank.ndjson'),'corrupted');await assert.rejects(runCampaign({config,output:path.join(root,'resume'),resume:true}),/changed/);
 for(const mutate of [c=>c.cases[0].steps=-1,c=>c.cases[1].stimuli[0].group='TYPO',c=>c.watch.push(999999),c=>c.parameters.typo=1,c=>c.cases[1].stimuli[0].current=NaN]){const c=structuredClone(config);mutate(c);assert.throws(()=>validate(c,meta));}
 const pulse=config.cases.find(c=>c.id==='visual-pulse');assert.equal(inputAt(pulse,10,meta)[0].current,.3);assert.equal(inputAt(pulse,13,meta)[0].current,0);assert.equal(inputAt(pulse,70,meta)[0].current,0);
 const overlap=structuredClone(config);overlap.cases[1].stimuli=[{group:'VIS_R1R6',start:0,end:50,current:.3,profile:'constant'},{group:'VIS_R1R6',start:0,end:50,current:.3,profile:'constant'}];await assert.rejects(runCampaign({config:overlap,output:path.join(root,'bad')}),/Overlapping/);assert.equal(fs.existsSync(path.join(root,'bad')),false);
 const {execFileSync}=require('node:child_process');
 const args=[path.join(__dirname,'run.cjs'),'--config',path.join(__dirname,'mobility-inputs.json'),'--out',path.join(root,'cli')];
 execFileSync(process.execPath,[...args,'--max-cases','2']);execFileSync(process.execPath,[...args,'--resume']);assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root,'cli/report.json'),'utf8')),full);
 fs.writeFileSync(path.join(root,'cli/.lock'),'{}');await assert.rejects(runCampaign({config,output:path.join(root,'cli'),resume:true}),/EEXIST/);assert.ok(fs.existsSync(path.join(root,'cli/.lock')));
 const result={passed:true,checks:['known individual and group responses','blank/disconnected controls','resume equals uninterrupted run','interruption within case restarts deterministically','configuration fingerprint mismatch rejected','existing output protected','tampered results rejected','invalid JSON fields/groups/indices rejected','pulse boundaries','actual CLI partial run and resume','concurrent lock preserved','overlapping current rejected before output'],cases:full.results.length};
 fs.writeFileSync(path.join(__dirname,'test-results.json'),JSON.stringify(result,null,2));console.log(result);
})().catch(e=>{console.error(e);process.exitCode=1;});
