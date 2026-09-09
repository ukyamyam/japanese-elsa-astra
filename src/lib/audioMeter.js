export function startAudioMeter(stream, onLevel = () => {}) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return { stop: () => ({ averageRms: 0, peak: 0 }) };

  const context = new AudioContextClass();
  const analyser = context.createAnalyser();
  analyser.fftSize = 256;
  context.createMediaStreamSource(stream).connect(analyser);
  const data = new Uint8Array(analyser.frequencyBinCount);
  const samples = [];
  let frameId;

  const sample = () => {
    analyser.getByteTimeDomainData(data);
    const rms = Math.sqrt(data.reduce((sum, value) => sum + ((value - 128) / 128) ** 2, 0) / data.length);
    samples.push(rms);
    onLevel(Math.min(1, rms * 7));
    frameId = requestAnimationFrame(sample);
  };
  sample();

  return {
    stop() {
      cancelAnimationFrame(frameId);
      context.close();
      return {
        averageRms: samples.length ? samples.reduce((sum, value) => sum + value, 0) / samples.length : 0,
        peak: samples.length ? Math.max(...samples) : 0,
      };
    },
  };
}
