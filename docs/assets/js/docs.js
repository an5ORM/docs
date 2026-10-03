/**
 * Docs site behaviour: copy buttons on code blocks and the sidebar search.
 *
 * Two concerns, both progressive: the page is fully readable with JavaScript
 * off, and a failure in one does not take the other down.
 */
(function () {
  'use strict';

  /* ── Copy buttons ──────────────────────────────────────────────────────── */

  function addCopyButtons() {
    var blocks = document.querySelectorAll('.docs-body pre');

    Array.prototype.forEach.call(blocks, function (pre) {
      var code = pre.querySelector('code');
      if (!code) return;

      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'copy-code';
      button.textContent = 'Copy';
      button.setAttribute('aria-label', 'Copy code to clipboard');

      button.addEventListener('click', function () {
        var text = code.innerText;

        var done = function () {
          button.classList.add('copied');
          button.textContent = 'Copied';
          setTimeout(function () {
            button.classList.remove('copied');
            button.textContent = 'Copy';
          }, 1600);
        };

        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(text).then(done, function () {
            legacyCopy(text) && done();
          });
        } else {
          // file:// and http:// without a secure context have no clipboard API.
          if (legacyCopy(text)) done();
        }
      });

      // The layout's inline script wraps each block in a .code-window, so the
      // button lands at the end of that window, under the code.
      pre.parentNode.insertBefore(button, pre.nextSibling);
    });
  }

  function legacyCopy(text) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (err) {
      ok = false;
    }
    document.body.removeChild(area);
    return ok;
  }

  /* ── Search ────────────────────────────────────────────────────────────── */

  // Built by search.json at deploy time: one entry per page, body already
  // stripped of HTML.
  var index = null;
  var loading = null;

  function loadIndex(url) {
    if (index) return Promise.resolve(index);
    if (loading) return loading;
    loading = fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        index = data;
        return index;
      })
      .catch(function () {
        // Leave the field usable but silent: search is an enhancement.
        index = [];
        return index;
      });
    return loading;
  }

  // Every whitespace-separated term has to appear somewhere in the page, so
  // extra words narrow the result instead of widening it.
  function matches(entry, terms) {
    var haystack = entry.haystack;
    for (var i = 0; i < terms.length; i++) {
      if (haystack.indexOf(terms[i]) === -1) return false;
    }
    return true;
  }

  // Rank: a title hit beats a body hit, an earlier hit beats a later one.
  function score(entry, terms) {
    var value = 0;
    for (var i = 0; i < terms.length; i++) {
      var term = terms[i];
      var at = entry.title.toLowerCase().indexOf(term);
      if (at !== -1) value += 40 - Math.min(at, 30);
      if (entry.haystack.indexOf(term) !== -1) value += 5;
    }
    return value;
  }

  function escapeHtml(text) {
    return text.replace(/[&<>"']/g, function (c) {
      return {
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
      }[c];
    });
  }

  // A window of text around the first term, cut on word boundaries.
  function snippet(body, terms) {
    var at = -1;
    for (var i = 0; i < terms.length && at === -1; i++) {
      at = body.toLowerCase().indexOf(terms[i]);
    }
    if (at === -1) return body.slice(0, 110);

    var start = Math.max(0, at - 40);
    var end = Math.min(body.length, at + 90);
    var text = body.slice(start, end);
    if (start > 0) text = '…' + text.replace(/^\S*\s/, '');
    if (end < body.length) text = text.replace(/\s\S*$/, '') + '…';
    return text;
  }

  function setupSearch() {
    var input = document.getElementById('docsSearch');
    if (!input) return;

    var results = document.createElement('ul');
    results.className = 'docs-search-results';
    results.hidden = true;
    input.parentNode.appendChild(results);

    var empty = document.getElementById('docsSearchEmpty');
    var current = -1;
    var shown = [];

    function close() {
      results.hidden = true;
      results.innerHTML = '';
      shown = [];
      current = -1;
      if (empty) empty.hidden = true;
    }

    function render(entries, terms) {
      shown = entries;
      current = -1;
      if (empty) empty.hidden = entries.length !== 0;

      if (!entries.length) {
        results.innerHTML = '';
        results.hidden = true;
        return;
      }

      results.innerHTML = entries
        .slice(0, 8)
        .map(function (entry) {
          return (
            '<li><a href="' + entry.url + '">' +
            '<span class="hit-title">' + escapeHtml(entry.title) + '</span>' +
            '<span class="hit-snippet">' + escapeHtml(snippet(entry.body, terms)) + '</span>' +
            '</a></li>'
          );
        })
        .join('');
      results.hidden = false;
    }

    function run() {
      var terms = input.value.toLowerCase().split(/\s+/).filter(Boolean);
      if (!terms.length) return close();

      loadIndex(input.dataset.indexUrl).then(function (data) {
        // Re-read the box: the user may have typed while it was loading.
        var now = input.value.toLowerCase().split(/\s+/).filter(Boolean);
        if (now.length !== terms.length) return;
        render(
          data
            .filter(function (entry) { return matches(entry, now); })
            .sort(function (a, b) { return score(b, now) - score(a, now); }),
          now
        );
      });
    }

    var timer = null;
    input.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(run, 120);
    });

    input.addEventListener('focus', function () {
      if (input.value.trim()) run();
    });

    input.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        input.value = '';
        close();
        input.blur();
        return;
      }
      if (!shown.length) return;

      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        current += event.key === 'ArrowDown' ? 1 : -1;
        if (current < 0) current = shown.length - 1;
        if (current >= shown.length) current = 0;
        Array.prototype.forEach.call(results.children, function (li, i) {
          li.classList.toggle('active', i === current);
        });
        return;
      }

      if (event.key === 'Enter' && current >= 0) {
        event.preventDefault();
        window.location.href = shown[current].url;
      }
    });

    document.addEventListener('click', function (event) {
      if (!input.parentNode.contains(event.target)) close();
    });

    // "/" focuses search, the way most documentation sites do.
    document.addEventListener('keydown', function (event) {
      var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName) ||
        event.target.isContentEditable;
      if (typing) return;
      if (event.key === '/' || ((event.metaKey || event.ctrlKey) && event.key === 'k')) {
        event.preventDefault();
        input.focus();
        input.select();
      }
    });
  }

  function init() {
    try {
      addCopyButtons();
    } catch (err) {
      if (window.console) console.error('copy buttons failed', err);
    }
    try {
      setupSearch();
    } catch (err) {
      if (window.console) console.error('search failed', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
