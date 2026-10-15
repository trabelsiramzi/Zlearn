/* Stockage versionné Zlearn. Les anciennes clés sont conservées pour permettre un retour arrière. */
(function (root, factory) {
  var api = factory(root);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.ZLEARN_STORAGE = api;
}(typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this), function (root) {
  "use strict";
  var KEY = "zlearn:v2", memory = {}, nativeStore = null;
  try { nativeStore = root.localStorage; if (nativeStore) { var probe = "__zlearn_probe"; nativeStore.setItem(probe, "1"); nativeStore.removeItem(probe); } } catch (e) { nativeStore = null; }
  function rawGet(k) { try { return nativeStore ? nativeStore.getItem(k) : (Object.prototype.hasOwnProperty.call(memory, k) ? memory[k] : null); } catch (e) { return Object.prototype.hasOwnProperty.call(memory, k) ? memory[k] : null; } }
  function rawSet(k, v) { v = String(v); memory[k] = v; try { if (nativeStore) nativeStore.setItem(k, v); } catch (e) {} }
  function state() { var s; try { s = JSON.parse(rawGet(KEY) || "null"); } catch (e) { s = null; } return validState(s) ? s : empty(); }
  function empty() { return {schema:2, lessons:{}, checks:{}, cards:{}, answers:{}, prefs:{}}; }
  function validState(s) { return !!s && s.schema === 2 && obj(s.lessons) && obj(s.checks) && obj(s.cards) && obj(s.answers) && obj(s.prefs); }
  function obj(x) { return !!x && typeof x === "object" && !Array.isArray(x); }
  function save(s) { if (!validState(s)) return false; rawSet(KEY, JSON.stringify(s)); return true; }
  function today() { var d = new Date(); return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2); }
  function dateOf(v) { var d = new Date(v); return isNaN(d.getTime()) ? today() : d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2); }
  function catalog() { return root.ZLEARN_STORAGE_CATALOG || {keys:[], lessonKeys:{}, checkIds:{}, groupIds:{}, answerIds:{}, quizIds:{}}; }
  function allowed(k) { var a = catalog().keys || []; return a.indexOf(k) !== -1; }
  function migrateValue(s, k, value) {
    var c = catalog(), m, parsed, name, i, mapped;
    if (k === "mourshid-theme") { if (value === "dark" || value === "light") s.prefs.theme = value; return; }
    if (k.indexOf("zlearn-answer-") === 0) { name=k.slice(14); if (c.answerIds[name]) s.answers[c.answerIds[name]]=value; return; }
    if (k.indexOf("mourshid-learning-") === 0) {
      name=k.slice(18); try { parsed=JSON.parse(value); } catch(e) { return; }
      if (!obj(parsed)) return;
      if (obj(parsed.completed)) Object.keys(parsed.completed).forEach(function(n){ mapped=c.lessonKeys[name+":"+n]; if(mapped && parsed.completed[n]) { s.lessons[mapped]=s.lessons[mapped]||{}; if(!s.lessons[mapped].completedAt) s.lessons[mapped].completedAt=today(); }});
      if (parsed.lastLesson != null) { mapped=c.lessonKeys[name+":"+parsed.lastLesson]; if(mapped) { s.lessons[mapped]=s.lessons[mapped]||{}; if(parsed.lastAt) s.lessons[mapped].lastOpened=dateOf(parsed.lastAt); } }
      return;
    }
    if (k.indexOf("mourshid-") === 0 && /-verses$/.test(k)) { name=k.slice(9,-7); mapped=c.answerIds[name+"-verses"]; if(mapped) s.answers[mapped]=value; return; }
    if (k.indexOf("mourshid-quiz-") === 0) {
      name=k.slice(14); try { parsed=JSON.parse(value); } catch(e) { return; }
      if (!obj(parsed) || !obj(parsed.g) || !c.quizIds[name]) return;
      Object.keys(parsed.g).forEach(function(ix){ i=Number(ix); mapped=c.quizIds[name][i]; if(mapped && (parsed.g[ix]==="ok" || parsed.g[ix]==="review")) s.cards[mapped]={box:1,due:today(),history:[parsed.g[ix]==="ok"?1:0]}; }); return;
    }
    if (k.indexOf("mourshid-") === 0) {
      name=k.slice(9); mapped=c.groupIds[name]; if (!mapped) return;
      try { parsed=JSON.parse(value); } catch(e) { return; }
      if (!obj(parsed)) return;
      Object.keys(parsed).forEach(function(id){ var cid=c.checkIds[id]; if(cid) s.checks[cid]=parsed[id] === true; });
    }
  }
  function migrate() {
    var s=state(), c=catalog(), i,k,v,marker="_legacyMigrated";
    if (s.prefs[marker]) return s;
    for(i=0;i<(c.keys||[]).length;i++){ k=c.keys[i]; v=rawGet(k); if(v!==null) migrateValue(s,k,v); }
    s.prefs[marker]=true; save(s); return s;
  }
  function syncLegacy(s) {
    var c=catalog(), reverse={}, groups={}, lessons={}, answers={}, k, old, raw, subject, number;
    Object.keys(c.checkIds||{}).forEach(function(id){reverse[c.checkIds[id]]=id;});
    Object.keys(c.groupIds||{}).forEach(function(id){groups[id]={};});
    Object.keys(s.checks).forEach(function(id){old=reverse[id]; if(old){ Object.keys(c.groupIds||{}).forEach(function(g){if(old.indexOf(g+"-")===0) groups[g][old]=s.checks[id];}); }});
    Object.keys(groups).forEach(function(g){raw="mourshid-"+g; if(allowed(raw)) rawSet(raw,JSON.stringify(groups[g]));});
    Object.keys(c.lessonKeys||{}).forEach(function(pair){var p=pair.split(":"); subject=p[0]; number=p[1]; lessons[subject]=lessons[subject]||{completed:{}}; if(s.lessons[c.lessonKeys[pair]] && s.lessons[c.lessonKeys[pair]].completedAt) lessons[subject].completed[number]=true;});
    Object.keys(lessons).forEach(function(sub){raw="mourshid-learning-"+sub; if(allowed(raw)) rawSet(raw,JSON.stringify(lessons[sub]));});
    Object.keys(c.answerIds||{}).forEach(function(oldId){var target=c.answerIds[oldId]; if(Object.prototype.hasOwnProperty.call(s.answers,target)){raw=oldId.slice(-7)==="-verses"?"mourshid-"+oldId:"zlearn-answer-"+oldId; if(allowed(raw)) rawSet(raw,s.answers[target]);}});
    if(s.prefs.theme) rawSet("mourshid-theme",s.prefs.theme);
  }
  function getItem(k) { var v=rawGet(k); if(v!==null) return v; return null; }
  function setItem(k,v) { rawSet(k,v); var s=state(); if(allowed(k)) { migrateValue(s,k,String(v)); save(s); } }
  function removeItem(k) { /* Anciennes clés restent présentes pour permettre le rollback. */ setItem(k, ""); }
  function importV1(data) { if(!obj(data)) return false; var s=state(); Object.keys(data).forEach(function(k){ if(allowed(k) && typeof data[k]==="string") { rawSet(k,data[k]); migrateValue(s,k,data[k]); } }); save(s); return true; }
  function importV2(input) { var s=input && input.data ? input.data : input; if(!validState(s)) return false; var clean=empty(); Object.keys(s.lessons).forEach(function(k){ if(/^[a-z0-9-]+$/.test(k) && obj(s.lessons[k])) clean.lessons[k]=s.lessons[k]; }); Object.keys(s.checks).forEach(function(k){ if(/^[a-z0-9-]+$/.test(k) && typeof s.checks[k]==="boolean") clean.checks[k]=s.checks[k]; }); Object.keys(s.cards).forEach(function(k){ var c=s.cards[k]; if(/^[a-z0-9-]+$/.test(k) && obj(c) && c.box>=1 && c.box<=5 && /^\d{4}-\d\d-\d\d$/.test(c.due) && Array.isArray(c.history)) clean.cards[k]=c; }); Object.keys(s.answers).forEach(function(k){ if(/^[a-z0-9-]+$/.test(k) && typeof s.answers[k]==="string") clean.answers[k]=s.answers[k]; }); if(s.prefs.theme==="dark" || s.prefs.theme==="light") clean.prefs.theme=s.prefs.theme; save(clean); syncLegacy(clean); return true; }
  migrate();
  return {getItem:getItem,setItem:setItem,removeItem:removeItem,getState:state,setState:save,migrate:migrate,allowedKey:allowed,importV1:importV1,importV2:importV2,exportV2:function(){return {format:"zlearn-progress",version:2,exportedAt:new Date().toISOString(),data:state()};}};
}));
