"use strict";
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const zlib = require("node:zlib");
const crypto = require("node:crypto");
const root = path.resolve(__dirname, "..");
const code = fs.readFileSync(path.join(root, "js/sim-worker.js"), "utf8");
const compressed = fs.readFileSync(path.join(root, "data/connectome.bin.gz"));
const raw = zlib.gunzipSync(compressed);
const meta = JSON.parse(
  fs.readFileSync(path.join(root, "data/neuron_meta.json"), "utf8"),
);
const config = {
  dt: 0.1,
  ticks: 120,
  repetitions: 3,
  startDistance: 5,
  minDistance: 0.8,
  approachSeconds: 3,
  objectRadius: 0.5,
  angularRateScale: 0.3,
  maxCurrent: 0.5,
  baselineCurrent: 0.02,
  leakRate: 0.95,
  threshold: 1,
  refractoryPeriod: 3,
  conditions: [
    { name: "stationary", speed: 0 },
    { name: "slow", speed: 1.1 },
    { name: "fast", speed: 4.4 },
  ],
};
let latest;
const ctx = {
  performance,
  console,
  setTimeout: () => 0,
  self: {
    postMessage: (m) => {
      if (m.type === "tick")
        latest = {
          tick: m.tickCount,
          spikes: Array.from(m.groupSpikeCounts),
          total: m.firedNeurons,
        };
    },
  },
};
vm.createContext(ctx);
vm.runInContext(code, ctx);
ctx.parseBinary(
  raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength),
);
ctx.buildGroupStructures();
const ids = [];
for (let i = 0; i < ctx.N; i++) if (ctx.groupId[i] === 0) ids.push(i);
function send(data) {
  ctx.self.onmessage({ data });
}
function input(distance, speed) {
  const angularRate =
    (2 * config.objectRadius * Math.max(speed, 0)) /
    (distance * distance + config.objectRadius ** 2);
  return {
    angularRate,
    current:
      config.baselineCurrent +
      (config.maxCurrent - config.baselineCurrent) *
        Math.min(1, angularRate / config.angularRateScale),
  };
}
const records = [];
for (let repetition = 1; repetition <= config.repetitions; repetition++)
  for (const condition of config.conditions) {
    send({ type: "reset" });
    ctx.tickCount = 0;
    let distance = config.startDistance;
    for (let step = 0; step < config.ticks; step++) {
      const time = step * config.dt;
      const closingSpeed =
        time < config.approachSeconds && distance > config.minDistance
          ? condition.speed
          : 0;
      distance = Math.max(
        config.minDistance,
        distance - closingSpeed * config.dt,
      );
      const stimulus = input(distance, closingSpeed);
      send({
        type: "setStimulusState",
        indices: new Uint32Array(ids),
        intensities: new Float32Array(ids.length).fill(stimulus.current),
      });
      ctx.tick();
      records.push({
        condition: condition.name,
        repetition,
        step,
        time,
        distance,
        closingSpeed,
        ...stimulus,
        ...latest,
      });
    }
  }
const summary = config.conditions.map((c) => {
  const rows = records.filter((r) => r.condition === c.name);
  const groups = meta.groups
    .map((g) => ({
      id: g.id,
      name: g.name,
      neurons: meta.group_sizes[g.id],
      peakSpikes: Math.max(...rows.map((r) => r.spikes[g.id] || 0)),
      totalSpikes: rows.reduce((s, r) => s + (r.spikes[g.id] || 0), 0),
    }))
    .filter((g) => g.totalSpikes);
  return {
    condition: c.name,
    groups,
    peakInput: Math.max(...rows.map((r) => r.current)),
    totalSpikes: rows.reduce((s, r) => s + r.total, 0),
  };
});
const payload = {
  configuration: config,
  source: {
    worker: "../js/sim-worker.js",
    workerSHA256: crypto.createHash("sha256").update(code).digest("hex"),
    connectome: "../data/connectome.bin.gz",
    connectomeSHA256: crypto
      .createHash("sha256")
      .update(compressed)
      .digest("hex"),
    neurons: ctx.N,
    edges: ctx.edgeCount,
    groupNames: meta.groups.map((g) => g.name),
  },
  summary,
  samples: records,
};
fs.writeFileSync(
  path.join(__dirname, "results.json"),
  JSON.stringify(payload, null, 2) + "\n",
);
console.log(JSON.stringify(summary, null, 2));
