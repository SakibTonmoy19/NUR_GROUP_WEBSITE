/**
 * Quality Policy page - image protection
 * Disables selecting / copying / dragging / saving / printing of the pictures and
 * hides them when the window loses focus (which is what snipping tools do).
 *
 * NOTE: a web page can never fully block screenshots (that is controlled by the
 * operating system / device). These measures stop all the normal methods and make
 * screen capture much harder, but cannot make it 100% impossible.
 */
(function () {
  "use strict";

  document.body.classList.add("no-copy-page");

  /* 1) Draw each picture on a <canvas> so there is no <img> to "Save image as" */
  function protect(img) {
    function build() {
      try {
        var wrap = document.createElement("div");
        wrap.className = "protected-wrap " + (img.className || "");
        wrap.setAttribute("role", "img");
        wrap.setAttribute("aria-label", img.alt || "Quality policy page");

        var canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext("2d").drawImage(img, 0, 0);

        wrap.appendChild(canvas);
        img.parentNode.replaceChild(wrap, img);
      } catch (e) {
        // fallback: keep the normal image but still locked down by CSS + events
        img.draggable = false;
        img.classList.add("protected-wrap");
      }
    }
    if (img.complete && img.naturalWidth) build();
    else img.addEventListener("load", build, { once: true });
  }
  document.querySelectorAll("img.no-copy").forEach(protect);

  /* 2) Block right-click, copy, cut, select, drag */
  ["contextmenu", "copy", "cut", "selectstart", "dragstart"].forEach(function (evt) {
    document.addEventListener(evt, function (e) {
      var t = e.target;
      if (t && t.closest && t.closest("input, textarea")) return;
      e.preventDefault();
    });
  });

  /* 3) Block keyboard shortcuts (save, print, copy, select all, view-source, dev tools) */
  document.addEventListener("keydown", function (e) {
    var k = (e.key || "").toLowerCase();
    var ctrl = e.ctrlKey || e.metaKey;
    if (
      (ctrl && ["c", "x", "a", "s", "p", "u"].indexOf(k) !== -1) ||
      (ctrl && e.shiftKey && ["i", "j", "c", "s"].indexOf(k) !== -1) ||
      (e.metaKey && e.shiftKey && ["3", "4", "5"].indexOf(k) !== -1) ||
      k === "f12" || k === "printscreen" || k === "snapshot"
    ) {
      e.preventDefault();
      hide();
      clearClipboard();
      setTimeout(show, 1500);
      return false;
    }
  });
  document.addEventListener("keyup", function (e) {
    var k = (e.key || "").toLowerCase();
    if (k === "printscreen" || k === "snapshot" || (k === "s" && e.shiftKey && e.metaKey)) {
      hide();
      clearClipboard();
      setTimeout(show, 1500);
    }
  });

  function clearClipboard() {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(" ").catch(function () {});
      }
    } catch (e) {}
  }

  /* 4) Hide the pictures whenever the window / tab is not active (snipping tools, recorders) */
  function wraps() { return document.querySelectorAll(".protected-wrap"); }
  function hide() { wraps().forEach(function (w) { w.classList.add("is-hidden"); }); }
  function show() {
    if (document.hasFocus() && !document.hidden) {
      wraps().forEach(function (w) { w.classList.remove("is-hidden"); });
    }
  }
  window.addEventListener("blur", hide);
  window.addEventListener("focus", show);
  document.addEventListener("visibilitychange", function () { document.hidden ? hide() : show(); });
  window.addEventListener("beforeprint", hide);
  window.addEventListener("afterprint", show);
})();
