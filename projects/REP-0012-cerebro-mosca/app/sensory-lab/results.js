(() => {
  const $ = id => document.getElementById(id);
  fetch('neuron-map.json').then(r => {if(!r.ok)throw Error('HTTP '+r.status);return r.json();}).then(data => {
    function render() {
      const run = data.runs.find(r => r.condition === $('condition').value && r.threshold === Number($('threshold').value) && r.ablated === ($('ablation').value === 'true'));
      $('status').textContent = `${run.directSpikes} disparos na entrada · ${run.downstreamSpikes} disparos fora da entrada · ${run.candidates.length} células candidatas. Fonte: ${run.source || 'nenhuma'}.`;
      $('rows').replaceChildren(...run.candidates.map(n => {const row=document.createElement('tr');for(const value of [n.sortedIndex,n.group,n.spikes,n.peakV.toFixed(4),n.firstSpike ?? '—']){const cell=document.createElement('td');cell.textContent=value;row.append(cell);}return row;}));
    }
    for(const id of ['condition','threshold','ablation'])$(id).onchange=render;
    render();
  }).catch(e => {$('status').textContent='Falha ao carregar resultados: '+e.message;});
})();
