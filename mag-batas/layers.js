(function(root){
  'use strict';
  const defaults={opacity:'100',kaleido:'off',slices:'8',rotation:'0',zoom:'100',centerX:'50',centerY:'50'};
  function validate(data){
    const extra={logoOpacity:'100',textOpacity:'100',background:'#161b33'};
    if(data.version===2){
      for(const id of Object.keys(extra)){const v=data.values[id];if(typeof v!=='string'||(id==='background'?!/^#[0-9a-f]{6}$/i.test(v):!/^\d+$/.test(v)||Number(v)>100))throw Error('Ajuste inválido: '+id);extra[id]=v;}
    }
    const source=data.version===1?[{values:{...data.values,...defaults},manual:data.manual}]:data.layers;
    const active=data.version===1?0:data.activeLayer;
    if(!Array.isArray(source)||source.length<1||source.length>5||!Number.isInteger(active)||active<0||active>=source.length)throw Error('Camadas inválidas.');
    const ranges={detail:[0,100],colorCount:[2,8],opacity:[0,100],slices:[4,24],rotation:[0,360],zoom:[50,300],centerX:[0,100],centerY:[0,100]};
    const choices={style:['fractal','geometry','psychedelic','truchet'],paletteMode:['auto','manual'],kaleido:['on','off']};
    const layers=source.map(l=>{
      if(!l||!l.values||!Array.isArray(l.manual)||l.manual.length!==8||!l.manual.every(c=>typeof c==='string'&&/^#[0-9a-f]{6}$/i.test(c)))throw Error('Paleta de camada inválida.');
      const v=l.values,values={};
      for(const [id,[min,max]] of Object.entries(ranges)){if(typeof v[id]!=='string'||!/^\d+$/.test(v[id])||Number(v[id])<min||Number(v[id])>max)throw Error('Controle inválido: '+id);values[id]=v[id];}
      if(Number(v.slices)%2)throw Error('Use um número par de fatias.');
      for(const [id,allowed] of Object.entries(choices)){if(!allowed.includes(v[id]))throw Error('Opção inválida: '+id);values[id]=v[id];}
      if(typeof v.seed!=='string'||v.seed.length>160)throw Error('Seed inválida.');values.seed=v.seed;
      return {values,manual:l.manual.slice()};
    });return {values:extra,layers,activeLayer:active};
  }
  if(typeof module!=='undefined')module.exports={validate};else root.MagLayers={validate};
})(typeof window==='undefined'?globalThis:window);
