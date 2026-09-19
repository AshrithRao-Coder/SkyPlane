/* Independent world saves. Creation choices are retained on every update. */
(function(root){
  'use strict';
  const C=typeof module!=='undefined'&&module.exports?require('./core.js'):root.SkyCore;
  const KEY='skyplane-worlds-v2',LEGACY_KEY='skyplane-save-v1';
  const clone=x=>JSON.parse(JSON.stringify(x));
  const empty=()=>({version:2,lastWorldId:null,worlds:[]});
  function validate(raw){
    if(!raw||raw.version!==2||!Array.isArray(raw.worlds))throw new Error('Unrecognized world library');
    const ids=new Set();
    const worlds=raw.worlds.map(w=>{
      if(!w||typeof w.id!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(w.id)||ids.has(w.id))throw new Error('Invalid world entry');
      ids.add(w.id);return {id:w.id,createdAt:Number.isFinite(w.createdAt)?w.createdAt:0,updatedAt:Number.isFinite(w.updatedAt)?w.updatedAt:0,state:C.sanitize(w.state)};
    });
    return {version:2,lastWorldId:ids.has(raw.lastWorldId)?raw.lastWorldId:null,worlds};
  }
  class Store{
    constructor(storage){this.storage=storage;this.available=!!storage;this.warning='';this.memory=empty();this.initialize();}
    initialize(){
      if(!this.storage){this.warning='Browser storage is unavailable. Export each airport before closing.';return;}
      try{
        const existing=this.storage.getItem(KEY);
        if(existing){this.memory=validate(JSON.parse(existing));return;}
        const old=this.storage.getItem(LEGACY_KEY);
        if(old){const state=C.sanitize(JSON.parse(old)),id=this.id();this.memory={version:2,lastWorldId:id,worlds:[{id,createdAt:Date.now(),updatedAt:Date.now(),state}]};this.persist(this.memory);}
      }catch(e){
        try{const backup=this.storage.getItem(KEY+'-backup');if(backup){this.memory=validate(JSON.parse(backup));this.warning='Your airports were recovered from the previous local backup.';return;}}catch{}
        // Preserve unreadable data instead of overwriting it with an empty save.
        this.available=false;this.storage=null;this.warning='Saved airports could not be read. Existing data has been preserved. Import an exported backup; new worlds will be temporary until browser storage is available.';
      }
    }
    id(){return 'world-'+(root.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));}
    read(){
      if(this.available){try{const raw=this.storage.getItem(KEY);if(raw)this.memory=validate(JSON.parse(raw));}catch{this.available=false;this.warning='Local saving is unavailable. Export your airports before closing.';}}
      return clone(this.memory);
    }
    persist(library){
      this.memory=clone(library);
      if(this.available){try{const previous=this.storage.getItem(KEY);if(previous)this.storage.setItem(KEY+'-backup',previous);this.storage.setItem(KEY,JSON.stringify(library));}catch{this.available=false;this.warning='Local saving is unavailable or storage is full. Export your airports before closing.';}}
      return this.available;
    }
    add(state){
      const library=this.read(),now=Date.now(),record={id:this.id(),createdAt:now,updatedAt:now,state:C.sanitize(state)};
      library.worlds.push(record);library.lastWorldId=record.id;this.persist(library);return clone(record);
    }
    create(options){return this.add(C.freshState(options));}
    update(id,state){
      const library=this.read(),record=library.worlds.find(w=>w.id===id);if(!record)return false;
      const next=C.sanitize({...state,world:clone(record.state.world)});
      record.state=next;record.updatedAt=Date.now();library.lastWorldId=id;this.persist(library);return true;
    }
    rename(id,name){const library=this.read(),record=library.worlds.find(w=>w.id===id);if(!record)return false;record.state.world.name=C.worldName(name);this.persist(library);return true;}
    remove(id){const library=this.read();library.worlds=library.worlds.filter(w=>w.id!==id);if(library.lastWorldId===id)library.lastWorldId=library.worlds.at(-1)?.id||null;this.persist(library);}
  }
  const api={Store,KEY,LEGACY_KEY,validate};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SkyWorlds=api;
})(globalThis);
