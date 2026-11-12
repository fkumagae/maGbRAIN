const fs=require('node:fs'),path=require('node:path');
const base=path.resolve(__dirname,'../sensory-lab/node/results/mapeamento-basico-2026-11-12/output');
const report=JSON.parse(fs.readFileSync(path.join(base,'report.json'),'utf8'));
const atlas=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../sensory-lab/atlas.json'),'utf8'));
const identities=new Map(atlas.candidates.map(n=>[n.sortedIndex,n]));const cells=new Map();
for(const r of report.results)for(const n of r.responders)if(n.spikes){const a=cells.get(n.sortedIndex)||{index:n.sortedIndex,rootId:identities.get(n.sortedIndex)?.rootId||null,group:report.groups[n.groupId].name,cases:[]};a.cases.push({id:r.id,spikes:n.spikes});cells.set(n.sortedIndex,a);}
const control=report.results.filter(r=>r.id.includes('controle-vazio')||r.id.includes('sem-conexoes'));
const nonOlfactorySpikes=report.results.filter(r=>!r.id.startsWith('odor')&&r.downstreamSpikes>0);
const a=report.results.find(r=>r.id==='odor-i30-d180'),b=report.results.find(r=>r.id==='odor-i30-d180-sem-99987-100133-100555');
const commonChanges=a.responders.flatMap(n=>{const other=b.responders.find(v=>v.sortedIndex===n.sortedIndex);return other&&Math.abs(n.peakV-other.peakV)>1e-6?[{index:n.sortedIndex,intact:n.peakV,ablated:other.peakV,difference:other.peakV-n.peakV}]:[];}).sort((x,y)=>Math.abs(y.difference)-Math.abs(x.difference));
const summary={cases:report.results.length,controls:control.map(r=>({id:r.id,spikes:r.downstreamSpikes})),cells:[...cells.values()],nonOlfactorySpikes,ablation:{case:a.id,intactSpikes:a.downstreamSpikes,ablatedSpikes:b.downstreamSpikes,commonCandidateVoltageChanges:commonChanges,note:'Only shared candidates compared; omitted candidates cannot be treated as zero.'}};
fs.writeFileSync(path.join(__dirname,'analysis-99.json'),JSON.stringify(summary,null,2));console.log({cases:summary.cases,spikingCells:cells.size,controls:control.length,nonOlfactorySpikingCases:nonOlfactorySpikes.length,ablationSpikes:[a.downstreamSpikes,b.downstreamSpikes],changedPeaks:commonChanges.length});
