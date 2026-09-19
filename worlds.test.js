const test=require('node:test'),assert=require('node:assert/strict');
const C=require('./core'),W=require('./worlds');
class Storage{constructor(){this.map=new Map();}getItem(k){return this.map.get(k)||null;}setItem(k,v){this.map.set(k,v);}}
test('migrates the original airport once and retains the legacy backup',()=>{
  const storage=new Storage(),legacy=C.freshState();legacy.cash=13579;legacy.buildings.terminal=2;storage.setItem(W.LEGACY_KEY,JSON.stringify(legacy));
  const first=new W.Store(storage);assert.equal(first.read().worlds.length,1);assert.equal(first.read().worlds[0].state.cash,13579);assert.equal(first.read().worlds[0].state.buildings.terminal,2);
  const second=new W.Store(storage);assert.equal(second.read().worlds.length,1);assert.ok(storage.getItem(W.LEGACY_KEY));
});
test('worlds retain separate progression and immutable creation choices',()=>{
  const store=new W.Store(new Storage()),a=store.create({name:'Business Bay',business:true,tutorial:true}),b=store.create({name:'Cloud Nine',business:false,tutorial:false});
  a.state.cash=19000;a.state.world.business=false;a.state.world.tutorial=false;store.update(a.id,a.state);
  const record=store.read().worlds.find(w=>w.id===a.id);assert.equal(record.state.cash,19000);assert.equal(record.state.world.business,true);assert.equal(record.state.world.tutorial,true);
  assert.equal(record.state.staff.security,1);assert.equal(record.state.departures.length,2);
  assert.equal(store.read().worlds.find(w=>w.id===b.id).state.cash,0);assert.equal(store.read().worlds.find(w=>w.id===b.id).state.world.tutorial,false);
  store.rename(b.id,'  New   Horizons  ');assert.equal(store.read().worlds.find(w=>w.id===b.id).state.world.name,'New Horizons');
});
test('flight-only worlds have no economy and still record flight achievements',()=>{
  const s=C.freshState({business:false,tutorial:false}),before=JSON.stringify({cash:s.cash,expenses:s.expenses,wages:s.wages});
  for(let i=0;i<300;i++)C.tickEconomy(s,1);
  assert.equal(JSON.stringify({cash:s.cash,expenses:s.expenses,wages:s.wages}),before);assert.equal(s.completed,0);assert.equal(s.departures.length,0);assert.equal(s.seconds,300);assert.equal(C.build(s,'terminal'),false);assert.equal(C.hire(s,'cabin'),false);assert.equal(C.completeTask(s,'ground',true),false);
  const f=C.newFlight('passenger',s);f.completed=true;assert.equal(C.rewardFlight(s,f),0);assert.equal(s.missions,1);assert.equal(s.revenue,0);assert.equal(s.cash,0);assert.equal(C.rewardFlight(s,f),0);assert.equal(s.missions,1);
});
test('different tabs update their own worlds without overwriting other airports',()=>{
  const storage=new Storage(),tab1=new W.Store(storage),a=tab1.create({name:'A'}),tab2=new W.Store(storage),b=tab2.create({name:'B'});
  a.state.missions=5;tab1.update(a.id,a.state);b.state.tasks=20;tab2.update(b.id,b.state);
  const worlds=tab1.read().worlds;assert.equal(worlds.length,2);assert.equal(worlds.find(w=>w.id===a.id).state.missions,5);assert.equal(worlds.find(w=>w.id===b.id).state.tasks,20);
});
test('deleting a world only removes that world, and imports get new identities',()=>{
  const store=new W.Store(new Storage()),a=store.create({name:'A'}),b=store.add(a.state);assert.notEqual(a.id,b.id);store.remove(a.id);assert.deepEqual(store.read().worlds.map(w=>w.id),[b.id]);
});
test('unreadable saved data is not silently overwritten',()=>{
  const storage=new Storage();storage.setItem(W.KEY,'broken');const store=new W.Store(storage);store.create({name:'Temporary'});assert.equal(store.available,false);assert.equal(store.read().worlds.length,1);assert.equal(storage.getItem(W.KEY),'broken');
});
test('storage failure keeps in-session worlds available for export',()=>{
  const storage=new Storage();storage.setItem=()=>{throw new Error('quota');};const store=new W.Store(storage),a=store.create({name:'Kept in memory'});assert.equal(store.available,false);assert.equal(store.read().worlds[0].id,a.id);
});
