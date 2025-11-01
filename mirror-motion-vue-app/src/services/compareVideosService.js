function computeEnvelopeFromSamples(samples, sampleRate, frameWindowMs = 50) {
  const frameLen = Math.max(1, Math.floor((sampleRate * frameWindowMs) / 1000));
  const frames = Math.max(1, Math.floor(samples.length / frameLen));
  const env = new Array(frames);
  for (let i = 0; i < frames; i++) {
    const start = i * frameLen;
    const end = Math.min(samples.length, start + frameLen);
    let sum = 0;
    for (let j = start; j < end; j++) sum += samples[j] * samples[j];
    const mean = sum / (end - start);
    env[i] = Math.sqrt(mean);
  }
  return env;
}

/**
 * Cross-correlation to find best lag between two envelopes
 */
function crossCorrelate(a, b, maxLagFrames) {
  console.log("crossCorre", a, b);
  let best = { lag: 0, score: -Infinity };
  for (let lag = -maxLagFrames; lag <= maxLagFrames; lag++) {
    let num = 0,
      sumA2 = 0,
      sumB2 = 0,
      count = 0;
    for (let i = 0; i < a.length; i++) {
      const j = i + lag;
      if (j < 0 || j >= b.length) continue;
      const va = a[i],
        vb = b[j];
      num += va * vb;
      sumA2 += va ** 2;
      sumB2 += vb ** 2;
      count++;
    }
    if (count === 0) continue;
    const denom = Math.sqrt(sumA2 * sumB2);
    const score = denom > 0 ? num / denom : 0;
    if (score > best.score) best = { lag, score };
  }
  return best;
}

async function getAudioData(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  console.log("arrayBuffer for", url, "is", arrayBuffer);
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  // Get mono channel (or pick left/right if you prefer)
  const channelData = audioBuffer.getChannelData(0);
  return {
    samples: channelData,
    sampleRate: audioBuffer.sampleRate,
    duration: audioBuffer.duration,
  };
}

/**
 * Compute approximate offset (seconds) between two videos (reference and practice) based on audio
 */
export async function computeAudioOffset(refVideoUrl, practiceVideoUrl) {
  const frameWindowMs = 50;
  const maxLagSec = 10;

  const [refData, pracData] = await Promise.all([
    getAudioData(refVideoUrl),
    getAudioData(practiceVideoUrl),
  ]);

  const envA = computeEnvelopeFromSamples(
    refData.samples,
    refData.sampleRate,
    frameWindowMs
  );
  const envB = computeEnvelopeFromSamples(
    pracData.samples,
    pracData.sampleRate,
    frameWindowMs
  );

  const audioFrameRate = 1000 / frameWindowMs; // 20 fps for audio analysis
  const maxLagFrames = Math.floor(maxLagSec * audioFrameRate);
  const { lag, score } = crossCorrelate(envA, envB, maxLagFrames);
  const offsetSeconds = lag / audioFrameRate;

  // Compute start frames in audio envelope units (50ms)
  const referenceStartAudioFrame = Math.max(
    0,
    Math.floor(-offsetSeconds * audioFrameRate)
  );
  const practiceStartAudioFrame = Math.max(
    0,
    Math.floor(offsetSeconds * audioFrameRate)
  );

  // Total frames in audio envelope units
  const refTotalAudioFrames = envA.length;
  const pracTotalAudioFrames = envB.length;

  // Available frames after offset (in audio units)
  const availableRef = Math.max(
    0,
    refTotalAudioFrames - referenceStartAudioFrame
  );
  const availablePrac = Math.max(
    0,
    pracTotalAudioFrames - practiceStartAudioFrame
  );

  // Matched length in audio envelope units
  const matchedAudioLength = Math.max(0, Math.min(availableRef, availablePrac));

  // Convert to milliseconds for pose detection (which wants 100ms intervals)
  const poseFrameIntervalMs = 100; // 10 fps for pose detection
  const referenceStartMs = referenceStartAudioFrame * frameWindowMs;
  const practiceStartMs = practiceStartAudioFrame * frameWindowMs;
  const matchedDurationMs = matchedAudioLength * frameWindowMs;

  // Calculate pose frame indices (10 fps)
  const poseFrameRate = 1000 / poseFrameIntervalMs;
  const referenceStartPoseFrame = Math.floor(
    (referenceStartMs * poseFrameRate) / 1000
  );
  const referenceEndPoseFrame = Math.floor(
    ((referenceStartMs + matchedDurationMs) * poseFrameRate) / 1000
  );
  const practiceStartPoseFrame = Math.floor(
    (practiceStartMs * poseFrameRate) / 1000
  );
  const practiceEndPoseFrame = Math.floor(
    ((practiceStartMs + matchedDurationMs) * poseFrameRate) / 1000
  );

  return {
    offsetSeconds,
    score,
    envA,
    envB,
    // Frame numbers for 100fps pose detection
    referenceStartFrame: referenceStartPoseFrame,
    referenceEndFrame: referenceEndPoseFrame,
    practiceStartFrame: practiceStartPoseFrame,
    practiceEndFrame: practiceEndPoseFrame,
    matchedAudioLength,
  };
}
