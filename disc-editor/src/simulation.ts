import type { RotationDirection } from './settings';

// Nominal 1× CD-DA model based on IEC 60908 §7.1–7.2.
const innerRadius = 0.025;
const outerRadius = 0.058;
const linearSpeed = 1.3;
const trackPitch = 1.6e-6;
const radialRate = trackPitch * linearSpeed / Math.PI;
export const displayFlashHz = 2;

function revolutionsPerSecond(radius: number) {
  return linearSpeed / (2 * Math.PI * radius);
}

export function cdState(progress: number, seconds = 0) {
  // The pickup advances one track pitch per turn. Therefore r² grows linearly with time.
  const startSquared = innerRadius ** 2 + (outerRadius ** 2 - innerRadius ** 2) * progress / 100;
  const startRadius = Math.sqrt(startSquared);
  const trackSeconds = Math.min(seconds, (outerRadius ** 2 - startSquared) / radialRate);
  const radius = Math.sqrt(startSquared + radialRate * trackSeconds);
  // Integrate angular velocity, then hold the outer-edge speed for inspection.
  const turns = linearSpeed * trackSeconds / (Math.PI * (startRadius + radius))
    + (seconds - trackSeconds) * revolutionsPerSecond(outerRadius);
  return { radiusMm: radius * 1000, rpm: revolutionsPerSecond(radius) * 60, turns };
}

export function strobeExposure(trigger: number, slots: number, direction: RotationDirection, rpm: number, pulseMs: number) {
  const frequency = slots * rpm / 60;
  const angle = direction * (trigger % slots) * 360 / slots;
  const sweep = direction * rpm * 6 * pulseMs / 1000;
  return { angle, sweep, frequency, dutyPercent: frequency * pulseMs / 10 };
}

export type StrobeExposure = ReturnType<typeof strobeExposure>;
