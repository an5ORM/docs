/* Shared Mermaid renderer for every documentation page. */
(async () => {
  const blocks = [...document.querySelectorAll('.docs-body pre code.language-mermaid, .docs-body .language-mermaid pre code, .docs-body pre.mermaid')];
  if (!blocks.length) return;
  const cards = blocks.map(code => {
    const source = code.textContent;
    const pre = code.closest('pre');
    const card = document.createElement('section');
    card.className = 'arch-diagram-card diagram-viewer';
    const controls = document.createElement('div');
    controls.className = 'diagram-controls';

    const toolbarLeft = document.createElement('div');
    toolbarLeft.className = 'diagram-toolbar-group';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'diagram-btn diagram-btn-fit';
    const setButtonLabel = (expanded) => {
      button.setAttribute('aria-pressed', String(expanded));
      button.innerHTML = `<svg class="diagram-btn-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg><span>${expanded ? 'Fit to screen' : 'Actual size'}</span>`;
    };

    const mobile = window.matchMedia('(max-width: 768px)').matches;
    card.classList.toggle('diagram-expanded', mobile);
    setButtonLabel(mobile);
    button.addEventListener('click', () => {
      const expanded = button.getAttribute('aria-pressed') !== 'true';
      if (expanded) {
        card.classList.add('diagram-expanded');
        card.classList.remove('diagram-fit');
        setButtonLabel(true);
        if (naturalWidth) {
          scale = 1;
          diagram.style.width = `${naturalWidth}px`;
          diagram.style.minWidth = '0';
          status.textContent = '100%';
        }
      } else {
        card.classList.remove('diagram-expanded');
        card.classList.add('diagram-fit');
        setButtonLabel(false);
        diagram.style.removeProperty('width');
        diagram.style.removeProperty('min-width');
        scale = 1;
        status.textContent = '';
      }
      zoomOut.disabled = zoomIn.disabled = !naturalWidth;
    });

    const zoomGroup = document.createElement('div');
    zoomGroup.className = 'diagram-zoom-group';

    const zoomOut = document.createElement('button');
    zoomOut.type = 'button';
    zoomOut.className = 'diagram-btn diagram-btn-zoom';
    zoomOut.setAttribute('aria-label', 'Zoom out');
    zoomOut.title = 'Zoom out';
    zoomOut.disabled = true;
    zoomOut.innerHTML = `<svg class="diagram-btn-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/></svg>`;

    const status = document.createElement('span');
    status.className = 'diagram-status';
    status.setAttribute('aria-live', 'polite');

    const zoomIn = document.createElement('button');
    zoomIn.type = 'button';
    zoomIn.className = 'diagram-btn diagram-btn-zoom';
    zoomIn.setAttribute('aria-label', 'Zoom in');
    zoomIn.title = 'Zoom in';
    zoomIn.disabled = true;
    zoomIn.innerHTML = `<svg class="diagram-btn-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;

    zoomGroup.append(zoomOut, status, zoomIn);
    toolbarLeft.append(button, zoomGroup);

    const toolbarRight = document.createElement('div');
    toolbarRight.className = 'diagram-toolbar-group';

    const download = document.createElement('button');
    download.type = 'button';
    download.className = 'diagram-btn diagram-btn-download';
    download.setAttribute('aria-label', 'Download diagram as SVG');
    download.title = 'Download SVG';
    download.disabled = true;
    download.innerHTML = `<svg class="diagram-btn-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg><span class="btn-text-full">Download SVG</span><span class="btn-text-short">SVG</span>`;
    toolbarRight.append(download);

    controls.append(toolbarLeft, toolbarRight);

    const viewport = document.createElement('div');
    viewport.className = 'diagram-viewport'; viewport.tabIndex = 0;
    viewport.setAttribute('role', 'region'); viewport.setAttribute('aria-label', 'Diagram; scroll to explore');
    const diagram = document.createElement('div'); diagram.className = 'mermaid'; diagram.textContent = source;
    viewport.append(diagram); card.append(controls, viewport); pre.replaceWith(card);
    let scale = 1;
    let naturalWidth = 0;
    const applyScale = newScale => {
      if (!naturalWidth) return;
      scale = Math.max(0.25, Math.min(3, Math.round(newScale * 100) / 100));
      card.classList.add('diagram-expanded'); card.classList.remove('diagram-fit');
      setButtonLabel(true);
      diagram.style.width = `${naturalWidth * scale}px`;
      diagram.style.minWidth = '0';
      status.textContent = `${Math.round(scale * 100)}%`;
      zoomOut.disabled = scale <= 0.25; zoomIn.disabled = scale >= 3;
    };
    const zoom = delta => {
      if (!naturalWidth) return;
      if (!card.classList.contains('diagram-expanded')) scale = viewport.clientWidth / naturalWidth;
      applyScale(scale + delta);
    };
    zoomOut.addEventListener('click', () => zoom(-0.25));
    zoomIn.addEventListener('click', () => zoom(0.25));

    // Touch & Pointer drag-to-pan across the diagram
    let isDragging = false;
    let startX = 0, startY = 0;
    let scrollStartLeft = 0, scrollStartTop = 0;

    viewport.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button, a')) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      scrollStartLeft = viewport.scrollLeft;
      scrollStartTop = viewport.scrollTop;
      viewport.style.cursor = 'grabbing';
      try { viewport.setPointerCapture(e.pointerId); } catch (_) {}
    });

    viewport.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      viewport.scrollLeft = scrollStartLeft - dx;
      viewport.scrollTop = scrollStartTop - dy;
    });

    const stopDragging = (e) => {
      if (isDragging) {
        isDragging = false;
        viewport.style.cursor = 'grab';
        try { if (e && e.pointerId) viewport.releasePointerCapture(e.pointerId); } catch (_) {}
      }
    };
    viewport.addEventListener('pointerup', stopDragging);
    viewport.addEventListener('pointercancel', stopDragging);

    // Mobile Pinch-to-zoom gesture
    let pinchStartDistance = 0;
    let pinchStartScale = 1;
    let isPinching = false;

    viewport.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        isPinching = true;
        isDragging = false;
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        pinchStartDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        pinchStartScale = (!card.classList.contains('diagram-expanded') && naturalWidth) ? (viewport.clientWidth / naturalWidth) : scale;
      }
    }, { passive: true });

    viewport.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2 && isPinching && pinchStartDistance > 0) {
        if (e.cancelable) e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const factor = dist / pinchStartDistance;
        applyScale(pinchStartScale * factor);
      }
    }, { passive: false });

    viewport.addEventListener('touchend', (e) => {
      if (e.touches.length < 2) {
        isPinching = false;
      }
    }, { passive: true });

    // Double tap on mobile to zoom in / reset
    let lastTapTime = 0;
    viewport.addEventListener('touchend', (e) => {
      if (e.touches.length === 0 && !isPinching) {
        const now = Date.now();
        if (now - lastTapTime < 300 && now - lastTapTime > 50) {
          if (e.cancelable) e.preventDefault();
          if (scale <= 1.1) {
            applyScale(1.6);
          } else {
            button.click();
          }
        }
        lastTapTime = now;
      }
    });

    // Trackpad pinch or Ctrl + Mouse wheel zoom
    viewport.addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        zoom(e.deltaY < 0 ? 0.2 : -0.2);
      }
    }, { passive: false });
    download.addEventListener('click', () => {
      const svg = diagram.querySelector('svg'); if (!svg) return;
      const copy = svg.cloneNode(true);
      const originals = [svg, ...svg.querySelectorAll('*')];
      const clones = [copy, ...copy.querySelectorAll('*')];
      originals.forEach((element, index) => {
        const style = getComputedStyle(element);
        for (const property of ['fill', 'stroke', 'stroke-width', 'color', 'font-family', 'font-size', 'font-weight', 'background-color']) {
          clones[index].style.setProperty(property, style.getPropertyValue(property));
        }
      });
      copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      copy.setAttribute('width', String(svg.viewBox.baseVal.width));
      copy.setAttribute('height', String(svg.viewBox.baseVal.height));
      copy.style.removeProperty('max-width'); copy.style.removeProperty('width'); copy.style.removeProperty('height');
      const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(copy)], {type: 'image/svg+xml;charset=utf-8'}));
      const link = document.createElement('a'); link.href = url; link.download = `an5-diagram-${cards.indexOf(entry) + 1}.svg`;
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    const entry = {card, diagram, source, button, controls, ready(width) {
      naturalWidth = width;
      button.disabled = false; zoomOut.disabled = zoomIn.disabled = !width; download.disabled = false;
    }};
    button.disabled = true;
    return entry;
  });
  try {
    if (!window.mermaid) await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10.9.5/dist/mermaid.min.js';
      script.onload = resolve; script.onerror = () => reject(new Error('Diagram library unavailable'));
      document.head.append(script);
    });
    if (document.fonts) await document.fonts.ready;
    mermaid.initialize({startOnLoad: false, securityLevel: 'strict', theme: 'base',
          themeVariables: {
            darkMode: true,
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
            fontSize: '13px',
            background: '#0d1220',
            primaryColor: '#141c2e',
            primaryTextColor: '#f8fafc',
            primaryBorderColor: 'rgba(56, 189, 248, 0.35)',
            lineColor: '#6366f1',
            secondaryColor: '#0a0f1d',
            secondaryTextColor: '#cbd5e1',
            secondaryBorderColor: 'rgba(99, 102, 241, 0.35)',
            tertiaryColor: '#070b14',
            tertiaryTextColor: '#94a3b8',
            tertiaryBorderColor: 'rgba(255, 255, 255, 0.08)',
            mainBkg: '#141c2e',
            secondBkg: '#0a0f1d',
            nodeBorder: 'rgba(56, 189, 248, 0.35)',
            clusterBkg: 'rgba(10, 15, 29, 0.7)',
            clusterBorder: 'rgba(56, 189, 248, 0.22)',
            titleColor: '#38bdf8',
            edgeLabelBackground: '#070b14',
            nodeTextColor: '#f8fafc'
          }
    });
    for (const entry of cards) {
      try {
        await mermaid.run({nodes: [entry.diagram]});
        const svg = entry.diagram.querySelector('svg');
        if (svg) {
          const width = svg.viewBox.baseVal.width;
          if (width) entry.diagram.style.setProperty('--diagram-width', `${width}px`);
          entry.ready(width);
        }
      } catch (error) { fallback(entry); console.error('Mermaid render error:', error); }
    }
  } catch (error) { cards.forEach(fallback); console.error('Mermaid load error:', error); }
  function fallback(entry) {
    entry.controls.hidden = true;
    const pre = document.createElement('pre'); pre.textContent = entry.source;
    entry.diagram.replaceChildren(pre);
    const message = document.createElement('p'); message.textContent = 'Diagram unavailable. Source is shown below.';
    entry.card.prepend(message);
  }
})();
