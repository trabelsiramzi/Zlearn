/* Interface de rappel actif : réponse, confiance, correction expliquée, auto-évaluation. */
(function(root){
  "use strict";
  function el(tag,cls,text){var n=document.createElement(tag); if(cls)n.className=cls; if(text)n.textContent=text; return n;}
  function save(q,correct,confidence){var st=root.ZLEARN_STORAGE.getState(); st.cards[q.id]=root.ZLEARN_SRS.grade(st.cards[q.id],correct,confidence,root.ZLEARN_SRS.shiftDate((function(){var d=new Date();return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2);}()),0)); root.ZLEARN_STORAGE.setState(st);}
  /* Donne le focus à la carte : premier contrôle interactif, sinon le conteneur (tabindex=-1). */
  function place(node){
    if(!node||!node.focus)return false;
    if(!node.getAttribute("tabindex")&&!/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(node.tagName||""))node.setAttribute("tabindex","-1");
    try{node.focus();}catch(e){}
    return true;
  }
  function focusStage(stage){
    place(stage.querySelector("button, a[href], input, select, textarea, [tabindex]")||stage);
  }
  /* Après la fin d'une carte : carte suivante de la même file, sinon message de fin. */
  function focusNext(card,stage){
    var node=card;
    while(node&&node.nextSibling){
      node=node.nextSibling;
      if(node.nodeType===1&&node.className&&(" "+node.className+" ").indexOf(" study-card ")>-1){
        place(node.querySelector("textarea")||node); return;
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
  function initLesson(){var data=document.getElementById("lesson-question-data");if(!data)return;var q;try{q=JSON.parse(data.textContent);}catch(e){return;}
    var pre=document.querySelector("[data-pretest]");var practice=document.querySelector("[data-practice]");
    function queue(host,items){var pending=items.length,retries=[];function render(item){renderOne(host,item,function(correct,confidence){if(!correct&&confidence==="sure"&&!item._retried){var retry={};Object.keys(item).forEach(function(k){retry[k]=item[k];});retry._retried=true;retries.push(retry);}pending--;if(!pending&&retries.length){var next=retries.shift();pending=1;render(next);}});}items.forEach(render);}
    if(pre)queue(pre,q.filter(function(x){return x.phase==="pretest";}));
    if(practice)queue(practice,q.filter(function(x){return x.phase!=="pretest";}));
  }
  root.ZLEARN_QUIZ={renderOne:renderOne,initLesson:initLesson};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initLesson);else initLesson();
}(window));
