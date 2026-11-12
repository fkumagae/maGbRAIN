/* FlyBrain telemetry adapter. Flee routing remains a game rule: no downstream
   escape signal was observed in the controlled experiment (see REPORT.md). */
(function (global) {
  "use strict";
  const scriptURL = document.currentScript.src;
  const flybrainRoot = new URL("../", scriptURL);
  function visualInput(distance, closingSpeed) {
    const radius = 0.5;
    const safeDistance = Math.max(
      0.8,
      Number.isFinite(distance) ? distance : 5,
    );
    const speed = Math.max(0, Number.isFinite(closingSpeed) ? closingSpeed : 0);
    const angularRate =
      (2 * radius * speed) / (safeDistance * safeDistance + radius * radius);
    return {
      distance: safeDistance,
      closingSpeed: speed,
      angularRate,
      current: 0.02 + 0.48 * Math.min(1, angularRate / 0.3),
    };
  }
  function createGuideBrain(options = {}) {
    const onSample = options.onSample || (() => {});
    const onStatus = options.onStatus || (() => {});
    let worker = null;
    let ready = false;
    let disposed = false;
    let indices = new Uint32Array();
    let groupSizes = [];
    let groupNames = [];
    let input = visualInput(5, 0);
    let lastSent = -Infinity;
    let submittedInput = { ...input };
    let samples = [];
    let step = 0;
    let lastError = null;
    let initPromise = null;
    function status(message) {
      onStatus({ ready, message, error: lastError });
    }
    function sendInput(force = false) {
      if (!ready || disposed || (!force && performance.now() - lastSent < 90))
        return;
      lastSent = performance.now();
      submittedInput = { ...input };
      worker.postMessage({
        type: "setStimulusState",
        indices,
        intensities: new Float32Array(indices.length).fill(input.current),
      });
    }
    function fail(error) {
      ready = false;
      lastError = String((error && error.message) || error);
      if (worker) worker.terminate();
      status("FlyBrain indisponível · a regra do jogo continua ativa");
    }
    function init() {
      if (initPromise) return initPromise;
      initPromise = (async () => {
        try {
          status("Carregando conectoma local…");
          const [metaResponse, binaryResponse] = await Promise.all([
            fetch(new URL("data/neuron_meta.json", flybrainRoot)),
            fetch(new URL("data/connectome.bin.gz", flybrainRoot)),
          ]);
          if (!metaResponse.ok || !binaryResponse.ok)
            throw Error("Falha no carregamento dos dados locais");
          const meta = await metaResponse.json();
          const buffer = await binaryResponse.arrayBuffer();
          if (disposed) return false;
          groupNames = meta.groups.map((group) => group.name);
          worker = new Worker(new URL("js/sim-worker.js", flybrainRoot));
          return await new Promise((resolve, reject) => {
            const timer = setTimeout(
              () => reject(Error("Tempo excedido ao iniciar o conectoma")),
              45000,
            );
            worker.onerror = (event) => {
              clearTimeout(timer);
              reject(Error(event.message || "Falha no worker"));
              fail(event.message);
            };
            worker.onmessage = ({ data }) => {
              if (disposed) return;
              if (data.type === "error") {
                clearTimeout(timer);
                reject(Error(data.message));
                fail(data.message);
                return;
              }
              if (data.type === "ready") {
                clearTimeout(timer);
                groupSizes = Array(meta.group_count).fill(0);
                const selected = [];
                const visualID = meta.groups.find(
                  (group) => group.name === "VIS_R1R6",
                ).id;
                data.groupId.forEach((group, index) => {
                  groupSizes[group]++;
                  if (group === visualID) selected.push(index);
                });
                indices = new Uint32Array(selected);
                ready = true;
                status("FlyBrain ativo · telemetria visual");
                sendInput(true);
                worker.postMessage({ type: "start" });
                resolve(true);
              }
              if (data.type === "tick") {
                const visualID = groupNames.indexOf("VIS_R1R6");
                const descendingID = groupNames.indexOf("GNG_DESC");
                const visualSpikes = data.groupSpikeCounts[visualID] || 0;
                const descendingSpikes =
                  data.groupSpikeCounts[descendingID] || 0;
                const sample = {
                  step: step++,
                  workerTick: data.tickCount,
                  ...submittedInput,
                  visualSpikes,
                  visualFraction: visualSpikes / (groupSizes[visualID] || 1),
                  descendingSpikes,
                  descendingFraction:
                    descendingSpikes / (groupSizes[descendingID] || 1),
                  otherSpikes: data.firedNeurons - visualSpikes,
                  totalSpikes: data.firedNeurons,
                  escapeSource: "game-rule",
                  usableEscapeSignal: false,
                };
                if (samples.length < 6000) samples.push(sample);
                onSample(sample);
              }
            };
            worker.postMessage({ type: "init", buffer }, [buffer]);
          });
        } catch (error) {
          fail(error);
          return false;
        }
      })();
      return initPromise;
    }
    return {
      init,
      setApproach(distance, closingSpeed) {
        input = visualInput(distance, closingSpeed);
        sendInput();
        return { ...input };
      },
      reset() {
        samples = [];
        step = 0;
        input = visualInput(5, 0);
        if (ready) {
          worker.postMessage({ type: "reset" });
          sendInput(true);
        }
      },
      getSamples() {
        return samples.map((sample) => ({ ...sample }));
      },
      get ready() {
        return ready;
      },
      get error() {
        return lastError;
      },
      usableEscapeSignal: false,
      dispose() {
        disposed = true;
        ready = false;
        if (worker) worker.terminate();
      },
    };
  }
  global.GuideBrain = { create: createGuideBrain, visualInput };
  global.createGuideBrain = createGuideBrain;
})(window);
