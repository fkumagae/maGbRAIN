(() => {
  const panel=document.createElement('section');panel.id='sensoryBench';panel.hidden=true;
  panel.innerHTML=`<div class="bench-heading"><h2>BANCADA SENSORIAL</h2><button id="closeBench">Fechar</button></div>
  <p>Injeções experimentais no modelo. A fuga e o trajeto continuam sob controle do jogo. <a href="../sensory-lab/results.html" target="_blank" rel="noopener">Ver mapa de respostas</a> · <a href="../brain.html" target="_blank" rel="noopener">Abrir FlyBrain</a></p>
  <label><input id="loomingInput" type="checkbox" checked> Aproximação → VIS_R1R6</label>
  <div id="stimulusChannels"></div>
  <label>Limiar do neurônio <select id="neuralThreshold"><option value="1">1,00 · original</option><option value="0.3">0,30 · diagnóstico</option><option value="0.1">0,10 · diagnóstico</option><option value="0.03">0,03 · diagnóstico</option><option value="0.01">0,01 · diagnóstico</option></select></label>
  <p id="thresholdNote">Parâmetros originais. Potenciais abaixo do limiar podem revelar propagação.</p>
  <div class="bench-actions"><button id="applyStimuli">Aplicar e reiniciar rede</button><button id="blankStimuli">Controle sem entrada</button><button id="exportStimuli">Exportar registro</button></div>
  <p id="benchStatus" role="status">Aguardando rede…</p><p>Rótulos são agrupamentos do arquivo local. Vibração usa MECH_JO, que mistura anotações mecânicas/auditivas. Corrente de comida não equivale a uma concentração de odor calibrada.</p>
  <div class="bench-table"><table><thead><tr><th>População</th><th>Entrada</th><th>Disparos agora</th><th>Total</th><th>V+ máx.</th><th>V− mín.</th></tr></thead><tbody id="regionActivity"></tbody></table></div>`;
  document.body.append(panel);const open=document.createElement('button');open.id='openBench';open.textContent='Bancada de estímulos';document.body.append(open);
  const $=id=>document.getElementById(id);open.onclick=()=>{panel.hidden=false;};$('closeBench').onclick=()=>{panel.hidden=true;};
  const channels=[['light','Luz','VIS_R1R6'],['food','Odor alimentar','OLF_ORN_FOOD'],['vibration','Vibração','MECH_JO'],['touch','Toque','MECH_BRISTLE']];
  $('stimulusChannels').innerHTML=channels.map(([key,label,group])=>`<label class="stimulus-row">${label} <small>${group}</small><input id="stim-${key}" type="range" min="0" max="0.5" step="0.01" value="0"><output id="val-${key}">0.00</output></label>`).join('');
  for(const [key] of channels)$('stim-'+key).oninput=e=>$('val-'+key).textContent=Number(e.target.value).toFixed(2);
  let adapter;
  function apply(config){adapter.configure(config);window.GuideDemo.setLabStimuli?.(adapter.getConfig());$('regionActivity').replaceChildren();$('benchStatus').textContent='Rede reiniciada; coleta começa do zero.';}
  window.SensoryBench={
    attach(value){adapter=value;
      $('applyStimuli').onclick=()=>apply({looming:$('loomingInput').checked,threshold:Number($('neuralThreshold').value),...Object.fromEntries(channels.map(([key])=>[key,Number($('stim-'+key).value)]))});
      $('blankStimuli').onclick=()=>{for(const [key] of channels){$('stim-'+key).value=0;$('val-'+key).textContent='0.00';}$('loomingInput').checked=false;apply({looming:false,threshold:Number($('neuralThreshold').value),light:0,food:0,vibration:0,touch:0});};
      $('exportStimuli').onclick=()=>{const data={version:1,source:'FlyBrain original worker + voltage instrumentation',note:'V sampled after spike reset; mappings and thresholds are experimental. Gameplay is rule-driven.',configuration:adapter.getConfig(),samples:adapter.getSamples()};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='mosca-estimulos.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
    },
    sample(sample){
      $('thresholdNote').textContent=sample.config.threshold===1?'Limiar original 1,00.':'DIAGNÓSTICO: limiar alterado. Saída medida nesse ajuste não valida um circuito biológico.';
      const downstream=sample.activity.filter(g=>!g.injected&&g.total>0);
      $('benchStatus').textContent=`Passo ${sample.step} · ${downstream.length} populações não injetadas com disparos acumulados.`;
      const sorted=[...sample.activity].sort((a,b)=>Number(b.injected)-Number(a.injected)||b.total-a.total||b.peakV-a.peakV);
      $('regionActivity').innerHTML=sorted.map(g=>`<tr><td>${g.name}<small>${g.neurons} neurônios</small></td><td>${g.injected?'Direta':'—'}</td><td>${g.spikes}</td><td>${g.total}</td><td>${g.peakV.toFixed(4)}</td><td>${g.minV.toFixed(4)}</td></tr>`).join('');
    }
  };
})();
