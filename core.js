/* Sky Plane's deterministic game rules. No browser or third-party dependencies. */
(function (root) {
  'use strict';
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const finite = (v, fallback, min = 0, max = 1e9) => Number.isFinite(v) ? clamp(v, min, max) : fallback;
  const STAFF = {
    checkin: { name: 'Check-in agents', initial: 'C', role: 'Check-in receptionist', description: 'Check documents and get passengers ready to board.', wage: 65, hire: 600, stage: 0 },
    security: { name: 'Security officers', initial: 'S', role: 'Security guard', description: 'Screen baggage and keep the terminal moving.', wage: 75, hire: 700, stage: 1 },
    ground: { name: 'Ground crew', initial: 'G', role: 'Ground crew', description: 'Load baggage, refuel aircraft, and prepare departures.', wage: 70, hire: 650, stage: 2 },
    cabin: { name: 'Cabin crew', initial: 'F', role: 'Cabin crew', description: 'Improve passenger satisfaction and ticket revenue by 6% each (up to 30%).', wage: 55, hire: 500 },
    engineer: { name: 'Aircraft engineers', initial: 'E', role: 'Aircraft engineer', description: 'Cut aircraft operating costs by 8% each (up to 40%).', wage: 80, hire: 800 }
  };
  const BUILDINGS = {
    terminal: { name: 'Passenger terminal', icon: 'build', price: 5000, description: 'More seats, more smiles. Each expansion adds 12 passengers to every scheduled flight.', benefit: '+12 passengers / flight', max: 4 },
    hangar: { name: 'Aircraft hangar', icon: 'plane', price: 7000, description: 'Room for a bigger operation. Add another flight to your scheduled departure queue.', benefit: '+1 scheduled aircraft', max: 3 },
    runway: { name: 'Runway extension', icon: 'grid', price: 10000, description: 'A longer runway gives you more room to take off and land. Adds 10% to mission rewards.', benefit: '+300 m runway · +10% mission pay', max: 2 },
    radar: { name: 'Control & radar tower', icon: 'chart', price: 3500, description: 'Coordinate traffic more efficiently. Every service stage runs 15% faster per tower level.', benefit: '+15% turnaround speed', max: 3 },
    fuel: { name: 'Fuel depot', icon: 'box', price: 3000, description: 'Store fuel on the island. Lower scheduled flight operating costs by 10% per level.', benefit: '−10% flight operating costs', max: 3 },
    rescue: { name: 'Emergency station', icon: 'shield', price: 4500, description: 'Build a dedicated rescue base. Rescue missions earn 20% more per level.', benefit: '+20% emergency mission pay', max: 2 }
  };
  const MISSIONS = {
    training: { title: 'Your first solo', category: 'FLIGHT SCHOOL', description: 'Learn to taxi, take off, follow a gentle circuit, and land back on the island.', reward: 1200, duration: '5–8 MIN', icon: 'book', label: 'Guided circuit', aircraft: 'Kestrel 172', gates: 4 },
    passenger: { title: 'The island connection', category: 'PASSENGER', description: 'Carry your passengers across the water to a neighbouring island and land on its runway 36.', reward: 2600, duration: '5–8 MIN', icon: 'users', label: 'Island hop', aircraft: 'Comet 320', gates: 5, destination: true },
    cargo: { title: 'Precious cargo', category: 'CARGO', description: 'Deliver delicate research equipment to a neighbouring island. Steep banks and hard landings damage the shipment.', reward: 3100, duration: '5–8 MIN', icon: 'box', label: 'Fragile delivery', aircraft: 'Hauler 208', gates: 5, destination: true },
    military: { title: 'Coastline patrol', category: 'MILITARY', description: 'Fly an unarmed patrol and inspect coastal waypoints. Stay within the marked surveillance corridors.', reward: 2800, duration: '6–9 MIN', icon: 'shield', label: 'Coastal reconnaissance', aircraft: 'Sentinel T6', gates: 6 },
    emergency: { title: 'A helping wing', category: 'EMERGENCY', description: 'Rush medical supplies to a neighbouring island. Prepare for reduced engine power halfway across the water.', reward: 3500, duration: '5–8 MIN', icon: 'shield', label: 'Medical delivery', aircraft: 'Rescue Caravan', gates: 5, destination: true },
    'return': { title: 'Homeward bound', category: 'RETURN FLIGHT', description: 'Fly back across the water to your own island and land on your home runway.', reward: 0, duration: '4–7 MIN', icon: 'arrow', label: 'Fly home', aircraft: 'Comet 320', gates: 5, destination: true },
    race: { title: 'Seabreeze air rally', category: 'AIR RACING', description: 'Race the clock through floating gates. Real lift, drag, and stall physics still apply. Land to finish.', reward: 3000, duration: '5–9 MIN', icon: 'plane', label: 'Timed circuit', aircraft: 'Swift R3', gates: 8 }
  };
  const ROLES = {
    manager: { name: 'Airport manager', short: 'Manager', initial: 'M', description: 'Set the strategy. Build, hire, and balance the books.', icon: 'chart' },
    pilot: { name: 'Pilot', short: 'Pilot', initial: 'P', description: 'Take the controls and earn money flying missions.', icon: 'plane' },
    checkin: { name: 'Check-in receptionist', short: 'Check-in', initial: 'C', description: 'Check tickets, documents, and baggage allowances.', icon: 'users' },
    security: { name: 'Security guard', short: 'Security', initial: 'S', description: 'Inspect bags and identify restricted items.', icon: 'shield' },
    cabin: { name: 'Cabin crew', short: 'Cabin crew', initial: 'F', description: 'Prepare the cabin and look after your passengers.', icon: 'users' },
    ground: { name: 'Ground crew', short: 'Ground crew', initial: 'G', description: 'Load the right cargo and prepare aircraft safely.', icon: 'box' },
    engineer: { name: 'Aircraft engineer', short: 'Engineer', initial: 'E', description: 'Inspect aircraft and choose the right repair.', icon: 'gear' }
  };
  const DESTINATIONS = ['Pinecrest', 'Coral Bay', 'Northhaven', 'Maple Coast', 'Cloudbridge', 'Port Willow'];
  function newDeparture(id, index = 0) {
    return { id, code: 'SP ' + (100 + id), destination: DESTINATIONS[(id - 1) % DESTINATIONS.length], stage: 0, progress: 0, wait: index * 18, passengers: 28 + (id % 3) * 4 };
  }
  function worldName(value) { return typeof value==='string' ? value.replace(/[\x00-\x1f\x7f]/g,'').replace(/\s+/g,' ').trim().slice(0,40)||'Untitled airport' : 'Seabreeze Island'; }
  const MODES = {
    business: { name: 'Airport business', short: 'Business', description: 'Run the airport, hire your crew, balance the books, and fly missions.' },
    flight: { name: 'Flight only', short: 'Flight only', description: 'A ready-to-fly airport. All missions, no budgets, wages, or management.' },
    competitive: { name: 'Competitive', short: 'Time trial', description: 'One track, one timer. Beat your record and race your own ghost.' },
    free: { name: 'Free flight', short: 'Free flight', description: 'All twenty islands in one open sky. No missions, no business — just fly.' }
  };
  const SOLO_MODES=['competitive','free'];
  const TERRAINS = {
    island: { name: 'Seabreeze Island', short: 'Island', description: 'A green island with sandy beaches and warm seas.' },
    desert: { name: 'Dunes & mesas', short: 'Desert', description: 'Red rock, golden sand, and cactus groves under a hot sky.' },
    alpine: { name: 'Alpine valley', short: 'Alpine', description: 'Pine forests and snow-capped peaks around a mountain lake.' },
    arctic: { name: 'Polar outpost', short: 'Arctic', description: 'Snowfields, icy waters, and pale northern light.' }
  };
  function worldMode(options) { if (options && Object.hasOwn(MODES, options.mode)) return options.mode; return options?.business===false ? 'flight' : 'business'; }
  function worldTerrain(value) { return Object.hasOwn(TERRAINS, value) ? value : 'island'; }
  // Maps: the runway always sits at the origin heading north (physics never changes); each map
  // arranges land, water, mountains, and its own race circuit around it. land = [cx, cz, rx, rz]
  // ellipses (the first must cover the airport), mountains = descriptors resolved in world.js.
  const ARC={shape:'arc'},COURSE={gates:8,radius:950,altitude:220,direction:'left'};
  const MAPS=[
    {id:'island-seabreeze',terrain:'island',name:'Seabreeze Island',description:'The classic: one green island, sandy coves, and a gentle circuit over the bay.',land:[[0,0,900,1350]],mountains:[{kind:'cluster',x:-3400,z:-450,n:12,sx:1300,sz:2450,r:450,h:250},{kind:'wall',x0:2500,z0:-4200,x1:4700,z1:-3450,n:6,r:650,h:700}],race:ARC,course:COURSE,boat:[-1450,-1500],cabins:[-370,300]},
    {id:'island-crescent',terrain:'island',name:'Crescent Atoll',description:'A lagoon ringed by islets. The circuit loops low over the turquoise water.',land:[[350,0,950,1500],[-1500,-2000,520,430],[-1900,-800,380,560],[-1500,500,440,380],[-700,1500,520,380]],mountains:[{kind:'peak',x:3400,z:-2600,r:900,h:520},{kind:'cluster',x:3200,z:900,n:4,sx:900,sz:1400,r:380,h:260}],race:{shape:'loop',cx:-900,cz:-700},course:{gates:9,radius:1050,altitude:160,direction:'left'},boat:[-900,-700],cabins:[-450,-1100]},
    {id:'island-peninsula',terrain:'island',name:'Longshore Peninsula',description:'A long finger of land pointing north. Slalom out along the spine and back down the coast.',land:[[250,100,950,1550],[150,-1900,560,1100],[50,-3300,420,800]],mountains:[{kind:'peak',x:50,z:-3300,r:260,h:110},{kind:'cluster',x:-3200,z:800,n:5,sx:1000,sz:1800,r:420,h:240}],race:{shape:'slalom'},course:{gates:10,radius:1000,altitude:180,direction:'left'},boat:[-1500,-2400],cabins:[-380,-200]},
    {id:'island-twin',terrain:'island',name:'Twin Harbours',description:'Two big islands and a busy strait. The figure-eight crosses the water twice every lap.',land:[[300,100,950,1500],[-2000,-1000,1000,1150]],mountains:[{kind:'peak',x:-2200,z:-1300,r:520,h:420},{kind:'cluster',x:2900,z:-2200,n:6,sx:900,sz:1600,r:400,h:300}],race:{shape:'figure8'},course:{gates:12,radius:1200,altitude:200,direction:'left'},boat:[-900,-300],cabins:[-1600,-1300]},
    {id:'island-volcano',terrain:'island',name:'Ember Peak',description:'A sleeping volcano dominates the north. The circuit climbs around its slopes.',land:[[150,100,1000,1500],[-900,-2400,1200,1000]],mountains:[{kind:'peak',x:-900,z:-2500,r:820,h:780,color:'#7c6a5a'},{kind:'peak',x:-900,z:-2500,r:300,h:900,color:'#5c4b45'},{kind:'cluster',x:3100,z:-800,n:5,sx:900,sz:2400,r:420,h:320}],race:{shape:'climb',cx:-900,cz:-2400,minR:1000},trainingDirection:'right',course:{gates:9,radius:1300,altitude:320,direction:'left'},boat:[-1700,300],cabins:[-450,700]},
    {id:'desert-dunes',terrain:'desert',name:'Dunes & Mesas',description:'Golden sand, red rock, and cactus groves. A classic circuit over the flats.',land:[[0,0,900,1350]],mountains:[{kind:'cluster',x:-3400,z:-450,n:10,sx:1300,sz:2450,r:450,h:180},{kind:'cluster',x:-3500,z:-300,n:5,sx:1800,sz:4200,r:340,mesa:true,h:150},{kind:'wall',x0:2500,z0:-4200,x1:4700,z1:-3450,n:6,r:650,h:500}],race:ARC,course:COURSE,cabins:[-370,300]},
    {id:'desert-canyon',terrain:'desert',name:'Red Canyon',description:'Sheer mesa walls line a canyon north of the field. Thread the slalom between them.',land:[[0,-400,1300,2600]],mountains:[{kind:'wall',x0:-1500,z0:-1300,x1:-1650,z1:-5200,n:8,r:360,mesa:true,h:260},{kind:'wall',x0:1500,z0:-1300,x1:1650,z1:-5200,n:8,r:360,mesa:true,h:260},{kind:'cluster',x:-3200,z:800,n:4,sx:800,sz:1800,r:400,h:220}],race:{shape:'slalom'},course:{gates:10,radius:1100,altitude:150,direction:'left'},trees:50},
    {id:'desert-oasis',terrain:'desert',name:'Palm Oasis',description:'A ring of palms around a hidden spring. Loop the oasis and race home over the sand.',land:[[200,0,1500,1700]],mountains:[{kind:'cluster',x:3400,z:-1600,n:6,sx:1000,sz:2600,r:420,mesa:true,h:200}],race:{shape:'loop',cx:-1000,cz:-1500},course:{gates:8,radius:900,altitude:170,direction:'left'},plant:'palm',trees:70,grove:[-1000,-1500,520]},
    {id:'desert-salt',terrain:'desert',name:'Salt Flats',description:'A blinding white plain with nothing to hide behind. Pure speed on the figure-eight.',land:[[0,0,2600,2900]],mountains:[{kind:'wall',x0:-4200,z0:-4000,x1:4200,z1:-4600,n:9,r:700,h:420}],race:{shape:'figure8'},course:{gates:12,radius:1200,altitude:140,direction:'left'},trees:0,landColor:['#e6e0cf','#ece7d8','#e2dccb','#e9e4d4']},
    {id:'desert-mesa',terrain:'desert',name:'Mesa Country',description:'Flat-topped rock towers everywhere. The circuit spirals up between them.',land:[[100,0,1200,1600],[-2900,-2200,1100,1100]],mountains:[{kind:'cluster',x:-3000,z:-2300,n:6,sx:900,sz:1500,r:300,mesa:true,h:300},{kind:'cluster',x:2800,z:-2400,n:5,sx:1100,sz:1800,r:360,mesa:true,h:240},{kind:'peak',x:-3400,z:1200,r:700,h:380}],race:{shape:'climb',cx:-900,cz:-1500},course:{gates:9,radius:1200,altitude:280,direction:'left'},trees:60},
    {id:'alpine-valley',terrain:'alpine',name:'Alpine Valley',description:'Pine forests and snow-capped peaks around a mountain lake.',land:[[0,0,900,1350]],mountains:[{kind:'cluster',x:-3400,z:-450,n:12,sx:1300,sz:2450,r:450,h:400},{kind:'wall',x0:2500,z0:-4200,x1:4700,z1:-3450,n:6,r:650,h:980}],race:ARC,course:COURSE,cabins:[-370,300]},
    {id:'alpine-lake',terrain:'alpine',name:'Glacier Lake',description:'The airfield sits on the eastern shore. Loop the lake beneath the far peaks.',land:[[350,0,1000,1550],[-2300,-1800,1200,900],[-2600,600,700,800]],mountains:[{kind:'wall',x0:-3400,z0:-3200,x1:-1200,z1:-3400,n:5,r:600,h:900},{kind:'peak',x:-2800,z:700,r:500,h:520},{kind:'cluster',x:3200,z:-1200,n:5,sx:900,sz:2600,r:450,h:600}],race:{shape:'loop',cx:-1000,cz:-1200},course:{gates:9,radius:1000,altitude:190,direction:'left'},boat:[-1100,-1300],cabins:[-2000,-1500]},
    {id:'alpine-ridge',terrain:'alpine',name:'Ridge Run',description:'A long north–south valley walled by ridges. Slalom up the valley floor.',land:[[0,-500,1300,3000]],mountains:[{kind:'wall',x0:-2200,z0:800,x1:-2200,z1:-5200,n:9,r:620,h:900},{kind:'wall',x0:2200,z0:800,x1:2200,z1:-5200,n:9,r:620,h:900}],race:{shape:'slalom'},course:{gates:10,radius:1100,altitude:200,direction:'right'},trees:260},
    {id:'alpine-summit',terrain:'alpine',name:'Summit Circuit',description:'Peaks on every side. The circuit spirals up towards the summit ridge.',land:[[0,-100,1100,1500],[-800,-2600,1300,1000]],mountains:[{kind:'peak',x:-800,z:-2700,r:900,h:1050},{kind:'cluster',x:-3200,z:-200,n:6,sx:900,sz:2200,r:520,h:700},{kind:'cluster',x:3000,z:-1400,n:6,sx:900,sz:2400,r:520,h:760}],race:{shape:'climb',cx:-800,cz:-2500,minR:1100},trainingDirection:'right',course:{gates:9,radius:1400,altitude:360,direction:'left'},trees:200},
    {id:'alpine-meadow',terrain:'alpine',name:'Highland Meadows',description:'Rolling meadows and scattered hamlets. A fast figure-eight over open grass.',land:[[0,0,2200,2600]],mountains:[{kind:'cluster',x:-3600,z:-2400,n:6,sx:900,sz:1800,r:600,h:520},{kind:'cluster',x:3400,z:-2600,n:6,sx:900,sz:1800,r:600,h:560},{kind:'cluster',x:0,z:-3600,n:4,sx:1600,sz:500,r:420,h:180}],race:{shape:'figure8'},course:{gates:12,radius:1250,altitude:180,direction:'left'},trees:110,cabins:[-900,-900]},
    {id:'arctic-outpost',terrain:'arctic',name:'Polar Outpost',description:'Snowfields, icy waters, and pale northern light.',land:[[0,0,900,1350]],mountains:[{kind:'cluster',x:-3400,z:-450,n:12,sx:1300,sz:2450,r:450,h:250},{kind:'wall',x0:2500,z0:-4200,x1:4700,z1:-3450,n:6,r:650,h:700}],race:ARC,course:COURSE,boat:[-1450,-1500],cabins:[-370,300]},
    {id:'arctic-fjord',terrain:'arctic',name:'Frozen Fjord',description:'A narrow inlet between sheer white cliffs. Slalom up the fjord and back.',land:[[400,0,950,1500],[-1900,-1200,700,2200]],mountains:[{kind:'wall',x0:-2100,z0:800,x1:-2100,z1:-3400,n:7,r:520,h:620},{kind:'wall',x0:1900,z0:-1400,x1:1900,z1:-3600,n:5,r:520,h:560}],race:{shape:'slalom'},course:{gates:10,radius:1000,altitude:170,direction:'left'},boat:[-800,-1600],trees:60},
    {id:'arctic-shelf',terrain:'arctic',name:'Ice Shelf',description:'An endless frozen plain. Nothing but wind, ice, and the figure-eight.',land:[[0,0,2700,3000]],mountains:[{kind:'wall',x0:-4200,z0:-4300,x1:4200,z1:-4300,n:8,r:700,h:380}],race:{shape:'figure8'},course:{gates:12,radius:1300,altitude:130,direction:'right'},trees:0},
    {id:'arctic-glacier',terrain:'arctic',name:'Glacier Bay',description:'Icebergs drift across the bay. The loop threads between them.',land:[[300,0,950,1550],[-1500,-2000,420,360],[-2100,-700,360,420],[-1300,900,380,330],[-2300,-2600,300,300]],mountains:[{kind:'peak',x:-1500,z:-2000,r:380,h:95,color:'#dfe8ee'},{kind:'peak',x:-2100,z:-700,r:320,h:90,color:'#dfe8ee'},{kind:'peak',x:-1300,z:900,r:340,h:85,color:'#dfe8ee'},{kind:'wall',x0:2600,z0:-3800,x1:4600,z1:-3000,n:5,r:700,h:600}],race:{shape:'loop',cx:-1100,cz:-900},course:{gates:9,radius:1000,altitude:150,direction:'left'},boat:[-700,-900],trees:40},
    {id:'arctic-aurora',terrain:'arctic',name:'Aurora Peak',description:'A lone mountain under violet skies. Spiral up its flank as the lights dance.',land:[[100,0,1100,1500],[-900,-2500,1200,1000]],mountains:[{kind:'peak',x:-900,z:-2600,r:950,h:900},{kind:'cluster',x:3200,z:-600,n:5,sx:900,sz:2600,r:480,h:520}],race:{shape:'climb',cx:-900,cz:-2400,minR:1150},trainingDirection:'right',course:{gates:9,radius:1300,altitude:330,direction:'left'},sky:['#4d5c86','#b1a9c6','#8d9fb0'],trees:90}
  ];
  const MAP_BY_ID={};for(const m of MAPS)MAP_BY_ID[m.id]=m;
  function mapsFor(terrain){return MAPS.filter(m=>m.terrain===terrain);}
  // Mountain descriptors are expanded once per map with a seeded generator so the renderer and the
  // collision model always agree on where every peak, hill, and mesa stands.
  function seededRandom(text){let s=2166136261;for(let i=0;i<text.length;i++){s^=text.charCodeAt(i);s=Math.imul(s,16777619)>>>0;}return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
  const MOUNTAIN_CACHE={};
  function mountainsFor(map){
    if(MOUNTAIN_CACHE[map.id])return MOUNTAIN_CACHE[map.id];
    const rnd=seededRandom(map.id),out=[];
    for(const d of map.mountains||[]){
      if(d.kind==='peak')out.push({x:d.x,z:d.z,r:d.r,h:d.h,mesa:!!d.mesa,color:d.color});
      else if(d.kind==='cluster')for(let i=0;i<d.n;i++){const x=d.x+(rnd()-.5)*d.sx,z=d.z+(rnd()-.5)*d.sz,k=.7+rnd()*.6;out.push({x,z,r:d.r*k,h:d.h*(.6+rnd()*.7),mesa:!!d.mesa,color:d.color});if(!d.mesa)out.push({x,z,r:d.r*k*1.8,h:d.h*.3,hill:true});}
      else if(d.kind==='wall')for(let i=0;i<d.n;i++){const t=d.n>1?i/(d.n-1):0;out.push({x:d.x0+(d.x1-d.x0)*t,z:d.z0+(d.z1-d.z0)*t,r:d.r*(.85+rnd()*.3),h:d.h*(.75+rnd()*.5),mesa:!!d.mesa,color:d.color});}
    }
    return MOUNTAIN_CACHE[map.id]=out;
  }
  // Height of the scenery above sea level at a point: mesas are flat tables, peaks and hills are cones.
  // `where` is a map, or a layout: an array of islands { map, x, z } placed around the current runway.
  function terrainHeight(where,x,z){
    if(Array.isArray(where)){let h=0;for(const isle of where)if(Math.hypot(x-isle.x,z-isle.z)<6500)h=Math.max(h,terrainHeight(isle.map,x-isle.x,z-isle.z));return h;}
    let h=0;
    for(const m of mountainsFor(where)){
      const dx=x-m.x,dz=z-m.z;
      if(m.mesa){if(Math.abs(dx)<m.r*.8&&Math.abs(dz)<m.r*.65)h=Math.max(h,m.h-2);continue;}
      const d=Math.hypot(dx,dz),base=m.r*.9;
      if(d<base)h=Math.max(h,-7+m.h*(1-d/base));
    }
    return h;
  }
  // Layouts. The island you are standing on is always at the origin with its runway heading north.
  const EQUIPPED={terminal:2,hangar:1,runway:1,radar:1,fuel:1,rescue:1};
  function currentMap(s){ return s.trip && MAP_BY_ID[s.trip.map] || worldMap(s.world); }
  function island(map,x,z,buildings){ return { map, x, z, buildings, runwayHalf: 850 + (buildings.runway||0) * 150 }; }
  function homeLayout(s){ return [island(currentMap(s), 0, 0, s.trip ? EQUIPPED : s.buildings)]; }
  // Free flight: the home island at the origin, the other nineteen on two rings around it.
  function freeLayout(s){
    const home=worldMap(s.world),others=MAPS.filter(m=>m!==home),layout=[island(home,0,0,s.buildings)];
    others.forEach((m,i)=>{const inner=i<6,n=inner?6:13,k=inner?i:i-6,r=inner?15000:28000,a=k/n*Math.PI*2+(inner?.35:.1);layout.push(island(m,Math.round(Math.sin(a)*r),Math.round(-Math.cos(a)*r),EQUIPPED));});
    return layout;
  }
  // Pick where a destination flight goes: a random other island 7–9 km away, or home for a return flight.
  function pickDestination(s,type,random=Math.random){
    if(!MISSIONS[type]?.destination)return null;
    const home=worldMap(s.world),here=currentMap(s);
    if(type==='return'){ if(!s.trip)return null; return { map: home.id, dx: -s.trip.dx, dz: -s.trip.dz }; }
    const choices=MAPS.filter(m=>m!==here&&(s.world.mode==='business'||m!==home));
    const map=choices[Math.floor(random()*choices.length)],d=10500+random()*2000,b=random()*Math.PI*2;
    return { map: map.id, dx: Math.round(Math.sin(b)*d), dz: Math.round(-Math.cos(b)*d) };
  }
  function flightLayout(s,type,destination){
    if(type==='free')return freeLayout(s);
    const layout=homeLayout(s);
    if(destination&&MAP_BY_ID[destination.map])layout.push(island(MAP_BY_ID[destination.map],destination.dx,destination.dz,destination.map===s.world.map?s.buildings:EQUIPPED));
    return layout;
  }
  const GATE_CLEARANCE=140;
  function clearAbove(where,a,b){
    let top=0;const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz)||1,nx=-dz/len*130,nz=dx/len*130,steps=Math.max(2,Math.ceil(len/60));
    for(let i=0;i<=steps;i++){const t=i/steps,x=a.x+dx*t,z=a.z+dz*t;for(const k of [-1,0,1])top=Math.max(top,terrainHeight(where,x+nx*k,z+nz*k));}
    return top>0?top+GATE_CLEARANCE:0;
  }
  function worldMap(options){ if(options&&Object.hasOwn(MAP_BY_ID,options.map))return MAP_BY_ID[options.map]; return mapsFor(worldTerrain(options?.terrain))[0]; }
  function freshState(options={}) {
    const mode=worldMode(options), business=mode==='business', solo=SOLO_MODES.includes(mode), map=worldMap(options);
    const state={ version: 1, world:{name:worldName(options.name),tutorial:!solo&&options.tutorial!==false,business,mode,terrain:map.terrain,map:map.id}, trip:null, cash: 24000, seconds: 0, reputation: 82, passengers: 0, completed: 0, missions: 0, tasks: 0,
      revenue: 0, expenses: 0, wages: 0, capital: 0, debt: 0, role: 'manager', skin: '#f0b85a',
      buildings: { terminal: 0, hangar: 0, runway: 0, radar: 0, fuel: 0, rescue: 0 },
      staff: { checkin: 1, security: 1, ground: 1, cabin: 0, engineer: 0 },
      departures: [newDeparture(1), newDeparture(2, 1)], nextFlight: 3,
      ledger: [{ label: 'Founder’s starting investment', amount: 24000, time: 0 }], history: [],
      settings: { difficulty: 'easy', graphics: 'low', weather: 'clear', sound: false, touch: false, invert: false },
      course: { ...map.course },
      bestRace: 0, raceRecord: null, tutorialDone: false, milestone: false, taskReadyAt: 0, taskSequence: 0, emergencyGrant: false, lessonRead: [] };
    if(!business){state.cash=0;state.role='pilot';state.staff={checkin:0,security:0,ground:0,cabin:0,engineer:0};state.departures=[];state.ledger=[];state.buildings={terminal:2,hangar:1,runway:1,radar:1,fuel:1,rescue:1};}
    return state;
  }
  function sanitize(raw) {
    if (!raw || raw.version !== 1 || typeof raw !== 'object') throw new Error('This is not a Sky Plane save file.');
    const s = freshState(raw.world&&typeof raw.world==='object'?raw.world:{});
    ['cash','seconds','passengers','completed','missions','tasks','revenue','expenses','wages','capital','debt','nextFlight','bestRace','taskReadyAt','taskSequence'].forEach(k => s[k] = finite(raw[k], s[k], 0, k === 'seconds' ? 1e8 : 1e9));
    s.cash = finite(raw.cash, s.cash, -1e6, 1e9);
    s.reputation = finite(raw.reputation, 82, 0, 100);
    for (const k in STAFF) s.staff[k] = Math.floor(finite(raw.staff?.[k], s.staff[k], 0, 8));
    for (const k in BUILDINGS) s.buildings[k] = Math.floor(finite(raw.buildings?.[k], 0, 0, BUILDINGS[k].max));
    if (Object.hasOwn(ROLES, raw.role)) s.role = raw.role;
    if (typeof raw.skin === 'string' && /^#[0-9a-f]{6}$/i.test(raw.skin)) s.skin = raw.skin;
    const choices = { difficulty: ['easy','normal','hard'], graphics: ['low','medium','high'], weather: ['clear','overcast','storm','sunset'] };
    for (const k in choices) if (choices[k].includes(raw.settings?.[k])) s.settings[k] = raw.settings[k];
    ['sound','touch','invert'].forEach(k => s.settings[k] = raw.settings?.[k] === true);
    ['tutorialDone','milestone','emergencyGrant'].forEach(k => s[k] = raw[k] === true);
    s.course.gates = Math.round(finite(raw.course?.gates, s.course.gates, 4, 12));
    s.course.radius = finite(raw.course?.radius, s.course.radius, 700, 1600);
    s.course.altitude = finite(raw.course?.altitude, s.course.altitude, 120, 420);
    s.course.direction = raw.course?.direction === 'right' ? 'right' : raw.course?.direction === 'left' ? 'left' : s.course.direction;
    // Ghost traces only exist in competitive worlds.
    s.raceRecord = s.world.mode === 'competitive' ? sanitizeRecord(raw.raceRecord) : null;
    // A flight-only pilot may be parked on another island; business pilots always start at home.
    const t = raw.trip;
    s.trip = s.world.mode === 'flight' && t && typeof t === 'object' && Object.hasOwn(MAP_BY_ID, t.map) && t.map !== s.world.map && Number.isFinite(t.dx) && Number.isFinite(t.dz) ? { map: t.map, dx: clamp(t.dx, -1e6, 1e6), dz: clamp(t.dz, -1e6, 1e6) } : null;
    if (s.raceRecord && (!s.bestRace || s.raceRecord.time < s.bestRace)) s.bestRace = s.raceRecord.time;
    s.ledger = Array.isArray(raw.ledger) ? raw.ledger.slice(0, 50).filter(x => x && typeof x.label === 'string' && Number.isFinite(x.amount) && Number.isFinite(x.time)).map(x => ({label:x.label.slice(0,100),amount:clamp(x.amount,-1e9,1e9),time:clamp(x.time,0,1e8)})) : s.ledger;
    s.history = Array.isArray(raw.history) ? raw.history.slice(-12).map(x=>finite(x,0,0,1e7)) : [];
    s.departures = Array.isArray(raw.departures) && raw.departures.length ? raw.departures.slice(0,2+s.buildings.hangar).map((x,i) => {
      if (!x || typeof x !== 'object') return newDeparture(i+1,i);
      const d = newDeparture(Math.floor(finite(x.id,i+1,1,1e6)));
      d.stage = Math.floor(finite(x.stage,0,0,3)); d.progress = finite(x.progress,0,0,1); d.wait = finite(x.wait,0,0,60); return d;
    }) : s.departures;
    s.nextFlight = Math.max(s.nextFlight, ...s.departures.map(x=>x.id+1));
    if(!s.world.business){s.role='pilot';s.departures=[];s.staff={checkin:0,security:0,ground:0,cabin:0,engineer:0};}
    return s;
  }
  // A race record keeps a 4 Hz trace of the winning flight so a ghost aircraft can replay it.
  const GHOST_RATE = 4, GHOST_STRIDE = 6, GHOST_MAX_SAMPLES = 4 * 60 * 25;
  function sanitizeRecord(raw) {
    if (!raw || typeof raw !== 'object' || !Number.isFinite(raw.time) || raw.time <= 0 || !Array.isArray(raw.trace)) return null;
    const trace = raw.trace.slice(0, GHOST_STRIDE * GHOST_MAX_SAMPLES);
    if (trace.length < GHOST_STRIDE * 2 || trace.length % GHOST_STRIDE || !trace.every(Number.isFinite)) return null;
    const gateTimes = Array.isArray(raw.gateTimes) ? raw.gateTimes.slice(0, 40).filter(Number.isFinite).map(t => clamp(t, 0, 1e5)) : [];
    return { time: clamp(raw.time, 0.1, 1e5), trace: trace.map(n => clamp(n, -1e6, 1e6)), gateTimes };
  }
  function sampleGhost(f, trace) { if (trace.length >= GHOST_STRIDE * GHOST_MAX_SAMPLES) return; trace.push(Math.round(f.x*10)/10, Math.round(f.y*10)/10, Math.round(f.z*10)/10, Math.round(f.yaw*1000)/1000, Math.round(f.pitch*1000)/1000, Math.round(f.roll*1000)/1000); }
  function ghostAt(record, time) {
    if (!record) return null;
    const trace = record.trace, count = trace.length / GHOST_STRIDE, pos = clamp(time * GHOST_RATE, 0, count - 1);
    const i = Math.min(count - 2, Math.floor(pos)), t = clamp(pos - i, 0, 1), a = i * GHOST_STRIDE, b = a + GHOST_STRIDE;
    const mix = (k) => trace[a+k] + (trace[b+k] - trace[a+k]) * t;
    const yawDelta = Math.atan2(Math.sin(trace[b+3]-trace[a+3]), Math.cos(trace[b+3]-trace[a+3]));
    return { x: mix(0), y: mix(1), z: mix(2), yaw: trace[a+3] + yawDelta * t, pitch: mix(4), roll: mix(5), finished: time >= record.time };
  }
  function entry(s, label, amount) {
    s.ledger.unshift({ label, amount: Math.round(amount), time: s.seconds });
    s.ledger.length = Math.min(s.ledger.length, 50);
  }
  function spend(s, amount, label) {
    if (s.cash < amount) return false;
    s.cash -= amount; s.capital += amount; entry(s, label, -amount); return true;
  }
  function price(s, key) { return Math.round(BUILDINGS[key].price * (1 + s.buildings[key] * .55)); }
  function build(s, key) {
    if(s.world?.business===false)return false;
    if (!BUILDINGS[key] || s.buildings[key] >= BUILDINGS[key].max) return false;
    if (!spend(s, price(s,key), BUILDINGS[key].name + ' expansion')) return false;
    s.buildings[key]++;
    if (key === 'hangar') s.departures.push(newDeparture(s.nextFlight++, 1));
    return true;
  }
  function hire(s, key) {
    if(s.world?.business===false)return false;
    if (!STAFF[key] || s.staff[key] >= 8 || !spend(s, STAFF[key].hire, 'Hired ' + STAFF[key].name.toLowerCase())) return false;
    s.staff[key]++; return true;
  }
  function wageRate(s) { return Object.keys(STAFF).reduce((n,k)=>n+s.staff[k]*STAFF[k].wage,0); }
  function difficulty(s) { return ({easy:{cost:.8, gate:100, damage:.55},normal:{cost:1,gate:75,damage:1},hard:{cost:1.2,gate:55,damage:1.4}})[s.settings.difficulty]; }
  function tickEconomy(s, dt) {
    if(s.world?.business===false){s.seconds+=dt;return [];}
    const events = []; const oldHour = Math.floor(s.seconds/60);
    s.seconds += dt;
    const cost = ((wageRate(s) + 50 + Object.values(s.buildings).reduce((a,b)=>a+b,0)*12) * difficulty(s).cost + s.debt*.01) * dt/60;
    s.cash -= cost; s.expenses += cost; s.wages += wageRate(s)*difficulty(s).cost*dt/60;
    const allocated = {checkin:0,security:0,ground:0};
    for (let i=0;i<s.departures.length;i++) {
      const d = s.departures[i];
      if (d.wait > 0) { d.wait = Math.max(0,d.wait-dt); continue; }
      if (d.stage < 3) {
        const key = ['checkin','security','ground'][d.stage];
        const capacity = Math.max(0,s.staff[key]-allocated[key]);
        if (!capacity) continue;
        allocated[key] += Math.min(2,capacity);
        d.progress += dt / 26 * Math.min(2,capacity) * (1 + s.buildings.radar*.15);
        if (d.progress >= 1) { d.stage++; d.progress=0; }
      } else {
        d.progress += dt/12;
        if (d.progress >= 1) {
          const pax = d.passengers + s.buildings.terminal*12;
          const revenue = Math.round(pax * 32 * ( .75 + s.reputation/400) * (1 + Math.min(s.staff.cabin,5)*.06));
          const operating = Math.round((260+pax*3)*Math.max(.3,1-s.buildings.fuel*.1-Math.min(s.staff.engineer,5)*.08)*difficulty(s).cost);
          s.cash += revenue-operating; s.revenue += revenue; s.expenses += operating; s.passengers += pax; s.completed++; s.reputation=clamp(s.reputation+.35,0,100);
          entry(s,d.code+' · '+d.destination+' ticket sales',revenue); entry(s,d.code+' · fuel & handling',-operating);
          s.history.push(revenue-operating); if(s.history.length>12)s.history.shift();
          events.push({type:'departure',flight:d,profit:revenue-operating});
          s.departures[i] = newDeparture(s.nextFlight++,0);
        }
      }
    }
    if (Math.floor(s.seconds/60) > oldHour) entry(s,'Hourly staff, facilities & loan costs',-((wageRate(s)+50+Object.values(s.buildings).reduce((a,b)=>a+b,0)*12)*difficulty(s).cost+s.debt*.01));
    if (!s.milestone && s.completed >= 5) { s.milestone=true;s.cash+=2000;entry(s,'First five departures · milestone grant',2000);events.push({type:'milestone'}); }
    return events;
  }
  function completeTask(s, role, correct) {
    if(s.world?.business===false)return false;
    if (s.seconds < s.taskReadyAt || !STAFF[role]) return false;
    s.taskReadyAt=s.seconds+12; s.taskSequence++;
    if (!correct) { s.reputation=clamp(s.reputation-1,0,100);return true; }
    s.tasks++;s.cash+=120;s.revenue+=120;s.reputation=clamp(s.reputation+.5,0,100);entry(s,ROLES[role].name+' · shift bonus',120);
    const stage = STAFF[role].stage;
    const flight = s.departures.find(x=>x.stage===stage);
    if (flight) { flight.wait=0;flight.progress+=.6;if(flight.progress>=1){flight.stage++;flight.progress=0;} }
    return true;
  }
  // Race circuits start at the same takeoff gate north of runway 36; each shape fills in the middle.
  const SHAPES = {
    arc(n,R,H,sign){const g=[];for(let i=1;i<n;i++){const t=(i/(n-1))*Math.PI*1.62;g.push({x:sign*R*(1-Math.cos(t)),y:H+Math.sin(t*2)*55,z:-1050-R*Math.sin(t)});}return g;},
    // A circle through the takeoff gate; "right" mirrors the circuit to the other side of the field.
    loop(n,R,H,sign,map){const cx=sign*Math.abs(map.race.cx),cz=map.race.cz,r=Math.hypot(cx,cz+1050)*R/950,a0=Math.atan2(-1050-cz,-cx),g=[];for(let i=1;i<n;i++){const a=a0+sign*(i/n)*Math.PI*2;g.push({x:cx+Math.cos(a)*r,y:H+Math.sin(i/n*Math.PI*4)*30,z:cz+Math.sin(a)*r});}return g;},
    // Two tangent circles crossed at a single point north of the field.
    figure8(n,R,H,sign){const r=R*.68,cz=-1050-1.4*r,g=[{x:0,y:H,z:cz}],mA=Math.floor((n-2)/2),mB=n-2-mA;
      for(let j=1;j<=mA;j++){const a=(1+sign)/2*Math.PI+sign*j/(mA+1)*Math.PI*2;g.push({x:sign*r+Math.cos(a)*r,y:H+Math.sin(j/(mA+1)*Math.PI*2)*35,z:cz+Math.sin(a)*r});}
      for(let j=1;j<=mB;j++){const a=(1-sign)/2*Math.PI-sign*j/(mB+1)*Math.PI*2;g.push({x:-sign*r+Math.cos(a)*r,y:H-Math.sin(j/(mB+1)*Math.PI*2)*35,z:cz+Math.sin(a)*r});}return g;},
    // Out along one lane, a wide turn at the far end, and back down the other lane.
    slalom(n,R,H,sign){const g=[],L=R*2.6,m=n-2,out=Math.ceil(m/2),back=m-out;
      for(let j=1;j<=out;j++)g.push({x:-sign*R*.5*Math.min(1,j/2)+(j%2?1:-1)*R*.07,y:H+(j%2?25:-15),z:-1050-L*j/out});
      g.push({x:0,y:H+40,z:-1050-L-R*.55});
      for(let j=1;j<=back;j++)g.push({x:sign*R*.5*Math.min(1,(back+1-j)/2)+(j%2?-1:1)*R*.07,y:H+(j%2?-15:25),z:-1050-L*(1-j/(back+1))});return g;},
    // A climbing spiral that tightens towards a summit.
    climb(n,R,H,sign,map){const cx=sign*Math.abs(map.race.cx),cz=map.race.cz,r=Math.max(R*.75,map.race.minR||0),a0=Math.atan2(-1050-cz,-cx),g=[];for(let i=1;i<n;i++){const k=i/(n-1),a=a0+sign*k*Math.PI*2;g.push({x:cx+Math.cos(a)*r,y:Math.min(760,H*.55+k*H*1.35),z:cz+Math.sin(a)*r});}return g;}
  };
  // Every mission follows the map's own circuit; races use the player's course, missions a fixed size.
  function makeRoute(type, course, where=MAPS[0]) {
    const layout = Array.isArray(where) ? where : [island(where,0,0,EQUIPPED)], map = layout[0].map, dest = layout[1];
    if (MISSIONS[type]?.destination && dest) return liftRoute(layout, destinationRoute(layout));
    const race = type === 'race', base = map.course || COURSE;
    const count = race ? course.gates : MISSIONS[type].gates;
    let shape = map.race?.shape || 'arc', radius = race ? course.radius : base.radius, direction = race ? course.direction : base.direction;
    // Short mission routes cannot follow a spiral safely: training flies the classic small arc and
    // other missions circle wide around the map's centrepiece instead.
    if (!race && type === 'training') { if (shape !== 'slalom') { shape = 'arc'; radius = 700; } else radius = Math.max(700, base.radius * .85); direction = map.trainingDirection || direction; }
    else if (!race && shape === 'climb') { shape = 'loop'; radius = 950; }
    const height = race ? course.altitude : type === 'training' ? 130 : 230;
    const sign = direction === 'right' ? 1 : -1;
    const gates = [{x:0,y:95,z:-1050}];
    gates.push(...(SHAPES[shape]||SHAPES.arc)(count,radius,height,sign,map));
    // A wide downwind leg followed by a straight final approach to runway 36.
    gates.push({x:sign*600,y:180,z:1550},{x:0,y:150,z:2250},{x:0,y:65,z:1250});
    return liftRoute(layout, gates);
  }
  // Climb out, cross the water on two waypoints, join the destination's pattern abeam its runway,
  // then fly the same downwind and final approach every circuit uses.
  // Climb out north, then follow a low-ground path (a coarse grid search over both islands) to a
  // point abeam the destination runway, and fly the same downwind and final every circuit uses.
  function destinationRoute(layout){
    const dest=layout[1],dx=dest.x,dz=dest.z;
    // Two ways into the pattern: a dogleg onto final (for flights arriving northbound) or joining the
    // downwind leg directly (arriving from the north). Both sides of the runway are tried; the option whose
    // real path arrives closest to the leg's heading, over the lowest ground, wins.
    const room=(p)=>{let top=0;for(let k=0;k<12;k++){const a=k/12*Math.PI*2;for(const r of [400,800,1100])top=Math.max(top,terrainHeight(layout,p.x+Math.cos(a)*r,p.z+Math.sin(a)*r));}return top;};
    const evaluate=(from)=>{const options=[];
      for(const side of [-1,1])for(const dogleg of [true,false]){
        const goal=dogleg?{x:dx+side*1200,y:250,z:dz+3500}:{x:dx+side*600,y:180,z:dz+1550};
        const want=dogleg?Math.atan2(-side*1200,-(2250-3500)):Math.PI; // heading of the leg that follows the goal
        const path=lowGroundPath(layout,from,goal),prev=path[path.length-2]||from;
        const arrive=Math.atan2(goal.x-prev.x,-(goal.z-prev.z)),off=Math.abs(Math.atan2(Math.sin(arrive-want),Math.cos(arrive-want)));
        let len=0;for(let i=1;i<path.length;i++)len+=Math.hypot(path[i].x-path[i-1].x,path[i].z-path[i-1].z);
        options.push({goal,path,want,score:off*3000+room(goal)*25+len*.15+Math.max(0,path.length-3)*900});
      }
      return options.sort((a,b)=>a.score-b.score);};
    const options=evaluate({x:0,z:-1800});
    const first=options[0];
    // Climb out on whichever heading off the runway has the most room, leaning towards the first waypoint,
    // then route from that climb gate for real.
    const next=first.path[1]||first.goal,want=Math.atan2(next.x,-(next.z+1050));
    const wide=(p)=>{let top=0;for(const r of [300,600,900,1200,1500])for(let k=0;k<20;k++){const a=k/20*Math.PI*2;top=Math.max(top,terrainHeight(layout,p.x+Math.cos(a)*r,p.z+Math.sin(a)*r));}return top;};
    const nearHigh=(p,r)=>{for(const rr of [r*.5,r])for(let k=0;k<16;k++){const a=k/16*Math.PI*2;if(terrainHeight(layout,p.x+Math.cos(a)*rr,p.z+Math.sin(a)*rr)>40)return true;}return false;};
    const candidates=[-60,-40,-20,0,20,40,60].map(deg=>{const a=deg*Math.PI/180,p={x:Math.sin(a)*2200,y:220,z:-1050-Math.cos(a)*2200};const off=Math.abs(Math.atan2(Math.sin(a-want),Math.cos(a-want)));const valid=!nearHigh(p,700)&&clearAbove(layout,{x:0,z:-1050},p)===0;return {p,valid,score:wide(p)*2+Math.abs(deg)*.3+off*45+(valid?0:1e6)};}).sort((a,b)=>a.score-b.score);
    const climb=candidates[0].p;
    const gates=[{x:0,y:95,z:-1050},climb];
    // A sharp turn right after the climb-out sweeps a kilometre sideways, so keep climbing straight
    // ahead until the turn can be made in the clear.
    // Re-evaluate the pattern options from the real climb gate (and again after any extension), then route.
    let best=evaluate(climb)[0],from=climb;
    {const nxt=best.path[1]||best.goal,heading=Math.atan2(climb.x,-(climb.z+1050)),toNext=Math.atan2(nxt.x-from.x,-(nxt.z-from.z)),turn=Math.abs(Math.atan2(Math.sin(toNext-heading),Math.cos(toNext-heading)));
      if(turn>1.4){for(let d=900;d<=7200;d+=900){const p={x:climb.x+Math.sin(heading)*d,y:300,z:climb.z-Math.cos(heading)*d};if(nearHigh(p,1900)||clearAbove(layout,from,p)>0)continue;gates.push(p);from=p;best=evaluate(from)[0];break;}}}
    const goal=best.goal,path=best.path;
    for(const p of path.slice(1,-1)){const last=gates[gates.length-1];if(Math.hypot(p.x-last.x,p.z-last.z)<400)continue;gates.push({x:p.x,y:380,z:p.z});}
    // Stay at cruise height until 3 km out, so the descent happens over the water near the destination.
    {const last=gates[gates.length-1],d=Math.hypot(goal.x-last.x,goal.z-last.z);if(d>4500){const t=1-3000/d;gates.push({x:last.x+(goal.x-last.x)*t,y:380,z:last.z+(goal.z-last.z)*t});}}
    // If the real path still arrives well off the leg's heading, add an alignment gate 1500 m before the goal.
    {const prev=gates[gates.length-1],arrive=Math.atan2(goal.x-prev.x,-(goal.z-prev.z)),want=best.want,off=Math.abs(Math.atan2(Math.sin(arrive-want),Math.cos(arrive-want)));
      const align={x:goal.x-Math.sin(want)*1500,y:goal.y+90,z:goal.z+Math.cos(want)*1500};
      if(off>.8&&Math.hypot(align.x-prev.x,align.z-prev.z)>600&&clearAbove(layout,prev,align)===0&&clearAbove(layout,align,goal)===0)gates.push(align);}
    gates.push(goal,{x:dx,y:150,z:dz+2250},{x:dx,y:65,z:dz+1250});
    return gates;
  }
  // A* over a 400 m grid; cells over high ground are impassable. The path is then straightened with
  // line-of-sight checks so a flight has only a handful of waypoints.
  function lowGroundPath(layout,start,goal){
    const cell=400,pad=7000,minX=Math.min(start.x,goal.x)-pad,minZ=Math.min(start.z,goal.z)-pad,maxX=Math.max(start.x,goal.x)+pad,maxZ=Math.max(start.z,goal.z)+pad;
    const w=Math.ceil((maxX-minX)/cell)+1,h=Math.ceil((maxZ-minZ)/cell)+1,blocked=new Uint8Array(w*h);
    const high=(x,z)=>terrainHeight(layout,x,z)>40;
    // Cells are blocked when high ground lies within 600 m, leaving room for the turn radius.
    const near=(x,z)=>{if(high(x,z))return true;for(let r of [300,600])for(let k=0;k<8;k++){const a=k/8*Math.PI*2;if(high(x+Math.cos(a)*r,z+Math.sin(a)*r))return true;}return false;};
    for(let j=0;j<h;j++)for(let i=0;i<w;i++)blocked[j*w+i]=near(minX+i*cell,minZ+j*cell)?1:0;
    const idx=(p)=>[Math.round((p.x-minX)/cell),Math.round((p.z-minZ)/cell)];
    const [sx,sz]=idx(start),[gx,gz]=idx(goal);blocked[sz*w+sx]=0;blocked[gz*w+gx]=0;
    const g=new Float64Array(w*h).fill(Infinity),from=new Int32Array(w*h).fill(-1),open=[sz*w+sx];g[sz*w+sx]=0;
    const hcost=(i,j)=>Math.hypot(i-gx,j-gz);const done=new Uint8Array(w*h);
    while(open.length){
      let best=0;for(let k=1;k<open.length;k++){const a=open[k],b=open[best];if(g[a]+hcost(a%w,Math.floor(a/w))<g[b]+hcost(b%w,Math.floor(b/w)))best=k;}
      const cur=open.splice(best,1)[0];if(done[cur])continue;done[cur]=1;const ci=cur%w,cj=Math.floor(cur/w);
      if(ci===gx&&cj===gz)break;
      for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){if(!di&&!dj)continue;const ni=ci+di,nj=cj+dj;if(ni<0||nj<0||ni>=w||nj>=h)continue;const n=nj*w+ni;if(blocked[n]||done[n])continue;const cost=g[cur]+Math.hypot(di,dj);if(cost<g[n]){g[n]=cost;from[n]=cur;open.push(n);}}
    }
    let node=gz*w+gx;if(from[node]<0&&node!==sz*w+sx)return [start,goal];
    const cells=[];while(node>=0){cells.push({x:minX+(node%w)*cell,z:minZ+Math.floor(node/w)*cell});node=from[node];}
    cells.reverse();cells[0]=start;cells[cells.length-1]=goal;
    const clear=(a,b)=>{const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz)||1,nx=-dz/len*150,nz=dx/len*150,n=Math.ceil(len/100);for(let k=0;k<=n;k++){const t=k/n,x=a.x+dx*t,z=a.z+dz*t;for(let m=-3;m<=3;m++)if(high(x+nx*m,z+nz*m))return false;}return true;};
    const out=[cells[0]];let i=0;
    while(i<cells.length-1){let j=cells.length-1;while(j>i+1&&!clear(cells[i],cells[j]))j--;out.push(cells[j]);i=j;}
    return out;
  }
  function liftRoute(layout, gates){
    // Lift gates clear of the scenery, then keep climbs within a gradient the trainer can fly:
    // earlier gates are raised to meet a high gate, never lowered into terrain.
    const need = gates.map(()=>0);
    for (let i=1;i<gates.length;i++) { const c = clearAbove(layout, gates[i-1], gates[i]); need[i] = Math.max(need[i], c); if (i > 1) need[i-1] = Math.max(need[i-1], c); }
    for (let i=1;i<gates.length;i++) gates[i].y = Math.max(gates[i].y, need[i]);
    for (let i=gates.length-2;i>=1;i--) { const g=gates[i], n=gates[i+1]; g.y = Math.max(g.y, n.y - Math.hypot(n.x-g.x, n.z-g.z) * .085); }
    for (let i=1;i<gates.length;i++) { const p=gates[i-1], g=gates[i]; g.y = Math.max(need[i], Math.min(g.y, p.y + Math.hypot(g.x-p.x, g.z-p.z) * .085)); }
    // Descents are limited too (7%), by lowering the earlier gate where the scenery allows it.
    for (let i=gates.length-3;i>=2;i--) { const p=gates[i-1], g=gates[i]; p.y = Math.max(need[i-1], Math.min(p.y, g.y + Math.hypot(g.x-p.x, g.z-p.z) * .07)); }
    return gates;
  }
  function newFlight(type, s, destination=null) {
    const islands=flightLayout(s,type,destination),free=type==='free';
    return { type,map:islands[0].map.id,islands,destination:free?null:destination,finish:destination?1:0,x:0,y:2,z:islands[0].runwayHalf-250, vx:0,vy:0,vz:0, yaw:0,pitch:0,roll:0,
      throttle:0,flaps:0,gear:true,fuel:100,health:100,cargo:100,speed:0,airSpeed:0,verticalSpeed:0,
      gates:free?[]:makeRoute(type,s.course,islands),gate:0,gateTimes:[],time:0,airborne:false,onGround:true,stall:false,
      engineFailure:false,landed:false,crashed:false,completed:false,gateRadius:difficulty(s).gate,
      maxAltitude:0, hardLanding:0, runwayHalf:islands[0].runwayHalf, lastGateDistance:Infinity, refuelled:false };
  }
  // Which runway (island index) is under the aircraft, or -1.
  function runwayAt(f){ for(let i=0;i<f.islands.length;i++){const isle=f.islands[i];if(Math.abs(f.x-isle.x)<31&&Math.abs(f.z-isle.z)<isle.runwayHalf)return i;} return -1; }
  function stepFlight(f, controls, dt, settings) {
    if (f.crashed || f.completed) return [];
    const events=[]; f.time+=dt;
    const p0={x:f.x,y:f.y,z:f.z};
    const windStrength=settings.weather==='storm'?12:settings.weather==='overcast'?4:0;
    const windX=windStrength*(.6+Math.sin(f.time*.17)*.4);
    const windZ=windStrength*Math.cos(f.time*.13)*.3;
    const relX=f.vx-windX,relZ=f.vz-windZ;
    const speed=Math.hypot(relX,relZ);f.airSpeed=speed;
    f.throttle=clamp(f.throttle+(controls.throttle||0)*dt*.26,0,1);
    const authority=clamp(speed/28,.2,1.3);
    const pitchInput=(controls.pitch||0)*(settings.invert?-1:1);
    const pitchRate = pitchInput*.29*authority - f.pitch*.12 - (f.stall?.13:0);
    f.pitch=clamp(f.pitch+pitchRate*dt,-.5,.48);
    f.roll=clamp(f.roll+((controls.roll||0)*.65*authority-f.roll*.32)*dt,-1.05,1.05);
    if (f.onGround) f.roll*=Math.exp(-5*dt);
    const turn=f.onGround?(controls.rudder||controls.roll||0)*clamp(speed/40,0,.7):Math.tan(f.roll)*9.81/Math.max(speed,22)+(controls.rudder||0)*.13;
    f.yaw+=turn*dt;
    const pathAngle=Math.atan2(f.vy,Math.max(speed,8));
    const aoa=f.pitch-pathAngle;
    f.stall=!f.onGround&&(aoa>.3||speed<23);
    const cl=clamp(.35+4.1*aoa+f.flaps*.24,-.8,1.7)*(f.stall?.38:1);
    const density=1.225*Math.exp(-f.y/9000),mass=1250,area=16.2;
    const lift=.5*density*speed*speed*area*cl;
    const drag=.5*density*speed*speed*area*(.033+.049*cl*cl+(f.gear?.016:0)+f.flaps*.018);
    const thrust=f.fuel>0?f.throttle*(f.engineFailure?2450:4200)*Math.max(.45,1-speed/150):0;
    const accel=(thrust*Math.cos(f.pitch)-drag)/mass-(f.onGround?.6:0);
    let groundSpeed=Math.max(0,Math.hypot(f.vx,f.vz)+accel*dt-(controls.brake&&f.onGround?7*dt:0));
    const forwardX=Math.sin(f.yaw),forwardZ=-Math.cos(f.yaw);
    // Sideslip decays gradually in the air; the wheels track the runway on the ground.
    const desiredX=forwardX*groundSpeed+(f.onGround?0:windX*.16),desiredZ=forwardZ*groundSpeed+(f.onGround?0:windZ*.16);
    const align=1-Math.exp(-(f.onGround?12:2.2)*dt);
    f.vx+=(desiredX-f.vx)*align;f.vz+=(desiredZ-f.vz)*align;
    // Smooth the direction, not the acceleration; otherwise thrust depends on frame rate.
    const alignedSpeed=Math.hypot(f.vx,f.vz);
    if(alignedSpeed>0){f.vx=f.vx/alignedSpeed*groundSpeed;f.vz=f.vz/alignedSpeed*groundSpeed;}
    const ay=lift*Math.cos(f.roll)/mass+thrust*Math.sin(f.pitch)/mass-9.81;
    f.vy+=ay*dt;
    if (settings.weather==='storm'&&!f.onGround) { f.vy+=Math.sin(f.time*3.7)*dt*1.8;f.roll+=Math.sin(f.time*2.2)*dt*.04; }
    f.x+=f.vx*dt;f.z+=f.vz*dt;f.y+=f.vy*dt;
    f.speed=Math.hypot(f.vx,f.vz);f.verticalSpeed=f.vy;f.maxAltitude=Math.max(f.maxAltitude,f.y);
    f.fuel=Math.max(0,f.fuel-dt*(.007+f.throttle*.031));
    if(f.y>4){f.airborne=true;f.onGround=false;}
    if(f.y<=2){
      const runwayIndex=runwayAt(f),runway=runwayIndex>=0;
      const hard=Math.abs(f.vy);
      if(f.airborne&&!f.onGround){
        f.hardLanding=hard;
        if(!runway||!f.gear||hard>5||Math.abs(f.roll)>.3||f.speed>65){f.crashed=true;events.push({type:'crash',reason:!runway?'You touched down away from the runway.':!f.gear?'The landing gear was still retracted.':hard>5?'The descent was too fast at touchdown.':Math.abs(f.roll)>.3?'The wings were not level at touchdown.':'The approach speed was too high.'});}
        else {f.health-=Math.max(0,hard-2)*12;f.cargo-=Math.max(0,hard-1.5)*10;events.push({type:'touchdown',island:runwayIndex});}
      }
      // Free flight: any runway is a fuel stop — touch down, roll, and take off again.
      if(f.type==='free'&&runway&&f.fuel<99.5){f.fuel=100;f.refuelled=true;events.push({type:'refuel',island:runwayIndex});}
      f.y=2;f.vy=Math.max(0,f.vy);f.onGround=true;f.pitch=Math.max(0,f.pitch);
      if(f.onGround&&!f.airborne&&(!runway&&f.speed>15)){f.crashed=true;events.push({type:'crash',reason:'The aircraft left the runway during takeoff. Use gentle steering.'});}
    }
    if(f.type==='cargo'&&!f.onGround){f.cargo=Math.max(0,f.cargo-Math.max(0,Math.abs(f.roll)-.62)*dt*2.5-Math.max(0,Math.abs(ay)-5)*dt*.12);}
    const gate=f.gates[f.gate];
    if(gate&&f.airborne){
      // Swept segment test keeps small gates reliable even at high speed or low frame rates.
      const dx=f.x-p0.x,dy=f.y-p0.y,dz=f.z-p0.z;
      const t=clamp(((gate.x-p0.x)*dx+(gate.y-p0.y)*dy+(gate.z-p0.z)*dz)/(dx*dx+dy*dy+dz*dz||1),0,1);
      const distance=Math.hypot(p0.x+dx*t-gate.x,p0.y+dy*t-gate.y,p0.z+dz*t-gate.z);
      f.lastGateDistance=Math.hypot(f.x-gate.x,f.y-gate.y,f.z-gate.z);
      if(distance<f.gateRadius){f.gate++;f.gateTimes.push(f.time);events.push({type:'gate'});if(f.type==='emergency'&&f.gate===(f.destination?2:Math.floor(f.gates.length/2))){f.engineFailure=true;events.push({type:'engine'});}}
    }
    if(f.type!=='free'&&f.gate>=f.gates.length&&f.onGround&&f.airborne&&f.speed<5&&!f.crashed&&runwayAt(f)===f.finish){f.completed=true;events.push({type:'complete'});}
    if(f.y>2000) {f.pitch=Math.min(f.pitch,-.05);events.push({type:'ceiling'});}
    // Scenery is solid: mountains, hills, and mesas end the flight on contact.
    const ground=terrainHeight(f.islands||MAP_BY_ID[f.map]||MAPS[0],f.x,f.z);if(!f.onGround&&!f.crashed&&ground>3&&f.y<ground+2.5){f.crashed=true;events.push({type:'crash',reason:'You flew into the terrain. Watch the scenery and keep clear of the high ground.'});}
    f.verticalSpeed=f.onGround?0:f.vy;
    return events;
  }
  function rewardFlight(s,f,trace) {
    if(!f.completed||f.rewardPaid)return 0;
    f.rewardPaid=true;f.newRecord=false;
    const quality=f.type==='cargo'?Math.max(.25,f.cargo/100):Math.max(.5,f.health/100);
    const amount=Math.round(MISSIONS[f.type].reward*quality*(1+s.buildings.runway*.1)*(f.type==='emergency'?1+s.buildings.rescue*.2:1));
    s.missions++;s.reputation=clamp(s.reputation+2,0,100);
    if(s.world?.business!==false){s.cash+=amount;s.revenue+=amount;entry(s,MISSIONS[f.type].title+' · mission reward',amount);}
    if(f.type==='training')s.tutorialDone=true;
    if(f.destination&&s.world.mode==='flight'){const dx=(s.trip?.dx||0)+f.destination.dx,dz=(s.trip?.dz||0)+f.destination.dz;s.trip=f.destination.map===s.world.map?null:{map:f.destination.map,dx,dz};}
    if(f.type==='race'&&(!s.bestRace||f.time<s.bestRace)){s.bestRace=f.time;f.newRecord=true;if(Array.isArray(trace))s.raceRecord=sanitizeRecord({time:f.time,trace,gateTimes:f.gateTimes})||s.raceRecord;}
    return s.world?.business===false?0:amount;
  }
  const api={STAFF,BUILDINGS,MISSIONS,ROLES,DESTINATIONS,MODES,SOLO_MODES,TERRAINS,MAPS,EQUIPPED,GHOST_RATE,clamp,worldName,worldMode,worldTerrain,worldMap,currentMap,mapsFor,mountainsFor,terrainHeight,lowGroundPath,homeLayout,freeLayout,flightLayout,pickDestination,runwayAt,freshState,sanitize,sanitizeRecord,sampleGhost,ghostAt,entry,spend,price,build,hire,wageRate,difficulty,tickEconomy,completeTask,makeRoute,newFlight,stepFlight,rewardFlight};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SkyCore=api;
})(typeof globalThis!=='undefined'?globalThis:this);

