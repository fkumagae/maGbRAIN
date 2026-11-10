const DEG = Math.PI / 180;

const jointLimits = [
  [-150, 150],
  [-60, 120],
  [-30, 65],
  [-160, 160],
  [-90, 90],
  [-200, 200]
];

let q = [0, 0, 0, 0, 0, 0];

const ROBOT_PARAMETERS = {
  mode: "schematic",
  // Future standard DH rows: {a, d, alphaDeg, thetaOffsetDeg}.
  // Set mode="dh" and supply six rows after professor validation.
  dh: [],
  axes: ["z", "y", "y", "z", "y", "z"],
  offsetsDeg: [0,0,0,0,0,0],
  tool: [0,0,1],
  geometry: {
  H0: 140,
  H1: 160,
  L2: 250,
  DX: 43,
  DZ1: 90,
  DZ2: 117,
  Htop: 42,
  Tool: 30
  }
};
const params = ROBOT_PARAMETERS.geometry;

const paramLabels = [
  ["H0", "Base até início do ombro"],
  ["H1", "Altura até O1/O2"],
  ["L2", "Coluna principal até O3"],
  ["DX", "Offset horizontal O3 → coluna do punho"],
  ["DZ1", "Primeira subida do punho"],
  ["DZ2", "Subida até O4/O5"],
  ["Htop", "O4/O5 → O6"],
  ["Tool", "Comprimento final da ferramenta/TCP"]
];

const slidersDiv = document.getElementById("sliders");
const paramBody = document.getElementById("paramBody");

function fmt(v, n=2) {
  const x = Math.abs(v) < 1e-10 ? 0 : v;
  return x.toFixed(n);
}

function rotX(a) {
  const c = Math.cos(a), s = Math.sin(a);
  return [
    [1,0,0],
    [0,c,-s],
    [0,s,c]
  ];
}

function rotY(a) {
  const c = Math.cos(a), s = Math.sin(a);
  return [
    [c,0,s],
    [0,1,0],
    [-s,0,c]
  ];
}

function rotZ(a) {
  const c = Math.cos(a), s = Math.sin(a);
  return [
    [c,-s,0],
    [s,c,0],
    [0,0,1]
  ];
}

function matMul3(A, B) {
  const C = Array.from({length:3}, ()=>Array(3).fill(0));
  for (let i=0;i<3;i++)
    for (let j=0;j<3;j++)
      for (let k=0;k<3;k++)
        C[i][j] += A[i][k]*B[k][j];
  return C;
}

function matVec3(R, v) {
  return [
    R[0][0]*v[0] + R[0][1]*v[1] + R[0][2]*v[2],
    R[1][0]*v[0] + R[1][1]*v[1] + R[1][2]*v[2],
    R[2][0]*v[0] + R[2][1]*v[1] + R[2][2]*v[2]
  ];
}

function add3(a,b) {
  return [a[0]+b[0], a[1]+b[1], a[2]+b[2]];
}

function toT(R, p) {
  return [
    [R[0][0], R[0][1], R[0][2], p[0]],
    [R[1][0], R[1][1], R[1][2], p[1]],
    [R[2][0], R[2][1], R[2][2], p[2]],
    [0,0,0,1]
  ];
}

function rpyFromR(R) {
  const r20 = R[2][0];
  let pitch = Math.atan2(-r20, Math.sqrt(R[0][0]**2 + R[1][0]**2));
  let roll, yaw;

  if (Math.abs(Math.cos(pitch)) > 1e-8) {
    roll = Math.atan2(R[2][1], R[2][2]);
    yaw  = Math.atan2(R[1][0], R[0][0]);
  } else {
    roll = 0;
    yaw = Math.atan2(-R[0][1], R[1][1]);
  }
  return [roll/DEG, pitch/DEG, yaw/DEG];
}

// Pure serial kinematics. Local translations follow the accumulated rotation.
function forwardKinematics(angles = q) {
  let R = rotZ(0), p = [0,0,0];
  const points = [[...p]], labels = ["O0 · J1"], frames = [];
  function move(v, label) {
    p = add3(p, matVec3(R,v));
    points.push([...p]); labels.push(label);
  }
  function turn(i) {
    const rotation = {x:rotX,y:rotY,z:rotZ}[ROBOT_PARAMETERS.axes[i]];
    R = matMul3(R, rotation((angles[i]+ROBOT_PARAMETERS.offsetsDeg[i])*DEG));
    frames.push({p:[...p],R:R.map(row=>[...row])});
  }
  if (ROBOT_PARAMETERS.mode === "dh") {
    if (ROBOT_PARAMETERS.dh.length !== 6) throw Error("Forneça seis linhas DH validadas.");
    ROBOT_PARAMETERS.dh.forEach((row,i)=>{
      R = matMul3(R,rotZ((angles[i]+row.thetaOffsetDeg)*DEG));
      move([0,0,row.d], "d"+(i+1));
      move([row.a,0,0], "O"+(i+1)+" · J"+(i+1));
      R = matMul3(R,rotX(row.alphaDeg*DEG));
      frames.push({p:[...p],R:R.map(r=>[...r])});
    });
  } else {
    turn(0);
    move([0,0,params.H0], "L0");
    move([0,0,params.H1], "O1/O2 · J2");
    turn(1);
    move([0,0,params.L2], "O3 · J3");
    turn(2);
    move([params.DX,0,0], "43 mm");
    move([0,0,params.DZ1], "90 mm");
    move([0,0,params.DZ2], "O4/O5 · J4/J5");
    turn(3); turn(4);
    move([0,0,params.Htop], "O6 · J6");
    turn(5);
  }
  move(ROBOT_PARAMETERS.tool.map(v=>v*params.Tool), "TCP");
  return {T:toT(R,p),R,points,labels,frames};
}

function updateOutputs() {
  const state = forwardKinematics();
  const {T, R, points, labels} = state;
  const [roll, pitch, yaw] = rpyFromR(R);

  document.getElementById("xOut").textContent = `${fmt(T[0][3])} mm`;
  document.getElementById("yOut").textContent = `${fmt(T[1][3])} mm`;
  document.getElementById("zOut").textContent = `${fmt(T[2][3])} mm`;

  document.getElementById("rollOut").textContent = `${fmt(roll)}°`;
  document.getElementById("pitchOut").textContent = `${fmt(pitch)}°`;
  document.getElementById("yawOut").textContent = `${fmt(yaw)}°`;

  document.getElementById("matrixOut").textContent =
    T.map(row => row.map(v => fmt(v, 4).padStart(10)).join(" ")).join("\n");

  drawRobot(points, labels);
  drawSide(state);
  drawFrames3D(state);
}

function buildSliders() {
  slidersDiv.innerHTML = "";
  q.forEach((value, i) => {
    const row = document.createElement("div");
    row.className = "slider-row";

    const label = document.createElement("label");
    label.textContent = `J${i+1}`;

    const slider = document.createElement("input");
    slider.type = "range";
    slider.id = `joint-${i+1}`;
    label.htmlFor = slider.id;
    slider.min = jointLimits[i][0];
    slider.max = jointLimits[i][1];
    slider.step = 1;
    slider.value = value;

    const valueEl = document.createElement("div");
    valueEl.className = "angle-value";
    valueEl.textContent = `${value.toFixed(0)}°`;

    slider.addEventListener("input", () => {
      q[i] = Number(slider.value);
      valueEl.textContent = `${q[i].toFixed(0)}°`;
      updateOutputs();
    });

    row.append(label, slider, valueEl);
    slidersDiv.appendChild(row);
  });
}

function buildParamTable() {
  paramBody.innerHTML = "";
  for (const [key, desc] of paramLabels) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${key}</strong></td>
      <td>${desc}</td>
      <td><input type="number" step="1" value="${params[key]}" data-key="${key}"></td>
    `;
    paramBody.appendChild(tr);
  }
}

// ---------- Canvas 3D simples ----------
const canvas = document.getElementById("robotCanvas");
const ctx = canvas.getContext("2d");
let cameraYaw = -55 * DEG;
let cameraPitch = 18 * DEG;
let zoom = 0.72;
let dragging = false;
let lastX = 0, lastY = 0;

function rotatePoint(p) {
  let [x,y,z] = p;

  let cy = Math.cos(cameraYaw), sy = Math.sin(cameraYaw);
  let x1 = cy*x - sy*y;
  let y1 = sy*x + cy*y;
  let z1 = z;

  let cp = Math.cos(cameraPitch), sp = Math.sin(cameraPitch);
  let y2 = cp*y1 - sp*z1;
  let z2 = sp*y1 + cp*z1;

  return [x1, y2, z2];
}

function project(p, scale, cx, cy) {
  const [x,y,z] = rotatePoint(p);
  return [cx + x*scale, cy - z*scale, y];
}

function drawLine3D(a,b,scale,cx,cy,width=3, stroke="#c8d6e5") {
  const pa = project(a,scale,cx,cy);
  const pb = project(b,scale,cx,cy);
  ctx.beginPath();
  ctx.moveTo(pa[0],pa[1]);
  ctx.lineTo(pb[0],pb[1]);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.stroke();
}

function drawAxes(scale,cx,cy) {
  const L = 120;
  drawLine3D([0,0,0],[L,0,0],scale,cx,cy,2,"#ff5c5c");
  drawLine3D([0,0,0],[0,L,0],scale,cx,cy,2,"#57d17b");
  drawLine3D([0,0,0],[0,0,L],scale,cx,cy,2,"#5ba7ff");
}

function drawRobot(points, labels) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(rect.width*dpr);
  canvas.height = Math.round(rect.height*dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);

  const W = rect.width, H = rect.height;
  ctx.clearRect(0,0,W,H);

  ctx.strokeStyle = "#142334";
  ctx.lineWidth = 1;
  for (let i=0;i<W;i+=50) {
    ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,H); ctx.stroke();
  }
  for (let j=0;j<H;j+=50) {
    ctx.beginPath(); ctx.moveTo(0,j); ctx.lineTo(W,j); ctx.stroke();
  }

  const maxAbs = Math.max(450, ...points.flat().map(Math.abs));
  const scale = zoom * Math.min(W,H) / (1.2 * maxAbs);
  const cx = W/2, cy = H*0.83;

  drawAxes(scale,cx,cy);

  for (let i=0;i<points.length-1;i++) {
    drawLine3D(points[i], points[i+1], scale, cx, cy, i >= points.length-2 ? 4 : 6, "#dce7f1");
  }

  points.forEach((p,i) => {
    const pp = project(p,scale,cx,cy);
    ctx.beginPath();
    ctx.arc(pp[0],pp[1], labels[i] === "TCP" ? 8 : 6, 0, 2*Math.PI);
    ctx.fillStyle = labels[i] === "TCP" ? "#73d2ff" : "#ffcf70";
    ctx.fill();

    ctx.fillStyle = "#e8f0f8";
    ctx.font = labels[i] === "TCP" ? "bold 12px system-ui" : "12px system-ui";
    ctx.fillText(labels[i], pp[0]+(i%2 ? 90 : 12), pp[1]+4);
  });
}

canvas.addEventListener("pointerdown", e => {
  dragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener("pointermove", e => {
  if (!dragging) return;
  cameraYaw += (e.clientX-lastX)*0.01;
  cameraPitch += (e.clientY-lastY)*0.01;
  cameraPitch = Math.max(-1.45, Math.min(1.45, cameraPitch));
  lastX = e.clientX;
  lastY = e.clientY;
  updateOutputs();
});

canvas.addEventListener("pointerup", e => {
  dragging = false;
  canvas.releasePointerCapture(e.pointerId);
});

canvas.addEventListener("wheel", e => {
  e.preventDefault();
  zoom *= e.deltaY < 0 ? 1.08 : 0.92;
  zoom = Math.max(0.25, Math.min(3, zoom));
  updateOutputs();
}, {passive:false});

window.addEventListener("resize", updateOutputs);

document.getElementById("resetBtn").addEventListener("click", () => {
  q = [0,0,0,0,0,0];
  buildSliders();
  updateOutputs();
});

document.getElementById("applyParamsBtn").addEventListener("click", () => {
  const inputs = [...document.querySelectorAll("#paramBody input")];
  if (inputs.some(input => !input.value.trim() || !Number.isFinite(Number(input.value)) || Number(input.value) <= 0)) {
    document.getElementById("paramError").textContent = "Use comprimentos positivos e finitos.";
    return;
  }
  document.getElementById("paramError").textContent = "";
  inputs.forEach(input => {
    params[input.dataset.key] = Number(input.value);
  });
  updateOutputs();
});

document.getElementById("homeBtn").addEventListener("click", () => {
  cameraYaw=-55*DEG; cameraPitch=18*DEG; zoom=.72;
  document.getElementById("resetBtn").click();
});
canvas.addEventListener("pointercancel", () => { dragging=false; });

// Rendering consumes the same FK state as the numeric outputs.
function drawFrames3D(state) {
  const rect=canvas.getBoundingClientRect();
  const scale=zoom*Math.min(rect.width,rect.height)/(1.2*Math.max(450,...state.points.flat().map(Math.abs)));
  for (const frame of [...state.frames,{p:state.points.at(-1),R:state.R}]) {
    ["#ff7777","#68dfac","#72aaff"].forEach((color,i)=>{
      const end=add3(frame.p,frame.R.map(row=>row[i]*65));
      drawLine3D(frame.p,end,scale,rect.width/2,rect.height*.83,2,color);
    });
  }
}
function drawSide(state) {
  const c=document.getElementById("sideCanvas"), g=c.getContext("2d");
  const {width:w,height:h}=c.getBoundingClientRect(), d=devicePixelRatio||1;
  c.width=w*d;c.height=h*d;g.setTransform(d,0,0,d,0,0);
  const xs=state.points.map(p=>p[0]), zs=state.points.map(p=>p[2]);
  const minX=Math.min(-180,...xs),maxX=Math.max(250,...xs);
  const minZ=Math.min(-80,...zs),maxZ=Math.max(900,...zs);
  const scale=Math.min((w-100)/(maxX-minX),(h-70)/(maxZ-minZ));
  const project=p=>[w/2+(p[0]-(minX+maxX)/2)*scale,35+(maxZ-p[2])*scale];
  function line(a,b,color,width=2){g.beginPath();g.moveTo(...project(a));g.lineTo(...project(b));g.strokeStyle=color;g.lineWidth=width;g.stroke();}
  for(let z=0;z<=900;z+=100)line([minX,0,z],[maxX,0,z],"#1b2a39",1);
  state.points.slice(1).forEach((p,i)=>line(state.points[i],p,"#a5d4e9",5));
  const names=["L0","L1","L2","L3","L3′","L4","L5","L6"];
  state.points.forEach((p,i)=>{
    const [x,y]=project(p);g.fillStyle=i===state.points.length-1?"#73d2ff":"#ffcf70";
    g.beginPath();g.arc(x,y,4,0,Math.PI*2);g.fill();
    g.font="11px system-ui";g.fillStyle="#eaf0f6";
    g.fillText(state.labels[i],x+12,y+4);
    if(i && ROBOT_PARAMETERS.mode==="schematic"){
      const prev=state.points[i-1],mid=p.map((v,j)=>(v+prev[j])/2);
      const [mx,my]=project(mid),length=Math.hypot(...p.map((v,j)=>v-prev[j]));
      g.textAlign="right";g.fillStyle="#99adc1";g.fillText(`${names[i-1]} · ${fmt(length,0)}`,mx-16,my);g.textAlign="left";
    }
  });
  for(const frame of [state.frames[1],{p:state.points.at(-1),R:state.R}]){
    ["#ff7777","#68dfac","#72aaff"].forEach((color,i)=>line(frame.p,add3(frame.p,frame.R.map(row=>row[i]*55)),color));
  }
}
buildSliders();
buildParamTable();
updateOutputs();
