const test=require('node:test');
const assert=require('node:assert/strict');
const C=require('./core.js');
function run(s,seconds){for(let i=0;i<seconds*60;i++)C.tickEconomy(s,1/60);}
test('the starter airline is profitable and reaches the first milestone',()=>{
  const s=C.freshState();run(s,360);
  assert.ok(s.completed>=5);assert.ok(s.passengers>100);assert.equal(s.milestone,true);assert.ok(s.cash>24000);assert.ok(s.expenses>0);assert.ok(s.wages>0);
});
test('missing employees block their service; player tasks can clear it',()=>{
  const s=C.freshState();s.staff.security=0;run(s,120);
  assert.equal(s.completed,0);assert.ok(s.departures.some(d=>d.stage===1));
  assert.equal(C.completeTask(s,'security',true),true);assert.equal(C.completeTask(s,'security',true),false);
  run(s,13);C.completeTask(s,'security',true);run(s,55);assert.ok(s.completed>0);
});
test('expansions consume money, alter capacity, and respect their limits',()=>{
  const s=C.freshState();const before=s.cash;assert.equal(C.build(s,'hangar'),true);assert.equal(s.departures.length,3);assert.equal(s.cash,before-7000);
  s.cash=0;assert.equal(C.build(s,'terminal'),false);assert.equal(C.hire(s,'engineer'),false);
  s.cash=1e6;while(C.build(s,'runway')){}assert.equal(s.buildings.runway,2);
});
test('valid saves round trip, malformed fields are constrained',()=>{
  const s=C.freshState();C.build(s,'terminal');run(s,90);
  const restored=C.sanitize(JSON.parse(JSON.stringify(s)));assert.equal(restored.cash,s.cash);assert.deepEqual(restored.buildings,s.buildings);
  const dirty=C.sanitize({version:1,cash:'oops',staff:{security:999},settings:{graphics:'impossible'},course:{radius:-1},departures:[null]});
  assert.equal(dirty.cash,24000);assert.equal(dirty.staff.security,8);assert.equal(dirty.settings.graphics,'low');assert.equal(dirty.course.radius,700);assert.ok(dirty.departures[0].code);
  assert.throws(()=>C.sanitize({version:99}));
});
test('a clear-weather takeoff is possible with takeoff flaps and rotation',()=>{
  const s=C.freshState(),f=C.newFlight('training',s);f.flaps=1;
  for(let i=0;i<60*55;i++){
    const pitch=f.speed>33&&f.pitch<.14?1:f.pitch>.18?-.3:0;
    C.stepFlight(f,{throttle:1,pitch},1/60,s.settings);
    if(f.y>40){f.gear=false;f.flaps=0;}
    if(f.crashed)break;
  }
  assert.equal(f.crashed,false);assert.equal(f.airborne,true);assert.ok(f.y>50);assert.ok(f.airSpeed>25);assert.ok(f.fuel<100);
});
test('flight dynamics are independent of mission difficulty',()=>{
  const a=C.freshState(),b=C.freshState();b.settings.difficulty='hard';const fa=C.newFlight('training',a),fb=C.newFlight('training',b);
  for(let i=0;i<600;i++){C.stepFlight(fa,{throttle:1},1/60,a.settings);C.stepFlight(fb,{throttle:1},1/60,b.settings);}
  assert.equal(fa.z,fb.z);assert.equal(fa.y,fb.y);assert.notEqual(fa.gateRadius,fb.gateRadius);
});
test('low airspeed and a high angle of attack produce a stall',()=>{
  const s=C.freshState(),f=C.newFlight('training',s);Object.assign(f,{y:200,vz:-15,pitch:.4,onGround:false,airborne:true});C.stepFlight(f,{},1/60,s.settings);assert.equal(f.stall,true);assert.ok(f.vy<0);
});
test('runway touchdown requires gear, gentle descent, and level wings',()=>{
  const s=C.freshState();
  const good=C.newFlight('training',s);Object.assign(good,{y:2.01,vy:-1,vz:-30,onGround:false,airborne:true,gate:good.gates.length});C.stepFlight(good,{},1/60,s.settings);assert.equal(good.crashed,false);assert.equal(good.onGround,true);
  const bad=C.newFlight('training',s);Object.assign(bad,{y:2.01,vy:-1,vz:-30,gear:false,onGround:false,airborne:true});C.stepFlight(bad,{},1/60,s.settings);assert.equal(bad.crashed,true);
  const water=C.newFlight('training',s);Object.assign(water,{x:2000,y:2.01,vy:-1,vz:-30,onGround:false,airborne:true});C.stepFlight(water,{},1/60,s.settings);assert.equal(water.crashed,true);
});
test('a completed circuit and safe stop pay exactly once',()=>{
  const s=C.freshState(),f=C.newFlight('training',s);Object.assign(f,{airborne:true,gate:f.gates.length});C.stepFlight(f,{brake:true},1/60,s.settings);assert.equal(f.completed,true);
  assert.equal(C.rewardFlight(s,f),1200);assert.equal(C.rewardFlight(s,f),0);assert.equal(s.tutorialDone,true);assert.equal(s.missions,1);
});
test('custom circuits honour gate count and direction',()=>{
  const left=C.makeRoute('race',{gates:12,radius:900,altitude:220,direction:'left'});const right=C.makeRoute('race',{gates:12,radius:900,altitude:220,direction:'right'});
  assert.equal(left.length,15);assert.equal(left[3].x,-right[3].x);assert.equal(left.at(-1).x,0);assert.equal(left.at(-2).x,0);
});
