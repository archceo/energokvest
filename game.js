/* =========================================================
   ЭнергоКвест «Разумный дом»
   Логика игры: 4 уровня, подсчёт очков, сертификат
   ========================================================= */

"use strict";

/* ---------------- константы ---------------- */

const PROBLEM_COUNT = 8;
const BUDGET_LIMIT = 165;        // кВт·ч в месяц
const COMFORT_TARGET = 88;       // средний комфорт
const BASELINE = 300;            // «как раньше», кВт·ч в месяц
const TARIFF = 6.2;              // ₽ за кВт·ч
const CO2_PER_KWH = 0.4;         // кг CO₂ на кВт·ч
const BEST_KEY = "energokvest.best.v1";
const NAME_KEY = "energokvest.name.v1";
const SOUND_KEY = "energokvest.sound.v1";

/* ---------------- данные: уровень 1 ---------------- */

const AUDIT_ITEMS = [
  {
    id: "charger", icon: "🔌", room: "Прихожая", name: "Зарядка без телефона в розетке", problem: true,
    fact: "Блок питания без нагрузки продолжает потреблять 0,1–0,5 Вт — это режим ожидания. За год одна забытая зарядка «съедает» до 4 кВт·ч.",
    save: "до 4 кВт·ч в год с одной зарядки"
  },
  {
    id: "bulb", icon: "💡", room: "Гостиная", name: "Лампа накаливания в люстре", problem: true,
    fact: "Лампа накаливания отдаёт в свет лишь около 5% энергии, остальное — тепло. Светодиодная лампа той же яркости тратит в 8–10 раз меньше.",
    save: "до 80% энергии на освещение"
  },
  {
    id: "tv", icon: "📺", room: "Гостиная", name: "Телевизор в режиме ожидания", problem: true,
    fact: "В режиме standby телевизор потребляет 5–10 Вт круглосуточно — это 40–70 кВт·ч в год на один прибор. Выключай кнопкой на корпусе или через сетевой фильтр.",
    save: "40–70 кВт·ч в год"
  },
  {
    id: "tap", icon: "🚿", room: "Ванная", name: "Капает горячая вода", problem: true,
    fact: "Даже небольшой протекающий кран теряет до 20 л горячей воды в сутки — это около 600 л в месяц. Вода уже подогрета, значит, энергия потрачена зря. Исправный кран экономит и воду, и тепло.",
    save: "до 600 л горячей воды в месяц"
  },
  {
    id: "fridge", icon: "🧊", room: "Кухня", name: "Холодильник вплотную к плите", problem: true,
    fact: "Рядом с источником тепла компрессор включается чаще: расход растёт на 15–20%. Отодвинь холодильник на 10–15 см от стены и плиты, проверь уплотнитель дверцы.",
    save: "15–20% энергии холодильника"
  },
  {
    id: "kettle", icon: "🫖", room: "Кухня", name: "Полный чайник ради одной чашки", problem: true,
    fact: "Вскипятить 1,5 л вместо 0,3 л — втрое больше энергии и времени. Наливай столько воды, сколько собираешься выпить.",
    save: "до 0,1 кВт·ч за каждое кипячение"
  },
  {
    id: "ac", icon: "❄️", room: "Гостиная", name: "Кондиционер при открытом окне", problem: true,
    fact: "Открытое окно выпускает холод на улицу, и кондиционер работает без остановки, изнашиваясь быстрее. Закрытое окно и шторы днём снижают нагрузку на 20–30%.",
    save: "20–30% энергии на охлаждение"
  },
  {
    id: "wash", icon: "🧺", room: "Ванная", name: "Стирка при 90 °C для повседневных вещей", problem: true,
    fact: "До 80–90% электроэнергии стиральной машины уходит на нагрев воды. Для повседневной одежды достаточно 30–40 °C — это экономит до половины энергии.",
    save: "до 50% энергии стирки"
  },
  {
    id: "led", icon: "💡", room: "Прихожая", name: "LED-лампа с датчиком движения", problem: false,
    fact: "Отличное решение: светодиодная лампа экономична, а датчик включает свет только тогда, когда в коридоре есть человек."
  },
  {
    id: "lid", icon: "🍲", room: "Кухня", name: "Крышка на кастрюле", problem: false,
    fact: "Под крышкой вода закипает быстрее, и плита работает меньше. Заодно меньше пара и конденсата в кухне."
  },
  {
    id: "thermo", icon: "🌡️", room: "Гостиная", name: "Термостат на 20 °C", problem: false,
    fact: "Каждый градус выше 20 °C добавляет примерно 5–6% к расходу на отопление. 20 °C — комфортная и экономная норма."
  },
  {
    id: "timer", icon: "⏱️", room: "Прихожая", name: "Розетка-таймер для зарядок", problem: false,
    fact: "Таймер выключает зарядки и мелкую технику по расписанию. Так режим ожидания не тратит энергию по ночам."
  }
];

/* ---------------- данные: уровень 2 ---------------- */

const ZONES = [
  {
    id: "light", icon: "💡", name: "Освещение",
    options: [
      { name: "Как раньше", desc: "Лампы накаливания, свет горит во всех комнатах", kwh: 60, comfort: 90 },
      { name: "Смешанно", desc: "Часть ламп заменена, свет выключают чаще", kwh: 30, comfort: 88 },
      { name: "LED + датчики", desc: "LED-лампы, датчики движения, локальные светильники", kwh: 12, comfort: 92 }
    ]
  },
  {
    id: "fridge", icon: "🧊", name: "Холодильник",
    options: [
      { name: "Старый у плиты", desc: "Техника 1990-х стоит рядом с плитой", kwh: 55, comfort: 80 },
      { name: "Нормальный режим", desc: "Прохладное место, целый уплотнитель, −18 °C", kwh: 35, comfort: 90 },
      { name: "Класс А++", desc: "Новый энергоэффективный, подальше от окна и плиты", kwh: 22, comfort: 92 }
    ]
  },
  {
    id: "wash", icon: "🧺", name: "Стирка и сушка",
    options: [
      { name: "90 °C + сушка", desc: "Стираем часто и при высокой температуре", kwh: 45, comfort: 85 },
      { name: "40–60 °C", desc: "Полная загрузка, сушка на балконе летом", kwh: 20, comfort: 90 },
      { name: "30 °C", desc: "Экономная стирка, сушка на воздухе", kwh: 9, comfort: 82 }
    ]
  },
  {
    id: "cook", icon: "🍳", name: "Приготовление еды",
    options: [
      { name: "Как раньше", desc: "Полный чайник каждый раз, плита без крышек", kwh: 40, comfort: 88 },
      { name: "Разумно", desc: "Нужный объём воды, крышки, мультиварка", kwh: 22, comfort: 90 },
      { name: "Минимум энергии", desc: "Скороварка, чайник по порциям, плита реже", kwh: 14, comfort: 86 }
    ]
  },
  {
    id: "climate", icon: "🌡️", name: "Климат и отопление",
    options: [
      { name: "Жарко", desc: "+24 °C, окна приоткрыты всю зиму", kwh: 70, comfort: 95 },
      { name: "Комфортно", desc: "+21 °C, короткое проветривание, утеплённые окна", kwh: 40, comfort: 88 },
      { name: "Экономно", desc: "+19 °C, тёплый свитер, ночные шторы", kwh: 30, comfort: 80 }
    ]
  },
  {
    id: "gadgets", icon: "💻", name: "Техника и гаджеты",
    options: [
      { name: "Всё включено", desc: "ТВ, ПК и приставки постоянно в режиме ожидания", kwh: 30, comfort: 92 },
      { name: "Выключаем", desc: "Сетевой фильтр на ночь, зарядки по расписанию", kwh: 12, comfort: 90 },
      { name: "Экономно+", desc: "Ноутбук вместо ПК, таймеры, меньше «умных» блоков", kwh: 8, comfort: 88 }
    ]
  }
];

/* ---------------- данные: уровень 3 ---------------- */

const SORT_ITEMS = [
  {
    text: "Выключать свет, выходя из комнаты",
    correct: "save",
    why: "Освещение — заметная часть счёта. Пустая комната не нуждается в свете."
  },
  {
    text: "Оставлять зарядку в розетке после зарядки телефона",
    correct: "waste",
    why: "Блок питания продолжает потреблять даже без нагрузки — это режим ожидания."
  },
  {
    text: "Стирать при 30–40 °C с полной загрузкой",
    correct: "save",
    why: "До 80% энергии стиральной машины уходит на нагрев воды, поэтому температура важнее времени."
  },
  {
    text: "Ставить холодильник вплотную к плите",
    correct: "waste",
    why: "Рядом с источником тепла компрессор включается чаще: расход растёт на 15–20%."
  },
  {
    text: "Кипятить ровно столько воды, сколько нужно",
    correct: "save",
    why: "Лишний литр — это лишние 0,1 кВт·ч и лишнее время работы чайника."
  },
  {
    text: "Держать окно приоткрытым всю зиму вместо короткого проветривания",
    correct: "waste",
    why: "Стены остывают часами, и отопление работает без остановки. Лучше проветривать широко, но 5–10 минут."
  },
  {
    text: "Сушить бельё в электросушилке в солнечный день",
    correct: "waste",
    why: "Сушка на воздухе бесплатна, а электрическая машина тратит 2–3 кВт·ч за цикл."
  },
  {
    text: "Использовать LED-лампы вместо ламп накаливания",
    correct: "save",
    why: "При той же яркости светодиодная лампа тратит в 8–10 раз меньше энергии."
  },
  {
    text: "Оставлять телевизор в режиме ожидания на ночь",
    correct: "waste",
    why: "5–10 Вт круглосуточно — это десятки киловатт-часов в год на один прибор."
  },
  {
    text: "Накрывать кастрюлю крышкой при готовке",
    correct: "save",
    why: "Под крышкой вода закипает быстрее, поэтому плита работает меньше."
  }
];

/* ---------------- данные: уровень 4 ---------------- */

const QUIZ = [
  {
    q: "Во сколько раз светодиодная лампа экономичнее лампы накаливания при той же яркости?",
    options: ["Примерно в 2 раза", "Примерно в 4 раза", "В 8–10 раз", "Они одинаковы"],
    answer: 2,
    expl: "Лампа накаливания 95% энергии отдаёт в тепло. LED превращает в свет почти всё: 10-ваттная светодиодная лампа заменяет 75-ваттную накаливания."
  },
  {
    q: "Какой бытовой прибор потребляет больше всего электроэнергии в среднестатистической квартире?",
    options: ["Микроволновка", "Холодильник", "Пылесос", "Зарядка телефона"],
    answer: 1,
    expl: "Холодильник работает круглосуточно — в среднем на него приходится 25–30% потребления квартиры."
  },
  {
    q: "Как накипь в чайнике влияет на расход энергии?",
    options: ["Никак — вода всё равно кипит", "Расход снижается", "Расход растёт на 10–30%", "Чайник перестаёт потреблять электричество"],
    answer: 2,
    expl: "Накипь мешает теплопередаче, и нагревательный элемент работает дольше. Регулярная чистка окупается."
  },
  {
    q: "Сколько энергии экономит стирка при 30 °C вместо 60 °C?",
    options: ["Около 5%", "Около 10%", "До 40–50%", "Около 90%"],
    answer: 2,
    expl: "Основной расход стиральной машины — нагрев воды, поэтому снижение температуры даёт самый большой эффект."
  },
  {
    q: "Что делает прибор в режиме ожидания (standby)?",
    options: ["Полностью отключается от сети", "Потребляет 5–10 Вт и продолжает работать", "Заряжает соседние приборы", "Потребляет больше, чем при работе"],
    answer: 1,
    expl: "Многие приборы в режиме ожидания потребляют 1–10 Вт круглосуточно. Сетевой фильтр с кнопкой решает проблему."
  },
  {
    q: "Почему холодильник нельзя ставить рядом с плитой или батареей?",
    options: ["Он начинает сильнее морозить", "Компрессор включается чаще и расход растёт", "Портится краска", "Это миф, место не имеет значения"],
    answer: 1,
    expl: "Рядом с источником тепла холодильнику нужно больше энергии, чтобы поддерживать холод. Оптимально — прохладное место и зазор 10–15 см от стены."
  },
  {
    q: "Как правильно проветривать комнату зимой?",
    options: ["Держать окно приоткрытым весь день", "Широко открыть на 5–10 минут 2–3 раза в день", "Не проветривать вообще, чтобы не терять тепло", "Открыть окно на час"],
    answer: 1,
    expl: "Короткое интенсивное проветривание обновляет воздух, не остужая стены. При приоткрытом окне тепло уходит часами."
  },
  {
    q: "Сколько примерно CO₂ не попадёт в атмосферу, если сэкономить 100 кВт·ч электроэнергии?",
    options: ["Около 1 кг", "Около 10 кг", "Около 40 кг", "Около 500 кг"],
    answer: 2,
    expl: "В среднем на 1 кВт·ч выработки приходится около 0,4 кг CO₂. 100 кВт·ч — это примерно 40 кг CO₂, как 250 км на бензиновом автомобиле."
  },
  {
    q: "Зачем на смеситель ставят аэратор?",
    options: ["Чтобы вода быстрее нагревалась", "Чтобы смешивать воду с воздухом и тратить её меньше", "Чтобы очищать воду от хлора", "Чтобы увеличить напор"],
    answer: 1,
    expl: "Аэратор добавляет в струю воздух: напор кажется привычным, а воды уходит до 50% меньше. Меньше горячей воды — меньше энергии на её нагрев."
  },
  {
    q: "Какая маркировка означает самый экономичный бытовой прибор?",
    options: ["Класс G", "Класс B", "Класс A+++", "Класс E"],
    answer: 2,
    expl: "На наклейке энергоэффективности шкала идёт от A+++ (самый экономичный) до G. Разница по расходу между крайними классами может быть в несколько раз."
  },
  {
    q: "На сколько примерно вырастет расход на отопление, если поднять температуру в комнате на 1 °C?",
    options: ["Меньше чем на 1%", "На 5–6%", "На 25%", "Расход не изменится"],
    answer: 1,
    expl: "Каждый лишний градус увеличивает расход тепла примерно на 5–6%. Поэтому 20 °C — и комфортно, и экономно."
  },
  {
    q: "Какой источник энергии относится к возобновляемым?",
    options: ["Природный газ", "Каменный уголь", "Солнечный свет", "Нефть"],
    answer: 2,
    expl: "Солнце, ветер и вода восстанавливаются постоянно. Газ, уголь и нефть — ископаемое топливо: их запасы ограничены, а при сжигании выделяется CO₂."
  },
  {
    q: "Что произойдёт, если долго держать дверцу холодильника открытой?",
    options: ["Ничего, холод сохранится", "Компрессор будет работать дольше и расход вырастет", "Холодильник начнёт экономить энергию", "Продукты станут холоднее"],
    answer: 1,
    expl: "Холод уходит в комнату, датчик включает компрессор, и тот работает без остановки. Поэтому дверцу лучше открывать ненадолго и заранее решать, что берёшь."
  },
  {
    q: "При каком режиме стирки расход энергии на одну вещь будет наименьшим?",
    options: ["Полная загрузка при 30–40 °C", "Полная загрузка при 90 °C", "Половина загрузки при 60 °C", "Расход не зависит от загрузки"],
    answer: 0,
    expl: "Энергия тратится в основном на нагрев воды и работу машины за цикл. Полная загрузка при 30–40 °C даёт максимум вещей за минимум энергии."
  }
];

const TIPS = [
  "Свет: LED-лампы и выключение в пустой комнате — до 80% экономии на освещении.",
  "Нагрев: стирка при 30–40 °C, чайник по порциям, крышка на кастрюле.",
  "Режим ожидания: сетевой фильтр или розетка-таймер отключает технику на ночь.",
  "Холодильник: прохладное место, зазор 10–15 см от стены, целый уплотнитель.",
  "Климат: 20 °C в комнате и короткое проветривание вместо приоткрытого окна.",
  "Вода: аэратор и исправные краны экономят и воду, и энергию на её нагрев."
];

const RANKS = [
  { min: 92, icon: "🏆", title: "Энергогений", sub: "Ты видишь энергию там, где другие видят просто выключатель. Отличный результат!" },
  { min: 80, icon: "🥇", title: "Хранитель энергии", sub: "Уверенный результат: ты находишь утечки и умеешь балансировать комфорт и расход." },
  { min: 65, icon: "🥈", title: "Разумный потребитель", sub: "Хорошая база! Осталось отточить пару привычек — и энергия перестанет утекать впустую." },
  { min: 0, icon: "🌱", title: "Начинающий энергоменеджер", sub: "Первый шаг сделан. Загляни в объяснения — и результат заметно вырастет." }
];

/* ---------------- утилиты ---------------- */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// Перемешивание Фишера—Йетса: возвращает тот же массив в случайном порядке.
function shuffle(list) {
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

const fmt = (value) => new Intl.NumberFormat("ru-RU").format(Math.round(value));

const fmt1 = (value) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 }).format(value);

function saveLS(key, value) {
  try { localStorage.setItem(key, String(value)); } catch (err) { /* приватный режим */ }
}

function readLS(key) {
  try { return localStorage.getItem(key); } catch (err) { return null; }
}

/* ---------------- звук ---------------- */

const audio = { ctx: null, enabled: true };

const SFX = {
  click: [[520, 0.05]],
  good: [[660, 0.07], [880, 0.11]],
  bad: [[240, 0.1], [170, 0.14]],
  win: [[523, 0.09], [659, 0.09], [784, 0.09], [1047, 0.18]],
  start: [[392, 0.08], [523, 0.08], [659, 0.12]]
};

function sfx(name) {
  if (!audio.enabled || !SFX[name]) return;
  try {
    if (!audio.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      audio.ctx = new Ctx();
    }
    const ctx = audio.ctx;
    if (ctx.state === "suspended") ctx.resume();

    let time = ctx.currentTime + 0.01;
    SFX[name].forEach(([freq, dur]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = name === "bad" ? "sawtooth" : "sine";
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(0.05, time + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(time);
      osc.stop(time + dur + 0.02);
      time += dur * 0.9;
    });
  } catch (err) { /* звук не критичен для игры */ }
}

function updateSoundButton() {
  const btn = $("#btn-sound");
  if (!btn) return;
  btn.textContent = audio.enabled ? "🔊" : "🔇";
  btn.setAttribute("aria-pressed", String(audio.enabled));
  btn.setAttribute("aria-label", audio.enabled ? "Выключить звук" : "Включить звук");
}

/* ---------------- состояние ---------------- */

const state = {
  name: "Энергоменеджер",
  scores: { audit: 0, budget: 0, sort: 0, quiz: 0 }
};

let auditState = { found: new Set(), mistakes: 0, completed: false };
let budgetState = { choices: {}, attempts: 0, solved: false, total: null };
let sortState = { index: 0, correct: 0, locked: false };
let quizState = { index: 0, correct: 0, locked: false };

// Перемешанные наборы на текущий забег: порядок и варианты меняются каждый раз.
let auditRun = AUDIT_ITEMS.slice();
let zonesRun = ZONES;
let sortRun = SORT_ITEMS.slice();
let quizRun = QUIZ.slice();

/* ---------------- тост ---------------- */

let toastTimer = null;

function toast(message) {
  const el = $("#toast");
  if (!el) return;
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}

/* ---------------- навигация ---------------- */

const ORDER = ["audit", "budget", "sort", "quiz"];

function showScreen(name) {
  $$(".screen").forEach((screen) => {
    screen.classList.toggle("active", screen.id === "screen-" + name);
  });

  if (name !== "audit") {
    const sheet = $("#fact-sheet");
    if (sheet) sheet.classList.remove("show");
  }

  const toastEl = $("#toast");
  if (toastEl) toastEl.classList.remove("show");

  const idx = ORDER.indexOf(name);
  $$(".step").forEach((step, i) => {
    step.classList.toggle("active", i === idx);
    step.classList.toggle("done", name === "final" || (idx > -1 && i < idx));
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateScoreChip() {
  const total = Math.round(
    state.scores.audit + state.scores.budget + state.scores.sort + state.scores.quiz
  );
  const chip = $("#score-chip");
  if (chip) chip.textContent = total + " / 400";
}

/* ---------------- общий сброс ---------------- */

function resetRun() {
  state.scores = { audit: 0, budget: 0, sort: 0, quiz: 0 };
  auditState = { found: new Set(), mistakes: 0, completed: false };
  budgetState = { choices: {}, attempts: 0, solved: false, total: null };
  sortState = { index: 0, correct: 0, locked: false };
  quizState = { index: 0, correct: 0, locked: false };
  updateScoreChip();
}

/* ---------------- уровень 1: аудит ---------------- */

function initAudit() {
  auditState = { found: new Set(), mistakes: 0, completed: false };
  auditRun = shuffle(AUDIT_ITEMS.slice());

  const grid = $("#audit-grid");
  grid.innerHTML = auditRun.map((item) => `
    <button class="spot" type="button" data-id="${item.id}" aria-pressed="false">
      <span class="spot-icon" aria-hidden="true">${item.icon}</span>
      <span class="spot-room">${item.room}</span>
      <span class="spot-name">${item.name}</span>
      <span class="spot-mark" aria-hidden="true"></span>
    </button>
  `).join("");

  $("#audit-fact").innerHTML = '<p class="fact-empty">Выбери карточку — здесь появится объяснение с цифрами.</p>';
  $("#fact-sheet").classList.remove("show");

  const next = $("#btn-audit-next");
  next.disabled = true;
  next.classList.remove("pulse");

  updateAuditHud();
}

function onAuditClick(event) {
  const card = event.target.closest(".spot");
  if (!card || card.dataset.done === "1" || auditState.completed) return;

  const item = AUDIT_ITEMS.find((entry) => entry.id === card.dataset.id);
  if (!item) return;

  card.dataset.done = "1";

  if (item.problem) {
    card.classList.add("found");
    card.setAttribute("aria-pressed", "true");
    auditState.found.add(item.id);
    showFact(item, true);
    sfx("good");
    updateAuditHud();

    if (auditState.found.size === PROBLEM_COUNT && !auditState.completed) {
      auditState.completed = true;
      state.scores.audit = Math.max(30, 100 - auditState.mistakes * 10);
      updateScoreChip();

      const next = $("#btn-audit-next");
      next.disabled = false;
      next.classList.add("pulse");

      sfx("win");
      toast("Все 8 утечек найдены! Теперь собери энергобаланс.");
    }
    return;
  }

  card.classList.add("is-ok");
  auditState.mistakes += 1;
  updateAuditHud();
  showFact(item, false);
  sfx("bad");
  toast("Это точка уже настроена правильно — утечки здесь нет.");
}

function showFact(item, isProblem) {
  let inner;

  if (isProblem) {
    inner = `
      <div class="fact-inner">
        <p class="fact-kicker">✓ Утечка найдена · ${item.room}</p>
        <h4>${item.name}</h4>
        <p>${item.fact}</p>
        <p class="fact-save">💰 Экономия: ${item.save}</p>
      </div>`;
  } else {
    inner = `
      <div class="fact-inner amber">
        <p class="fact-kicker">Здесь всё правильно · ${item.room}</p>
        <h4>${item.name}</h4>
        <p>${item.fact}</p>
      </div>`;
  }

  $("#audit-fact").innerHTML = inner;

  const sheetBody = $("#fact-sheet-body");
  if (sheetBody) {
    sheetBody.innerHTML = inner;
    $("#fact-sheet").classList.add("show");
  }
}

function updateAuditHud() {
  $("#audit-found").textContent = auditState.found.size;
  $("#audit-bar").style.width = (auditState.found.size / PROBLEM_COUNT) * 100 + "%";
  $("#audit-mistakes").textContent = auditState.mistakes;
}

/* ---------------- уровень 2: бюджет ---------------- */

function initBudget() {
  budgetState = { choices: {}, attempts: 0, solved: false, total: null };
  zonesRun = ZONES.map((zone) => ({
    ...zone,
    options: shuffle(zone.options.slice())
  }));

  const grid = $("#zone-grid");
  grid.classList.remove("locked");
  grid.innerHTML = zonesRun.map((zone) => `
    <section class="zone" aria-label="${zone.name}">
      <div class="zone-head">
        <span class="zone-icon" aria-hidden="true">${zone.icon}</span>
        <span class="zone-name">${zone.name}</span>
      </div>
      ${zone.options.map((opt, i) => `
        <button class="opt" type="button" data-zone="${zone.id}" data-idx="${i}" aria-pressed="false">
          <span class="opt-badge" aria-hidden="true">${"ABC"[i]}</span>
          <span class="opt-body">
            <span class="opt-title">${opt.name}</span>
            <span class="opt-desc">${opt.desc}</span>
            <span class="opt-meta">
              <span class="chip">${opt.kwh} кВт·ч</span>
              <span class="chip comfort">комфорт ${opt.comfort}</span>
            </span>
          </span>
        </button>
      `).join("")}
    </section>
  `).join("");

  $("#btn-budget-check").hidden = false;
  $("#btn-budget-check").disabled = true;
  $("#btn-budget-next").hidden = true;
  $("#btn-budget-next").classList.remove("pulse");

  const feedback = $("#budget-feedback");
  feedback.textContent = "";
  feedback.className = "feedback";

  updateBudgetSummary();
}

function selectedOptions() {
  return zonesRun.map((zone) => {
    const idx = budgetState.choices[zone.id];
    return idx === undefined ? null : zone.options[idx];
  });
}

function totalKwh() {
  return selectedOptions().reduce((sum, opt) => sum + (opt ? opt.kwh : 0), 0);
}

function comfortAvg() {
  const total = selectedOptions().reduce((sum, opt) => sum + (opt ? opt.comfort : 0), 0);
  return total / zonesRun.length;
}

function onBudgetPick(event) {
  const opt = event.target.closest(".opt");
  if (!opt || budgetState.solved) return;

  const zoneId = opt.dataset.zone;
  const idx = Number(opt.dataset.idx);
  budgetState.choices[zoneId] = idx;

  opt.closest(".zone").querySelectorAll(".opt").forEach((node) => {
    const active = node === opt;
    node.classList.toggle("selected", active);
    node.setAttribute("aria-pressed", String(active));
  });

  const feedback = $("#budget-feedback");
  feedback.textContent = "";
  feedback.className = "feedback";

  updateBudgetSummary();
  sfx("click");
}

function updateBudgetSummary() {
  const options = selectedOptions();
  const count = options.filter(Boolean).length;
  const total = totalKwh();
  const comfort = comfortAvg();

  $("#budget-count").textContent = count;
  $("#budget-kwh").textContent = total;
  $("#budget-bar").style.width = clamp((total / BUDGET_LIMIT) * 100, 0, 100) + "%";
  $("#budget-meter").classList.toggle("over", total > BUDGET_LIMIT);

  $("#comfort-val").textContent = fmt1(comfort);
  $("#comfort-bar").style.width = clamp(comfort, 0, 100) + "%";
  $("#comfort-meter").classList.toggle("warn", count === zonesRun.length && comfort < COMFORT_TARGET);

  $("#budget-money").textContent = fmt(total * TARIFF) + " ₽";

  const saved = BASELINE - total;
  $("#budget-saved").textContent = total > 0
    ? (saved > 0 ? "−" + fmt(saved) + " кВт·ч" : "0 кВт·ч")
    : "—";

  $("#btn-budget-check").disabled = count !== zonesRun.length || budgetState.solved;

  $("#sticky-kwh").textContent = total;
  $("#sticky-comfort").textContent = fmt1(comfort);

  const status = $("#sticky-status");
  if (count < zonesRun.length) {
    status.textContent = "выбрано " + count + " из 6";
    status.className = "bs-status";
  } else if (total > BUDGET_LIMIT) {
    status.textContent = "перерасход";
    status.className = "bs-status bad";
  } else if (comfort < COMFORT_TARGET) {
    status.textContent = "низкий комфорт";
    status.className = "bs-status warn";
  } else {
    status.textContent = "баланс ок";
    status.className = "bs-status good";
  }
}

function checkBudget() {
  if (budgetState.solved) return;

  const total = totalKwh();
  const comfort = comfortAvg();
  const feedback = $("#budget-feedback");

  budgetState.attempts += 1;

  if (total > BUDGET_LIMIT) {
    const over = total - BUDGET_LIMIT;
    let zone = null;
    let current = null;
    let gap = 0;

    zonesRun.forEach((entry) => {
      const selected = entry.options[budgetState.choices[entry.id]];
      const cheapest = Math.min(...entry.options.map((opt) => opt.kwh));
      if (selected.kwh - cheapest > gap) {
        gap = selected.kwh - cheapest;
        zone = entry;
        current = selected;
      }
    });

    feedback.className = "feedback bad";
    feedback.innerHTML = `<strong>Перерасход: ${over} кВт·ч.</strong> Самый большой резерв — зона «${zone.name}»: до ${gap} кВт·ч. Попробуй заменить «${current.name}» на более экономный вариант.`;
    sfx("bad");
    return;
  }

  if (comfort < COMFORT_TARGET) {
    const diff = Math.round((COMFORT_TARGET - comfort) * 10) / 10;
    let zone = null;
    let best = null;
    let gap = 0;

    zonesRun.forEach((entry) => {
      const selected = entry.options[budgetState.choices[entry.id]];
      const bestOption = entry.options.reduce((a, b) => (b.comfort > a.comfort ? b : a));
      if (bestOption.comfort - selected.comfort > gap) {
        gap = bestOption.comfort - selected.comfort;
        zone = entry;
        best = bestOption;
      }
    });

    feedback.className = "feedback bad";
    feedback.innerHTML = `<strong>Комфорт ниже цели на ${fmt1(diff)} балла.</strong> Например, в зоне «${zone.name}» есть вариант комфортнее на ${gap}: «${best.name}».`;
    sfx("bad");
    return;
  }

  budgetState.solved = true;
  budgetState.total = total;

  const base = 50 + 30 + 20 * clamp((BUDGET_LIMIT - total) / 60, 0, 1);
  const score = Math.round(clamp(base - 4 * (budgetState.attempts - 1), 40, 100));
  state.scores.budget = score;
  updateScoreChip();

  $("#zone-grid").classList.add("locked");
  $("#btn-budget-check").hidden = true;

  const next = $("#btn-budget-next");
  next.hidden = false;
  next.classList.add("pulse");

  const savedKwh = BASELINE - total;
  const money = Math.round(savedKwh * TARIFF);

  feedback.className = "feedback good";
  feedback.innerHTML = `<strong>Баланс сошёлся!</strong> ${total} кВт·ч при комфорте ${fmt1(comfort)}. Это на ${savedKwh} кВт·ч меньше «старого» сценария — минус примерно ${fmt(money)} ₽ в месяц.`;

  updateBudgetSummary();
  sfx("win");
  toast("Энергобаланс собран — семья довольна!");
}

/* ---------------- уровень 3: привычки ---------------- */

function initSort() {
  sortState = { index: 0, correct: 0, locked: false };
  sortRun = shuffle(SORT_ITEMS.slice());

  $("#sort-card").hidden = false;
  $("#sort-result").hidden = true;
  $("#sort-result").innerHTML = "";
  $("#sort-score").textContent = "0 верно";
  $("#sort-total").textContent = sortRun.length;

  renderSort();
}

function renderSort() {
  const item = sortRun[sortState.index];

  $("#sort-index").textContent = sortState.index + 1;
  $("#sort-text").textContent = item.text;
  $("#sort-score").textContent = sortState.correct + " верно";
  $("#sort-bar").style.width = (sortState.index / sortRun.length) * 100 + "%";

  const feedback = $("#sort-feedback");
  feedback.textContent = "";
  feedback.className = "sort-feedback";

  $$("#sort-card [data-choice]").forEach((btn) => { btn.disabled = false; });
}

function answerSort(choice) {
  if (sortState.locked) return;

  const item = sortRun[sortState.index];
  const ok = choice === item.correct;
  const feedback = $("#sort-feedback");

  sortState.locked = true;
  if (ok) sortState.correct += 1;

  feedback.className = "sort-feedback " + (ok ? "good" : "bad");
  feedback.innerHTML = `<strong>${ok ? "Верно!" : "Не совсем."}</strong> ${item.why}`;

  $$("#sort-card [data-choice]").forEach((btn) => { btn.disabled = true; });
  $("#sort-score").textContent = sortState.correct + " верно";
  $("#sort-bar").style.width = ((sortState.index + 1) / sortRun.length) * 100 + "%";

  sfx(ok ? "good" : "bad");

  window.setTimeout(() => {
    sortState.locked = false;
    sortState.index += 1;

    if (sortState.index >= sortRun.length) {
      endSort();
    } else {
      renderSort();
    }
  }, 1250);
}

function endSort() {
  const strong = sortState.correct >= Math.ceil(sortRun.length * 0.8);
  state.scores.sort = Math.round((sortState.correct / sortRun.length) * 100);
  updateScoreChip();

  $("#sort-card").hidden = true;

  const result = $("#sort-result");
  result.hidden = false;
  result.innerHTML = `
    <div class="big-icon" aria-hidden="true">${strong ? "🧠" : "📘"}</div>
    <h3>${sortState.correct} из ${sortRun.length} привычек — верно</h3>
    <p class="mini">За уровень начислено ${state.scores.sort} из 100 очков.</p>
    <button class="btn btn-primary" id="btn-sort-next" type="button">К викторине →</button>
  `;

  $("#btn-sort-next").addEventListener("click", () => {
    showScreen("quiz");
    initQuiz();
    sfx("click");
  });

  sfx(strong ? "win" : "click");
}

/* ---------------- уровень 4: викторина ---------------- */

// Каждый запуск: случайный порядок вопросов и случайный порядок вариантов.
function buildQuizRun() {
  return shuffle(QUIZ.slice()).map((item) => {
    const options = shuffle(item.options.map((text, i) => ({
      text,
      correct: i === item.answer
    })));

    return {
      ...item,
      options: options.map((option) => option.text),
      answer: options.findIndex((option) => option.correct)
    };
  });
}

function initQuiz() {
  quizState = { index: 0, correct: 0, locked: false };
  quizRun = buildQuizRun();
  $("#quiz-total").textContent = quizRun.length;
  renderQuiz();
}

function renderQuiz() {
  const item = quizRun[quizState.index];

  $("#quiz-index").textContent = quizState.index + 1;
  $("#quiz-score-live").textContent = quizState.correct + " верно";
  $("#quiz-question").textContent = item.q;

  const options = $("#quiz-options");
  options.innerHTML = item.options.map((text, i) => `
    <button class="qopt" type="button" data-i="${i}">
      <span class="qkey" aria-hidden="true">${"АБВГ"[i]}</span>
      <span>${text}</span>
    </button>
  `).join("");

  const explain = $("#quiz-explain");
  explain.hidden = true;
  explain.className = "quiz-explain";
  explain.innerHTML = "";

  const next = $("#btn-quiz-next");
  next.hidden = true;
  next.disabled = false;

  quizState.locked = false;
}

function onQuizPick(event) {
  const btn = event.target.closest(".qopt");
  if (!btn || quizState.locked) return;
  answerQuiz(Number(btn.dataset.i));
}

function answerQuiz(chosen) {
  const item = quizRun[quizState.index];
  const ok = chosen === item.answer;

  quizState.locked = true;
  if (ok) quizState.correct += 1;

  $$("#quiz-options .qopt").forEach((btn, i) => {
    btn.disabled = true;
    if (i === item.answer) btn.classList.add("right");
    else if (i === chosen) btn.classList.add("wrong");
  });

  const explain = $("#quiz-explain");
  explain.className = "quiz-explain " + (ok ? "good" : "bad");
  explain.innerHTML = `<p><b>${ok ? "Верно!" : "Не совсем."}</b> ${item.expl}</p>`;
  explain.hidden = false;

  $("#quiz-score-live").textContent = quizState.correct + " верно";

  const next = $("#btn-quiz-next");
  next.hidden = false;
  next.textContent = quizState.index === quizRun.length - 1 ? "К результатам →" : "Следующий вопрос →";

  sfx(ok ? "good" : "bad");
}

function onQuizNext() {
  const next = $("#btn-quiz-next");
  if (next.disabled) return;

  next.disabled = true;
  quizState.index += 1;

  if (quizState.index >= quizRun.length) {
    endQuiz();
  } else {
    renderQuiz();
  }
}

function endQuiz() {
  state.scores.quiz = Math.round((quizState.correct / quizRun.length) * 100);
  updateScoreChip();
  finishGame();
}

/* ---------------- финал ---------------- */

function rankFor(percent) {
  return RANKS.find((rank) => percent >= rank.min) || RANKS[RANKS.length - 1];
}

function finishGame() {
  const total = Math.round(
    state.scores.audit + state.scores.budget + state.scores.sort + state.scores.quiz
  );
  const percent = Math.round(total / 4);
  const rank = rankFor(percent);

  $("#final-medal").textContent = rank.icon;
  $("#final-rank").textContent = rank.title;
  $("#final-sub").textContent = rank.sub;
  $("#final-total").textContent = total;

  const rows = [
    ["🔍 Энергоаудит", state.scores.audit],
    ["⚖️ Энергобаланс", state.scores.budget],
    ["🧠 Привычки", state.scores.sort],
    ["🎓 Викторина", state.scores.quiz]
  ];

  $("#final-breakdown").innerHTML = rows.map(([label, value]) => `
    <div class="bd-row">
      <span>${label}</span>
      <div class="meter slim"><span style="width:${value}%"></span></div>
      <b>${value}</b>
    </div>
  `).join("");

  $("#final-tips").innerHTML = TIPS.map((tip) => `<li>${tip}</li>`).join("");

  const impact = $("#final-impact");
  if (budgetState.solved && budgetState.total !== null) {
    const savedMonth = BASELINE - budgetState.total;
    const moneyMonth = Math.round(savedMonth * TARIFF);
    const moneyYear = moneyMonth * 12;
    const co2Year = Math.round(savedMonth * CO2_PER_KWH * 12);

    impact.innerHTML = `
      <div class="impact-big">${fmt(savedMonth)} кВт·ч<span>экономии в месяц</span></div>
      <ul class="impact-list">
        <li><span>В деньгах</span><b>${fmt(moneyMonth)} ₽/мес</b></li>
        <li><span>За год</span><b>${fmt(moneyYear)} ₽</b></li>
        <li><span>Меньше выбросов CO₂</span><b>−${fmt(co2Year)} кг/год</b></li>
      </ul>
      <p class="impact-note">Оценка по тарифу 6,2 ₽/кВт·ч и 0,4 кг CO₂ на 1 кВт·ч. В модели учтена приведённая энергия, включая отопление.</p>
    `;
  } else {
    impact.innerHTML = '<p class="mini">Собери энергобаланс, чтобы увидеть расчёт экономии.</p>';
  }

  $("#cert-name").textContent = state.name;
  $("#cert-rank").textContent = rank.title;
  $("#cert-score").textContent = percent;
  $("#cert-date").textContent = new Date().toLocaleDateString("ru-RU", {
    day: "numeric", month: "long", year: "numeric"
  });
  $("#certificate").classList.add("show");

  const best = Number(readLS(BEST_KEY) || 0);
  const bestEl = $("#final-best");
  if (total > best) {
    saveLS(BEST_KEY, total);
    bestEl.textContent = "🎉 Новый рекорд!";
  } else if (best > 0) {
    bestEl.textContent = "Твой лучший результат: " + best + " из 400";
  } else {
    bestEl.textContent = "";
  }

  showScreen("final");
  sfx("win");
}

/* ---------------- запуск и перезапуск ---------------- */

function startGame() {
  const input = $("#player-name");
  const name = (input.value || "").trim().replace(/\s+/g, " ").slice(0, 30);

  state.name = name || "Энергоменеджер";
  saveLS(NAME_KEY, state.name);

  resetRun();
  initAudit();
  showScreen("audit");
  sfx("start");
}

function restartGame() {
  resetRun();
  initAudit();
  $("#certificate").classList.remove("show");
  showScreen("audit");
  sfx("start");
}

/* ---------------- инициализация ---------------- */

function initSound() {
  audio.enabled = readLS(SOUND_KEY) !== "off";
  updateSoundButton();
}

function toggleSound() {
  audio.enabled = !audio.enabled;
  saveLS(SOUND_KEY, audio.enabled ? "on" : "off");
  updateSoundButton();
  if (audio.enabled) sfx("click");
}

function bindEvents() {
  $("#btn-start").addEventListener("click", startGame);
  $("#btn-sound").addEventListener("click", toggleSound);

  $("#player-name").addEventListener("keydown", (event) => {
    if (event.key === "Enter") startGame();
  });

  $("#audit-grid").addEventListener("click", onAuditClick);
  $("#fact-sheet-close").addEventListener("click", () => {
    $("#fact-sheet").classList.remove("show");
  });
  $("#zone-grid").addEventListener("click", onBudgetPick);
  $("#quiz-options").addEventListener("click", onQuizPick);

  $("#btn-audit-next").addEventListener("click", () => {
    initBudget();
    showScreen("budget");
    sfx("click");
  });

  $("#btn-budget-check").addEventListener("click", checkBudget);

  $("#btn-budget-next").addEventListener("click", () => {
    initSort();
    showScreen("sort");
    sfx("click");
  });

  $$("#sort-card [data-choice]").forEach((btn) => {
    btn.addEventListener("click", () => answerSort(btn.dataset.choice));
  });

  $("#btn-quiz-next").addEventListener("click", onQuizNext);
  $("#btn-print").addEventListener("click", () => window.print());
  $("#btn-restart").addEventListener("click", restartGame);
}

function init() {
  resetRun();
  bindEvents();
  initSound();

  const savedName = readLS(NAME_KEY);
  if (savedName) $("#player-name").value = savedName;

  const best = Number(readLS(BEST_KEY) || 0);
  if (best > 0) {
    const heroBest = $("#hero-best");
    heroBest.textContent = "Твой лучший результат: " + best + " из 400 очков";
    heroBest.hidden = false;
  }

  showScreen("start");
}

init();
