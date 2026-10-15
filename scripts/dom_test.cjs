#!/usr/bin/env node
/*
 * Test DOM réel (optionnel) du site Zlearn multi-pages, avec jsdom.
 *
 * Il exécute le JavaScript partagé (assets/site.js, injecté en ligne) dans un DOM
 * simulé et vérifie, page par page (index.html + un dossier par matière) :
 * en-tête/head, barre d'outils, TOC automatique, thème, progression, recherche arabe,
 * navigation clavier, quiz, cohérence des compteurs, erreurs JS.
 *
 * Dépendance : jsdom (facultative, non incluse dans le projet).
 *   npm install jsdom        # une seule fois, dans un répertoire de travail
 *   node scripts/dom_test.cjs [fichier|dossier]
 *
 * Le validateur statique `validate_site.py` reste le contrôle obligatoire ; ce test-ci
 * ne s'exécute que si jsdom est disponible sur la machine.
 */
"use strict";

const fs = require("fs");
const path = require("path");

let JSDOM, VirtualConsole;
try {
  ({ JSDOM, VirtualConsole } = require("jsdom"));
} catch (e) {
  console.error("jsdom introuvable. Installez-le (npm install jsdom) pour lancer ce test optionnel.");
  process.exit(2);
}

const REPO = path.resolve(__dirname, "..");
const TARGET = process.argv[2] ? path.resolve(process.argv[2]) : REPO;
const SKIP_DIRS = new Set([".git", ".agents", ".opencode", "backups", "docs", "templates", "node_modules"]);

function collectPages(target) {
  const st = fs.statSync(target);
  if (st.isFile()) return [target];
  const out = [];
  (function walk(dir) {
    for (const name of fs.readdirSync(dir).sort()) {
      const p = path.join(dir, name);
      const s = fs.statSync(p);
      if (s.isDirectory()) { if (!SKIP_DIRS.has(name)) walk(p); }
      else if (name.endsWith(".html")) out.push(p);
    }
  })(target);
  return out;
}

// Injecte le script partagé (src relatif) en ligne pour que jsdom l'exécute.
function inlineSharedScript(html, pagePath) {
  return html.replace(/<script\s+src="([^"]+)"\s*><\/script>/g, (m, src) => {
    const jsPath = path.resolve(path.dirname(pagePath), src);
    const js = fs.readFileSync(jsPath, "utf8");
    return "<script>\n" + js + "\n</script>";
  });
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function runPage(pagePath) {
  const raw = fs.readFileSync(pagePath, "utf8");
  const html = inlineSharedScript(raw, pagePath);
  const vc = new VirtualConsole();
  const consoleErrors = [];
  vc.on("jsdomError", (e) => consoleErrors.push("jsdomError: " + e.message));
  vc.on("error", (...a) => consoleErrors.push("console.error: " + a.join(" ")));

  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    pretendToBeVisual: true,
    url: "http://localhost/",
    storageQuota: 10000000,
    virtualConsole: vc,
    beforeParse(win) {
      win.scrollTo = () => {};
      win.HTMLElement.prototype.scrollIntoView = function () {};
    },
  });
  const { window } = dom;
  const doc = window.document;

  let pass = 0, fail = 0;
  function check(name, cond, extra) {
    if (cond) { pass++; console.log("  ✓ " + name); }
    else { fail++; console.log("  ✗ " + name + (extra ? "  → " + extra : "")); }
  }

  console.log("\n===== " + path.relative(REPO, pagePath) + " =====");
  const isHub = doc.body.getAttribute("data-page") === "home";

  console.log("[1] Structure & en-tête");
  check("<html lang=ar dir=rtl>", doc.documentElement.lang === "ar" && doc.documentElement.dir === "rtl");
  check("title dans <head>", !!doc.head.querySelector("title"));
  check("liens de police dans <head>", !!doc.head.querySelector('link[href*="fonts.googleapis"]'));
  check("alertes/outil : feuille partagée", !!doc.head.querySelector('link[href*="site.css"]'));
  check("skip link vers #main", !!doc.querySelector('a.skip[href="#main"]'));
  check("<main id=main>", !!doc.getElementById("main"));

  console.log("[2] Barre d'outils");
  check("bouton thème", !!doc.getElementById("theme-toggle"));
  check("progression globale", !!doc.getElementById("gplabel"));
  if (doc.getElementById("q")) check("recherche #q / #sr", !!doc.getElementById("sr"));
  if (!isHub) check("lien retour à l'accueil", !!doc.querySelector('a[href$="index.html"]'));

  const lessons = [...doc.querySelectorAll(".lesson")];

  if (lessons.length) {
    console.log("[3] TOC automatique");
    let tocOk = true, tocDetail = "";
    lessons.forEach((l) => {
      const sub = l.parentNode.getAttribute("data-subject");
      const n = l.getAttribute("data-lesson");
      const row = doc.querySelector('.chips[data-subject="' + sub + '"][data-for="' + n + '"]');
      if (!row) { tocOk = false; tocDetail = "pas de chips pour " + sub + ":" + n; return; }
      const linked = new Set([...row.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute("href").slice(1)));
      [...l.querySelectorAll("section[id]")].forEach((s) => {
        if (!linked.has(s.id)) { tocOk = false; tocDetail = "section " + s.id + " absente de la TOC"; }
      });
    });
    check("chaque dars a une TOC couvrant ses sections (" + lessons.length + " dars)", tocOk, tocDetail);

    let tabOk = true, tabDetail = "";
    lessons.forEach((l) => {
      const sub = l.parentNode.getAttribute("data-subject");
      const n = l.getAttribute("data-lesson");
      if (!doc.querySelector('.tabs[data-subject="' + sub + '"] .tab[data-lesson="' + n + '"]')) {
        tabOk = false; tabDetail = "pas d'onglet pour " + sub + ":" + n;
      }
    });
    check("chaque dars a un onglet de navigation", tabOk, tabDetail);
  }

  console.log("[4] Thème clair/sombre");
  const btn = doc.getElementById("theme-toggle");
  const before = doc.documentElement.getAttribute("data-theme");
  btn.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  const after = doc.documentElement.getAttribute("data-theme");
  check("le clic bascule data-theme", before !== after && (after === "dark" || after === "light"), before + " → " + after);
  check("choix sauvegardé (localStorage)", window.localStorage.getItem("mourshid-theme") === after);
  check("aria-pressed mis à jour", btn.getAttribute("aria-pressed") === String(after === "dark"));

  console.log("[5] Progression");
  const boxes = [...doc.querySelectorAll(".check input[type=checkbox]")];
  const glabel = doc.getElementById("gplabel");
  check("libellé initial = 0%", /0%/.test(glabel.textContent), glabel.textContent);
  if (boxes.length) {
    const b0 = boxes[0];
    b0.checked = true;
    b0.dispatchEvent(new window.Event("change", { bubbles: true }));
    const page = doc.body.getAttribute("data-page");
    check("recalcul global après coche", !/0%/.test(glabel.textContent), glabel.textContent);
    check("état du groupe sauvegardé", !!window.localStorage.getItem("mourshid-" + b0.closest(".group").getAttribute("data-key")));
    check("agrégat de la page sauvegardé", !!window.localStorage.getItem("mourshid-prog-" + page));
    b0.checked = false;
    b0.dispatchEvent(new window.Event("change", { bubbles: true }));
  }

  const q = doc.getElementById("q");
  const sr = doc.getElementById("sr");
  if (q && sr) {
    console.log("[6] Recherche (arabe, sans harakât)");
    const h2 = doc.querySelector(".lesson section h2");
    const query = h2 ? h2.textContent.trim() : "الخلاصة";
    q.value = query;
    q.dispatchEvent(new window.Event("input", { bubbles: true }));
    await wait(260);
    check("résultats affichés", sr.hidden === false && sr.querySelectorAll("a").length > 0,
          "hidden=" + sr.hidden + " n=" + sr.querySelectorAll("a").length);
    const first = sr.querySelector("a");
    if (first) {
      const targetId = first.getAttribute("href").slice(1);
      first.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
      await wait(60);
      const holder = doc.getElementById(targetId).closest(".lesson");
      check("le résultat affiche le bon dars", holder && !holder.hidden, "cible=" + targetId);
      check("le champ se vide après navigation", q.value === "" && sr.hidden === true);
    }
    q.value = "ززززززووو";
    q.dispatchEvent(new window.Event("input", { bubbles: true }));
    await wait(260);
    check("message « لا توجد نتائج »", !!sr.querySelector(".empty"));
  }

  const tabs = [...doc.querySelectorAll(".tabs")];
  if (tabs.length) {
    console.log("[7] Navigation clavier des onglets");
    const firstTab = tabs[0].querySelector(".tab");
    firstTab.focus();
    firstTab.dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    const selected = tabs[0].querySelectorAll('.tab[aria-selected="true"]').length;
    check("un onglet est sélectionné après flèche", selected === 1, "sélectionnés=" + selected);
  }

  const toggleAll = [...doc.querySelectorAll(".toggle-all")];
  if (toggleAll.length) {
    console.log("[8] Quiz");
    check("un bouton afficher-tout par dars", toggleAll.length === lessons.length, toggleAll.length + "/" + lessons.length);
    const target = toggleAll[0].getAttribute("data-target");
    toggleAll[0].dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    const details = doc.querySelectorAll("#" + target + " details");
    check("le bouton ouvre bien les <details>", [...details].every((d) => d.open), target);
  }

  console.log("[9] Cohérence compteurs de progression");
  let cohOk = true, cohMsg = "";
  [...doc.querySelectorAll(".group")].forEach((g) => {
    const declared = parseInt((g.querySelector(".plabel").textContent.match(/(\d+)\s*من\s*(\d+)/) || [])[2], 10);
    const n = g.querySelectorAll(".check input[type=checkbox]").length;
    if (declared !== n) { cohOk = false; cohMsg = g.getAttribute("data-key") + ": " + declared + "≠" + n; }
  });
  check("compteur = nombre de cases pour chaque groupe", cohOk, cohMsg);

  console.log("[10] Erreurs JS à l'exécution");
  check("aucune erreur console/jsdom", consoleErrors.length === 0, consoleErrors.join(" | "));

  dom.window.close();
  return { pass, fail };
}

(async () => {
  const pages = collectPages(TARGET);
  if (!pages.length) { console.error("Aucune page HTML trouvée dans " + TARGET); process.exit(2); }
  let pass = 0, fail = 0;
  for (const p of pages) {
    const r = await runPage(p);
    pass += r.pass; fail += r.fail;
  }
  console.log("\n=== " + pass + " réussis, " + fail + " échoués ===");
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
