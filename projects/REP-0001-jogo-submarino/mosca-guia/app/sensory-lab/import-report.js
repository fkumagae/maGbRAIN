(() => {
 const input=document.getElementById('nodeReport'),status=document.getElementById('nodeStatus'),body=document.getElementById('nodeResults'),detail=document.getElementById('nodeDetails');
 input.onchange=async()=>{body.replaceChildren();detail.textContent='';try{
  const file=input.files[0];if(!file)return;if(file.size>25*1024*1024)throw Error('Arquivo maior que 25 MB; divida a campanha');
  const r=JSON.parse(await file.text());
  if(r.schema!=='maglab-report-v1'||!Array.isArray(r.results)||r.results.length>10000||!Array.isArray(r.groups)||!r.provenance||!r.config?.parameters||!Array.isArray(r.config.cases))throw Error('Formato inválido: selecione report.json do executor Node');
  for(const c of r.results){if(typeof c.id!=='string'||!Number.isFinite(c.steps)||!Number.isFinite(c.downstreamSpikes)||!Array.isArray(c.responders))throw Error('Ensaio inválido');}
  status.textContent=`${r.name} · ${r.status} · ${r.results.length}/${r.config.cases.length} ensaios · limiar ${r.config.parameters.threshold}. Relatório local; não comprova função motora. Conectoma: ${r.provenance.connectomeSHA256}`;
  for(const c of r.results){const row=document.createElement('tr');for(const value of [c.id,c.steps,c.downstreamSpikes,c.responders.length]){const cell=document.createElement('td');cell.textContent=value;row.append(cell);}const cell=document.createElement('td'),button=document.createElement('button');button.textContent='Ver células';button.onclick=()=>{detail.replaceChildren();const title=document.createElement('p');title.textContent=`${c.id}: índice interno · população · disparos · potencial máximo. Mostrando até 500 candidatos de ${c.responders.length}.`;detail.append(title);const table=document.createElement('table');for(const n of c.responders.slice(0,500)){const tr=table.insertRow();for(const value of [n.sortedIndex,r.groups.find(g=>g.id===n.groupId)?.name||n.groupId,n.spikes,n.peakV])tr.insertCell().textContent=value;}detail.append(table);};cell.append(button);row.append(cell);body.append(row);}
 }catch(e){status.textContent='Não foi possível importar: '+e.message;body.replaceChildren();}};
})();
