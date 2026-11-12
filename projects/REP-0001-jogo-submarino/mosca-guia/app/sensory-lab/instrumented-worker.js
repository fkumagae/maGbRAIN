/* Instrumentation only: original LIF equations and weights are reused. */
importScripts('../js/sim-worker.js');
const sendOriginal = self.postMessage.bind(self);
const handleOriginal = self.onmessage;
let epoch = 0;
self.postMessage = function(message) {
  if (message.type === 'tick') {
    const peakV = new Float32Array(numGroups);
    const minV = new Float32Array(numGroups);
    for (let group = 0; group < numGroups; group++) {
      for (let neuron = groupOffset[group]; neuron < groupOffset[group + 1]; neuron++) {
        peakV[group] = Math.max(peakV[group], V[neuron]);
        minV[group] = Math.min(minV[group], V[neuron]);
      }
    }
    message.peakV = peakV;
    message.minV = minV;
    message.epoch = epoch;
    message.threshold = threshold;
  }
  sendOriginal(message);
};
self.onmessage = function(event) {
  if (event.data.type === 'reset') { epoch = event.data.epoch || 0; tickCount = 0; }
  handleOriginal(event);
};
