(function () {
  if (document.getElementById('ai-assistant-root')) return;

  const root = document.createElement('div');
  root.id = 'ai-assistant-root';
  root.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = `
    :host { all: initial; }
    .ai-overlay {
      position: fixed; bottom: 24px; right: 24px; z-index: 2147483647;
      width: 440px; max-height: 480px; overflow-y: auto;
      background: #1e1e2e; color: #cdd6f4;
      border-radius: 12px; padding: 0;
      font: 14px/1.7 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      box-shadow: 0 8px 32px rgba(0,0,0,0.45);
      border: 1px solid #313244;
      display: none;
    }
    .ai-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 16px;
      background: #181825; border-radius: 12px 12px 0 0;
      border-bottom: 1px solid #313244;
      cursor: move; user-select: none;
    }
    .ai-header-title {
      font-weight: 600; font-size: 13px; color: #cba6f7;
    }
    .ai-close {
      border: none; background: none; color: #6c7086;
      cursor: pointer; font-size: 18px; padding: 0 4px;
      line-height: 1;
    }
    .ai-close:hover { color: #f38ba8; }
    .ai-body { padding: 16px; }
    .ai-loading {
      display: flex; align-items: center; gap: 10px;
      color: #a6adc8;
    }
    .ai-spinner {
      width: 16px; height: 16px;
      border: 2px solid #313244; border-top-color: #cba6f7;
      border-radius: 50%; animation: ai-spin 0.8s linear infinite;
    }
    @keyframes ai-spin { to { transform: rotate(360deg); } }
    .ai-result { white-space: pre-wrap; word-break: break-word; }
    .ai-error { color: #f38ba8; }
    .ai-footer {
      padding: 8px 16px;
      border-top: 1px solid #313244;
      display: flex; gap: 8px; justify-content: flex-end;
    }
    .ai-btn {
      border: none; border-radius: 6px; padding: 4px 12px;
      font-size: 12px; cursor: pointer;
      background: #313244; color: #cdd6f4;
    }
    .ai-btn:hover { background: #45475a; }
    .ai-btn-copy { background: #a6e3a1; color: #1e1e2e; }
    .ai-btn-copy:hover { background: #b8e6b8; }
  `;
  root.shadowRoot.appendChild(style);

  const overlay = document.createElement('div');
  overlay.className = 'ai-overlay';
  root.shadowRoot.appendChild(overlay);
  document.body.appendChild(root);

  let isDragging = false, startX, startY, origRect;

  function showLoading() {
    overlay.innerHTML = `
      <div class="ai-header">
        <span class="ai-header-title">AI 助手</span>
        <button class="ai-close" id="aiCloseBtn">✕</button>
      </div>
      <div class="ai-body">
        <div class="ai-loading">
          <div class="ai-spinner"></div>
          <span>AI 思考中...</span>
        </div>
      </div>
    `;
    overlay.style.display = 'block';
    bindHeaderEvents();
    bindClose();
  }

  function showResult(content) {
    overlay.innerHTML = `
      <div class="ai-header">
        <span class="ai-header-title">AI 助手</span>
        <button class="ai-close" id="aiCloseBtn">✕</button>
      </div>
      <div class="ai-body">
        <div class="ai-result">${escapeHtml(content)}</div>
      </div>
      <div class="ai-footer">
        <button class="ai-btn ai-btn-copy" id="aiCopyBtn">复制</button>
        <button class="ai-btn" id="aiCloseBtn2">关闭</button>
      </div>
    `;
    overlay.style.display = 'block';
    bindHeaderEvents();
    bindClose();
    const copyBtn = overlay.querySelector('#aiCopyBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(content);
          copyBtn.textContent = '✓ 已复制';
          setTimeout(() => { copyBtn.textContent = '复制'; }, 2000);
        } catch {}
      });
    }
  }

  function showError(msg) {
    overlay.innerHTML = `
      <div class="ai-header">
        <span class="ai-header-title">AI 助手</span>
        <button class="ai-close" id="aiCloseBtn">✕</button>
      </div>
      <div class="ai-body">
        <div class="ai-error">❌ ${escapeHtml(msg)}</div>
      </div>
      <div class="ai-footer">
        <button class="ai-btn" id="aiCloseBtn2">关闭</button>
      </div>
    `;
    overlay.style.display = 'block';
    bindHeaderEvents();
    bindClose();
  }

  function bindHeaderEvents() {
    const header = overlay.querySelector('.ai-header');
    if (!header) return;
    header.addEventListener('mousedown', (e) => {
      if (e.target.closest('button')) return;
      isDragging = true;
      const rect = overlay.getBoundingClientRect();
      origRect = { left: rect.left, top: rect.top };
      startX = e.clientX; startY = e.clientY;
      overlay.style.left = origRect.left + 'px';
      overlay.style.top = origRect.top + 'px';
      overlay.style.right = 'auto';
      overlay.style.bottom = 'auto';
    });
  }

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    overlay.style.left = (origRect.left + e.clientX - startX) + 'px';
    overlay.style.top = (origRect.top + e.clientY - startY) + 'px';
  });

  document.addEventListener('mouseup', () => { isDragging = false; });

  function bindClose() {
    const btns = overlay.querySelectorAll('[id^="aiCloseBtn"]');
    btns.forEach(btn => btn.addEventListener('click', () => {
      overlay.style.display = 'none';
    }));
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'AI_LOADING') showLoading();
    else if (msg.type === 'AI_RESULT') showResult(msg.result);
    else if (msg.type === 'AI_ERROR') showError(msg.error);
    else if (msg.type === 'AI_PING') {} // keep alive check
  });
})();
