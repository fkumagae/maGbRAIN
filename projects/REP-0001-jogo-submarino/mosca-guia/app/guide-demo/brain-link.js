/* Only real spike telemetry is wired here. The experiment found no downstream
   escape signal, so the visible behavioral trigger stays a game rule. */
(() => {
  if (!window.GuideDemo || !window.GuideBrain) return;
  const adapter = GuideBrain.create({
    onStatus(status) {
      GuideDemo.updateBrain({ ready: status.ready, usable: false });
      GuideDemo.brainStatus(
        status.message + " · fuga e trajeto controlados pelo jogo",
      );
    },
    onSample(sample) {
      GuideDemo.updateBrain({
        ready: true,
        activity: sample.visualFraction,
        descending: sample.descendingFraction,
        usable: false,
      });
    },
  });
  GuideDemo.attachBrain(adapter);
  adapter.init();
  window.GuideDemo.getNeuralSamples = () => adapter.getSamples();
  window.addEventListener("pagehide", () => adapter.dispose());
})();
