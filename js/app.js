/* ==========================================================================
   个人所得税 APP 前端演示 — app.js
   负责：数据渲染 / 页面路由 / 交互事件 / 提示条
   依赖：data.js（window.MOCK、window.TaxUtil）
   ========================================================================== */
(function () {
  'use strict';

  var M = window.MOCK;
  var U = window.TaxUtil;
  var fmt = U.fmt;

  /* ======================= 0. 小工具 ======================= */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }
  /* 生成一个 SVG 图标 */
  function ic(id, cls) {
    return '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24"><use href="#' + id + '"/></svg>';
  }
  var CHEV = '<svg class="ic chev" viewBox="0 0 24 24"><use href="#ic-arrow"/></svg>';
  function pad2(n) { return n < 10 ? '0' + n : '' + n; }

  var screen = $('#screen');
  var viewport = $('#viewport');
  var tabbar = $('#tabbar');
  // 已去除手机外壳，状态栏元素不再存在（保留空值兜底）
  var statusbar = $('#statusbar');

  /* 登录态：false = 未登录（截图 01/02），true = 已登录（截图 04） */
  var logged = false;

  /* ======================= 1. Toast ======================= */
  var toastTimer = null;
  function toast(msg) {
    var el = $('#toast');
    el.textContent = msg;
    el.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-show'); }, 1900);
  }

  /* ======================= 2. 状态栏时钟 ======================= */
  function tickClock() {
    var el = $('#clock');
    if (!el) return;
    var d = new Date();
    el.textContent = d.getHours() + ':' + pad2(d.getMinutes());
  }

  /* ======================= 3. 页面路由 ======================= */
  var current = null;   // 当前页面 id
  var stack = [];       // 返回栈

  function pageEl(id) {
    return document.querySelector('.page[data-page="' + id + '"]');
  }

  /* 页面进入时的钩子 */
  var hooks = {
    'annual-2': function () {
      // 每次进入都重置「同意声明」
      $('#agreeChk').classList.remove('is-checked');
      $('#btnAnnual2').disabled = true;
    },
    'annual-6': function () {
      $('#refundAmount').textContent = M.annual.refund + ' 元';
      $('#refundForm').classList.remove('is-hidden');
      $('#refundResult').classList.add('is-hidden');
      $('#refundFooter').classList.remove('is-hidden');
      $('#refundFooter2').classList.add('is-hidden');
    },
    'annual-3': renderAnnualBase,
    'annual-4': renderAnnualTax,
    'annual-5': renderAnnualDone
  };

  /**
   * 页面跳转
   * @param {string} id      目标页面 data-page 值
   * @param {object} [opt]   { back:true 反向动画, noPush:true 不入栈 }
   */
  function go(id, opt) {
    opt = opt || {};
    var page = pageEl(id);
    if (!page) { toast('演示版暂无该页面'); return; }

    if (!opt.noPush && current && current !== id) stack.push(current);
    current = id;
    // 落到主 Tab 页 = 回到根，清空返回栈
    if (page.hasAttribute('data-tab')) stack = [];

    $$('.page').forEach(function (p) { p.classList.remove('is-active', 'is-back'); });
    page.classList.add('is-active');
    if (opt.back) page.classList.add('is-back');

    // 底部 Tab 显隐
    var tab = page.getAttribute('data-tab');
    if (tab) {
      tabbar.classList.add('is-visible');
      $$('.tabbar__item').forEach(function (b) {
        b.classList.toggle('is-active', b.getAttribute('data-tabgo') === tab);
      });
    } else {
      tabbar.classList.remove('is-visible');
    }

    // 状态栏文字明暗（无外壳时该元素不存在）
    if (statusbar) statusbar.classList.toggle('statusbar--light', page.hasAttribute('data-immersive'));

    viewport.scrollTop = 0;
    if (hooks[id]) hooks[id]();

    // 同步地址栏 hash，方便直接链接某一页（如 index.html#home）
    try { history.replaceState(null, '', '#' + id); } catch (err) { /* file:// 下忽略 */ }
  }

  function back() {
    if (!stack.length) { go('home'); return; }
    var prev = stack.pop();
    go(prev, { back: true, noPush: true });
  }

  /* ======================= 4. 渲染：首页（截图 02 / 04 双状态） ======================= */
  function topicArt() {
    return '<svg viewBox="0 0 120 84">' +
      '<rect x="14" y="26" width="58" height="44" rx="6" fill="#2e6fd8"/>' +
      '<rect x="22" y="16" width="58" height="44" rx="6" fill="#4d8df0"/>' +
      '<rect x="30" y="25" width="26" height="5" rx="2.5" fill="#bcd7fb"/>' +
      '<rect x="30" y="35" width="42" height="4" rx="2" fill="#8fbaf6"/>' +
      '<rect x="30" y="43" width="42" height="4" rx="2" fill="#8fbaf6"/>' +
      '<rect x="30" y="51" width="30" height="4" rx="2" fill="#8fbaf6"/>' +
      '<circle cx="96" cy="22" r="12" fill="#ffb64d"/>' +
      '<path d="M96 15v14M89 22h14" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>' +
      '<rect x="84" y="46" width="26" height="24" rx="5" fill="#79b0f5"/>' +
      '<path d="M90 58h14M90 63h9" stroke="#dbe9ff" stroke-width="2.6" stroke-linecap="round"/>' +
      '</svg>';
  }

  function bannerArt(k) {
    if (k === 'user') {
      return '<svg viewBox="0 0 96 72">' +
        '<rect x="10" y="18" width="76" height="42" rx="8" fill="#fff" fill-opacity=".92"/>' +
        '<rect x="18" y="26" width="30" height="5" rx="2.5" fill="#f0821e"/>' +
        '<rect x="18" y="37" width="46" height="4" rx="2" fill="#e3c9a4"/>' +
        '<rect x="18" y="45" width="38" height="4" rx="2" fill="#e3c9a4"/>' +
        '<circle cx="76" cy="32" r="10" fill="#f0821e"/>' +
        '<path d="M72 32l3 3 5-6" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
        '</svg>';
    }
    return '<svg viewBox="0 0 96 72">' +
      '<rect x="12" y="20" width="72" height="40" rx="8" fill="#fff" fill-opacity=".9"/>' +
      '<rect x="20" y="28" width="34" height="5" rx="2.5" fill="#2b6de8"/>' +
      '<rect x="20" y="38" width="48" height="4" rx="2" fill="#c9d6ea"/>' +
      '<rect x="20" y="46" width="40" height="4" rx="2" fill="#c9d6ea"/>' +
      '<circle cx="74" cy="34" r="10" fill="#4d8df0"/>' +
      '<path d="M70 34l3 3 5-6" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>';
  }

  function renderHome() {
    var k = logged ? 'user' : 'guest';

    /* 4.0 公告序号 + 文案 */
    $('#hnoticeNum').textContent = M.homeNoticeCount[k];

    /* 4.1 年度汇算专题卡 */
    var tp = M.homeTopic[k];
    $('#homeTopic').innerHTML =
      '<div class="topic-card">' +
      '<button class="topic-card__more" data-go="annual-1">进入专题页 ' + ic('ic-arrow') + '</button>' +
      '<h3>' + tp.title + '</h3><p>' + tp.desc + '</p>' +
      '<button class="topic-card__btn" ' +
      (tp.route ? 'data-go="' + tp.route + '"' : 'data-toast="申报记录（演示）"') + '>' + tp.btn + '</button>' +
      '<div class="topic-card__art" aria-hidden="true">' + topicArt() + '</div>' +
      '</div>';

    /* 4.2 专项附加扣除推荐卡 */
    var f = M.homeFocus[k];
    var btns = f.btns.map(function (b) {
      return '<button class="fbtn ' + b.cls + '" ' +
        (b.route ? 'data-go="' + b.route + '"' : 'data-toast="按标准查询（演示）"') + '>' + b.label + '</button>';
    }).join('');
    $('#homeFocus').innerHTML =
      '<div class="focus-card">' +
      '<div class="focus-card__head">' +
      '<span class="focus-card__logo">' + ic('ic-target') + '</span>' +
      '<strong>专项附加扣除</strong>' +
      '<button class="focus-card__policy" data-toast="相关政策（演示）">相关政策 ' + ic('ic-arrow') + '</button>' +
      '</div>' +
      '<p class="focus-card__desc">' + f.desc + '</p>' +
      (f.chip
        ? '<div class="focus-card__chip"><i class="av">家</i><i class="av">人</i><span>' + f.chip + '</span></div>'
        : '') +
      '<div class="focus-card__btns">' + btns + '</div>' +
      '</div>';

    /* 4.3 金刚区（带角标按钮） */
    $('#hgrid').innerHTML = M.homeGrid.map(function (e) {
      var act = e.route
        ? 'data-go="' + e.route + '"'
        : (e.tab ? 'data-tabgo="' + e.tab + '"' : 'data-toast="' + e.label + '（演示版占位页面）"');
      return '<button class="hentry hentry--' + e.tint.slice(2) + '" ' + act + '>' +
        '<span class="hentry__icon">' + ic(e.icon) + '</span>' +
        '<span class="hentry__label">' + e.label + '</span>' +
        '<span class="hentry__tag">' + e.tag + '</span>' +
        '</button>';
    }).join('');

    /* 4.4 横幅 */
    var b = M.homeBanner[k];
    $('#homeBanner').innerHTML =
      '<div class="biz-banner ' + b.mod + '" data-toast="' + b.title + '（演示）">' +
      '<div class="biz-banner__body"><strong>' + b.title + '</strong><span>' + b.sub + '</span>' +
      '<button data-toast="查看详情（演示）">' + b.btn + '</button></div>' +
      '<div class="biz-banner__art" aria-hidden="true">' + bannerArt(k) + '</div>' +
      '</div>';

    /* 4.5 资讯 Tab + 列表 */
    $('#newsTabs').innerHTML = M.newsTabs.map(function (t, i) {
      return '<button class="newstabs__item' + (i === 0 ? ' is-active' : '') +
        '" data-news="' + t + '">' + t + '</button>';
    }).join('');
    renderNews(M.newsTabs[0]);
  }

  function renderNews(tab) {
    var items = M.newsData[tab] || [];
    $('#newsList').innerHTML = items.map(function (n) {
      return '<div class="news-item" data-toast="' + n.title + '（演示）">' +
        '<div class="news-item__body"><strong>' + n.title + '</strong>' +
        '<span>' + n.date + '</span></div>' +
        '<div class="news-item__thumb"><svg viewBox="0 0 64 48">' +
        '<rect width="64" height="48" fill="#e3eeff"/>' +
        '<rect x="12" y="12" width="28" height="4" rx="2" fill="#8fbaf6"/>' +
        '<rect x="12" y="21" width="40" height="3.5" rx="1.75" fill="#b7d3f8"/>' +
        '<rect x="12" y="28" width="34" height="3.5" rx="1.75" fill="#b7d3f8"/>' +
        '<circle cx="50" cy="15" r="6" fill="#ff9a4d"/>' +
        '</svg></div></div>';
    }).join('');
  }

  /* 公告轮播（随登录态切换文案源） */
  var noticeIdx = 0;
  function initNotice() {
    var el = $('#hnoticeText');
    el.textContent = M.homeNotices[logged ? 'user' : 'guest'][0];
    setInterval(function () {
      var list = M.homeNotices[logged ? 'user' : 'guest'];
      el.classList.add('is-out');
      setTimeout(function () {
        noticeIdx = (noticeIdx + 1) % list.length;
        el.textContent = list[noticeIdx];
        el.classList.remove('is-out');
      }, 360);
    }, 4200);
  }

  /* ======================= 5. 渲染：办税 ======================= */
  function renderTax() {
    $('#taxGroups').innerHTML = M.taxGroups.map(function (g) {
      return '<div class="group-title">' + g.title + '</div>' +
        '<div class="group-card">' +
        g.items.map(function (it) {
          var act = it.route
            ? 'data-go="' + it.route + '"'
            : 'data-toast="' + it.label + '（演示版占位页面）"';
          return '<div class="taxcell" ' + act + '>' +
            '<span class="taxcell__icon ' + it.tint + '">' + ic(it.icon) + '</span>' +
            '<div class="taxcell__label">' + it.label +
            (it.desc ? '<div class="taxcell__sub">' + it.desc + '</div>' : '') +
            '</div>' + CHEV + '</div>';
        }).join('') +
        '</div>';
    }).join('');
  }

  /* ======================= 6. 渲染：我的（截图 01 未登录 / 3.5 已登录） ======================= */
  /* 卡通头像（已登录态） */
  var AVATAR_SVG =
    '<svg viewBox="0 0 96 96" aria-hidden="true">' +
    '<rect width="96" height="96" fill="#dcebfd"/>' +
    '<path d="M22 96c2-16 13-22 26-22s24 6 26 22z" fill="#4d8df0"/>' +
    '<path d="M24 46c0-17 11-28 24-28s24 11 24 28v8H24z" fill="#3d3a52"/>' +
    '<ellipse cx="48" cy="50" rx="17.5" ry="19.5" fill="#ffd9bd"/>' +
    '<path d="M30.5 46c1-13 8.5-19 17.5-19s16.5 6 17.5 19c-6-5.5-10.5-7.5-17.5-7.5s-11.5 2-17.5 7.5z" fill="#4a4660"/>' +
    '<circle cx="41.5" cy="52" r="2.1" fill="#3d3a52"/>' +
    '<circle cx="54.5" cy="52" r="2.1" fill="#3d3a52"/>' +
    '<path d="M44 60q4 3.2 8 0" stroke="#d98d66" stroke-width="1.9" fill="none" stroke-linecap="round"/>' +
    '</svg>';

  function renderMine() {
    var el = $('#mineBody');

    if (!logged) {
      el.innerHTML =
        '<div class="mg">' +
          '<div class="mg-hero">' +
            '<div class="mg-avatar">' + ic('ic-user') + '</div>' +
            '<button class="mg-login" data-go="login">注册 / 登录</button>' +
          '</div>' +
          '<div class="mg-panel">' +
            '<div class="mine-cards">' +
              M.mineGuestCards.map(function (c) {
                return '<button class="mcard" data-go="login">' +
                  '<span class="mcard__icon ' + c.tint + '">' + ic(c.icon) + '</span>' +
                  '<span>' + c.label + '</span></button>';
              }).join('') +
            '</div>' +
            '<div class="mine-list">' +
              M.mineGuestList.map(function (it) {
                return '<button class="mcell" data-go="login">' + ic(it.icon) +
                  '<span>' + it.label + '</span>' + CHEV + '</button>';
              }).join('') +
            '</div>' +
          '</div>' +
        '</div>';
      return;
    }

    /* 已登录态（对齐截图 3.5） */
    el.innerHTML =
      '<div class="mg">' +
        '<div class="mg-hero mg-hero--user">' +
          '<div class="mg-avatar mg-avatar--user">' + AVATAR_SVG + '</div>' +
          '<div class="mg-idcard">' +
            '<div class="mg-idcard__info">' +
              '<strong>' + M.mineUser.name + '</strong>' +
              '<span>纳税人识别号 ' + M.mineUser.taxNo + '</span>' +
            '</div>' +
            '<button class="mg-idcard__btn" data-toast="个人信息（演示）">个人信息 ' + CHEV + '</button>' +
          '</div>' +
        '</div>' +
        '<div class="mg-panel">' +
          '<div class="mine-cards">' +
            M.mineUserCards.map(function (c) {
              return '<button class="mcard" data-toast="' + c.label + '（演示版占位页面）">' +
                '<span class="mcard__icon ' + c.tint + '">' + ic(c.icon) + '</span>' +
                '<span>' + c.label + '</span>' +
                '<i class="mcard__badge">' + c.badge + '</i></button>';
            }).join('') +
          '</div>' +
          '<div class="mine-list">' +
            M.mineUserList.map(function (it) {
              return '<button class="mcell" data-toast="' + it.label + '（演示版占位页面）">' + ic(it.icon) +
                '<span>' + it.label + '</span>' + CHEV + '</button>';
            }).join('') +
          '</div>' +
          '<button class="mg-logout" id="btnLogout">退出登录</button>' +
        '</div>' +
      '</div>';
  }

  /* ======================= 6.5 渲染：待办 / 消息中心 ======================= */
  function renderTodo() {
    $('#todoList').innerHTML = M.todoList.map(function (r) {
      var warn = r.type === 'warn';
      return '<div class="msgcard" data-toast="' + r.title + '（演示）">' +
        '<span class="msgcard__icon msgcard__icon--' + (warn ? 'info' : 'ok') + '">' +
        ic(warn ? 'ic-bell' : 'ic-doc') + '</span>' +
        '<div class="msgcard__body"><strong>' + r.title + '</strong><p>' + r.desc + '</p></div>' +
        '<span class="msgcard__time">' + r.time + '</span>' +
        '</div>';
    }).join('');
  }

  function renderMessages() {
    $('#msgList').innerHTML = M.messages.map(function (m) {
      return '<div class="msgcard" data-toast="' + m.title + '（演示）">' +
        '<span class="msgcard__icon msgcard__icon--' + m.type + '">' + ic(m.type === 'ok' ? 'ic-check' : 'ic-bell') + '</span>' +
        '<div class="msgcard__body"><strong>' + m.title + '</strong><p>' + m.desc + '</p></div>' +
        '<span class="msgcard__time">' + m.time + '</span>' +
        '</div>';
    }).join('');
  }

  /* ======================= 7. 渲染：年度汇算 ======================= */
  function kvRow(item) {
    var cls = '';
    if (item.total) cls = 'num-em';
    if (item.refund) cls = 'num-refund';
    return '<div class="kv"><span>' + item.label + '</span>' +
      '<b class="' + cls + '">' + item.value + '</b></div>';
  }

  function renderAnnualBase() {
    $('#incomeSection').innerHTML = M.annual.incomeItems.map(kvRow).join('');
    $('#deductSection').innerHTML = M.annual.deductItems.map(kvRow).join('');
    $('#annualBase').textContent = M.annual.base;
  }

  function renderAnnualTax() {
    $('#taxDetail').innerHTML = M.annual.taxItems.map(kvRow).join('');
    $('#refundBig').textContent = M.annual.refund;
  }

  function renderAnnualDone() {
    $('#doneRefund').textContent = M.annual.refund + ' 元';
  }

  /* ======================= 8. 收入纳税明细（查询条件 → 列表） ======================= */
  var incomeState = {
    year: '2026',
    types: {}
  };
  M.incomeTypes.forEach(function (t) { incomeState.types[t] = true; });

  /* 8.1 查询条件页：所得类型勾选列表 */
  function renderTypeList() {
    $('#typeList').innerHTML = M.incomeTypes.map(function (t) {
      return '<button class="qcheck' + (incomeState.types[t] ? ' is-on' : '') +
        '" data-type="' + t + '"><i></i>' + t + '</button>';
    }).join('');
    $('#qYear').textContent = incomeState.year;
  }

  /* 8.2 年度选择 · 滚轮弹层（对齐截图 09） */
  var ROW_H = 44, WHEEL_H = 220;
  var yearIdx = 0;

  function moveWheel(anim) {
    var list = $('#yearOptions');
    list.style.transition = anim ? '' : 'none';
    list.style.transform = 'translateY(' + (WHEEL_H / 2 - ROW_H / 2 - yearIdx * ROW_H) + 'px)';
  }

  function renderYearWheel() {
    $('#yearOptions').innerHTML = M.incomeYears.map(function (y) {
      return '<li class="wheel__item' + (y === incomeState.year ? ' is-on' : '') +
        '" data-y="' + y + '">' + y + '</li>';
    }).join('');
    moveWheel(false);
  }

  function setYearIdx(i) {
    yearIdx = Math.max(0, Math.min(M.incomeYears.length - 1, i));
    incomeState.year = M.incomeYears[yearIdx];
    $$('#yearOptions .wheel__item').forEach(function (li, k) {
      li.classList.toggle('is-on', k === yearIdx);
    });
    $('#qYear').textContent = incomeState.year;
    moveWheel(true);
  }

  function openYearSheet() {
    yearIdx = Math.max(0, M.incomeYears.indexOf(incomeState.year));
    renderYearWheel();
    $('#yearSheet').classList.add('is-show');
  }
  function closeYearSheet() {
    $('#yearSheet').classList.remove('is-show');
  }

  /* 8.3 按年度 + 已勾选类型过滤渲染列表 */
  function filteredRecords(year) {
    var all = M.records[year] || [];
    var out = [];
    all.forEach(function (r, i) {
      if (incomeState.types[r.type]) out.push({ r: r, i: i });
    });
    return out;
  }

  function renderIncome() {
    var year = incomeState.year;
    var list = filteredRecords(year);

    var inc = 0, tax = 0;
    list.forEach(function (it) { inc += it.r.income; tax += it.r.tax; });
    $('#sumIncome').textContent = fmt(Math.round(inc * 100) / 100) + '元';
    $('#sumTax').textContent = fmt(Math.round(tax * 100) / 100) + '元';

    var wrap = $('#incomeList');
    wrap.scrollTop = 0;  /* 重新查询时列表回到顶部 */
    if (!list.length) {
      wrap.innerHTML = '<div class="empty">' + ic('ic-doc') + '<p>该年度暂无申报记录</p></div>';
      return;
    }

    wrap.innerHTML = list.map(function (it) {
      var r = it.r;
      return '<div class="rec" data-year="' + year + '" data-idx="' + it.i + '">' +
        '<div class="rec__head">' +
        '<span class="rec__type">' + r.type + '</span>' +
        '<span class="rec__date">' + r.period + '</span></div>' +
        '<div class="rec__line"><span>所得项目小类：' + r.sub + '</span></div>' +
        '<div class="rec__line"><span>扣缴义务人：' + r.org + '</span>' + CHEV + '</div>' +
        '<div class="rec__line"><span>收入：' + fmt(r.income) + '元</span></div>' +
        '<div class="rec__line"><span>已申报税额：' + fmt(r.tax) + '元</span></div>' +
        '</div>';
    }).join('');
  }

  /* 8.4 点「查询」进入列表页 */
  function doQuery() {
    var any = M.incomeTypes.some(function (t) { return incomeState.types[t]; });
    if (!any) { toast('请至少选择一种所得类型'); return; }
    renderIncome();
    go('income');
  }

  /* 打开某一笔明细 */
  var DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  function openIncomeDetail(el) {
    var year = el.getAttribute('data-year');
    var idx = Number(el.getAttribute('data-idx'));
    var r = (M.records[year] || [])[idx];
    if (!r) return;

    var mm = Number(r.period.slice(5, 7));

    $('#dIncome').textContent = fmt(r.income) + '元';
    $('#dTax').textContent = fmt(r.tax) + '元';

    $('#detailKv').innerHTML = [
      ['所得项目', r.type],
      ['所得项目小类', r.sub],
      ['税款所属期', r.period + '-01 至 ' + r.period + '-' + DAYS[mm - 1]],
      ['申报日期', declareDate(r.period)],
      ['申报状态', '申报成功']
    ].map(function (row) {
      return '<div class="kv2"><span>' + row[0] + '</span><b>' + row[1] + '</b></div>';
    }).join('');

    $('#detailOrg').innerHTML = [
      ['扣缴义务人名称', r.org],
      ['统一社会信用代码', M.orgCodes[r.org] || '—']
    ].map(function (row) {
      return '<div class="kv2"><span>' + row[0] + '</span><b>' + row[1] + '</b></div>';
    }).join('');

    go('income-detail');
  }

  /* 申报日期：次月 15 日（次年 1 月则顺延一年） */
  function declareDate(period) {
    var y = Number(period.slice(0, 4));
    var m = Number(period.slice(5, 7)) + 1;
    if (m > 12) { m = 1; y += 1; }
    return y + '-' + pad2(m) + '-15';
  }

  /* ======================= 9. 渲染：专项附加扣除 ======================= */
  function renderDeduct() {
    var total = M.deductions.reduce(function (s, d) { return s + d.amount; }, 0);
    var monthly = M.deductions.reduce(function (s, d) {
      var n = parseFloat(String(d.unit).replace(/[^\d.]/g, ''));
      return s + (isNaN(n) ? 0 : n);
    }, 0);

    $('#deductTotal').textContent = fmt(total);
    $('#deductNote').textContent =
      '共 ' + M.deductions.length + ' 项，月度合计 ' + monthly.toLocaleString('en-US') +
      ' 元，均已在每月预扣环节享受，本年度无汇算补充扣除项。';

    $('#deductList').innerHTML = M.deductions.map(function (d) {
      var has = d.amount > 0;
      var badgeCls = d.status === '汇算填报' ? '' : (has ? '' : 'is-empty');
      return '<div class="deduct-item" data-toast="' + d.label + ' · ' + d.status + '（演示版占位）">' +
        '<span class="deduct-item__icon ' + d.tint + '">' + ic(d.icon) + '</span>' +
        '<div class="deduct-item__body"><strong>' + d.label + '</strong>' +
        '<span>' + d.sub + ' · ' + d.unit + '</span></div>' +
        '<div class="deduct-item__right">' +
        '<b>' + fmt(d.amount) + '</b>' +
        '<em class="' + badgeCls + '">' + d.status + '</em>' +
        '</div></div>';
    }).join('');
  }

  /* ======================= 10. 事件绑定（统一委托） ======================= */
  screen.addEventListener('click', function (e) {
    var el;

    /* --- 先处理带状态的交互控件 --- */
    if ((el = e.target.closest('.radio-card'))) {
      $$('.radio-card').forEach(function (c) { c.classList.remove('is-active'); });
      el.classList.add('is-active');
      return;
    }
    if ((el = e.target.closest('.pick-card'))) {
      $$('.pick-card').forEach(function (c) { c.classList.remove('is-active'); });
      el.classList.add('is-active');
      return;
    }
    if ((el = e.target.closest('.newstabs__item'))) {
      $$('.newstabs__item').forEach(function (b) { b.classList.remove('is-active'); });
      el.classList.add('is-active');
      renderNews(el.getAttribute('data-news'));
      return;
    }
    if ((el = e.target.closest('.qcheck'))) {
      var t = el.getAttribute('data-type');
      incomeState.types[t] = !incomeState.types[t];
      el.classList.toggle('is-on', incomeState.types[t]);
      return;
    }
    if ((el = e.target.closest('#yearPick'))) { openYearSheet(); return; }
    if ((el = e.target.closest('.wheel__item'))) {
      var items = $$('#yearOptions .wheel__item');
      setYearIdx(items.indexOf(el));
      return;
    }
    if ((el = e.target.closest('#yearSheetMask')) ||
        (el = e.target.closest('#yearCancel')) ||
        (el = e.target.closest('#yearOk'))) {
      closeYearSheet();
      return;
    }
    if ((el = e.target.closest('#moreTypes'))) {
      toast('其他类型：' + M.incomeTypesMore.join(' / '));
      return;
    }
    if ((el = e.target.closest('#btnQuery'))) { doQuery(); return; }
    if ((el = e.target.closest('#btnLogout'))) {
      logged = false;
      renderHome();
      renderMine();
      toast('已退出登录');
      return;
    }
    if ((el = e.target.closest('.rec'))) {
      openIncomeDetail(el);
      return;
    }
    if ((el = e.target.closest('#agreeBox'))) {
      var chk = $('#agreeChk');
      chk.classList.toggle('is-checked');
      $('#btnAnnual2').disabled = !chk.classList.contains('is-checked');
      return;
    }

    /* --- 再处理通用跳转 / 提示 --- */
    if ((el = e.target.closest('[data-back]'))) { back(); return; }
    if ((el = e.target.closest('[data-go]'))) { go(el.getAttribute('data-go')); return; }
    if ((el = e.target.closest('[data-tabgo]'))) { go(el.getAttribute('data-tabgo')); return; }
    if ((el = e.target.closest('[data-toast]'))) { toast(el.getAttribute('data-toast')); return; }
  });

  /* 10.1 登录页：滑块验证 + 登录 */
  (function () {
    var slider = $('#slider'), knob = $('#sliderKnob');
    var max = 0, startX = 0, dragging = false, done = false;

    knob.addEventListener('pointerdown', function (e) {
      if (done) return;
      max = slider.offsetWidth - knob.offsetWidth;
      dragging = true; startX = e.clientX;
      knob.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    knob.addEventListener('pointermove', function (e) {
      if (!dragging || done) return;
      var x = Math.max(0, Math.min(max, e.clientX - startX));
      knob.style.transform = 'translateX(' + x + 'px)';
      if (x >= max - 2) {
        done = true; dragging = false;
        slider.classList.add('is-ok');
        $('#sliderText').textContent = '验证通过';
        $('#btnLogin').disabled = false;
        $('#btnLogin').classList.add('is-ready');
      }
    });
    function release() {
      dragging = false;
      if (!done) knob.style.transform = 'translateX(0)';
    }
    knob.addEventListener('pointerup', release);
    knob.addEventListener('pointercancel', release);
  })();

  $('#btnLogin').addEventListener('click', function () {
    if (this.disabled) return;
    logged = true;
    renderHome();
    renderMine();
    go('home');
    toast('登录成功，欢迎使用');
  });

  /* 10.2 年度滚轮：滚轮 / 拖拽 */
  (function () {
    var wheel = $('#yearWheel');
    var startY = 0, startIdx = 0, dragging = false;

    wheel.addEventListener('click', function (e) {
      var li = e.target.closest('.wheel__item');
      if (!li) return;
      setYearIdx($$('#yearOptions .wheel__item').indexOf(li));
    });
    wheel.addEventListener('wheel', function (e) {
      e.preventDefault();
      setYearIdx(yearIdx + (e.deltaY > 0 ? 1 : -1));
    }, { passive: false });

    wheel.addEventListener('pointerdown', function (e) {
      dragging = true; startY = e.clientY; startIdx = yearIdx;
      wheel.setPointerCapture(e.pointerId);
    });
    wheel.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      setYearIdx(Math.round(startIdx - (e.clientY - startY) / ROW_H));
    });
    wheel.addEventListener('pointerup', function () { dragging = false; });
    wheel.addEventListener('pointercancel', function () { dragging = false; });
  })();

  /* 10.4 提交退税申请 */
  $('#btnRefund').addEventListener('click', function () {
    $('#refundForm').classList.add('is-hidden');
    $('#refundResult').classList.remove('is-hidden');
    $('#refundFooter').classList.add('is-hidden');
    $('#refundFooter2').classList.remove('is-hidden');
    toast('退税申请已提交');
  });

  /* ======================= 11. 启动 ======================= */
  function boot() {
    tickClock();
    setInterval(tickClock, 10000);

    renderHome();
    renderTax();
    renderMine();
    renderTodo();
    renderMessages();
    renderAnnualBase();
    renderAnnualTax();
    renderAnnualDone();
    renderTypeList();
    renderIncome();
    renderDeduct();
    initNotice();

    /* 支持地址栏 #页面名 直接打开（如 index.html#annual-1），便于调试与分享
       追加 ?user 可直接预览已登录态，如 index.html#home?user */
    var raw = (location.hash || '').replace(/^#/, '');
    var hash = raw.split('?')[0];
    if (raw.split('?')[1] === 'user' && !logged) {
      logged = true;
      renderHome();
      renderMine();
    }

    if (hash && pageEl(hash)) {
      if (hash === 'income-query') {
        renderTypeList();
        go(hash);
      } else if (hash === 'income') {
        renderIncome();
        go(hash);
        stack = [];
      } else if (hash === 'income-detail') {
        // 明细页依赖数据，默认打开 2026 年第 1 条
        renderIncome();
        var firstRow = $('.rec[data-year="2026"]');
        go('income');
        if (firstRow) openIncomeDetail(firstRow);
      } else {
        go(hash);
      }
      return;
    }

    /* 启动 Loading（截图 00）-> 首页（未登录态，截图 02） */
    go('splash');
    setTimeout(function () {
      go('home');
      stack = [];
    }, 1800);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
