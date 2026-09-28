import Phaser from "phaser";
import { boundedWorldCamera } from "@/games/_shared/camera/worldCamera";
import { readLocalGameValue,writeLocalGameValue } from "@/games/_shared/storage/localGameStorage";
import type { GameBridge,GameRuntimeController } from "@/games/_shared/types/runtime";
import { DATA_CENTER_WORLD,advanceDataCenter,createDataCenterState,currentWorkload,dataCenterLayout,dataCenterPrompt,dataCenterReady,dataCenterScore,dataCenterStats,interactDataCenter,type DataCenterEvent,type DataCenterState,type RackType } from "./model";
const BG=0x071019,FLOOR=0x101b26,GRID=0x1c3041,INK=0xeef6ff,GREEN=0x67e2b3,YELLOW=0xffce68,RED=0xff6c7a,CYAN=0x68d8ff; const COLORS:Record<RackType,number>={compute:0xffad57,network:0x68d8ff,power:0xffd66b,cooling:0x6be4d2,storage:0xc29cff};
function clock(s:number){const v=Math.max(0,Math.ceil(s));return`${Math.floor(v/60)}:${String(v%60).padStart(2,"0")}`;}
export function mountGame(mount:HTMLElement,bridge:GameBridge):GameRuntimeController{let muted=false,audio:AudioContext|null=null,best=readLocalGameValue<number>(bridge.gameSlug,"high-score",1)??0;const tone=(f:number,d=.07)=>{if(muted||typeof window==="undefined")return;try{audio??=new AudioContext();const o=audio.createOscillator(),g=audio.createGain();o.frequency.value=f;g.gain.value=.03;o.connect(g);g.connect(audio.destination);o.start();g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+d);o.stop(audio.currentTime+d);}catch{}};
 class Scene extends Phaser.Scene{private state!:DataCenterState;private g?:Phaser.GameObjects.Graphics;private keys:Record<string,Phaser.Input.Keyboard.Key>={};private left?:Phaser.GameObjects.Text;private right?:Phaser.GameObjects.Text;private prompt?:Phaser.GameObjects.Text;private detail?:Phaser.GameObjects.Text;private bayLabels:Phaser.GameObjects.Text[]=[];private stagingLabels:Phaser.GameObjects.Text[]=[];private stationLabels:Phaser.GameObjects.Text[]=[];constructor(){super("data-center-architect");}create(){this.g=this.add.graphics();this.left=this.add.text(14,12,"",{color:"#eef6ff",fontFamily:"Arial",fontSize:"13px",fontStyle:"bold",backgroundColor:"#071019df",padding:{x:8,y:5}}).setDepth(30);this.right=this.add.text(this.scale.width-14,12,"",{color:"#eef6ff",fontFamily:"Arial",fontSize:"13px",fontStyle:"bold",align:"right",backgroundColor:"#071019df",padding:{x:8,y:5}}).setOrigin(1,0).setDepth(30);this.prompt=this.add.text(this.scale.width/2,this.scale.height-12,"",{color:"#eef6ff",fontFamily:"Arial",fontSize:"11px",fontStyle:"bold",backgroundColor:"#071019ef",padding:{x:8,y:5}}).setOrigin(.5,1).setDepth(31);this.detail=this.add.text(14,this.scale.height-12,"",{color:"#9fb0c0",fontFamily:"Arial",fontSize:"10px",backgroundColor:"#071019e8",padding:{x:7,y:5}}).setOrigin(0,1).setDepth(31);this.bayLabels=dataCenterLayout.slots.map(()=>this.add.text(0,0,"",{fontFamily:"Arial",fontSize:"10px",fontStyle:"bold",color:"#dcebf4",align:"center",backgroundColor:"#071019dd",padding:{x:3,y:2}}).setOrigin(.5,0).setDepth(12));this.stagingLabels=(Object.keys(dataCenterLayout.staging) as RackType[]).map(()=>this.add.text(0,0,"",{fontFamily:"Arial",fontSize:"10px",fontStyle:"bold",color:"#dcebf4",backgroundColor:"#071019dd",padding:{x:3,y:2}}).setOrigin(.5,0).setDepth(12));this.stationLabels=["DEPLOY", "REPAIR KITS"].map(label=>this.add.text(0,0,label,{fontFamily:"Arial",fontSize:"11px",fontStyle:"bold",color:"#dcebf4",backgroundColor:"#071019dd",padding:{x:4,y:2}}).setOrigin(.5,0).setDepth(12));if(this.input.keyboard)this.keys=this.input.keyboard.addKeys("W,A,S,D,UP,DOWN,LEFT,RIGHT,E,SPACE,R") as Record<string,Phaser.Input.Keyboard.Key>;this.input.keyboard?.on("keydown-E",()=>this.interact());this.input.keyboard?.on("keydown-SPACE",()=>this.interact());this.input.keyboard?.on("keydown-R",()=>this.reset());this.scale.on("resize",this.resize,this);this.reset();}update(_:number,d:number){if(this.state.mode!=="playing")return;const x=Number(Boolean(this.keys.D?.isDown||this.keys.RIGHT?.isDown))-Number(Boolean(this.keys.A?.isDown||this.keys.LEFT?.isDown)),y=Number(Boolean(this.keys.S?.isDown||this.keys.DOWN?.isDown))-Number(Boolean(this.keys.W?.isDown||this.keys.UP?.isDown));const r=advanceDataCenter(this.state,{x,y},d/1000);this.state=r.state;this.event(r.event);this.draw();}
 private projection(){const mobile=this.scale.width<620;if(!mobile)return{cameraX:DATA_CENTER_WORLD.width/2,cameraY:DATA_CENTER_WORLD.height/2,anchorX:this.scale.width/2,anchorY:this.scale.height/2+12,scale:Math.min((this.scale.width-42)/DATA_CENTER_WORLD.width,(this.scale.height-84)/DATA_CENTER_WORLD.height)};const scale=Math.max(.56,Math.min(.74,this.scale.width/535));return boundedWorldCamera({playerX:this.state.playerX,playerY:this.state.playerY,viewportWidth:this.scale.width,viewportHeight:this.scale.height,worldWidth:DATA_CENTER_WORLD.width,worldHeight:DATA_CENTER_WORLD.height,scale,anchorY:this.scale.height*.54});}
 private p(x:number,y:number){const c=this.projection();return{x:c.anchorX+(x-c.cameraX)*c.scale,y:c.anchorY+(y-c.cameraY)*c.scale};}
 private draw(){const g=this.g;if(!g)return;g.clear();g.fillStyle(BG,1).fillRect(0,0,this.scale.width,this.scale.height);const a=this.p(0,0),b=this.p(DATA_CENTER_WORLD.width,DATA_CENTER_WORLD.height),c=this.projection();g.fillStyle(FLOOR,1).fillRect(a.x,a.y,b.x-a.x,b.y-a.y);g.lineStyle(Math.max(.6,c.scale),GRID,.45);for(let x=0;x<=DATA_CENTER_WORLD.width;x+=80){const t=this.p(x,0),d=this.p(x,DATA_CENTER_WORLD.height);g.lineBetween(t.x,t.y,d.x,d.y);}for(let y=0;y<=DATA_CENTER_WORLD.height;y+=80){const l=this.p(0,y),r=this.p(DATA_CENTER_WORLD.width,y);g.lineBetween(l.x,l.y,r.x,r.y);}this.drawStaging();this.drawBays();this.drawStations();this.drawPlayer();const s=dataCenterStats(this.state),w=currentWorkload(this.state);this.left?.setText(`C ${s.compute}/${w.compute} · NET ${s.network}/${w.network} · ST ${s.storage}/${w.storage}\nPWR ${s.powerDraw}/${s.powerCapacity} · HEAT ${s.thermal}/${w.maxHeat} · RED ${s.redundancy}/${w.redundancy}`);this.right?.setText(`${clock(this.state.timeLeft)} RUN${this.state.workloadRunning?` · ${clock(this.state.workloadTime)} SLA`:""}\nDone ${this.state.completedWorkloads} · Budget ${this.state.budget} · Rep ${Math.round(this.state.reputation)} · Best ${best}`);this.prompt?.setText(`${dataCenterPrompt(this.state)} · WASD/ARROWS + E`);this.detail?.setText(`${w.name.toUpperCase()}${dataCenterReady(this.state)?" · READY":" · BUILDING"}${this.state.faultSlot!==null?` · FAULT BAY ${this.state.faultSlot+1}`:""}\nUptime ${this.state.uptime.toFixed(0)}s · Contract breach ${this.state.workloadBreachTime.toFixed(1)}s · Score ${dataCenterScore(this.state)}`);mount.dataset.dcX=this.state.playerX.toFixed(1);mount.dataset.dcY=this.state.playerY.toFixed(1);mount.dataset.dcCarried=this.state.carried??"";mount.dataset.dcSlots=String(this.state.slots.filter(Boolean).length);mount.dataset.dcReady=dataCenterReady(this.state)?"true":"false";mount.dataset.dcRunning=this.state.workloadRunning?"true":"false";mount.dataset.dcCompleted=String(this.state.completedWorkloads);mount.dataset.dcFault=this.state.faultSlot===null?"":String(this.state.faultSlot);mount.dataset.dcKit=this.state.carryingRepairKit?"true":"false";mount.dataset.dcMode=this.state.mode;}
 private drawStaging(){for(const [index,id] of (Object.keys(dataCenterLayout.staging) as RackType[]).entries()){const q=dataCenterLayout.staging[id],p=this.p(q.x,q.y),s=this.projection().scale;this.g?.fillStyle(COLORS[id],.15).fillRoundedRect(p.x-38*s,p.y-30*s,76*s,60*s,6);this.g?.lineStyle(2,COLORS[id],.8).strokeRoundedRect(p.x-38*s,p.y-30*s,76*s,60*s,6);this.stagingLabels[index]?.setText(id.toUpperCase()).setPosition(p.x,p.y+34*s).setScale(Math.max(.75,Math.min(1.2,s*1.4)));}}
 private drawBays(){
  const g=this.g;if(!g)return;
  const scale=this.projection().scale;
  // Route the useful adjacency links beneath the racks so the layout reads as a system.
  this.state.slots.forEach((id,i)=>{
    if(id!=="compute")return;
    const source=dataCenterLayout.slots[i];
    this.state.slots.forEach((other,j)=>{
      if(!other||(other!=="network"&&other!=="cooling"))return;
      const target=dataCenterLayout.slots[j];
      if(Math.hypot(target.x-source.x,target.y-source.y)>=230)return;
      const a=this.p(source.x,source.y),b=this.p(target.x,target.y);
      g.lineStyle(Math.max(2,4*scale),other==="network"?CYAN:GREEN,.55).lineBetween(a.x,a.y,b.x,b.y);
    });
  });
  this.state.slots.forEach((id,i)=>{
    const q=dataCenterLayout.slots[i],p=this.p(q.x,q.y),s=scale,fault=this.state.faultSlot===i;
    const color=id?COLORS[id]:0x516474;
    const pulse=fault ? .65+.25*Math.sin(this.state.elapsed*7) : .75;
    g.fillStyle(0x07131e,.98).fillRoundedRect(p.x-48*s,p.y-64*s,96*s,128*s,7);
    g.lineStyle(fault?Math.max(2,4*s):Math.max(1,2*s),fault?RED:color,pulse).strokeRoundedRect(p.x-48*s,p.y-64*s,96*s,128*s,7);
    g.fillStyle(0x233b4a,.7).fillRect(p.x-42*s,p.y-55*s,3*s,110*s).fillRect(p.x+39*s,p.y-55*s,3*s,110*s);
    if(id){
      for(let row=0;row<5;row++){
        const y=p.y+(-43+row*20)*s;
        g.fillStyle(color,.2).fillRoundedRect(p.x-35*s,y,70*s,14*s,2*s);
        g.lineStyle(Math.max(1,s),color,.6).strokeRoundedRect(p.x-35*s,y,70*s,14*s,2*s);
        if(id==="compute"){
          g.fillStyle(color,.8).fillCircle(p.x-19*s,y+7*s,4*s).fillCircle(p.x-5*s,y+7*s,4*s);
          g.fillStyle(GREEN,.9).fillCircle(p.x+24*s,y+7*s,2*s);
        }else if(id==="network"){
          for(let port=0;port<6;port++)g.fillStyle(CYAN,.75).fillRect(p.x+(-27+port*10)*s,y+4*s,6*s,5*s);
        }else if(id==="power"){
          g.fillStyle(YELLOW,.7).fillRect(p.x-25*s,y+5*s,44*s,4*s);
          g.fillStyle(GREEN,.9).fillCircle(p.x+27*s,y+7*s,3*s);
        }else if(id==="cooling"){
          g.lineStyle(Math.max(1,2*s),GREEN,.8).strokeCircle(p.x-13*s,y+7*s,5*s).strokeCircle(p.x+13*s,y+7*s,5*s);
        }else{
          for(let drive=0;drive<3;drive++)g.fillStyle(color,.85).fillRect(p.x+(-24+drive*20)*s,y+5*s,13*s,4*s);
        }
      }
    }else{
      g.lineStyle(Math.max(1,s),0x355064,.55).lineBetween(p.x-24*s,p.y-24*s,p.x+24*s,p.y+24*s);
    }
    const label=this.bayLabels[i];
    label.setText(id?`${i+1} · ${id.toUpperCase()}${fault?" !":""}`:`${i+1} · EMPTY`)
      .setColor(fault?"#ff6c7a":id?"#dcebf4":"#8199aa")
      .setPosition(p.x,p.y+68*s).setScale(Math.max(.72,Math.min(1.2,s*1.45)));
  });
 }
 private drawStations(){
  const g=this.g;if(!g)return;
  const d=this.p(dataCenterLayout.deploy.x,dataCenterLayout.deploy.y),r=this.p(dataCenterLayout.repair.x,dataCenterLayout.repair.y),s=this.projection().scale;
  g.fillStyle(GREEN,.12).fillCircle(d.x,d.y,46*s);
  g.lineStyle(Math.max(2,2*s),GREEN,.85).strokeCircle(d.x,d.y,46*s);
  if(this.state.workloadRunning){
    const progress=1-this.state.workloadTime/currentWorkload(this.state).duration;
    g.lineStyle(Math.max(3,5*s),this.state.workloadBreachTime>0?YELLOW:GREEN,1)
      .beginPath().arc(d.x,d.y,38*s,-Math.PI/2,-Math.PI/2+Math.PI*2*progress).strokePath();
  }
  this.stationLabels[0]?.setPosition(d.x,d.y+49*s).setScale(Math.max(.75,Math.min(1.2,s*1.4)));this.stationLabels[1]?.setPosition(r.x,r.y+49*s).setScale(Math.max(.75,Math.min(1.2,s*1.4)));
  g.fillStyle(YELLOW,.12).fillCircle(r.x,r.y,46*s);
  g.lineStyle(Math.max(2,2*s),YELLOW,.85).strokeCircle(r.x,r.y,46*s);
  if(this.state.faultSlot!==null){
    const f=dataCenterLayout.slots[this.state.faultSlot],a=this.p(f.x,f.y);
    g.lineStyle(Math.max(1,2*s),RED,.65).lineBetween(r.x,r.y,a.x,a.y);
  }
 }
 private drawPlayer(){const p=this.p(this.state.playerX,this.state.playerY),s=this.projection().scale;this.g?.fillStyle(0x020405,.5).fillEllipse(p.x+2*s,p.y+12*s,22*s,8*s);this.g?.fillStyle(INK,1).fillCircle(p.x,p.y-2*s,11*s);if(this.state.carried)this.g?.fillStyle(COLORS[this.state.carried],1).fillRect(p.x+8*s,p.y-17*s,13*s,12*s);if(this.state.carryingRepairKit)this.g?.fillStyle(YELLOW,1).fillRect(p.x-21*s,p.y-17*s,12*s,10*s);}
 private interact(){const r=interactDataCenter(this.state);this.state=r.state;this.event(r.event);this.draw();}
 private event(e:DataCenterEvent){if(e==="rack_picked")tone(540);else if(e==="rack_placed"){tone(680);bridge.emit("game_action",{action:"rack_placed",slots:this.state.slots.filter(Boolean).length});}else if(e==="deploy_started"){tone(820,.12);bridge.emit("level_completed",{action:"workload_deployed",workload:currentWorkload(this.state).id});bridge.setStatus("Workload live — keep SLA capacity green while failures arrive");}else if(e==="deploy_blocked")tone(180);else if(e==="fault"){tone(145,.15);bridge.setStatus(`Rack fault in bay ${(this.state.faultSlot??0)+1} — get the repair kit`);}else if(e==="repair_started")tone(720);else if(e==="workload_complete"){tone(880,.13);bridge.setStatus(`Contract settled · budget ${this.state.budget} · breach ${this.state.workloadBreachTime.toFixed(1)}s`);}else if(e==="session_complete")this.end();}
 private end(){const score=dataCenterScore(this.state);best=Math.max(best,score);writeLocalGameValue(bridge.gameSlug,"high-score",1,best);bridge.emit("game_over",{score,completed_workloads:this.state.completedWorkloads,uptime:this.state.uptime,sla_breach_seconds:this.state.slaBreaches});bridge.setStatus(`Data center run complete · ${this.state.completedWorkloads} workloads · score ${score}`);}
 private reset(){this.state=createDataCenterState((Date.now()^0x45c0de)>>>0);this.draw();bridge.setStatus("Data Center Architect live — install racks, deploy workloads, and repair failures");bridge.emit("game_started",{mode:"walkable-data-center"});}private resize(){this.right?.setPosition(this.scale.width-14,12);this.prompt?.setPosition(this.scale.width/2,this.scale.height-12);this.detail?.setPosition(14,this.scale.height-12);this.draw();}}
 const game=new Phaser.Game({type:Phaser.AUTO,parent:mount,backgroundColor:BG,scene:[Scene],scale:{mode:Phaser.Scale.RESIZE,width:"100%",height:"100%"},render:{antialias:true,pixelArt:false}});return{pause(){game.scene.pause("data-center-architect");bridge.setStatus("Paused");},resume(){game.scene.resume("data-center-architect");bridge.setStatus("Data Center Architect resumed");},restart(){game.scene.stop("data-center-architect");game.scene.start("data-center-architect");},setMuted(v:boolean){muted=v;},destroy(){game.destroy(true);void audio?.close();audio=null;}} satisfies GameRuntimeController;
}
