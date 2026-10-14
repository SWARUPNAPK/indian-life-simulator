/* =====================================================================
   INDIAN LIFE SIMULATOR — game logic
   ===================================================================== */

/* ===================== CONFIGURATION (edit freely) ===================== */
const CONFIG = {
  START_AGE: 18,
  END_AGE: 60,
  START_CALENDAR_MONTH: 6,          // 1 = January ... 12 = December
  START_CASH: 15000,
  START_SAVINGS: 5000,
  SAVINGS_INTEREST_MONTHLY: 0.004,
  CREDIT_INTEREST_MONTHLY: 0.015,
  HOME_LOAN_INTEREST_MONTHLY: 0.0075,
  BANKRUPTCY_DEBT: 200000,
  EVENT_CHANCE: 0.85,
  EVENT_COOLDOWN_MONTHS: 8,
  BASE_LIVING_COST: 4500,
  COLLEGE_FEE_PER_MONTH: 2000,
  PARENT_SUPPORT_OPTIONS: [0, 2000, 5000, 8000],
  STUDY_GRADUATE: 10,
  STUDY_ADVANCED: 25,
  STUDY_PROFESSIONAL: 60,
  MARRIAGE_COST: 150000,
  DEFAULT_LANGUAGE: 'en',
  SAVE_KEY: 'indian_life_sim_save_v1',
  LANG_KEY: 'indian_life_sim_lang',
  DAILY_KEY: 'indian_life_sim_daily_v1'
};

/* ===================== UTILITIES ===================== */
const $ = s => document.querySelector(s);
const fmt = n => (n < 0 ? '-₹' : '₹') + Math.round(Math.abs(n)).toLocaleString('en-IN');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
let rng = Math.random;
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const R = (a, b) => a + (b - a) * rng();
const RI = (a, b) => Math.floor(R(a, b + 1));
const pick = a => a[Math.floor(rng() * a.length)];
const gauss = () => Math.sqrt(-2 * Math.log(1 - rng())) * Math.cos(2 * Math.PI * rng());
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ===================== LANGUAGES (interface labels) ===================== */
const I18N = {
  en: { home: 'Home', career: 'Career', finance: 'Finance', life: 'Life', trophies: 'Trophies', next: 'Next month', age: 'Age', cash: 'Cash', savings: 'Savings', happiness: 'Happiness', energy: 'Energy', health: 'Health', start: 'Start story', daily: 'Daily challenge', cont: 'Continue', work: 'Work', study: 'Study', rest: 'Rest', hustle: 'Side hustle', objective: 'Next objective', focus: 'Focus this month' },
  hi: { home: 'घर', career: 'करियर', finance: 'वित्त', life: 'जीवन', trophies: 'उपलब्धियाँ', next: 'अगला महीना', age: 'उम्र', cash: 'नकद', savings: 'बचत', happiness: 'खुशी', energy: 'ऊर्जा', health: 'सेहत', start: 'कहानी शुरू करें', daily: 'रोज़ की चुनौती', cont: 'जारी रखें', work: 'काम', study: 'पढ़ाई', rest: 'आराम', hustle: 'साइड हसल', objective: 'अगला लक्ष्य', focus: 'इस महीने का फोकस' },
  bn: { home: 'বাড়ি', career: 'ক্যারিয়ার', finance: 'অর্থ', life: 'জীবন', trophies: 'অর্জন', next: 'পরের মাস', age: 'বয়স', cash: 'নগদ', savings: 'সঞ্চয়', happiness: 'সুখ', energy: 'শক্তি', health: 'স্বাস্থ্য', start: 'গল্প শুরু করুন', daily: 'দৈনিক চ্যালেঞ্জ', cont: 'চালিয়ে যান', work: 'কাজ', study: 'পড়াশোনা', rest: 'বিশ্রাম', hustle: 'সাইড হাসল', objective: 'পরবর্তী লক্ষ্য', focus: 'এই মাসের ফোকাস' }
};
let LANG = CONFIG.DEFAULT_LANGUAGE;
try { LANG = localStorage.getItem(CONFIG.LANG_KEY) || LANG; } catch (e) { }
const t = k => (I18N[LANG] && I18N[LANG][k]) || I18N.en[k] || k;

/* ===================== GAME DATA ===================== */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FEST = { 3: 'Holi', 4: 'Eid', 10: 'Durga Puja', 11: 'Diwali', 12: 'Christmas' };
const HOMETOWNS = ['Durgapur, West Bengal', 'Patna, Bihar', 'Jaipur, Rajasthan', 'Coimbatore, Tamil Nadu', 'Nashik, Maharashtra', 'Lucknow, Uttar Pradesh', 'Kochi, Kerala', 'Guwahati, Assam', 'Indore, Madhya Pradesh', 'Warangal, Telangana'];
const AVATARS = ['🧑', '👩', '👨', '🧑‍🦱', '👩‍🦰', '🧔'];
const PERS = {
  hard: { n: 'Hardworking', d: 'Studies 25% faster', study: 1.25 },
  charm: { n: 'Charming', d: '+10 social skill', social: 10 },
  risk: { n: 'Risk-taker', d: '+10 business skill', biz: 10 },
  frugal: { n: 'Frugal', d: '10% lower living costs', exp: 0.9 }
};
const LOC = [
  { n: 'Small Town', mult: 1, rent: 4000, live: 1, bm: 1, rentf: 1, price: 1 },
  { n: 'Metro City', mult: 1.35, rent: 9000, live: 1.6, bm: 1.5, rentf: 2.25, price: 2.2 },
  { n: 'Premium District', mult: 1.8, rent: 20000, live: 2.5, bm: 2.2, rentf: 5, price: 4.5 }
];
const JOBS = {
  office: { n: 'Junior Office Assistant', ic: '🗂️', cat: 'Everyday work', study: 0, pay: [14000, 26000] },
  delivery: { n: 'Delivery Partner', ic: '🛵', cat: 'Everyday work', study: 0, pay: [13000, 22000], hp: 40 },
  taxi: { n: 'Taxi Driver', ic: '🚕', cat: 'Everyday work', study: 0, pay: [14000, 26000] },
  clerk: { n: 'Government Clerk', ic: '🏛️', cat: 'Government & professional', study: 10, pay: [28000, 48000], exam: 1 },
  teacher: { n: 'Teacher', ic: '📚', cat: 'Government & professional', study: 25, pay: [30000, 58000], exam: 1 },
  police: { n: 'Police Officer', ic: '👮', cat: 'Government & professional', study: 10, pay: [32000, 52000], exam: 1, hp: 60 },
  bank: { n: 'Bank Officer', ic: '🏦', cat: 'Government & professional', study: 25, pay: [40000, 75000], exam: 1 },
  engineer: { n: 'Engineer', ic: '⚙️', cat: 'Government & professional', study: 25, sk: 'tech', skMin: 20, pay: [35000, 85000] },
  dev: { n: 'Software Developer', ic: '🧑‍💻', cat: 'Government & professional', study: 25, sk: 'tech', skMin: 35, pay: [38000, 130000] },
  doctor: { n: 'Doctor', ic: '🩺', cat: 'Government & professional', study: 60, pay: [60000, 190000], exam: 1 },
  freelance: { n: 'Freelancer', ic: '💻', cat: 'Modern & independent', study: 10, sk: 'tech', skMin: 15, pay: [10000, 65000], vol: 1 },
  creator: { n: 'Content Creator', ic: '📱', cat: 'Modern & independent', study: 0, sk: 'social', skMin: 25, pay: [2000, 90000], vol: 1 },
  musician: { n: 'Musician', ic: '🎸', cat: 'Modern & independent', study: 0, sk: 'social', skMin: 30, pay: [4000, 75000], vol: 1 },
  actor: { n: 'Actor', ic: '🎬', cat: 'Modern & independent', study: 0, sk: 'social', skMin: 45, loc: 1, pay: [6000, 160000], vol: 1 },
  sports: { n: 'Sports Professional', ic: '🏏', cat: 'Modern & independent', study: 0, hp: 70, maxAge: 34, pay: [12000, 200000], vol: 1 }
};
const SKN = { tech: 'technical', biz: 'business', social: 'social' };
const COURSES = [
  { id: 'coding', n: 'Coding bootcamp', ic: '💻', cost: 8000, sk: 'tech', gain: 8 },
  { id: 'biz', n: 'Business course', ic: '📊', cost: 6000, sk: 'biz', gain: 8 },
  { id: 'comm', n: 'Communication & English', ic: '🗣️', cost: 4000, sk: 'social', gain: 8 }
];
const BIZ = {
  tea: { n: 'Tea Stall', ic: '🍵', cost: 25000, rev: 25000, cogs: 0.45, rent: 3000, staff: 0, wage: 0 },
  grocery: { n: 'Grocery Shop', ic: '🛒', cost: 120000, rev: 130000, cogs: 0.78, rent: 8000, staff: 1, wage: 9000 },
  clothing: { n: 'Clothing Store', ic: '👗', cost: 250000, rev: 150000, cogs: 0.6, rent: 15000, staff: 2, wage: 10000 },
  restaurant: { n: 'Restaurant', ic: '🍛', cost: 400000, rev: 250000, cogs: 0.62, rent: 25000, staff: 3, wage: 12000 }
};
const ITEMS = [
  { id: 'phone', n: 'Smartphone', ic: '📱', cost: 15000, h: 3 },
  { id: 'outfit', n: 'Stylish outfit', ic: '👔', cost: 5000, h: 2, fx: () => { S.skills.social += 3; } },
  { id: 'decor', n: 'Room decor', ic: '🪴', cost: 10000, h: 3 },
  { id: 'laptop', n: 'Laptop', ic: '🖥️', cost: 45000, h: 2, fx: () => { S.skills.tech += 10; } },
  { id: 'bike', n: 'Motorbike (saves ₹800/month)', ic: '🏍️', cost: 70000, h: 4 },
  { id: 'car', n: 'Car (₹3,000/month upkeep)', ic: '🚗', cost: 600000, h: 8 }
];
const SYMS = [
  { s: 'BHRT', n: 'Bharat Infotech', vol: 0.07, p: 420 },
  { s: 'CHAI', n: 'Chaiwala Foods', vol: 0.05, p: 180 },
  { s: 'GRID', n: 'Desh Power Grid', vol: 0.04, p: 260 },
  { s: 'RAIL', n: 'Rail Logistics', vol: 0.06, p: 310 },
  { s: 'MEDX', n: 'MediCare Pharma', vol: 0.09, p: 150 }
];
const PARTNERS = ['Anjali', 'Priya', 'Rohan', 'Kavya', 'Arjun', 'Meera', 'Sameer', 'Ishita'];

/* ===================== STATE ===================== */
let S = null, draft = { name: '', town: 0, pers: 'hard', avatar: '🧑' }, tab = 'home', pendingEvent = null;

function newGame(o) {
  rng = o.seed ? mulberry(o.seed) : Math.random;
  const p = PERS[o.pers];
  S = {
    mode: o.mode || 'story', seed: o.seed || 0, goalMonths: o.goalMonths || 0, goalText: o.goalText || '',
    name: o.name || 'Rahul', town: o.town || 0, pers: o.pers, avatar: o.avatar,
    m: 0, cash: o.cash != null ? o.cash : CONFIG.START_CASH, savings: o.savings != null ? o.savings : CONFIG.START_SAVINGS,
    debt: 0, homeLoan: 0, happy: 70, energy: 80, health: 80, study: 0, prep: 0,
    skills: { tech: 0, biz: (p.biz || 0), social: (p.social || 0) },
    job: null, careerMonths: {}, biz: null, loc: 0, ownHome: false, homeLoc: 0, homeValue: 0, flats: 0, flatValue: 0,
    items: [], trust: 60, support: 0, partner: null, kids: 0, focus: 'work', stocks: {}, prices: {}, chg: {},
    ach: [], mistake: '', cool: {}, last: null, applied: false, hadDebt: false, over: false, ending: null
  };
  SYMS.forEach(x => { S.prices[x.s] = x.p; S.chg[x.s] = 0; });
  tab = 'home'; save();
}
function save() { try { if (S) localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(S)); } catch (e) { } }
function load() { try { const j = localStorage.getItem(CONFIG.SAVE_KEY); if (j) { S = JSON.parse(j); return true; } } catch (e) { } return false; }

/* ===================== DERIVED VALUES ===================== */
const age = () => CONFIG.START_AGE + Math.floor(S.m / 12);
const calMonth = () => ((CONFIG.START_CALENDAR_MONTH - 1 + S.m) % 12) + 1;
const stocksValue = () => Object.keys(S.stocks).reduce((a, k) => a + S.stocks[k].q * S.prices[k], 0);
const bizValue = () => S.biz ? BIZ[S.biz.type].cost * S.biz.branches * 0.5 : 0;
const netWorth = () => S.cash + S.savings - S.debt - S.homeLoan + S.homeValue + S.flatValue + stocksValue() + bizValue();
const eduName = () => S.study >= CONFIG.STUDY_PROFESSIONAL ? 'Professional degree' : S.study >= CONFIG.STUDY_ADVANCED ? 'Postgraduate' : S.study >= CONFIG.STUDY_GRADUATE ? 'Graduate' : '12th pass';
const liquid = () => S.cash + S.savings;
const creditLimit = () => 20000 + (S.job ? 80000 : 0) + (S.biz ? 100000 : 0) + (S.ownHome ? 100000 : 0);
const rentNow = () => (S.ownHome && S.homeLoc === S.loc) ? 0 : LOC[S.loc].rent;
const mainCareer = () => { let b = null, mx = 0; for (const k in S.careerMonths) if (S.careerMonths[k] > mx) { mx = S.careerMonths[k]; b = k; } return b; };

function pay(n) { if (S.cash >= n) { S.cash -= n; return; } let r = n - S.cash; S.cash = 0; if (S.savings >= r) { S.savings -= r; return; } r -= S.savings; S.savings = 0; S.debt += r; }
function gain(n) { S.cash += n; }

function salary(j) {
  const J = JOBS[j.id];
  const prog = clamp(j.months / 96 + (S.skills[J.sk] || 0) / 300, 0, 1);
  let s = J.pay[0] + (J.pay[1] - J.pay[0]) * prog;
  s *= LOC[S.loc].mult;
  if (J.vol) s *= R(0.3, 1.5);
  return s;
}
function blockReason(id) {
  const J = JOBS[id];
  if (S.job && S.job.id === id) return 'Current job';
  if (S.applied) return 'Applied already this month';
  if (S.study < J.study) return 'Need education ' + J.study + ' (have ' + Math.floor(S.study) + ')';
  if (J.sk && S.skills[J.sk] < J.skMin) return 'Need ' + SKN[J.sk] + ' skill ' + J.skMin + ' (have ' + Math.floor(S.skills[J.sk]) + ')';
  if (J.loc && S.loc < J.loc) return 'Only in ' + LOC[J.loc].n + ' or bigger';
  if (J.hp && S.health < J.hp) return 'Need health ' + J.hp;
  if (J.maxAge && age() > J.maxAge) return 'Age limit ' + J.maxAge;
  return '';
}
function applyChance(id) {
  const J = JOBS[id];
  const skx = J.sk ? (S.skills[J.sk] - J.skMin) : 0;
  let p;
  if (J.exam) p = .2 + (S.study - J.study) * .01 + S.prep * .015 + (S.skills.social) * .002;
  else if (J.vol) p = .4 + skx * .008 + S.skills.social * .002;
  else p = .55 + (S.study - J.study) * .01 + skx * .01 + S.skills.social * .002;
  return clamp(p, .1, .92);
}

/* ===================== BUSINESS ===================== */
function bizMonth() {
  const B = BIZ[S.biz.type], b = S.biz, cm = calMonth();
  let season = 1;
  if (S.biz.type === 'clothing' && (cm === 10 || cm === 11)) season = 1.6;
  if (S.biz.type === 'restaurant' && (cm === 12 || cm === 1)) season = 1.2;
  if (S.biz.type === 'tea') season = [11, 12, 1].includes(cm) ? 1.3 : ([7, 8].includes(cm) ? 1.2 : 1);
  const demand = clamp(.5 + b.rep / 100, .4, 1.6) * season * R(.75, 1.25) * LOC[S.loc].bm * (b.boost || 1);
  const effort = S.job ? .6 : 1;
  const rev = B.rev * demand * b.branches * effort;
  const cogs = rev * B.cogs;
  const costs = (B.rent * LOC[S.loc].rentf + B.staff * B.wage) * b.branches;
  b.boost = 0;
  b.rep = clamp(b.rep + R(-3, 3.5) + (S.skills.biz - 30) / 40, 10, 100);
  return { rev, cogs, costs, profit: rev - cogs - costs };
}

/* ===================== MONTH ENGINE ===================== */
function nextMonth() {
  if (!S || S.over) return;
  if (S.mode === 'daily') rng = mulberry(S.seed + S.m * 7919);
  const inc = {}, exp = {}, L = [];
  const J = S.job ? JOBS[S.job.id] : null;

  // focus
  const mult = (PERS[S.pers].study || 1);
  if (S.focus === 'study') {
    const before = eduName(); S.study += 3 * mult; S.prep += 6; S.energy -= 10; exp['College fees'] = CONFIG.COLLEGE_FEE_PER_MONTH;
    if (eduName() !== before) L.push('🎓 You are now: ' + eduName());
  } else if (S.focus === 'rest') { S.energy += 30; S.happy += 5; S.health += 2; }
  else if (S.focus === 'hustle') { inc['Side hustle'] = RI(2000, 6000) * (1 + S.skills.social / 100); S.energy -= 18; S.happy -= 3; }
  else S.energy -= 5;

  // income
  if (J) {
    let sal = salary(S.job); if (S.energy < 20) { sal *= .7; L.push('😴 Low energy cut your productivity (-30% pay).'); }
    inc['Salary — ' + J.n] = sal; S.job.months++; S.careerMonths[S.job.id] = (S.careerMonths[S.job.id] || 0) + 1;
    if (S.job.months % 24 === 0) L.push('📈 Work anniversary: your pay band improved.');
    S.energy -= 3;
  } else if (!S.biz && S.focus === 'work') { inc['Odd jobs'] = RI(2500, 4500); L.push('🧾 No steady job: you took odd jobs and tuitions.'); }
  if (S.biz) { const r = bizMonth(); inc['Shop sales (after stock cost)'] = r.rev - r.cogs; exp['Shop rent & wages'] = r.costs; S.energy -= 3; S.biz.last = r.profit; if (S.job) L.push('🏪 Managing shop part-time: sales ran at 60%.'); }
  if (S.flatValue > 0) inc['Rent from flats'] = S.flatValue * .0045;
  if (S.savings > 0) inc['Savings interest'] = S.savings * CONFIG.SAVINGS_INTEREST_MONTHLY;

  // expenses
  const L0 = LOC[S.loc];
  let live = CONFIG.BASE_LIVING_COST * L0.live * (PERS[S.pers].exp || 1);
  if (S.items.includes('bike')) live -= 800;
  exp['Food & transport'] = live;
  const rent = rentNow(); if (rent) exp['Rent'] = rent;
  if (S.items.includes('car')) exp['Car upkeep'] = 3000;
  if (S.kids) exp['Children'] = S.kids * 6000 * L0.live * .7;
  if (S.support) exp['Family contribution'] = S.support;
  if (S.debt > 0) { const i = S.debt * CONFIG.CREDIT_INTEREST_MONTHLY, p = S.debt * .03; exp['Credit repayment'] = i + p; S.debt -= p; }
  if (S.homeLoan > 0) { const i = S.homeLoan * CONFIG.HOME_LOAN_INTEREST_MONTHLY, p = S.homeLoan * .005; exp['Home loan EMI'] = i + p; S.homeLoan = Math.max(0, S.homeLoan - p); }
  exp['Phone & other'] = 1500;

  const tin = Object.values(inc).reduce((a, b) => a + b, 0), tex = Object.values(exp).reduce((a, b) => a + b, 0);
  pay(tex); gain(tin);
  const net = tin - tex;

  // assets
  S.homeValue *= 1 + R(-.002, .007); S.flatValue *= 1 + R(-.002, .007);
  const mk = gauss() * .02 + .004;
  SYMS.forEach(x => { const r = gauss() * x.vol + .006 + mk; S.prices[x.s] = Math.max(5, S.prices[x.s] * (1 + r)); S.chg[x.s] = r; });
  if (rng() < .12) { const x = pick(SYMS), sh = (rng() < .5 ? -1 : 1) * R(.06, .12); S.prices[x.s] = Math.max(5, S.prices[x.s] * (1 + sh)); L.push((sh > 0 ? '📰 ' + x.n + ' wins a big contract: shares jump.' : '📰 ' + x.n + ' faces a regulator probe: shares fall.')); }

  // wellbeing
  let target = 55 + S.items.reduce((a, id) => a + ITEMS.find(i => i.id === id).h, 0) + (S.partner ? 5 : 0) + (S.kids ? 3 : 0) + (S.trust - 50) / 10;
  if (net < 0) target -= 8; if (S.debt > 0) target -= 5;
  S.happy += (target - S.happy) * .15;
  S.energy = clamp(S.energy + 10, 0, 100);
  if (S.energy < 15) { S.health -= 3; L.push('⚠️ Exhausted: your health dropped. Take a rest month.'); }
  if (S.energy > 50 && S.happy > 40) S.health += 1;
  if (age() > 45) S.health -= .3;
  S.health = clamp(S.health, 0, 100); S.happy = clamp(S.happy, 0, 100);
  S.trust = clamp(S.trust + (S.support >= 3000 ? 1 : (age() > 20 ? -.5 : 0)), 0, 100);
  S.prep = Math.max(0, S.prep - 1);
  if (S.debt > 0) S.hadDebt = true;
  S.applied = false;
  S.m++;

  S.last = { inc, exp, net, lines: L, tin, tex };
  checkAch();
  const end = checkEnd();
  save();
  pendingEvent = end ? null : chooseEvent();
  modalReport(end);
}

function checkEnd() {
  if (S.debt + S.homeLoan * 0 > CONFIG.BANKRUPTCY_DEBT) return 'broke';
  if (S.health <= 0) return 'health';
  if (S.mode === 'daily' && S.m >= S.goalMonths) return 'daily';
  if (S.mode === 'story' && age() >= CONFIG.END_AGE) return 'age';
  return null;
}

/* ===================== EVENTS ===================== */
const need = n => ({ need: n });
const EV = [
  { id: 'promo', w: 2, c: () => S.job && S.job.months > 10 && !JOBS[S.job.id].vol, ti: '📈 Promotion offer', tx: () => 'Your manager offers you a senior role' + (S.loc < 2 ? ', but it needs a transfer to ' + LOC[S.loc + 1].n + '.' : '. The hours will be longer.'), ch: [
    { t: 'Accept', d: 'More pay, higher living costs', f: () => { S.job.months += 30; if (S.loc < 2) S.loc++; S.energy -= 8; return 'Promoted! Your experience lifted your pay band' + (S.loc ? '. You are now in ' + LOC[S.loc].n + '; rent and food cost more.' : '.'); } },
    { t: 'Decline', d: 'Keep life as it is', f: () => { S.happy += 3; return 'You stayed put. Peaceful, but the raise went to a colleague.'; } }] },
  { id: 'friend', w: 2, c: () => liquid() >= 25000 && !S.biz, ti: '🤝 Business partner', tx: () => 'A school friend wants to open a snack stall with you and asks ₹20,000 as your share.', ch: [
    { t: 'Invest ₹20,000', d: 'Risky: depends on his effort', need: 20000, f: () => { pay(20000); const p = .5 + S.skills.biz / 200; if (rng() < p) { const g = RI(30000, 48000); gain(g); return 'The stall did well and paid back ' + fmt(g) + '. (Odds were ' + Math.round(p * 100) + '%; business skill helped you judge the plan.)'; } S.mistake = "Invested in a friend's stall without checking numbers"; return 'The stall closed in 3 months. Lesson: ask for numbers before investing. (Odds were ' + Math.round(p * 100) + '%.)'; } },
    { t: 'Politely decline', d: 'Keep savings', f: () => 'You kept your savings. The friendship survived.' }] },
  { id: 'quiet', w: 3, c: () => !!S.biz, ti: '🏪 Fewer customers', tx: () => 'Your shop has fewer customers this month. A rival opened nearby.', ch: [
    { t: 'Run a discount week (₹5,000)', d: 'Raises reputation', need: 5000, f: () => { pay(5000); S.biz.rep = clamp(S.biz.rep + 10, 10, 100); return 'Customers returned. Reputation +10.'; } },
    { t: 'Wait it out', d: 'Free, but reputation may slip', f: () => { S.biz.rep = clamp(S.biz.rep - 8, 10, 100); return 'Sales stayed slow. Reputation -8.'; } }] },
  { id: 'parentcost', w: 3, c: () => age() >= 19, ti: '👪 Family expense', tx: () => 'Your parents need ₹15,000 for an unexpected repair at home.', ch: [
    { t: 'Help fully (₹15,000)', d: 'Family trust +10', need: 15000, f: () => { pay(15000); S.trust += 10; S.happy += 2; return 'Your parents are grateful. Trust +10.'; } },
    { t: 'Give ₹5,000', d: 'Partial help', need: 5000, f: () => { pay(5000); S.trust += 3; return 'They managed with your help. Trust +3.'; } },
    { t: 'Say you cannot', d: 'Trust drops', f: () => { S.trust -= 10; S.happy -= 3; return 'They understood, but felt let down. Trust -10.'; } }] },
  { id: 'clash', w: 3, c: () => S.prep > 8 && !S.job, ti: '📅 Interview vs exam', tx: () => 'You get an interview call for the same day as an important exam.', ch: [
    { t: 'Attend the interview', d: 'Immediate job chance', f: () => { const p = .45 + S.skills.social / 200; if (rng() < p) { S.job = { id: 'office', months: 0 }; return 'You got a Junior Office Assistant job! (Odds ' + Math.round(p * 100) + '%.)'; } S.prep -= 6; return 'No offer, and you missed prep time. (Odds ' + Math.round(p * 100) + '%.)'; } },
    { t: 'Take the exam', d: 'Builds prep', f: () => { S.prep += 8; S.study += 1; return 'Exam done. Prep +8, education +1.'; } }] },
  { id: 'cricket', w: 2, c: () => liquid() >= 500, ti: '🏏 Local cricket tournament', tx: () => 'Your mohalla is hosting a cricket tournament. Entry is ₹500.', ch: [
    { t: 'Join (₹500)', d: '35% chance to win ₹8,000', need: 500, f: () => { pay(500); S.happy += 5; if (rng() < .35) { gain(8000); return 'Your team won the cup! +₹8,000 and bragging rights.'; } return 'Lost in the semi-final, but you had a great time. Happiness +5.'; } },
    { t: 'Watch from the stands', d: 'Free', f: () => { S.happy += 2; return 'Chai, samosa and a good match. Happiness +2.'; } }] },
  { id: 'medical', w: 2, c: () => S.health < 55 || S.energy < 25, ti: '🏥 Doctor visit', tx: () => 'You feel unwell. The doctor says you were overworking and advises rest and tests.', ch: [
    { t: 'Do the tests (₹6,000)', d: 'Health +20', need: 6000, f: () => { pay(6000); S.health += 20; return 'Tests found nothing serious. Health +20.'; } },
    { t: 'Ignore it', d: 'Save money, risk health', f: () => { S.health -= 12; S.mistake = 'Ignored a health warning'; return 'It got worse. Health -12. Rest and checkups matter.'; } }] },
  { id: 'wallet', w: 2, c: () => true, ti: '👛 Wallet lost', tx: () => 'Your phone and wallet vanished at a crowded railway station.', ch: [
    { t: 'Block cards and buy a basic phone (₹4,000)', d: 'Contain the loss', f: () => { pay(4000); return 'Annoying but contained. Next time keep valuables in front pockets!'; } },
    { t: 'File a police complaint and wait', d: 'Free but slow', f: () => { S.happy -= 4; return 'No luck. You borrowed a friend’s phone for weeks. Happiness -4.'; } }] },
  { id: 'reel', w: 2, c: () => S.skills.social >= 20, ti: '🎥 Your reel is trending', tx: () => 'A funny video of your chai-stall banter went viral overnight.', ch: [
    { t: 'Make more content', d: 'Social skill up, energy down', f: () => { S.skills.social += 6; S.energy -= 12; const g = RI(3000, 12000); gain(g); return 'Brand deals paid ' + fmt(g) + '. Social +6.'; } },
    { t: 'Stay low-key', d: 'Nothing changes', f: () => 'The fame faded in a week.' }] },
  { id: 'rent', w: 2, c: () => rentNow() > 0, ti: '🏠 Landlord raises rent', tx: () => 'Your landlord wants ₹1,500 more per month, or you can look elsewhere.', ch: [
    { t: 'Negotiate', d: 'Social skill helps', f: () => { const p = .3 + S.skills.social / 150; if (rng() < p) return 'He agreed to keep rent the same. (Odds ' + Math.round(p * 100) + '%.)'; pay(3000); return 'He refused and you paid ₹3,000 extra in fees. (Odds ' + Math.round(p * 100) + '%.)'; } },
    { t: 'Accept the raise', d: '-₹1,500 now', f: () => { pay(1500); return 'Paid. Lesson: owning a home avoids rent hikes.'; } }] },
  { id: 'wedding', w: 2, c: () => age() >= 20, ti: '💒 Cousin’s wedding', tx: () => 'Your cousin is getting married. Relatives expect a gift and your presence.', ch: [
    { t: 'Attend with a gift (₹8,000)', d: 'Family trust +5', need: 8000, f: () => { pay(8000); S.trust += 5; S.happy += 6; return 'Great food and dancing. Trust +5, happiness +6.'; } },
    { t: 'Send blessings only', d: 'Aunties will gossip', f: () => { S.trust -= 6; return 'The aunties noticed. Trust -6.'; } }] },
  { id: 'scam', w: 2, c: () => liquid() >= 10000, ti: '📩 "You won ₹25 lakh!"', tx: () => 'An SMS says you won a lottery. You only need to pay ₹10,000 "processing fee" first.', ch: [
    { t: 'Pay the fee', d: 'What could go wrong?', need: 10000, f: () => { pay(10000); S.mistake = 'Paid a "lottery processing fee" to a scammer'; return 'It was a scam. Lesson: real prizes never ask for fees. ₹10,000 gone.'; } },
    { t: 'Report and block', d: 'Smart move', f: () => { S.happy += 2; return 'You blocked and reported the number. Streetwise!'; } }] },
  { id: 'train', w: 2, c: () => true, ti: '🚆 Train delayed 6 hours', tx: () => 'Your train is delayed. The platform is packed and a vendor offers snacks.', ch: [
    { t: 'Buy snacks and chat (₹300)', d: 'Meet people', f: () => { pay(300); S.skills.social += 2; S.happy += 2; return 'You made a new friend on the platform. Social +2.'; } },
    { t: 'Catch up on study', d: 'Quiet corner', f: () => { S.study += 1; S.prep += 2; return 'Productive wait. Education +1, prep +2.'; } }] },
  { id: 'aunty', w: 2, c: () => age() >= 22 && !S.partner, ti: '👵 Neighbour aunty matchmaker', tx: () => 'Aunty says she knows a "very good family" and wants you to meet someone.', ch: [
    { t: 'Meet them (₹2,000)', d: 'Chance to find a partner', need: 2000, f: () => { pay(2000); const p = .35 + S.skills.social / 200; if (rng() < p) { S.partner = { name: pick(PARTNERS), score: 40, married: false }; return 'You hit it off with ' + S.partner.name + '! A new relationship begins.'; } return 'Nice chai, but no spark. (Odds ' + Math.round(p * 100) + '%.)'; } },
    { t: 'Politely refuse', d: 'Keep focus', f: () => 'Aunty sighed loudly but moved on.' }] },
  { id: 'gst', w: 2, c: () => !!S.biz, ti: '🧾 Tax notice', tx: () => 'An accountant says your shop paperwork is incomplete and a notice is likely.', ch: [
    { t: 'Hire an accountant (₹4,000)', d: 'Fix it properly', need: 4000, f: () => { pay(4000); S.skills.biz += 3; return 'Sorted. Business skill +3.'; } },
    { t: 'Ignore it', d: 'Risky', f: () => { if (rng() < .5) { pay(15000); S.mistake = 'Ignored a tax notice'; return 'Penalty of ₹15,000. Lesson: file on time.'; } return 'You got lucky this time.'; } }] },
  { id: 'uncle', w: 2, c: () => liquid() >= 10000, ti: '📲 WhatsApp "insider tip"', tx: () => 'A forwarded message from a distant uncle says a stock will triple next week.', ch: [
    { t: 'Invest ₹10,000', d: 'Tips are rarely real', need: 10000, f: () => { pay(10000); if (rng() < .2) { gain(25000); return 'Lucky: it rose. +₹15,000 net. Do not count on this.'; } gain(2500); S.mistake = 'Acted on a WhatsApp stock tip'; return 'It crashed. You recovered only ₹2,500.'; } },
    { t: 'Ignore the message', d: 'Wise', f: () => { S.skills.biz += 1; return 'You deleted it. Business skill +1.'; } }] },
  { id: 'scholar', w: 2, c: () => S.study >= 10, ti: '🎓 Free bootcamp scholarship', tx: () => 'A company offers a free coding bootcamp seat for a month.', ch: [
    { t: 'Join it', d: 'Tech skill +10, energy -15', f: () => { S.skills.tech += 10; S.energy -= 15; return 'Great month of learning. Technical skill +10.'; } },
    { t: 'Skip', d: 'Too busy', f: () => 'Opportunity passed.' }] },
  { id: 'flood', w: 2, c: () => [7, 8, 9].includes(calMonth()), ti: '🌧️ Heavy monsoon', tx: () => 'Waterlogging blocks roads and markets for days.', ch: [
    { t: 'Work from home / shut early', d: 'Lose a few days', f: () => { S.energy += 5; if (S.biz) S.biz.rep -= 3; return 'You stayed safe. Little lost.'; } },
    { t: 'Wade through to work', d: 'Risk your health', f: () => { S.health -= 8; return 'You caught a fever. Health -8.'; } }] },
  { id: 'loan', w: 2, c: () => liquid() >= 30000, ti: '💸 Relative asks for a loan', tx: () => 'A relative asks to borrow ₹25,000 "for a few months".', ch: [
    { t: 'Lend ₹25,000', d: 'Might not come back', need: 25000, f: () => { pay(25000); S.trust += 4; if (rng() < .4) { gain(25000); return 'He repaid in full. Trust +4.'; } S.mistake = 'Lent ₹25,000 to a relative without a written agreement'; return 'Months passed, no repayment. Lesson: lend only what you can afford to lose.'; } },
    { t: 'Refuse kindly', d: 'Trust -3', f: () => { S.trust -= 3; return 'He sulked, but your savings are safe.'; } }] },
  { id: 'elder', w: 2, c: () => age() >= 35, ti: '🩺 Parent’s health', tx: () => 'Your father needs a procedure. The family hopes you will help with ₹40,000.', ch: [
    { t: 'Pay ₹40,000', d: 'Family trust +15', need: 40000, f: () => { pay(40000); S.trust += 15; S.happy += 3; return 'He recovered well. Trust +15.'; } },
    { t: 'Pay ₹15,000 and use a government hospital', d: 'Cheaper', need: 15000, f: () => { pay(15000); S.trust += 5; return 'Slower, but he recovered. Trust +5.'; } }] },
  { id: 'school', w: 3, c: () => S.kids > 0, ti: '🏫 School admission', tx: () => 'It is admission season. A good school costs ₹25,000 this year.', ch: [
    { t: 'Private school (₹25,000)', d: 'Child thrives', need: 25000, f: () => { pay(25000); S.happy += 4; return 'Your child loves the new school. Happiness +4.'; } },
    { t: 'Government school', d: 'Free', f: () => 'Your child settled in fine.' }] },
  { id: 'overtime', w: 2, c: () => !!S.job && !JOBS[S.job.id].vol, ti: '⏰ Boss demands overtime', tx: () => 'Your boss wants you to work this weekend for a small bonus.', ch: [
    { t: 'Work overtime', d: '+₹5,000, energy -15', f: () => { gain(5000); S.energy -= 15; return 'Bonus ₹5,000 received.'; } },
    { t: 'Refuse politely', d: 'Rest', f: () => { S.energy += 10; return 'Boss grumbled. Energy +10.'; } }] },
  { id: 'layoff', w: 1, c: () => !!S.job && S.job.months > 8 && ['office', 'dev', 'engineer', 'bank'].includes(S.job.id), ti: '📉 Company restructuring', tx: () => 'Your company is cutting costs. Employees can take a severance package or stay at risk.', ch: [
    { t: 'Take severance', d: '₹30,000 and a fresh start', f: () => { gain(30000); S.job = null; return 'You left with ₹30,000. Time to search for a new role.'; } },
    { t: 'Stay', d: '50% keep job, 50% laid off with nothing', f: () => { if (rng() < .5) return 'You survived the cuts.'; S.job = null; S.mistake = 'Gambled on a shaky job instead of taking severance'; return 'You were laid off without severance.'; } }] },
  { id: 'partnerfight', w: 2, c: () => !!S.partner, ti: '💬 Misunderstanding', tx: () => S.partner.name + ' feels you have not given enough time lately.', ch: [
    { t: 'Plan a dinner (₹3,000)', d: 'Relationship +10', need: 3000, f: () => { pay(3000); S.partner.score += 10; return 'A lovely evening. Relationship +10.'; } },
    { t: 'Say you are busy', d: 'Relationship -10', f: () => { S.partner.score -= 10; return 'It stung. Relationship -10.'; } }] },
  { id: 'govexam', w: 3, c: () => age() <= 32 && !(S.job && JOBS[S.job.id].exam), ti: '🏛️ Government exam notification', tx: () => 'A recruitment notice is out. Your father says: "A stable job gives security. Why take risks?"', ch: [
    { t: 'Prepare seriously', d: 'Prep +12, energy -10', f: () => { S.prep += 12; S.study += 1; S.energy -= 10; S.trust += 4; return 'You dedicated time. Prep +12, family trust +4.'; } },
    { t: 'Focus on business or work', d: 'Family worries', f: () => { S.trust -= 3; return 'Your father was unconvinced. Trust -3.'; } },
    { t: 'Do both slowly', d: 'Prep +4', f: () => { S.prep += 4; return 'Slow progress, steady income. Prep +4.'; } }] },
  { id: 'chai', w: 2, c: () => true, ti: '☕ Chai with friends', tx: () => 'Your old friends invite you to the corner chai shop for a long adda.', ch: [
    { t: 'Go (₹300)', d: 'Happiness +6', f: () => { pay(300); S.happy += 6; S.energy += 3; return 'Great laughs. Happiness +6.'; } },
    { t: 'Stay in', d: 'Save ₹300', f: () => 'You stayed in and saved a little.' }] }
];
function festivalEvent(name) {
  return { id: 'fest', ti: '🎉 ' + name, tx: () => name + ' is here! Markets are packed and everyone is spending. You have ' + fmt(liquid()) + '.', ch: [
    { t: 'Temporary food stall (₹10,000)', d: 'Odds rise with business skill', need: 10000, f: () => { pay(10000); const p = .45 + S.skills.biz / 150 + S.loc * .05; if (rng() < p) { const g = RI(16000, 30000); gain(g); S.skills.biz += 2; return 'Stall sold out! You earned ' + fmt(g) + ' back. (Odds ' + Math.round(p * 100) + '%: business skill and location.)'; } S.mistake = 'Opened a festival stall without enough planning'; return 'Rain and rivals hurt sales; you recovered ₹6,000. (Odds ' + Math.round(p * 100) + '%.)' + (gain(6000), ''); } },
    { t: 'Stock up my shop (₹10,000)', d: 'Needs a business; +30% sales next month', need: 10000, dis: () => !S.biz, f: () => { pay(10000); S.biz.boost = 1.3; S.biz.rep += 5; return 'Shelves are full for the rush. Sales +30% next month.'; } },
    { t: 'Celebrate with family (₹3,000)', d: 'Happiness +8, trust +6', need: 3000, f: () => { pay(3000); S.happy += 8; S.trust += 6; return 'Sweets, lights and laughter. Happiness +8, trust +6.'; } },
    { t: 'Keep savings untouched', d: 'Safe', f: () => { S.happy += 1; return 'You played it safe.'; } }] };
}
function chooseEvent() {
  const cm = calMonth();
  if (FEST[cm] && rng() < (cm === 10 || cm === 11 ? 1 : .7)) return festivalEvent(FEST[cm]);
  if (rng() > CONFIG.EVENT_CHANCE) return null;
  const el = EV.filter(e => e.c() && (!S.cool[e.id] || S.m - S.cool[e.id] > CONFIG.EVENT_COOLDOWN_MONTHS));
  if (!el.length) return null;
  let tot = el.reduce((a, e) => a + e.w, 0), r = rng() * tot;
  for (const e of el) { r -= e.w; if (r <= 0) { S.cool[e.id] = S.m; return e; } }
  return el[0];
}

/* ===================== ACHIEVEMENTS ===================== */
const ACH = [
  { id: 'job', ic: '💼', n: 'First job', c: () => !!S.job || Object.keys(S.careerMonths).length > 0 },
  { id: 'grad', ic: '🎓', n: 'Graduate', c: () => S.study >= CONFIG.STUDY_GRADUATE },
  { id: 'shop', ic: '🏪', n: 'Shop owner', c: () => !!S.biz },
  { id: 'lakh', ic: '💯', n: 'Lakhpati', c: () => netWorth() >= 100000 },
  { id: 'crore', ic: '💰', n: 'Crorepati', c: () => netWorth() >= 10000000 },
  { id: 'debtfree', ic: '🧾', n: 'Debt-free again', c: () => S.hadDebt && S.debt < 1 },
  { id: 'married', ic: '💍', n: 'Married', c: () => S.partner && S.partner.married },
  { id: 'parent', ic: '👶', n: 'Parent', c: () => S.kids > 0 },
  { id: 'home', ic: '🏡', n: 'Home owner', c: () => S.ownHome },
  { id: 'flats', ic: '🏘️', n: 'Real estate tycoon (3 flats)', c: () => S.flats >= 3 },
  { id: 'trader', ic: '📈', n: 'Dalal Street dreamer', c: () => stocksValue() >= 100000 },
  { id: 'city', ic: '🌆', n: 'City life', c: () => S.loc >= 1 },
  { id: 'premium', ic: '🏙️', n: 'Premium district', c: () => S.loc >= 2 },
  { id: 'doctor', ic: '🩺', n: 'Doctor', c: () => S.job && S.job.id === 'doctor' },
  { id: 'star', ic: '🌟', n: 'Star power', c: () => S.job && ['actor', 'musician', 'creator'].includes(S.job.id) && S.job.months >= 12 },
  { id: 'king', ic: '👑', n: 'Business King (3 branches)', c: () => S.biz && S.biz.branches >= 3 },
  { id: 'broke', ic: '🥲', n: 'Broke before payday', c: () => S.debt > 100000 }
];
function checkAch() { ACH.forEach(a => { if (!S.ach.includes(a.id) && a.c()) S.ach.push(a.id); }); }

/* ===================== ENDING ===================== */
function computeEnding(reason) {
  const nw = netWorth(), mc = mainCareer(), sv = stocksValue();
  let title = 'A Life Well Lived', sub = 'Steady choices, quiet happiness.';
  const govt = ['clerk', 'teacher', 'police', 'bank'];
  if (reason === 'broke' || nw < 0) { title = 'Broke Before Payday'; sub = 'Debt won this round. Next life, build a cash buffer first.'; }
  else if (reason === 'health') { title = 'Burnout Champion'; sub = 'Success is hollow without health.'; }
  else if (S.biz && S.biz.branches >= 3 && nw >= 3000000) { title = 'Business King'; sub = 'Branches in every market.'; }
  else if (S.biz && S.biz.type === 'tea' && nw >= 1000000) { title = 'Millionaire Chaiwala'; sub = 'From one stall to a fortune.'; }
  else if (mc === 'doctor' && nw >= 2000000) { title = 'Beloved Doctor Sahab'; sub = 'The whole town knows your name.'; }
  else if (govt.includes(mc) && nw >= 500000) { title = 'Government Exam Champion'; sub = 'Stable job, stable life, proud parents.'; }
  else if (sv >= nw * .4 && nw >= 1000000) { title = 'Dalal Street Dreamer'; sub = 'You rode the virtual market.'; }
  else if (['actor', 'musician', 'creator'].includes(mc) && nw >= 1000000) { title = 'Star of the Show'; sub = 'Fans, fame and flash.'; }
  else if (nw >= 10000000) { title = 'Crorepati'; sub = 'A true fortune built step by step.'; }
  else if (nw >= 1000000) { title = 'Lakhpati Family Pride'; sub = 'Comfortable and secure.'; }
  const score = Math.max(0, Math.round(nw / 1000 + S.happy * 50 + S.ach.length * 100));
  return { title, sub, nw, score, career: mc ? JOBS[mc].n : (S.biz ? BIZ[S.biz.type].n : 'Odd jobs & dreams'), mistake: S.mistake || 'None — suspiciously perfect', reason };
}
function dailyScore() { return Math.max(0, Math.round(netWorth() + S.happy * 20)); }
function finishGame(reason) {
  S.over = true; checkAch();
  S.ending = computeEnding(reason);
  if (S.mode === 'daily') {
    S.ending.score = dailyScore();
    try { const d = JSON.parse(localStorage.getItem(CONFIG.DAILY_KEY) || '[]'); d.push({ date: dailyKey(), score: S.ending.score, name: S.name }); d.sort((a, b) => b.score - a.score); localStorage.setItem(CONFIG.DAILY_KEY, JSON.stringify(d.slice(0, 5))); } catch (e) { }
  }
  save(); modalEnding();
}

/* ===================== DAILY CHALLENGE ===================== */
const dailyKey = () => { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };
function startDaily() {
  const k = dailyKey(), a = k % 2 === 0;
  newGame({
    mode: 'daily', seed: k, name: draft.name || 'Player', town: draft.town, pers: draft.pers, avatar: draft.avatar,
    cash: a ? 5000 : 1000, savings: 0, goalMonths: a ? 12 : 18,
    goalText: a ? 'Survive 12 months on ₹5,000. Score = net worth + happiness.' : 'Turn ₹1,000 into a virtual business in 18 months. Score = net worth + happiness.'
  });
  render();
}

/* ===================== RENDER HELPERS ===================== */
const bar = (l, v, col) => `<div class="stat"><div class="row"><span>${l}</span><b>${Math.round(v)}</b></div><div class="bar"><i style="width:${clamp(v, 0, 100)}%;background:${col}"></i></div></div>`;
const btn = (label, a, v, cls = '', dis = false) => `<button class="btn ${cls}" data-a="${a}" data-v="${esc(v == null ? '' : v)}" ${dis ? 'disabled' : ''}>${label}</button>`;
const tr = (l, v, cls = '') => `<tr><td>${l}</td><td class="${cls}">${v}</td></tr>`;
function modal(html) { closeModal(); const d = document.createElement('div'); d.className = 'ov'; d.id = 'modal'; d.innerHTML = `<div class="sheet">${html}</div>`; document.body.appendChild(d); }
function closeModal() { const m = $('#modal'); if (m) m.remove(); }

function objective() {
  if (S.mode === 'daily') return S.goalText + ' (' + (S.goalMonths - S.m) + ' months left)';
  if (!S.job && !S.biz) return 'Find your first steady income: apply for a job or open a tea stall.';
  if (netWorth() < 100000) return 'Reach ₹1 lakh net worth.';
  if (!S.partner && age() >= 24) return 'Optional: find a partner in the Life tab.';
  if (!S.ownHome) return 'Save for a home to escape rent.';
  if (!S.biz) return 'Consider starting a business or investing in virtual stocks.';
  return 'Build your dream life: expand, invest, and look after your family.';
}

/* ===================== SCREENS ===================== */
function render() {
  const app = $('#app');
  if (!S) { app.innerHTML = renderIntro(); return; }
  const tabs = [['home', '🏠', t('home')], ['career', '💼', t('career')], ['finance', '💰', t('finance')], ['life', '❤️', t('life')], ['trophies', '🏆', t('trophies')]];
  const body = ({ home: scrHome, career: scrCareer, finance: scrFinance, life: scrLife, trophies: scrTrophies })[tab]();
  app.innerHTML = `<header><div>${esc(S.name)} <small>· ${t('age')} ${age()} · ${MONTHS[calMonth() - 1]}</small></div><button data-a="settings">⚙️</button></header>
  <main>${body}</main><nav>${tabs.map(x => `<button class="${tab === x[0] ? 'on' : ''}" data-a="tab" data-v="${x[0]}"><span>${x[1]}</span>${x[2]}</button>`).join('')}</nav>`;
}

function renderIntro() {
  const has = (() => { try { return !!localStorage.getItem(CONFIG.SAVE_KEY); } catch (e) { return false; } })();
  return `<main><div class="hero"><div class="avatar">🇮🇳</div><h1>Indian Life Simulator</h1><div class="mute">Start at 18 with little money. Every decision shapes your future.</div></div>
  <div class="card"><h3>Your character</h3>
  <input id="nm" placeholder="Name" value="${esc(draft.name)}" maxlength="18"><div style="height:8px"></div>
  <select id="tn">${HOMETOWNS.map((h, i) => `<option value="${i}" ${draft.town === i ? 'selected' : ''}>${h}</option>`).join('')}</select>
  <div class="mute" style="margin:10px 0 4px">Avatar</div><div class="wrap">${AVATARS.map(a => btn(a, 'setavatar', a, draft.avatar === a ? 'sel' : '')).join('')}</div>
  <div class="mute" style="margin:10px 0 4px">Personality</div><div class="wrap">${Object.keys(PERS).map(k => btn(PERS[k].n, 'setpers', k, draft.pers === k ? 'sel' : '')).join('')}</div>
  <div class="mute" style="margin-top:6px">${PERS[draft.pers].d}</div></div>
  <div class="card"><div class="mute">Language (menus)</div><div class="wrap" style="margin-top:6px">${btn('English', 'lang', 'en', LANG === 'en' ? 'sel' : '')}${btn('हिन्दी', 'lang', 'hi', LANG === 'hi' ? 'sel' : '')}${btn('বাংলা', 'lang', 'bn', LANG === 'bn' ? 'sel' : '')}</div></div>
  ${btn('▶ ' + t('start'), 'start', '', 'pri big')}<div style="height:8px"></div>
  ${btn('📅 ' + t('daily'), 'daily', '', 'saf big')}
  ${has ? '<div style="height:8px"></div>' + btn(t('cont'), 'continue', '', 'big') : ''}
  <p class="mute" style="text-align:center;margin-top:14px">All money, stocks and careers are a fictional game economy, not real-world earnings or investment advice.</p></main>`;
}

function scrHome() {
  const J = S.job ? JOBS[S.job.id] : null;
  const cur = J ? `${J.ic} ${J.n}` : (S.biz ? `${BIZ[S.biz.type].ic} ${BIZ[S.biz.type].n} owner` : 'Looking for work');
  const items = S.items.map(id => ITEMS.find(i => i.id === id).ic).join(' ');
  const foc = [['work', '💼', t('work')], ['study', '📖', t('study')], ['rest', '😌', t('rest')], ['hustle', '⚡', t('hustle')]];
  const L = S.last;
  return `<div class="card"><div class="row"><div class="avatar">${S.avatar}</div><div style="flex:1;margin-left:8px"><b>${esc(S.name)}</b><div class="mute">${HOMETOWNS[S.town]}<br>${LOC[S.loc].n} · ${PERS[S.pers].n}</div><div style="margin-top:4px">${cur}</div><div>${items}</div></div></div></div>
  <div class="card"><div class="row"><span>💵 ${t('cash')}</span><b>${fmt(S.cash)}</b></div><div class="row"><span>🏦 ${t('savings')}</span><b>${fmt(S.savings)}</b></div>${S.debt > 0 ? `<div class="row"><span>⚠️ Debt</span><b class="neg">${fmt(S.debt)}</b></div>` : ''}<div class="row"><span>Net worth</span><b>${fmt(netWorth())}</b></div><div style="height:8px"></div>
  ${bar(t('happiness'), S.happy, '#f5b301')}${bar(t('energy'), S.energy, '#2e8bff')}${bar(t('health'), S.health, '#2eaa57')}</div>
  <div class="card"><h3>🎯 ${t('objective')}</h3><div>${objective()}</div></div>
  <div class="card"><h3>${t('focus')}</h3><div class="grid2">${foc.map(f => btn(f[1] + ' ' + f[2], 'focus', f[0], S.focus === f[0] ? 'sel' : '')).join('')}</div>
  <div class="mute" style="margin-top:6px">Study: +education & exam prep (₹${CONFIG.COLLEGE_FEE_PER_MONTH}/month). Rest: restore energy. Side hustle: extra cash, less energy.</div></div>
  ${L ? `<div class="card"><h3>Last month</h3><div class="row"><span>Net</span><b class="${L.net >= 0 ? 'pos' : 'neg'}">${L.net >= 0 ? '+' : ''}${fmt(L.net)}</b></div></div>` : ''}
  ${btn('▶ ' + t('next'), 'next', '', 'pri big')}`;
}

function scrCareer() {
  let h = `<div class="card"><h3>🎓 Education: ${eduName()}</h3><div class="mute">Education points ${Math.floor(S.study)} · Exam prep ${Math.floor(S.prep)}</div>
  <div class="mute">Graduate ${CONFIG.STUDY_GRADUATE}, Postgraduate ${CONFIG.STUDY_ADVANCED}, Professional ${CONFIG.STUDY_PROFESSIONAL}. Choose "Study" focus on Home.</div></div>
  <div class="card"><h3>📚 Skills</h3><div class="wrap"><span class="chip">💻 Technical ${Math.floor(S.skills.tech)}</span><span class="chip">📊 Business ${Math.floor(S.skills.biz)}</span><span class="chip">🗣️ Social ${Math.floor(S.skills.social)}</span></div><div style="height:8px"></div>
  ${COURSES.map(c => btn(`${c.ic} ${c.n} · ${fmt(c.cost)}`, 'course', c.id, 'choice', liquid() < c.cost || S.energy < 25)).join('')}</div>`;
  const cats = ['Everyday work', 'Government & professional', 'Modern & independent'];
  cats.forEach(cat => {
    h += `<div class="card"><h3>${cat}</h3>`;
    Object.keys(JOBS).filter(k => JOBS[k].cat === cat).forEach(k => {
      const J = JOBS[k], br = blockReason(k), cur = S.job && S.job.id === k, m = LOC[S.loc].mult;
      h += `<div style="padding:8px 0;border-top:1px solid var(--line)"><div class="row"><b>${J.ic} ${J.n}</b>${cur ? '<span class="chip">Current</span>' : ''}</div>
      <div class="mute">${fmt(J.pay[0] * m)} – ${fmt(J.pay[1] * m)}/month${J.vol ? ' (varies a lot)' : ''}${J.exam ? ' · exam' : ''}</div>
      <div class="mute">${br && !cur ? '🔒 ' + br : 'Chance ' + Math.round(applyChance(k) * 100) + '%'}</div>
      <div style="margin-top:6px">${cur ? btn('Quit job', 'quit', '', 'red') : btn('Apply', 'apply', k, 'saf', !!br)}</div></div>`;
    });
    h += '</div>';
  });
  h += `<div class="card"><h3>🏪 Business</h3>`;
  if (!S.biz) {
    h += Object.keys(BIZ).map(k => { const B = BIZ[k], c = B.cost * (1 + S.loc * .5); return btn(`${B.ic} ${B.n} · ${fmt(c)}`, 'openbiz', k, 'choice', liquid() < c); }).join('');
    h += '<div class="mute" style="margin-top:6px">Revenue depends on reputation, season, and location. You pay rent, wages and stock.</div>';
  } else {
    const B = BIZ[S.biz.type], c = B.cost * (1 + S.loc * .5);
    h += `<div class="row"><b>${B.ic} ${B.n} × ${S.biz.branches}</b></div>${bar('Reputation', S.biz.rep, '#e67e22')}<div class="mute">Last month profit: ${S.biz.last != null ? fmt(S.biz.last) : '—'}</div><div style="height:8px"></div>
    <div class="wrap">${btn('📣 Marketing ₹5,000', 'market', '', '', liquid() < 5000)}${btn('➕ New branch ' + fmt(c * .8), 'branch', '', 'saf', liquid() < c * .8 || S.biz.branches >= 4)}${btn('Close shop', 'closebiz', '', 'red')}</div>`;
  }
  return h + '</div>';
}

function scrFinance() {
  const L = S.last;
  let h = '';
  if (L) {
    h += `<div class="card"><h3>Last month</h3><table class="tbl">${Object.keys(L.inc).map(k => tr(k, '+' + fmt(L.inc[k]), 'pos')).join('')}${Object.keys(L.exp).map(k => tr(k, '-' + fmt(L.exp[k]), 'neg')).join('')}${tr('<b>Net</b>', '<b>' + (L.net >= 0 ? '+' : '') + fmt(L.net) + '</b>', L.net >= 0 ? 'pos' : 'neg')}</table></div>`;
  }
  h += `<div class="card"><h3>🏦 Accounts</h3><table class="tbl">${tr('Cash', fmt(S.cash))}${tr('Savings (earns ' + (CONFIG.SAVINGS_INTEREST_MONTHLY * 100).toFixed(1) + '%/month)', fmt(S.savings))}${tr('Credit debt', fmt(S.debt), S.debt ? 'neg' : '')}${tr('Home loan', fmt(S.homeLoan), S.homeLoan ? 'neg' : '')}${tr('<b>Net worth</b>', '<b>' + fmt(netWorth()) + '</b>')}</table>
  <div class="wrap" style="margin-top:8px">${btn('Deposit ₹5,000', 'deposit', 5000, '', S.cash < 5000)}${btn('Withdraw ₹5,000', 'withdraw', 5000, '', S.savings < 5000)}</div></div>
  <div class="card"><h3>💳 Loans</h3><div class="mute">Credit limit ${fmt(creditLimit())} · interest ${(CONFIG.CREDIT_INTEREST_MONTHLY * 100).toFixed(1)}%/month</div>
  <div class="wrap" style="margin-top:8px">${[10000, 50000, 200000].map(v => btn('Borrow ' + fmt(v), 'borrow', v, '', S.debt + v > creditLimit())).join('')}${btn('Repay ₹10,000', 'repay', 10000, 'pri', S.debt <= 0 || S.cash < 1)}</div></div>
  <div class="card"><h3>👪 Family contribution</h3><div class="wrap">${CONFIG.PARENT_SUPPORT_OPTIONS.map(v => btn(fmt(v) + '/mo', 'support', v, S.support === v ? 'sel' : '')).join('')}</div><div class="mute" style="margin-top:6px">₹3,000+ per month raises family trust.</div></div>`;
  h += `<div class="card"><h3>📈 Virtual stocks (fictional)</h3>${SYMS.map(x => { const q = (S.stocks[x.s] || { q: 0 }).q, c = S.chg[x.s] || 0; return `<div style="padding:6px 0;border-top:1px solid var(--line)"><div class="row"><b>${x.s}</b><span>${fmt(S.prices[x.s])} <span class="${c >= 0 ? 'pos' : 'neg'}">${c >= 0 ? '▲' : '▼'}${(Math.abs(c) * 100).toFixed(1)}%</span></span></div><div class="mute">${x.n} · you hold ${q}</div><div class="wrap" style="margin-top:4px">${btn('Buy 1', 'buy', x.s + ':1', '', S.cash < S.prices[x.s])}${btn('Buy 10', 'buy', x.s + ':10', '', S.cash < S.prices[x.s] * 10)}${btn('Sell all', 'sell', x.s, '', q <= 0)}</div></div>`; }).join('')}<div class="mute" style="margin-top:6px">Game simulation only. Not investment advice. Diversify to lower risk.</div></div>`;
  const price = 700000 * LOC[S.loc].price, fp = 450000 * LOC[S.loc].price;
  h += `<div class="card"><h3>🏠 Property</h3><div class="mute">Home value ${fmt(S.homeValue)} · Flats ${S.flats}/3 (value ${fmt(S.flatValue)})</div>
  <div class="wrap" style="margin-top:8px">${btn('Buy home · 20% down ' + fmt(price * .2), 'buyhome', '', 'saf', S.ownHome || S.cash < price * .2)}${btn('Buy flat to rent · down ' + fmt(fp * .2), 'buyflat', '', 'saf', S.flats >= 3 || S.cash < fp * .2)}</div><div class="mute" style="margin-top:6px">Owning your home removes rent. Flats earn rent. The rest becomes a home loan at ${(CONFIG.HOME_LOAN_INTEREST_MONTHLY * 12 * 100).toFixed(0)}% per year.</div></div>`;
  return h;
}

function scrLife() {
  let h = `<div class="card"><h3>👪 Parents</h3>${bar('Family trust', S.trust, '#e91e63')}<div class="mute">Support them monthly in Finance. Trust rises with help, falls when ignored.</div></div>`;
  h += `<div class="card"><h3>💞 Relationship</h3>`;
  if (!S.partner) h += `<div class="mute">Optional: meet someone new.</div>${btn('Go on dates (₹3,000)', 'dating', '', 'saf', liquid() < 3000 || age() < 20)}`;
  else {
    const P = S.partner;
    h += `<div><b>${P.name}</b> ${P.married ? '(spouse)' : '(partner)'}</div>${bar('Relationship', P.score, '#e91e63')}<div class="wrap" style="margin-top:8px">${btn('Quality time ₹2,000', 'quality', '', '', liquid() < 2000)}${!P.married ? btn('Marry · ' + fmt(CONFIG.MARRIAGE_COST), 'marry', '', 'saf', P.score < 60 || liquid() < CONFIG.MARRIAGE_COST) : btn('Have a child', 'child', '', 'saf', S.kids >= 3)}</div><div class="mute" style="margin-top:6px">Children: ${S.kids}. Marriage needs relationship ≥ 60.</div>`;
  }
  h += '</div>';
  h += `<div class="card"><h3>🌆 Neighbourhood</h3><div class="mute">Now in <b>${LOC[S.loc].n}</b>. Bigger places pay more, cost more, and unlock careers.</div><div class="wrap" style="margin-top:8px">${LOC.map((l, i) => btn(l.n + (i !== S.loc ? ' · ' + fmt(10000 * (i + 1)) : ''), 'move', i, i === S.loc ? 'sel' : '', i === S.loc || !canMove(i))).join('')}</div><div class="mute" style="margin-top:6px">City: ₹30,000 liquid + a job or study 10. Premium: net worth ₹15 lakh.</div></div>`;
  h += `<div class="card"><h3>🛍️ Lifestyle</h3>${ITEMS.map(i => btn(`${i.ic} ${i.n} · ${fmt(i.cost)}`, 'shopbuy', i.id, 'choice', S.items.includes(i.id) || liquid() < i.cost)).join('')}</div>`;
  return h;
}
function canMove(i) { if (i === 1) return liquid() >= 30000 && (S.job || S.study >= 10); if (i === 2) return netWorth() >= 1500000; return true; }

function scrTrophies() {
  const e = (() => { try { return JSON.parse(localStorage.getItem(CONFIG.DAILY_KEY) || '[]'); } catch (x) { return []; } })();
  return `<div class="card"><h3>🏆 Achievements (${S.ach.length}/${ACH.length})</h3><div class="grid2">${ACH.map(a => `<div class="trophy ${S.ach.includes(a.id) ? 'got' : ''}"><b>${a.ic}</b>${a.n}</div>`).join('')}</div></div>
  <div class="card"><h3>📊 Personal records</h3><table class="tbl">${tr('Net worth', fmt(netWorth()))}${tr('Months lived', S.m)}${tr('Education', eduName())}${tr('Biggest mistake', esc(S.mistake || '—'))}</table></div>
  ${e.length ? `<div class="card"><h3>📅 Daily challenge — your best (this device)</h3><table class="tbl">${e.map(x => tr(x.date + ' · ' + esc(x.name), x.score.toLocaleString('en-IN'))).join('')}</table></div>` : ''}
  <div class="card">${btn('📤 Share my life summary', 'share', '', 'pri big')}<div style="height:8px"></div>${btn('🏁 Retire & see ending', 'retire', '', 'big', S.mode === 'story' && age() < 30)}</div>`;
}

/* ===================== MODALS ===================== */
function modalReport(end) {
  const L = S.last;
  modal(`<h2>${MONTHS[(calMonth() + 10) % 12]} summary</h2>
  <table class="tbl">${Object.keys(L.inc).map(k => tr(k, '+' + fmt(L.inc[k]), 'pos')).join('')}${Object.keys(L.exp).map(k => tr(k, '-' + fmt(L.exp[k]), 'neg')).join('')}${tr('<b>Net</b>', '<b>' + (L.net >= 0 ? '+' : '') + fmt(L.net) + '</b>', L.net >= 0 ? 'pos' : 'neg')}</table>
  ${L.lines.length ? '<div style="margin-top:8px">' + L.lines.map(x => `<div class="mute">${x}</div>`).join('') + '</div>' : ''}
  ${S.debt > 0 && L.net < 0 ? '<div class="mute neg" style="margin-top:6px">Why: expenses exceeded income, so you borrowed. Pick a higher-paying job or cut costs.</div>' : ''}
  <div style="height:10px"></div>${btn('Continue', end ? 'endnow' : 'afterreport', end || '', 'pri big')}`);
  render();
}
function modalEvent(ev) {
  modal(`<h2>${ev.ti}</h2><div>${ev.tx()}</div>${ev.ch.map((c, i) => { const dis = (c.need && liquid() < c.need) || (c.dis && c.dis()); return `<button class="btn choice" data-a="choice" data-v="${i}" ${dis ? 'disabled' : ''}>${c.t}<small>${c.d || ''}</small></button>`; }).join('')}`);
}
function modalResult(txt) { clampStats(); checkAch(); save(); render(); modal(`<h2>Result</h2><div>${txt}</div><div style="height:10px"></div>${btn('Continue', 'closeend', '', 'pri big')}`); }
function clampStats() { S.happy = clamp(S.happy, 0, 100); S.energy = clamp(S.energy, 0, 100); S.health = clamp(S.health, 0, 100); S.trust = clamp(S.trust, 0, 100); if (S.partner) S.partner.score = clamp(S.partner.score, 0, 100); if (S.biz) S.biz.rep = clamp(S.biz.rep, 10, 100); S.prep = Math.max(0, S.prep); }
function modalEnding() {
  const E = S.ending;
  modal(`<div class="hero"><div class="avatar">${S.avatar}</div><h1>${E.title}</h1><div class="mute">${E.sub}</div></div>
  <table class="tbl">${tr('Career', E.career)}${tr('Net worth', fmt(E.nw))}${tr('Achievements', S.ach.length + '/' + ACH.length)}${tr('Biggest mistake', esc(E.mistake))}${tr('Score', E.score.toLocaleString('en-IN'))}</table>
  <div style="height:10px"></div>${btn('📤 Share result card', 'share', '', 'pri big')}<div style="height:8px"></div>${btn('Play again', 'newgame', '', 'big')}`);
}

/* ===================== SHARE CARD ===================== */
function makeCard() {
  const E = S.ending || computeEnding('retire');
  const c = document.createElement('canvas'); c.width = 1080; c.height = 1350; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 1350); g.addColorStop(0, '#FF9933'); g.addColorStop(.5, '#ffffff'); g.addColorStop(1, '#138808'); x.fillStyle = g; x.fillRect(0, 0, 1080, 1350);
  x.fillStyle = '#1c2a6b'; x.textAlign = 'center';
  x.font = 'bold 54px sans-serif'; x.fillText('🇮🇳 Indian Life Simulator', 540, 120);
  x.font = '200px sans-serif'; x.fillText(S.avatar, 540, 380);
  x.font = 'bold 76px sans-serif'; x.fillText(E.title, 540, 520);
  x.font = '38px sans-serif'; x.fillStyle = '#333'; x.fillText(E.sub, 540, 580);
  x.textAlign = 'left'; x.font = 'bold 44px sans-serif'; x.fillStyle = '#111';
  const rows = [['Name', S.name + ', age ' + age()], ['Career', E.career], ['Net worth', fmt(E.nw)], ['Achievements', S.ach.length + '/' + ACH.length], ['Biggest mistake', E.mistake.slice(0, 38)], ['Score', E.score.toLocaleString('en-IN')]];
  rows.forEach((r, i) => { x.fillStyle = '#555'; x.font = '34px sans-serif'; x.fillText(r[0], 90, 700 + i * 100); x.fillStyle = '#111'; x.font = 'bold 40px sans-serif'; x.fillText(r[1], 90, 745 + i * 100 - 0); });
  x.textAlign = 'center'; x.fillStyle = '#fff'; x.font = '34px sans-serif'; x.fillText('Can you beat my life?', 540, 1300);
  return c;
}
async function shareCard() {
  const E = S.ending || computeEnding('retire');
  const text = `I ended as "${E.title}" in Indian Life Simulator! Net worth ${fmt(E.nw)}. Biggest mistake: ${E.mistake}. Can you beat me?`;
  const c = makeCard();
  try {
    const blob = await new Promise(r => c.toBlob(r, 'image/png'));
    const f = new File([blob], 'my-indian-life.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], text, title: 'Indian Life Simulator' }); return; }
  } catch (e) { }
  const P = window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.Share;
  if (P) { try { await P.share({ title: 'Indian Life Simulator', text, dialogTitle: 'Share your life' }); return; } catch (e) { } }
  modal(`<h2>Your result card</h2><img src="${c.toDataURL()}" style="width:100%;border-radius:12px"><div class="mute" style="margin:8px 0">${esc(text)}</div>${btn('Close', 'closemodal', '', 'big')}`);
}

/* ===================== ACTIONS ===================== */
function act(a, v) {
  switch (a) {
    case 'tab': tab = v; render(); break;
    case 'lang': LANG = v; try { localStorage.setItem(CONFIG.LANG_KEY, v); } catch (e) { } closeModal(); render(); break;
    case 'setavatar': draft.avatar = v; render(); break;
    case 'setpers': draft.pers = v; render(); break;
    case 'start': newGame({ name: draft.name || 'Rahul', town: draft.town, pers: draft.pers, avatar: draft.avatar }); render(); modal(`<h2>Welcome, ${esc(S.name)}!</h2><div>You are 18 with ${fmt(S.cash)} cash and ${fmt(S.savings)} savings. Each month choose a focus, then tap <b>Next month</b>. Events will ask for decisions. Find a job, study, or open a shop.</div><div style="height:10px"></div>${btn('Let’s go', 'closemodal', '', 'pri big')}`); break;
    case 'daily': startDaily(); modal(`<h2>Daily challenge</h2><div>${esc(S.goalText)}</div><div class="mute" style="margin-top:6px">Everyone gets the same events today.</div><div style="height:10px"></div>${btn('Start', 'closemodal', '', 'pri big')}`); break;
    case 'continue': if (load()) render(); break;
    case 'focus': S.focus = v; save(); render(); break;
    case 'next': nextMonth(); break;
    case 'afterreport': closeModal(); if (pendingEvent) modalEvent(pendingEvent); break;
    case 'endnow': closeModal(); finishGame(v); break;
    case 'choice': { const ev = pendingEvent; const c = ev.ch[+v]; pendingEvent = null; const r = c.f(); modalResult(r); break; }
    case 'closeend': closeModal(); { const e = checkEnd(); if (e) finishGame(e); } break;
    case 'closemodal': closeModal(); break;
    case 'apply': { const J = JOBS[v]; if (blockReason(v)) break; S.applied = true; const p = applyChance(v); S.energy -= 5; if (rng() < p) { S.job = { id: v, months: 0 }; modalResult(`🎉 You got the ${J.n} job! (Chance was ${Math.round(p * 100)}%.)`); } else modalResult(`Rejected for ${J.n}. Chance was ${Math.round(p * 100)}%${J.exam ? '. Study more and build exam prep to improve it.' : '. Improve skills and education to raise it.'}`); break; }
    case 'quit': S.job = null; save(); render(); break;
    case 'course': { const c = COURSES.find(x => x.id === v); if (liquid() < c.cost || S.energy < 25) break; pay(c.cost); S.skills[c.sk] += c.gain; S.energy -= 15; save(); render(); break; }
    case 'openbiz': { const B = BIZ[v], c = B.cost * (1 + S.loc * .5); if (liquid() < c) break; pay(c); S.biz = { type: v, branches: 1, rep: 50 }; checkAch(); save(); render(); break; }
    case 'closebiz': { gain(BIZ[S.biz.type].cost * S.biz.branches * .4); S.biz = null; save(); render(); break; }
    case 'market': if (liquid() >= 5000) { pay(5000); S.biz.rep = clamp(S.biz.rep + 8, 10, 100); save(); render(); } break;
    case 'branch': { const c = BIZ[S.biz.type].cost * (1 + S.loc * .5) * .8; if (liquid() < c) break; pay(c); S.biz.branches++; checkAch(); save(); render(); break; }
    case 'deposit': { const n = Math.min(+v, S.cash); S.cash -= n; S.savings += n; save(); render(); break; }
    case 'withdraw': { const n = Math.min(+v, S.savings); S.savings -= n; S.cash += n; save(); render(); break; }
    case 'borrow': if (S.debt + +v <= creditLimit()) { S.debt += +v; S.cash += +v; S.hadDebt = true; save(); render(); } break;
    case 'repay': { const n = Math.min(+v, S.cash, S.debt); S.cash -= n; S.debt -= n; save(); render(); break; }
    case 'support': S.support = +v; save(); render(); break;
    case 'buy': { const [s, q] = v.split(':'); const n = +q, cost = S.prices[s] * n; if (S.cash < cost) break; S.cash -= cost; const h = S.stocks[s] || { q: 0, avg: 0 }; h.avg = (h.avg * h.q + cost) / (h.q + n); h.q += n; S.stocks[s] = h; save(); render(); break; }
    case 'sell': { const h = S.stocks[v]; if (!h) break; S.cash += h.q * S.prices[v]; delete S.stocks[v]; save(); render(); break; }
    case 'buyhome': { const p = 700000 * LOC[S.loc].price; if (S.cash < p * .2) break; S.cash -= p * .2; S.homeLoan += p * .8; S.ownHome = true; S.homeLoc = S.loc; S.homeValue = p; checkAch(); save(); render(); break; }
    case 'buyflat': { const p = 450000 * LOC[S.loc].price; if (S.cash < p * .2 || S.flats >= 3) break; S.cash -= p * .2; S.homeLoan += p * .8; S.flats++; S.flatValue += p; checkAch(); save(); render(); break; }
    case 'move': { const i = +v; if (!canMove(i)) break; const c = 10000 * (i + 1); if (liquid() < c) break; pay(c); S.loc = i; if (S.biz) S.biz.rep = Math.max(10, S.biz.rep - 15); checkAch(); save(); render(); break; }
    case 'shopbuy': { const it = ITEMS.find(i => i.id === v); if (liquid() < it.cost || S.items.includes(v)) break; pay(it.cost); S.items.push(v); if (it.fx) it.fx(); save(); render(); break; }
    case 'dating': { if (liquid() < 3000) break; pay(3000); const p = .4 + S.skills.social / 200; if (rng() < p) { S.partner = { name: pick(PARTNERS), score: 40, married: false }; modalResult('You met ' + S.partner.name + '. Something special starts!'); } else modalResult('A pleasant evening, no spark. (Odds ' + Math.round(p * 100) + '%.) Social skill helps.'); break; }
    case 'quality': if (liquid() >= 2000) { pay(2000); S.partner.score = clamp(S.partner.score + 10, 0, 100); S.happy += 3; save(); render(); } break;
    case 'marry': if (S.partner.score >= 60 && liquid() >= CONFIG.MARRIAGE_COST) { pay(CONFIG.MARRIAGE_COST); S.partner.married = true; S.happy += 10; S.trust += 8; checkAch(); save(); render(); } break;
    case 'child': if (S.kids < 3) { S.kids++; S.happy += 6; checkAch(); save(); render(); } break;
    case 'share': shareCard(); break;
    case 'retire': closeModal(); finishGame('retire'); break;
    case 'newgame': closeModal(); S = null; render(); break;
    case 'settings': modal(`<h2>Settings</h2><div class="mute">Language</div><div class="wrap" style="margin:6px 0 12px">${btn('English', 'lang', 'en', LANG === 'en' ? 'sel' : '')}${btn('हिन्दी', 'lang', 'hi', LANG === 'hi' ? 'sel' : '')}${btn('বাংলা', 'lang', 'bn', LANG === 'bn' ? 'sel' : '')}</div>${btn('Main menu', 'newgame', '', 'big')}<div style="height:8px"></div>${btn('Close', 'closemodal', '', 'big')}<div class="mute" style="margin-top:8px">Event text is in English. Progress saves automatically.</div>`); break;
  }
}

document.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (!b || b.disabled) return; act(b.dataset.a, b.dataset.v); });
document.addEventListener('input', e => { if (e.target.id === 'nm') draft.name = e.target.value; });
document.addEventListener('change', e => { if (e.target.id === 'tn') draft.town = +e.target.value; });
render();
