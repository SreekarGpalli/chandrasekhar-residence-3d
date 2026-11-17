(function () {
  'use strict';

  const params = new URLSearchParams(location.search);
  const version = (params.get('v') || '').toLowerCase();
  const design = version === 'full2' || version === 'v42' ? 'full2' : 'full';
  window.DESIGN = design;

  function href(path, targetDesign) {
    const query = new URLSearchParams(params);
    if (targetDesign === 'full2') query.set('v', 'full2');
    else query.delete('v');
    const search = query.toString();
    return path + (search ? '?' + search : '');
  }

  const versionPath = document.body.classList.contains('walk') ? 'walkthrough.html' : 'index.html';
  for (const link of document.querySelectorAll('[data-version]')) {
    const target = link.dataset.version;
    link.href = href(versionPath, target);
    if (target === design) link.setAttribute('aria-current', 'page');
    link.addEventListener('click', event => {
      if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (target === design) event.preventDefault();
      else window.__saveCamera?.(target);
    });
  }

  for (const link of document.querySelectorAll('[data-mode]')) {
    link.href = href(link.dataset.mode, design);
  }

  function disclosure(button, panel) {
    function show(open, restoreFocus = false) {
      panel.hidden = !open;
      button.setAttribute('aria-expanded', String(open));
      if (!open && restoreFocus) button.focus();
    }

    button.addEventListener('click', () => show(panel.hidden));
    function escape(event) {
      if (event.key === 'Escape' && !panel.hidden) show(false, true);
    }
    button.addEventListener('keydown', escape);
    panel.addEventListener('keydown', escape);
    return show;
  }

  disclosure(document.getElementById('helpButton'), document.getElementById('help'));
  window.ViewerUI = { disclosure };
})();
