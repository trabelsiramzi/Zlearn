"""Rendu de la « ورقة الدرس » (fiche de synthèse) à partir de content/<matière>/<NN>-<slug>/fiche.json.

Le texte de la fiche est en texte brut avec un balisage minimal :
  **gras**  → <strong> ;  [[terme]] → terme coloré.  Tout le reste est échappé.
"""
import html
import json
import re

TONES = ("green", "blue", "purple", "orange", "teal", "rose")
BLOCK_TYPES = {"bullets", "rows", "terms", "cards"}
SPANS = {"full", "half"}

ICON_PATHS = {
    "bulb": '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
    "scales": '<path d="M12 3v18M7 21h10M5 6h14M5 6l-3 7a3 3 0 0 0 6 0L5 6zM19 6l-3 7a3 3 0 0 0 6 0l-3-7z"/>',
    "pencil": '<path d="M4 20l1-4L16 5l3 3L8 19l-4 1zM14 7l3 3"/>',
    "list": '<path d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM9 8h6M9 12h6M9 16h4"/>',
    "star": '<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5 6.6 19.5l1.2-6L3.3 9.3l6.1-.7L12 3z"/>',
    "book": '<path d="M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2V5zM8 7h7M4 20a2 2 0 0 1 2-2h13"/>',
    "alert": '<path d="M12 3l10 18H2L12 3zM12 10v5M12 18h.01"/>',
    "pin": '<path d="M12 16v6M8 3h8l-1 6 3 4H6l3-4-1-6z"/>',
    "check": '<path d="M5 12.5l4.5 4.5L19 7"/>',
    "target": '<path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01"/>',
    "key": '<path d="M8 15a4 4 0 1 1 3.9-4.9L21 10v3h-2v2h-3v-2h-2.6A4 4 0 0 1 8 15zM7 11h.01"/>',
    "compass": '<path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM15.5 8.5l-2 5-5 2 2-5 5-2z"/>',
    "clock": '<path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2"/>',
    "flag": '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    "question": '<path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1.9-1.1 1.8M12 17h.01"/>',
    "link": '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1"/>',
    "heart": '<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/>',
    "mosque": '<path d="M12 3c2 2 3 3.5 3 5.5a3 3 0 0 1-6 0C9 6.5 10 5 12 3zM4 21V12h16v9M2 21h20M9 21v-4a3 3 0 0 1 6 0v4"/>',
    "pen": '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
}
ICON_NAMES = set(ICON_PATHS)


def esc(text):
    """Échappe puis applique le balisage minimal **gras** et [[terme]]."""
    out = html.escape(str(text), quote=False)
    out = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", out)
    out = re.sub(r"\[\[(.+?)\]\]", r'<span class="ft">\1</span>', out)
    return out


def plain(text):
    return re.sub(r"\*\*|\[\[|\]\]", "", str(text))


def icon(name, cls="ficon"):
    cls = cls if "ficon" in cls.split() else "ficon " + cls
    return '<svg class="%s" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">%s</svg>' % (cls, ICON_PATHS[name])


def validate_fiche(fiche):
    """Retourne la liste des erreurs de structure (messages en français)."""
    errors = []
    if not isinstance(fiche, dict):
        return ["fiche.json doit être un objet"]
    if not isinstance(fiche.get("subtitle", ""), str):
        errors.append("subtitle doit être une chaîne")
    blocks = fiche.get("blocks")
    if not isinstance(blocks, list) or not 3 <= len(blocks) <= 6:
        errors.append("blocks: 3 à 6 blocs sont requis")
        blocks = blocks if isinstance(blocks, list) else []
    for position, block in enumerate(blocks, 1):
        label = "bloc %d" % position
        if not isinstance(block, dict):
            errors.append("%s: objet requis" % label)
            continue
        if not block.get("title"):
            errors.append("%s: title requis" % label)
        if block.get("icon") not in ICON_NAMES:
            errors.append("%s: icon inconnue (%s)" % (label, block.get("icon")))
        btype = block.get("type")
        if btype not in BLOCK_TYPES:
            errors.append("%s: type invalide (%s)" % (label, btype))
            continue
        if block.get("span", "full") not in SPANS:
            errors.append("%s: span invalide" % label)
        tone = block.get("tone")
        if tone is not None and tone not in TONES:
            errors.append("%s: tone invalide" % label)
        if btype == "bullets":
            items = block.get("items")
            if not isinstance(items, list) or not 1 <= len(items) <= 6 or not all(isinstance(i, str) and i.strip() for i in items):
                errors.append("%s: items (1 à 6 chaînes) requis" % label)
        elif btype in ("rows", "terms"):
            key = "rows" if btype == "rows" else "items"
            rows = block.get(key)
            if not isinstance(rows, list) or not 1 <= len(rows) <= 7 or not all(isinstance(r, dict) and r.get("term") and r.get("text") for r in rows):
                errors.append("%s: %s (1 à 7 objets term/text) requis" % (label, key))
        elif btype == "cards":
            cards = block.get("cards")
            if not isinstance(cards, list) or not 1 <= len(cards) <= 4 or not all(isinstance(c, dict) and c.get("title") for c in cards):
                errors.append("%s: cards (1 à 4 objets title[/text]) requis" % label)
        warning = block.get("warning")
        if warning is not None and not (isinstance(warning, dict) and warning.get("text")):
            errors.append("%s: warning doit contenir text" % label)
    if not isinstance(fiche.get("khulasa"), str) or not fiche["khulasa"].strip():
        errors.append("khulasa requise")
    sticky = fiche.get("sticky")
    if sticky is not None:
        if not isinstance(sticky, dict) or not sticky.get("title") or not (sticky.get("abyatSection") or sticky.get("pointsSection")):
            errors.append("sticky: title et abyatSection ou pointsSection requis")
    return errors


def fiche_texts(fiche):
    """Tous les textes de la fiche (pour le contrôle de fidélité au cours)."""
    texts = []
    for block in fiche.get("blocks", []):
        for key in ("items", "rows"):
            for row in block.get(key) or []:
                texts.append(row.get("text", "") if isinstance(row, dict) else row)
        for card in block.get("cards") or []:
            texts.append(card.get("text", ""))
        if block.get("warning"):
            texts.append(block["warning"].get("text", ""))
    texts.append(fiche.get("khulasa", ""))
    return [plain(t) for t in texts if t]


def render_block(position, block, default_tone):
    tone = block.get("tone") or default_tone
    span = block.get("span", "full")
    bid = "fb-%d" % position
    parts = ['<article class="fblock tone-%s fspan-%s" aria-labelledby="%s">' % (tone, span, bid)]
    parts.append('<header class="fblock-head"><span class="fnum" aria-hidden="true">%d</span><h3 id="%s">%s</h3>%s</header>'
                 % (position, bid, esc(block["title"]), icon(block["icon"], "ficon fblock-icon")))
    btype = block["type"]
    if btype == "bullets":
        parts.append('<ul class="fbullets">%s</ul>' % "".join(
            "<li>%s%s</li>" % (icon("check", "fcheck"), esc(item)) for item in block["items"]))
    elif btype == "rows":
        parts.append('<dl class="frows">%s</dl>' % "".join(
            '<div class="frow"><dt>%s</dt><dd>%s</dd></div>' % (esc(r["term"]), esc(r["text"])) for r in block["rows"]))
    elif btype == "terms":
        parts.append('<ul class="fbullets fterms">%s</ul>' % "".join(
            '<li>%s<span><span class="fterm">«%s»:</span> %s</span></li>' % (icon("check", "fcheck"), esc(r["term"]), esc(r["text"]))
            for r in block["items"]))
    elif btype == "cards":
        cards = "".join(
            '<li class="fcard"><span class="fcard-t">%s%s</span>%s</li>'
            % (icon("check", "fcheck"), esc(c["title"]), '<span class="fcard-s">%s</span>' % esc(c["text"]) if c.get("text") else "")
            for c in block["cards"])
        warning = block.get("warning")
        if warning:
            cards += ('<li class="fwarn"><span class="fcard-t">%s%s</span><span class="fcard-s">%s</span></li>'
                      % (icon("alert", "fwarn-icon"), esc(warning.get("title", "تنبيه")), esc(warning["text"])))
        parts.append('<ul class="fcards">%s</ul>' % cards)
    if block.get("warning") and btype != "cards":
        warning = block["warning"]
        parts.append('<p class="fwarn fwarn-inline">%s<strong>%s</strong> %s</p>'
                     % (icon("alert", "fwarn-icon"), esc(warning.get("title", "تنبيه")), esc(warning["text"])))
    parts.append("</article>")
    return "".join(parts)


def render_sticky(sticky, abyat, points):
    if not sticky:
        return ""
    parts = ['<aside class="fsticky" aria-labelledby="fsticky-t"><span class="ftape" aria-hidden="true"></span>',
             '<h3 class="fsticky-title" id="fsticky-t">%s%s</h3>' % (icon("pin", "ficon"), esc(sticky["title"]))]
    if sticky.get("abyatSection"):
        parts.append('<div class="fverses" lang="ar" dir="rtl">')
        for hemistichs in abyat:
            parts.append('<p class="fverse">%s</p>' % "".join("<span>%s</span>" % html.escape(h, quote=False) for h in hemistichs))
        parts.append("</div>")
    else:
        parts.append('<ul class="fbullets fpoints">%s</ul>' % "".join(
            "<li>%s<span>%s</span></li>" % (icon("check", "fcheck"), html.escape(p, quote=False)) for p in points))
    parts.append("</aside>")
    return "".join(parts)


def render_fiche(fiche, abyat, points, reading=""):
    """HTML complet de la ورقة ; renvoie une chaîne vide s'il n'y a pas de fiche."""
    if not fiche:
        return ""
    parts = ['<section class="fiche" id="fiche" aria-labelledby="fiche-h">',
             '<div class="fiche-bar"><h2 id="fiche-h">ورقة الدرس</h2>',
             '%s<button class="btn fiche-print" type="button" data-fiche-print>طباعة الورقة</button></div>'
             % ('<p class="fiche-time">%s <span>مدة القراءة التقريبية</span></p>' % esc(reading) if reading else "")]
    parts.append(render_sticky(fiche.get("sticky"), abyat, points))
    parts.append('<div class="fgrid">')
    for position, block in enumerate(fiche["blocks"], 1):
        parts.append(render_block(position, block, TONES[(position - 1) % len(TONES)]))
    parts.append("</div>")
    parts.append('<aside class="fkhulasa" aria-labelledby="fk-h"><h3 id="fk-h">%s الخلاصة</h3><p>%s</p></aside>'
                 % (icon("star", "ficon"), esc(fiche["khulasa"])))
    parts.append("</section>")
    return "".join(parts)


def load_fiche(path):
    if not path.is_file():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


_DIACRITICS = re.compile(r"[ً-ٰٟـۖ-ۭ]")


def normalize_ar(text):
    """Normalisation légère pour comparer des textes arabes (voyelles, alef, ya, ta marbuta)."""
    text = _DIACRITICS.sub("", text)
    text = re.sub("[إأآٱ]", "ا", text).replace("ى", "ي").replace("ة", "ه")
    return text


def tokens(text):
    return [t for t in re.findall(r"[ء-ي]+", normalize_ar(text)) if len(t) >= 3]


def strip_prefix(token):
    for prefix in ("وال", "فال", "بال", "كال", "لل", "ال", "و", "ف", "ب", "ك", "ل"):
        if token.startswith(prefix) and len(token) - len(prefix) >= 3:
            return token[len(prefix):]
    return token


def fidelity(fiche, lesson_text):
    """Part des mots de chaque texte de la fiche retrouvés dans le cours (0 à 1) ; liste de (ratio, texte)."""
    vocabulary = {strip_prefix(t) for t in tokens(lesson_text)}
    result = []
    for text in fiche_texts(fiche):
        words = [strip_prefix(t) for t in tokens(text)]
        if not words:
            continue
        found = sum(1 for w in words if w in vocabulary)
        result.append((found / float(len(words)), text))
    return result
