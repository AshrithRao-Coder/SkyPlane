// Deterministic input controller used only to verify that the complete training circuit is flyable.
const C=require('./core.js');
const s=C.freshState();s.settings.difficulty=process.argv[3]||'easy';
const f=C.newFlight(process.argv[2]||'training',s),clamp=C.clamp;
let events=[];
for(let i=0;i<60*900;i++){
  const approach=f.gate>=f.gates.length;
  const landingConfig=f.gate>=f.gates.length-2;
  const target=f.gates[f.gate]||{x:0,y:Math.max(0,f.z*.055),z:f.z-400};
  let desiredSpeed=landingConfig?34:48;
  let wantedThrottle=clamp(.6+(desiredSpeed-f.speed)*.035,.05,1);
  if(f.engineFailure)wantedThrottle=1;
  let desiredPitch,desiredRoll=0;
  if(!f.airborne){wantedThrottle=1;f.flaps=1;desiredPitch=f.speed>33?.14:0;}
  else{
    f.gear=landingConfig;f.flaps=landingConfig?2:0;
    const bearing=Math.atan2(target.x-f.x,-(target.z-f.z));
    const delta=Math.atan2(Math.sin(bearing-f.yaw),Math.cos(bearing-f.yaw));
    desiredRoll=clamp(delta*1.2,-.5,.5);
    const desiredVy=approach?clamp((target.y-f.y)*.15-f.speed*.055,-3.2,-.6):clamp((target.y-f.y)*.08,-3.5,5);
    const neededLift=(9.81+(desiredVy-f.vy)*1.2)*1250;
    const neededCl=neededLift/(.5*1.225*Math.max(25,f.airSpeed)**2*16.2*Math.cos(f.roll));
    desiredPitch=clamp(Math.atan2(f.vy,Math.max(f.airSpeed,25))+(neededCl-.35-f.flaps*.24)/4.1,-.24,.23);
    if(approach&&f.y<12)desiredRoll=clamp(desiredRoll,-.12,.12);
  }
  if(f.onGround&&f.airborne){wantedThrottle=0;desiredPitch=0;desiredRoll=0;}
  const control={throttle:clamp((wantedThrottle-f.throttle)*8,-1,1),pitch:clamp((desiredPitch-f.pitch)*6,-1,1),roll:clamp((desiredRoll-f.roll)*5,-1,1),brake:approach&&f.onGround};
  const result=C.stepFlight(f,control,1/60,s.settings);events.push(...result);
  for(const e of result)if(e.type==='gate'||e.type==='crash'||e.type==='complete'||e.type==='touchdown')console.log(e.type,Math.round(f.time),f.gate,{x:Math.round(f.x),y:Math.round(f.y),z:Math.round(f.z),speed:Math.round(f.speed)},e.reason||'');
  if(f.crashed||f.completed)break;
}
console.log('RESULT',f.type,s.settings.difficulty,f.completed?'complete':f.crashed?'crashed':'incomplete',{gate:f.gate,total:f.gates.length,time:f.time,health:f.health});
if(!f.completed)process.exitCode=1;
