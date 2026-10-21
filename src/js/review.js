(function(root){
  "use strict";
  function today(){var d=new Date();return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2);}
  function init(){
    var st=root.ZLEARN_STORAGE.getState(), catalog=root.ZLEARN_QUESTION_CATALOG||[], due=root.ZLEARN_SRS.dueCards(catalog,st,today(),20), counts=document.querySelectorAll("[data-review-count]"), list=document.querySelector("[data-review-list]");
    if(counts.length){var dueCount=due.length;if(!list){dueCount=0;Object.keys(st.cards).forEach(function(id){if(st.cards[id].due<=today())dueCount++;});dueCount=Math.min(20,dueCount);}Array.prototype.forEach.call(counts,function(el){el.textContent=String(dueCount);});}
    if(!list)return;
    if(!due.length){var empty=document.createElement("p");empty.className="review-empty";empty.textContent="لا توجد بطاقات مستحقة اليوم. واصل دراسة درس جديد.";list.appendChild(empty);return;}
    var retries=[];function add(item){var section=document.createElement("section");section.className="review-item";var link=document.createElement("a");link.href="../"+item.url+"#"+item.question.section;link.textContent=item.subjectName+" · "+item.lessonTitle;section.appendChild(link);var question={};Object.keys(item.question).forEach(function(k){question[k]=item.question[k];});question.sectionUrl=link.href;root.ZLEARN_QUIZ.renderOne(section,question,function(correct,confidence){if(!correct&&confidence==="sure"&&!item._retried){var retry={};Object.keys(item).forEach(function(k){retry[k]=item[k];});retry._retried=true;retries.push(retry);}if(!retries.length)return;var next=retries.shift();window.setTimeout(function(){add(next);},0);});list.appendChild(section);}
    due.forEach(add);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
}(window));
