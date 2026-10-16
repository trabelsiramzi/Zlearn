
/* Export/import v2 ; les fichiers v1 sont importés par la couche de stockage. */
(function () {
  var doc = document, buttons = doc.querySelectorAll("[data-progress-export]"), input = doc.getElementById("progress-import"), status = doc.querySelector(".progress-transfer-status");
  if (!buttons.length || !input || !status) return;
  Array.prototype.forEach.call(buttons, function (button) {
    button.addEventListener("click", function () {
      var payload, link, url;
      try { payload = JSON.stringify(ZLEARN_STORAGE.exportV2()); }
      catch (e) { status.textContent = "تعذر قراءة التقدم المحفوظ."; return; }
      try {
        link = doc.createElement("a");
        if (window.Blob && window.URL && window.URL.createObjectURL) url = window.URL.createObjectURL(new Blob([payload], {type:"application/json"}));
        else url = "data:application/json;charset=utf-8," + encodeURIComponent(payload);
        link.href=url; link.download="zlearn-progress.json"; link.style.display="none"; doc.body.appendChild(link); link.click(); doc.body.removeChild(link);
        status.textContent="نُزّل ملف تقدمك. احتفظ به لاستيراده على جهاز آخر.";
      } catch (e2) { status.textContent="تعذر إنشاء ملف التقدم في هذا المتصفح."; }
    });
  });
  input.addEventListener("change", function () {
    var file=input.files && input.files[0]; if(!file) return;
    var reader=new FileReader();
    reader.onerror=function(){status.textContent="تعذرت قراءة الملف.";};
    reader.onload=function(){
      var payload, ok=false;
      try { payload=JSON.parse(reader.result); } catch(e) { status.textContent="الملف ليس JSON صالحًا."; return; }
      if(!payload || payload.format!=="zlearn-progress") { status.textContent="هذا الملف ليس نسخة تقدم صالحة من Zlearn."; return; }
      if(payload.version===1 && payload.data) ok=ZLEARN_STORAGE.importV1(payload.data);
      else if(payload.version===2) ok=ZLEARN_STORAGE.importV2(payload);
      if(!ok) { status.textContent="هذا الملف ليس نسخة تقدم صالحة من Zlearn."; return; }
      status.textContent="استُورد التقدم. يجري تحديث الصفحة…";
      window.setTimeout(function(){window.location.reload();},350);
    };
    reader.readAsText(file);
  });
})();
