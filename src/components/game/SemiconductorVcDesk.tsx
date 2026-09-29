"use client";

import { useRef, useState } from "react";
import {
  advanceSemiVc, createSemiVcState, interactSemiVc, negotiateSemiVc, semiVcActiveCompany, semiVcCompanies, semiVcOfferStatus,
  semiVcDpi, semiVcExitCandidate, semiVcFundNav, semiVcLayout, semiVcPortfolioDecision,
  semiVcQuarter, semiVcTvpi, type SemiVcEvent, type SemiVcState,
} from "@/games/semiconductor-vc/model";
import styles from "./SemiconductorVcDesk.module.css";

const money = (value: number) => `$${(value / 1_000_000).toFixed(2)}m`;
const company = (id: string | null) => semiVcCompanies.find((item) => item.id === id);
const eventText: Partial<Record<SemiVcEvent, string>> = {
  founder_arrived: "A new founder entered the pipeline", founder_missed: "A founder signed elsewhere",
  diligence_complete: "Technical diligence returned", investment_made: "New position added to the fund",
  deal_passed: "Deal passed at investment committee", portfolio_alert: "Portfolio decision needs attention",
  follow_on: "Capital deployed to portfolio", follow_on_declined: "Portfolio support declined",
  staff_hired: "Analyst joined the team", exit_realized: "Liquidity event realized",
};

export function SemiconductorVcDesk() {
  const [state, setState] = useState<SemiVcState>(createSemiVcState);
  const stateRef = useRef<SemiVcState>(state);
  const [feed, setFeed] = useState<string[]>(["Fund opened · $10m committed capital"]);
  const [room, setRoom] = useState<"office" | "deals" | "updates">("office");

  function commit(next: SemiVcState, event: SemiVcEvent) {
    stateRef.current = next;
    setState(next);
    if (eventText[event]) setFeed((entries) => [`Q${semiVcQuarter(next)} · ${eventText[event]}`, ...entries].slice(0, 5));
  }

  function nextWeek() {
    if (stateRef.current.mode !== "playing") return;
    let next = stateRef.current;
    const events: string[] = [];
    for (let step = 0; step < 200 && next.mode === "playing"; step += 1) {
      const result = advanceSemiVc(next, { x: 0, y: 0 }, 0.05);
      next = result.state;
      const label = eventText[result.event];
      if (label) events.push(label);
    }
    commit(next, "none");
    setFeed((entries) => [`Week ${Math.floor(next.elapsed / 10) + 1} · ${events.length ? [...new Set(events)].join(" · ") : "Portfolio and deal flow reviewed"}`, ...entries].slice(0, 5));
  }

  function act(x: number, y: number) {
    if (stateRef.current.mode !== "playing") return;
    const current = stateRef.current;
    const handlingOtherDesk = !!current.activeDealId && (
      semiVcLayout.portfolioPads.some((pad) => pad.x === x && pad.y === y) ||
      (semiVcLayout.hire.x === x && semiVcLayout.hire.y === y) ||
      (semiVcLayout.exit.x === x && semiVcLayout.exit.y === y)
    );
    const result = interactSemiVc({ ...current, activeDealId: handlingOtherDesk ? null : current.activeDealId, playerX: x, playerY: y });
    commit(handlingOtherDesk ? { ...result.state, activeDealId: current.activeDealId, activeDealDiligenced: current.activeDealDiligenced } : result.state, result.event);
  }

  function reset() {
    const next = createSemiVcState();
    stateRef.current = next;
    setState(next);
    setFeed(["New fund opened · $10m committed capital"]);
    setRoom("office");
  }

  const active = semiVcActiveCompany(state);
  const offer = semiVcOfferStatus(state);
  const alertCompany = company(state.portfolioAlertCompanyId);
  const decision = semiVcPortfolioDecision(state);
  const holding = state.holdings.find((item) => item.companyId === state.portfolioAlertCompanyId);
  const exit = semiVcExitCandidate(state);
  const week = Math.floor(state.elapsed / 10) + 1;

  return <section className={styles.game} aria-label="Sand Hill VC fund simulation">
    <div className={styles.topbar}>
      <div><span className={styles.kicker}>SAND HILL VC / FUND I</span><h2>{room === "office" ? "Managing partner's office" : room === "deals" ? "Deal room" : "Portfolio & boardroom"}</h2></div>
      <div className={styles.clock}><span>Q{semiVcQuarter(state)} / 4</span><strong>Week {week}</strong><button onClick={nextWeek} disabled={state.mode !== "playing"}>Advance one week →</button></div>
    </div>
    <div className={styles.metrics}>
      <div><span>FUND NAV</span><strong>{money(semiVcFundNav(state))}</strong><small>Cash + unrealized positions</small></div>
      <div><span>DRY POWDER</span><strong>{money(state.dryPowder)}</strong><small>Protect your follow-on reserves</small></div>
      <div><span>TVPI / DPI</span><strong>{semiVcTvpi(state).toFixed(2)}× <em>/ {semiVcDpi(state).toFixed(2)}×</em></strong><small>Total value / realized returns</small></div>
      <div><span>REPUTATION</span><strong>{Math.round(state.reputation)}</strong><small>{state.staff} analyst{state.staff === 1 ? "" : "s"} · {money(state.operatingBudget)} ops</small></div>
    </div>
    <div className={styles.news}><span>MARKET WIRE</span><strong>{state.newsLabel ?? "Monitoring semiconductor markets and portfolio catalysts"}</strong><small>{state.newsLabel ? "Current development" : "No new headline"}</small></div>
    <nav className={styles.rooms} aria-label="Fund spaces"><button className={room === "office" ? styles.selected : ""} onClick={() => setRoom("office")}>01 · Office & research</button><button className={room === "deals" ? styles.selected : ""} onClick={() => setRoom("deals")}>02 · Deal room <span>{state.incoming.length}</span></button><button className={room === "updates" ? styles.selected : ""} onClick={() => setRoom("updates")}>03 · Portfolio updates {alertCompany ? <span className={styles.notification}>!</span> : null}</button></nav>
    {state.mode !== "playing" ? <div className={styles.result}><h3>{state.mode === "complete" ? "Fund cycle complete" : "Fund mandate lost"}</h3><p>{state.investments} investments · {state.exits} exits · {semiVcTvpi(state).toFixed(2)}× TVPI · {semiVcDpi(state).toFixed(2)}× DPI</p><button onClick={reset}>Launch another fund</button></div> : null}
    {room === "office" ? <div className={styles.office}><div className={styles.officeHero}><span className={styles.kicker}>YOUR BASE OF OPERATIONS</span><h3>Run the fund, one week at a time.</h3><p>Review the pipeline, investigate one company in depth, respond to portfolio developments, and decide when to move the calendar forward. No countdown runs while you read or plan.</p><div className={styles.officeLinks}><button onClick={() => setRoom("deals")}>Enter deal room · {state.incoming.length} waiting →</button><button onClick={() => setRoom("updates")}>Review portfolio · {state.holdings.length} holdings →</button></div></div><div className={styles.officeBrief}><span className={styles.kicker}>THIS WEEK PRIORITIES</span><p>{active ? `${active.name} is on your research desk. Complete diligence and negotiate terms in the deal room.` : state.incoming.length ? `${state.incoming.length} founder meeting${state.incoming.length === 1 ? "" : "s"} waiting in the deal room.` : "No active deal file. New opportunities may arrive next week."}</p><p>{alertCompany ? `${alertCompany.name} needs a board decision in portfolio updates.` : "No urgent board decision currently open."}</p><p>{state.newsLabel ?? "The market wire is quiet."}</p><div className={styles.operations}><span className={styles.kicker}>RESEARCH TEAM</span><p>{state.staff} analyst{state.staff === 1 ? "" : "s"} · {money(state.operatingBudget)} operating budget. More staff shortens the time between diligence reports.</p><button disabled={state.staff >= 3 || state.operatingBudget < 150_000} onClick={() => act(semiVcLayout.hire.x, semiVcLayout.hire.y)}>Hire analyst · $150k</button></div></div><div className={styles.tape}><span className={styles.kicker}>ACTIVITY TAPE</span>{feed.map((entry, index) => <p key={`${entry}-${index}`}>{entry}</p>)}</div></div> : null}
    <div className={`${styles.columns} ${room === "deals" ? styles.dealRoom : room === "updates" ? styles.updatesRoom : styles.officeRoom}`}>
      <div className={styles.mainColumn}>
        <div className={styles.sectionHead}><div><span className={styles.kicker}>01 / PIPELINE</span><h3>Incoming opportunities</h3></div><span>{state.incoming.length} live · {state.missedDeals} lost</span></div>
        <div className={styles.pipeline}>
          {state.incoming.map((visit) => { const item = company(visit.companyId); return item ? <article className={styles.deal} key={item.id}>
            <div><span className={styles.sector}>{item.sector}</span><h4>{item.name}</h4><p>{item.pitch}</p><small>{item.round} · {money(item.raiseAmount)} raise · {money(item.preMoney)} pre</small></div>
            <div className={styles.dealAction}><span className={visit.timeLeft < 10 ? styles.urgent : ""}>{Math.ceil(visit.timeLeft / 10)} weeks to meet</span><button disabled={!!active} onClick={() => act(visit.x, visit.y)}>{active ? "File occupied" : "Open file"}</button></div>
          </article> : null; })}
          {!state.incoming.length && <p className={styles.empty}>No founders waiting. Review your portfolio while the next opportunity develops.</p>}
        </div>
        <div className={styles.sectionHead}><div><span className={styles.kicker}>02 / UNDERWRITING</span><h3>{active ? active.name : "Investment committee"}</h3></div><span>{active ? active.round : "No active file"}</span></div>
        {active ? <article className={styles.file}>
          <div className={styles.fileGrid}><div><span>TECHNOLOGY</span><strong>{active.processNode}</strong></div><div><span>STAGE</span><strong>{active.designStage}</strong></div><div><span>FOUNDRY</span><strong>{active.foundry}</strong></div><div><span>DESIGN WINS</span><strong>{active.designWins}</strong></div><div><span>CUSTOMER CONCENTRATION</span><strong>{active.customerConcentrationPct}%</strong></div><div><span>NRE TO DATE</span><strong>{money(active.nreToDate)}</strong></div></div>
          <p className={styles.insight}>{state.activeDealDiligenced ? active.hiddenInsight : active.greenFlag ?? active.redFlag ?? "Request technical diligence before voting."}</p>
          <div className={styles.negotiation}><div className={styles.sectionHead}><div><span className={styles.kicker}>TERM SHEET</span><h3>{money(offer?.valuation ?? active.preMoney)} pre-money</h3></div><span className={!offer?.likely ? styles.urgent : ""}>{offer?.likely ? "Founder open to a check" : "Founder likely to reject"}</span></div><div className={styles.pressure}><span>RIVAL VC PRESSURE</span><strong>{Math.round(state.rivalPressure)}%</strong><div><i style={{ width: `${state.rivalPressure}%` }} /></div></div><p>At $500k, projected ownership is {offer?.ownership500k.toFixed(2)}%. Relationship {state.founderTrust >= 0 ? "+" : ""}{state.founderTrust}. Rival pressure rises when you advance a week; at 100%, another fund wins the allocation.</p><div className={styles.actions}><button disabled={state.negotiationCooldown > 0} onClick={() => commit(negotiateSemiVc(stateRef.current, "relationship"), "none")}>Build founder trust</button><button disabled={state.negotiationCooldown > 0} onClick={() => commit(negotiateSemiVc(stateRef.current, "terms"), "none")}>Push valuation down</button><button disabled={state.negotiationCooldown > 0} onClick={() => commit(negotiateSemiVc(stateRef.current, "accelerate"), "none")}>Improve offer / move fast</button></div>{state.negotiationCooldown > 0 ? <small>Next call available next week</small> : null}</div>
          <div className={styles.actions}><button onClick={() => act(semiVcLayout.diligence.x, semiVcLayout.diligence.y)} disabled={state.activeDealDiligenced || state.analystCooldown > 0}>{state.activeDealDiligenced ? "Diligence complete" : state.analystCooldown > 0 ? `Analyst busy ${Math.ceil(state.analystCooldown)}s` : "Run technical diligence"}</button>{semiVcLayout.icPads.map((pad) => <button key={pad.id} className={pad.check ? styles.invest : ""} disabled={pad.check > state.dryPowder} onClick={() => act(pad.x, pad.y)}>{pad.check ? `Invest ${money(pad.check)}` : "Pass"}</button>)}</div>
        </article> : <div className={styles.empty}>Select a founder to open an investment file. Advance the week when you are ready for new developments.</div>}
      </div>
      <div className={styles.sideColumn}>
        <div className={styles.sectionHead}><div><span className={styles.kicker}>03 / OWNERSHIP</span><h3>Portfolio book</h3></div><span>{state.holdings.length} holdings</span></div>
        {alertCompany && holding ? <div className={styles.alert}><div className={styles.alertTop}><span>BOARD ACTION REQUIRED</span><strong>{Math.ceil(state.portfolioAlertTimeLeft / 10)} weeks</strong></div><h4>{alertCompany.name}</h4><p>{state.portfolioAlertHeadline}</p><small>{holding.ownershipPct.toFixed(1)}% owned · {money(holding.mark)} carrying value</small>{holding.history?.length ? <small>Prior: {holding.history.slice(-2).join(" → ")}</small> : null}<div className={styles.actions}><button className={styles.invest} disabled={!decision?.available} onClick={() => act(semiVcLayout.portfolioPads[1].x, semiVcLayout.portfolioPads[1].y)}>{decision?.supportLabel}</button><button onClick={() => act(semiVcLayout.portfolioPads[0].x, semiVcLayout.portfolioPads[0].y)}>Decline</button></div></div> : null}
        <div className={styles.holdings}>{state.holdings.map((item) => { const firm = company(item.companyId); return <div className={styles.holding} key={item.companyId}><div><strong>{firm?.name}</strong><small>{firm?.sector}</small></div><div><strong>{(item.mark / item.invested).toFixed(2)}×</strong><small>{item.ownershipPct.toFixed(1)}% owned</small></div>{item.pendingEvent ? <span className={styles.next}>Next: {item.pendingEvent.replaceAll("_", " ")}</span> : null}</div>; })}{!state.holdings.length && <p className={styles.empty}>No positions yet. Returns depend on entry price, reserves, and execution.</p>}</div>
        {exit && !alertCompany ? <button className={styles.exit} onClick={() => act(semiVcLayout.exit.x, semiVcLayout.exit.y)}>Realize {company(exit.companyId)?.name} · {money(exit.mark)} → DPI</button> : null}
        <div className={styles.operations}><span className={styles.kicker}>FUND OPERATIONS</span><p>Analysts reduce diligence wait. Hiring draws on the operating budget.</p><button disabled={state.staff >= 3 || state.operatingBudget < 150_000} onClick={() => act(semiVcLayout.hire.x, semiVcLayout.hire.y)}>Hire analyst · $150k</button></div>
        <div className={styles.tape}><span className={styles.kicker}>ACTIVITY TAPE</span>{feed.map((entry, index) => <p key={`${entry}-${index}`}>{entry}</p>)}</div>
      </div>
    </div>
  </section>;
}
