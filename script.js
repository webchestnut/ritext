/* ==========================================================================
   ritext — логика приложения
   Разделы:
     1. Транслитерация
     2. Алфавит и вставка букв
     3. Редактор (contenteditable) + синхронизация с результатом
     4. Панель форматирования (жирный/курсив/подчёркивание/шрифт/размер)
     5. История изменений и кнопка «Обратно»
     6. Копирование / удаление (+ сброс состояния)
     7. Смена языка (перевод)
     8. Экспорт (TXT / PDF / DOCX) + ориентиры разрывов страниц
     9. Полноэкранный режим главного поля
     10. Смена темы (тёмная/светлая)
     11. Toast-уведомления
     12. Выбор тона (прозрачное «стекло» как у Apple)
     13. Язык интерфейса (RU / EN / LV) и плавные анимации
   ========================================================================== */

(() => {
  'use strict';

  /* ------------------------------------------------------------------ */
  /* 0. Локализация интерфейса (нужна раньше всего остального)           */
  /* ------------------------------------------------------------------ */

  // на время первой отрисовки отключаем CSS-переходы, чтобы при загрузке
  // не проигрывалась «анимация» из значений по умолчанию в сохранённые
  document.documentElement.classList.add('is-booting');

  const SUPPORTED_LANGS = ['ru', 'en', 'lv'];
  const SITE_LANG_STORAGE_KEY = 'translit-site-lang';

  const I18N = {
    ru: {
      docTitle: 'ritext',
      animate: 'Анимировать', animateStop: 'Остановить', toastPickToneFirst: 'Сначала выберите тон',
      expand: 'Во весь экран', collapse: 'Свернуть',
      expandAriaOn: 'Развернуть поле текста на весь экран', expandAriaOff: 'Свернуть поле текста',
      themeLight: 'Светлая тема', themeDark: 'Тёмная тема', themeAria: 'Переключить тему',
      toneBtn: 'Выбрать тон', toneTitle: 'Тон интерфейса', tonePopAria: 'Выбор тона интерфейса',
      toneGridAria: 'Готовые тона', toneCustom: 'Свой цвет',
      tone_none: 'Без тона', tone_orange: 'Оранжевый', tone_red: 'Красный', tone_pink: 'Розовый',
      tone_purple: 'Фиолетовый', tone_blue: 'Синий', tone_teal: 'Бирюзовый', tone_green: 'Зелёный',
      tone_yellow: 'Жёлтый', tone_graphite: 'Графит',
      siteLangAria: 'Язык сайта',
      exportLabel: 'Экспорт', exportAria: 'Экспорт документа',
      alphabetAria: 'Русский алфавит', insertLetter: 'Вставить букву {letter}',
      closeFull: 'Закрыть полноэкранный режим',
      fmtBold: 'Жирный', fmtItalic: 'Курсив', fmtUnderline: 'Подчёркивание', fmtFont: 'Шрифт',
      fmtSizeDown: 'Уменьшить размер', fmtSizeUp: 'Увеличить размер',
      fontDefault: 'Обычный текст',
      langBtn: 'Язык ▾', lang_ru: 'Русский язык', lang_en: 'Английский язык', lang_lv: 'Латышский язык',
      revertLang: 'Исходный язык', undo: '↺ Обратно', copy: 'Копировать', clear: 'Удалить',
      editorPlaceholder: 'Начните печатать здесь…', resultTitle: 'Транслит',
      resultPlaceholder: 'Здесь появится транслит…',
      toastSelectFirst: 'Сначала выделите текст', toastNothingUndo: 'Нечего отменять', toastUndone: 'Отменено',
      toastNothingCopy: 'Нечего копировать', toastCopied: 'Скопировано',
      toastNothingTranslate: 'Нечего переводить', toastTranslating: 'Переводим…',
      toastTranslated: 'Переведено: {lang}', toastTranslateFail: 'Не удалось перевести — проверьте интернет',
      toastReverted: 'Возвращён исходный текст',
      toastNothingExport: 'Нечего экспортировать', toastSaved: 'Файл сохранён',
      toastPdfPreparing: 'Готовим PDF…', toastPdfFail: 'Не удалось создать PDF', toastPdfOffline: 'Экспорт PDF недоступен offline',
      toastDocxFail: 'Не удалось создать DOCX', toastDocxOffline: 'Экспорт DOCX недоступен offline',
      toastTone: 'Тон: {name}', toastToneOff: 'Тон отключён', toastToneCustom: 'Тон: свой цвет',
      toastSiteLang: 'Язык сайта: {name}',
      stressBtn: '´ Ударение', stressAria: 'Показать или скрыть ударения',
      stressOn: 'Ударения включены', stressOff: 'Ударения выключены',
      stressEmpty: 'Введите текст для расстановки ударений',
      swapDirAria: 'Кириллица ↔ Латиница', swapToLat: 'Кириллица → Латиница', swapToCyr: 'Латиница → Кириллица',
      toastSwapEmpty: 'Введите текст для переключения'
    },
    en: {
      docTitle: 'ritext',
      animate: 'Animate', animateStop: 'Stop', toastPickToneFirst: 'Choose a tone first',
      expand: 'Full screen', collapse: 'Collapse',
      expandAriaOn: 'Expand the text field to full screen', expandAriaOff: 'Collapse the text field',
      themeLight: 'Light theme', themeDark: 'Dark theme', themeAria: 'Switch theme',
      toneBtn: 'Choose tone', toneTitle: 'Interface tone', tonePopAria: 'Interface tone picker',
      toneGridAria: 'Preset tones', toneCustom: 'Custom color',
      tone_none: 'No tone', tone_orange: 'Orange', tone_red: 'Red', tone_pink: 'Pink',
      tone_purple: 'Purple', tone_blue: 'Blue', tone_teal: 'Teal', tone_green: 'Green',
      tone_yellow: 'Yellow', tone_graphite: 'Graphite',
      siteLangAria: 'Site language',
      exportLabel: 'Export', exportAria: 'Export document',
      alphabetAria: 'Russian alphabet', insertLetter: 'Insert letter {letter}',
      closeFull: 'Close full screen mode',
      fmtBold: 'Bold', fmtItalic: 'Italic', fmtUnderline: 'Underline', fmtFont: 'Font',
      fmtSizeDown: 'Decrease size', fmtSizeUp: 'Increase size',
      fontDefault: 'Default text',
      langBtn: 'Language ▾', lang_ru: 'Russian', lang_en: 'English', lang_lv: 'Latvian',
      revertLang: 'Original language', undo: '↺ Undo', copy: 'Copy', clear: 'Clear',
      editorPlaceholder: 'Start typing here…', resultTitle: 'Translit',
      resultPlaceholder: 'Transliteration will appear here…',
      toastSelectFirst: 'Select some text first', toastNothingUndo: 'Nothing to undo', toastUndone: 'Undone',
      toastNothingCopy: 'Nothing to copy', toastCopied: 'Copied',
      toastNothingTranslate: 'Nothing to translate', toastTranslating: 'Translating…',
      toastTranslated: 'Translated: {lang}', toastTranslateFail: 'Could not translate — check your connection',
      toastReverted: 'Original text restored',
      toastNothingExport: 'Nothing to export', toastSaved: 'File saved',
      toastPdfPreparing: 'Preparing PDF…', toastPdfFail: 'Could not create PDF', toastPdfOffline: 'PDF export is unavailable offline',
      toastDocxFail: 'Could not create DOCX', toastDocxOffline: 'DOCX export is unavailable offline',
      toastTone: 'Tone: {name}', toastToneOff: 'Tone turned off', toastToneCustom: 'Tone: custom color',
      toastSiteLang: 'Site language: {name}',
      stressBtn: '´ Stress', stressAria: 'Show or hide stress marks',
      stressOn: 'Stress marks on', stressOff: 'Stress marks off',
      stressEmpty: 'Enter text to place stress marks',
      swapDirAria: 'Cyrillic ↔ Latin', swapToLat: 'Cyrillic → Latin', swapToCyr: 'Latin → Cyrillic',
      toastSwapEmpty: 'Enter text to switch'
    },
    lv: {
      docTitle: 'ritext',
      animate: 'Animēt', animateStop: 'Apturēt', toastPickToneFirst: 'Vispirms izvēlieties toni',
      expand: 'Pilnekrāna režīms', collapse: 'Samazināt',
      expandAriaOn: 'Izvērst teksta lauku pilnā ekrānā', expandAriaOff: 'Samazināt teksta lauku',
      themeLight: 'Gaišā tēma', themeDark: 'Tumšā tēma', themeAria: 'Pārslēgt tēmu',
      toneBtn: 'Izvēlēties toni', toneTitle: 'Saskarnes tonis', tonePopAria: 'Saskarnes toņa izvēle',
      toneGridAria: 'Gatavie toņi', toneCustom: 'Sava krāsa',
      tone_none: 'Bez toņa', tone_orange: 'Oranžs', tone_red: 'Sarkans', tone_pink: 'Rozā',
      tone_purple: 'Violets', tone_blue: 'Zils', tone_teal: 'Tirkīzs', tone_green: 'Zaļš',
      tone_yellow: 'Dzeltens', tone_graphite: 'Grafīts',
      siteLangAria: 'Vietnes valoda',
      exportLabel: 'Eksports', exportAria: 'Dokumenta eksports',
      alphabetAria: 'Krievu alfabēts', insertLetter: 'Ievietot burtu {letter}',
      closeFull: 'Aizvērt pilnekrāna režīmu',
      fmtBold: 'Treknraksts', fmtItalic: 'Kursīvs', fmtUnderline: 'Pasvītrojums', fmtFont: 'Fonts',
      fmtSizeDown: 'Samazināt izmēru', fmtSizeUp: 'Palielināt izmēru',
      fontDefault: 'Parasts teksts',
      langBtn: 'Valoda ▾', lang_ru: 'Krievu valoda', lang_en: 'Angļu valoda', lang_lv: 'Latviešu valoda',
      revertLang: 'Oriģinālvaloda', undo: '↺ Atpakaļ', copy: 'Kopēt', clear: 'Dzēst',
      editorPlaceholder: 'Sāciet rakstīt šeit…', resultTitle: 'Translits',
      resultPlaceholder: 'Šeit parādīsies translits…',
      toastSelectFirst: 'Vispirms atlasiet tekstu', toastNothingUndo: 'Nav ko atcelt', toastUndone: 'Atcelts',
      toastNothingCopy: 'Nav ko kopēt', toastCopied: 'Nokopēts',
      toastNothingTranslate: 'Nav ko tulkot', toastTranslating: 'Tulkojam…',
      toastTranslated: 'Iztulkots: {lang}', toastTranslateFail: 'Neizdevās iztulkot — pārbaudiet internetu',
      toastReverted: 'Atgriezts oriģinālais teksts',
      toastNothingExport: 'Nav ko eksportēt', toastSaved: 'Fails saglabāts',
      toastPdfPreparing: 'Gatavojam PDF…', toastPdfFail: 'Neizdevās izveidot PDF', toastPdfOffline: 'PDF eksports nav pieejams bezsaistē',
      toastDocxFail: 'Neizdevās izveidot DOCX', toastDocxOffline: 'DOCX eksports nav pieejams bezsaistē',
      toastTone: 'Tonis: {name}', toastToneOff: 'Tonis izslēgts', toastToneCustom: 'Tonis: sava krāsa',
      toastSiteLang: 'Vietnes valoda: {name}',
      stressBtn: '´ Uzsvars', stressAria: 'Rādīt vai paslēpt uzsvarus',
      stressOn: 'Uzsvari ieslēgti', stressOff: 'Uzsvari izslēgti',
      stressEmpty: 'Ievadiet tekstu, lai ieliktu uzsvarus',
      swapDirAria: 'Kirilica ↔ Latīņu', swapToLat: 'Kirilica → Latīņu', swapToCyr: 'Latīņu → Kirilica',
      toastSwapEmpty: 'Ievadiet tekstu, lai pārslēgtu'
    }
  };

  let siteLang = 'ru';
  try {
    const savedLang = localStorage.getItem(SITE_LANG_STORAGE_KEY);
    if (SUPPORTED_LANGS.includes(savedLang)) siteLang = savedLang;
  } catch (err) { /* недоступно — не критично */ }

  // t('ключ', { переменная: значение }) — текст на текущем языке сайта
  function t(key, vars) {
    const raw = (I18N[siteLang] && I18N[siteLang][key]) ?? I18N.ru[key] ?? key;
    return String(raw).replace(/\{(\w+)\}/g, (m, name) =>
      vars && vars[name] !== undefined ? vars[name] : m);
  }

  /* ------------------------------------------------------------------ */
  /* 1. Транслитерация                                                   */
  /* ------------------------------------------------------------------ */

  const TRANSLIT_MAP = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
    'е': 'e', 'ё': 'e', 'ж': 'zh', 'з': 'z', 'и': 'i',
    'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
    'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
    'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch',
    'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '',
    'э': 'e', 'ю': 'yu', 'я': 'ya'
  };

  function transliterateChar(ch) {
    const lower = ch.toLowerCase();
    const mapped = TRANSLIT_MAP[lower];
    if (mapped === undefined) return ch;
    if (ch === lower) return mapped;
    return mapped.charAt(0).toUpperCase() + mapped.slice(1);
  }

  function transliterate(text) {
    let out = '';
    for (const ch of text) out += transliterateChar(ch);
    return out;
  }

  // Латиница → кириллица (для кнопки ⇄). Обрабатываем длинные сочетания первыми.
  const LAT_TO_CYR_SEQ = [
    ['shch', 'щ'], ['Shch', 'Щ'], ['SHCH', 'Щ'],
    ['sch', 'щ'], ['Sch', 'Щ'], ['SCH', 'Щ'],
    ['zh', 'ж'], ['Zh', 'Ж'], ['ZH', 'Ж'],
    ['kh', 'х'], ['Kh', 'Х'], ['KH', 'Х'],
    ['ts', 'ц'], ['Ts', 'Ц'], ['TS', 'Ц'],
    ['ch', 'ч'], ['Ch', 'Ч'], ['CH', 'Ч'],
    ['sh', 'ш'], ['Sh', 'Ш'], ['SH', 'Ш'],
    ['yu', 'ю'], ['Yu', 'Ю'], ['YU', 'Ю'],
    ['ya', 'я'], ['Ya', 'Я'], ['YA', 'Я'],
    ['yo', 'ё'], ['Yo', 'Ё'], ['YO', 'Ё'],
    ['ye', 'е'], ['Ye', 'Е'], ['YE', 'Е']
  ];
  const LAT_TO_CYR_CHAR = {
    a: 'а', b: 'б', v: 'в', g: 'г', d: 'д', e: 'е', z: 'з', i: 'и',
    y: 'й', k: 'к', l: 'л', m: 'м', n: 'н', o: 'о', p: 'п', r: 'р',
    s: 'с', t: 'т', u: 'у', f: 'ф', h: 'х',
    A: 'А', B: 'Б', V: 'В', G: 'Г', D: 'Д', E: 'Е', Z: 'З', I: 'И',
    Y: 'Й', K: 'К', L: 'Л', M: 'М', N: 'Н', O: 'О', P: 'П', R: 'Р',
    S: 'С', T: 'Т', U: 'У', F: 'Ф', H: 'Х'
  };

  function latinToCyrillic(text) {
    let out = '';
    let i = 0;
    while (i < text.length) {
      let matched = false;
      for (const [lat, cyr] of LAT_TO_CYR_SEQ) {
        if (text.substr(i, lat.length) === lat) {
          out += cyr;
          i += lat.length;
          matched = true;
          break;
        }
      }
      if (matched) continue;
      const ch = text[i];
      out += LAT_TO_CYR_CHAR[ch] !== undefined ? LAT_TO_CYR_CHAR[ch] : ch;
      i += 1;
    }
    return out;
  }

  function isMostlyCyrillic(text) {
    const cyr = (text.match(/[а-яёА-ЯЁ]/g) || []).length;
    const lat = (text.match(/[a-zA-Z]/g) || []).length;
    return cyr >= lat;
  }

  /* ------------------------------------------------------------------ */
  /* 1b. Ударения (словарь + применение)                                  */
  /* ------------------------------------------------------------------ */

  // Только знак ударения (combining acute U+0301). Не трогаем й/ё и прочие
  // диакритики — иначе NFD ломает «й» → «и» и словарь перестаёт находить слова.
  const STRESS_MARK = '\u0301';

  function removeStressMarks(text) {
    // Удаляем только акут ударения, оставляя й, ё и т.п. нетронутыми
    return text.replace(/\u0301/g, '');
  }

  // Словарь: ключ — слово в нижнем регистре БЕЗ ударения,
  // значение — индекс ударной гласной (0-based) в этом слове.
  // Так надёжнее, чем хранить готовые строки с диакритикой.
  // Индекс указывает на гласную, после которой ставится ́.
  const VOWELS = new Set('аеёиоуыэюяАЕЁИОУЫЭЮЯ'.split(''));

  // [слово, индекс_ударной_гласной]
  const STRESS_ENTRIES = [
    // приветствия
    ['привет', 4], ['здравствуйте', 3], ['здравствуй', 3],
    ['спасибо', 4], ['пожалуйста', 3], ['досвидания', 6],
    ['прощай', 4], ['доброе', 1], ['утро', 0],
    ['вечер', 1], ['сегодня', 3], ['завтра', 1],
    ['вчера', 4], ['сейчас', 4], ['всегда', 5], ['никогда', 6],
    // местоимения / вопросы
    ['она', 2], ['оно', 2], ['они', 2],
    ['куда', 3], ['откуда', 3], ['когда', 4], ['почему', 5],
    ['зачем', 3], ['какой', 3], ['какая', 3], ['какое', 3], ['какие', 3],
    ['сколько', 2],
    // существительные
    ['человек', 5], ['люди', 1], ['мужчина', 1], ['женщина', 1],
    ['ребёнок', 3], ['ребенок', 3], ['дети', 1],
    ['друзья', 5], ['семья', 4], ['мама', 1], ['папа', 1],
    ['отец', 2], ['сестра', 5], ['жена', 3], ['имя', 0],
    ['город', 1], ['страна', 5], ['россия', 4],
    ['москва', 5], ['москве', 5], ['москвы', 5], ['москву', 5], ['москвой', 5],
    ['петербург', 6], ['улица', 0], ['улице', 0], ['улицы', 0], ['улицу', 0],
    ['квартира', 5], ['школа', 2], ['университет', 9], ['работа', 3],
    ['время', 2], ['месяц', 1], ['неделя', 3],
    ['минута', 3], ['секунда', 3], ['книга', 2],
    ['письмо', 5], ['телефон', 5], ['компьютер', 5],
    ['интернет', 6], ['язык', 2], ['русский', 1],
    ['английский', 4], ['любовь', 3], ['счастье', 2],
    ['вода', 3], ['молоко', 5], ['еда', 2], ['деньги', 1],
    ['машина', 3], ['автобус', 3], ['поезд', 1],
    ['самолёт', 5], ['самолет', 5],
    ['щербаков', 6], ['щербакова', 6], ['щербакову', 6], ['щербаковым', 6],
    // глаголы
    ['иметь', 2], ['делать', 1], ['говорить', 5], ['сказать', 4],
    ['думать', 1], ['хотеть', 3], ['видеть', 1], ['слышать', 2],
    ['идти', 3], ['ехать', 0], ['живу', 3], ['живёт', 3], ['живет', 3],
    ['работать', 3], ['учиться', 2], ['читать', 3],
    ['писать', 3], ['любить', 3], ['нравиться', 2],
    ['понимать', 5], ['помнить', 1], ['забыть', 3],
    ['прийти', 5], ['уйти', 3], ['открыть', 4], ['закрыть', 4],
    ['начать', 3], ['кончить', 1], ['закончить', 3],
    // прилагательные / наречия
    ['большой', 5], ['маленький', 1], ['хороший', 3],
    ['плохой', 4], ['новый', 1], ['старый', 2],
    ['красивый', 4], ['интересный', 5], ['важный', 1],
    ['первый', 1], ['последний', 4], ['другой', 4],
    ['очень', 0], ['много', 2], ['мало', 1], ['хорошо', 5],
    ['плохо', 2], ['быстро', 1], ['медленно', 1],
    ['ещё', 2], ['еще', 2], ['уже', 2], ['тоже', 1],
    ['только', 1], ['почти', 4], ['совсем', 4], ['иногда', 5],
    // указательные / притяжательные
    ['это', 0], ['этот', 0], ['эта', 0], ['эти', 0],
    ['того', 3], ['тому', 3],
    ['моя', 2], ['моё', 2], ['мое', 2], ['мои', 2],
    ['твоя', 3], ['твоё', 3], ['твое', 3], ['твои', 3],
    ['наша', 1], ['наше', 1], ['наши', 1],
    ['ваша', 1], ['ваше', 1], ['ваши', 1],
    ['его', 2], ['её', 1], ['ее', 1],
    ['себя', 3], ['себе', 3], ['собой', 3],
    // доп. частые
    ['потому', 5], ['поэтому', 2], ['сейчас', 4],
    ['можно', 1], ['нужно', 1], ['нельзя', 5],
    ['здесь', 2], ['теперь', 3], ['потом', 3],
    ['сначала', 4], ['наконец', 5], ['вдруг', 2],
    ['пример', 4], ['вопрос', 4], ['ответ', 3],
    ['слово', 2], 'текст', // handled below
  ];

  // Собираем Map: слово → индекс гласной
  const STRESS_DICT = new Map();
  for (const entry of STRESS_ENTRIES) {
    if (typeof entry === 'string') continue; // skip accidental
    const [word, idx] = entry;
    if (typeof word === 'string' && typeof idx === 'number') {
      STRESS_DICT.set(word, idx);
    }
  }
  // Дополнения одной строкой
  STRESS_DICT.set('текст', 1);
  STRESS_DICT.set('пример', 4);
  STRESS_DICT.set('день', 1); // single syllable — stress on the vowel
  STRESS_DICT.set('ночь', 1);
  STRESS_DICT.set('год', 1);
  STRESS_DICT.set('час', 1);
  STRESS_DICT.set('дом', 1);
  STRESS_DICT.set('друг', 2);
  STRESS_DICT.set('сын', 1);
  STRESS_DICT.set('брат', 2);
  STRESS_DICT.set('муж', 1);
  STRESS_DICT.set('мать', 1);
  STRESS_DICT.set('дочь', 1);
  STRESS_DICT.set('мир', 1);
  STRESS_DICT.set('жизнь', 1);
  STRESS_DICT.set('хлеб', 2);
  STRESS_DICT.set('я', 0);
  STRESS_DICT.set('ты', 1);
  STRESS_DICT.set('он', 0);
  STRESS_DICT.set('мы', 1);
  STRESS_DICT.set('вы', 1);
  STRESS_DICT.set('кто', 2);
  STRESS_DICT.set('что', 2);
  STRESS_DICT.set('где', 2);
  STRESS_DICT.set('как', 1);
  STRESS_DICT.set('чей', 1);
  STRESS_DICT.set('там', 1);
  STRESS_DICT.set('тут', 1);

  function vowelIndices(lower) {
    const idxs = [];
    for (let i = 0; i < lower.length; i++) {
      if (VOWELS.has(lower[i])) idxs.push(i);
    }
    return idxs;
  }

  function applyStressToWord(word) {
    const clean = removeStressMarks(word);
    const lower = clean.toLowerCase();
    const vowels = vowelIndices(lower);

    // Односложные — тоже помечаем (пользователь просил ударение на всех словах)
    let stressIdx;
    if (STRESS_DICT.has(lower)) {
      stressIdx = STRESS_DICT.get(lower);
      if (stressIdx < 0 || stressIdx >= lower.length || !VOWELS.has(lower[stressIdx])) {
        // битый индекс в словаре — fallback
        stressIdx = vowels.length ? vowels[vowels.length - 1] : -1;
      }
    } else if (vowels.length >= 1) {
      // Нет в словаре: ставим ударение на последнюю гласную
      // (частотный дефолт; для известных слов словарь точнее)
      stressIdx = vowels[vowels.length - 1];
    } else {
      return word; // нет гласных
    }

    let result = '';
    for (let i = 0; i < clean.length; i++) {
      result += clean[i];
      if (i === stressIdx) result += STRESS_MARK;
    }
    return result;
  }

  function applyStressToText(text) {
    return text.replace(/[а-яёА-ЯЁ]+/g, applyStressToWord);
  }

  function countStressedWords(text) {
    const words = text.match(/[а-яёА-ЯЁ]+/g) || [];
    return words.filter((w) => {
      const lower = removeStressMarks(w).toLowerCase();
      return vowelIndices(lower).length >= 1;
    }).length;
  }

  // Меняем только текстовые узлы внутри редактора — B/I/U/шрифт/размер не трогаем
  function transformEditorTextNodes(transformFn) {
    const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT, null);
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);
    for (const textNode of nodes) {
      const next = transformFn(textNode.nodeValue);
      if (next !== textNode.nodeValue) textNode.nodeValue = next;
    }
  }

  function applyStressInEditor() {
    transformEditorTextNodes((value) =>
      value.replace(/[а-яёА-ЯЁ\u0301]+/g, (word) => applyStressToWord(word))
    );
  }

  function removeStressInEditor() {
    transformEditorTextNodes((value) => removeStressMarks(value));
  }

  let stressOn = false;

  /* ------------------------------------------------------------------ */
  /* 2. Алфавит и вставка букв                                           */
  /* ------------------------------------------------------------------ */

  const ALPHABET = [
    'а', 'б', 'в', 'г', 'д', 'е', 'ё', 'ж', 'з', 'и',
    'й', 'к', 'л', 'м', 'н', 'о', 'п', 'р', 'с', 'т',
    'у', 'ф', 'х', 'ц', 'ч', 'ш', 'щ', 'ъ', 'ы', 'ь',
    'э', 'ю', 'я'
  ];

  const alphabetEl = document.getElementById('alphabet');
  const editor = document.getElementById('editor');

  ALPHABET.forEach((letter) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'letter-key';
    btn.textContent = letter;
    btn.dataset.letter = letter;
    btn.setAttribute('aria-label', t('insertLetter', { letter }));

    btn.addEventListener('mousedown', (e) => e.preventDefault());
    btn.addEventListener('click', () => insertTextAtCursor(letter));

    alphabetEl.appendChild(btn);
  });

  function insertTextAtCursor(text) {
    editor.focus();

    const sel = window.getSelection();
    let range;

    if (sel.rangeCount > 0 && editor.contains(sel.anchorNode)) {
      range = sel.getRangeAt(0);
      range.deleteContents();
    } else {
      range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
    }

    const textNode = document.createTextNode(text);
    range.insertNode(textNode);

    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    sel.removeAllRanges();
    sel.addRange(range);

    updateResult();
    updatePageGuides();
  }

  /* ------------------------------------------------------------------ */
  /* 3. Редактор: синхронизация с панелью результата                     */
  /* ------------------------------------------------------------------ */

  const resultEl = document.getElementById('result');

  function updateResult() {
    // Убираем знаки ударения перед транслитом — в латинице они не нужны
    const sourceText = removeStressMarks(editor.innerText.replace(/\u00A0/g, ' '));
    if (!sourceText.trim()) {
      resultEl.textContent = '';
      return;
    }
    // Всегда показываем «другую» сторону:
    // кириллица в редакторе → латиница справа; латиница в редакторе → кириллица справа
    if (isMostlyCyrillic(sourceText)) {
      resultEl.textContent = transliterate(sourceText);
    } else {
      resultEl.textContent = latinToCyrillic(sourceText);
    }
  }

  /* ------------------------------------------------------------------ */
  /* 4. Панель форматирования (всегда видна в панели инструментов)        */
  /* ------------------------------------------------------------------ */

  const FONT_OPTIONS = [
    { label: 'Space Grotesk', stack: "'Space Grotesk', sans-serif" },
    { label: 'IBM Plex Mono', stack: "'IBM Plex Mono', monospace" },
    { label: 'Unbounded', stack: "'Unbounded', sans-serif" },
    { label: 'DM Mono', stack: "'DM Mono', monospace" },
    { label: 'Manrope', stack: "'Manrope', sans-serif" },
    { label: 'Sora', stack: "'Sora', sans-serif" },
    { label: 'Fraunces', stack: "'Fraunces', serif" },
    { label: 'JetBrains Mono', stack: "'JetBrains Mono', monospace" },
    { labelKey: 'fontDefault', stack: 'inherit' }
  ];

  const fmtBold = document.getElementById('fmtBold');
  const fmtItalic = document.getElementById('fmtItalic');
  const fmtUnderline = document.getElementById('fmtUnderline');
  const fmtFontBtn = document.getElementById('fmtFontBtn');
  const fontMenu = document.getElementById('fontMenu');
  const fmtSizeDown = document.getElementById('fmtSizeDown');
  const fmtSizeUp = document.getElementById('fmtSizeUp');
  const langMenuEl = document.getElementById('langMenu');

  let savedRange = null;

  function restoreSavedSelection() {
    if (!savedRange) return false;
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(savedRange);
    return true;
  }

  function hasUsableSelection() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount && !sel.isCollapsed) {
      const r = sel.getRangeAt(0);
      if (editor.contains(r.startContainer) && editor.contains(r.endContainer)) return true;
    }
    return !!(savedRange && !savedRange.collapsed);
  }

  function refreshActiveStates() {
    try {
      fmtBold.classList.toggle('active', document.queryCommandState('bold'));
      fmtItalic.classList.toggle('active', document.queryCommandState('italic'));
      fmtUnderline.classList.toggle('active', document.queryCommandState('underline'));
    } catch (err) {
      // queryCommandState может бросить исключение вне фокуса — не критично
    }
  }

  function clearActiveStates() {
    fmtBold.classList.remove('active');
    fmtItalic.classList.remove('active');
    fmtUnderline.classList.remove('active');
  }

  document.addEventListener('selectionchange', () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;

    const range = sel.getRangeAt(0);
    const withinEditor =
      editor.contains(range.startContainer) && editor.contains(range.endContainer);

    if (withinEditor && range.toString().trim()) {
      savedRange = range.cloneRange();
      refreshActiveStates();
    }
  });

  document.addEventListener('mousedown', (e) => {
    if (!e.target.closest('.fmt-font-wrap')) fontMenu.classList.remove('open');
    if (!e.target.closest('.lang-wrap')) langMenuEl.classList.remove('open');
  });

  function wrapSelectionInSpan(applyStyles) {
    pushHistory();
    restoreSavedSelection();
    const sel = window.getSelection();
    if (!sel.rangeCount) return null;

    const range = sel.getRangeAt(0);
    if (range.collapsed) return null;

    const span = document.createElement('span');
    applyStyles(span, range);

    try {
      range.surroundContents(span);
    } catch (err) {
      const content = range.extractContents();
      span.appendChild(content);
      range.insertNode(span);
    }

    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    sel.removeAllRanges();
    sel.addRange(newRange);
    savedRange = newRange.cloneRange();

    updateResult();
    return span;
  }

  function applyFontToSelection(fontStack) {
    wrapSelectionInSpan((span) => {
      if (fontStack !== 'inherit') span.style.fontFamily = fontStack;
    });
  }

  function adjustFontSize(step) {
    wrapSelectionInSpan((span, range) => {
      let refNode = range.commonAncestorContainer;
      if (refNode.nodeType === Node.TEXT_NODE) refNode = refNode.parentElement;
      const current = parseFloat(getComputedStyle(refNode).fontSize) || 17;
      const next = Math.max(11, Math.min(40, Math.round(current + step)));
      span.style.fontSize = `${next}px`;
    });
  }

  FONT_OPTIONS.forEach((font) => {
    const li = document.createElement('li');
    li.tabIndex = 0;

    const nameSpan = document.createElement('span');
    nameSpan.className = 'font-preview-label';
    if (font.labelKey) {
      nameSpan.dataset.i18n = font.labelKey;
      nameSpan.textContent = t(font.labelKey);
    } else {
      nameSpan.textContent = font.label;
    }
    nameSpan.style.fontFamily = font.stack;
    li.appendChild(nameSpan);

    li.addEventListener('mousedown', (e) => e.preventDefault());
    li.addEventListener('click', () => {
      if (!hasUsableSelection()) {
        showToast(t('toastSelectFirst'));
        fontMenu.classList.remove('open');
        return;
      }
      applyFontToSelection(font.stack);
      fontMenu.classList.remove('open');
    });
    li.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); li.click(); }
    });

    fontMenu.appendChild(li);
  });

  [fmtBold, fmtItalic, fmtUnderline, fmtFontBtn, fmtSizeDown, fmtSizeUp].forEach((btn) => {
    btn.addEventListener('mousedown', (e) => e.preventDefault());
  });

  function runFormatCommand(command) {
    if (!hasUsableSelection()) { showToast(t('toastSelectFirst')); return; }
    pushHistory();
    restoreSavedSelection();
    document.execCommand(command);
    const sel = window.getSelection();
    if (sel.rangeCount) savedRange = sel.getRangeAt(0).cloneRange();
    updateResult();
    refreshActiveStates();
  }

  fmtBold.addEventListener('click', () => runFormatCommand('bold'));
  fmtItalic.addEventListener('click', () => runFormatCommand('italic'));
  fmtUnderline.addEventListener('click', () => runFormatCommand('underline'));

  fmtFontBtn.addEventListener('click', () => {
    const isOpen = fontMenu.classList.contains('open');
    if (isOpen) { fontMenu.classList.remove('open'); return; }
    if (!hasUsableSelection()) { showToast(t('toastSelectFirst')); return; }
    const rect = fmtFontBtn.getBoundingClientRect();
    fontMenu.style.top = `${rect.bottom + 6}px`;
    fontMenu.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - 206))}px`;
    fontMenu.classList.add('open');
  });

  fmtSizeDown.addEventListener('click', () => {
    if (!hasUsableSelection()) { showToast(t('toastSelectFirst')); return; }
    adjustFontSize(-2);
  });
  fmtSizeUp.addEventListener('click', () => {
    if (!hasUsableSelection()) { showToast(t('toastSelectFirst')); return; }
    adjustFontSize(2);
  });

  /* ------------------------------------------------------------------ */
  /* 5. История изменений и кнопка «Обратно»                              */
  /* ------------------------------------------------------------------ */

  const undoBtn = document.getElementById('undoBtn');
  const historyStack = [];
  let isTypingBurst = false;
  let typingIdleTimer = null;

  function pushHistory() {
    historyStack.push(editor.innerHTML);
    if (historyStack.length > 60) historyStack.shift();
  }

  function undo() {
    if (!historyStack.length) { showToast(t('toastNothingUndo')); return; }
    editor.innerHTML = historyStack.pop();
    isTypingBurst = false;
    updateResult();
    updatePageGuides();
    refreshActiveStates();
    showToast(t('toastUndone'));
  }

  undoBtn.addEventListener('mousedown', (e) => e.preventDefault());
  undoBtn.addEventListener('click', undo);

  // фиксируем состояние ДО начала новой «пачки» правок при обычном наборе
  // текста — так «Обратно» откатывает разумными кусками, а не по букве
  editor.addEventListener('beforeinput', () => {
    if (!isTypingBurst) {
      pushHistory();
      isTypingBurst = true;
    }
  });

  // тяжёлые пересчёты (транслит, линии страниц) — не чаще одного раза за кадр
  let inputFrame = null;

  editor.addEventListener('input', () => {
    if (!inputFrame) {
      inputFrame = requestAnimationFrame(() => {
        inputFrame = null;
        updateResult();
        updatePageGuides();
      });
    }
    clearTimeout(typingIdleTimer);
    typingIdleTimer = setTimeout(() => { isTypingBurst = false; }, 900);
  });

  /* ------------------------------------------------------------------ */
  /* 6. Копирование / удаление (+ полный сброс состояния)                */
  /* ------------------------------------------------------------------ */

  const clearInputBtn = document.getElementById('clearInput');
  const clearOutputBtn = document.getElementById('clearOutput');
  const copyInputBtn = document.getElementById('copyInput');
  const copyOutputBtn = document.getElementById('copyOutput');

  function resetEditorState() {
    savedRange = null;
    clearActiveStates();
    fontMenu.classList.remove('open');
    langMenuEl.classList.remove('open');
    resetTranslationState();
    // сброс режима ударений
    stressOn = false;
    const sBtn = document.getElementById('stressBtn');
    if (sBtn) {
      sBtn.classList.remove('active');
      sBtn.setAttribute('aria-pressed', 'false');
    }
  }

  clearInputBtn.addEventListener('click', () => {
    if (editor.innerHTML) pushHistory();
    editor.innerHTML = '';
    resetEditorState();
    updateResult();
    updatePageGuides();
    editor.focus();
  });

  clearOutputBtn.addEventListener('click', () => {
    if (editor.innerHTML) pushHistory();
    editor.innerHTML = '';
    resetEditorState();
    updateResult();
    updatePageGuides();
  });

  copyInputBtn.addEventListener('click', async () => {
    const text = editor.innerText;
    if (!text.trim()) { showToast(t('toastNothingCopy')); return; }
    await copyPlainText(text);
  });

  copyOutputBtn.addEventListener('click', async () => {
    const text = resultEl.textContent;
    if (!text) { showToast(t('toastNothingCopy')); return; }
    await copyPlainText(text);
  });

  async function copyPlainText(text) {
    try {
      await navigator.clipboard.writeText(text);
      showToast(t('toastCopied'));
    } catch (err) {
      const temp = document.createElement('textarea');
      temp.value = text;
      temp.style.position = 'fixed';
      temp.style.opacity = '0';
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      temp.remove();
      showToast(t('toastCopied'));
    }
  }

  /* ------------------------------------------------------------------ */
  /* 6b. Ударение + ⇄ (кириллица ↔ латиница)                              */
  /* ------------------------------------------------------------------ */

  const stressBtn = document.getElementById('stressBtn');
  const swapDirBtn = document.getElementById('swapDirBtn');

  if (stressBtn) {
    stressBtn.addEventListener('mousedown', (e) => e.preventDefault());
    stressBtn.addEventListener('click', () => {
      const plain = editor.innerText.replace(/\u00A0/g, ' ').trim();
      if (!plain) {
        showToast(t('stressEmpty'));
        return;
      }

      // Ударения имеют смысл только для кириллицы
      if (!isMostlyCyrillic(plain)) {
        showToast(t('stressEmpty'));
        return;
      }

      pushHistory();
      stressOn = !stressOn;
      stressBtn.classList.toggle('active', stressOn);
      stressBtn.setAttribute('aria-pressed', String(stressOn));

      if (stressOn) {
        // Меняем только текст в текстовых узлах — форматирование (B/I/U/шрифт/размер) сохраняется
        applyStressInEditor();
        const found = countStressedWords(removeStressMarks(plain));
        showToast(found > 0 ? t('stressOn') + ' (' + found + ')' : t('stressOn'));
      } else {
        removeStressInEditor();
        showToast(t('stressOff'));
      }

      updateResult();
      updatePageGuides();
      editor.focus();
    });
  }

  if (swapDirBtn) {
    swapDirBtn.addEventListener('mousedown', (e) => e.preventDefault());
    swapDirBtn.addEventListener('click', () => {
      const plain = editor.innerText.replace(/\u00A0/g, ' ');
      if (!plain.trim()) {
        showToast(t('toastSwapEmpty'));
        return;
      }

      pushHistory();
      // При переключении направления снимаем ударения (они имеют смысл только в кириллице)
      const clean = removeStressMarks(plain);
      stressOn = false;
      if (stressBtn) {
        stressBtn.classList.remove('active');
        stressBtn.setAttribute('aria-pressed', 'false');
      }

      let result;
      if (isMostlyCyrillic(clean)) {
        result = transliterate(clean);
        showToast(t('swapToLat'));
      } else {
        result = latinToCyrillic(clean);
        showToast(t('swapToCyr'));
      }

      editor.innerText = result;
      updateResult();
      updatePageGuides();
      editor.focus();
    });
  }

  /* ------------------------------------------------------------------ */
  /* 7. Смена языка (перевод)                                             */
  /* ------------------------------------------------------------------ */

  const langBtn = document.getElementById('langBtn');
  const revertLangBtn = document.getElementById('revertLangBtn');

  let originalHtmlBeforeTranslation = null;
  let isTranslated = false;

  function resetTranslationState() {
    originalHtmlBeforeTranslation = null;
    isTranslated = false;
    revertLangBtn.classList.add('is-hidden');
  }

  langBtn.addEventListener('mousedown', (e) => e.preventDefault());
  langBtn.addEventListener('click', () => langMenuEl.classList.toggle('open'));

  Array.from(langMenuEl.children).forEach((li) => {
    li.tabIndex = 0;
    li.addEventListener('mousedown', (e) => e.preventDefault());
    li.addEventListener('click', () => {
      langMenuEl.classList.remove('open');
      translateEditorTo(li.dataset.lang);
    });
    li.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); li.click(); }
    });
  });

  revertLangBtn.addEventListener('mousedown', (e) => e.preventDefault());
  revertLangBtn.addEventListener('click', () => {
    if (originalHtmlBeforeTranslation === null) return;
    editor.innerHTML = originalHtmlBeforeTranslation;
    resetTranslationState();
    updateResult();
    updatePageGuides();
    showToast(t('toastReverted'));
  });

  async function translateEditorTo(langCode) {
    const text = editor.innerText;
    if (!text.trim()) { showToast(t('toastNothingTranslate')); return; }

    pushHistory();
    if (!isTranslated) originalHtmlBeforeTranslation = editor.innerHTML;

    showToast(t('toastTranslating'));

    try {
      const translated = await translateText(text, langCode);
      setEditorPlainText(translated);
      isTranslated = true;
      revertLangBtn.classList.remove('is-hidden');
      updateResult();
      updatePageGuides();
      showToast(t('toastTranslated', { lang: t('lang_' + langCode) }));
    } catch (err) {
      showToast(t('toastTranslateFail'));
    }
  }

  async function translateText(text, targetLang) {
    const url =
      'https://translate.googleapis.com/translate_a/single' +
      `?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('translate request failed');

    const data = await res.json();
    if (!Array.isArray(data) || !Array.isArray(data[0])) throw new Error('unexpected response');

    return data[0].map((chunk) => chunk[0]).join('');
  }

  // Заменяет содержимое редактора обычным текстом (переносы строк — <br>),
  // ЧТО СТИРАЕТ вставленные фото/видео и форматирование — у переведённого
  // текста другой набор слов, перенести их один-в-один невозможно.
  // «Исходный язык» полностью восстанавливает всё как было.
  function setEditorPlainText(text) {
    const holder = document.createElement('div');
    const lines = text.split('\n');
    lines.forEach((line, i) => {
      holder.appendChild(document.createTextNode(line));
      if (i < lines.length - 1) holder.appendChild(document.createElement('br'));
    });
    editor.innerHTML = holder.innerHTML;
  }

  /* ------------------------------------------------------------------ */
  /* 8. Экспорт (TXT / PDF / DOCX) + ориентиры разрывов страниц          */
  /* ------------------------------------------------------------------ */

  // Один «условный» экран-страница A4 в собственных пикселях редактора —
  // приблизительный ориентир, подобранный под текущий базовый размер
  // шрифта/межстрочный интервал. Это визуальная подсказка, а не точный
  // расчёт реального разбиения — оно зависит от программы-читалки.
  const PAGE_GUIDE_HEIGHT = 1150;
  const pageGuidesEl = document.getElementById('pageGuides');

  function updatePageGuides() {
    const total = editor.scrollHeight;
    const count = Math.max(0, Math.floor(total / PAGE_GUIDE_HEIGHT));
    let html = '';
    for (let i = 1; i <= count; i++) {
      html += `<div class="page-guide-line" style="top:${i * PAGE_GUIDE_HEIGHT}px">` +
        `<span class="page-guide-label">стр. ${i + 1}</span></div>`;
    }
    pageGuidesEl.innerHTML = html;
    pageGuidesEl.style.transform = `translateY(${-editor.scrollTop}px)`;
  }

  editor.addEventListener('scroll', () => {
    pageGuidesEl.style.transform = `translateY(${-editor.scrollTop}px)`;
  });

  window.addEventListener('resize', debounce(updatePageGuides, 250));

  function debounce(fn, delay) {
    let t = null;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), delay);
    };
  }

  const exportTxtBtn = document.getElementById('exportTxt');
  const exportPdfBtn = document.getElementById('exportPdf');
  const exportDocxBtn = document.getElementById('exportDocx');

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  exportTxtBtn.addEventListener('click', () => {
    const text = editor.innerText;
    if (!text.trim()) { showToast(t('toastNothingExport')); return; }
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, 'ritext.txt');
    showToast(t('toastSaved'));
  });

  // ---- PDF: рендерим отформатированный текст на белой «странице»
  //      и превращаем в картинку внутри PDF — так гарантированно
  //      сохраняется кириллица и всё применённое форматирование ----
  exportPdfBtn.addEventListener('click', async () => {
    const text = editor.innerText;
    if (!text.trim()) {
      showToast(t('toastNothingExport'));
      return;
    }
    if (typeof html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
      showToast(t('toastPdfOffline'));
      return;
    }

    showToast(t('toastPdfPreparing'));

    const liveWidth = editor.clientWidth || 780;

    const page = document.createElement('div');
    page.style.position = 'fixed';
    page.style.top = '-10000px';
    page.style.left = '0';
    page.style.width = `${liveWidth}px`;
    page.style.padding = '48px';
    page.style.background = '#ffffff';
    page.style.color = '#111111';
    page.style.fontFamily = "'Manrope', sans-serif";
    page.style.fontSize = '17px';
    page.style.lineHeight = '1.65';
    page.style.whiteSpace = 'pre-wrap';
    page.style.wordWrap = 'break-word';
    page.innerHTML = editor.innerHTML || '';
    document.body.appendChild(page);

    try {
      const canvas = await html2canvas(page, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const imgData = canvas.toDataURL('image/png');

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('ritext.pdf');
      showToast(t('toastSaved'));
    } catch (err) {
      showToast(t('toastPdfFail'));
    } finally {
      page.remove();
    }
  });

  function escapeXml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // Проходит по DOM редактора и превращает его в список абзацев,
  // каждый абзац — список «прогонов» текста с накопленным форматированием.
  function getFormattedParagraphs() {
    const paragraphs = [];
    let current = [];

    function pushText(text, style) {
      if (text) current.push({ text, ...style });
    }

    function walk(node, style) {
      if (node.nodeType === Node.TEXT_NODE) {
        pushText(node.textContent, style);
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;

      const tag = node.tagName.toLowerCase();
      if (tag === 'br') { current.push({ isBreak: true }); return; }

      const nextStyle = { ...style };
      if (tag === 'b' || tag === 'strong') nextStyle.bold = true;
      if (tag === 'i' || tag === 'em') nextStyle.italic = true;
      if (tag === 'u') nextStyle.underline = true;

      if (node.style && node.style.fontFamily) {
        nextStyle.fontFamily = node.style.fontFamily.replace(/['"]/g, '').split(',')[0].trim();
      }
      if (node.style && node.style.fontSize) {
        const px = parseFloat(node.style.fontSize);
        if (!Number.isNaN(px)) nextStyle.sizeHalfPts = Math.round((px / 1.333) * 2);
      }

      Array.from(node.childNodes).forEach((child) => walk(child, nextStyle));
    }

    function flush() { paragraphs.push(current); current = []; }

    if (!editor.childNodes.length) return [[]];

    Array.from(editor.childNodes).forEach((node) => {
      const isBlock = node.nodeType === Node.ELEMENT_NODE &&
        (node.tagName === 'DIV' || node.tagName === 'P');

      if (isBlock) {
        if (current.length) flush();
        walk(node, {});
        flush();
      } else {
        walk(node, {});
      }
    });

    if (current.length) flush();
    if (!paragraphs.length) paragraphs.push([]);

    return paragraphs;
  }

  // ---- DOCX: минимальный, но валидный .docx (это просто zip с XML) ----
  exportDocxBtn.addEventListener('click', async () => {
    const text = editor.innerText;
    if (!text.trim()) { showToast(t('toastNothingExport')); return; }
    if (typeof JSZip === 'undefined') {
      showToast(t('toastDocxOffline'));
      return;
    }

    try {
      const zip = new JSZip();
      zip.file('[Content_Types].xml', DOCX_CONTENT_TYPES);
      zip.folder('_rels').file('.rels', DOCX_RELS);
      zip.folder('word').file('document.xml', buildDocxXml());

      const blob = await zip.generateAsync({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      downloadBlob(blob, 'ritext.docx');
      showToast(t('toastSaved'));
    } catch (err) {
      showToast(t('toastDocxFail'));
    }
  });

  const DOCX_CONTENT_TYPES =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
    '</Types>';

  const DOCX_RELS =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
    '</Relationships>';

  function buildRunProps(run) {
    let props = '';
    if (run.bold) props += '<w:b/>';
    if (run.italic) props += '<w:i/>';
    if (run.underline) props += '<w:u w:val="single"/>';
    if (run.fontFamily) {
      const f = escapeXml(run.fontFamily);
      props += `<w:rFonts w:ascii="${f}" w:hAnsi="${f}" w:cs="${f}"/>`;
    }
    if (run.sizeHalfPts) props += `<w:sz w:val="${run.sizeHalfPts}"/><w:szCs w:val="${run.sizeHalfPts}"/>`;
    return props ? `<w:rPr>${props}</w:rPr>` : '';
  }

  function buildDocxXml() {
    const paragraphs = getFormattedParagraphs();

    const body = paragraphs.map((runs) => {
      if (!runs.length) return '<w:p/>';
      const runsXml = runs.map((run) => {
        if (run.isBreak) return '<w:r><w:br/></w:r>';
        const props = buildRunProps(run);
        const text = escapeXml(run.text);
        return `<w:r>${props}<w:t xml:space="preserve">${text}</w:t></w:r>`;
      }).join('');
      return `<w:p>${runsXml}</w:p>`;
    }).join('');

    return (
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      `<w:body>${body}<w:sectPr/></w:body>` +
      '</w:document>'
    );
  }

  /* ------------------------------------------------------------------ */
  /* 9. Полноэкранный режим главного поля                                */
  /* ------------------------------------------------------------------ */

  const expandBtn = document.getElementById('expandBtn');
  const expandIcon = document.getElementById('expandIcon');
  const expandLabel = document.getElementById('expandLabel');
  const closeExpandBtn = document.getElementById('closeExpandBtn');
  const editorPanel = document.getElementById('editorPanel');
  let isExpanded = false;

  function setExpanded(state) {
    isExpanded = state;
    editorPanel.classList.toggle('is-expanded', state);
    closeExpandBtn.classList.toggle('is-hidden', !state);
    expandIcon.textContent = state ? '⤡' : '⤢';
    expandLabel.dataset.i18n = state ? 'collapse' : 'expand';
    expandLabel.textContent = t(expandLabel.dataset.i18n);
    expandBtn.dataset.i18nAria = state ? 'expandAriaOff' : 'expandAriaOn';
    expandBtn.setAttribute('aria-label', t(expandBtn.dataset.i18nAria));
    updatePageGuides();
  }

  expandBtn.addEventListener('click', () => setExpanded(!isExpanded));
  closeExpandBtn.addEventListener('mousedown', (e) => e.preventDefault());
  closeExpandBtn.addEventListener('click', () => setExpanded(false));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isExpanded) setExpanded(false);
  });

  /* ------------------------------------------------------------------ */
  /* 10. Смена темы (тёмная/светлая)                                     */
  /* ------------------------------------------------------------------ */

  const themeToggle = document.getElementById('themeToggle');
  const themeLabel = document.getElementById('themeLabel');
  const htmlEl = document.documentElement;

  function applyTheme(theme) {
    htmlEl.setAttribute('data-theme', theme);
    themeLabel.dataset.i18n = theme === 'light' ? 'themeDark' : 'themeLight';
    themeLabel.textContent = t(themeLabel.dataset.i18n);
    try { localStorage.setItem('translit-theme', theme); } catch (err) { /* недоступно — не критично */ }
  }

  themeToggle.addEventListener('click', () => {
    const current = htmlEl.getAttribute('data-theme') || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });

  (function initTheme() {
    let saved = null;
    try { saved = localStorage.getItem('translit-theme'); } catch (err) { /* недоступно — не критично */ }
    applyTheme(saved === 'light' ? 'light' : 'dark');
  })();

  /* ------------------------------------------------------------------ */
  /* 11. Toast-уведомления                                               */
  /* ------------------------------------------------------------------ */

  const toastEl = document.getElementById('toast');
  let toastTimer = null;

  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('visible'), 1400);
  }

  /* ------------------------------------------------------------------ */
  /* 12. Выбор тона (прозрачное «стекло» как у Apple)                    */
  /* ------------------------------------------------------------------ */

  const TONES = [
    { key: 'tone_none',     hex: null },
    { key: 'tone_orange',   hex: '#ff9500' },
    { key: 'tone_red',      hex: '#ff3b30' },
    { key: 'tone_pink',     hex: '#ff2d55' },
    { key: 'tone_purple',   hex: '#af52de' },
    { key: 'tone_blue',     hex: '#0a84ff' },
    { key: 'tone_teal',     hex: '#30b0c7' },
    { key: 'tone_green',    hex: '#30d158' },
    { key: 'tone_yellow',   hex: '#ffd60a' },
    { key: 'tone_graphite', hex: '#8e8e93' }
  ];

  const TONE_STORAGE_KEY = 'translit-tone';
  // оттенки (--tone-h*, --tone-s) намеренно НЕ сбрасываются при «Без тона»:
  // так фон плавно гаснет, а при следующем выборе плавно возвращается
  const TONE_ACCENT_VARS = ['--tone-hex', '--tone-hex-hover', '--tone-text'];

  const toneBtn = document.getElementById('toneBtn');
  const toneDot = document.getElementById('toneDot');
  const tonePopover = document.getElementById('tonePopover');
  const toneGrid = document.getElementById('toneGrid');
  const toneCustomInput = document.getElementById('toneCustom');
  const toneCustomSwatch = document.getElementById('toneCustomSwatch');

  let currentToneHex = null;
  let toneHue = null; // «накопленный» оттенок: позволяет переходить кратчайшим путём

  // Кнопка «Анимировать»: фон-стекло начинает плавно «дышать» цветами.
  // Работает только при выбранном тоне; при «Без тона» выключается.
  const ANIMATE_STORAGE_KEY = 'translit-animate';
  const animateBtn = document.getElementById('animateBtn');
  const animateLabel = document.getElementById('animateLabel');
  let isAnimating = false;

  function setAnimating(state, persist) {
    isAnimating = !!state && !!currentToneHex;
    htmlEl.classList.toggle('tone-animate', isAnimating);
    animateBtn.setAttribute('aria-pressed', String(isAnimating));
    animateBtn.setAttribute('aria-disabled', String(!currentToneHex));
    animateLabel.dataset.i18n = isAnimating ? 'animateStop' : 'animate';
    animateLabel.textContent = t(animateLabel.dataset.i18n);

    if (persist) {
      try { localStorage.setItem(ANIMATE_STORAGE_KEY, isAnimating ? '1' : '0'); } catch (err) { /* недоступно — не критично */ }
    }
  }

  animateBtn.addEventListener('click', () => {
    if (!currentToneHex) { showToast(t('toastPickToneFirst')); return; }
    setAnimating(!isAnimating, true);
  });

  function isValidHex(value) {
    return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
  }

  function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b]
      .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
      .join('');
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    const l = (max + min) / 2;
    let h = 0;
    let s = 0;

    if (d !== 0) {
      s = d / (1 - Math.abs(2 * l - 1));
      if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
      if (h < 0) h += 360;
    }
    return { h, s: s * 100, l: l * 100 };
  }

  function relativeLuminance(r, g, b) {
    const lin = (v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  }

  // ближайший (по кругу 0–360°) путь от текущего оттенка к новому
  function nearestHue(prev, target) {
    const diff = ((((target - prev) % 360) + 540) % 360) - 180;
    return prev + diff;
  }

  function updateToneSwatches() {
    const isPreset = TONES.some((tone) => tone.hex === currentToneHex);

    Array.from(toneGrid.children).forEach((el, i) => {
      const selected = TONES[i].hex === currentToneHex;
      el.classList.toggle('is-selected', selected);
      el.setAttribute('aria-checked', String(selected));
    });

    toneCustomSwatch.classList.toggle('is-selected', !!currentToneHex && !isPreset);
    if (currentToneHex) toneCustomInput.value = currentToneHex;
  }

  function applyTone(hex, persist) {
    const valid = isValidHex(hex) ? hex.toLowerCase() : null;
    currentToneHex = valid;

    if (!valid) {
      htmlEl.classList.remove('tone-on');
      TONE_ACCENT_VARS.forEach((name) => htmlEl.style.removeProperty(name));
      toneDot.style.background = '';
    } else {
      const [r, g, b] = hexToRgb(valid);
      const { h, s } = rgbToHsl(r, g, b);

      toneHue = toneHue === null ? h : nearestHue(toneHue, h);
      const hue = Math.round(toneHue * 10) / 10;

      htmlEl.style.setProperty('--tone-h', String(hue));
      htmlEl.style.setProperty('--tone-h2', String(hue + 35));
      htmlEl.style.setProperty('--tone-h3', String(hue - 30));
      htmlEl.style.setProperty('--tone-s', `${Math.round(Math.min(100, s))}%`);
      htmlEl.style.setProperty('--tone-hex', valid);
      htmlEl.style.setProperty('--tone-hex-hover',
        rgbToHex(r + (255 - r) * 0.18, g + (255 - g) * 0.18, b + (255 - b) * 0.18));
      // тёмный или белый текст на акцентных кнопках — что контрастнее
      htmlEl.style.setProperty('--tone-text',
        relativeLuminance(r, g, b) > 0.3 ? '#111114' : '#ffffff');

      htmlEl.classList.add('tone-on');
      toneDot.style.background = valid;
    }

    updateToneSwatches();
    setAnimating(isAnimating, persist);

    if (persist) {
      try {
        localStorage.setItem(TONE_STORAGE_KEY, valid || 'none');
      } catch (err) { /* недоступно — не критично */ }
    }
  }

  // готовые тона
  TONES.forEach((tone, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tone-swatch' + (tone.hex ? '' : ' tone-none');
    btn.style.setProperty('--i', String(i));
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', 'false');
    btn.dataset.i18nAria = tone.key;
    btn.dataset.i18nTitle = tone.key;
    btn.setAttribute('aria-label', t(tone.key));
    btn.title = t(tone.key);
    if (tone.hex) btn.style.setProperty('--swatch', tone.hex);

    btn.addEventListener('click', () => {
      applyTone(tone.hex, true);
      showToast(tone.hex ? t('toastTone', { name: t(tone.key) }) : t('toastToneOff'));
    });

    toneGrid.appendChild(btn);
  });

  // свой цвет: живое применение при выборе, сообщение — когда выбор закончен
  toneCustomInput.addEventListener('input', () => applyTone(toneCustomInput.value, true));
  toneCustomInput.addEventListener('change', () => {
    applyTone(toneCustomInput.value, true);
    showToast(t('toastToneCustom'));
  });

  // панель выбора: открытие/закрытие и позиция
  function positionTonePopover() {
    const rect = toneBtn.getBoundingClientRect();
    const width = tonePopover.offsetWidth || 272;
    tonePopover.style.top = `${rect.bottom + 8}px`;
    tonePopover.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - width - 8))}px`;
  }

  function setToneOpen(open) {
    if (open) positionTonePopover();
    tonePopover.classList.toggle('open', open);
    toneBtn.setAttribute('aria-expanded', String(open));
  }

  toneBtn.addEventListener('click', () => {
    setToneOpen(!tonePopover.classList.contains('open'));
  });

  document.addEventListener('mousedown', (e) => {
    if (!e.target.closest('.tone-wrap')) setToneOpen(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && tonePopover.classList.contains('open')) {
      setToneOpen(false);
      toneBtn.focus();
    }
  });

  window.addEventListener('resize', () => {
    if (tonePopover.classList.contains('open')) positionTonePopover();
  });

  (function initTone() {
    let saved = null;
    try { saved = localStorage.getItem(TONE_STORAGE_KEY); } catch (err) { /* недоступно — не критично */ }
    applyTone(isValidHex(saved) ? saved : null, false);

    let savedAnim = null;
    try { savedAnim = localStorage.getItem(ANIMATE_STORAGE_KEY); } catch (err) { /* недоступно — не критично */ }
    if (savedAnim === '1') setAnimating(true, false);
  })();

  /* ------------------------------------------------------------------ */
  /* 13. Язык интерфейса (RU / EN / LV) и плавные анимации               */
  /* ------------------------------------------------------------------ */

  // Это язык САМОГО САЙТА (кнопки, подсказки, сообщения). Перевод текста
  // в редакторе — отдельная кнопка «Язык ▾» в панели редактора.
  const SITE_LANGS = { ru: 'Русский', en: 'English', lv: 'Latviešu' };

  const siteLangBtn = document.getElementById('siteLangBtn');
  const siteLangMenu = document.getElementById('siteLangMenu');
  const siteLangName = document.getElementById('siteLangName');
  let langAnimTimer = null;

  SUPPORTED_LANGS.forEach((code) => {
    const li = document.createElement('li');
    li.tabIndex = 0;
    li.dataset.siteLang = code;
    li.setAttribute('role', 'option');
    li.textContent = SITE_LANGS[code];

    li.addEventListener('mousedown', (e) => e.preventDefault());
    li.addEventListener('click', () => setSiteLang(code));
    li.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); li.click(); }
    });

    siteLangMenu.appendChild(li);
  });

  function positionSiteLangMenu() {
    const rect = siteLangBtn.getBoundingClientRect();
    const width = siteLangMenu.offsetWidth || 190;
    siteLangMenu.style.top = `${rect.bottom + 8}px`;
    siteLangMenu.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - width - 8))}px`;
  }

  function setSiteLangOpen(open) {
    if (open) positionSiteLangMenu();
    siteLangMenu.classList.toggle('open', open);
    siteLangBtn.setAttribute('aria-expanded', String(open));
  }

  siteLangBtn.addEventListener('click', () => {
    setSiteLangOpen(!siteLangMenu.classList.contains('open'));
  });

  document.addEventListener('mousedown', (e) => {
    if (!e.target.closest('.site-lang-wrap')) setSiteLangOpen(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && siteLangMenu.classList.contains('open')) {
      setSiteLangOpen(false);
      siteLangBtn.focus();
    }
  });

  window.addEventListener('resize', () => {
    if (siteLangMenu.classList.contains('open')) positionSiteLangMenu();
  });

  // Раскладывает переводы по всем элементам с data-i18n*, обновляет
  // подписи, которые собираются в JS, и (при animate) плавно «проявляет» текст.
  function applyLanguage(animate) {
    htmlEl.lang = siteLang;
    document.title = t('docTitle');

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      el.setAttribute('aria-label', t(el.dataset.i18nAria));
    });
    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
      el.title = t(el.dataset.i18nTitle);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      el.setAttribute('data-placeholder', t(el.dataset.i18nPlaceholder));
    });
    document.querySelectorAll('.letter-key').forEach((el) => {
      el.setAttribute('aria-label', t('insertLetter', { letter: el.dataset.letter }));
    });

    siteLangName.textContent = SITE_LANGS[siteLang];
    Array.from(siteLangMenu.children).forEach((li) => {
      const current = li.dataset.siteLang === siteLang;
      li.classList.toggle('is-current', current);
      li.setAttribute('aria-selected', String(current));
    });

    if (animate) {
      htmlEl.classList.remove('lang-changing');
      void htmlEl.offsetWidth; // перезапуск CSS-анимации при быстрой смене
      htmlEl.classList.add('lang-changing');
      clearTimeout(langAnimTimer);
      langAnimTimer = setTimeout(() => htmlEl.classList.remove('lang-changing'), 600);
    }
  }

  function setSiteLang(code) {
    setSiteLangOpen(false);
    if (!SUPPORTED_LANGS.includes(code) || code === siteLang) return;

    siteLang = code;
    try { localStorage.setItem(SITE_LANG_STORAGE_KEY, code); } catch (err) { /* недоступно — не критично */ }
    applyLanguage(true);
    showToast(t('toastSiteLang', { name: SITE_LANGS[code] }));
  }

  applyLanguage(false);

  // включаем плавные переходы только после первой отрисовки
  requestAnimationFrame(() => requestAnimationFrame(() => {
    htmlEl.classList.remove('is-booting');
  }));

  updatePageGuides();

})();
