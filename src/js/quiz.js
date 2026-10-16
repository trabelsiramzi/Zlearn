/* Interface de rappel actif : réponse, confiance, correction expliquée, auto-évaluation. */
(function(root){
  "use strict";
  function el(tag,cls,text){var n=document.createElement(tag); if(cls)n.className=cls; if(text)n.textContent=text; return n;}
  function save(q,correct,confidence){var st=root.ZLEARN_STORAGE.getState(); st.cards[q.id]=root.ZLEARN_SRS.grade(st.cards[q.id],correct,confidence,root.ZLEARN_SRS.shiftDate((function(){var d=new Date();return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2);}()),0)); root.ZLEARN_STORAGE.setState(st);}
  /* Donne le focus à la carte : premier contrôle interactif, sinon le conteneur (tabindex=-1). */
  function place(node){
    if(!node||!node.focus)return false;
    if(node.disabled)return false;
    if(!node.getAttribute("tabindex")&&!/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(node.tagName||""))node.setAttribute("tabindex","-1");
    try{node.focus();}catch(e){}
    return true;
  }
  function focusStage(stage){
    place(stage.querySelector("button, a[href], input, select, textarea, [tabindex]")||stage);
  }
  /* Après la fin d'une carte : carte suivante dans l'ordre du document, sinon message de fin. */
  function focusNext(card,stage){
    var cards=document.querySelectorAll(".study-card");
    for(var i=0;i<cards.length;i++){
      if(cards[i]===card){
        var next=cards[i+1];
        if(next){ place(next.querySelector("textarea")||next)||place(next); } else { place(stage); }
        return;
      }
    }
    place(stage);
  }
  function renderOne(host,q,onDone){
    var card=el("article","study-card"); card.appendChild(el("h3","",q.prompt));
    var answer=el("textarea","study-answer"); answer.rows=3; answer.setAttribute("aria-label","اكتب إجابتك قبل عرض الإجابة النموذجية"); answer.placeholder="اكتب إجابتك من الذاكرة…"; card.appendChild(answer);
    var stage=el("div","study-stage"); stage.setAttribute("aria-live","polite"); card.appendChild(stage);
    var attempt=el("button","btn primary","سجّلت محاولتي"); attempt.type="button"; attempt.disabled=true; card.appendChild(attempt);
    answer.addEventListener("input",function(){attempt.disabled=!answer.value.trim();});
    attempt.addEventListener("click",function(){ if(!answer.value.trim())return; answer.disabled=true; attempt.disabled=true; attempt.hidden=true;
      stage.innerHTML=""; stage.appendChild(el("p","study-label","ما مستوى ثقتك قبل رؤية الإجابة؟"));
      [ ["sure","واثق"],["hesitant","متردد"],["guessed","خمّنت"] ].forEach(function(pair){var b=el("button","btn",pair[1]); b.type="button"; b.addEventListener("click",function(){
        stage.innerHTML=""; stage.appendChild(el("p","study-label","الإجابة النموذجية")); stage.appendChild(el("p","study-model",q.answer)); stage.appendChild(el("p","study-explain",q.explain)); var revisit=el("a","study-revisit","راجع موضع الشرح في الدرس"); revisit.href=q.sectionUrl||("#"+q.section); stage.appendChild(revisit); stage.appendChild(el("p","study-label","هل كانت إجابتك صحيحة؟"));
        [[true,"نعم، إجابتي صحيحة"],[false,"أحتاج إلى مراجعة"]].forEach(function(choice){var rate=el("button","btn",choice[1]); rate.type="button"; rate.addEventListener("click",function(){save(q,choice[0],pair[0]); stage.innerHTML=""; stage.appendChild(el("p","study-result",choice[0]?"سُجلت للمراجعة اللاحقة." : "ستعود هذه البطاقة غدًا.")); if(onDone)onDone(choice[0],pair[0]); focusNext(card,stage);}); stage.appendChild(rate);});
        focusStage(stage);
      });stage.appendChild(b);});
      focusStage(stage);
    });
    host.appendChild(card); return card;
  }
  function hostFor(item,pre,practice){
    if(item.phase==="pretest")return pre||practice;
    if(item.checkpoint){var mount=document.querySelector('[data-checkpoint="'+item.checkpoint+'"]'); if(mount)return mount;}
    return practice;
  }
  function initLesson(){
    var data=document.getElementById("lesson-question-data");if(!data)return;var questions;try{questions=JSON.parse(data.textContent);}catch(e){return;}
    var pre=document.querySelector("[data-pretest]");var practice=document.querySelector("[data-practice]");var confirm=document.querySelector("[data-review-confirm]");
    var sessionPending=0,started=false;
    function announce(){
      if(!confirm)return;
      var date="";try{if(root.ZLEARN_SRS&&root.ZLEARN_SRS.soonestDue){date=root.ZLEARN_SRS.soonestDue(root.ZLEARN_STORAGE.getState().cards);}}catch(e){}
      confirm.textContent="أُضيفت للمراجعة"+(date?" · أقرب مراجعة: "+date:"");confirm.hidden=false;
    }
    function renderItem(host,item,state){
      renderOne(host,item,function(correct,confidence){
        sessionPending--;state.pending--;
        if(!correct&&confidence==="sure"&&!item._retried){var retry={};Object.keys(item).forEach(function(k){retry[k]=item[k];});retry._retried=true;state.retries.push(retry);sessionPending++;}
        if(state.pending===0&&state.retries.length){state.pending=1;renderItem(host,state.retries.shift(),state);return;}
        if(sessionPending<=0&&started)announce();
      });
    }
    function mount(host,items){
      if(!host||!items.length)return;
      var state={pending:items.length,retries:[]};
      started=true;
      items.forEach(function(item){sessionPending++;renderItem(host,item,state);});
    }
    var groups=[];
    function groupFor(host){for(var i=0;i<groups.length;i++){if(groups[i][0]===host)return groups[i];}groups.push([host,[]]);return groups[groups.length-1];}
    questions.forEach(function(item){var host=hostFor(item,pre,practice);if(host)groupFor(host)[1].push(item);});
    groups.forEach(function(group){mount(group[0],group[1]);});
  }
  root.ZLEARN_QUIZ={renderOne:renderOne,initLesson:initLesson};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initLesson);else initLesson();
}(window));
