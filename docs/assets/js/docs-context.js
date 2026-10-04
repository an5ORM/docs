(function () {
  'use strict';

  function getBaseUrl() {
    var el = document.querySelector('[data-baseurl]');
    return (el && el.dataset.baseurl) || '/docs';
  }

  function detectCurrentGuide() {
    var el = document.querySelector('[data-guide]');
    if (el && el.dataset.guide) return el.dataset.guide;
    var path = window.location.pathname.replace(/\/index\.html$/, '/').replace(/\/$/, '');
    var match = path.match(/\/guides\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  }

  function updateSidebarLinks(code, provider) {
    var base = getBaseUrl();
    document.querySelectorAll('.docs-sidebar a').forEach(function (a) {
      var href = a.getAttribute('href') || '';
      var match = href.match(/\/guides\/([a-zA-Z0-9_-]+)/);
      if (match) {
        a.setAttribute('href', base + '/' + code + '/' + provider + '/guides/' + match[1] + '/');
      }
    });
  }

  function updateHomePage(code, provider) {
    var snippets = document.querySelectorAll('.hero-lang-snippet');
    if (snippets.length > 0) {
      snippets.forEach(function (el) {
        el.style.display = el.dataset.lang === code ? 'block' : 'none';
      });
    }

    var langLabel = document.querySelector('.hero-target-lang');
    if (langLabel) langLabel.innerHTML = '<strong>' + (code.charAt(0).toUpperCase() + code.slice(1)) + '</strong>';

    var provLabel = document.querySelector('.hero-target-prov');
    if (provLabel) provLabel.innerHTML = '<strong>' + (provider.charAt(0).toUpperCase() + provider.slice(1)) + '</strong>';

    var getStarted = document.getElementById('heroGetStartedBtn');
    if (getStarted) {
      var base = getBaseUrl();
      getStarted.setAttribute('href', base + '/' + code + '/' + provider + '/guides/getting-started/');
      getStarted.textContent = 'Get Started with ' + (code.charAt(0).toUpperCase() + code.slice(1));
    }

    var tabs = ['typescript', 'python', 'dotnet', 'golang', 'rust'];
    if (tabs.indexOf(code) !== -1) {
      document.querySelectorAll('.tab-content').forEach(function (el) { el.classList.remove('active'); });
      document.querySelectorAll('.tab-btn').forEach(function (el) { el.classList.remove('active'); });
      var targetContent = document.getElementById(code === 'typescript' ? 'query' : code);
      if (targetContent) targetContent.classList.add('active');
      var targetBtn = document.getElementById('tabBtn-' + code);
      if (targetBtn) targetBtn.classList.add('active');
    }
  }

  // 1. Inline form handler (preserves exact signature for context-browser.mjs test)
  var form = document.getElementById('docsContextForm');
  if (form) {
    var section = form.closest('[data-baseurl]');
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var code = document.getElementById('docsCode').value;
      var provider = document.getElementById('docsProvider').value;
      try {
        localStorage.setItem('an5_docs_code', code);
        localStorage.setItem('an5_docs_provider', provider);
      } catch (_) {}
      window.location.assign(section.dataset.baseurl + '/' + code + '/' + provider + '/guides/' + section.dataset.guide + '/' + window.location.hash);
    });
  }

  // 2. Header Stack Selectors (Language & Provider dropdowns at the top of every page)
  var headerCode = document.getElementById('headerDocsCode');
  var headerProvider = document.getElementById('headerDocsProvider');

  function onHeaderStackChange() {
    if (!headerCode || !headerProvider) return;
    var code = headerCode.value;
    var provider = headerProvider.value;

    try {
      localStorage.setItem('an5_docs_code', code);
      localStorage.setItem('an5_docs_provider', provider);
    } catch (_) {}

    updateSidebarLinks(code, provider);
    updateHomePage(code, provider);

    var inlineCode = document.getElementById('docsCode');
    var inlineProv = document.getElementById('docsProvider');
    if (inlineCode) inlineCode.value = code;
    if (inlineProv) inlineProv.value = provider;

    var currentGuide = detectCurrentGuide();
    var base = getBaseUrl();
    if (currentGuide) {
      window.location.assign(base + '/' + code + '/' + provider + '/guides/' + currentGuide + '/' + window.location.hash);
    } else {
      window.location.assign(base + '/' + code + '/' + provider + '/' + window.location.hash);
    }
  }

  if (headerCode && headerProvider) {
    headerCode.addEventListener('change', onHeaderStackChange);
    headerProvider.addEventListener('change', onHeaderStackChange);

    try {
      var path = window.location.pathname;
      var routeMatch = path.match(/\/(typescript|python|dotnet|golang|rust)\/(postgresql|sqlserver|mysql|sqlite|googlesheets|nbase)\/?/);
      if (routeMatch) {
        headerCode.value = routeMatch[1];
        headerProvider.value = routeMatch[2];
        localStorage.setItem('an5_docs_code', routeMatch[1]);
        localStorage.setItem('an5_docs_provider', routeMatch[2]);
        updateSidebarLinks(routeMatch[1], routeMatch[2]);
        updateHomePage(routeMatch[1], routeMatch[2]);
      } else {
        var savedCode = localStorage.getItem('an5_docs_code');
        var savedProv = localStorage.getItem('an5_docs_provider');
        if (savedCode && savedProv) {
          headerCode.value = savedCode;
          headerProvider.value = savedProv;
          updateSidebarLinks(savedCode, savedProv);
          updateHomePage(savedCode, savedProv);
        }
      }
    } catch (_) {}
  }
})();
