/* ==========================================================================
   个人所得税 APP 前端演示 — data.js
   收入纳税明细：按官方 App 截图逐条录入（金额可直接对照截图核对）
   年度汇算：独立的一套演示数据，数字内部自洽
   ========================================================================== */
(function (global) {
  'use strict';

  function round2(n) { return Math.round(n * 100) / 100; }

  /* 金额格式化：官方明细页不加千分位（125056.28元） */
  function fmt(n) { return Number(n || 0).toFixed(2); }
  /* 金额格式化：官方申报表带千分位（186,000.00） */
  function fmtMoney(n) {
    return Number(n || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2, maximumFractionDigits: 2
    });
  }

  /* 扣缴义务人（任职受雇单位） */
  var ORG_A = '北京金积云信息咨询合伙企业';
  var ORG_B = ORG_A;   /* 历史年度主体：与现主体同属一家公司 */
  var ORG_C = '云账户（天津）共享经济服务有限公司';

  var ORG_CODES = {};
  ORG_CODES[ORG_A] = '91110108MA01****X8';
  ORG_CODES[ORG_C] = '91120116MA06****9K';

  function salary(period, income, tax, org) {
    return { period: period, type: '工资薪金', sub: '正常工资薪金', org: org, income: income, tax: tax };
  }
  function labor(period, income, tax, org) {
    return { period: period, type: '劳务报酬', sub: '其他连续劳务报酬', org: org, income: income, tax: tax };
  }

  /* ---------------------------------------------------------------
     1. 收入纳税明细
        数据口径：税前月薪 12,000.00 元，区间 2025-01 ~ 2026-09（共 21 个月）

        每月可扣除项（用于算个税，不体现在「收入」栏 —— 与官方 App 一致）：
          减除费用            5,000.00
          专项扣除(三险一金)   1,860.00  = 12,000 ×(养老8% + 医疗2% + 失业0.5% + 公积金5%)
          专项附加扣除         9,000.00  = 住房租金 1,500 + 赡养老人 1,500
                                        + 子女教育 2,000×2(小学/幼儿园) + 婴幼儿照护 2,000
          ------------------------------------------------
          每月应纳税所得额 = 12,000 − 5,000 − 1,860 − 9,000 = −3,860.00（负数）

        专项附加扣除已完全覆盖 12,000 月薪的应税部分，累计应纳税所得额始终为负，
        故每月预扣个税均为 0.00 —— 明细页「已申报税额」全部为 0，年度汇算时亦无需补税。
        工资条口径的到手金额 = 12,000 − 1,860 五险一金 = 10,140.00 元/月

        年度合计：2025 收入 144,000.00 / 已申报税额 0.00 ；2026 收入 108,000.00 / 0.00
     --------------------------------------------------------------- */
  var records = {
    2026: [
      salary('2026-09', 12000.00,   0.00, ORG_A),
      salary('2026-08', 12000.00,   0.00, ORG_A),
      salary('2026-07', 12000.00,   0.00, ORG_A),
      salary('2026-06', 12000.00,   0.00, ORG_A),
      salary('2026-05', 12000.00,   0.00, ORG_A),
      salary('2026-04', 12000.00,   0.00, ORG_A),
      salary('2026-03', 12000.00,   0.00, ORG_A),
      salary('2026-02', 12000.00,   0.00, ORG_A),
      salary('2026-01', 12000.00,   0.00, ORG_A)
    ],
    2025: [
      salary('2025-12', 12000.00,   0.00, ORG_A),
      salary('2025-11', 12000.00,   0.00, ORG_A),
      salary('2025-10', 12000.00,   0.00, ORG_A),
      salary('2025-09', 12000.00,   0.00, ORG_A),
      salary('2025-08', 12000.00,   0.00, ORG_A),
      salary('2025-07', 12000.00,   0.00, ORG_A),
      salary('2025-06', 12000.00,   0.00, ORG_A),
      salary('2025-05', 12000.00,   0.00, ORG_A),
      salary('2025-04', 12000.00,   0.00, ORG_A),
      salary('2025-03', 12000.00,   0.00, ORG_A),
      salary('2025-02', 12000.00,   0.00, ORG_A),
      salary('2025-01', 12000.00,   0.00, ORG_A)
    ],
    2024: [
      salary('2024-12', 22217.25, 1557.16, ORG_B),
      salary('2024-11', 21555.71, 1501.75, ORG_B),
      salary('2024-10', 16000.00,  472.12, ORG_B),
      salary('2024-09',  9353.15,   91.55, ORG_B),
      salary('2024-08', 16000.00,  472.12, ORG_B),
      salary('2024-07', 16000.00,  472.12, ORG_B),
      salary('2024-06', 15800.00,  448.85, ORG_B),
      salary('2024-05', 15800.00,  448.85, ORG_B),
      salary('2024-04', 15200.00,  410.50, ORG_B),
      salary('2024-03', 15200.00,  410.50, ORG_B),
      salary('2024-02', 14500.00,  362.10, ORG_B),
      salary('2024-01', 14500.00,  362.10, ORG_B)
    ]
  };

  /* 合计：12,000 月薪 + 4 类专项附加扣除 → 2025 = 144000.00 / 0.00 ；2026 = 108000.00 / 0.00 */
  Object.keys(records).forEach(function (y) {
    var list = records[y];
    list.incomeTotal = round2(list.reduce(function (s, r) { return s + r.income; }, 0));
    list.taxTotal = round2(list.reduce(function (s, r) { return s + r.tax; }, 0));
  });

  /* 年度选择弹层可选项（对齐截图 09：2023 ~ 2026；2023 查询后显示空态） */
  var incomeYears = ['2023', '2024', '2025', '2026'];

  /* 所得类型（查询条件页 02） */
  var incomeTypes = ['工资薪金', '劳务报酬', '稿酬', '特许权使用费'];
  var incomeTypesMore = ['经营所得', '利息股息红利所得', '财产租赁所得', '偶然所得'];

  /* ---------------------------------------------------------------
     2. 2025 年度综合所得年度汇算（独立演示数据，已验算自洽）
        收入 186,000 - 扣除 132,560 = 应纳税所得额 53,440
        应纳税额 2,824 - 已缴 4,824 = 应退税 2,000
     --------------------------------------------------------------- */
  var annual = {
    year: 2025,
    incomeItems: [
      { label: '工资薪金所得', value: '186,000.00' },
      { label: '劳务报酬所得', value: '0.00' },
      { label: '稿酬所得', value: '0.00' },
      { label: '特许权使用费所得', value: '0.00' },
      { label: '收入额合计', value: '186,000.00', total: true }
    ],
    deductItems: [
      { label: '减除费用', value: '60,000.00' },
      { label: '专项扣除（三险一金）', value: '28,560.00' },
      { label: '专项附加扣除', value: '44,000.00' },
      { label: '其他扣除', value: '0.00' },
      { label: '准予扣除的捐赠额', value: '0.00' },
      { label: '扣除合计', value: '132,560.00', total: true }
    ],
    taxItems: [
      { label: '应纳税所得额', value: '53,440.00' },
      { label: '适用税率', value: '10%' },
      { label: '速算扣除数', value: '2,520.00' },
      { label: '应纳税额', value: '2,824.00' },
      { label: '减免税额', value: '0.00' },
      { label: '已缴税额', value: '4,824.00' },
      { label: '应退税额', value: '2,000.00', refund: true }
    ],
    base: '53,440.00',
    finalTax: '2,824.00',
    paidTax: '4,824.00',
    refund: '2,000.00',
    org: '深圳市某某科技有限公司',
    period: '2026年3月1日 — 6月30日'
  };

  /* ---------------------------------------------------------------
     3. 首页（对齐官方截图 02 未登录 / 04 已登录，双状态）
     --------------------------------------------------------------- */
  var homeNotices = {
    guest: ['《个人所得税综合所得年度汇算清缴管理办法》',
            '2025年度综合所得年度汇算已于6月30日结束'],
    user:  ['个人所得税综合所得年度汇算清缴预约办理时间',
            '您已提交2025年度综合所得年度汇算申报并完成退税']
  };
  var homeNoticeCount = { guest: 3, user: 4 };

  var homeTopic = {
    guest: { title: '2025综合所得年度汇算',
             desc: '已于6月30日结束，您可进入本专题页查看记录或补办年度汇算',
             btn: '进入专题页', route: 'annual-1' },
    user:  { title: '2025综合所得年度汇算',
             desc: '您已提交申报并完成退税',
             btn: '查看记录', route: '' }
  };

  var homeFocus = {
    guest: { desc: '若符合条件，您可点击下方填报', chip: '3位家人已参与',
             btns: [{ label: '我要填报', cls: 'fbtn--blue', route: 'deduct' }] },
    user:  { desc: '您已填报<b>5</b>项专项附加扣除', chip: '',
             btns: [{ label: '填报', cls: 'fbtn--blue', route: 'deduct' },
                    { label: '按单查询', cls: 'fbtn--orange', route: '' }] }
  };

  var homeGrid = [
    { label: '综合所得年度汇算', tag: '去申报', icon: 'ic-calc',  tint: 'g-blue',   route: 'annual-1' },
    { label: '收入纳税明细',     tag: '去查询', icon: 'ic-chart', tint: 'g-purple', route: 'income-query' },
    { label: '纳税记录开具',     tag: '去开具', icon: 'ic-cert',  tint: 'g-orange', route: '' },
    { label: '更多',             tag: '更多服务', icon: 'ic-doc', tint: 'g-gray',   tab: 'tax' }
  ];

  var homeBanner = {
    guest: { mod: 'biz-banner--blue', title: '经营所得申报功能介绍', sub: '业务详情 快捷了解', btn: '查看详情' },
    user:  { mod: 'biz-banner--gold', title: '2025个税记忆', sub: '历年申报数据 一键回看', btn: '查看详情' }
  };

  var newsTabs = ['警示案例', '通知公告', '热点问题', '政策解读'];

  var newsData = {
    '警示案例': [
      { title: '办理汇算想便捷 APP密码要记牢', date: '2025-02-26' },
      { title: '获取退税想及时 准确卡号必须有', date: '2025-02-26' },
      { title: '未依法办理个人所得税综合所得汇算清缴案件', date: '2024-03-15' },
      { title: '未在法定期限内办理综合所得汇算清缴、虚假填报子女教育专项附加扣除案件', date: '2024-03-15' }
    ],
    '通知公告': [
      { title: '关于办理2025年度个人所得税综合所得汇算清缴事项的公告', date: '2025-02-26' },
      { title: '国家税务总局令第57号：《个人所得税综合所得汇算清缴管理办法》', date: '2025-01-20' },
      { title: '关于开展2025年度个人所得税专项附加扣除信息确认的提示', date: '2024-12-02' }
    ],
    '热点问题': [
      { title: '年收入不到12万元，需要办理年度汇算吗？', date: '2025-03-05' },
      { title: '退税一般多长时间到账？', date: '2025-03-03' },
      { title: '忘记APP密码怎么办？', date: '2025-02-28' },
      { title: '哪些人可以免于办理年度汇算？', date: '2025-02-25' }
    ],
    '政策解读': [
      { title: '一图读懂：3岁以下婴幼儿照护专项附加扣除', date: '2025-02-20' },
      { title: '大病医疗支出如何在年度汇算中扣除？', date: '2025-01-18' },
      { title: '赡养老人的分摊方式有哪些？', date: '2024-12-20' }
    ]
  };

  /* 「我的」页 · 未登录态（对齐截图 01） */
  var mineGuestCards = [
    { label: '家庭成员', icon: 'ic-users',     tint: 'mc-pink' },
    { label: '任职受雇', icon: 'ic-briefcase', tint: 'mc-amber' },
    { label: '银行卡',   icon: 'ic-card',      tint: 'mc-green' }
  ];
  var mineGuestList = [
    { label: '切换关怀版', icon: 'ic-heart' },
    { label: '安全中心',   icon: 'ic-shield' },
    { label: '帮助中心',   icon: 'ic-bulb' },
    { label: '我要咨询',   icon: 'ic-headset' },
    { label: '关于&更新',  icon: 'ic-info' }
  ];

  /* 「我的」页 · 已登录态（对齐截图 3.5） */
  var mineUser = {
    name: '刘党伟',
    taxNo: '4*************1'
  };
  var mineUserCards = [
    { label: '家庭成员', badge: '6人',  icon: 'ic-users',     tint: 'mc-pink' },
    { label: '任职受雇', badge: '暂无', icon: 'ic-briefcase', tint: 'mc-amber' },
    { label: '银行卡',   badge: '1张',  icon: 'ic-card',      tint: 'mc-green' }
  ];
  var mineUserList = [
    { label: '切换关怀版',   icon: 'ic-heart' },
    { label: '我的办税权限', icon: 'ic-user' },
    { label: '企业办税权限', icon: 'ic-cert' },
    { label: '安全中心',     icon: 'ic-shield' },
    { label: '帮助中心',     icon: 'ic-bulb' },
    { label: '我要咨询',     icon: 'ic-headset' },
    { label: '关于&更新',    icon: 'ic-info' }
  ];

  /* 「待办」Tab */
  var todoList = [
    { type: 'warn', title: '2025 年度汇算尚未办理', desc: '请于 2026 年 6 月 30 日前完成申报，逾期可能影响纳税信用', time: '05-06' },
    { type: 'info', title: '大病医疗扣除待填报', desc: '大病医疗支出只能在年度汇算时扣除，填写后可减少应纳税额', time: '05-02' },
    { type: 'info', title: '退税银行卡待核验', desc: '您绑定的尾号 6688 银行卡即将到期，请及时更新', time: '04-28' }
  ];

  /* 消息中心（底部「消息」Tab） */
  var messages = [
    { type: 'ok',   title: '退税进度提醒', desc: '您申请的2025年度综合所得汇算退税 2000.00 元已通过税务机关审核，国库处理中。', time: '05-19' },
    { type: 'info', title: '申报成功提醒', desc: '您的2025年度综合所得年度汇算申报已提交成功。', time: '05-18' },
    { type: 'info', title: '专项附加扣除提醒', desc: '您已填报5项专项附加扣除（住房租金、赡养老人、子女教育2人、婴幼儿照护），请及时关注信息变化。', time: '05-12' }
  ];

  /* ---------------------------------------------------------------
     4. 其他静态展示数据
     --------------------------------------------------------------- */
  var quickEntries = [
    { label: '综合所得年度汇算', icon: 'ic-calc',    tint: 't-orange', route: 'annual-1', badge: '热' },
    { label: '专项附加扣除填报', icon: 'ic-plusdoc', tint: 't-blue',   route: 'deduct' },
    { label: '收入纳税明细查询', icon: 'ic-chart',   tint: 't-teal',   route: 'income' },
    { label: '纳税记录开具',     icon: 'ic-cert',    tint: 't-purple' },
    { label: '异议处理',         icon: 'ic-chat',    tint: 't-green' },
    { label: '涉税专业服务',     icon: 'ic-briefcase', tint: 't-amber' },
    { label: '票证查验',         icon: 'ic-scan',    tint: 't-pink' },
    { label: '授权管理',         icon: 'ic-shield',  tint: 't-red' }
  ];

  var notices = [
    '2025年度个人所得税综合所得年度汇算办理期限为 2026年3月1日至6月30日',
    '关于办理2025年度个人所得税综合所得汇算清缴事项的公告',
    '专项附加扣除信息确认已开始，请于12月31日前完成下一年度信息确认'
  ];

  var reminders = [
    { type: 'warn', title: '2025 年度汇算尚未办理', desc: '请于 2026 年 6 月 30 日前完成申报，逾期可能影响纳税信用', time: '05-06' },
    { type: 'info', title: '大病医疗扣除待填报', desc: '大病医疗支出只能在年度汇算时扣除，填写后可减少应纳税额', time: '05-02' },
    { type: 'info', title: '退税银行卡待核验', desc: '您绑定的尾号 6688 银行卡即将到期，请及时更新', time: '04-28' }
  ];

  var taxGroups = [
    { title: '我要办税', items: [
      { label: '综合所得年度汇算', desc: '2025 年度 · 办理中', icon: 'ic-calc', tint: 't-orange', route: 'annual-1' },
      { label: '专项附加扣除填报', desc: '已填报 5 项 · 年度 108,000 元', icon: 'ic-plusdoc', tint: 't-blue', route: 'deduct' },
      { label: '经营所得年度申报', icon: 'ic-wallet', tint: 't-purple' },
      { label: '申报更正与作废', icon: 'ic-edit', tint: 't-teal' }
    ]},
    { title: '我要查询', items: [
      { label: '收入纳税明细查询', desc: '按月查看收入与已申报税额', icon: 'ic-chart', tint: 't-teal', route: 'income' },
      { label: '申报记录查询', icon: 'ic-file', tint: 't-blue' },
      { label: '专项附加扣除信息查询', icon: 'ic-doc', tint: 't-green', route: 'deduct' },
      { label: '涉税信息查询', icon: 'ic-search', tint: 't-purple' }
    ]},
    { title: '证明开具', items: [
      { label: '纳税记录开具', icon: 'ic-cert', tint: 't-amber' },
      { label: '申报表打印', icon: 'ic-doc', tint: 't-blue' }
    ]},
    { title: '其他服务', items: [
      { label: '授权管理', icon: 'ic-shield', tint: 't-red' },
      { label: '异议处理', icon: 'ic-chat', tint: 't-green' },
      { label: '票证查验', icon: 'ic-scan', tint: 't-pink' }
    ]}
  ];

  /* 专项附加扣除：本人实际情况只有这 4 类 / 5 条（收入纳税明细的个税即按此计算）
     月度合计 1,500 + 1,500 + 2,000×2 + 2,000 = 9,000 元 → 年度 108,000 元 */
  var deductions = [
    { label: '住房租金',        sub: '深圳市南山区 · 本人承租',              icon: 'ic-home',   tint: 't-amber',  unit: '1,500 元/月', amount: 18000, status: '已填报' },
    { label: '赡养老人',        sub: '张*山 · 父亲（年满60岁 · 非独生分摊）', icon: 'ic-user',   tint: 't-teal',   unit: '1,500 元/月', amount: 18000, status: '已填报' },
    { label: '子女教育',        sub: '张*涵 · 老大 · 小学',                  icon: 'ic-users',  tint: 't-blue',   unit: '2,000 元/月', amount: 24000, status: '已填报' },
    { label: '子女教育',        sub: '张*宇 · 老二 · 幼儿园',                icon: 'ic-users',  tint: 't-blue',   unit: '2,000 元/月', amount: 24000, status: '已填报' },
    { label: '3岁以下婴幼儿照护', sub: '张*安 · 老三 · 1岁',                  icon: 'ic-heart',  tint: 't-red',    unit: '2,000 元/月', amount: 24000, status: '已填报' }
  ];

  var bank = { name: '中国工商银行 · 储蓄卡', no: '**** **** **** 6688', short: '工' };
  var user = { name: '张*明', avatar: '张', taxNo: '3****************7', verified: true };

  /* ---------------------------------------------------------------
     5. 对外暴露
     --------------------------------------------------------------- */
  global.MOCK = {
    user: user,
    records: records,
    incomeYears: incomeYears,
    incomeTypes: incomeTypes,
    incomeTypesMore: incomeTypesMore,
    orgCodes: ORG_CODES,
    annual: annual,
    homeNotices: homeNotices,
    homeNoticeCount: homeNoticeCount,
    homeTopic: homeTopic,
    homeFocus: homeFocus,
    homeGrid: homeGrid,
    homeBanner: homeBanner,
    newsTabs: newsTabs,
    newsData: newsData,
    mineGuestCards: mineGuestCards,
    mineGuestList: mineGuestList,
    mineUser: mineUser,
    mineUserCards: mineUserCards,
    mineUserList: mineUserList,
    todoList: todoList,
    messages: messages,
    taxGroups: taxGroups,
    deductions: deductions,
    bank: bank,
    extraDeduct: 0
  };

  global.TaxUtil = { fmt: fmt, fmtMoney: fmtMoney, round2: round2 };

})(window);
