/* Small, dependency-free 3D polygon renderer. Designed for integrated school laptops. */
(function(root){
  'use strict';
  const TAU=Math.PI*2;
  const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
  const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
  const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const norm=a=>{const l=Math.hypot(...a)||1;return a.map(v=>v/l);};
  let seed=7;
  function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
  function shade(hex,v){const n=parseInt(hex.slice(1),16);return '#'+[n>>16,(n>>8)&255,n&255].map(x=>Math.max(0,Math.min(255,Math.round(x*v))).toString(16).padStart(2,'0')).join('');}
  function face(mesh,vertices,color,detail=0){mesh.push({v:vertices,c:color,d:detail});}
  function box(mesh,x,y,z,w,h,d,color,detail=0){
    const a=[x-w/2,y,z-d/2],b=[x+w/2,y,z-d/2],c=[x+w/2,y,z+d/2],e=[x-w/2,y,z+d/2];
    const up=p=>[p[0],p[1]+h,p[2]];
    face(mesh,[a,b,up(b),up(a)],shade(color,.77),detail);face(mesh,[b,c,up(c),up(b)],shade(color,.65),detail);
    face(mesh,[c,e,up(e),up(c)],shade(color,.89),detail);face(mesh,[e,a,up(a),up(e)],shade(color,.96),detail);
    face(mesh,[up(a),up(b),up(c),up(e)],shade(color,1.1),detail);
  }
  function pyramid(mesh,x,y,z,r,h,color,sides=5,detail=0){
    for(let i=0;i<sides;i++){const a=i/sides*TAU,b=(i+1)/sides*TAU;face(mesh,[[x+Math.cos(a)*r,y,z+Math.sin(a)*r],[x+Math.cos(b)*r,y,z+Math.sin(b)*r],[x,y+h,z]],shade(color,.73+i/sides*.35),detail);}
  }
  // Each world type recolours the same island layout and swaps its vegetation and skyline.
  const TERRAIN={
    island:{sea:['#80b4ae','#83b7b0'],shore:'#d6c9a0',land:['#91ad77','#9ab77b','#a1b97e','#97b17b'],hill:'#86a681',ridge:'#8ca491',peak:'#92aaa0',snow:null,sky:['#bdd8d0','#dfE5cf','#91b7a6'],map:['#25483e','#56775a'],trees:160,plant:'pine'},
    desert:{sea:['#d9c48c','#d4bf86'],shore:'#e2c98f',land:['#c9a86b','#cfae70','#c4a267','#d0b074'],hill:'#b8794f',ridge:'#c98d5c',peak:'#a86a46',snow:null,sky:['#b9d3dc','#f0dfb8','#d6b98a'],map:['#4a3a2a','#b39160'],trees:90,plant:'cactus'},
    alpine:{sea:['#6f9463','#729766'],shore:'#a9b98a',land:['#a5bf7e','#9db877','#afc584','#a2bb7a'],hill:'#587d5c',ridge:'#6f8c78',peak:'#8f9ea0',snow:'#eef2ec',sky:['#a9cbe0','#e2ebe4','#8fb59f'],map:['#22402c','#6a8f58'],trees:230,plant:'pine'},
    arctic:{sea:['#7fa3b8','#83a7bb'],shore:'#e4ebe8',land:['#eef1ea','#e6ece6','#f2f4ee','#e9eee8'],hill:'#c9d3d1',ridge:'#d7dedc',peak:'#e3e8e6',snow:'#ffffff',sky:['#c2d3dc','#e9eef0','#b8c9cc'],map:['#33454c','#d8e0dc'],trees:110,plant:'snowpine'}
  };
  function tree(mesh,x,z,scale=1,plant='pine'){
    if(plant==='palm'){box(mesh,x,1,z,3*scale,44*scale,3*scale,'#9a8a60',1);for(let i=0;i<5;i++){const a=i/5*TAU;face(mesh,[[x,45*scale,z],[x+Math.cos(a+.35)*22*scale,40*scale,z+Math.sin(a+.35)*22*scale],[x+Math.cos(a)*30*scale,30*scale,z+Math.sin(a)*30*scale],[x+Math.cos(a-.35)*22*scale,40*scale,z+Math.sin(a-.35)*22*scale]],i%2?'#5f9455':'#6fa35f',1);}return;}
    if(plant==='cactus'){box(mesh,x,1,z,5*scale,34*scale,5*scale,'#5f8a52',1);box(mesh,x-6*scale,12*scale,z,4*scale,16*scale,4*scale,'#6a9459',1);box(mesh,x+6*scale,8*scale,z,4*scale,20*scale,4*scale,'#6a9459',1);return;}
    box(mesh,x,1,z,4*scale,20*scale,4*scale,'#8c8562',1);
    if(plant==='snowpine'){pyramid(mesh,x,13*scale,z,16*scale,40*scale,'#4f6e63',5,1);pyramid(mesh,x,30*scale,z,12*scale,30*scale,'#e9efeb',5,1);return;}
    pyramid(mesh,x,13*scale,z,16*scale,40*scale,'#497b59',5,1);pyramid(mesh,x,30*scale,z,12*scale,30*scale,'#64865b',5,1);
  }
  function hangar(mesh,x,z,scale=1){
    box(mesh,x,2,z,126*scale,49*scale,110*scale,'#ccd0b0');
    box(mesh,x,2,z+55*scale,105*scale,41*scale,1,'#526d67');
    const a=[x-68*scale,51*scale,z-59*scale],b=[x+68*scale,51*scale,z-59*scale],c=[x+68*scale,51*scale,z+59*scale],d=[x-68*scale,51*scale,z+59*scale],e=[x,73*scale,z-59*scale],f=[x,73*scale,z+59*scale];
    face(mesh,[a,e,f,d],'#718d80');face(mesh,[e,b,c,f],'#8fa497');face(mesh,[d,f,c],'#d7d8b9');face(mesh,[a,b,e],'#bdc9b1');
    for(let i=-2;i<=2;i++)box(mesh,x+i*19*scale,5,z+56*scale,1,36*scale,1,'#8da797',1);
  }
  function planeMesh(color,type='training'){
    if(type==='passenger')return jetMesh(color);
    const m=[];
    // Low-poly turboprop: nose faces local -Z, all coordinates in metres.
    box(m,0,-.2,.6,1.7,1.7,6.8,'#f5f4df');
    face(m,[[-.85,-.2,-2.8],[.85,-.2,-2.8],[.5,.4,-5],[-.5,.4,-5]],shade(color,.8));
    face(m,[[-.85,1.5,-2.8],[.85,1.5,-2.8],[.5,.4,-5],[-.5,.4,-5]],color);
    face(m,[[-.85,-.2,-2.8],[-.85,1.5,-2.8],[-.5,.4,-5]],'#eeeedd');
    face(m,[[.85,-.2,-2.8],[.5,.4,-5],[.85,1.5,-2.8]],'#c3d4c9');
    face(m,[[-.82,1.5,-2.1],[.82,1.5,-2.1],[.7,2,-.6],[-.7,2,-.6]],'#42666d');
    face(m,[[-.85,1.5,-2.1],[-.7,2,-.6],[-.7,1.6,.5],[-.85,1.3,.5]],'#577984');
    face(m,[[.85,1.5,-2.1],[.85,1.3,.5],[.7,1.6,.5],[.7,2,-.6]],'#3a626a');
    face(m,[[-.8,.8,-.9],[-8,.6,.7],[-8,.5,1.8],[-.8,.6,1.8]],color);
    face(m,[[.8,.8,-.9],[.8,.6,1.8],[8,.5,1.8],[8,.6,.7]],shade(color,.92));
    face(m,[[-.7,.6,3.7],[-3.3,.7,4.1],[-3.3,.7,5],[-.5,.7,4.8]],color);
    face(m,[[.7,.6,3.7],[.5,.7,4.8],[3.3,.7,5],[3.3,.7,4.1]],shade(color,.9));
    face(m,[[0,1,2.9],[0,4.1,4.3],[0,4,5],[0,.6,5]],color);
    box(m,0,.3,4,1,1,1.8,'#f0efdc');
    if(type==='cargo'||type==='emergency'){
      box(m,0,.9,1.4,2.05,1.1,4.8,'#e5e8d6');
      box(m,-3,.1,-.7,1,1.2,3,'#e6e6d3');box(m,3,.1,-.7,1,1.2,3,'#e6e6d3');
      for(const x of [-3,3])box(m,x,.55,-2.3,3.4,.12,.12,'#48615b');
      if(type==='emergency'){box(m,1.04,1.25,1.6,.05,.7,2.6,'#d77a5e');box(m,-1.04,1.25,1.6,.05,.7,2.6,'#d77a5e');}
    }
    if(type==='military'){
      face(m,[[-.8,.8,-2.1],[-7,.6,2.1],[-6.7,.6,3.1],[-.8,.7,1.5]],'#899783');
      face(m,[[.8,.8,-2.1],[.8,.7,1.5],[6.7,.6,3.1],[7,.6,2.1]],'#9aa78c');
      box(m,0,1.6,.8,1.1,.5,2.6,'#557675');
    }
    return m;
  }
  function jetMesh(color){
    const m=[],r=1.05;
    for(let i=0;i<8;i++){
      const a=i/8*TAU,b=(i+1)/8*TAU;
      const point=(t,z,s=1)=>[Math.cos(t)*r*s,.7+Math.sin(t)*r*s,z];
      face(m,[point(a,-4.5),point(b,-4.5),point(b,4.8),point(a,4.8)],shade('#f0efdc',.83+Math.sin(a)*.15));
      face(m,[point(a,-4.5),point(b,-4.5),[0,.6,-6.8]],shade('#f0efdc',.83+Math.sin(a)*.15));
      face(m,[point(a,4.8),point(b,4.8),[0,.9,7]],'#d5dece');
    }
    for(const side of [-1,1]){
      face(m,[[side*.8,.7,-1.5],[side*8.5,.3,2.1],[side*8.5,.3,3.2],[side*.8,.6,1.7]],color);
      face(m,[[side*.45,1,4.8],[side*3.5,1.15,6],[side*3.5,1.15,6.8],[side*.3,1,6.4]],color);
      box(m,side*3.5,-.7,.2,1.4,1.3,2.8,'#e1e5cf');
      box(m,side*3.5,-.45,-1.22,.95,.8,.08,'#47625b');
      for(let z=-3;z<4.2;z+=.7)box(m,side*1.04,1,z,.035,.28,.3,'#5a7b79');
      face(m,[[side*8.5,.3,2.1],[side*8.5,1.5,2.7],[side*8.5,1.5,3.2],[side*8.5,.3,3.2]],shade(color,.83));
    }
    face(m,[[0,1.3,3.8],[0,4.5,5.8],[0,4.5,6.9],[0,1.1,6.7]],color);
    face(m,[[-.65,1.3,-4.8],[.65,1.3,-4.8],[.85,1.45,-3.9],[-.85,1.45,-3.9]],'#466a6b');
    return m;
  }
  function transformed(mesh,x,y,z,yaw=0,pitch=0,roll=0,scale=1){
    const sy=Math.sin(yaw),cy=Math.cos(yaw),sp=Math.sin(pitch),cp=Math.cos(pitch),sr=Math.sin(roll),cr=Math.cos(roll);
    return mesh.map(f=>({c:f.c,d:f.d,v:f.v.map(p=>{
      let px=p[0]*scale,py=p[1]*scale,pz=p[2]*scale;
      // Positive bank lowers the right wing; positive pitch raises the nose.
      const rx=px*cr+py*sr,ry=-px*sr+py*cr;
      const yy=ry*cp-pz*sp,zz=ry*sp+pz*cp;
      return[x+rx*cy-zz*sy,y+yy,z+rx*sy+zz*cy];
    })}));
  }
  const DEFAULT_MAP={id:'island-seabreeze',terrain:'island',land:[[0,0,900,1350]],mountains:[],race:{shape:'arc'}};
  // Is a point on one of the map's landmasses? Used to keep trees and cabins off the water.
  // While a world is being built, `shapes` holds the actual coastline functions so trees and cabins follow bays and peninsulas.
  let shapes=null;
  function onLand(map,x,z,inset=.86){
    if(shapes)return shapes.some(sh=>{const a=Math.atan2(z-sh.cz,x-sh.cx),d=Math.hypot(x-sh.cx,z-sh.cz);return d<sh.radius(a)*inset;});
    return map.land.some(([cx,cz,rx,rz])=>((x-cx)/(rx*inset))**2+((z-cz)/(rz*inset))**2<1);
  }
  // Each landmass has its own coastline: an ellipse, randomly rotated and bent by several low-frequency
  // lobes (bays, peninsulas, a lopsided bulge) plus two scales of shoreline noise, all seeded from the
  // map's id. The first landmass must keep the airport zone dry, so its coast is never pulled inside the
  // "keep" ellipse around the runway. The result is cached and shared by the 3D world and the map.
  const COAST_CACHE={};
  function coastFor(map){
    if(COAST_CACHE[map.id])return COAST_CACHE[map.id];
    let s=2166136261;for(let i=0;i<map.id.length;i++){s^=map.id.charCodeAt(i);s=Math.imul(s,16777619)>>>0;}
    const rnd=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};
    const KEEP={x:280,z:0,rx:720,rz:1680};
    const keepRadius=(cx,cz,a)=>{ // distance from (cx,cz) along angle a to the keep ellipse edge
      const dx=Math.cos(a),dz=Math.sin(a),ox=cx-KEEP.x,oz=cz-KEEP.z;
      const A=(dx/KEEP.rx)**2+(dz/KEEP.rz)**2,B=2*(ox*dx/KEEP.rx**2+oz*dz/KEEP.rz**2),Cc=(ox/KEEP.rx)**2+(oz/KEEP.rz)**2-1;
      const disc=B*B-4*A*Cc;if(disc<0)return 0;return Math.max(0,(-B+Math.sqrt(disc))/(2*A));
    };
    const shapes=[],islands=[];
    const onShapes=(x,z,inset)=>shapes.some(sh=>{const a=Math.atan2(z-sh.cz,x-sh.cx),d=Math.hypot(x-sh.cx,z-sh.cz);return d<sh.radius(a)*inset;});
    // Scenery belongs to the landmass its centre stands on, whose coast is pushed out to cover it.
    // Peaks out at sea close to the main island become a peninsula of it; groups further out get an
    // island of their own, so no mountain, hill, or mesa is ever left standing on the water.
    const owned=map.land.map(()=>[]),loose=[];
    for(const d of (root.SkyCore?.mountainsFor?.(map)||[])){
      const e={x:d.x,z:d.z,r:(d.mesa?1.05:d.hill?.75:.95)*d.r+70};
      let best=-1,bestD=Infinity;
      map.land.forEach(([cx,cz,rx,rz],i)=>{const n=((d.x-cx)/rx)**2+((d.z-cz)/rz)**2;if(n<1&&n<bestD){best=i;bestD=n;}});
      if(best>=0)owned[best].push(e);else loose.push(e);
    }
    const [m0x,m0z,m0rx,m0rz]=map.land[0],extra=[];
    const group=loose.map((e,i)=>i);const find=i=>group[i]===i?i:(group[i]=find(group[i]));
    loose.forEach((a,i)=>loose.forEach((b,j)=>{if(j>i&&Math.hypot(a.x-b.x,a.z-b.z)<a.r+b.r+500)group[find(j)]=find(i);}));
    const groups={};loose.forEach((e,i)=>(groups[find(i)]=groups[find(i)]||[]).push(e));
    for(const g of Object.values(groups)){
      if(g.some(e=>((e.x-m0x)/(m0rx+2000))**2+((e.z-m0z)/(m0rz+2000))**2<1)){owned[0].push(...g);continue;}
      let x0=Infinity,x1=-Infinity,z0=Infinity,z1=-Infinity;
      for(const e of g){x0=Math.min(x0,e.x-e.r);x1=Math.max(x1,e.x+e.r);z0=Math.min(z0,e.z-e.r);z1=Math.max(z1,e.z+e.r);}
      extra.push({cx:(x0+x1)/2,cz:(z0+z1)/2,rx:(x1-x0)/2+150,rz:(z1-z0)/2+150,members:g});
    }
    const coverRadius=(cx,cz,a,extras)=>{
      let need=0;const dx=Math.cos(a),dz=Math.sin(a);
      for(const e of extras){
        const ex=e.x-cx,ez=e.z-cz,along=ex*dx+ez*dz,across=Math.abs(ex*dz-ez*dx);
        if(along<=0||across>=e.r)continue;
        need=Math.max(need,along+Math.sqrt(e.r*e.r-across*across));
      }
      return need;
    };
    const shoreline=(cx,cz,rx,rz,main,extras=[])=>{
      const rot=main?0:rnd()*TAU;
      const lobes=[{k:1,a:.08+rnd()*.2},{k:2,a:.12+rnd()*.28},{k:3,a:.08+rnd()*.22},{k:4,a:.04+rnd()*.12},{k:5,a:.03+rnd()*.1},{k:7,a:.02+rnd()*.06}].map(l=>({...l,p:rnd()*TAU}));
      const noise=[];const n=56;for(let i=0;i<n;i++)noise.push((rnd()-.5)*2);
      const radius=(a)=>{
        let mod=1;for(const l of lobes)mod+=l.a*Math.cos(l.k*a+l.p);mod=Math.max(.42,mod);
        const b=a-rot;let r=Math.hypot(Math.cos(b)*rx*mod,Math.sin(b)*rz*mod);
        if(extras.length)r=Math.max(r,coverRadius(cx,cz,a,extras)/.9);
        if(main)r=Math.max(r,keepRadius(cx,cz,a)/.9+90);return r;
      };
      shapes.push({cx,cz,radius});
      const pts=[];
      for(let i=0;i<n;i++){
        const a=i/n*TAU,fine=noise[i]*45+(noise[(i+1)%n]+noise[(i+n-1)%n])*25;
        let r=radius(a)+fine;if(extras.length)r=Math.max(r,coverRadius(cx,cz,a,extras)/.9+20);if(main)r=Math.max(r,keepRadius(cx,cz,a)/.9+60);
        pts.push([cx+Math.cos(a)*r,cz+Math.sin(a)*r]);
      }
      const isle={cx,cz,pts,main};islands.push(isle);return isle;
    };
    map.land.forEach(([cx,cz,rx,rz],i)=>shoreline(cx,cz,i?rx*(.8+rnd()*.4):rx,i?rz*(.8+rnd()*.4):rz,i===0,owned[i]));
    for(const g of extra)shoreline(g.cx,g.cz,g.rx,g.rz,false,g.members);
    // Islets and rocks offshore, kept out of the runway approach corridor.
    const [mx,mz,mrx,mrz]=map.land[0];
    for(let i=0,want=3+Math.floor(rnd()*5),tries=0;i<want&&tries<60;tries++){
      const a=rnd()*TAU,d=1.3+rnd()*1.1,x=mx+Math.cos(a)*mrx*d,z=mz+Math.sin(a)*mrz*d,r=70+rnd()*230;
      if(Math.abs(x)<450&&Math.abs(z)<3600)continue;if(onShapes(x,z,1.2))continue;
      i++;const isle=shoreline(x,z,r,r*(.6+rnd()*.8),false);if(r>150&&rnd()<.6)isle.knoll=[r*.55,r*.35];
    }
    return COAST_CACHE[map.id]={shapes,islands};
  }
  function mountain(m,T,x,z,r,h,color,mesa){
    if(mesa){box(m,x,-7,z,r*1.6,h,r*1.3,color||'#b0653f');box(m,x,h-8,z,r*1.7,6,r*1.4,shade(color||'#b0653f',1.15));return;}
    pyramid(m,x,-7,z,r,h,color||T.ridge,5);
    if(T.snow&&h>150)pyramid(m,x,h*.55-7,z,r*.45,h*.45+2,T.snow,5);
  }
  // Ocean tiles provide stable horizon geometry even when the camera crosses a tile.
  function buildOcean(T,extent){const m=[],step=2500,n=Math.ceil(extent/step);for(let i=-n;i<n;i++)for(let j=-n;j<n;j++){const x=i*step,z=j*step;face(m,[[x,-7,z],[x+step,-7,z],[x+step,-7,z+step],[x,-7,z+step]],(i+j)%2===0?T.sea[0]:T.sea[1]);}for(const f of m)f.ground=-7;return m;}
  function buildWorld(buildings,skin,map=DEFAULT_MAP,ox=0,oz=0){
    seed=183;const m=[],terrain=map.terrain,T=TERRAIN[terrain]||TERRAIN.island;
    const land=map.landColor||T.land,coast=coastFor(map);
    shapes=coast.shapes;seed=0;for(let i=0;i<map.id.length;i++)seed=(seed*31+map.id.charCodeAt(i))>>>0;
    for(const c of coast.islands){
      const {cx,cz,pts}=c,n=pts.length;
      for(let i=0;i<n;i++){
        const a=[pts[i][0],-2,pts[i][1]],b=[pts[(i+1)%n][0],-2,pts[(i+1)%n][1]];
        const ia=[cx+(a[0]-cx)*.9,1,cz+(a[2]-cz)*.91],ib=[cx+(b[0]-cx)*.9,1,cz+(b[2]-cz)*.91];
        face(m,[a,b,ib,ia],T.shore);face(m,[[cx,1,cz],ia,ib],land[i%4]);
      }
      if(c.knoll)pyramid(m,cx,-6,cz,c.knoll[0],c.knoll[1],T.hill,5);
    }
    // Mountains, ridges, and mesas: the same expanded list the collision model uses.
    for(const d of (root.SkyCore?.mountainsFor?.(map)||[])){
      if(d.hill)pyramid(m,d.x,-7,d.z,d.r,d.h,T.hill,7);
      else mountain(m,T,d.x,d.z,d.r,d.h,d.color,d.mesa);
    }
    const half=850+buildings.runway*150;
    box(m,0,1,0,77,1,half*2+15,'#d1c6a2');box(m,0,2,0,61,.5,half*2,'#64726d');
    for(let z=-half+65;z<half-30;z+=95)box(m,0,2.65,z,2,.1,37,'#eae8cd');
    for(let side of [-1,1]){
      box(m,side*27,2.6,0,1,.1,half*2-25,'#cfd6ba');
      for(let z=-half+55;z<half;z+=90)box(m,side*36,3,z,3,2,3,'#ffe3a1',1);
      for(let i=0;i<4;i++){box(m,side*(7+i*5),2.7,half-65,2,.1,45,'#f1efdb');box(m,side*(7+i*5),2.7,-half+65,2,.1,45,'#f1efdb');}
    }
    // Taxiways, apron, roads and service markings.
    box(m,175,1.7,310,310,.5,54,'#a8af95');box(m,277,1.8,10,280,.5,590,'#b7baa1');
    box(m,180,2.5,310,315,.1,1,'#f0d279',1);
    box(m,282,2.5,10,1,.1,565,'#ebd17e',1);
    box(m,500,1.4,80,28,.4,950,'#b2b596');
    for(let z=-320;z<510;z+=55)box(m,500,2,z,1,.1,20,'#e6dfbb',1);
    // Terminal and rooftop observation deck.
    const tw=175+buildings.terminal*28;
    box(m,385,2,-70,92,42,tw,'#dddcc3');box(m,382,44,-70,103,4,tw+13,'#f0e9c8');
    box(m,337,13,-70,1,22,tw-20,'#6e9b95');
    for(let z=-tw/2-55;z<tw/2-70;z+=18)box(m,335,12,z,2,25,2,'#dddcc4',1);
    box(m,380,48,-70,65,12,70,'#b9c8ac');box(m,380,60,-70,72,3,77,'#ecdfb6');
    for(let i=0;i<3+buildings.terminal;i++){const z=-145+i*70;box(m,310,13,z,58,12,12,'#e0dbc0');box(m,278,2,z,10,23,20,'#8ba99a');}
    for(let i=0;i<2+buildings.hangar;i++)hangar(m,200+i%2*166,-420-Math.floor(i/2)*155,.85);
    // Tower.
    const tx=500,tz=-265,th=110+buildings.radar*22;
    box(m,tx,2,tz,30,th,30,'#dadbc0');box(m,tx,th,tz,66,7,61,'#e6e4c7');box(m,tx,th+7,tz,58,25,52,'#5f8b86');box(m,tx,th+32,tz,70,7,65,'#eee4bd');box(m,tx,th+39,tz,3,24,3,'#667f6b');
    if(buildings.radar)box(m,tx,th+60,tz,34,9,7,'#b2bfaa');
    // Fuel tanks and emergency service facilities appear as purchased.
    for(let i=0;i<buildings.fuel+1;i++){box(m,405+i*40,2,405,29,30,29,'#ddd8b3');box(m,405+i*40,32,405,33,3,33,'#96a594');}
    if(buildings.rescue){box(m,580,2,255,88,34,80,'#d4c6a3');box(m,580,36,255,96,5,86,'#bb7960');box(m,580,8,297,65,23,1,'#8c7764');box(m,557,2,315,15,11,27,'#da7c54');}
    // Trees are scattered over the landmasses, keeping the runway's approaches and apron clear.
    const trees=map.trees??T.trees,plant=map.plant||T.plant;
    for(let i=0,tries=0;i<trees&&tries<trees*6;tries++){
      const [cx,cz,rx,rz]=map.land[Math.floor(random()*map.land.length)],x=cx+(random()-.5)*rx*1.7,z=cz+(random()-.5)*rz*1.7;
      if(!onLand(map,x,z)||Math.abs(x)<100&&Math.abs(z)<1400||x>90&&x<680&&z>-860&&z<560)continue;
      i++;tree(m,x,z,.55+random()*.7,plant);
    }
    if(map.grove){const [gx,gz,gr]=map.grove;for(let i=0;i<26;i++){const a=i/26*TAU+random()*.2,r=gr*(.75+random()*.3);tree(m,gx+Math.cos(a)*r,gz+Math.sin(a)*r*.8,.8+random()*.5,plant);}face(m,[[gx-gr*.5,-1,gz-gr*.35],[gx+gr*.5,-1,gz-gr*.35],[gx+gr*.55,-1,gz+gr*.35],[gx-gr*.55,-1,gz+gr*.35]],'#6fb3b8');}
    // Cabins and windsock.
    if(map.cabins){const [hx,hz]=map.cabins;for(let i=0;i<6;i++){const x=hx-i*46,z=hz+(i%2)*65;if(!onLand(map,x,z))continue;box(m,x,2,z,32,22,34,'#e3d5af',1);pyramid(m,x,24,z,28,15,'#9c8570',4,1);}}
    box(m,-92,2,560,2,37,2,'#d2d6b9');face(m,[[-92,37,560],[-68,33,562],[-68,36,565],[-92,42,564]],'#e7ae71');
    // Parked aircraft at stands; enlarged modestly for the airport overview.
    m.push(...transformed(planeMesh(skin,'passenger'),220,6,120,Math.PI/2,0,0,3.2));
    m.push(...transformed(planeMesh('#cbd9bf','cargo'),205,6,-15,Math.PI/2,0,0,3.2));
    m.push(...transformed(planeMesh('#cf8d70'),-1,4,-440,0,0,0,1.6));
    // Rescue boat wherever the map puts open water.
    if(map.boat){const [bx,bz]=map.boat;box(m,bx,-3,bz,12,5,36,'#e4d6ad');box(m,bx,2,bz+3,7,7,14,'#f7efda');box(m,bx,9,bz+3,1,8,1,'#667a6b');}
    shapes=null;
    for(const f of m)if(f.v.every(p=>p[1]<=3))f.ground=Math.max(...f.v.map(p=>p[1]));
    if(ox||oz)for(const f of m)f.v=f.v.map(p=>[p[0]+ox,p[1],p[2]+oz]);
    return m;
  }
  class Renderer{
    constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.world=[];this.signature='';this.quality='low';this.frame=0;this.clouds=[];this.width=0;this.height=0;this.planeColor='';}
    resize(quality){
      const rect=this.canvas.getBoundingClientRect();
      const scale=quality==='high'?Math.min(root.devicePixelRatio||1,1.5):quality==='medium'?1:.72;
      const w=Math.max(1,Math.round(rect.width*scale)),h=Math.max(1,Math.round(rect.height*scale));
      if(w!==this.width||h!==this.height){this.canvas.width=w;this.canvas.height=h;this.width=w;this.height=h;}
      this.quality=quality;
    }
    // The layout is a list of islands { map, x, z, buildings }; the first is the one you are standing on.
    sync(state,layout){
      layout=layout||root.SkyCore?.homeLayout?.(state)||[{map:DEFAULT_MAP,x:0,z:0,buildings:state.buildings}];
      const sig=state.skin+'|'+layout.map(i=>i.map.id+'@'+i.x+','+i.z+':'+JSON.stringify(i.buildings)).join(';');
      if(sig!==this.signature){
        this.chunks=layout.map(i=>({x:i.x,z:i.z,faces:buildWorld(i.buildings,state.skin,i.map,i.x,i.z)}));
        const T=TERRAIN[layout[0].map.terrain]||TERRAIN.island,extent=Math.max(12000,...layout.map(i=>Math.max(Math.abs(i.x),Math.abs(i.z))+9000));
        this.ocean=buildOcean(T,extent);this.signature=sig;this.terrain=layout[0].map.terrain;this.map=layout[0].map;
      }
      if(this.planeColor!==state.skin){this.plane=planeMesh(state.skin);this.planeColor=state.skin;}
    }
    render(state,flight=null,mode=0,clock=0){
      this.sync(state,flight?.islands);this.resize(state.settings.graphics);if(this.width<2||this.height<2)return;
      const planeKey=state.skin+(flight?.type||'training');if(this.planeKey!==planeKey){this.plane=planeMesh(state.skin,flight?.type||'training');this.planeKey=planeKey;}
      const ctx=this.ctx,w=this.width,h=this.height;
      const weather=state.settings.weather,storm=weather==='storm',sunset=weather==='sunset';
      const T=TERRAIN[this.terrain]||TERRAIN.island;
      const skyColors=this.map?.sky||T.sky;
      const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,storm?'#859d9d':sunset?'#bdc5bc':skyColors[0]);sky.addColorStop(.7,storm?'#b2bbb0':sunset?'#efdab3':skyColors[1]);sky.addColorStop(1,storm?'#91b7a6':skyColors[2]);ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
      let camera,target;
      if(!flight){camera=mode===5?[2900,3300,3600]:mode===4?[1420,1120,1590]:[1170,1160,1450];target=mode===5?[-500,0,-900]:mode===4?[40,0,-70]:[-490,0,210];}
      else{
        const f=flight;const sy=Math.sin(f.yaw),cy=Math.cos(f.yaw);
        if(mode===1){camera=[f.x+sy*1.8,f.y+2.4,f.z-cy*1.8];target=[f.x+sy*130,f.y+2.4+Math.tan(f.pitch)*130,f.z-cy*130];}
        else if(mode===2){const a=f.yaw+clock*.23;camera=[f.x+Math.sin(a)*38,f.y+14,f.z+Math.cos(a)*38];target=[f.x,f.y+1,f.z];}
        else{camera=[f.x-sy*36,f.y+14,f.z+cy*36];target=[f.x+sy*18,f.y+2+f.pitch*12,f.z-cy*18];}
      }
      const forward=norm(sub(target,camera)),right=norm(cross(forward,[0,1,0])),up=cross(right,forward);
      const focal=(flight?.78:mode===5?1.25:1.07)*Math.min(w,h*1.45);
      const project=p=>{const d=sub(p,camera);return[dot(d,right),-dot(d,up),dot(d,forward)];};
      const screen=p=>[w/2+p[0]/p[2]*focal,h*.5+p[1]/p[2]*focal];
      this.projection={camera,project,screen,focal};
      // Soft, geometric clouds, no textures or external assets.
      if(!storm){ctx.fillStyle=sunset?'#f7e9cd80':'#f4f7e780';for(let i=0;i<(this.quality==='low'?4:8);i++){const x=((i*197+clock*1.4)%(w+150))-75,y=h*.10+(i%3)*h*.065;ctx.beginPath();ctx.ellipse(x,y,48+(i%3)*20,9+(i%2)*5,0,0,TAU);ctx.fill();}}
      const far=this.quality==='low'?9000:14000;
      // Only islands within view distance are projected; the ocean is always drawn.
      const faces=this.ocean.slice();
      for(const chunk of this.chunks)if(Math.hypot(chunk.x-camera[0],chunk.z-camera[2])<far+6000)faces.push(...chunk.faces);
      if(!flight&&mode===3)faces.push(...transformed(jetMesh('#ddb265'),440,610+Math.sin(clock*.3)*7,610,-.55,.08,-.09,15));
      if(flight){
        if(mode!==1){faces.push(...transformed(this.plane,flight.x,flight.y+2,flight.z,flight.yaw,flight.pitch,flight.roll,1));
          if(flight.gear){const wheel=[];box(wheel,-1,-1.4,.4,.3,.8,.7,'#3e534d');box(wheel,1,-1.4,.4,.3,.8,.7,'#3e534d');box(wheel,0,-1.2,-3,.3,.8,.7,'#3e534d');faces.push(...transformed(wheel,flight.x,flight.y+2,flight.z,flight.yaw,flight.pitch,flight.roll));}
          if(flight.type!=='passenger'){const prop=[];const rpm=flight.throttle*30+(flight.onGround?0:Math.min(6,flight.airSpeed*.08)),dtc=Math.min(.1,Math.max(0,clock-(this.propClock??clock)));this.propClock=clock;this.propAngle=(this.propAngle||0)+rpm*dtc;const a=this.propAngle,cy=Math.cos(a)*2.2,sy=Math.sin(a)*2.2;face(prop,[[-cy,-sy,-5.1],[cy,sy,-5.1],[cy+.1,sy+.1,-5.1],[-cy+.1,-sy+.1,-5.1]],'#a7c0ae');faces.push(...transformed(prop,flight.x,flight.y+2.5,flight.z,flight.yaw,flight.pitch,flight.roll));}
        }
        // The ghost replays a stored record as a translucent aircraft.
        const ghost=flight.ghost;
        if(ghost&&!ghost.finished){if(!this.ghostMesh)this.ghostMesh=planeMesh('#7fc4d8','training');faces.push(...transformed(this.ghostMesh,ghost.x,ghost.y+2,ghost.z,ghost.yaw,ghost.pitch,ghost.roll,1).map(f=>({...f,a:.42})));}
        for(let i=flight.gate;i<Math.min(flight.gate+3,flight.gates.length);i++){
          const g=flight.gates[i],prev=i?flight.gates[i-1]:{x:0,z:630};
          const yaw=Math.atan2(g.x-prev.x,-(g.z-prev.z));const ring=[];const r=flight.gateRadius;
          for(let j=0;j<20;j++){const a=j/20*TAU,b=(j+1)/20*TAU;face(ring,[[Math.cos(a)*r,Math.sin(a)*r,0],[Math.cos(b)*r,Math.sin(b)*r,0],[Math.cos(b)*(r+5),Math.sin(b)*(r+5),0],[Math.cos(a)*(r+5),Math.sin(a)*(r+5),0]],i===flight.gate?'#e4f0a5':'#bbcfa7');}
          faces.push(...transformed(ring,g.x,g.y,g.z,yaw));
        }
      }
      const polys=[];const near=1.3;
      for(const f of faces){
        if(this.quality==='low'&&f.d>0&&flight&&Math.hypot(f.v[0][0]-camera[0],f.v[0][2]-camera[2])>1100)continue;
        let points=f.v.map(project);if(points.every(p=>p[2]<near)||points.every(p=>p[2]>(f.ground!==undefined?far+7000:far)))continue;
        if(points.some(p=>p[2]<near)){
          const clipped=[];
          for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],ina=a[2]>=near,inb=b[2]>=near;if(ina)clipped.push(a);if(ina!==inb){const t=(near-a[2])/(b[2]-a[2]);clipped.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,near]);}}
          points=clipped;
        }
        if(points.length<3)continue;
        const projected=points.map(screen);
        if(projected.every(p=>p[0]<0)||projected.every(p=>p[0]>w)||projected.every(p=>p[1]<0)||projected.every(p=>p[1]>h))continue;
        const depth=points.reduce((n,p)=>n+p[2],0)/points.length;
        polys.push({p:projected,z:depth,c:f.c,ground:f.ground,a:f.a});
      }
      polys.sort((a,b)=>{
        if(a.ground!==undefined&&b.ground===undefined)return -1;
        if(a.ground===undefined&&b.ground!==undefined)return 1;
        if(a.ground!==undefined&&b.ground!==undefined&&a.ground!==b.ground)return a.ground-b.ground;
        return b.z-a.z;
      });
      for(const p of polys){ctx.beginPath();ctx.moveTo(...p.p[0]);for(let i=1;i<p.p.length;i++)ctx.lineTo(...p.p[i]);ctx.closePath();ctx.fillStyle=p.c;if(p.a){ctx.globalAlpha=p.a;ctx.fill();ctx.globalAlpha=1;}else ctx.fill();}
      if(flight){
        const g=flight.gates[flight.gate];
        if(g){
          const projected=project([g.x,g.y,g.z]);const distance=Math.hypot(g.x-flight.x,g.y-flight.y,g.z-flight.z);
          if(projected[2]>0){const s=screen(projected);if(s[0]>30&&s[0]<w-30&&s[1]>20&&s[1]<h-20){ctx.fillStyle='#294c3de8';const label=`${flight.gate+1} / ${flight.gates.length}  ·  ${(distance/1000).toFixed(1)} km`;ctx.font=`${Math.max(10,w/110)}px monospace`;ctx.textAlign='center';ctx.fillText(label,s[0],s[1]-Math.min(90,flight.gateRadius/projected[2]*focal)-12);}}
          const bearing=Math.atan2(g.x-flight.x,-(g.z-flight.z));let delta=bearing-flight.yaw;delta=Math.atan2(Math.sin(delta),Math.cos(delta));
          if(Math.abs(delta)>.55){ctx.fillStyle='#f1f6d9';ctx.strokeStyle='#315c43';ctx.lineWidth=2;const x=delta>0?w-30:30,y=h*.43;ctx.beginPath();ctx.moveTo(x+(delta>0?12:-12),y);ctx.lineTo(x+(delta>0?-8:8),y-13);ctx.lineTo(x+(delta>0?-8:8),y+13);ctx.closePath();ctx.fill();ctx.stroke();}
        }
        // Island name tags float above every other island in view so you always know where you are heading.
        if(flight.islands&&flight.islands.length>1){
          const tags=[];
          for(let i=0;i<flight.islands.length;i++){
            const isle=flight.islands[i],dist=Math.hypot(isle.x-flight.x,isle.z-flight.z);if(dist<900||dist>34000)continue;
            const p=project([isle.x,labelHeight(isle.map),isle.z]);if(p[2]<=near)continue;const s=screen(p);if(s[0]<-60||s[0]>w+60||s[1]<8||s[1]>h)continue;
            tags.push({s,dist,name:isle.map.name.toUpperCase(),home:i===0,target:flight.finish===i&&flight.finish>0});
          }
          tags.sort((a,b)=>b.dist-a.dist);
          for(const t of tags){
            const size=Math.max(9,Math.min(15,Math.round(w/95*(1.05-t.dist/45000))));ctx.font=`${size}px monospace`;ctx.textAlign='center';
            const text=`${t.home?'⌂ ':t.target?'▶ ':''}${t.name} · ${(t.dist/1000).toFixed(1)} km`,tw=ctx.measureText(text).width+12,x=Math.max(tw/2+4,Math.min(w-tw/2-4,t.s[0])),y=Math.max(Math.min(h*.24,110),t.s[1]);
            ctx.globalAlpha=Math.max(.45,1-t.dist/40000);
            ctx.fillStyle=t.target?'#3d6a3ccc':'#153e35bb';ctx.beginPath();ctx.roundRect(x-tw/2,y-size-10,tw,size+8,5);ctx.fill();
            ctx.beginPath();ctx.moveTo(x-4,y-2);ctx.lineTo(x+4,y-2);ctx.lineTo(x,y+3);ctx.closePath();ctx.fill();
            ctx.fillStyle='#f4f8e6';ctx.fillText(text,x,y-8);ctx.globalAlpha=1;
          }
        }
        if(mode===1){ctx.strokeStyle='#fff9';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(w/2-22,h/2);ctx.lineTo(w/2-6,h/2);ctx.moveTo(w/2+6,h/2);ctx.lineTo(w/2+22,h/2);ctx.moveTo(w/2,h/2-5);ctx.lineTo(w/2,h/2+5);ctx.stroke();}
      }
      if(storm){ctx.fillStyle='#52696926';ctx.fillRect(0,0,w,h);if(this.quality!=='low'){ctx.strokeStyle='#d5e8df66';ctx.lineWidth=1;for(let i=0;i<65;i++){const x=(i*89+clock*60)%w,y=(i*137+clock*360)%h;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-5,y+19);ctx.stroke();}}}
      if(!flight){const vignette=ctx.createRadialGradient(w*.65,h*.4,h*.2,w*.6,h*.5,w*.8);vignette.addColorStop(0,'#c7d99500');vignette.addColorStop(1,'#3a654d25');ctx.fillStyle=vignette;ctx.fillRect(0,0,w,h);}
      this.frame++;
    }
  }
  // Name tags sit clear of the tallest scenery on each island.
  const LABEL_HEIGHT={};
  function labelHeight(map){if(LABEL_HEIGHT[map.id]===undefined){let top=0;for(const m of (root.SkyCore?.mountainsFor?.(map)||[]))top=Math.max(top,m.h||0);LABEL_HEIGHT[map.id]=top+260;}return LABEL_HEIGHT[map.id];}
  // Top-down picture of an island: the real world faces painted from above, lowest first, so the map
  // shows the same coast, runway, buildings, and mountains as the 3D view. Cached per island layout.
  const TOPDOWN_CACHE={};
  function topDownFor(isle){
    const key=isle.map.id+':'+JSON.stringify(isle.buildings||{});
    if(TOPDOWN_CACHE[key])return TOPDOWN_CACHE[key];
    const faces=buildWorld(isle.buildings||{runway:1,hangars:1,terminal:1,tower:1},'#cf8d70',isle.map);
    let extent=1200;for(const f of faces)for(const p of f.v)extent=Math.max(extent,Math.abs(p[0]),Math.abs(p[2]));
    extent+=120;const size=640,px=size/(2*extent);
    const canvas=document.createElement('canvas');canvas.width=canvas.height=size;const ctx=canvas.getContext('2d');
    const sorted=faces.filter(f=>f.v.some(p=>p[1]>-6)).map(f=>({f,y:Math.max(...f.v.map(p=>p[1]))})).sort((a,b)=>a.y-b.y);
    const T=TERRAIN[isle.map.terrain]||TERRAIN.island,land=new Set(isle.map.landColor||T.land);
    for(const {f} of sorted){
      // Flat land is one tone from above; the fan shading only reads at eye level.
      ctx.fillStyle=land.has(f.c)&&f.v.every(p=>p[1]===1)?(isle.map.landColor||T.land)[1]:f.c;ctx.beginPath();
      f.v.forEach((p,i)=>{const x=size/2+p[0]*px,y=size/2+p[2]*px;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});
      ctx.closePath();ctx.fill();ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=.9;ctx.stroke(); // seals anti-aliasing seams between triangles
    }
    return TOPDOWN_CACHE[key]={canvas,extent};
  }
  // `flight.view` = { cx, cz, scale } chooses the window; islands come from flight.islands.
  function drawMap(canvas,flight){const ctx=canvas.getContext('2d'),w=canvas.width,T=TERRAIN[flight.terrain]||TERRAIN.island;ctx.clearRect(0,0,w,w);ctx.fillStyle=T.map[0];ctx.fillRect(0,0,w,w);const view=flight.view||{cx:0,cz:-500,scale:.024},scale=view.scale;const pos=(x,z)=>[w/2+(x-view.cx)*scale,w/2+(z-view.cz)*scale];
    const islands=flight.islands||[{x:0,z:0,map:{land:flight.land||[[0,0,900,1350]]},runwayHalf:flight.runwayHalf}];
    for(const isle of islands){
      const IT=TERRAIN[isle.map.terrain]||T,coast=isle.map.id?coastFor(isle.map):null;
      if(!coast){ctx.fillStyle=IT.map[1];for(const [lx,lz,rx,rz] of isle.map.land){const c=pos(isle.x+lx,isle.z+lz);ctx.beginPath();ctx.ellipse(c[0],c[1],Math.max(1.5,rx*scale),Math.max(1.5,rz*scale),0,0,TAU);ctx.fill();}continue;}
      const td=topDownFor(isle),side=td.extent*2*scale;
      if(side<4){const p=pos(isle.x,isle.z);ctx.fillStyle=IT.map[1];ctx.beginPath();ctx.arc(p[0],p[1],1.6,0,TAU);ctx.fill();continue;}
      const p=pos(isle.x-td.extent,isle.z-td.extent);ctx.imageSmoothingEnabled=true;ctx.drawImage(td.canvas,p[0],p[1],side,side);
    }
    for(const isle of islands){const lw=Math.max(1.5,3*scale/.024),a=pos(isle.x,isle.z-isle.runwayHalf),b=pos(isle.x,isle.z+isle.runwayHalf);ctx.lineCap='butt';ctx.strokeStyle='#24332f';ctx.lineWidth=lw+1.5;ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();ctx.strokeStyle='#eef3d8';ctx.lineWidth=Math.max(.8,lw*.45);ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();}if(islands.length>1){ctx.font=`${Math.max(8,Math.round(w/22))}px monospace`;ctx.textAlign='center';for(let i=0;i<islands.length;i++){const isle=islands[i],c=pos(isle.x,isle.z);if(scale<.0032&&i&&i!==flight.finish)continue;if(c[0]<-40||c[0]>w+40||c[1]<-10||c[1]>w+10)continue;const full=(isle.map.name||'').toUpperCase(),label=scale>=.0075?full:full.split(/[\s&]+/)[0],drop=Math.max(6,(isle.map.land?.[0]?.[3]||1350)*scale+9);ctx.fillStyle='#0e2a2499';const tw=ctx.measureText(label).width;ctx.fillRect(c[0]-tw/2-2,c[1]+drop-8,tw+4,10);ctx.fillStyle=i===0?'#f4e7a8':i===flight.finish&&flight.finish>0?'#c7f0a2':'#e2ecd0';ctx.fillText(label,c[0],c[1]+drop);}}
    ctx.strokeStyle='#acc49777';ctx.lineWidth=1;ctx.beginPath();flight.gates.forEach((g,i)=>{const p=pos(g.x,g.z);if(!i)ctx.moveTo(...p);else ctx.lineTo(...p);});ctx.stroke();flight.gates.forEach((g,i)=>{ctx.fillStyle=i<flight.gate?'#607f59':i===flight.gate?'#e8f7a6':'#9ab989';ctx.beginPath();ctx.arc(...pos(g.x,g.z),i===flight.gate?4:2,0,TAU);ctx.fill();});if(flight.ghost&&!flight.ghost.finished){ctx.fillStyle='#7fc4d8';ctx.beginPath();ctx.arc(...pos(flight.ghost.x,flight.ghost.z),3,0,TAU);ctx.fill();}const p=pos(flight.x,flight.z);ctx.save();ctx.translate(...p);ctx.rotate(flight.yaw);ctx.fillStyle='#fff9e1';ctx.beginPath();ctx.moveTo(0,-6);ctx.lineTo(-4,5);ctx.lineTo(0,2);ctx.lineTo(4,5);ctx.fill();ctx.restore();ctx.font='9px monospace';ctx.fillStyle='#cbd9b6';ctx.textAlign='left';ctx.fillText('N ↑',10,16);ctx.fillText((flight.mapLabel||'SEABREEZE').slice(0,16),10,w-10);if(flight.mapNote){ctx.textAlign='right';ctx.fillText(flight.mapNote.slice(0,12),w-8,16);}}
  root.SkyWorld={Renderer,drawMap,coastFor,topDownFor,buildWorld};
})(globalThis);

