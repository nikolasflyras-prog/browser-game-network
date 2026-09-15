import type { Depot, SwitchyardAction } from "./simulation";

export type YardPoint = { x: number; y: number };
export type ControlBox = YardPoint & { width: number; height: number };

export type SwitchyardLayout = {
  compact: boolean;
  start: YardPoint;
  root: YardPoint;
  left: YardPoint;
  right: YardPoint;
  depots: Record<Depot, YardPoint>;
  controls: Record<SwitchyardAction, ControlBox>;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function switchyardLayout(width: number, height: number): SwitchyardLayout {
  const compact = width < 520;
  const center = width / 2;
  const rootY = clamp(height * 0.23, 118, 150);
  const branchY = clamp(height * 0.38, rootY + 72, 230);
  const controlsTop = compact ? height - 132 : height - 82;
  const depotY = clamp(height * 0.59, branchY + 70, controlsTop - 48);
  const horizontalSpread = Math.min(145, width * 0.23);
  const buttonWidth = compact ? Math.min(138, width * 0.4) : 90;
  const buttonHeight = 44;

  const controls: Record<SwitchyardAction, ControlBox> = compact
    ? {
        A: { x: width * 0.28, y: height - 104, width: buttonWidth, height: buttonHeight },
        B: { x: width * 0.72, y: height - 104, width: buttonWidth, height: buttonHeight },
        C: { x: width * 0.28, y: height - 52, width: buttonWidth, height: buttonHeight },
        HOLD: { x: width * 0.72, y: height - 52, width: buttonWidth, height: buttonHeight },
      }
    : {
        A: { x: center - 157.5, y: height - 48, width: buttonWidth, height: buttonHeight },
        B: { x: center - 52.5, y: height - 48, width: buttonWidth, height: buttonHeight },
        C: { x: center + 52.5, y: height - 48, width: buttonWidth, height: buttonHeight },
        HOLD: { x: center + 157.5, y: height - 48, width: buttonWidth, height: buttonHeight },
      };

  return {
    compact,
    start: { x: center, y: 82 },
    root: { x: center, y: rootY },
    left: { x: center - horizontalSpread, y: branchY },
    right: { x: center + horizontalSpread, y: branchY },
    depots: {
      0: { x: width * 0.15, y: depotY },
      1: { x: width * 0.37, y: depotY },
      2: { x: width * 0.63, y: depotY },
      3: { x: width * 0.85, y: depotY },
    },
    controls,
  };
}
