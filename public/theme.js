/* ==========================================================================
   Merisk'B1og — 前端脚本
   视觉语言参考 https://chen-yingfa.github.io/
   主题切换（body.dark + pref-theme）、移动端菜单、回到顶部、代码复制、
   图片题注与灯箱、归档/标签筛选、站内搜索、分享、加密文章本地解密。
   ========================================================================== */
(function () {
  const THEME_KEY = 'pref-theme';
  const MENU_SCROLL_KEY = 'menu-scroll-position';

  const ICON_COPY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2.4"></rect><path d="M15 5.4A2.4 2.4 0 0 0 12.6 3H6.4A2.4 2.4 0 0 0 4 5.4v6.2A2.4 2.4 0 0 0 6.4 14"></path></svg>';
  const ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12.5 9.5 18 20 6.5"></path></svg>';

  document.addEventListener('DOMContentLoaded', function () {
    const body = document.body;

    /* ---- 主题 ---- */
    function syncGiscusTheme() {
      const frame = document.querySelector('iframe.giscus-frame');
      if (!frame) return;
      frame.contentWindow.postMessage(
        { giscus: { setConfig: { theme: document.body.classList.contains('dark') ? 'dark' : 'light' } } },
        'https://giscus.app'
      );
    }

    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', function () {
        const dark = body.classList.toggle('dark');
        try { localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light'); } catch (e) {}
        themeToggle.setAttribute('aria-pressed', dark ? 'true' : 'false');
        syncGiscusTheme();
      });
      themeToggle.setAttribute('aria-pressed', body.classList.contains('dark') ? 'true' : 'false');
    }

    window.addEventListener('message', function (event) {
      if (event.origin === 'https://giscus.app' && event.data && event.data.giscus) syncGiscusTheme();
    });

    /* ---- 移动端菜单 ---- */
    const nav = document.querySelector('.nav');
    const menu = document.getElementById('menu');
    const menuToggle = document.getElementById('menu-toggle');
    const portraitQuery = window.matchMedia('(max-width: 640px) and (orientation: portrait)');

    if (menu) {
      try { menu.scrollLeft = Number(localStorage.getItem(MENU_SCROLL_KEY) || 0); } catch (e) {}
      menu.addEventListener('scroll', function () {
        try { localStorage.setItem(MENU_SCROLL_KEY, String(menu.scrollLeft)); } catch (e) {}
      }, { passive: true });
    }

    function closeMenu() {
      if (!nav || !menuToggle) return;
      nav.classList.remove('menu-open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }

    if (menuToggle && nav) {
      menuToggle.addEventListener('click', function (event) {
        if (!portraitQuery.matches) return;
        event.stopPropagation();
        const open = nav.classList.toggle('menu-open');
        menuToggle.setAttribute('aria-expanded', String(open));
      });
    }
    if (menu) {
      menu.querySelectorAll('a').forEach(function (anchor) {
        anchor.addEventListener('click', function () {
          if (portraitQuery.matches) closeMenu();
        });
      });
    }
    if (portraitQuery.addEventListener) {
      portraitQuery.addEventListener('change', function (event) {
        if (!event.matches) closeMenu();
      });
    }
    document.addEventListener('click', function (event) {
      if (!nav || !portraitQuery.matches) return;
      if (event.target instanceof Node && !nav.contains(event.target)) closeMenu();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeMenu();
    });

    /* ---- 回到顶部 ---- */
    const topLink = document.getElementById('top-link');
    if (topLink) {
      const updateTopLink = function () {
        const y = window.scrollY || document.documentElement.scrollTop || 0;
        topLink.classList.toggle('is-visible', y > 800);
      };
      window.addEventListener('scroll', updateTopLink, { passive: true });
      topLink.addEventListener('click', function (event) {
        event.preventDefault();
        window.scrollTo({
          top: 0,
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        });
      });
      updateTopLink();
    }

    /* ---- 灯箱 ---- */
    let lightboxNode = null;
    let lightboxLastFocused = null;

    function createLightbox() {
      lightboxNode = document.createElement('div');
      lightboxNode.className = 'lightbox';
      lightboxNode.setAttribute('role', 'dialog');
      lightboxNode.setAttribute('aria-modal', 'true');
      lightboxNode.setAttribute('aria-label', '图片预览');
      lightboxNode.innerHTML = '<button class="lightbox-close" type="button" aria-label="关闭图片预览">×</button><img alt="">';
      document.body.append(lightboxNode);

      const closeButton = lightboxNode.querySelector('.lightbox-close');
      function closeLightbox() {
        lightboxNode.classList.remove('is-open');
        if (lightboxLastFocused && lightboxLastFocused.focus) lightboxLastFocused.focus();
      }
      lightboxNode.addEventListener('click', function (event) {
        if (event.target === lightboxNode || event.target.classList.contains('lightbox-close')) closeLightbox();
      });
      lightboxNode.addEventListener('keydown', function (event) {
        if (event.key === 'Tab') { event.preventDefault(); closeButton.focus(); }
      });
      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') closeLightbox();
      });
    }

    /* ---- 正文增强：代码复制、图片题注、灯箱 ---- */
    function enhanceContent() {
      const content = document.querySelector('.post-content');
      if (!content) return;

      content.querySelectorAll('pre > code').forEach(function (codeblock) {
        const pre = codeblock.parentNode;
        if (!(pre instanceof HTMLElement) || pre.querySelector('.copy-code')) return;
        const button = document.createElement('button');
        button.className = 'copy-code';
        button.type = 'button';
        button.setAttribute('aria-label', '复制代码');
        button.setAttribute('title', '复制代码');
        button.innerHTML = ICON_COPY;
        button.addEventListener('click', function () {
          if (!('clipboard' in navigator)) return;
          navigator.clipboard.writeText(codeblock.textContent || '');
          button.innerHTML = ICON_CHECK;
          window.setTimeout(function () { button.innerHTML = ICON_COPY; }, 2000);
        });
        pre.append(button);
      });

      content.querySelectorAll('img[title]').forEach(function (img) {
        if (!(img instanceof HTMLImageElement)) return;
        if (img.dataset.captionInjected === 'true') return;
        const title = (img.getAttribute('title') || '').trim();
        if (!title) return;
        const caption = document.createElement('span');
        caption.className = 'image-caption';
        caption.textContent = title;
        img.insertAdjacentElement('afterend', caption);
        img.dataset.captionInjected = 'true';
      });

      content.querySelectorAll('img').forEach(function (image) {
        if (image.dataset.lightboxReady) return;
        image.dataset.lightboxReady = '1';
        image.addEventListener('click', function () {
          if (!lightboxNode) createLightbox();
          const box = lightboxNode.querySelector('img');
          lightboxLastFocused = document.activeElement;
          box.src = image.currentSrc || image.src;
          box.alt = image.alt || '';
          lightboxNode.classList.add('is-open');
          lightboxNode.querySelector('.lightbox-close').focus();
        });
      });
    }

    enhanceContent();

    /* ---- 加密文章：浏览器端解密（解锁 10 分钟后需重新输入）---- */
    const UNLOCK_TTL = 10 * 60 * 1000;
    const lockEl = document.getElementById('article-lock');
    if (lockEl) {
      const payloadEl = document.getElementById('article-lock-payload');
      const contentEl = document.getElementById('article-content');
      const formEl = document.getElementById('article-lock-form');
      const inputEl = document.getElementById('article-lock-password');
      const errorEl = document.getElementById('article-lock-error');
      const storeKey = 'merisk-unlock';
      let payload = null;
      let relockTimer = null;
      try { payload = JSON.parse(payloadEl.textContent || ''); } catch (e) { payload = null; }

      const fromB64 = function (value) {
        const binary = atob(value);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return bytes;
      };

      const decrypt = async function (password) {
        const baseKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
        const key = await crypto.subtle.deriveKey(
          { name: 'PBKDF2', salt: fromB64(payload.salt), iterations: payload.iter, hash: 'SHA-256' },
          baseKey,
          { name: 'AES-GCM', length: 256 },
          false,
          ['decrypt']
        );
        const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(payload.iv) }, key, fromB64(payload.ct));
        return new TextDecoder().decode(plain);
      };

      const readUnlock = function () {
        try {
          const raw = sessionStorage.getItem(storeKey);
          if (!raw) return null;
          const data = JSON.parse(raw);
          if (!data || !data.pw || !data.exp || data.exp <= Date.now()) {
            sessionStorage.removeItem(storeKey);
            return null;
          }
          return data;
        } catch (e) { return null; }
      };
      const saveUnlock = function (password) {
        try { sessionStorage.setItem(storeKey, JSON.stringify({ pw: password, exp: Date.now() + UNLOCK_TTL })); } catch (e) {}
      };
      const clearUnlock = function () { try { sessionStorage.removeItem(storeKey); } catch (e) {} };

      const showError = function (message) {
        if (!errorEl) return;
        errorEl.textContent = message;
        errorEl.hidden = false;
      };

      const scheduleRelock = function () {
        if (relockTimer) window.clearTimeout(relockTimer);
        const data = readUnlock();
        if (!data) return;
        relockTimer = window.setTimeout(relock, Math.max(1000, data.exp - Date.now()));
      };
      const extendUnlock = function () {
        const data = readUnlock();
        if (!data) return;
        try { sessionStorage.setItem(storeKey, JSON.stringify({ pw: data.pw, exp: Date.now() + UNLOCK_TTL })); } catch (e) {}
        scheduleRelock();
      };

      const reveal = function (html) {
        contentEl.innerHTML = html;
        contentEl.hidden = false;
        lockEl.hidden = true;
        if (errorEl) errorEl.hidden = true;
        enhanceContent();
        scheduleRelock();
      };

      function relock() {
        clearUnlock();
        if (relockTimer) { window.clearTimeout(relockTimer); relockTimer = null; }
        contentEl.innerHTML = '';
        contentEl.hidden = true;
        lockEl.hidden = false;
        showError('已超过 10 分钟无操作，请重新输入密码');
        if (inputEl) { inputEl.value = ''; inputEl.focus(); }
      }

      let lastActivity = 0;
      const onActivity = function () {
        const now = Date.now();
        if (now - lastActivity < 15000) return;
        lastActivity = now;
        extendUnlock();
      };
      ['scroll', 'click', 'keydown', 'pointerdown', 'mousemove', 'touchstart'].forEach(function (type) {
        window.addEventListener(type, onActivity, { passive: true });
      });

      if (!payload) {
        showError('这篇文章的密文损坏，无法解锁。');
      } else if (!window.crypto || !window.crypto.subtle) {
        showError('当前环境不支持解密，请使用 HTTPS 访问。');
      } else {
        const saved = readUnlock();
        if (saved) decrypt(saved.pw).then(reveal).catch(function () { clearUnlock(); });
        formEl.addEventListener('submit', function (event) {
          event.preventDefault();
          if (errorEl) errorEl.hidden = true;
          const password = inputEl.value;
          if (!password) return;
          decrypt(password).then(function (html) {
            saveUnlock(password);
            reveal(html);
          }).catch(function () {
            showError('密码不正确，请重试');
            inputEl.select();
          });
        });
      }
    }

    /* ---- 归档筛选 ---- */
    const archiveSearch = document.getElementById('archive-search');
    if (archiveSearch) {
      const items = Array.from(document.querySelectorAll('.archive-entry'));
      const years = Array.from(document.querySelectorAll('.archive-year'));
      const yearButtons = Array.from(document.querySelectorAll('.year-filter'));
      const count = document.getElementById('archive-count');
      const empty = document.getElementById('archive-empty');
      const reset = document.getElementById('archive-reset');
      const total = items.length;
      let activeYear = 'all';

      const updateArchive = function () {
        const query = archiveSearch.value.trim().toLowerCase();
        let visible = 0;
        items.forEach(function (item) {
          const yearMatches = activeYear === 'all' || item.dataset.year === activeYear;
          const queryMatches = !query || (item.dataset.search || '').includes(query);
          const match = yearMatches && queryMatches;
          item.hidden = !match;
          if (match) visible++;
        });
        years.forEach(function (year) {
          year.hidden = !year.querySelector('.archive-entry:not([hidden])');
        });
        const filtered = query || activeYear !== 'all';
        if (count) count.textContent = filtered ? visible + ' / ' + total + ' 篇文章' : total + ' 篇文章';
        if (empty) empty.hidden = visible !== 0;
      };

      yearButtons.forEach(function (button) {
        button.addEventListener('click', function () {
          activeYear = button.dataset.year;
          yearButtons.forEach(function (item) { item.classList.toggle('active', item === button); });
          updateArchive();
        });
      });
      archiveSearch.addEventListener('input', updateArchive);
      if (reset) {
        reset.addEventListener('click', function () {
          archiveSearch.value = '';
          activeYear = 'all';
          yearButtons.forEach(function (item) { item.classList.toggle('active', item.dataset.year === 'all'); });
          updateArchive();
          archiveSearch.focus();
        });
      }
      document.addEventListener('keydown', function (event) {
        if (event.key === '/' && document.activeElement !== archiveSearch && !event.metaKey && !event.ctrlKey) {
          event.preventDefault();
          archiveSearch.focus();
        }
      });
      updateArchive();
    }

    /* ---- 标签页筛选 ---- */
    const tagSearch = document.getElementById('tag-search');
    if (tagSearch) {
      const chips = Array.from(document.querySelectorAll('.tag-chip'));
      const sections = Array.from(document.querySelectorAll('.tag-section'));
      const tagCount = document.getElementById('tag-count');
      const totalTags = sections.length;
      const updateTags = function () {
        const query = tagSearch.value.trim().toLowerCase();
        let visibleTags = 0;
        chips.forEach(function (chip) {
          chip.hidden = Boolean(query) && !(chip.dataset.tagName || '').toLowerCase().includes(query);
        });
        sections.forEach(function (section) {
          const match = !query || (section.dataset.tagName || '').toLowerCase().includes(query);
          section.hidden = !match;
          if (match) visibleTags++;
        });
        if (tagCount) tagCount.textContent = query ? visibleTags + ' / ' + totalTags + ' 个标签' : totalTags + ' 个标签';
      };
      tagSearch.addEventListener('input', updateTags);
    }

    /* ---- 站内搜索页 ---- */
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      const results = document.getElementById('searchResults');
      const status = document.getElementById('search-status');
      let dataPromise = null;
      const getData = function () {
        if (!dataPromise) {
          dataPromise = fetch('/search.json')
            .then(function (response) { return response.ok ? response.json() : []; })
            .catch(function () { return []; });
        }
        return dataPromise;
      };
      const esc = function (value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
          return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
        });
      };
      const render = function () {
        const query = searchInput.value.trim().toLowerCase();
        if (!query) {
          if (status) status.textContent = '输入标题、摘要或标签开始搜索';
          if (results) results.innerHTML = '';
          return;
        }
        getData().then(function (posts) {
          const matches = posts.filter(function (post) {
            const haystack = [post.title, post.summary, (post.tags || []).join(' ')].join(' ').toLowerCase();
            return haystack.includes(query);
          }).slice(0, 20);
          if (status) status.textContent = matches.length ? '找到 ' + matches.length + ' 篇' : '没有找到匹配的文章';
          if (!results) return;
          results.innerHTML = matches.map(function (post) {
            return '<li><a class="search-result-link" href="' + esc(post.url) + '">' +
              '<article class="post-entry"><div class="entry-content-container">' +
              '<header class="entry-header"><h2>' + esc(post.title) + '</h2></header>' +
              '<div class="entry-content"><p>' + esc(post.summary) + '</p></div>' +
              '<footer class="entry-footer"><span>' + esc(post.date) + '</span>' +
              ((post.tags || []).length ? '&nbsp;·&nbsp;<span>' + (post.tags || []).map(function (tag) { return '#' + esc(tag); }).join(' ') + '</span>' : '') +
              '</footer></div></article></a></li>';
          }).join('');
        });
      };
      searchInput.addEventListener('input', render);
      const params = new URLSearchParams(window.location.search);
      if (params.get('q')) {
        searchInput.value = params.get('q');
        render();
      }
    }

    /* ---- 悬浮详情气泡（状态页图表切片 / 数据行）---- */
    const tipTargets = document.querySelectorAll('[data-tip]');
    if (tipTargets.length) {
      const tip = document.createElement('div');
      tip.className = 'chart-tip';
      document.body.append(tip);
      let tipVisible = false;

      const placeTip = function (x, y) {
        const rect = tip.getBoundingClientRect();
        let left = x + 14;
        let top = y + 16;
        if (left + rect.width > window.innerWidth - 8) left = x - rect.width - 14;
        if (top + rect.height > window.innerHeight - 8) top = y - rect.height - 16;
        tip.style.transform = 'translate(' + Math.max(8, left) + 'px,' + Math.max(8, top) + 'px)';
      };
      const hideTip = function () {
        tip.classList.remove('is-visible');
        tipVisible = false;
      };

      tipTargets.forEach(function (el) {
        el.addEventListener('pointerenter', function (event) {
          tip.textContent = el.dataset.tip || '';
          tip.classList.add('is-visible');
          tipVisible = true;
          placeTip(event.clientX, event.clientY);
        });
        el.addEventListener('pointermove', function (event) {
          if (tipVisible) placeTip(event.clientX, event.clientY);
        });
        el.addEventListener('pointerleave', hideTip);
      });
      window.addEventListener('scroll', hideTip, { passive: true });
      document.addEventListener('keydown', hideTip);
    }

    /* ---- 分享 ---- */
    document.querySelectorAll('[data-share]').forEach(function (button) {
      button.addEventListener('click', async function () {
        const url = window.location.href;
        const title = document.title;
        const type = button.dataset.share;
        if (type === 'copy') {
          try { await navigator.clipboard.writeText(url); button.textContent = '已复制'; setTimeout(function () { button.textContent = '复制链接'; }, 1400); } catch (e) {}
        } else if (type === 'native' && navigator.share) {
          try { await navigator.share({ title: title, url: url }); } catch (e) {}
        } else if (type === 'native') {
          try { await navigator.clipboard.writeText(url); button.textContent = '已复制'; setTimeout(function () { button.textContent = '分享'; }, 1400); } catch (e) {}
        } else if (type === 'qq') {
          window.open('https://connect.qq.com/widget/shareqq/index.html?url=' + encodeURIComponent(url) + '&title=' + encodeURIComponent(title), '_blank', 'noopener');
        }
      });
    });

    /* ---- 状态页：GitHub 数据（延后到页面空闲再拉，别和首屏抢带宽）---- */
    if (document.querySelector('[data-github-stars]')) {
      const loadGitHubStats = function () {
        const repo = 'Merisk0/merisk0.github.io';
        fetch('https://api.github.com/repos/' + repo).then(function (response) { return response.json(); }).then(function (data) {
          const set = function (name, value) {
            const node = document.querySelector('[data-github-' + name + ']');
            if (node) node.textContent = value;
          };
          if (typeof data.stargazers_count === 'number') set('stars', data.stargazers_count);
          if (typeof data.forks_count === 'number') set('forks', data.forks_count);
          if (typeof data.open_issues_count === 'number') set('issues', data.open_issues_count);
        }).catch(function () {});
        fetch('https://api.github.com/repos/' + repo + '/commits?per_page=1').then(function (response) {
          const link = response.headers.get('link') || '';
          const match = link.match(/[?&]page=(\d+)>; rel="last"/);
          const node = document.querySelector('[data-github-commits]');
          if (node) node.textContent = match ? match[1] : '1';
        }).catch(function () {});
        fetch('https://api.github.com/repos/' + repo + '/commits/main').then(function (response) { return response.json(); }).then(function (data) {
          const node = document.querySelector('[data-github-commit]');
          if (node && data.commit && data.commit.committer && data.commit.committer.date) {
            node.textContent = new Date(data.commit.committer.date).toLocaleDateString('zh-CN');
          }
        }).catch(function () {});
      };
      if ('requestIdleCallback' in window) window.requestIdleCallback(loadGitHubStats, { timeout: 4000 });
      else window.addEventListener('load', function () { window.setTimeout(loadGitHubStats, 1000); });
    }

    /* ---- 宽屏右侧目录：滚动时高亮当前小节 ---- */
    const sideToc = document.querySelector('[data-toc-side]');
    if (sideToc) {
      const tocLinks = [].slice.call(sideToc.querySelectorAll('a[href^="#"]'));
      const tocTargets = tocLinks.map(function (link) {
        const id = link.getAttribute('href').slice(1);
        try { return document.getElementById(decodeURIComponent(id)) || document.getElementById(id); }
        catch (error) { return document.getElementById(id); }
      });
      const markCurrent = function () {
        // 以视口 28% 处为基准线，落在它上方的最后一个小节即为当前小节
        const line = window.pageYOffset + window.innerHeight * 0.28;
        let current = -1;
        tocTargets.forEach(function (target, index) {
          if (target && target.getBoundingClientRect().top + window.pageYOffset <= line) current = index;
        });
        tocLinks.forEach(function (link, index) {
          link.classList.toggle('is-active', index === current);
        });
      };
      window.addEventListener('scroll', markCurrent, { passive: true });
      window.addEventListener('resize', markCurrent);
      markCurrent();
    }

    /* ---- 评论：滚到评论区附近才注入 giscus（giscus.app 在国内可能很慢/不通）---- */
    const giscusHost = document.querySelector('[data-giscus]');
    if (giscusHost) {
      const loadGiscus = function () {
        if (giscusHost.dataset.giscusReady) return;
        giscusHost.dataset.giscusReady = '1';
        const script = document.createElement('script');
        script.src = 'https://giscus.app/client.js';
        script.async = true;
        script.crossOrigin = 'anonymous';
        Object.keys(giscusHost.dataset).forEach(function (key) {
          if (key === 'giscus' || key === 'giscusReady') return;
          const name = key
            .slice('giscus'.length)
            .replace(/^[A-Z]/, function (char) { return char.toLowerCase(); })
            .replace(/[A-Z]/g, function (char) { return '-' + char.toLowerCase(); });
          if (name) script.setAttribute('data-' + name, giscusHost.dataset[key]);
        });
        script.setAttribute('data-theme', document.body.classList.contains('dark') ? 'dark' : 'light');
        giscusHost.append(script);
      };

      // 只判断「离视口还有多远」，不依赖 IntersectionObserver，便于测试且够用
      const maybeLoadGiscus = function () {
        if (giscusHost.dataset.giscusReady) return;
        if (giscusHost.getBoundingClientRect().top < window.innerHeight + 500) {
          window.removeEventListener('scroll', maybeLoadGiscus);
          window.removeEventListener('resize', maybeLoadGiscus);
          loadGiscus();
        }
      };
      window.addEventListener('scroll', maybeLoadGiscus, { passive: true });
      window.addEventListener('resize', maybeLoadGiscus);
      window.addEventListener('load', maybeLoadGiscus);
      maybeLoadGiscus();
    }

    /* ---- Service Worker ---- */
    if ('serviceWorker' in navigator) {
      const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname);
      if (isLocal) {
        navigator.serviceWorker.getRegistrations().then(function (registrations) {
          registrations.forEach(function (registration) { registration.unregister(); });
        });
      } else {
        window.addEventListener('load', function () {
          navigator.serviceWorker.register('/service-worker.js', { updateViaCache: 'none' }).catch(function () {});
        });
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', function () {
          if (refreshing) return;
          refreshing = true;
          window.location.reload();
        });
      }
    }
  });
})();
