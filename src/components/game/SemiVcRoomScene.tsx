"use client";

import styles from "./SemiVcRoomScene.module.css";

type Room = "office" | "deals" | "updates";

export function SemiVcRoomScene({ room, week, headline, holdingCount, dealCount, onInspect, onTravel }: {
  room: Room;
  week: number;
  headline: string;
  holdingCount: number;
  dealCount: number;
  onInspect: () => void;
  onTravel: (room: Room) => void;
}) {
  return <div className={`${styles.scene} ${styles[room]}`} aria-label={`First-person view of ${room === "office" ? "the managing partner's office" : room === "deals" ? "the deal room" : "the portfolio boardroom"}`}>
    <div className={styles.ceiling} /><div className={styles.backWall} /><div className={styles.leftWall} /><div className={styles.rightWall} /><div className={styles.floor} />
    {room === "office" ? <div className={styles.window}><div className={styles.skyline}><i /><i /><i /><i /><i /><i /></div></div> : null}
    <div className={styles.wallLines} />
    <div className={styles.wallPlaque}>{room === "office" ? "MANAGING PARTNER" : room === "deals" ? "INVESTMENT COMMITTEE" : "PORTFOLIO OPERATIONS"}</div>
    {room === "office" ? <><div className={styles.wallDisplay}><span>FUND I / WEEKLY BRIEF</span><strong>WEEK {week.toString().padStart(2, "0")}</strong><small>{headline}</small></div><div className={styles.shelf}><i /><i /><i /><i /><i /></div><div className={styles.table}><div className={styles.tableTop} /><div className={styles.tableFront} /><div className={styles.tableLegLeft} /><div className={styles.tableLegRight} /></div><div className={styles.terminal}><div className={styles.terminalScreen}><span>RESEARCH TERMINAL</span><i /><i /><i /></div><div className={styles.terminalStand} /></div><div className={styles.paper}><i /><i /><i /></div></> : null}
    {room === "deals" ? <><div className={styles.dealBoard}><span>DEAL FLOW / WEEK {week}</span><div><i>INBOUND<br />{dealCount}</i><i>DILIGENCE<br />ACTIVE</i><i>IC<br />PENDING</i></div><small>{headline}</small></div><div className={styles.conferenceTable}><div className={styles.conferenceTop}><i /><i /><i /><i /></div><div className={styles.conferenceEdge} /></div><div className={styles.chairLeft} /><div className={styles.chairRight} /><div className={styles.pitchScreen}><span>FOUNDER PRESENTATION</span><strong>{dealCount ? "MEETINGS AVAILABLE" : "AWAITING DEALS"}</strong></div></> : null}
    {room === "updates" ? <><div className={styles.portfolioWall}><span>PORTFOLIO / LIVE OPERATIONS</span><strong>{holdingCount} ACTIVE POSITIONS</strong><div className={styles.chart}><i /><i /><i /><i /><i /><i /><i /></div><small>{headline}</small></div><div className={styles.alertRail}><span>BOARD AGENDA</span><i>01 · FINANCING</i><i>02 · FAB / YIELD</i><i>03 · CUSTOMER MILESTONES</i></div><div className={styles.boardTable}><div /><i /><i /></div></> : null}
    <button className={styles.inspect} onClick={onInspect}>{room === "office" ? "Open research desk" : room === "deals" ? "Review founder files" : "Open board materials"} <span>↗</span></button>
    <div className={styles.doorway}><div className={styles.doorLight} /><span>{room === "office" ? "CORRIDOR" : room === "deals" ? "BACK TO OFFICE" : "BACK TO OFFICE"}</span></div>
    <button className={styles.travel} onClick={() => onTravel(room === "office" ? "deals" : "office")}>{room === "office" ? "Enter deal room →" : "← Return to office"}</button>
    {room === "office" ? <button className={styles.travelOther} onClick={() => onTravel("updates")}>Portfolio room →</button> : null}
    <div className={styles.caption}><span>FUND I · {room.toUpperCase()}</span><strong>{room === "office" ? "Your decisions start here." : room === "deals" ? "The next company is waiting." : "Every position has a story."}</strong></div>
  </div>;
}
