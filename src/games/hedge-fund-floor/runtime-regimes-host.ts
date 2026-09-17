import { readLocalGameValue, writeLocalGameValue } from "@/games/_shared/storage/localGameStorage";
import type { GameBridge, GameRuntimeController } from "@/games/_shared/types/runtime";
import { regimeForRun } from "./regimes";
import { mountGame as mountRegimeGame } from "./runtime-regimes";

const SAVE_VERSION = 3;

export async function mountGame(mount: HTMLElement, bridge: GameBridge): Promise<GameRuntimeController> {
  let destroyed = false;
  let rotating = false;
  let controller = await mountRegimeGame(mount, bridge);

  const mandateBar = document.createElement("div");
  mandateBar.dataset.fundMandateBar = "true";
  Object.assign(mandateBar.style, {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    minHeight: "38px",
    padding: "5px 10px",
    borderTop: "1px solid rgba(217, 228, 230, 0.16)",
    borderBottom: "1px solid rgba(217, 228, 230, 0.16)",
    background: "#071014",
    color: "#a9bdc2",
    font: "700 10px Arial, Helvetica, sans-serif",
    letterSpacing: "0.035em",
    boxSizing: "border-box",
  });

  const mandateLabel = document.createElement("span");
  mandateLabel.dataset.fundMandateLabel = "true";

  const nextMandateButton = document.createElement("button");
  nextMandateButton.type = "button";
  nextMandateButton.textContent = "Next mandate";
  nextMandateButton.setAttribute("aria-label", "Start next hedge fund mandate");
  nextMandateButton.dataset.fundMandateControl = "next";
  Object.assign(nextMandateButton.style, {
    border: "1px solid rgba(217, 228, 230, 0.55)",
    borderRadius: "999px",
    background: "#10191d",
    color: "#d9e4e6",
    font: "700 10px Arial, Helvetica, sans-serif",
    letterSpacing: "0.04em",
    padding: "6px 10px",
    minHeight: "30px",
    cursor: "pointer",
    touchAction: "manipulation",
    whiteSpace: "nowrap",
  });

  const updateMandateLabel = () => {
    const run = readLocalGameValue<number>(bridge.gameSlug, "regime-run", SAVE_VERSION) ?? 0;
    mandateLabel.textContent = `FUND MANDATE · ${regimeForRun(run).label}`;
  };
  updateMandateLabel();

  async function rotateMandate() {
    if (destroyed || rotating) return;
    rotating = true;
    nextMandateButton.disabled = true;
    try {
      const currentRun = readLocalGameValue<number>(bridge.gameSlug, "regime-run", SAVE_VERSION) ?? 0;
      writeLocalGameValue(bridge.gameSlug, "regime-run", SAVE_VERSION, currentRun + 1);
      controller.destroy();
      controller = await mountRegimeGame(mount, bridge);
      updateMandateLabel();
    } finally {
      rotating = false;
      nextMandateButton.disabled = false;
    }
  }

  nextMandateButton.addEventListener("click", () => { void rotateMandate(); });
  mandateBar.append(mandateLabel, nextMandateButton);
  mount.parentElement?.insertBefore(mandateBar, mount);

  return {
    pause() { controller.pause(); },
    resume() { controller.resume(); },
    restart() { controller.restart(); },
    setMuted(nextMuted: boolean) { controller.setMuted?.(nextMuted); },
    destroy() {
      destroyed = true;
      mandateBar.remove();
      controller.destroy();
    },
  } satisfies GameRuntimeController;
}
