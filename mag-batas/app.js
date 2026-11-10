'use strict';
const $=id=>document.getElementById(id),W=600,H=800;
const pattern=document.createElement('canvas');pattern.width=W;pattern.height=H;
let view='mockup',logo=null,uploadVersion=0,timer;
let manual=['#161b33','#e54891','#6a43ce','#d3fa78','#00b5b8','#ffc15e','#ffffff','#ec5534'];
const fields=['style','seed','detail','paletteMode','colorCount','logoScale','logoX','logoY','text','font','textColor','textSize','textX','textY'];
const descriptions={truchet:'Arcos em ladrilhos rotacionados se conectam em curvas e labirintos.',geometry:'Triângulos e arcos com rotações e cores escolhidas pela seed.',fractal:'Conjunto de Julia: iterações complexas formam contornos fractais.',psychedelic:'Ondas interferem em um campo deformado e viram faixas de cor.'};
const layerFields=['style','seed','detail','paletteMode','colorCount','opacity','kaleido','slices','rotation','zoom','centerX','centerY'];
const extraFields=['logoOpacity','textOpacity','background'];
let layers=[],activeLayer=0;
function captureLayer(){const values={};layerFields.forEach(id=>values[id]=$(id).value);return {values,manual:manual.slice()};}
function commitLayer(){layers[activeLayer]=captureLayer();}
function activateLayer(i){commitLayer();activeLayer=i;const layer=layers[i];layerFields.forEach(id=>$(id).value=layer.values[id]);manual=layer.manual.slice();swatches();regenerate();}
function layerList(){
  $('layers').replaceChildren();
  layers.forEach((layer,i)=>{const row=document.createElement('div');row.className='layer-row';
    const select=document.createElement('button');select.textContent=(i+1)+'. '+$('style').querySelector('option[value="'+layer.values.style+'"]').textContent+' · '+layer.values.opacity+'%';select.setAttribute('aria-pressed',i===activeLayer);select.onclick=()=>activateLayer(i);row.append(select);
    for(const [label,delta] of [['↑',-1],['↓',1]]){const button=document.createElement('button');button.textContent=label;button.setAttribute('aria-label',(delta<0?'Subir':'Descer')+' camada '+(i+1));button.disabled=i+delta<0||i+delta>=layers.length;button.onclick=()=>{commitLayer();[layers[i],layers[i+delta]]=[layers[i+delta],layers[i]];if(activeLayer===i)activeLayer=i+delta;else if(activeLayer===i+delta)activeLayer=i;regenerate();};row.append(button);}
    const remove=document.createElement('button');remove.textContent='×';remove.setAttribute('aria-label','Remover camada '+(i+1));remove.disabled=layers.length===1;remove.onclick=()=>{commitLayer();layers.splice(i,1);activeLayer=i===activeLayer?Math.min(i,layers.length-1):activeLayer-(i<activeLayer?1:0);const l=layers[activeLayer];layerFields.forEach(id=>$(id).value=l.values[id]);manual=l.manual.slice();swatches();regenerate();};row.append(remove);$('layers').append(row);
  });$('addLayer').disabled=layers.length>=5;
}
function renderStack(ctx,w,h){
  ctx.clearRect(0,0,w,h);ctx.fillStyle=$('background').value;ctx.fillRect(0,0,w,h);
  const scratch=document.createElement('canvas');scratch.width=w;scratch.height=h;
  for(const layer of layers.slice().reverse()){
    const v=layer.values;if(Number(v.opacity)===0)continue;
    MagPatterns.render(scratch.getContext('2d'),w,h,{style:v.style,seed:v.seed,detail:Number(v.detail),colors:v.paletteMode==='auto'?MagPatterns.palette(v.seed,Number(v.colorCount)):layer.manual.slice(0,Number(v.colorCount)),kaleido:v.kaleido==='on'?{slices:Number(v.slices),rotation:Number(v.rotation),zoom:Number(v.zoom),x:Number(v.centerX),y:Number(v.centerY)}:null});
    ctx.save();ctx.globalAlpha=Number(v.opacity)/100;ctx.drawImage(scratch,0,0);ctx.restore();
  }
}
function colors(){return $('paletteMode').value==='auto'?MagPatterns.palette($('seed').value,Number($('colorCount').value)):manual.slice(0,Number($('colorCount').value));}
function swatches(){const c=colors();$('colors').replaceChildren();c.forEach((hex,i)=>{const input=document.createElement('input');input.type='color';input.value=hex;input.setAttribute('aria-label','Cor '+(i+1));input.disabled=$('paletteMode').value==='auto';input.oninput=()=>{manual[i]=input.value;schedule();};$('colors').append(input);});}
function options(){return {seed:$('seed').value,style:$('style').value,detail:Number($('detail').value),colors:colors()};}
function regenerate(){clearTimeout(timer);commitLayer();layerList();$('kaleidoControls').hidden=$('kaleido').value!=='on';$('opacityValue').textContent=$('opacity').value+'%';$('detailValue').textContent=$('detail').value;$('description').textContent=descriptions[$('style').value];renderStack(pattern.getContext('2d'),W,H);draw();$('status').textContent=layers.length+' camada(s) · seed: '+($('seed').value||'(vazia)');}
function schedule(){clearTimeout(timer);timer=setTimeout(regenerate,100);}
// One generic front silhouette. Coordinates use the same 600 × 800 artboard as flat export.
function shirt(ctx){ctx.beginPath();ctx.moveTo(185,65);ctx.lineTo(245,52);ctx.bezierCurveTo(250,115,350,115,355,52);ctx.lineTo(415,65);ctx.lineTo(460,240);ctx.quadraticCurveTo(425,260,425,300);ctx.lineTo(450,735);ctx.quadraticCurveTo(300,765,150,735);ctx.lineTo(175,300);ctx.quadraticCurveTo(175,260,140,240);ctx.closePath();}
function composition(ctx,source,width,height,mockup){
  ctx.clearRect(0,0,width,height);ctx.save();ctx.scale(width/W,height/H);
  if(mockup){shirt(ctx);ctx.clip();}ctx.drawImage(source,0,0,W,H);
  if(logo){ctx.globalAlpha=Number($('logoOpacity').value)/100;const lw=W*Number($('logoScale').value)/100,lh=lw*logo.height/logo.width;ctx.drawImage(logo,W*Number($('logoX').value)/100-lw/2,H*Number($('logoY').value)/100-lh/2,lw,lh);}
  ctx.globalAlpha=Number($('textOpacity').value)/100;
  const text=$('text').value;
  if(text){ctx.font='bold '+$('textSize').value+'px '+$('font').value;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=$('textColor').value;ctx.fillText(text,W*Number($('textX').value)/100,H*Number($('textY').value)/100,W*.94);}
  ctx.restore();
  if(mockup){ctx.save();ctx.scale(width/W,height/H);shirt(ctx);ctx.strokeStyle='#ffffffaa';ctx.lineWidth=2;ctx.stroke();ctx.restore();}
}
function draw(){composition($('preview').getContext('2d'),pattern,W,H,view==='mockup');}
function setView(v){view=v;$('mockup').setAttribute('aria-pressed',v==='mockup');$('flat').setAttribute('aria-pressed',v==='flat');draw();}
$('mockup').onclick=()=>setView('mockup');$('flat').onclick=()=>setView('flat');
layerFields.forEach(id=>$(id).addEventListener('input',()=>{swatches();schedule();}));
extraFields.forEach(id=>$(id).addEventListener('input',id==='background'?schedule:draw));
$('addLayer').onclick=()=>{if(layers.length>=5)return;commitLayer();const next=captureLayer();next.values.seed=next.values.seed.slice(0,140)+'-camada-'+(layers.length+1);next.values.opacity='50';layers.unshift(next);activeLayer=0;layerFields.forEach(id=>$(id).value=next.values[id]);swatches();regenerate();};
fields.filter(id=>!['style','detail','seed','paletteMode','colorCount'].includes(id)).forEach(id=>$(id).addEventListener('input',draw));
$('generate').onclick=()=>{swatches();regenerate();};
$('vary').onclick=()=>{const words=new Uint32Array(2);crypto.getRandomValues(words);$('seed').value=Array.from(words).map(n=>n.toString(36)).join('-');swatches();regenerate();};
function logoControls(enabled){['logoScale','logoX','logoY','removeLogo'].forEach(id=>$(id).disabled=!enabled);}
function loadDefaultLogo(){
  const version=++uploadVersion,image=new Image();
  $('logoStatus').textContent='Carregando logo Magnatas…';
  image.onload=()=>{if(version!==uploadVersion)return;logo=image;$('logoFile').value='';logoControls(true);$('logoStatus').textContent='Logo Magnatas · você pode mover, redimensionar, trocar ou remover.';draw();};
  image.onerror=()=>{if(version===uploadVersion)$('logoStatus').textContent='Não foi possível carregar o logo padrão. Escolha um PNG.';};
  image.src=window.MAG_DEFAULT_LOGO;
}
$('brandLogo').src=window.MAG_DEFAULT_LOGO;
$('restoreLogo').onclick=loadDefaultLogo;
$('logoFile').onchange=async function(){
  const version=++uploadVersion,file=this.files[0];if(!file)return;
  if(file.type!=='image/png'||file.size>15*1024*1024){$('logoStatus').textContent='Escolha um PNG de até 15 MB.';this.value='';return;}
  const url=URL.createObjectURL(file),image=new Image();
  image.onload=()=>{URL.revokeObjectURL(url);if(version!==uploadVersion)return;
    if(image.width*image.height>24000000){$('logoStatus').textContent='Use um PNG com até 24 megapixels.';return;}
    logo=image;logoControls(true);$('logoStatus').textContent=file.name+' · arraste na prévia ou use os controles.';draw();};
  image.onerror=()=>{URL.revokeObjectURL(url);if(version===uploadVersion)$('logoStatus').textContent='Não foi possível ler esse PNG.';};image.src=url;
};
$('removeLogo').onclick=()=>{uploadVersion++;logo=null;$('logoFile').value='';logoControls(false);$('logoStatus').textContent='Logo removido.';draw();};
let drag=null;
$('preview').onpointerdown=e=>{const target=$('dragTarget').value;if(target==='logo'&&!logo)return;if(target==='text'&&!$('text').value)return;
  const r=$('preview').getBoundingClientRect();drag={target,x:e.clientX,y:e.clientY,ox:Number($(target+'X').value),oy:Number($(target+'Y').value),w:r.width,h:r.height};$('preview').setPointerCapture(e.pointerId);};
$('preview').onpointermove=e=>{if(!drag)return;$(drag.target+'X').value=Math.max(0,Math.min(100,drag.ox+(e.clientX-drag.x)/drag.w*100));$(drag.target+'Y').value=Math.max(0,Math.min(100,drag.oy+(e.clientY-drag.y)/drag.h*100));draw();};
$('preview').onpointerup=$('preview').onpointercancel=()=>{drag=null;};
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
function exportPNG(mockup){regenerate();const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=1600;const high=document.createElement('canvas');high.width=1200;high.height=1600;renderStack(high.getContext('2d'),1200,1600);composition(canvas.getContext('2d'),high,1200,1600,mockup);canvas.toBlob(blob=>{if(blob)download(blob,'mag-batas-'+(mockup?'mockup':'estampa')+'.png');else $('status').textContent='Falha ao exportar.';},'image/png');}
$('exportFlat').onclick=()=>exportPNG(false);$('exportMockup').onclick=()=>exportPNG(true);
$('exportConfig').onclick=()=>{commitLayer();const values={};fields.concat(extraFields).forEach(id=>values[id]=$(id).value);download(new Blob([JSON.stringify({version:2,values,manual,layers,activeLayer},null,2)],{type:'application/json'}),'mag-batas-config.json');};
$('configFile').onchange=async function(){const file=this.files[0];if(!file)return;try{
  if(file.size>64000)throw Error('Arquivo grande demais.');const data=JSON.parse(await file.text());
  if(![1,2].includes(data.version)||!data.values||!Array.isArray(data.manual)||data.manual.length!==8||!data.manual.every(c=>/^#[0-9a-f]{6}$/i.test(c)))throw Error('Formato inválido.');
  const limits={detail:[0,100],colorCount:[2,8],logoScale:[5,110],logoX:[0,100],logoY:[0,100],textSize:[10,100],textX:[0,100],textY:[0,100]};
  for(const id of fields){const v=data.values[id];if(typeof v!=='string')throw Error('Campo inválido: '+id);if(limits[id]&&(!Number.isFinite(Number(v))||Number(v)<limits[id][0]||Number(v)>limits[id][1]||!Number.isInteger(Number(v))))throw Error('Valor inválido: '+id);
    if($(id).tagName==='SELECT'&&!Array.from($(id).options).some(o=>o.value===v))throw Error('Opção inválida: '+id);}
  if(data.values.seed.length>160||data.values.text.length>80||!/^#[0-9a-f]{6}$/i.test(data.values.textColor))throw Error('Texto ou cor inválidos.');
  const imported=MagLayers.validate(data);
  fields.forEach(id=>$(id).value=data.values[id]);extraFields.forEach(id=>$(id).value=imported.values[id]);
  layers=imported.layers;activeLayer=imported.activeLayer;layerFields.forEach(id=>$(id).value=layers[activeLayer].values[id]);manual=layers[activeLayer].manual.slice();swatches();regenerate();$('status').textContent='Configuração carregada. Logo atual mantido; carregue o PNG correspondente.';
}catch(e){$('status').textContent='Configuração não carregada: '+e.message;}this.value='';};
swatches();regenerate();
loadDefaultLogo();
