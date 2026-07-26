// COBOL Academy — progress tracking (localStorage) + quiz logic
const TOTAL_LESSONS = 17;
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

document.addEventListener('DOMContentLoaded', () => {
  initHome();
  if(window.__LESSON_NUM__) initLesson(window.__LESSON_NUM__);
  initQuiz();
  initExercises();
});
