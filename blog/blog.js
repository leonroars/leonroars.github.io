/* ============================================================
   BLOG — Manifest fetch, sidebar, post list, article render
   ============================================================ */

(function () {
  'use strict';

  const PAGE = document.body.querySelector('.blog-layout') ? 'list' : 'article';

  // --- Shared state ---
  let CONFIG = null;   // { projects: [...], topics: [...] }
  let POSTS = [];      // array of post entries from posts.json

  function lang() { return document.documentElement.getAttribute('data-lang') || 'ko'; }

  // Translate a slug to display name using config
  function nameOf(kind, slug) {
    if (!CONFIG) return slug;
    const list = kind === 'project' ? CONFIG.projects : CONFIG.topics;
    const item = list.find(x => x.slug === slug);
    if (!item) return slug;
    return lang() === 'ko' ? item.name_ko : item.name_en;
  }

  // Read query string
  function qs() {
    const p = new URLSearchParams(location.search);
    return {
      axis: p.get('axis'),
      project: p.get('project'),
      topic: p.get('topic'),
      slug: p.get('slug')
    };
  }

  // Build URL preserving axis/filter
  function buildUrl(params) {
    const merged = Object.assign({}, qs(), params);
    const q = new URLSearchParams();
    Object.keys(merged).forEach(k => {
      if (merged[k] != null && merged[k] !== '') q.set(k, merged[k]);
    });
    const s = q.toString();
    return 'index.html' + (s ? '?' + s : '');
  }

  // Determine current axis: explicit → derived → default(topics)
  function currentAxis() {
    const q = qs();
    if (q.axis === 'projects' || q.axis === 'topics') return q.axis;
    if (q.project) return 'projects';
    if (q.topic) return 'topics';
    return 'topics';
  }

  // ---------- Manifest loading ----------
  async function loadAll() {
    const [cfg, posts] = await Promise.all([
      fetch('config.json').then(r => r.json()),
      fetch('posts.json').then(r => r.json())
    ]);
    CONFIG = cfg;
    POSTS = posts.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }

  // ---------- Filtering ----------
  function filterPosts() {
    const q = qs();
    const axis = currentAxis();
    if (axis === 'projects') {
      if (q.project) return POSTS.filter(p => p.project === q.project);
      if (q.topic) return POSTS.filter(p => !p.project && (p.topics || []).includes(q.topic));
      return POSTS.filter(p => !!p.project);
    } else {
      if (q.topic) return POSTS.filter(p => (p.topics || []).includes(q.topic));
      return POSTS;
    }
  }

  // ---------- Sidebar ----------
  function renderSidebar() {
    const nav = document.getElementById('blog-sidebar-nav');
    if (!nav) return;
    const axis = currentAxis();
    const q = qs();

    // Axis toggle active state
    document.querySelectorAll('.blog-axis-btn').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.axis === axis);
    });

    nav.innerHTML = '';

    if (axis === 'projects') {
      // All Project Posts virtual
      const allCount = POSTS.filter(p => !!p.project).length;
      nav.appendChild(sidebarLink({
        href: buildUrl({ axis: 'projects', project: null, topic: null }),
        labelKo: '모든 프로젝트 글', labelEn: 'All Project Posts',
        count: allCount,
        active: !q.project && !q.topic
      }));

      // PROJECTS group
      const projGroup = sidebarGroup('PROJECTS', 'PROJECTS');
      CONFIG.projects.forEach(proj => {
        const count = POSTS.filter(p => p.project === proj.slug).length;
        projGroup.appendChild(sidebarLink({
          href: buildUrl({ axis: 'projects', project: proj.slug, topic: null }),
          labelKo: proj.name_ko, labelEn: proj.name_en,
          count: count,
          active: q.project === proj.slug
        }));
      });
      nav.appendChild(projGroup);

      // NOT TIED TO A PROJECT group — auto from non-project posts
      const orphanPosts = POSTS.filter(p => !p.project);
      const orphanTopics = new Set();
      orphanPosts.forEach(p => (p.topics || []).forEach(t => orphanTopics.add(t)));

      if (orphanTopics.size > 0) {
        const orphanGroup = sidebarGroup('프로젝트 외 아티클', 'Not Tied to a Project');
        CONFIG.topics
          .filter(t => orphanTopics.has(t.slug))
          .forEach(t => {
            const count = orphanPosts.filter(p => (p.topics || []).includes(t.slug)).length;
            orphanGroup.appendChild(sidebarLink({
              href: buildUrl({ axis: 'projects', project: null, topic: t.slug }),
              labelKo: t.name_ko, labelEn: t.name_en,
              count: count,
              active: q.topic === t.slug
            }));
          });
        nav.appendChild(orphanGroup);
      }
    } else {
      // TOPICS axis
      nav.appendChild(sidebarLink({
        href: buildUrl({ axis: 'topics', project: null, topic: null }),
        labelKo: '모든 글', labelEn: 'All Posts',
        count: POSTS.length,
        active: !q.topic
      }));

      const topicGroup = sidebarGroup('TOPICS', 'TOPICS');
      CONFIG.topics.forEach(t => {
        const count = POSTS.filter(p => (p.topics || []).includes(t.slug)).length;
        topicGroup.appendChild(sidebarLink({
          href: buildUrl({ axis: 'topics', project: null, topic: t.slug }),
          labelKo: t.name_ko, labelEn: t.name_en,
          count: count,
          active: q.topic === t.slug
        }));
      });
      nav.appendChild(topicGroup);
    }
  }

  function sidebarGroup(labelKo, labelEn) {
    const wrap = document.createElement('div');
    wrap.className = 'blog-sidebar-group';
    const label = document.createElement('p');
    label.className = 'blog-sidebar-group-label';
    label.innerHTML =
      '<span class="lang-ko">' + escapeHtml(labelKo) + '</span>' +
      '<span class="lang-en">' + escapeHtml(labelEn) + '</span>';
    wrap.appendChild(label);
    return wrap;
  }

  function sidebarLink({ href, labelKo, labelEn, count, active }) {
    const a = document.createElement('a');
    a.href = href;
    a.className = 'blog-sidebar-link' + (active ? ' is-active' : '');
    a.innerHTML =
      '<span>' +
      '<span class="lang-ko">' + escapeHtml(labelKo) + '</span>' +
      '<span class="lang-en">' + escapeHtml(labelEn) + '</span>' +
      '</span>' +
      '<span class="blog-sidebar-count">' + count + '</span>';
    return a;
  }

  // ---------- Header ----------
  function renderHeader() {
    const titleEl = document.getElementById('blog-view-title');
    const subEl = document.getElementById('blog-view-subtitle');
    if (!titleEl || !subEl) return;
    const axis = currentAxis();
    const q = qs();

    let titleKo, titleEn, subKo, subEn;

    if (q.project) {
      titleKo = nameOf('project', q.project);
      titleEn = CONFIG.projects.find(x => x.slug === q.project)?.name_en || q.project;
      subKo = '"' + titleKo + '" 프로젝트 관련 아티클';
      subEn = 'Articles related to ' + titleEn;
    } else if (q.topic) {
      const t = CONFIG.topics.find(x => x.slug === q.topic);
      titleKo = t ? t.name_ko : q.topic;
      titleEn = t ? t.name_en : q.topic;
      subKo = '"' + titleKo + '" 주제 글';
      subEn = 'Posts in ' + titleEn;
    } else if (axis === 'projects') {
      titleKo = '모든 프로젝트 글';
      titleEn = 'All Project Posts';
      subKo = '진행한 프로젝트와 관련된 모든 글';
      subEn = 'All articles tied to a project';
    } else {
      titleKo = '아티클';
      titleEn = 'Articles';
      subKo = '엔지니어링·학습·회고';
      subEn = 'Engineering, learning, and retrospectives';
    }

    titleEl.innerHTML =
      '<span class="lang-ko">' + escapeHtml(titleKo) + '</span>' +
      '<span class="lang-en">' + escapeHtml(titleEn) + '</span>';
    subEl.innerHTML =
      '<span class="lang-ko">' + escapeHtml(subKo) + '</span>' +
      '<span class="lang-en">' + escapeHtml(subEn) + '</span>';
  }

  // ---------- Post list ----------
  function renderPostList() {
    const list = document.getElementById('blog-post-list');
    const empty = document.getElementById('blog-empty');
    if (!list) return;

    const filtered = filterPosts();
    list.innerHTML = '';

    if (filtered.length === 0) {
      empty.hidden = false;
      return;
    }
    empty.hidden = true;

    filtered.forEach(p => {
      list.appendChild(postCard(p));
    });
  }

  function postCard(p) {
    const a = document.createElement('a');
    a.className = 'blog-post-card';
    a.href = 'article.html?slug=' + encodeURIComponent(p.slug);

    const chips = document.createElement('div');
    chips.className = 'blog-post-chips';
    if (p.project) {
      const c = document.createElement('span');
      c.className = 'blog-chip blog-chip-project';
      c.textContent = nameOf('project', p.project);
      chips.appendChild(c);
    }
    (p.topics || []).forEach(t => {
      const c = document.createElement('span');
      c.className = 'blog-chip blog-chip-topic';
      c.textContent = nameOf('topic', t);
      chips.appendChild(c);
    });
    a.appendChild(chips);

    const title = document.createElement('h2');
    title.className = 'blog-post-title';
    title.innerHTML =
      '<span class="lang-ko">' + escapeHtml(p.title_ko || p.title_en || p.slug) + '</span>' +
      '<span class="lang-en">' + escapeHtml(p.title_en || p.title_ko || p.slug) + '</span>';
    a.appendChild(title);

    if (p.summary_ko || p.summary_en) {
      const sum = document.createElement('p');
      sum.className = 'blog-post-summary';
      sum.innerHTML =
        '<span class="lang-ko">' + escapeHtml(p.summary_ko || p.summary_en || '') + '</span>' +
        '<span class="lang-en">' + escapeHtml(p.summary_en || p.summary_ko || '') + '</span>';
      a.appendChild(sum);
    }

    if (p.date) {
      const d = document.createElement('p');
      d.className = 'blog-post-date';
      d.textContent = p.date;
      a.appendChild(d);
    }

    return a;
  }

  // ---------- Axis toggle handler (list page) ----------
  function bindAxisToggle() {
    document.querySelectorAll('.blog-axis-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const axis = btn.dataset.axis;
        location.href = buildUrl({ axis: axis, project: null, topic: null });
      });
    });
  }

  // ---------- Article page ----------
  async function renderArticle() {
    const q = qs();
    if (!q.slug) {
      showNotFound();
      return;
    }
    const post = POSTS.find(p => p.slug === q.slug);
    if (!post) {
      showNotFound();
      return;
    }

    const curLang = lang();
    const altLang = curLang === 'ko' ? 'en' : 'ko';
    let usedLang = curLang;
    let md = await fetchMarkdown(post.slug, curLang);
    let fellBack = false;
    if (md == null) {
      md = await fetchMarkdown(post.slug, altLang);
      if (md == null) {
        showNotFound();
        return;
      }
      usedLang = altLang;
      fellBack = true;
    }

    // Title
    const titleEl = document.getElementById('article-title');
    titleEl.innerHTML =
      '<span class="lang-ko">' + escapeHtml(post.title_ko || post.title_en || post.slug) + '</span>' +
      '<span class="lang-en">' + escapeHtml(post.title_en || post.title_ko || post.slug) + '</span>';

    // Meta (date)
    const metaEl = document.getElementById('article-meta');
    metaEl.textContent = post.date || '';

    // Chips
    const chipsEl = document.getElementById('article-chips');
    chipsEl.innerHTML = '';
    if (post.project) {
      const c = document.createElement('a');
      c.className = 'blog-chip blog-chip-project';
      c.href = 'index.html?axis=projects&project=' + encodeURIComponent(post.project);
      c.textContent = nameOf('project', post.project);
      chipsEl.appendChild(c);
    }
    (post.topics || []).forEach(t => {
      const c = document.createElement('a');
      c.className = 'blog-chip blog-chip-topic';
      c.href = 'index.html?axis=topics&topic=' + encodeURIComponent(t);
      c.textContent = nameOf('topic', t);
      chipsEl.appendChild(c);
    });

    // Body
    if (typeof marked !== 'undefined') {
      marked.setOptions({
        breaks: false,
        gfm: true,
        highlight: function (code, lang) {
          if (typeof hljs === 'undefined') return code;
          if (lang && hljs.getLanguage(lang)) {
            try { return hljs.highlight(code, { language: lang }).value; } catch (e) { }
          }
          try { return hljs.highlightAuto(code).value; } catch (e) { }
          return code;
        }
      });
    }
    const body = document.getElementById('article-body');
    body.innerHTML = (typeof marked !== 'undefined') ? marked.parse(md) : '<pre>' + escapeHtml(md) + '</pre>';

    // Document title
    const docTitle = (curLang === 'ko' ? (post.title_ko || post.title_en) : (post.title_en || post.title_ko)) || post.slug;
    document.title = docTitle + ' — ' + (curLang === 'ko' ? '채호연' : 'HoYeon Chae');

    // Fallback note
    if (fellBack) {
      const note = document.getElementById('article-fallback-note');
      note.hidden = false;
      note.innerHTML = curLang === 'ko'
        ? '이 글은 영문으로만 작성되어 있어 영문 버전을 표시합니다.'
        : 'This article is only available in Korean and is shown in Korean.';
    }
  }

  async function fetchMarkdown(slug, langCode) {
    try {
      const res = await fetch('posts/' + slug + '.' + langCode + '.md');
      if (!res.ok) return null;
      return await res.text();
    } catch (e) {
      return null;
    }
  }

  function showNotFound() {
    const root = document.getElementById('article-root');
    const nf = document.getElementById('article-not-found');
    if (root) root.hidden = true;
    if (nf) nf.hidden = false;
  }

  // ---------- Utils ----------
  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ---------- Init ----------
  async function init() {
    try {
      await loadAll();
    } catch (e) {
      console.error('Failed to load blog config/posts', e);
      return;
    }

    if (PAGE === 'list') {
      bindAxisToggle();
      renderSidebar();
      renderHeader();
      renderPostList();

      // Re-render on language toggle (for chip names, sidebar names, etc.)
      const langBtn = document.getElementById('lang-toggle');
      if (langBtn) {
        langBtn.addEventListener('click', () => {
          // Defer to allow script.js handler to swap data-lang
          setTimeout(() => { renderSidebar(); renderHeader(); }, 0);
        });
      }
    } else {
      renderArticle();
      const langBtn = document.getElementById('lang-toggle');
      if (langBtn) {
        langBtn.addEventListener('click', () => {
          setTimeout(() => renderArticle(), 0);
        });
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
