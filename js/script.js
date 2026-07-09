(function() {
  'use strict';

  const DEFAULT_LOGO = 'img/logo.png';

  const DEFAULT_GAMES = [
    {
      id: 'overcooked-2',
      title: 'Overcooked 2! Việt Hoá',
      banner: 'https://picsum.photos/seed/overcooked2-vn/800/500',
      bannerLogo: '',
      status: 'in-progress',
      info: 'Overcooked 2 là tựa game nấu ăn hợp tác hỗn loạn do Ghost Town Games phát triển. Người chơi sẽ vào vai các đầu bếp làm việc trong các nhà bếp kỳ quặc, di chuyển liên tục để sơ chế nguyên liệu, nấu ăn và giao món ăn đúng hạn.\n\nGame hỗ trợ chơi nối mạng online, thêm nhiều cấp độ mới, cơ chế ném đồ ăn và các thử thách khó nhằn hơn.',
      description: 'Dự án Việt Hoá toàn bộ văn bản trong game: tên món ăn, hướng dẫn, cốt truyện và giao diện. Đang trong giai đoạn hoàn thiện, dự kiến ra mắt trong thời gian tới.',
      developer: 'Ghost Town Games',
      publisher: 'Team17',
      translator: 'DuyTam',
      technician: 'DuyTam',
      reviewer: 'DuyTam',
      tester: 'DuyTam',
      support: 'DuyTam',
      expectedRelease: '2024-08-01',
      releaseDate: ''
    }
  ];

  const DEFAULT_SETTINGS = { logo: '', donateQr: '', donateAcc: '', donateBank: '', donateName: '' };

  let games = [];
  let settings = {};
  let editingGameId = null;
  let adminPassword = '';

  function escapeHtml(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  }
  function escapeAttr(s) { return escapeHtml(s); }
  function fmtDate(s) {
    if (!s) return '';
    try {
      const d = new Date(s);
      if (isNaN(d.getTime())) return s;
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) { return s; }
  }
  function statusLabel(s) { return s === 'completed' ? 'Hoàn thành' : 'Đang thực hiện'; }

  async function fetchGames() {
    try {
      const res = await fetch('/api/getData');
      const data = await res.json();
      return data.games || DEFAULT_GAMES;
    } catch { return DEFAULT_GAMES; }
  }
  async function fetchSettings() {
    try {
      const res = await fetch('/api/getData');
      const data = await res.json();
      return data.settings || DEFAULT_SETTINGS;
    } catch { return DEFAULT_SETTINGS; }
  }
  async function saveGamesApi(gamesArr) {
    await fetch('/api/saveData', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: adminPassword, type: 'games', data: gamesArr })
    });
  }
  async function saveSettingsApi(settingsObj) {
    await fetch('/api/saveData', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: adminPassword, type: 'settings', data: settingsObj })
    });
  }

  function renderGames() {
    const list = document.getElementById('games-list');
    if (!list) return;
    list.innerHTML = '';

    if (games.length === 0) {
      list.innerHTML = '<div class="admin-empty">Chưa có dự án nào được đăng.</div>';
    } else {
      games.forEach((g, idx) => {
        const card = document.createElement('article');
        card.className = 'game-card';
        const briefRaw = (g.info || '').split('\n')[0] || '';
        const brief = briefRaw.length > 180 ? briefRaw.substring(0, 180) + '…' : briefRaw;
        card.innerHTML = `
          <div class="game-banner">
            <img src="${escapeAttr(g.banner || '')}" alt="${escapeAttr(g.title)}" onerror="this.style.opacity=0">
            ${g.bannerLogo ? `<img src="${escapeAttr(g.bannerLogo)}" class="game-banner-logo" alt="Logo">` : ''}
            <div class="game-banner-overlay"></div>
            <div class="game-status ${g.status}"><span class="status-icon"></span>${statusLabel(g.status)}</div>
          </div>
          <div class="game-info">
            <div class="game-meta-top">
              <span class="num">Dự án ${String(idx + 1).padStart(2, '0')}</span>
              <span class="dot"></span>
              <span>${escapeHtml(g.developer || '—')}</span>
            </div>
            <h3 class="game-title">${escapeHtml(g.title)}</h3>
            <p class="game-brief">${escapeHtml(brief)}</p>
            <div class="game-meta-row">
              <div class="game-meta-item"><span class="key">Phát hành</span><span class="val">${escapeHtml(g.publisher || '—')}</span></div>
              <div class="game-meta-item"><span class="key">Dịch giả</span><span class="val">${escapeHtml(g.translator || '—')}</span></div>
              <div class="game-meta-item"><span class="key">Ra mắt</span><span class="val">${g.releaseDate ? fmtDate(g.releaseDate) : (g.expectedRelease ? 'Dự kiến ' + fmtDate(g.expectedRelease) : '—')}</span></div>
            </div>
            <button class="game-cta" data-game-id="${escapeAttr(g.id)}">Xem chi tiết →</button>
          </div>
        `;
        list.appendChild(card);
      });

      list.querySelectorAll('.game-cta').forEach(btn => {
        btn.addEventListener('click', () => openGameModal(btn.dataset.gameId));
      });
    }

    const total = games.length;
    const done = games.filter(g => g.status === 'completed').length;
    const progress = games.filter(g => g.status === 'in-progress').length;
    document.getElementById('meta-projects').textContent = String(total).padStart(2, '0');
    document.getElementById('meta-done').textContent = String(done).padStart(2, '0');
    document.getElementById('meta-progress').textContent = String(progress).padStart(2, '0');
  }

  function openGameModal(id) {
    const g = games.find(x => x.id === id);
    if (!g) return;
    document.getElementById('modal-banner-img').src = g.banner || '';
    
    const bannerLogo = document.getElementById('modal-banner-logo');
    if (g.bannerLogo) {
      bannerLogo.src = g.bannerLogo;
      bannerLogo.style.display = 'block';
    } else {
      bannerLogo.style.display = 'none';
    }

    document.getElementById('modal-title').textContent = g.title;
    const status = document.getElementById('modal-status');
    status.className = 'modal-status ' + g.status;
    status.innerHTML = `<span class="status-icon"></span>${statusLabel(g.status)}`;

    document.getElementById('modal-info').textContent = g.info || '—';
    document.getElementById('modal-desc').textContent = g.description || '—';

    const team = document.getElementById('modal-team');
    const cells = [
      ['Nhà phát triển', g.developer], ['Nhà phát hành', g.publisher], ['Dịch giả', g.translator],
      ['Kỹ thuật', g.technician], ['Kiểm duyệt', g.reviewer], ['Thử nghiệm', g.tester], ['Hỗ trợ', g.support]
    ];
    team.innerHTML = cells.map(([label, val]) => `
      <div class="team-cell">
        <div class="team-cell-label">${escapeHtml(label)}</div>
        <div class="team-cell-value ${val ? '' : 'empty'}">${val ? escapeHtml(val) : '— chưa có —'}</div>
      </div>
    `).join('');

    const dates = document.getElementById('modal-dates');
    const expDate = fmtDate(g.expectedRelease);
    const relDate = fmtDate(g.releaseDate);
    dates.innerHTML = `
      <div class="date-cell"><div class="date-cell-label">Dự kiến ra mắt</div><div class="date-cell-value ${expDate ? '' : 'empty'}">${expDate || '— chưa xác định —'}</div></div>
      <div class="date-cell"><div class="date-cell-label">Ngày ra mắt</div><div class="date-cell-value ${relDate ? '' : 'empty'}">${relDate || '— chưa ra mắt —'}</div></div>
    `;

    document.getElementById('game-modal').classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    document.getElementById('game-modal').classList.remove('is-open');
    if (!isAnyOverlayOpen()) document.body.style.overflow = '';
  }

  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('game-modal').addEventListener('click', e => { if (e.target.id === 'game-modal') closeModal(); });

  function isAnyOverlayOpen() {
    return document.querySelector('.modal-overlay.is-open, .login-modal.is-open, .admin-panel.is-open, .editor-overlay.is-open, .disclaimer-overlay.is-open');
  }

  function showDisclaimer() {
    const disclaimerShown = sessionStorage.getItem('duytam_disclaimer_v1');
    if (!disclaimerShown) {
      document.getElementById('disclaimer-modal').classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }
  }
  function closeDisclaimer() {
    document.getElementById('disclaimer-modal').classList.remove('is-open');
    sessionStorage.setItem('duytam_disclaimer_v1', 'true');
    if (!isAnyOverlayOpen()) document.body.style.overflow = '';
  }
  document.getElementById('disclaimer-close').addEventListener('click', closeDisclaimer);

  function openLogin() {
    document.getElementById('login-modal').classList.add('is-open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => document.getElementById('login-user').focus(), 100);
  }
  function closeLogin() {
    document.getElementById('login-modal').classList.remove('is-open');
    if (!isAnyOverlayOpen()) document.body.style.overflow = '';
    document.getElementById('login-error').classList.remove('is-show');
    document.getElementById('login-user').value = '';
    document.getElementById('login-pass').value = '';
  }

  document.getElementById('admin-trigger').addEventListener('click', openLogin);
  document.getElementById('footer-admin').addEventListener('click', e => { e.preventDefault(); openLogin(); });
  document.getElementById('login-cancel').addEventListener('click', closeLogin);
  document.getElementById('login-modal').addEventListener('click', e => { if (e.target.id === 'login-modal') closeLogin(); });

  document.getElementById('toggle-pass').addEventListener('click', function() {
    const input = document.getElementById('login-pass');
    if (input.type === 'password') { input.type = 'text'; this.textContent = 'Ẩn'; } 
    else { input.type = 'password'; this.textContent = 'Hiện'; }
  });

 document.getElementById('login-submit').addEventListener('click', async () => {
    const u = document.getElementById('login-user').value.trim();
    const p = document.getElementById('login-pass').value;
    const errorEl = document.getElementById('login-error');
    
    if (u !== 'admin') {
      errorEl.textContent = 'Tên đăng nhập không đúng.';
      errorEl.classList.add('is-show');
      return;
    }

    // Lấy token xác thực từ Cloudflare Turnstile
    const turnstileToken = turnstile.getResponse();
    if (!turnstileToken) {
      errorEl.textContent = 'Vui lòng xác minh bạn không phải là robot.';
      errorEl.classList.add('is-show');
      return;
    }

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: p, turnstileToken: turnstileToken }) // Gửi kèm token
      });
      const data = await res.json();

      if (data.success) {
        adminPassword = p;
        closeLogin();
        openAdminPanel();
        turnstile.reset(); // Reset captcha sau khi đăng nhập thành công
      } else {
        errorEl.textContent = data.error || 'Mật khẩu không đúng.';
        errorEl.classList.add('is-show');
        turnstile.reset(); // Reset captcha nếu sai để yêu cầu check lại
      }
    } catch (err) {
      errorEl.textContent = 'Lỗi kết nối server.';
      errorEl.classList.add('is-show');
    }
});

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (document.getElementById('game-editor').classList.contains('is-open')) { closeEditor(); return; }
      if (document.getElementById('site-editor').classList.contains('is-open')) { closeSiteEditor(); return; }
      if (document.getElementById('login-modal').classList.contains('is-open')) { closeLogin(); return; }
      if (document.getElementById('game-modal').classList.contains('is-open')) { closeModal(); return; }
      if (document.getElementById('disclaimer-modal').classList.contains('is-open')) { closeDisclaimer(); return; }
    }
  });

  function openAdminPanel() {
    document.getElementById('admin-panel').classList.add('is-open');
    document.body.style.overflow = 'hidden';
    renderAdminList();
  }
  function closeAdminPanel() {
    document.getElementById('admin-panel').classList.remove('is-open');
    if (!isAnyOverlayOpen()) document.body.style.overflow = '';
  }
  document.getElementById('admin-logout').addEventListener('click', closeAdminPanel);

  function renderAdminList() {
    const list = document.getElementById('admin-games-list');
    list.innerHTML = '';
    document.getElementById('admin-count').textContent = String(games.length) + ' mục';
    if (games.length === 0) { list.innerHTML = '<div class="admin-empty">Chưa có game nào. Nhấn "+ Thêm game" để bắt đầu.</div>'; return; }
    games.forEach((g, idx) => {
      const row = document.createElement('div');
      row.className = 'admin-game-row';
      row.innerHTML = `
        <div class="admin-game-num">${String(idx + 1).padStart(2, '0')}</div>
        <div class="admin-game-title">${escapeHtml(g.title)}</div>
        <div class="admin-game-status ${g.status}">${statusLabel(g.status)}</div>
        <div class="admin-game-actions">
          <button class="admin-icon-btn" data-edit="${escapeAttr(g.id)}" title="Sửa">✎</button>
          <button class="admin-icon-btn danger" data-del="${escapeAttr(g.id)}" title="Xoá">×</button>
        </div>
      `;
      list.appendChild(row);
    });
    list.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => openEditor(btn.dataset.edit)));
    list.querySelectorAll('[data-del]').forEach(btn => btn.addEventListener('click', () => deleteGame(btn.dataset.del)));
  }

  function openEditor(id) {
    editingGameId = id || null;
    const g = id ? games.find(x => x.id === id) : null;
    document.getElementById('editor-mode').textContent = id ? 'Sửa' : 'Thêm';
    document.getElementById('game-title').value = g?.title || '';
    document.getElementById('game-banner').value = g?.banner || '';
    document.getElementById('game-banner-logo').value = g?.bannerLogo || '';
    document.getElementById('game-status').value = g?.status || 'in-progress';
    document.getElementById('game-info').value = g?.info || '';
    document.getElementById('game-desc').value = g?.description || '';
    document.getElementById('game-developer').value = g?.developer || '';
    document.getElementById('game-publisher').value = g?.publisher || '';
    document.getElementById('game-translator').value = g?.translator || '';
    document.getElementById('game-technician').value = g?.technician || '';
    document.getElementById('game-reviewer').value = g?.reviewer || '';
    document.getElementById('game-tester').value = g?.tester || '';
    document.getElementById('game-support').value = g?.support || '';
    document.getElementById('game-expected').value = g?.expectedRelease || '';
    document.getElementById('game-release').value = g?.releaseDate || '';
    document.getElementById('game-editor').classList.add('is-open');
  }
  function closeEditor() { document.getElementById('game-editor').classList.remove('is-open'); editingGameId = null; }

  document.getElementById('admin-add').addEventListener('click', () => openEditor(null));
  document.getElementById('editor-close').addEventListener('click', closeEditor);
  document.getElementById('editor-cancel').addEventListener('click', closeEditor);

  document.getElementById('editor-save').addEventListener('click', async () => {
    const title = document.getElementById('game-title').value.trim();
    if (!title) { showToast('Vui lòng nhập tên game'); return; }
    const data = {
      title, 
      banner: document.getElementById('game-banner').value.trim(),
      bannerLogo: document.getElementById('game-banner-logo').value.trim(),
      status: document.getElementById('game-status').value, 
      info: document.getElementById('game-info').value,
      description: document.getElementById('game-desc').value, 
      developer: document.getElementById('game-developer').value,
      publisher: document.getElementById('game-publisher').value, 
      translator: document.getElementById('game-translator').value,
      technician: document.getElementById('game-technician').value, 
      reviewer: document.getElementById('game-reviewer').value,
      tester: document.getElementById('game-tester').value, 
      support: document.getElementById('game-support').value,
      expectedRelease: document.getElementById('game-expected').value, 
      releaseDate: document.getElementById('game-release').value
    };
    if (editingGameId) {
      const idx = games.findIndex(g => g.id === editingGameId);
      if (idx >= 0) games[idx] = Object.assign({}, games[idx], data);
      showToast('Đang cập nhật: ' + title);
    } else {
      const newGame = Object.assign({ id: 'g-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) }, data);
      games.push(newGame);
      showToast('Đã thêm: ' + title);
    }
    await saveGamesApi(games);
    renderGames(); renderAdminList(); closeEditor();
  });

  async function deleteGame(id) {
    const g = games.find(x => x.id === id);
    if (!g) return;
    if (!confirm('Xoá game "' + g.title + '"? Hành động này không thể hoàn tác.')) return;
    games = games.filter(x => x.id !== id);
    await saveGamesApi(games);
    renderGames(); renderAdminList();
    showToast('Đã xoá: ' + g.title);
  }

  function openSiteEditor() {
    document.getElementById('setting-logo').value = settings.logo || '';
    document.getElementById('setting-donate-qr').value = settings.donateQr || '';
    document.getElementById('setting-donate-acc').value = settings.donateAcc || '';
    document.getElementById('setting-donate-bank').value = settings.donateBank || '';
    document.getElementById('setting-donate-name').value = settings.donateName || '';
    document.getElementById('site-editor').classList.add('is-open');
  }
  function closeSiteEditor() { document.getElementById('site-editor').classList.remove('is-open'); }

  document.getElementById('admin-site-settings').addEventListener('click', openSiteEditor);
  document.getElementById('site-editor-close').addEventListener('click', closeSiteEditor);
  document.getElementById('site-editor-cancel').addEventListener('click', closeSiteEditor);

  document.getElementById('site-editor-save').addEventListener('click', async () => {
    settings.logo = document.getElementById('setting-logo').value.trim();
    settings.donateQr = document.getElementById('setting-donate-qr').value.trim();
    settings.donateAcc = document.getElementById('setting-donate-acc').value.trim();
    settings.donateBank = document.getElementById('setting-donate-bank').value.trim();
    settings.donateName = document.getElementById('setting-donate-name').value.trim();
    await saveSettingsApi(settings);
    applySettings(); closeSiteEditor();
    showToast('Đã cập nhật cài đặt site');
  });

  function applySettings() {
    const navLogo = document.getElementById('nav-logo');
    const footerLogo = document.getElementById('footer-logo');
    const logoUrl = settings.logo || DEFAULT_LOGO;
    navLogo.innerHTML = `<img src="${escapeAttr(logoUrl)}" alt="Logo" onerror="this.style.display='none'">`;
    footerLogo.innerHTML = `<img src="${escapeAttr(logoUrl)}" alt="DuyTam Translation" onerror="this.style.display='none'">`;

    const donateQrImg = document.getElementById('donate-qr-img');
    if (settings.donateQr) {
      donateQrImg.src = settings.donateQr;
      donateQrImg.style.display = 'block';
    } else {
      donateQrImg.style.display = 'none';
    }
    document.getElementById('donate-acc').textContent = settings.donateAcc || '— Chưa cập nhật —';
    document.getElementById('donate-bank').textContent = settings.donateBank || '— Chưa cập nhật —';
    document.getElementById('donate-name').textContent = settings.donateName || '— Chưa cập nhật —';
  }

  document.querySelectorAll('.donate-copy').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.copy;
      const text = document.getElementById(targetId).textContent;
      if (text.includes('Chưa cập nhật')) return;
      navigator.clipboard.writeText(text).then(() => {
        showToast('Đã sao chép: ' + text);
      }).catch(err => {
        showToast('Lỗi sao chép');
      });
    });
  });

  let toastTimer = null;
  function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('is-show'), 2800);
  }

  async function init() {
    games = await fetchGames();
    settings = await fetchSettings();
    renderGames();
    applySettings();
    showDisclaimer();
  }
  init();

})();
