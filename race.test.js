const test=require('node:test'),assert=require('node:assert/strict');
const C=require('./core'),W=require('./worlds');
class Storage{constructor(){this.map=new Map();}getItem(k){return this.map.get(k)||null;}setItem(k,v){this.map.set(k,v);}}
// Same deterministic controller as flight-circuit.cjs, kept here so a race can be completed in a test.
function fly(s,type,destination=null){
  const f=C.newFlight(type,s,destination),clamp=C.clamp,trace=[];let sample=0,reacquire=false;C.sampleGhost(f,trace);
  for(let i=0;i<60*900&&!f.crashed&&!f.completed;i++){
    const approach=f.gate>=f.gates.length,landingConfig=f.gate>=f.gates.length-2,fin=f.islands[f.finish],target=f.gates[f.gate]||{x:fin.x,y:Math.max(0,(f.z-fin.z)*.055),z:f.z-400};
    let wantedThrottle=clamp(.6+((landingConfig?34:48)-f.speed)*.035,.05,1),desiredPitch,desiredRoll=0;
    if(!f.airborne){wantedThrottle=1;f.flaps=1;desiredPitch=f.speed>33?.14:0;}
    else{
      f.gear=landingConfig;f.flaps=landingConfig?2:0;
      const bearing=Math.atan2(target.x-f.x,-(target.z-f.z)),delta=Math.atan2(Math.sin(bearing-f.yaw),Math.cos(bearing-f.yaw));
      desiredRoll=clamp(delta*1.5,-.5,.5);if(!approach&&Math.abs(delta)>.6)desiredRoll=Math.sign(delta)*.6;
      // If a gate has been overshot and is close behind, fly straight to open the distance instead of orbiting it.
      const gateDistance=Math.hypot(target.x-f.x,target.z-f.z);if(!approach&&Math.abs(delta)>2&&gateDistance<700)reacquire=true;if(reacquire){desiredRoll=Math.sign(delta)*.2;if(gateDistance>800||approach)reacquire=false;}
      const desiredVy=approach?clamp((target.y-f.y)*.15-f.speed*.055,-3.2,-.6):clamp((target.y-f.y)*.08,-3.5,5);
      const neededCl=(9.81+(desiredVy-f.vy)*1.2)*1250/(.5*1.225*Math.max(25,f.airSpeed)**2*16.2*Math.cos(f.roll));
      desiredPitch=clamp(Math.atan2(f.vy,Math.max(f.airSpeed,25))+(neededCl-.35-f.flaps*.24)/4.1,-.24,.23);
      if(approach&&f.y<12)desiredRoll=clamp(desiredRoll,-.12,.12);
    }
    if(f.onGround&&f.airborne){wantedThrottle=0;desiredPitch=0;desiredRoll=0;}
    C.stepFlight(f,{throttle:clamp((wantedThrottle-f.throttle)*8,-1,1),pitch:clamp((desiredPitch-f.pitch)*6,-1,1),roll:clamp((desiredRoll-f.roll)*5,-1,1),brake:approach&&f.onGround},1/60,s.settings);
    sample+=1/60;if(sample>=1/C.GHOST_RATE){sample-=1/C.GHOST_RATE;C.sampleGhost(f,trace);}
  }
  return {f,trace};
}
test('competitive worlds have no business, no tutorial, and keep their terrain',()=>{
  const s=C.freshState({name:'Summit',mode:'competitive',terrain:'alpine',tutorial:true});
  assert.equal(s.world.mode,'competitive');assert.equal(s.world.business,false);assert.equal(s.world.tutorial,false);assert.equal(s.world.terrain,'alpine');
  assert.equal(s.cash,0);assert.equal(s.departures.length,0);assert.equal(C.build(s,'terminal'),false);
  const again=C.sanitize(JSON.parse(JSON.stringify(s)));assert.equal(again.world.mode,'competitive');assert.equal(again.world.terrain,'alpine');assert.equal(again.world.tutorial,false);
  assert.equal(C.freshState({terrain:'moon'}).world.terrain,'island');assert.equal(C.freshState({mode:'nonsense'}).world.mode,'business');
  assert.equal(C.freshState({business:false}).world.mode,'flight');assert.equal(C.sanitize({version:1,world:{business:false}}).world.mode,'flight');
});
test('finishing a race stores a record with a ghost trace and only faster laps replace it',()=>{
  const s=C.freshState({mode:'competitive'});s.course={gates:4,radius:700,altitude:120,direction:'left'};
  const first=fly(s,'race');assert.equal(first.f.completed,true,'controller should complete the race');
  assert.equal(C.rewardFlight(s,first.f,first.trace),0);assert.equal(first.f.newRecord,true);assert.equal(s.bestRace,first.f.time);assert.equal(s.cash,0);
  assert.ok(s.raceRecord);assert.equal(s.raceRecord.time,first.f.time);assert.equal(s.raceRecord.trace.length%6,0);assert.ok(s.raceRecord.trace.length>=6*2);assert.equal(s.raceRecord.gateTimes.length,first.f.gates.length);
  const start=C.ghostAt(s.raceRecord,0),end=C.ghostAt(s.raceRecord,1e6);
  assert.ok(Math.abs(start.x)<1&&Math.abs(start.z-750)<1,'ghost starts on the runway');assert.equal(end.finished,true);assert.ok(end.y<10,'ghost ends on the ground');
  const slower={...first.f,time:first.f.time+20,rewardPaid:false};C.rewardFlight(s,slower,first.trace);assert.equal(slower.newRecord,false);assert.equal(s.bestRace,first.f.time);
  const faster={...first.f,time:first.f.time-5,rewardPaid:false};C.rewardFlight(s,faster,first.trace);assert.equal(faster.newRecord,true);assert.equal(s.bestRace,first.f.time-5);assert.equal(s.raceRecord.time,first.f.time-5);
  const store=new W.Store(new Storage()),record=store.create({mode:'competitive'});store.update(record.id,s);
  const saved=store.read().worlds[0].state;assert.equal(saved.raceRecord.time,s.raceRecord.time);assert.equal(saved.raceRecord.trace.length,s.raceRecord.trace.length);
});
test('broken race records are dropped and never crash a save',()=>{
  const base=C.freshState({mode:'competitive'});
  for(const bad of [null,5,{time:10},{time:10,trace:[1,2,3]},{time:-1,trace:new Array(12).fill(0)},{time:10,trace:new Array(12).fill('x')}]){
    const s=C.sanitize({...JSON.parse(JSON.stringify(base)),raceRecord:bad});assert.equal(s.raceRecord,null);
  }
  const s=C.sanitize({...JSON.parse(JSON.stringify(base)),bestRace:0,raceRecord:{time:42,trace:new Array(24).fill(1),gateTimes:[3,'no',9]}});
  assert.equal(s.raceRecord.time,42);assert.equal(s.bestRace,42);assert.deepEqual(s.raceRecord.gateTimes,[3,9]);assert.equal(C.ghostAt(null,3),null);
  const flightOnly=C.sanitize({...JSON.parse(JSON.stringify(C.freshState({mode:'flight'}))),raceRecord:{time:42,trace:new Array(24).fill(1)}});assert.equal(flightOnly.raceRecord,null);
});
test('every map keeps the runway on land, resolves by id, and has a race the controller can finish',()=>{
  assert.equal(C.MAPS.length,20);
  for(const terrain of Object.keys(C.TERRAINS))assert.equal(C.mapsFor(terrain).length,5,terrain+' should have five maps');
  for(const m of C.MAPS){
    const [cx,cz,rx,rz]=m.land[0];
    for(const [x,z] of [[0,-1150],[0,1150],[450,-640],[640,300],[-130,0],[-92,560]])assert.ok(((x-cx)/(rx*.9))**2+((z-cz)/(rz*.9))**2<1,`${m.id}: airport point ${x},${z} is off the main landmass`);
    const s=C.freshState({map:m.id,mode:'competitive'});s.settings.difficulty='normal';
    assert.equal(s.world.map,m.id);assert.equal(s.world.terrain,m.terrain);assert.deepEqual(s.course,m.course);
    const gates=C.newFlight('race',s).gates;
    for(let i=1;i<gates.length;i++){const a=gates[i-1],b=gates[i],overTerrain=[0,.5,1].some(t=>C.terrainHeight(m,a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t)>0);if(!overTerrain)assert.ok(b.y-a.y<=Math.hypot(b.x-a.x,b.z-a.z)*.085+.01,`${m.id}: gate ${i} climbs too steeply`);}
    for(const type of Object.keys(C.MISSIONS)){const {f}=fly(C.freshState({map:m.id,mode:'flight'}),type);assert.equal(f.completed,true,`${m.id} ${type} (${m.race.shape}) could not be completed: gate ${f.gate}/${f.gates.length}${f.crashed?' crashed':''}`);}
  }
  assert.equal(C.freshState({map:'nope',terrain:'desert'}).world.map,'desert-dunes');assert.equal(C.sanitize({version:1,world:{terrain:'alpine'}}).world.map,'alpine-valley');
  assert.equal(C.sanitize({version:1,world:{map:'arctic-fjord'}}).world.terrain,'arctic');
});
test('scenery is solid and routes stay clear of it',()=>{
  const canyon=C.MAPS.find(m=>m.id==='desert-canyon'),volcano=C.MAPS.find(m=>m.id==='island-volcano');
  assert.ok(C.terrainHeight(canyon,-1500,-1300)>200,'mesa wall has height');assert.equal(C.terrainHeight(canyon,0,0),0,'runway area is flat');
  assert.ok(C.terrainHeight(volcano,-900,-2500)>800,'volcano summit is tall');assert.ok(C.terrainHeight(volcano,-900,-2500)>C.terrainHeight(volcano,-500,-2500),'slopes fall away from the peak');
  const s=C.freshState({map:'island-volcano',mode:'flight'}),f=C.newFlight('passenger',s);
  Object.assign(f,{x:-700,y:150,z:-2500,vx:-40,vy:0,vz:0,airborne:true,onGround:false,gear:false,throttle:1});
  let events=[];for(let i=0;i<60*5&&!f.crashed;i++)events.push(...C.stepFlight(f,{throttle:1},1/60,s.settings));
  assert.equal(f.crashed,true);assert.ok(events.some(e=>e.type==='crash'&&/terrain/.test(e.reason)));
  for(const m of C.MAPS)for(const radius of [700,1600])for(const direction of ['left','right'])for(const gates of [4,12]){
    const w=C.freshState({map:m.id,mode:'competitive'});w.course={gates,radius,altitude:220,direction};const g=C.newFlight('race',w).gates;
    for(let i=1;i<g.length;i++)for(let t=0;t<=1;t+=.05){const x=g[i-1].x+(g[i].x-g[i-1].x)*t,z=g[i-1].z+(g[i].z-g[i-1].z)*t,y=g[i-1].y+(g[i].y-g[i-1].y)*t,th=C.terrainHeight(m,x,z);if(th>0)assert.ok(y-th>=100,`${m.id} r${radius} ${direction} g${gates}: route only ${Math.round(y-th)} m above terrain`);}
  }
});
test('destination flights cross to another island; flight-only worlds remember where you parked',()=>{
  let seed=11;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const s=C.freshState({map:'island-seabreeze',mode:'flight',tutorial:false});s.settings.difficulty='normal';
  const dest=C.pickDestination(s,'passenger',rnd);assert.ok(dest&&dest.map!=='island-seabreeze');const d=Math.hypot(dest.dx,dest.dz);assert.ok(d>10000&&d<13000,'destination 10.5–12.5 km away');
  const out=fly(s,'passenger',dest);assert.equal(out.f.islands.length,2);assert.equal(out.f.finish,1);assert.equal(out.f.completed,true,'passenger crossing should complete');
  assert.ok(Math.abs(out.f.x-dest.dx)<31&&Math.abs(out.f.z-dest.dz)<1000,'stopped on the destination runway');
  C.rewardFlight(s,out.f);assert.deepEqual(s.trip,{map:dest.map,dx:dest.dx,dz:dest.dz});assert.equal(C.currentMap(s).id,dest.map);
  // circuits now fly around the island you are parked on, and a return flight is offered
  const circuit=C.newFlight('race',s);assert.equal(circuit.islands.length,1);assert.equal(circuit.islands[0].map.id,dest.map);
  const back=C.pickDestination(s,'return',rnd);assert.deepEqual(back,{map:'island-seabreeze',dx:-dest.dx,dz:-dest.dz});
  const home=fly(s,'return',back);assert.equal(home.f.completed,true,'return flight should complete');C.rewardFlight(s,home.f);assert.equal(s.trip,null);
  // saves keep the trip, and a business world never has one
  const again=C.sanitize(JSON.parse(JSON.stringify({...s,trip:{map:dest.map,dx:1000,dz:2000}})));assert.deepEqual(again.trip,{map:dest.map,dx:1000,dz:2000});
  const biz=C.freshState({map:'island-seabreeze',mode:'business'});const bizDest=C.pickDestination(biz,'cargo',rnd);const trip=fly(biz,'cargo',bizDest);assert.equal(trip.f.completed,true);
  const cash=biz.cash;C.rewardFlight(biz,trip.f);assert.equal(biz.trip,null);assert.ok(biz.cash>cash,'business pays the cargo reward');assert.equal(C.pickDestination(biz,'return',rnd),null);
  assert.equal(C.sanitize(JSON.parse(JSON.stringify({...biz,trip:{map:'desert-dunes',dx:1,dz:1}}))).trip,null);
});
test('free flight has every island, no gates, and refuels on any runway without ending the flight',()=>{
  const s=C.freshState({name:'Open',mode:'free',map:'alpine-lake',tutorial:true});
  assert.equal(s.world.mode,'free');assert.equal(s.world.tutorial,false);assert.equal(s.world.business,false);
  const f=C.newFlight('free',s);assert.equal(f.islands.length,20);assert.equal(f.islands[0].map.id,'alpine-lake');assert.equal(f.gates.length,0);
  const ids=new Set(f.islands.map(i=>i.map.id));assert.equal(ids.size,20);
  for(let i=1;i<f.islands.length;i++)for(let j=i+1;j<f.islands.length;j++)assert.ok(Math.hypot(f.islands[i].x-f.islands[j].x,f.islands[i].z-f.islands[j].z)>9000,'islands do not overlap');
  // Land on another island's runway: fuel refills, the flight continues.
  const isle=f.islands[3];Object.assign(f,{x:isle.x,y:6,z:isle.z-600,vx:0,vy:-1,vz:30,yaw:Math.PI,airborne:true,onGround:false,gear:true,fuel:30,flaps:2});
  const events=[];for(let i=0;i<60*4;i++)events.push(...C.stepFlight(f,{throttle:-1,brake:false},1/60,s.settings));
  assert.ok(events.some(e=>e.type==='touchdown'),'touched down');assert.ok(events.some(e=>e.type==='refuel'&&e.island===3),'refuelled on island 3');
  assert.ok(f.fuel>99.5);assert.equal(f.completed,false);assert.equal(f.crashed,false);assert.equal(C.runwayAt(f),3);
});
