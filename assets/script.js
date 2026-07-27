// COBOL Academy — progress tracking (localStorage) + quiz logic
const TOTAL_LESSONS = 20;
const STORAGE_KEY = 'cobol-academy-progress';

function getProgress(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  }catch(e){ return {}; }
}
function setLessonDone(n){
  const p = getProgress();
  p[n] = true;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}
function countDone(){
  const p = getProgress();
  return Object.keys(p).filter(k => p[k]).length;
}

// ---- home page: render progress meter + card states ----
function initHome(){
  const meterFill = document.querySelector('.meter-fill');
  const pctLabel = document.querySelector('.pct');
  const countLabel = document.querySelector('.count-label');
  if(!meterFill) return;
  const done = countDone();
  const pct = Math.round((done / TOTAL_LESSONS) * 100);
  meterFill.style.width = pct + '%';
  if(pctLabel) pctLabel.textContent = pct + '%';
  if(countLabel) countLabel.textContent = `${done} מתוך ${TOTAL_LESSONS} שיעורים הושלמו`;

  const progress = getProgress();
  document.querySelectorAll('.card[data-lesson]').forEach(card => {
    const n = card.getAttribute('data-lesson');
    if(progress[n]) card.classList.add('done');
  });
}

// ---- lesson page: mark-complete button ----
function initLesson(lessonNum){
  const row = document.querySelector('.complete-row');
  const btn = document.querySelector('.mark-done-btn');
  if(!row || !btn) return;
  const progress = getProgress();
  if(progress[lessonNum]) row.classList.add('done');
  btn.addEventListener('click', () => {
    setLessonDone(lessonNum);
    row.classList.add('done');
  });
}

// ---- quiz page: single-answer selection with feedback ----
function initQuiz(){
  const items = document.querySelectorAll('.quiz-item');
  if(!items.length) return;
  const resultBox = document.querySelector('.quiz-result');
  const answered = new Set();

  items.forEach((item, idx) => {
    const correct = item.getAttribute('data-correct');
    item.querySelectorAll('.opt').forEach(opt => {
      opt.addEventListener('click', () => {
        if(item.classList.contains('locked')) return;
        item.classList.add('locked');
        answered.add(idx);
        const val = opt.getAttribute('data-value');
        item.querySelectorAll('.opt').forEach(o => {
          if(o.getAttribute('data-value') === correct) o.classList.add('correct');
        });
        if(val !== correct) opt.classList.add('wrong');

        if(answered.size === items.length){
          let score = 0;
          items.forEach(it => {
            const c = it.getAttribute('data-correct');
            if(it.querySelector(`.opt.wrong`) === null) score++;
          });
          if(resultBox){
            resultBox.textContent = `הציון שלך: ${score} מתוך ${items.length}`;
            resultBox.style.display = 'block';
          }
        }
      }, { once: false });
    });
  });
}

// ---- exercises: type-your-answer + check, then reveal full explanation ----
function normalize(s){
  return (s || '').trim().toUpperCase().replace(/\s+/g, ' ').replace(/["'.]/g, '');
}
function initExercises(){
  document.querySelectorAll('.exercise').forEach(ex => {
    const input = ex.querySelector('.try-input');
    const btn = ex.querySelector('.try-btn');
    const feedback = ex.querySelector('.feedback');
    const reveal = ex.querySelector('.reveal');
    const answer = ex.getAttribute('data-answer');
    if(!input || !btn) return;

    function check(){
      const val = normalize(input.value);
      if(!val){
        feedback.textContent = 'הקלידו תשובה לפני שבודקים.';
        feedback.className = 'feedback';
        return;
      }
      if(answer){
        if(val === normalize(answer)){
          feedback.textContent = '✓ נכון!';
          feedback.className = 'feedback ok';
        }else{
          feedback.textContent = '✗ לא מדויק — נסו שוב, או פתחו את ההסבר המלא למטה.';
          feedback.className = 'feedback err';
        }
      }else{
        feedback.textContent = 'עכשיו השוו את מה שכתבתם להסבר המלא למטה 👇';
        feedback.className = 'feedback';
        if(reveal) reveal.setAttribute('open', '');
      }
    }
    btn.addEventListener('click', check);
    input.addEventListener('keydown', e => {
      if(e.key === 'Enter'){ e.preventDefault(); check(); }
    });
  });
}

// ---- end-of-part code challenges: keyword-presence check + reveal sample solution ----
function initCodeChallenges(){
  document.querySelectorAll('.code-challenge').forEach(ch => {
    const textarea = ch.querySelector('.code-try');
    const btn = ch.querySelector('.try-btn-code');
    const feedback = ch.querySelector('.feedback');
    const reveal = ch.querySelector('.reveal');
    const keywords = (ch.getAttribute('data-keywords') || '').split(',').map(k => k.trim()).filter(Boolean);
    if(!textarea || !btn) return;

    btn.addEventListener('click', () => {
      const code = normalize(textarea.value);
      if(!code){
        feedback.textContent = 'כתבו קוד בתיבה לפני שבודקים.';
        feedback.className = 'feedback';
        return;
      }
      const missing = keywords.filter(k => !code.includes(normalize(k)));
      if(missing.length === 0){
        feedback.textContent = '✓ מצוין! נמצאו כל האלמנטים המרכזיים בקוד שלכם.';
        feedback.className = 'feedback ok';
      }else{
        feedback.textContent = '✗ עדיין חסר: ' + missing.join(', ') + ' — נסו להוסיף, או השוו לפתרון למטה.';
        feedback.className = 'feedback err';
      }
      if(reveal) reveal.setAttribute('open', '');
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initHome();
  if(window.__LESSON_NUM__) initLesson(window.__LESSON_NUM__);
  initQuiz();
  initExercises();
  initCodeChallenges();
  initCodeEditors();
});

// ---- code editor: syntax highlighting + keyword autocomplete for .code-try textareas ----
const COBOL_KEYWORDS = [
  'IDENTIFICATION DIVISION','ENVIRONMENT DIVISION','DATA DIVISION','PROCEDURE DIVISION',
  'WORKING-STORAGE SECTION','FILE-CONTROL','FILE SECTION','PROGRAM-ID',
  'END-EVALUATE','END-PERFORM','END-IF','END-STRING','END-UNSTRING','END-READ',
  'EVALUATE','WHEN OTHER','WHEN','PERFORM VARYING','PERFORM UNTIL','PERFORM',
  'VARYING','UNTIL','TIMES','FROM','BY','THRU',
  'DISPLAY','ACCEPT','MOVE','ADD','SUBTRACT','MULTIPLY','DIVIDE',
  'GIVING','REMAINDER','TO','INTO','IF','ELSE',
  'STRING','UNSTRING','DELIMITED BY SIZE','DELIMITED BY SPACE','DELIMITED BY',
  'OCCURS','COPY','SELECT','ASSIGN TO','ORGANIZATION IS','FD',
  'OPEN INPUT','OPEN OUTPUT','OPEN','READ','WRITE','CLOSE','AT END',
  'STOP RUN','VALUE','PIC','SPACES','ZERO'
].sort((a,b) => b.length - a.length);

function escapeHtml(s){
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function highlightCobol(src){
  const escaped = escapeHtml(src);
  const kwPattern = COBOL_KEYWORDS.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const combined = new RegExp('("[^"]*")|\\b(' + kwPattern + ')\\b', 'gi');
  return escaped.replace(combined, (m, str, kw) => {
    if(str) return '<span class="tok-str">' + str + '</span>';
    return '<span class="tok-kw">' + kw + '</span>';
  });
}

function currentWord(text, caret){
  let start = caret;
  while(start > 0 && /[A-Za-z0-9-]/.test(text[start-1])) start--;
  let end = caret;
  while(end < text.length && /[A-Za-z0-9-]/.test(text[end])) end++;
  return { word: text.slice(start, end), start, end };
}

const AUTOCOMPLETE_LIST = [
  'IDENTIFICATION DIVISION','ENVIRONMENT DIVISION','DATA DIVISION','PROCEDURE DIVISION',
  'WORKING-STORAGE SECTION','PROGRAM-ID','DISPLAY','ACCEPT','MOVE','ADD','SUBTRACT',
  'MULTIPLY','DIVIDE','GIVING','REMAINDER','IF','ELSE','END-IF','EVALUATE','WHEN',
  'WHEN OTHER','END-EVALUATE','PERFORM','VARYING','UNTIL','TIMES','END-PERFORM',
  'OCCURS','STRING','UNSTRING','DELIMITED BY','INTO','COPY','SELECT','ASSIGN TO',
  'FD','OPEN','READ','WRITE','CLOSE','AT END','STOP RUN','PIC','VALUE'
];

function enhanceCodeEditor(textarea){
  const wrap = document.createElement('div');
  wrap.className = 'code-editor-wrap';
  textarea.parentNode.insertBefore(wrap, textarea);

  const highlight = document.createElement('pre');
  highlight.className = 'code-editor-highlight';
  highlight.innerHTML = highlightCobol(textarea.value);
  wrap.appendChild(highlight);
  wrap.appendChild(textarea);

  const suggest = document.createElement('div');
  suggest.className = 'code-suggest';
  suggest.hidden = true;
  wrap.parentNode.insertBefore(suggest, wrap.nextSibling);

  function refreshHighlight(){
    highlight.innerHTML = highlightCobol(textarea.value) + '\n';
    highlight.scrollTop = textarea.scrollTop;
    highlight.scrollLeft = textarea.scrollLeft;
  }

  function refreshSuggestions(){
    const caret = textarea.selectionStart;
    const { word } = currentWord(textarea.value, caret);
    if(word.length < 2){ suggest.hidden = true; suggest.innerHTML = ''; return; }
    const matches = AUTOCOMPLETE_LIST.filter(k =>
      k.toUpperCase().startsWith(word.toUpperCase()) && k.toUpperCase() !== word.toUpperCase()
    ).slice(0, 6);
    if(matches.length === 0){ suggest.hidden = true; suggest.innerHTML = ''; return; }
    suggest.innerHTML = '';
    matches.forEach(m => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.textContent = m;
      chip.addEventListener('mousedown', ev => {
        ev.preventDefault();
        const { start, end } = currentWord(textarea.value, textarea.selectionStart);
        const before = textarea.value.slice(0, start);
        const after = textarea.value.slice(end);
        textarea.value = before + m + after;
        const newCaret = (before + m).length;
        textarea.focus();
        textarea.setSelectionRange(newCaret, newCaret);
        refreshHighlight();
        suggest.hidden = true;
        suggest.innerHTML = '';
      });
      suggest.appendChild(chip);
    });
    suggest.hidden = false;
  }

  textarea.addEventListener('input', () => { refreshHighlight(); refreshSuggestions(); });
  textarea.addEventListener('keyup', refreshSuggestions);
  textarea.addEventListener('click', refreshSuggestions);
  textarea.addEventListener('scroll', () => {
    highlight.scrollTop = textarea.scrollTop;
    highlight.scrollLeft = textarea.scrollLeft;
  });
  textarea.addEventListener('keydown', e => {
    if(e.key === 'Tab' && !suggest.hidden && suggest.firstChild){
      e.preventDefault();
      suggest.firstChild.dispatchEvent(new Event('mousedown', { bubbles: true, cancelable: true }));
    }
    if(e.key === 'Escape'){ suggest.hidden = true; suggest.innerHTML = ''; }
  });
  textarea.addEventListener('blur', () => {
    setTimeout(() => { suggest.hidden = true; suggest.innerHTML = ''; }, 150);
  });
}

function initCodeEditors(){
  document.querySelectorAll('.code-try').forEach(enhanceCodeEditor);
}
