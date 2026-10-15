/* Fonctions pures du calendrier de révision. Dates locales YYYY-MM-DD. */
(function(root, factory) {
  var api=factory();
  if(typeof module!=="undefined"&&module.exports) module.exports=api;
  root.ZLEARN_SRS=api;
}(typeof window!=="undefined"?window:(typeof globalThis!=="undefined"?globalThis:this),function(){
  "use strict";
  var intervals=[1,3,7,14,30];
  function shift(day,n){var d=new Date(day+"T12:00:00"); d.setDate(d.getDate()+n); return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2);}
  function grade(card,correct,confidence,day){
    var old=card||{}, box=old.box||1, next;
    if(!correct||confidence==="guessed") next=1;
    else if(confidence==="sure") next=Math.min(5,box+1);
    else next=box;
    var days=(!correct||confidence==="guessed")?1:intervals[next-1];
    var history=Array.isArray(old.history)?old.history.slice():[]; history.push(correct?1:0);
    return {box:next,due:shift(day,days),history:history};
  }
  function dueCards(catalog,state,day,max){
    var eligible=[]; (catalog||[]).forEach(function(item){var c=state.cards[item.question.id]; if(c&&c.due<=day) eligible.push({item:item,due:c.due,subject:item.subject});});
    eligible.sort(function(a,b){return a.due<b.due?-1:a.due>b.due?1:0;});
    var groups={}, order=[], result=[];
    eligible.forEach(function(x){if(!groups[x.subject]){groups[x.subject]=[];order.push(x.subject);}groups[x.subject].push(x);});
    while(order.length&&result.length<(max||20)){var next=[];order.forEach(function(s){if(groups[s].length){result.push(groups[s].shift());if(groups[s].length)next.push(s);}});order=next;}
    return result.map(function(x){return x.item;});
  }
  return {intervals:intervals.slice(),shiftDate:shift,grade:grade,dueCards:dueCards};
}));
