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
      tone_none: 'Без тона', tone_graphite: 'Графит', tone_silver: 'Серебро',
      tone_blue: 'Синий', tone_indigo: 'Индиго', tone_purple: 'Фиолетовый',
      tone_pink: 'Розовый', tone_red: 'Красный', tone_orange: 'Оранжевый',
      tone_yellow: 'Жёлтый', tone_mint: 'Мята', tone_teal: 'Бирюза',
      tone_green: 'Зелёный', tone_lime: 'Лайм', tone_brown: 'Коричневый', tone_rose: 'Роза',
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
            statChars: 'Символы', statWords: 'Слова', statPages: 'Стр.',
      autosaveIdle: 'Черновик', autosaveSaving: 'Сохранение…', autosaveSaved: 'Сохранено',
      autosaveRestored: 'Черновик восстановлен',
      qrLabel: 'QR', qrBtn: 'Код', qrTitle: 'QR-код текста', qrHint: 'Отсканируйте камерой — откроется текст',
      qrDownload: 'Скачать PNG', qrEmpty: 'Сначала введите текст', qrTooLong: 'Текст слишком длинный для QR (макс. ~1200 символов)',
      ocrLabel: 'OCR', ocrBtn: 'OCR', ocrTitle: 'Текст из PDF или файла', ocrDrop: 'Перетащите PDF или текстовый файл сюда',
      ocrDropSub: 'PDF · TXT · MD · CSV · HTML — читаем сам текст',
      ocrWorking: 'Распознаём текст…', ocrLangHint: 'Из PDF берётся текстовый слой — максимально точно',
      ocrDone: 'Текст из файла вставлен', ocrFail: 'Не удалось прочитать текст из файла', ocrNoLib: 'OCR-библиотека не загрузилась',
      exportStressTitle: 'Экспорт TXT с ударениями',
      toastExportStress: 'TXT с ударениями сохранён',
      styleBtn: 'Стиль', styleTitle: 'Стиль интерфейса', styleBg: 'Фон',
      styleBgHint: 'Изображение только на фоне, не на блоках',
      styleBgPick: 'Выбрать фото', styleBgClear: 'Убрать',
      styleGlass: 'Стекло', styleNoBlur: 'Убрать размытие блоков',
      styleNoBlurHint: 'Фото фона будет видно чётче',
      styleBgSet: 'Фон установлен', styleBgRemoved: 'Фон убран',
      styleBgTooBig: 'Файл слишком большой (макс. 2.5 МБ)',
      styleBgBad: 'Нужен файл изображения',
      stylePosX: 'По горизонтали', stylePosY: 'По вертикали', styleScale: 'Размер',
      stylePosHint: 'Пустые края заполняются размытым фото',
      styleFitWidth: 'По ширине', styleFitHeight: 'По высоте', styleFitCover: 'На весь экран',
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
      tone_none: 'No tone', tone_graphite: 'Graphite', tone_silver: 'Silver',
      tone_blue: 'Blue', tone_indigo: 'Indigo', tone_purple: 'Purple',
      tone_pink: 'Pink', tone_red: 'Red', tone_orange: 'Orange',
      tone_yellow: 'Yellow', tone_mint: 'Mint', tone_teal: 'Teal',
      tone_green: 'Green', tone_lime: 'Lime', tone_brown: 'Brown', tone_rose: 'Rose',
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
            statChars: 'Chars', statWords: 'Words', statPages: 'Pages',
      autosaveIdle: 'Draft', autosaveSaving: 'Saving…', autosaveSaved: 'Saved',
      autosaveRestored: 'Draft restored',
      qrLabel: 'QR', qrBtn: 'Code', qrTitle: 'Text QR code', qrHint: 'Scan with a camera to open the text',
      qrDownload: 'Download PNG', qrEmpty: 'Enter some text first', qrTooLong: 'Text is too long for QR (max ~1200 chars)',
      ocrLabel: 'OCR', ocrBtn: 'OCR', ocrTitle: 'Text from PDF or file', ocrDrop: 'Drop a PDF or text file here',
      ocrDropSub: 'PDF · TXT · MD · CSV · HTML — exact text extract',
      ocrWorking: 'Recognizing text…', ocrLangHint: 'PDF text layer is extracted exactly',
      ocrDone: 'Text inserted', ocrFail: 'Could not recognize text', ocrNoLib: 'OCR library failed to load',
      exportStressTitle: 'Export TXT with stress marks',
      toastExportStress: 'TXT with stress marks saved',
      styleBtn: 'Style', styleTitle: 'Interface style', styleBg: 'Background',
      styleBgHint: 'Image only on the page background, not on panels',
      styleBgPick: 'Choose photo', styleBgClear: 'Remove',
      styleGlass: 'Glass', styleNoBlur: 'Remove panel blur',
      styleNoBlurHint: 'Background photo will look sharper',
      styleBgSet: 'Background set', styleBgRemoved: 'Background removed',
      styleBgTooBig: 'File too large (max 2.5 MB)',
      styleBgBad: 'Please choose an image file',
      stylePosX: 'Horizontal', stylePosY: 'Vertical', styleScale: 'Size',
      stylePosHint: 'Empty edges are filled with a blurred photo',
      styleFitWidth: 'Fit width', styleFitHeight: 'Fit height', styleFitCover: 'Fill screen',
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
      tone_none: 'Bez toņa', tone_graphite: 'Grafīts', tone_silver: 'Sudrabs',
      tone_blue: 'Zils', tone_indigo: 'Indigo', tone_purple: 'Violets',
      tone_pink: 'Rozā', tone_red: 'Sarkans', tone_orange: 'Oranžs',
      tone_yellow: 'Dzeltens', tone_mint: 'Mētra', tone_teal: 'Tirkīzs',
      tone_green: 'Zaļš', tone_lime: 'Laims', tone_brown: 'Brūns', tone_rose: 'Roze',
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
            statChars: 'Simboli', statWords: 'Vārdi', statPages: 'Lpp.',
      autosaveIdle: 'Melnraksts', autosaveSaving: 'Saglabā…', autosaveSaved: 'Saglabāts',
      autosaveRestored: 'Melnraksts atjaunots',
      qrLabel: 'QR', qrBtn: 'Kods', qrTitle: 'Teksta QR kods', qrHint: 'Noskenējiet ar kameru, lai atvērtu tekstu',
      qrDownload: 'Lejupielādēt PNG', qrEmpty: 'Vispirms ievadiet tekstu', qrTooLong: 'Teksts pārāk garš QR (maks. ~1200)',
      ocrLabel: 'OCR', ocrBtn: 'OCR', ocrTitle: 'Teksts no PDF vai faila', ocrDrop: 'Ievelciet PDF vai teksta failu šeit',
      ocrDropSub: 'vai noklikšķiniet, lai izvēlētos · JPG, PNG, PDF',
      ocrWorking: 'Atpazīst tekstu…', ocrLangHint: 'Labāk darbojas ar krievu un latīņu tekstu',
      ocrDone: 'Teksts ievietots', ocrFail: 'Neizdevās atpazīt tekstu', ocrNoLib: 'OCR bibliotēka neielādējās',
      exportStressTitle: 'Eksportēt TXT ar uzsvariem',
      toastExportStress: 'TXT ar uzsvariem saglabāts',
      styleBtn: 'Stils', styleTitle: 'Saskarnes stils', styleBg: 'Fons',
      styleBgHint: 'Attēls tikai fonā, ne uz blokiem',
      styleBgPick: 'Izvēlēties foto', styleBgClear: 'Noņemt',
      styleGlass: 'Stikls', styleNoBlur: 'Noņemt bloku aizmiglojumu',
      styleNoBlurHint: 'Fona foto būs skaidrāks',
      styleBgSet: 'Fons iestatīts', styleBgRemoved: 'Fons noņemts',
      styleBgTooBig: 'Fails pārāk liels (maks. 2.5 MB)',
      styleBgBad: 'Izvēlieties attēla failu',
      stylePosX: 'Horizontāli', stylePosY: 'Vertikāli', styleScale: 'Izmērs',
      stylePosHint: 'Tukšās malas aizpilda ar izplūdušu foto',
      styleFitWidth: 'Pēc platuma', styleFitHeight: 'Pēc augstuma', styleFitCover: 'Uz visu ekrānu',
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
    'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'i',
    'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
    'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
    'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch',
    'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '',
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

  // Расширенный словарь частых слов
  STRESS_DICT.set('приветствие', 5);
  STRESS_DICT.set('пожалуйста', 3);
  STRESS_DICT.set('извините', 3);
  STRESS_DICT.set('извини', 3);
  STRESS_DICT.set('спасибо', 4);
  STRESS_DICT.set('здравствуйте', 3);
  STRESS_DICT.set('досвидания', 6);
  STRESS_DICT.set('хорошо', 5);
  STRESS_DICT.set('плохо', 2);
  STRESS_DICT.set('понятно', 3);
  STRESS_DICT.set('конечно', 3);
  STRESS_DICT.set('наверное', 3);
  STRESS_DICT.set('возможно', 5);
  STRESS_DICT.set('действительно', 4);
  STRESS_DICT.set('обязательно', 5);
  STRESS_DICT.set('прекрасно', 4);
  STRESS_DICT.set('замечательно', 4);
  STRESS_DICT.set('интересно', 5);
  STRESS_DICT.set('красиво', 4);
  STRESS_DICT.set('быстро', 1);
  STRESS_DICT.set('медленно', 1);
  STRESS_DICT.set('сегодня', 3);
  STRESS_DICT.set('завтра', 1);
  STRESS_DICT.set('вчера', 4);
  STRESS_DICT.set('сейчас', 4);
  STRESS_DICT.set('потом', 3);
  STRESS_DICT.set('раньше', 1);
  STRESS_DICT.set('всегда', 5);
  STRESS_DICT.set('никогда', 6);
  STRESS_DICT.set('иногда', 5);
  STRESS_DICT.set('часто', 1);
  STRESS_DICT.set('редко', 1);
  STRESS_DICT.set('человек', 5);
  STRESS_DICT.set('люди', 1);
  STRESS_DICT.set('ребёнок', 3);
  STRESS_DICT.set('ребенок', 3);
  STRESS_DICT.set('дети', 1);
  STRESS_DICT.set('семья', 4);
  STRESS_DICT.set('работа', 3);
  STRESS_DICT.set('школа', 2);
  STRESS_DICT.set('университет', 9);
  STRESS_DICT.set('студент', 4);
  STRESS_DICT.set('учитель', 2);
  STRESS_DICT.set('ученик', 3);
  STRESS_DICT.set('книга', 2);
  STRESS_DICT.set('письмо', 5);
  STRESS_DICT.set('слово', 2);
  STRESS_DICT.set('предложение', 6);
  STRESS_DICT.set('вопрос', 4);
  STRESS_DICT.set('ответ', 3);
  STRESS_DICT.set('проблема', 5);
  STRESS_DICT.set('решение', 3);
  STRESS_DICT.set('время', 2);
  STRESS_DICT.set('день', 1);
  STRESS_DICT.set('неделя', 3);
  STRESS_DICT.set('месяц', 1);
  STRESS_DICT.set('год', 1);
  STRESS_DICT.set('утро', 0);
  STRESS_DICT.set('вечер', 1);
  STRESS_DICT.set('ночь', 1);
  STRESS_DICT.set('город', 1);
  STRESS_DICT.set('страна', 5);
  STRESS_DICT.set('россия', 4);
  STRESS_DICT.set('москва', 5);
  STRESS_DICT.set('петербург', 6);
  STRESS_DICT.set('улица', 0);
  STRESS_DICT.set('дом', 1);
  STRESS_DICT.set('квартира', 5);
  STRESS_DICT.set('машина', 3);
  STRESS_DICT.set('автобус', 3);
  STRESS_DICT.set('поезд', 1);
  STRESS_DICT.set('самолёт', 5);
  STRESS_DICT.set('самолет', 5);
  STRESS_DICT.set('телефон', 5);
  STRESS_DICT.set('компьютер', 5);
  STRESS_DICT.set('интернет', 6);
  STRESS_DICT.set('сайт', 1);
  STRESS_DICT.set('язык', 2);
  STRESS_DICT.set('русский', 1);
  STRESS_DICT.set('английский', 4);
  STRESS_DICT.set('латышский', 3);
  STRESS_DICT.set('жизнь', 1);
  STRESS_DICT.set('любовь', 3);
  STRESS_DICT.set('счастье', 2);
  STRESS_DICT.set('здоровье', 3);
  STRESS_DICT.set('деньги', 1);
  STRESS_DICT.set('работа', 3);
  STRESS_DICT.set('делать', 1);
  STRESS_DICT.set('говорить', 5);
  STRESS_DICT.set('сказать', 4);
  STRESS_DICT.set('видеть', 1);
  STRESS_DICT.set('слышать', 2);
  STRESS_DICT.set('думать', 1);
  STRESS_DICT.set('знать', 2);
  STRESS_DICT.set('хотеть', 3);
  STRESS_DICT.set('мочь', 1);
  STRESS_DICT.set('нужно', 1);
  STRESS_DICT.set('можно', 1);
  STRESS_DICT.set('нельзя', 5);
  STRESS_DICT.set('должен', 1);
  STRESS_DICT.set('должна', 3);
  STRESS_DICT.set('должны', 3);
  STRESS_DICT.set('жить', 1);
  STRESS_DICT.set('живу', 3);
  STRESS_DICT.set('живёт', 3);
  STRESS_DICT.set('работает', 3);
  STRESS_DICT.set('работает', 3);
  STRESS_DICT.set('понимать', 5);
  STRESS_DICT.set('понимаю', 5);
  STRESS_DICT.set('помогать', 5);
  STRESS_DICT.set('помоги', 3);
  STRESS_DICT.set('пожалуй', 3);
  STRESS_DICT.set('большой', 5);
  STRESS_DICT.set('маленький', 1);
  STRESS_DICT.set('новый', 1);
  STRESS_DICT.set('старый', 2);
  STRESS_DICT.set('хороший', 3);
  STRESS_DICT.set('плохой', 4);
  STRESS_DICT.set('красивый', 4);
  STRESS_DICT.set('первый', 1);
  STRESS_DICT.set('последний', 4);
  STRESS_DICT.set('другой', 4);
  STRESS_DICT.set('каждый', 1);
  STRESS_DICT.set('весь', 1);
  STRESS_DICT.set('все', 1);
  STRESS_DICT.set('всё', 1);
  STRESS_DICT.set('это', 0);
  STRESS_DICT.set('этот', 0);
  STRESS_DICT.set('эта', 0);
  STRESS_DICT.set('эти', 0);
  STRESS_DICT.set('здесь', 2);
  STRESS_DICT.set('там', 1);
  STRESS_DICT.set('сюда', 3);
  STRESS_DICT.set('туда', 3);
  STRESS_DICT.set('откуда', 3);
  STRESS_DICT.set('куда', 3);
  STRESS_DICT.set('когда', 4);
  STRESS_DICT.set('почему', 5);
  STRESS_DICT.set('потому', 5);
  STRESS_DICT.set('поэтому', 2);
  STRESS_DICT.set('если', 0);
  STRESS_DICT.set('чтобы', 1);
  STRESS_DICT.set('также', 1);
  STRESS_DICT.set('тоже', 1);
  STRESS_DICT.set('только', 1);
  STRESS_DICT.set('ещё', 2);
  STRESS_DICT.set('еще', 2);
  STRESS_DICT.set('уже', 2);
  STRESS_DICT.set('очень', 0);
  STRESS_DICT.set('совсем', 4);
  STRESS_DICT.set('почти', 4);
  STRESS_DICT.set('примерно', 3);
  STRESS_DICT.set('например', 4);
  STRESS_DICT.set('документ', 5);
  STRESS_DICT.set('подпись', 3);
  STRESS_DICT.set('имя', 0);
  STRESS_DICT.set('фамилия', 3);
  STRESS_DICT.set('отчество', 2);
  STRESS_DICT.set('адрес', 2);
  STRESS_DICT.set('номер', 1);
  STRESS_DICT.set('дата', 1);
  STRESS_DICT.set('транслит', 5);
  STRESS_DICT.set('ударение', 3);



  // Частотный словарь ударений (дополнение)
  const FREQ_STRESS = [
    ['который', 4], ['которая', 4], ['которое', 4], ['которые', 4],
    ['этот', 0], ['эта', 0], ['это', 0], ['эти', 0],
    ['быть', 1], ['есть', 0], ['был', 1], ['была', 3], ['было', 1], ['были', 1],
    ['сказать', 4], ['говорить', 5], ['сказал', 4], ['говорит', 5],
    ['мочь', 1], ['может', 1], ['можно', 1], ['нужно', 1],
    ['знать', 2], ['хотеть', 3], ['хочу', 3], ['хочет', 1],
    ['видеть', 1], ['видеть', 1], ['видел', 1],
    ['идти', 2], ['пойти', 3], ['прийти', 4],
    ['делать', 1], ['сделать', 2], ['работает', 3],
    ['думать', 1], ['понимать', 5], ['помнить', 1],
    ['жить', 1], ['люблю', 3], ['любит', 1],
    ['новый', 1], ['новая', 1], ['новое', 1], ['новые', 1],
    ['большой', 5], ['маленький', 1], ['хороший', 3], ['плохой', 4],
    ['первый', 1], ['второй', 4], ['последний', 4],
    ['русский', 1], ['российский', 4],
    ['человек', 5], ['люди', 1], ['мужчина', 3], ['женщина', 1],
    ['ребёнок', 3], ['ребенок', 3], ['дети', 1],
    ['друг', 2], ['подруга', 4], ['семья', 4],
    ['дом', 1], ['город', 1], ['страна', 5], ['мир', 1],
    ['время', 2], ['день', 1], ['год', 1], ['жизнь', 1],
    ['работа', 3], ['дело', 1], ['вопрос', 4], ['ответ', 3],
    ['слово', 2], ['язык', 2], ['книга', 2], ['письмо', 5],
    ['вода', 3], ['земля', 4], ['огонь', 2], ['воздух', 1],
    ['сегодня', 3], ['завтра', 1], ['вчера', 4], ['сейчас', 4],
    ['здесь', 2], ['там', 1], ['сюда', 3], ['туда', 3],
    ['когда', 4], ['почему', 5], ['потому', 5], ['если', 0],
    ['также', 1], ['тоже', 1], ['только', 1], ['уже', 2], ['ещё', 2], ['еще', 2],
    ['очень', 0], ['снова', 2], ['опять', 2], ['почти', 4],
    ['спасибо', 4], ['пожалуйста', 3], ['здравствуйте', 3], ['привет', 4],
    ['хорошо', 5], ['плохо', 2], ['конечно', 3], ['ладно', 1],
    ['москва', 5], ['россия', 4], ['петербург', 6],
    ['документ', 5], ['подпись', 3], ['фамилия', 3], ['отчество', 2],
    ['телефон', 5], ['компьютер', 5], ['интернет', 6],
    ['школа', 2], ['университет', 9], ['студент', 4],
    ['машина', 3], ['дорога', 3], ['улица', 0],
    ['утро', 0], ['вечер', 1], ['ночь', 1], ['неделя', 3], ['месяц', 1],
    ['деньги', 1], ['рубль', 1], ['цена', 3],
    ['проблема', 5], ['решение', 3], ['помощь', 1],
    ['правда', 1], ['ложь', 1], ['история', 2],
    ['музыка', 1], ['фильм', 1], ['игра', 2],
    ['счастье', 2], ['любовь', 3], ['здоровье', 3],
    ['важно', 1], ['интересно', 5], ['понятно', 3],
    ['вместе', 1], ['один', 2], ['одна', 2], ['одно', 2],
    ['всегда', 5], ['никогда', 6], ['иногда', 5],
    ['каждый', 1], ['весь', 1], ['все', 1], ['всё', 1],
    ['надо', 1], ['должен', 1], ['должна', 3],
    ['через', 1], ['между', 1], ['после', 1], ['перед', 1],
    ['около', 1], ['против', 1], ['вместо', 2]
  ];
  FREQ_STRESS.forEach(([w, i]) => { if (!STRESS_DICT.has(w)) STRESS_DICT.set(w, i); });
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
    } else if (vowels.length === 1) {
      stressIdx = vowels[0];
    } else if (vowels.length === 2) {
      // двусложные: чаще ударение на первой гласной
      stressIdx = vowels[0];
    } else if (vowels.length >= 3) {
      // многосложные без словаря: предпоследняя гласная (часто ближе к норме)
      stressIdx = vowels[vowels.length - 2];
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
    btn.addEventListener('click', (e) => {
      const ch = e.shiftKey ? letter.toUpperCase() : letter;
      insertTextAtCursor(ch);
    });

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

  let lastResultSource = null;
  function updateResult() {
    // Убираем знаки ударения перед транслитом — в латинице они не нужны
    const sourceText = removeStressMarks(editor.innerText.replace(/\u00A0/g, ' '));
    if (sourceText === lastResultSource) return;
    lastResultSource = sourceText;
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

  let selFrame = null;
  document.addEventListener('selectionchange', () => {
    if (selFrame) return;
    selFrame = requestAnimationFrame(() => {
      selFrame = null;
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
      const range = sel.getRangeAt(0);
      if (!(editor.contains(range.startContainer) && editor.contains(range.endContainer))) return;
      refreshActiveStates();
    });
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
        if (typeof updateStats === 'function') updateStats();
      });
    }
    if (typeof scheduleAutosave === 'function') scheduleAutosave();
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
    updateStats();
    scheduleAutosave && scheduleAutosave();
    updatePageGuides();
    editor.focus();
  });

  clearOutputBtn.addEventListener('click', () => {
    if (editor.innerHTML) pushHistory();
    editor.innerHTML = '';
    resetEditorState();
    updateResult();
    if (typeof updateStats === 'function') updateStats();
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

  let translateBusy = false;
  async function translateEditorTo(langCode) {
    if (translateBusy) return;
    const text = editor.innerText;
    if (!text.trim()) { showToast(t('toastNothingTranslate')); return; }

    translateBusy = true;
    pushHistory();
    if (!isTranslated) originalHtmlBeforeTranslation = editor.innerHTML;

    showToast(t('toastTranslating'));

    try {
      const translated = await translateText(text, langCode);
      if (!translated || !String(translated).trim()) throw new Error('empty');
      setEditorPlainText(translated);
      isTranslated = true;
      // сбрасываем режим ударений — текст другой
      stressOn = false;
      if (stressBtn) {
        stressBtn.classList.remove('active');
        stressBtn.setAttribute('aria-pressed', 'false');
      }
      revertLangBtn.classList.remove('is-hidden');
      updateResult();
      updatePageGuides();
      if (typeof updateStats === 'function') updateStats();
      if (typeof scheduleAutosave === 'function') scheduleAutosave();
      showToast(t('toastTranslated', { lang: t('lang_' + langCode) }));
    } catch (err) {
      showToast(t('toastTranslateFail'));
    } finally {
      translateBusy = false;
    }
  }

  async function translateText(text, targetLang) {
    // Длинный текст режем на куски — API стабильнее, меньше обрывов
    const MAX = 3500;
    const chunks = [];
    if (text.length <= MAX) {
      chunks.push(text);
    } else {
      let rest = text;
      while (rest.length) {
        if (rest.length <= MAX) {
          chunks.push(rest);
          break;
        }
        let cut = rest.lastIndexOf('\n', MAX);
        if (cut < MAX * 0.35) cut = rest.lastIndexOf('. ', MAX);
        if (cut < MAX * 0.35) cut = rest.lastIndexOf(' ', MAX);
        if (cut < MAX * 0.35) cut = MAX;
        chunks.push(rest.slice(0, cut));
        rest = rest.slice(cut).replace(/^\s+/, '');
      }
    }

    const parts = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (!chunk.trim()) {
        parts.push(chunk);
        continue;
      }
      const url =
        'https://translate.googleapis.com/translate_a/single' +
        '?client=gtx&sl=auto&tl=' + encodeURIComponent(targetLang) +
        '&dt=t&ie=UTF-8&oe=UTF-8&q=' + encodeURIComponent(chunk);
      const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 18000) : null;
      let res;
      try {
        res = await fetch(url, ctrl ? { signal: ctrl.signal } : undefined);
      } finally {
        if (timer) clearTimeout(timer);
      }
      if (!res.ok) throw new Error('translate request failed');
      const data = await res.json();
      if (!Array.isArray(data) || !Array.isArray(data[0])) {
        throw new Error('unexpected response');
      }
      const piece = data[0].map(function (seg) { return seg && seg[0] ? seg[0] : ''; }).join('');
      parts.push(piece);
    }
    return parts.join('');
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

  let lastGuideCount = -1;
  function updatePageGuides() {
    if (!pageGuidesEl) return;
    const total = editor.scrollHeight;
    const count = Math.max(0, Math.floor(total / PAGE_GUIDE_HEIGHT));
    if (count !== lastGuideCount) {
      lastGuideCount = count;
      let html = '';
      for (let i = 1; i <= count; i++) {
        html += '<div class="page-guide-line" style="top:' + (i * PAGE_GUIDE_HEIGHT) + 'px">' +
          '<span class="page-guide-label">стр. ' + (i + 1) + '</span></div>';
      }
      pageGuidesEl.innerHTML = html;
    }
    pageGuidesEl.style.transform = 'translateY(' + (-editor.scrollTop) + 'px)';
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
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function downloadTextFile(text, filename) {
    // BOM помогает Notepad/Windows корректно открыть кириллицу
    const blob = new Blob(['\uFEFF' + text], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, filename);
  }

  exportTxtBtn.addEventListener('click', () => {
    const text = editor.innerText;
    if (!text.trim()) { showToast(t('toastNothingExport')); return; }
    downloadTextFile(text, 'ritext.txt');
    showToast(t('toastSaved'));
  });

  // ---- PDF: рендерим отформатированный текст на белой «странице»
  //      и превращаем в картинку внутри PDF — так гарантированно
  //      сохраняется кириллица и всё применённое форматирование ----
  let exportBusy = false;
  exportPdfBtn.addEventListener('click', async () => {
    if (exportBusy) return;
    const text = editor.innerText;
    if (!text.trim()) {
      showToast(t('toastNothingExport'));
      return;
    }
    if (typeof html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
      showToast(t('toastPdfOffline'));
      return;
    }

    exportBusy = true;
    showToast(t('toastPdfPreparing'));

    const liveWidth = editor.clientWidth || 780;

    const page = document.createElement('div');
    page.style.position = 'fixed';
    page.style.top = '-10000px';
    page.style.left = '0';
    page.style.width = liveWidth + 'px';
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
      exportBusy = false;
      if (page && page.parentNode) page.remove();
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
    { key: 'tone_graphite', hex: '#8e8e93' },
    { key: 'tone_silver',   hex: '#c7c7cc' },
    { key: 'tone_blue',     hex: '#0a84ff' },
    { key: 'tone_indigo',   hex: '#5e5ce6' },
    { key: 'tone_purple',   hex: '#bf5af2' },
    { key: 'tone_pink',     hex: '#ff2d87' },
    { key: 'tone_red',      hex: '#ff2d1f' },
    { key: 'tone_orange',   hex: '#ff8500' },
    { key: 'tone_yellow',   hex: '#ffd60a' },
    { key: 'tone_mint',     hex: '#66d4cf' },
    { key: 'tone_teal',     hex: '#64d2ff' },
    { key: 'tone_green',    hex: '#30d158' },
    { key: 'tone_lime',     hex: '#a8ff60' },
    { key: 'tone_brown',    hex: '#ac8e68' },
    { key: 'tone_rose',     hex: '#f5c6d0' }
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
      htmlEl.classList.remove('tone-on', 'tone-soft');
      TONE_ACCENT_VARS.forEach((name) => htmlEl.style.removeProperty(name));
      htmlEl.style.removeProperty('--blob-l');
      toneDot.style.background = '';
    } else {
      const [r, g, b] = hexToRgb(valid);
      const { h, s } = rgbToHsl(r, g, b);

      toneHue = toneHue === null ? h : nearestHue(toneHue, h);
      const hue = Math.round(toneHue * 10) / 10;

      // Один оттенок (монохром): без «радуги» соседних цветов
      htmlEl.style.setProperty('--tone-h', String(hue));
      htmlEl.style.setProperty('--tone-h2', String(hue + 6));
      htmlEl.style.setProperty('--tone-h3', String(hue - 6));
      // Слегка приглушаем насыщенность для чистого liquid glass
      htmlEl.style.setProperty('--tone-s', `${Math.round(Math.min(85, Math.max(40, s * 0.95)))}%`);
      htmlEl.style.setProperty('--tone-hex', valid);
      htmlEl.style.setProperty('--tone-hex-hover',
        rgbToHex(r + (255 - r) * 0.18, g + (255 - g) * 0.18, b + (255 - b) * 0.18));
      // тёмный или белый текст на акцентных кнопках — что контрастнее
      const lum = relativeLuminance(r, g, b);
      htmlEl.style.setProperty('--tone-text',
        lum > 0.3 ? '#111114' : '#ffffff');

      // Мягкие пастельные тона (роза и т.п.): светлее и нежнее фон
      if (lum > 0.55) {
        htmlEl.classList.add('tone-soft');
        htmlEl.style.setProperty('--blob-l', '72%');
        htmlEl.style.setProperty('--tone-s', `${Math.round(Math.min(45, Math.max(18, s * 0.55)))}%`);
      } else {
        htmlEl.classList.remove('tone-soft');
        htmlEl.style.removeProperty('--blob-l');
      }

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



  /* ------------------------------------------------------------------ */
  /* 15. Счётчик · автосохранение · QR · OCR · экспорт с ударениями      */
  /* ------------------------------------------------------------------ */

  const DRAFT_KEY = 'ritext-draft-v1';
  const PAGE_CHARS_APPROX = 1800; // ~страница A4 при текущем кегле
  const statCharsEl = document.getElementById('statChars');
  const statWordsEl = document.getElementById('statWords');
  const statPagesEl = document.getElementById('statPages');
  const statusSaveEl = document.getElementById('statusSave');

  function getEditorPlain() {
    return (editor.innerText || '').replace(/\u00A0/g, ' ');
  }

  function updateStats() {
    const text = getEditorPlain();
    // Убираем «пустые» переводы строк-остатки contenteditable
    const normalized = text.replace(/\r/g, '');
    const isEmpty = !normalized.replace(/[\s\u200B\uFEFF]/g, '');
    const chars = isEmpty ? 0 : normalized.length;
    const trimmed = normalized.trim();
    const words = (!isEmpty && trimmed) ? trimmed.split(/\s+/).filter(Boolean).length : 0;
    const pages = isEmpty ? 0 : Math.max(1, Math.ceil(chars / PAGE_CHARS_APPROX));
    if (statCharsEl) statCharsEl.textContent = String(chars);
    if (statWordsEl) statWordsEl.textContent = String(words);
    if (statPagesEl) statPagesEl.textContent = String(pages);
  }

  function setSaveStatus(mode) {
    if (!statusSaveEl) return;
    statusSaveEl.classList.remove('is-saving', 'is-saved');
    if (mode === 'saving') {
      statusSaveEl.classList.add('is-saving');
      statusSaveEl.textContent = t('autosaveSaving');
    } else if (mode === 'saved') {
      statusSaveEl.classList.add('is-saved');
      statusSaveEl.textContent = t('autosaveSaved');
    } else {
      statusSaveEl.textContent = t('autosaveIdle');
    }
  }

  let saveTimer = null;
  let lastSavedHtml = null;
  function scheduleAutosave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        const plain = getEditorPlain().replace(/[\s\u200B\uFEFF]/g, '');
        if (!plain) {
          if (localStorage.getItem(DRAFT_KEY)) localStorage.removeItem(DRAFT_KEY);
          lastSavedHtml = '';
          setSaveStatus('idle');
          return;
        }
        const html = editor.innerHTML;
        if (html === lastSavedHtml) {
          setSaveStatus('saved');
          return;
        }
        setSaveStatus('saving');
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ html: html, ts: Date.now() }));
        lastSavedHtml = html;
        setSaveStatus('saved');
      } catch (e) {
        setSaveStatus('idle');
      }
    }, 1200);
  }

  function restoreDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data || !data.html) return;
      const cur = getEditorPlain().trim();
      if (cur) return;
      // пустой/мусорный черновик — удаляем
      const tmp = document.createElement('div');
      tmp.innerHTML = data.html;
      const draftText = (tmp.innerText || '').replace(/[\s\u200B\uFEFF]/g, '');
      if (!draftText) {
        localStorage.removeItem(DRAFT_KEY);
        return;
      }
      editor.innerHTML = data.html;
      updateResult();
      updatePageGuides();
      updateStats();
      setSaveStatus('saved');
      showToast(t('autosaveRestored'));
    } catch (e) { /* */ }
  }


  // --- Экспорт TXT с ударениями ---
  const exportTxtStressBtn = document.getElementById('exportTxtStress');
  if (exportTxtStressBtn) {
    exportTxtStressBtn.addEventListener('click', () => {
      const plain = getEditorPlain();
      if (!plain.trim()) {
        showToast(t('toastNothingExport'));
        return;
      }
      let out = plain;
      if (isMostlyCyrillic(plain)) {
        out = applyStressToText(removeStressMarks(plain));
      }
      downloadTextFile(out, 'ritext-stress.txt');
      showToast(t('toastExportStress'));
    });
  }

  // --- QR ---
  const qrBtn = document.getElementById('qrBtn');
  const qrModal = document.getElementById('qrModal');
  const qrBox = document.getElementById('qrBox');
  const qrModalClose = document.getElementById('qrModalClose');
  const qrDownload = document.getElementById('qrDownload');

  function openModal(el) {
    if (!el) return;
    el.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function closeModal(el) {
    if (!el) return;
    el.hidden = true;
    const anyOpen = document.querySelector('.modal-overlay:not([hidden])');
    if (!anyOpen) document.body.style.overflow = '';
  }

  function buildQr(text) {
    if (!qrBox) return;
    qrBox.innerHTML = '';
    if (typeof QRCode === 'undefined') {
      qrBox.textContent = 'QR';
      return;
    }
    // qrcodejs draws into container
    // eslint-disable-next-line no-new
    new QRCode(qrBox, {
      text: text,
      width: 220,
      height: 220,
      colorDark: '#111111',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });
  }

  if (qrBtn) {
    qrBtn.addEventListener('click', () => {
      const text = getEditorPlain().trim();
      if (!text) {
        showToast(t('qrEmpty'));
        return;
      }
      if (text.length > 1200) {
        showToast(t('qrTooLong'));
        return;
      }
      buildQr(text);
      openModal(qrModal);
    });
  }
  if (qrModalClose) qrModalClose.addEventListener('click', () => closeModal(qrModal));
  if (qrModal) qrModal.addEventListener('click', (e) => { if (e.target === qrModal) closeModal(qrModal); });
  if (qrDownload) {
    qrDownload.addEventListener('click', () => {
      const canvas = qrBox && qrBox.querySelector('canvas');
      const img = qrBox && qrBox.querySelector('img');
      let url = null;
      if (canvas) url = canvas.toDataURL('image/png');
      else if (img) url = img.src;
      if (!url) return;
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ritext-qr.png';
      a.click();
    });
  }

  // --- OCR (изображение / PDF) ---
  const ocrBtn = document.getElementById('ocrBtn');
  const ocrFile = document.getElementById('ocrFile');
  const ocrModal = document.getElementById('ocrModal');
  const ocrModalClose = document.getElementById('ocrModalClose');
  const ocrDrop = document.getElementById('ocrDrop');
  const ocrProgress = document.getElementById('ocrProgress');
  const ocrBarFill = document.getElementById('ocrBarFill');
  const ocrProgressText = document.getElementById('ocrProgressText');

  function setOcrProgress(p, label) {
    if (ocrProgress) ocrProgress.classList.remove('is-hidden');
    if (ocrBarFill) ocrBarFill.style.width = Math.round(p * 100) + '%';
    if (ocrProgressText && label) ocrProgressText.textContent = label;
  }


  async function extractTextFromPdf(file) {
    if (typeof pdfjsLib === 'undefined') throw new Error('pdf.js missing');
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    const parts = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      setOcrProgress(i / pdf.numPages, t('ocrWorking') + ' (' + i + '/' + pdf.numPages + ')');
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      // Собираем текст с учётом позиций — точнее, чем join через пробел вслепую
      let line = '';
      let lastY = null;
      const lines = [];
      content.items.forEach((item) => {
        const str = item.str || '';
        const y = item.transform ? item.transform[5] : 0;
        if (lastY !== null && Math.abs(y - lastY) > 5) {
          lines.push(line.trimEnd());
          line = '';
        }
        // hasEOL — явный конец строки из PDF
        if (item.hasEOL) {
          line += str;
          lines.push(line.trimEnd());
          line = '';
          lastY = null;
          return;
        }
        // не ставим лишний пробел, если следующий кусок «прилипает»
        const needSpace = line && str && !/\s$/.test(line) && !/^[,.;:!?)\]]/.test(str) && !/-$/.test(line);
        line += (needSpace ? ' ' : '') + str;
        lastY = y;
      });
      if (line.trim()) lines.push(line.trimEnd());
      parts.push(lines.join('\n').replace(/[ \t]+\n/g, '\n').trim());
    }
    return parts.filter(Boolean).join('\n\n');
  }

  function extractTextFromTextFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        let text = String(reader.result || '');
        // грубый HTML → text
        if (/\.html?$/i.test(file.name) || file.type === 'text/html') {
          const doc = new DOMParser().parseFromString(text, 'text/html');
          text = doc.body ? doc.body.innerText : text;
        }
        resolve(text);
      };
      reader.onerror = () => reject(reader.error || new Error('read fail'));
      reader.readAsText(file);
    });
  }

  function isSupportedTextFile(file) {
    const name = (file.name || '').toLowerCase();
    const type = (file.type || '').toLowerCase();
    if (type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
    if (
      type.startsWith('text/') ||
      name.endsWith('.txt') || name.endsWith('.text') ||
      name.endsWith('.md') || name.endsWith('.csv') ||
      name.endsWith('.html') || name.endsWith('.htm') ||
      name.endsWith('.rtf') || name.endsWith('.json') ||
      name.endsWith('.log') || name.endsWith('.tsv')
    ) return 'text';
    return null;
  }

  let ocrBusy = false;
  async function runOcrOnFile(file) {
    if (!file || ocrBusy) return;
    const kind = isSupportedTextFile(file);
    if (!kind) {
      showToast(t('ocrFail'));
      return;
    }
    ocrBusy = true;
    openModal(ocrModal);
    setOcrProgress(0.08, t('ocrWorking'));
    try {
      let text = '';
      if (kind === 'pdf') {
        text = await extractTextFromPdf(file);
      } else {
        setOcrProgress(0.5, t('ocrWorking'));
        text = await extractTextFromTextFile(file);
      }
      text = (text || '').replace(/\r\n/g, '\n').replace(/[ \t]+\n/g, '\n').trim();
      if (!text) {
        showToast(t('ocrFail'));
        return;
      }
      pushHistory();
      const holder = document.createElement('div');
      text.split('\n').forEach((line, i, arr) => {
        holder.appendChild(document.createTextNode(line));
        if (i < arr.length - 1) holder.appendChild(document.createElement('br'));
      });
      editor.innerHTML = holder.innerHTML;
      updateResult();
      updatePageGuides();
      updateStats();
      scheduleAutosave();
      closeModal(ocrModal);
      showToast(t('ocrDone'));
    } catch (err) {
      console.error(err);
      showToast(err && String(err.message || err).includes('missing') ? t('ocrNoLib') : t('ocrFail'));
    } finally {
      ocrBusy = false;
      if (ocrProgress) ocrProgress.classList.add('is-hidden');
      if (ocrBarFill) ocrBarFill.style.width = '0%';
      if (ocrFile) ocrFile.value = '';
    }
  }

  if (ocrBtn) ocrBtn.addEventListener('click', () => openModal(ocrModal));
  if (ocrModalClose) ocrModalClose.addEventListener('click', () => closeModal(ocrModal));
  if (ocrModal) ocrModal.addEventListener('click', (e) => { if (e.target === ocrModal) closeModal(ocrModal); });
  if (ocrDrop && ocrFile) {
    ocrDrop.addEventListener('click', () => ocrFile.click());
    ocrFile.addEventListener('change', () => {
      const f = ocrFile.files && ocrFile.files[0];
      if (f) runOcrOnFile(f);
    });
    ['dragenter', 'dragover'].forEach((ev) => {
      ocrDrop.addEventListener(ev, (e) => {
        e.preventDefault();
        ocrDrop.classList.add('is-dragover');
      });
    });
    ['dragleave', 'drop'].forEach((ev) => {
      ocrDrop.addEventListener(ev, (e) => {
        e.preventDefault();
        ocrDrop.classList.remove('is-dragover');
      });
    });
    ocrDrop.addEventListener('drop', (e) => {
      const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) runOcrOnFile(f);
    });
  }


  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.modal-overlay').forEach((m) => {
      if (!m.hidden) closeModal(m);
    });
  });


  /* ------------------------------------------------------------------ */
  /* 16. Стиль: фон изображения + без размытия блоков                     */
  /* ------------------------------------------------------------------ */

  const STYLE_KEY = 'ritext-style-v1';
  const STYLE_BG_MAX = 2.5 * 1024 * 1024; // 2.5 MB — localStorage limit safety
  const styleBtn = document.getElementById('styleBtn');
  const stylePopover = document.getElementById('stylePopover');
  const styleBgPick = document.getElementById('styleBgPick');
  const styleBgClear = document.getElementById('styleBgClear');
  const styleBgFile = document.getElementById('styleBgFile');
  const styleBgPreview = document.getElementById('styleBgPreview');
  const styleNoBlurBtn = document.getElementById('styleNoBlur');

  let styleState = { bg: null, noBlur: false, posX: 50, posY: 50, scale: 100, fit: 'scale' };

  function loadStyleState() {
    try {
      const raw = localStorage.getItem(STYLE_KEY);
      if (raw) styleState = Object.assign(styleState, JSON.parse(raw));
    } catch (e) { /* */ }
  }

  function saveStyleState() {
    try {
      // bg can be large; still try
      localStorage.setItem(STYLE_KEY, JSON.stringify(styleState));
    } catch (e) {
      // quota — keep in memory only
      try {
        const slim = { bg: null, noBlur: styleState.noBlur };
        localStorage.setItem(STYLE_KEY, JSON.stringify(slim));
      } catch (e2) { /* */ }
    }
  }


  /** Сжимает фон: меньше память/GPU, быстрее прокрутка */
  function compressBgImage(dataUrl, mime) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const maxW = 1600;
          const maxH = 1200;
          let w = img.naturalWidth || img.width;
          let h = img.naturalHeight || img.height;
          if (!w || !h) return resolve(dataUrl);
          const scale = Math.min(1, maxW / w, maxH / h);
          w = Math.round(w * scale);
          h = Math.round(h * scale);
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d', { alpha: false });
          if (!ctx) return resolve(dataUrl);
          ctx.drawImage(img, 0, 0, w, h);
          // JPEG почти всегда меньше PNG для фото
          const out = canvas.toDataURL('image/jpeg', 0.72);
          resolve(out && out.length < dataUrl.length ? out : dataUrl);
        } catch (e) {
          resolve(dataUrl);
        }
      };
      img.onerror = () => reject(new Error('img'));
      img.src = dataUrl;
    });
  }

  /** Точный размер фона в px по режиму и пропорциям фото */
  function computeExactBgSize(fit, scale, imgW, imgH) {
    const vw = window.innerWidth || document.documentElement.clientWidth || 1;
    const vh = window.innerHeight || document.documentElement.clientHeight || 1;
    const w = imgW || 0;
    const h = imgH || 0;

    // нет размеров — CSS-fallback
    if (!w || !h) {
      if (fit === 'width') return '100% auto';
      if (fit === 'height') return 'auto 100%';
      if (fit === 'cover') return 'cover';
      return (scale || 100) + '%';
    }

    let s;
    if (fit === 'width') {
      // ровно по ширине экрана, высота по пропорции
      s = vw / w;
    } else if (fit === 'height') {
      s = vh / h;
    } else if (fit === 'cover') {
      s = Math.max(vw / w, vh / h);
    } else if (fit === 'contain') {
      s = Math.min(vw / w, vh / h);
    } else {
      // ручной масштаб: 100% = «по ширине»
      s = (vw / w) * ((scale || 100) / 100);
    }
    return Math.round(w * s) + 'px ' + Math.round(h * s) + 'px';
  }

  function applyStyleState() {
    const layer = document.getElementById('userBgLayer');
    const blurEl = document.getElementById('userBgBlur');
    const photoEl = document.getElementById('userBgPhoto');
    const sliders = document.getElementById('styleSliders');
    const posX = styleState.posX != null ? styleState.posX : 50;
    const posY = styleState.posY != null ? styleState.posY : 50;
    const scale = styleState.scale != null ? styleState.scale : 100;
    const pos = posX + '% ' + posY + '%';
    const fit = styleState.fit || 'scale';
    const exactSize = computeExactBgSize(fit, scale, styleState.imgW, styleState.imgH);

    if (styleState.bg) {
      htmlEl.classList.add('has-user-bg');
      const url = 'url("' + styleState.bg + '")';
      if (blurEl) {
        blurEl.style.backgroundImage = url;
        blurEl.style.backgroundPosition = pos;
        // подложка всегда cover — без пустых краёв
        blurEl.style.backgroundSize = 'cover';
      }
      if (photoEl) {
        photoEl.style.backgroundImage = url;
        photoEl.style.backgroundPosition = pos;
        photoEl.classList.remove('is-fit-width', 'is-fit-height', 'is-fit-cover');
        if (fit === 'width') photoEl.classList.add('is-fit-width');
        else if (fit === 'height') photoEl.classList.add('is-fit-height');
        else if (fit === 'cover') photoEl.classList.add('is-fit-cover');
        photoEl.style.backgroundSize = exactSize;
      }
      if (layer) layer.style.backgroundImage = '';
      if (sliders) sliders.classList.remove('is-disabled');
      if (styleBgPreview) {
        styleBgPreview.classList.remove('is-empty');
        styleBgPreview.style.backgroundImage = url;
        styleBgPreview.style.backgroundPosition = pos;
        styleBgPreview.style.backgroundSize = exactSize;
      }
    } else {
      htmlEl.classList.remove('has-user-bg');
      if (blurEl) blurEl.style.backgroundImage = '';
      if (photoEl) {
        photoEl.style.backgroundImage = '';
        photoEl.style.backgroundSize = '';
        photoEl.style.backgroundPosition = '';
        photoEl.classList.remove('is-fit-width', 'is-fit-height', 'is-fit-cover');
      }
      if (styleBgPreview) {
        styleBgPreview.classList.add('is-empty');
        styleBgPreview.style.backgroundImage = '';
      }
      if (sliders) sliders.classList.add('is-disabled');
    }

    // sync sliders UI
    const sx = document.getElementById('stylePosX');
    const sy = document.getElementById('stylePosY');
    const ss = document.getElementById('styleScale');
    if (sx) sx.value = String(posX);
    if (sy) sy.value = String(posY);
    if (ss) ss.value = String(scale);

    htmlEl.classList.toggle('no-glass-blur', !!styleState.noBlur);
    if (styleNoBlurBtn) {
      styleNoBlurBtn.setAttribute('aria-checked', String(!!styleState.noBlur));
    }
    // fit buttons
    document.querySelectorAll('.style-fit-btn').forEach((b) => b.classList.remove('is-active'));
    const fitMap = { width: 'styleFitWidth', height: 'styleFitHeight', cover: 'styleFitCover' };
    if (fitMap[fit]) {
      const btn = document.getElementById(fitMap[fit]);
      if (btn) btn.classList.add('is-active');
    }
  }

  function openStylePopover() {
    if (!stylePopover) return;
    stylePopover.hidden = false;
    if (styleBtn) styleBtn.setAttribute('aria-expanded', 'true');
  }

  function closeStylePopover() {
    if (!stylePopover) return;
    stylePopover.hidden = true;
    if (styleBtn) styleBtn.setAttribute('aria-expanded', 'false');
  }

  if (styleBtn && stylePopover) {
    styleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (stylePopover.hidden) openStylePopover();
      else closeStylePopover();
    });
    // клики внутри панели не закрывают её
    stylePopover.addEventListener('mousedown', (e) => e.stopPropagation());
    stylePopover.addEventListener('click', (e) => e.stopPropagation());
    // закрытие только по клику снаружи .style-wrap
    document.addEventListener('mousedown', (e) => {
      if (!stylePopover || stylePopover.hidden) return;
      const wrap = e.target && e.target.closest && e.target.closest('.style-wrap');
      if (!wrap) closeStylePopover();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeStylePopover();
    });
  }

  if (styleBgPick && styleBgFile) {
    styleBgPick.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      styleBgFile.click();
    });
    styleBgFile.addEventListener('change', () => {
      const file = styleBgFile.files && styleBgFile.files[0];
      styleBgFile.value = '';
      if (!file) return;
      if (!file.type || !file.type.startsWith('image/')) {
        showToast(t('styleBgBad'));
        return;
      }
      if (file.size > STYLE_BG_MAX) {
        showToast(t('styleBgTooBig'));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const raw = String(reader.result || '');
        compressBgImage(raw, file.type).then((dataUrl) => {
          const finalUrl = dataUrl || raw;
          const img = new Image();
          img.onload = () => {
            styleState.bg = finalUrl;
            styleState.imgW = img.naturalWidth || img.width;
            styleState.imgH = img.naturalHeight || img.height;
            // широкое фото → сразу точно по ширине экрана
            if (styleState.imgW >= styleState.imgH) {
              styleState.fit = 'width';
              styleState.posX = 50;
              styleState.posY = 50;
              styleState.scale = 100;
            } else {
              styleState.fit = 'height';
              styleState.posX = 50;
              styleState.posY = 50;
              styleState.scale = 100;
            }
            applyStyleState();
            saveStyleState();
            showToast(t('styleBgSet'));
          };
          img.onerror = () => {
            styleState.bg = finalUrl;
            styleState.fit = 'width';
            applyStyleState();
            saveStyleState();
            showToast(t('styleBgSet'));
          };
          img.src = finalUrl;
        }).catch(() => {
          styleState.bg = raw;
          styleState.fit = 'width';
          applyStyleState();
          saveStyleState();
          showToast(t('styleBgSet'));
        });
      };
      reader.onerror = () => showToast(t('styleBgBad'));
      reader.readAsDataURL(file);
    });
  }

  if (styleBgClear) {
    styleBgClear.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      styleState.bg = null;
      styleState.imgW = null;
      styleState.imgH = null;
      applyStyleState();
      saveStyleState();
      showToast(t('styleBgRemoved'));
    });
  }

  if (styleNoBlurBtn) {
    styleNoBlurBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      styleState.noBlur = !styleState.noBlur;
      applyStyleState();
      saveStyleState();
    });
  }

  function bindStyleSlider(id, key) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      styleState[key] = parseInt(el.value, 10);
      applyStyleState();
    });
    el.addEventListener('change', () => saveStyleState());
  }
  bindStyleSlider('stylePosX', 'posX');
  bindStyleSlider('stylePosY', 'posY');
  // scale slider switches to manual scale mode
  const scaleEl = document.getElementById('styleScale');
  if (scaleEl) {
    scaleEl.addEventListener('input', () => {
      styleState.scale = parseInt(scaleEl.value, 10);
      styleState.fit = 'scale';
      applyStyleState();
    });
    scaleEl.addEventListener('change', () => saveStyleState());
  }

  function setBgFit(mode) {
    if (!styleState.bg) {
      showToast(t('styleBgBad'));
      return;
    }
    styleState.fit = mode;
    if (mode === 'cover' || mode === 'width' || mode === 'height') {
      styleState.posX = 50;
      styleState.posY = 50;
    }
    applyStyleState();
    saveStyleState();
  }
  function bindFitBtn(id, mode) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      setBgFit(mode);
    });
  }
  bindFitBtn('styleFitWidth', 'width');
  bindFitBtn('styleFitHeight', 'height');
  bindFitBtn('styleFitCover', 'cover');

  loadStyleState();
  // defaults for older saves
  if (styleState.posX == null) styleState.posX = 50;
  if (styleState.posY == null) styleState.posY = 50;
  if (styleState.scale == null) styleState.scale = 100;
  if (!styleState.fit) styleState.fit = 'scale';

  // восстановить размеры фото после перезагрузки
  if (styleState.bg && (!styleState.imgW || !styleState.imgH)) {
    const probe = new Image();
    probe.onload = () => {
      styleState.imgW = probe.naturalWidth || probe.width;
      styleState.imgH = probe.naturalHeight || probe.height;
      if (styleState.imgW >= styleState.imgH && styleState.fit === 'scale') {
        styleState.fit = 'width';
      }
      applyStyleState();
    };
    probe.src = styleState.bg;
  }
  applyStyleState();

  // при ресайзе окна пересчитываем точный размер (особенно для широких фото)
  let styleBgResizeTimer = null;
  window.addEventListener('resize', () => {
    if (!styleState.bg) return;
    clearTimeout(styleBgResizeTimer);
    styleBgResizeTimer = setTimeout(() => applyStyleState(), 120);
  });


  // Инициализация
  updateStats();
  restoreDraft();


  // включаем плавные переходы только после первой отрисовки
  requestAnimationFrame(() => requestAnimationFrame(() => {
    htmlEl.classList.remove('is-booting');
  }));

  updatePageGuides();

})();
