/* Local, self-contained game layer. Existing FlyBrain files remain untouched. */
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const T = window.THREE;
  if (!T) {
    $("error").hidden = false;
    $("error").textContent =
      "Three.js indisponível. Inicie pelo servidor local indicado no README.";
    return;
  }
  let renderer;
  try {
    renderer = new T.WebGLRenderer({ antialias: true });
  } catch (error) {
    $("error").hidden = false;
    $("error").textContent =
      "Esta demo precisa de WebGL. Tente Chrome ou Edge com aceleração gráfica.";
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.setClearColor(0x07171e);
  $("game").appendChild(renderer.domElement);
  const scene = new T.Scene();
  scene.fog = new T.FogExp2(0x07171e, 0.012);
  const camera = new T.PerspectiveCamera(
    46,
    innerWidth / innerHeight,
    0.1,
    100,
  );
  const orbit = new T.OrbitControls(camera, renderer.domElement);
  orbit.enableDamping = true;
  orbit.enablePan = false;
  orbit.minDistance = 12;
  orbit.maxDistance = 65;
  orbit.minPolarAngle = 0.28;
  orbit.maxPolarAngle = 1.25;
  function cameraHome() {
    camera.position.set(15, 19, 23).multiplyScalar(innerWidth < 700 ? 1.6 : 1);
    orbit.target.set(0, 0, -1);
    orbit.update();
  }
  cameraHome();
  scene.add(new T.HemisphereLight(0xb5e7f0, 0x142c35, 0.9));
  const sun = new T.DirectionalLight(0xd5eff1, 1.2);
  sun.position.set(3, 14, 4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {
    left: -14,
    right: 14,
    top: 14,
    bottom: -14,
  });
  scene.add(sun);
  function material(color, extra = {}) {
    return new T.MeshStandardMaterial({ color, roughness: 0.7, ...extra });
  }
  const metal = material(0x25434c),
    floorMat = material(0x24404a),
    edge = material(0x54717a),
    amber = material(0xe9a74b, { emissive: 0x9b5b18, emissiveIntensity: 0.25 });
  function box(w, h, d, x, y, z, mat, parent = scene) {
    const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  function sphere(r, x, y, z, mat, parent = scene, sx = 1, sy = 1, sz = 1) {
    const m = new T.Mesh(new T.SphereGeometry(r, 18, 12), mat);
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    m.castShadow = true;
    parent.add(m);
    return m;
  }
  function label(text, x, y, z, color = "#c9dedc", size = 1.5) {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 96;
    const g = c.getContext("2d");
    g.fillStyle = color;
    g.font = "600 35px sans-serif";
    g.textAlign = "center";
    g.fillText(text, 256, 60);
    const m = new T.Sprite(
      new T.SpriteMaterial({
        map: new T.CanvasTexture(c),
        transparent: true,
        depthTest: true,
      }),
    );
    m.position.set(x, y, z);
    m.scale.set(size, (size * 96) / 512, 1);
    scene.add(m);
    return m;
  }
  box(14, 0.3, 18, 0, -0.2, 0, floorMat);
  const grid = new T.GridHelper(14, 14, 0x6a8489, 0x36545e);
  grid.position.y = -0.035;
  scene.add(grid);
  // Rear bulkhead contains a real opening into a short maintenance corridor.
  box(10.6, 3, 0.35, -1.7, 1.5, -9, metal);
  box(0.7, 3, 0.35, 6.65, 1.5, -9, metal);
  box(1.7, 0.45, 0.35, 5.3, 2.8, -9, edge);
  box(0.3, 2.4, 18, -7, 1.2, 0, metal);
  box(0.3, 1.2, 18, 7, 0.6, 0, metal);
  for (let z = -7; z <= 7; z += 3.5) {
    box(0.16, 3, 0.2, -6.8, 1.5, z, edge);
    box(0.16, 1.5, 0.2, 6.8, 0.75, z, edge);
  }
  // Viewports: blue water behind the dry compartment.
  for (const x of [-4.8, -1.9, 1]) {
    box(2.15, 1.45, 0.12, x, 1.8, -8.78, material(0x071722));
    const water = box(
      1.85,
      1.2,
      0.13,
      x,
      1.8,
      -8.68,
      material(0x176477, { emissive: 0x13758c, emissiveIntensity: 0.55 }),
    );
    box(0.08, 1.25, 0.16, x, 1.8, -8.55, edge);
  }
  label("ABISSAL / COMPARTIMENTO SECO", -2.4, 3.6, -8.25, "#8cb5bd", 5);
  label("MANUTENÇÃO 04", 5.2, 3.2, -8.8, "#e5b876", 2.2);
  box(1.8, 0.25, 4, 5.3, -0.18, -10.6, floorMat);
  box(0.15, 2.5, 3, 4.35, 1.25, -10.5, metal);
  box(0.15, 2.5, 3, 6.25, 1.25, -10.5, metal);
  box(1.8, 2.6, 0.2, 5.3, 1.3, -12, metal);
  const door = box(1.7, 2.6, 0.18, 5.3, 1.3, -8.95, material(0x47606a));
  for (let i = 0; i < 5; i++)
    box(1.2, 0.035, 0.1, 0, 0.35 + i * 0.28, 0.12, edge, door);
  const doorLight = new T.PointLight(0xe9b05e, 0, 4);
  doorLight.position.set(5.3, 1, -8);
  scene.add(doorLight);
  // Concealing service bench and navigation obstacles.
  box(2.5, 1, 0.9, -3.2, 0.8, -4, metal);
  box(2.8, 0.15, 1.2, -3.2, 1.38, -4, edge);
  box(0.18, 1.1, 0.9, -4.3, 0.55, -4, edge);
  box(0.18, 1.1, 0.9, -2.1, 0.55, -4, edge);
  label("FILTRO / 02", -3.2, 1.8, -4, "#99bdc1", 1.7);
  box(1.2, 0.85, 1.4, 3.8, 0.425, 2.3, metal);
  box(1.3, 0.1, 1.5, 3.8, 0.9, 2.3, amber);
  const obstacles = [
    { x: -3.2, z: -4, w: 2.8, d: 1.2 },
    { x: 3.8, z: 2.3, w: 1.3, d: 1.5 },
  ];
  for (let i = 0; i < 4; i++) {
    const pipe = new T.Mesh(new T.CylinderGeometry(0.09, 0.09, 13, 12), edge);
    pipe.rotation.z = Math.PI / 2;
    pipe.position.set(0, 2.8 + i * 0.17, -8.55);
    scene.add(pipe);
  }
  // Soft moving caustic strips imply the sea outside without flooding the room.
  const motes = [];
  for (let i = 0; i < 32; i++) {
    const m = sphere(
      0.018,
      Math.sin(i * 7) * 6,
      1 + (i % 5) * 0.4,
      Math.cos(i * 3) * 8,
      material(0x7bb6bf, { emissive: 0x456e79 }),
    );
    motes.push(m);
  }
  // Player diver, with a face indicating movement direction.
  const playerMesh = new T.Group();
  scene.add(playerMesh);
  const suit = material(0xd6ded3),
    rubber = material(0x18333d),
    visor = material(0x65c7d8, {
      metalness: 0.5,
      roughness: 0.2,
      emissive: 0x153942,
    });
  box(0.48, 0.65, 0.35, 0, 0.68, 0, suit, playerMesh);
  sphere(0.26, 0, 1.15, 0, suit, playerMesh);
  sphere(0.225, 0, 1.17, -0.09, visor, playerMesh, 1, 0.7, 0.8);
  box(0.3, 0.5, 0.18, 0, 0.73, 0.27, amber, playerMesh);
  const legL = box(0.17, 0.42, 0.19, -0.15, 0.23, 0, rubber, playerMesh),
    legR = box(0.17, 0.42, 0.19, 0.15, 0.23, 0, rubber, playerMesh);
  box(0.13, 0.48, 0.16, -0.34, 0.72, 0, suit, playerMesh);
  box(0.13, 0.48, 0.16, 0.34, 0.72, 0, suit, playerMesh);
  // Deliberately enlarged fly so its reactions are legible from the game camera.
  const flyMesh = new T.Group();
  flyMesh.scale.setScalar(1.6);
  scene.add(flyMesh);
  const shell = material(0x49342b, { metalness: 0.45, roughness: 0.3 }),
    eyeMat = material(0xd68a43, { emissive: 0x9b571e, emissiveIntensity: 0.6 });
  sphere(0.16, 0, 0, 0.14, shell, flyMesh, 0.8, 0.8, 1.7);
  sphere(0.17, 0, 0.025, -0.12, shell, flyMesh);
  sphere(0.09, -0.11, 0.06, -0.23, eyeMat, flyMesh);
  sphere(0.09, 0.11, 0.06, -0.23, eyeMat, flyMesh);
  const wingMat = material(0xd8f4e7, {
    transparent: true,
    opacity: 0.65,
    side: T.DoubleSide,
    metalness: 0.15,
    roughness: 0.2,
  });
  const wingL = new T.Group(),
    wingR = new T.Group();
  flyMesh.add(wingL, wingR);
  sphere(0.24, -0.23, 0.05, 0.01, wingMat, wingL, 1.45, 0.07, 0.65);
  sphere(0.24, 0.23, 0.05, 0.01, wingMat, wingR, 1.45, 0.07, 0.65);
  for (let s of [-1, 1])
    for (let i = 0; i < 3; i++) {
      const leg = box(
        0.025,
        0.025,
        0.25,
        s * 0.15,
        -0.11,
        (i - 1) * 0.12,
        shell,
        flyMesh,
      );
      leg.rotation.y = s * 0.75;
    }
  const halo = new T.Mesh(
    new T.RingGeometry(0.4, 0.44, 40),
    new T.MeshBasicMaterial({
      color: 0xf4bb65,
      side: T.DoubleSide,
      transparent: true,
      opacity: 0.8,
    }),
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.015;
  scene.add(halo);
  const flyTag = label("MOSCA-GUIA", 0, 2, 1, "#f4c775", 1.6);
  const flyLight = new T.PointLight(0xffc16b, 0.65, 3);
  scene.add(flyLight);
  const cue = new T.Mesh(
    new T.RingGeometry(0.6, 0.69, 40),
    new T.MeshBasicMaterial({
      color: 0x8edcba,
      side: T.DoubleSide,
      transparent: true,
      opacity: 0.7,
    }),
  );
  cue.rotation.x = -Math.PI / 2;
  cue.position.set(5.3, 0.02, -7.8);
  cue.visible = false;
  scene.add(cue);
  // Bench objects visualize manual experimental currents, not neural decisions.
  const foodSource = sphere(.3, -4.8, .4, 3, amber);
  label("ODOR", -4.8, 1.1, 3, "#edb55e", 1);
  const speaker = box(.5,.7,.4,4.8,.35,-1.5,metal);
  label("VIBRAÇÃO", 4.8, 1, -1.5, "#aacbd7", 1.3);
  const benchLamp = new T.PointLight(0xffdf9d,0,10);
  benchLamp.position.set(0,3,-4);scene.add(benchLamp);
  let labStimuli = {food:0,light:0,vibration:0,touch:0};
  const keys = new Set();
  let state,
    brain = null,
    brainInfo = { ready: false, activity: 0, source: "game-rule" },
    last = performance.now(),
    accumulator = 0;
  const route = [
    { x: -0.6, z: 0.1 },
    { x: 1.6, z: -1.5 },
    { x: 2, z: -3.6 },
    { x: 3.7, z: -5.9 },
    { x: 5.3, z: -8 },
  ];
  const hide = { x: -3.2, z: -4.05 };
  const stateNames = {
    explore: "Explorando",
    flee: "Em fuga",
    hidden: "Escondida",
    resume: "Retomando o caminho",
    shelter: "No abrigo",
  };
  function record(type, extra = {}) {
    state.events.push({ time: +state.time.toFixed(3), type, ...extra });
    if (state.events.length > 300) state.events.shift();
  }
  function change(next) {
    state.flyState = next;
    state.stateAge = 0;
    record(next, { player: { ...state.player }, fly: { ...state.fly } });
  }
  function reset() {
    keys.clear();
    accumulator = 0;
    last = performance.now();
    flyMesh.rotation.set(0, 0, 0);
    playerMesh.rotation.set(0, 0, 0);
    state = {
      time: 0,
      player: { x: 0, z: 6 },
      fly: { x: 0, z: 1, y: 1.1 },
      flyState: "explore",
      stateAge: 0,
      waypoint: 0,
      speed: 0,
      closing: 0,
      stimulus: 0,
      still: 0,
      discovered: false,
      door: 0,
      cue: false,
      events: [],
      samples: [],
      sampleStep: 0,
      cooldown: 0,
    };
    record("reset");
    $("found").hidden = true;
    cameraHome();
    if (brain) brain.reset();
    brainInfo.activity = 0;
    brainInfo.descending = 0;
  }
  function collide(x, z) {
    if (x < -6.45 || x > 6.45 || z > 8.4 || z < -11.5) return true;
    if (z < -8.35 && (!state.discovered || x < 4.75 || x > 5.8)) return true;
    return obstacles.some(
      (o) =>
        Math.abs(x - o.x) < o.w / 2 + 0.32 &&
        Math.abs(z - o.z) < o.d / 2 + 0.32,
    );
  }
  function movePlayer(dx, dz) {
    const p = state.player;
    if (!collide(p.x + dx, p.z)) p.x += dx;
    if (!collide(p.x, p.z + dz)) p.z += dz;
  }
  function approachStimulus(distance, closing) {
    return Math.min(
      0.5,
      (Math.max(0, closing) / Math.max(0.8, distance)) * 0.12,
    );
  }
  function flyToward(target, speed, dt) {
    const f = state.fly,
      dx = target.x - f.x,
      dz = target.z - f.z,
      d = Math.hypot(dx, dz),
      step = Math.min(d, speed * dt);
    if (d > 0.001) {
      f.x += (dx / d) * step;
      f.z += (dz / d) * step;
      const desired = Math.atan2(-dx, -dz);
      flyMesh.rotation.y +=
        Math.atan2(
          Math.sin(desired - flyMesh.rotation.y),
          Math.cos(desired - flyMesh.rotation.y),
        ) * Math.min(1, dt * 8);
    }
    return d < 0.09;
  }
  function interact() {
    if (
      state.cue &&
      Math.hypot(state.player.x - 5.3, state.player.z + 8) < 1.9
    ) {
      if (!state.discovered) {
        state.discovered = true;
        record("discovered");
        $("found").hidden = false;
      }
    } else {
      state.noticeUntil = state.time + 2;
    }
  }
  function tick(dt) {
    state.time += dt;
    state.stateAge += dt;
    state.cooldown = Math.max(0, state.cooldown - dt);
    let dx =
      Number(keys.has("d") || keys.has("ArrowRight")) -
      Number(keys.has("a") || keys.has("ArrowLeft"));
    let dz =
      Number(keys.has("s") || keys.has("ArrowDown")) -
      Number(keys.has("w") || keys.has("ArrowUp"));
    const norm = Math.hypot(dx, dz),
      speed = keys.has("Shift") ? 4.4 : 1.1;
    const old = { ...state.player };
    if (norm) {
      dx = (dx / norm) * speed;
      dz = (dz / norm) * speed;
      movePlayer(dx * dt, dz * dt);
      playerMesh.rotation.y = Math.atan2(-dx, -dz);
    }
    const vx = (state.player.x - old.x) / dt,
      vz = (state.player.z - old.z) / dt;
    state.speed = Math.hypot(vx, vz);
    state.still = state.speed < 0.05 ? state.still + dt : 0;
    const fx = state.fly.x - state.player.x,
      fz = state.fly.z - state.player.z,
      distance = Math.hypot(fx, fz);
    state.closing =
      distance > 0.001 ? Math.max(0, (vx * fx + vz * fz) / distance) : 0;
    state.stimulus = window.GuideBrain
      ? GuideBrain.visualInput(distance, state.closing).current
      : approachStimulus(distance, state.closing);
    if (brain) brain.setApproach(distance, state.closing);
    const rule = distance < 4.2 && state.closing > 2;
    // The neural adapter may supply a tested trigger; otherwise the rule stays explicit.
    const neural = brainInfo.ready && brainInfo.usable;
    const escape = neural ? brainInfo.trigger : rule;
    if (
      ["explore", "resume", "shelter"].includes(state.flyState) &&
      state.cooldown === 0 &&
      escape
    ) {
      record("escape-trigger", {
        source: neural ? "flybrain" : "game-rule",
        distance,
        closing: state.closing,
        stimulus: state.stimulus,
      });
      change("flee");
    }
    if (state.flyState === "flee") {
      if (flyToward(hide, 4.7, dt)) change("hidden");
    } else if (state.flyState === "hidden") {
      if (state.still > 2.2 && state.stateAge > 2) {
        change("resume");
        state.cooldown = 2;
      }
    } else if (state.flyState === "explore" || state.flyState === "resume") {
      if (state.time > 3 || state.flyState === "resume") {
        if (
          flyToward(
            route[state.waypoint],
            state.flyState === "resume" ? 0.8 : 0.55,
            dt,
          )
        ) {
          state.waypoint++;
          if (state.waypoint === route.length) {
            state.waypoint = route.length - 1;
            state.cue = true;
            change("shelter");
            record("passage-cue");
          }
        }
      }
    }
    const yTarget =
      state.flyState === "hidden"
        ? 0.35
        : state.flyState === "flee"
          ? 1.6
          : state.flyState === "shelter"
            ? 0.7
            : 1.1;
    state.fly.y += (yTarget - state.fly.y) * Math.min(1, dt * 6);
    state.door += (Number(state.discovered) - state.door) * Math.min(1, dt * 3);
    if (Math.floor(state.time * 5) > state.sampleStep) {
      state.sampleStep = Math.floor(state.time * 5);
      state.samples.push({
        time: state.time,
        distance,
        closing: state.closing,
        stimulus: state.stimulus,
        activity: brainInfo.activity,
        state: state.flyState,
      });
      if (state.samples.length > 3000) state.samples.shift();
    }
  }
  function render() {
    foodSource.scale.setScalar(1 + labStimuli.food * 2);
    speaker.rotation.z = Math.sin(state.time * 40) * labStimuli.vibration * .2;
    benchLamp.intensity = labStimuli.light * 6;
    const t = state.time,
      f = state.fly;
    playerMesh.position.set(state.player.x, 0, state.player.z);
    legL.rotation.x =
      Math.sin(t * state.speed * 6) * Math.min(0.5, state.speed * 0.3);
    legR.rotation.x = -legL.rotation.x;
    flyMesh.position.set(f.x, f.y + Math.sin(t * 8) * 0.035, f.z);
    flyMesh.rotation.z = Math.sin(t * 4) * 0.06;
    wingL.rotation.z =
      Math.sin(t * (state.flyState === "hidden" ? 12 : 75)) * 0.65;
    wingR.rotation.z = -wingL.rotation.z;
    halo.position.set(f.x, 0.025, f.z);
    halo.material.opacity = state.flyState === "hidden" ? 0.12 : 0.7;
    halo.scale.setScalar(1 + Math.sin(t * 3) * 0.07);
    flyLight.position.copy(flyMesh.position);
    flyTag.position.copy(flyMesh.position).add(new T.Vector3(0, 0.7, 0));
    flyTag.visible = state.flyState !== "hidden";
    flyLight.intensity = state.flyState === "hidden" ? 0.12 : 0.65;
    door.position.x = 5.3 + state.door * 1.75;
    doorLight.intensity = state.cue ? 1 : 0;
    cue.visible = state.cue;
    cue.material.opacity = 0.5 + Math.sin(t * 3) * 0.2;
    motes.forEach(
      (m, i) =>
        (m.position.y = 1 + (i % 5) * 0.4 + Math.sin(t * 0.3 + i) * 0.12),
    );
    $("state").textContent = stateNames[state.flyState];
    $("stimulus").textContent = state.stimulus.toFixed(3);
    $("stimulusMeter").value = state.stimulus;
    $("descending").textContent = brainInfo.ready
      ? (100 * (brainInfo.descending || 0)).toFixed(2) + "%"
      : "—";
    const d = Math.hypot(f.x - state.player.x, f.z - state.player.z);
    $("distance").textContent = d.toFixed(1) + " m";
    $("neural").textContent = brainInfo.ready
      ? (100 * brainInfo.activity).toFixed(2) + "%"
      : "—";
    $("mission").textContent = state.discovered
      ? "Passagem descoberta · entrada aberta."
      : state.cue
        ? "A mosca encontrou o abrigo. Investigue a escotilha."
        : "Observe a mosca âmbar. Ela conhece outra saída.";
    $("hint").textContent =
      state.noticeUntil > t
        ? "Siga a mosca até a escotilha iluminada."
        : state.discovered
          ? "A passagem está aberta. Você pode atravessar."
          : state.flyState === "flee"
            ? "Ela se assustou. Pare e dê tempo à mosca."
            : state.flyState === "hidden"
              ? "Espere parado: a mosca está protegida sob o filtro."
              : state.flyState === "resume"
                ? "Ela voltou a voar. Siga devagar."
                : state.cue
                  ? "Aproxime-se da escotilha e pressione E / Investigar."
                  : "Aproxime-se devagar. Segure Shift para correr.";
    orbit.update();
    renderer.render(scene, camera);
  }
  function frame(now) {
    const delta = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (!document.hidden) {
      accumulator += delta;
      while (accumulator >= 1 / 60) {
        tick(1 / 60);
        accumulator -= 1 / 60;
      }
      render();
    }
    requestAnimationFrame(frame);
  }
  window.addEventListener("keydown", (e) => {
    if (
      e.target.matches("button,input,select") &&
      ["Enter", " "].includes(e.key)
    )
      return;
    if (e.target.closest("#sensoryBench")) return;
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(key))
      e.preventDefault();
    keys.add(key);
    if (!e.repeat && key === "r") reset();
    if (!e.repeat && key === "e") interact();
  });
  window.addEventListener("keyup", (e) =>
    keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key),
  );
  window.addEventListener("blur", () => keys.clear());
  document.addEventListener("visibilitychange", () => {
    keys.clear();
    last = performance.now();
    accumulator = 0;
  });
  document.querySelectorAll("[data-key]").forEach((b) => {
    b.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      keys.add(b.dataset.key);
      b.setPointerCapture(e.pointerId);
    });
    for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
      b.addEventListener(type, () => keys.delete(b.dataset.key));
  });
  $("telemetryToggle").onclick = () => {
    const expanded =
      $("telemetryToggle").getAttribute("aria-expanded") !== "true";
    $("telemetryToggle").setAttribute("aria-expanded", expanded);
    $("telemetry").classList.toggle("open", expanded);
  };
  $("reset").onclick = reset;
  $("again").onclick = reset;
  $("continue").onclick = () => { $("found").hidden = true; };
  $("interact").onclick = interact;
  window.addEventListener("resize", () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });
  reset();
  render();
  requestAnimationFrame(frame);
  window.GuideDemo = {
    reset,
    snapshot: () => JSON.parse(JSON.stringify({ ...state, brain: brainInfo })),
    getSamples: () => state.samples.slice(),
    setLabStimuli(values) { labStimuli = {...values}; },
    attachBrain(adapter) {
      brain = adapter;
    },
    updateBrain(info) {
      Object.assign(brainInfo, info);
      $("source").textContent = brainInfo.usable
        ? "Reação · FlyBrain (limiar experimental)"
        : "Reação · regra do jogo";
    },
    brainStatus(text) {
      $("brainStatus").textContent = text;
    },
  };
})();
