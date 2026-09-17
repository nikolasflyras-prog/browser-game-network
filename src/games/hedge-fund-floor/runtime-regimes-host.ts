import { readLocalGameValue, writeLocalGameValue } from "@/games/_shared/storage/localGameStorage";
import type { GameBridge, GameRuntimeController } from "@/games/_shared/types/runtime";
import { mountGame as mountRegimeGame } from "./runtime-regimes";

const SAVE_VERSION = 3;

export async function mountGame(mount: HTMLElement, bridge: GameBridge): Promise<GameRuntimeController> {
  const previousPosition = mount.style.position;
  if (!previousPosition) mount.style.position = "relative";

  let destroyed = false;
  let rotating = false;
  let controller = await mountRegimeGame(mount, bridge);

  const nextMandateButton = document.createElement("button");
  nextMandateButton.type = "button";
  nextMandateButton.textContent = "Next mandate";
  nextMandateButton.setAttribute("aria-label", "Start next hedge fund mandate");
  Object.assign(nextMandateButton.style, {
    position: "absolute",
    top: "8px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: "8",
    border: "1px solid rgba(217, 228, 230, 0.45)",
    borderRadius: "999px",
    background: "rgba(7, 16, 20, 0.94)",
    color: "#d9e4e6",
    font: "700 10px Arial, Helvetica, sans-serif",
    letterSpacing: "0.04em",
    padding: "6px 10px",
    cursor: "pointer",
    touchAction: "manipulation",
  });

  async function rotateMandate() {
    if (destroyed || rotating) return;
    rotating = true;
    nextMandateButton.disabled = true;
    try {
      const currentRun = readLocalGameValue<number>(bridge.gameSlug, "regime-run", SAVE_VERSION) ?? 0;
      writeLocalGameValue(bridge.gameSlug, "regime-run", SAVE_VERSION, currentRun + 1);
      controller.destroy();
      controller = await mountRegimeGame(mount, bridge);
    } finally {
      rotating = false;
      nextMandateButton.disabled = false;
    }
  }

  nextMandateButton.addEventListener("click", () => { void rotateMandate(); });
  mount.appendChild(nextMandateButton);

  return {
    pause() { controller.pause(); },
    resume() { controller.resume(); },
    restart() { controller.restart(); },
    setMuted(nextMuted: boolean) { controller.setMuted?.(nextMuted); },
    destroy() {
      destroyed = true;
      nextMandateButton.remove();
      controller.destroy();
      if (!previousPosition) mount.style.removeProperty("position");
      else mount.style.position = previousPosition;
    },
  } satisfies GameRuntimeController;
}
