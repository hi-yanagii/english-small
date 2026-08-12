let currentGrade = '5';
let wordList = [];
let currentWord = null;
let currentRange = '';
let currentAudio = null;
let isJapaneseToEnglish = false; // 和英モードフラグ

// UI要素
const gradeScreen = document.getElementById('grade-screen');
const selectScreen = document.getElementById('select-screen');
const studyScreen = document.getElementById('study-screen');
const completeScreen = document.getElementById('complete-screen');
const selectTitle = document.getElementById('select-title');
const progressText = document.getElementById('progress-text');
const wordText = document.getElementById('word-text');
const meaningText = document.getElementById('meaning-text');

const flipBtn = document.getElementById('flip-btn');
const judgeBtnGroup = document.getElementById('judge-btn-group');
const forgetBtn = document.getElementById('forget-btn');
const rememberBtn = document.getElementById('remember-btn');

const backToGradeBtn = document.getElementById('back-to-grade-btn');
const changePartBtn = document.getElementById('change-part-btn');
const saveBtn = document.getElementById('save-btn');
const keepBtn = document.getElementById('keep-btn');
const resetBtn = document.getElementById('reset-btn');
const toast = document.getElementById('toast');
const partListContainer = document.getElementById('part-list');
const speakerBtn = document.getElementById('speaker-btn');
const weakModeBtn = document.getElementById('weak-mode-btn');
const clearRecordBtn = document.getElementById('clear-record-btn');
const jaToEnModeBtn = document.getElementById('ja-to-en-mode-btn');

const weakListBtn = document.getElementById('weak-list-btn');
const modalOverlay = document.getElementById('modal-overlay');
const closeModalBtn = document.getElementById('close-modal-btn');
const weakTableBody = document.getElementById('weak-table-body');
const modalTitle = document.getElementById('modal-title');

// 3・4・5級のカテゴリー表示名定義
const categoryNames = {
  "5": [
    { key: "1_date", name: "① 日時・カレンダー" },
    { key: "2_num_color", name: "② 数・色・基本" },
    { key: "3_school_sports", name: "③ 身の回り・学校" },
    { key: "4_family_body", name: "④ 家族・人・体" },
    { key: "5_food_nature", name: "⑤ 食べ物・生き物・自然" },
    { key: "6_places_town", name: "⑥ 建物・場所・乗り物" },
    { key: "7_verbs", name: "⑦ 基本の動作（動詞）" },
    { key: "8_adjectives", name: "⑧ 気持ち・状態（形容詞・副詞）" },
    { key: "9_pronouns", name: "⑨ 代名詞・疑問詞・つなぎ言葉" },
    { key: "10_phrases", name: "⑩ あいさつ・基本熟語" }
  ],
  "4": [
    { key: "1_study_info", name: "① 学校・学習・情報" },
    { key: "2_town_places", name: "② 街・施設・交通" },
    { key: "3_nature_env", name: "③ 自然・環境・地球" },
    { key: "4_jobs_society", name: "④ 職業・人と社会" },
    { key: "5_mind_verbs", name: "⑤ 気持ち・心の動詞" },
    { key: "6_action_verbs", name: "⑥ 変化・移動の動詞" },
    { key: "7_adjectives", name: "⑦ 状態・評価の形容詞" },
    { key: "8_adverbs", name: "⑧ 様子・度合いの副詞" },
    { key: "9_phrases", name: "⑨ 重要熟語・連語" },
    { key: "10_conversations", name: "⑩ 会話・日常フレーズ" }
  ],
  "3": [
    { key: "1_daily", name: "① 日常生活・趣味" },
    { key: "2_school_life", name: "② 学校・話題" },
    { key: "3_travel", name: "③ 旅行・交通" },
    { key: "4_verbs", name: "④ 3級重要動詞" },
    { key: "5_adjectives", name: "⑤ 状態・評価の形容詞" },
    { key: "6_phrases", name: "⑥ 熟語・慣用表現" }
  ]
};

const gradeDisplayNames = {
  "5": "英検 5級",
  "4": "英検 4級",
  "3": "英検 3級"
};

function playAudio(word) {
  if (!word) return;

  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  const fileName = word.toLowerCase().replace(/\s+/g, '_');
  currentAudio = new Audio(`audio/${fileName}.mp3`);
  currentAudio.volume = 1.0;

  const playPromise = currentAudio.play();
  if (playPromise !== undefined) {
    playPromise.catch(() => {
      speakWithTTS(word);
    });
  }
}

function speakWithTTS(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const uttr = new SpeechSynthesisUtterance(text);
    uttr.lang = 'en-US';
    uttr.rate = 0.85;
    uttr.volume = 1.0;
    window.speechSynthesis.speak(uttr);
  }
}

function getStorageKey() {
  return `eiken${currentGrade}_mastered_ids`;
}

function getWeakStorageKey() {
  return `eiken${currentGrade}_weak_ids`;
}

function getMasteredIds() {
  const saved = localStorage.getItem(getStorageKey());
  return saved ? JSON.parse(saved) : [];
}

function saveMasteredIds(ids) {
  localStorage.setItem(getStorageKey(), JSON.stringify(ids));
}

function getWeakIds() {
  const saved = localStorage.getItem(getWeakStorageKey());
  return saved ? JSON.parse(saved) : [];
}

function saveWeakIds(ids) {
  localStorage.setItem(getWeakStorageKey(), JSON.stringify(ids));
}

function addWeakId(id) {
  const weakIds = getWeakIds();
  if (!weakIds.includes(id)) {
    weakIds.push(id);
    saveWeakIds(weakIds);
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 1500);
}

function selectGrade(grade) {
  currentGrade = grade;
  selectTitle.textContent = `${gradeDisplayNames[currentGrade] || `英検${currentGrade}級`}単語帳`;
  
  gradeScreen.classList.add('hidden');
  selectScreen.classList.remove('hidden');
  
  renderPartButtons();
}

function renderPartButtons() {
  partListContainer.innerHTML = '';
  const masteredIds = getMasteredIds();
  const weakIds = getWeakIds();
  const allGradeWords = (typeof wordsData !== 'undefined' && wordsData[currentGrade]) ? wordsData[currentGrade] : [];
  const categories = categoryNames[currentGrade] || [];

  const currentWeakWords = allGradeWords.filter(w => weakIds.includes(w.id));
  weakModeBtn.textContent = `🔥 苦手単語集中暗記 (${currentWeakWords.length}語)`;
  if (currentWeakWords.length === 0) {
    weakModeBtn.disabled = true;
    weakListBtn.disabled = true;
  } else {
    weakModeBtn.disabled = false;
    weakListBtn.disabled = false;
  }

  categories.forEach(cat => {
    const partWords = allGradeWords.filter(w => w.part === cat.key);
    const isCompleted = partWords.length > 0 && partWords.every(w => masteredIds.includes(w.id));

    const wrapper = document.createElement('div');
    wrapper.className = 'btn-part-wrapper';

    const btn = document.createElement('button');
    btn.className = 'btn btn-part';
    btn.textContent = `${cat.name} (${partWords.length}語)`;
    
    if (isCompleted) {
      btn.classList.add('btn-completed');
    }
    
    btn.onclick = () => selectRange(cat.key, false);
    wrapper.appendChild(btn);
    partListContainer.appendChild(wrapper);
  });

  const allWrapper = document.createElement('div');
  allWrapper.className = 'btn-part-wrapper';

  const allBtn = document.createElement('button');
  allBtn.className = 'btn btn-part';
  allBtn.textContent = `全範囲 (${allGradeWords.length}語)`;

  const isAllCompleted = allGradeWords.length > 0 && allGradeWords.every(w => masteredIds.includes(w.id));
  if (isAllCompleted) {
    allBtn.classList.add('btn-completed');
  }

  allBtn.onclick = () => selectRange('all', false);
  allWrapper.appendChild(allBtn);
  partListContainer.appendChild(allWrapper);
}

function selectRange(range, isJaToEn = false) {
  currentRange = range;
  isJapaneseToEnglish = isJaToEn;
  const allGradeWords = (typeof wordsData !== 'undefined' && wordsData[currentGrade]) ? wordsData[currentGrade] : [];
  
  let filtered = [];
  if (range === 'all') {
    filtered = allGradeWords;
  } else if (range === 'weak') {
    const weakIds = getWeakIds();
    filtered = allGradeWords.filter(w => weakIds.includes(w.id));
  } else {
    filtered = allGradeWords.filter(w => w.part === range);
  }

  const masteredIds = getMasteredIds();

  wordList = filtered.map(w => ({
    ...w,
    isMastered: (range === 'weak') ? false : masteredIds.includes(w.id)
  }));
  
  selectScreen.classList.add('hidden');
  studyScreen.classList.remove('hidden');
  completeScreen.classList.add('hidden');
  
  flipBtn.textContent = isJapaneseToEnglish ? "英語訳" : "日本語訳";

  pickNextWord();
}

function pickNextWord() {
  const unmastered = wordList.filter(w => !w.isMastered);

  if (unmastered.length === 0) {
    studyScreen.classList.add('hidden');
    completeScreen.classList.remove('hidden');
    return;
  }

  progressText.textContent = `残り: ${unmastered.length} / ${wordList.length}`;

  let available = unmastered;
  if (unmastered.length > 1 && currentWord) {
    available = unmastered.filter(w => w.id !== currentWord.id);
  }

  const randomIndex = Math.floor(Math.random() * available.length);
  currentWord = available[randomIndex];

  if (isJapaneseToEnglish) {
    wordText.textContent = currentWord.meaning;
    meaningText.textContent = currentWord.word;
  } else {
    wordText.textContent = currentWord.word;
    meaningText.textContent = currentWord.meaning;
  }

  meaningText.classList.add('invisible');
  flipBtn.classList.remove('hidden');
  judgeBtnGroup.classList.add('hidden');
}

function openWeakListModal() {
  const weakIds = getWeakIds();
  const allGradeWords = (typeof wordsData !== 'undefined' && wordsData[currentGrade]) ? wordsData[currentGrade] : [];
  const currentWeakWords = allGradeWords.filter(w => weakIds.includes(w.id));

  modalTitle.textContent = `${gradeDisplayNames[currentGrade] || `英検${currentGrade}級`} 苦手単語 (${currentWeakWords.length}語)`;
  weakTableBody.innerHTML = '';

  currentWeakWords.forEach(item => {
    const tr = document.createElement('tr');
    tr.dataset.id = item.id;

    const tdCheck = document.createElement('td');
    tdCheck.style.textAlign = 'center';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    tdCheck.appendChild(checkbox);
    tr.appendChild(tdCheck);

    const tdWord = document.createElement('td');
    tdWord.style.fontWeight = 'bold';
    tdWord.textContent = item.word;
    tr.appendChild(tdWord);

    const tdMeaning = document.createElement('td');
    tdMeaning.textContent = item.meaning;
    tr.appendChild(tdMeaning);

    const tdAudio = document.createElement('td');
    tdAudio.style.textAlign = 'center';
    const audioBtn = document.createElement('button');
    audioBtn.className = 'audio-btn';
    audioBtn.textContent = '🔊';
    audioBtn.onclick = () => playAudio(item.word);
    tdAudio.appendChild(audioBtn);
    tr.appendChild(tdAudio);

    weakTableBody.appendChild(tr);
  });

  modalOverlay.classList.remove('hidden');
}

function saveCheckedWeakWords() {
  const rows = weakTableBody.querySelectorAll('tr');
  let weakIds = getWeakIds();
  let changed = false;

  rows.forEach(tr => {
    const checkbox = tr.querySelector('input[type="checkbox"]');
    if (checkbox && checkbox.checked) {
      const id = parseInt(tr.dataset.id);
      weakIds = weakIds.filter(wId => wId !== id);
      changed = true;
    }
  });

  if (changed) {
    saveWeakIds(weakIds);
    renderPartButtons();
    showToast("苦手リストを更新しました");
  }
}

// イベント登録
weakListBtn.addEventListener('click', () => {
  openWeakListModal();
});

closeModalBtn.addEventListener('click', () => {
  saveCheckedWeakWords();
  modalOverlay.classList.add('hidden');
});

modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) {
    saveCheckedWeakWords();
    modalOverlay.classList.add('hidden');
  }
});

if (speakerBtn) {
  speakerBtn.addEventListener('click', () => {
    if (currentWord) playAudio(currentWord.word);
  });
}

wordText.style.cursor = 'pointer';
wordText.addEventListener('click', () => {
  if (currentWord) playAudio(currentWord.word);
});

flipBtn.addEventListener('click', () => {
  meaningText.classList.remove('invisible');
  flipBtn.classList.add('hidden');
  judgeBtnGroup.classList.remove('hidden');

  if (currentWord) {
    playAudio(currentWord.word);
  }
});

forgetBtn.addEventListener('click', () => {
  if (currentWord) {
    addWeakId(currentWord.id);
  }
  pickNextWord();
});

rememberBtn.addEventListener('click', () => {
  currentWord.isMastered = true;

  if (currentRange !== 'weak') {
    const masteredIds = getMasteredIds();
    if (!masteredIds.includes(currentWord.id)) {
      masteredIds.push(currentWord.id);
      saveMasteredIds(masteredIds);
    }
  }

  pickNextWord();
});

backToGradeBtn.addEventListener('click', () => {
  selectScreen.classList.add('hidden');
  gradeScreen.classList.remove('hidden');
});

changePartBtn.addEventListener('click', () => {
  if (currentAudio) currentAudio.pause();

  studyScreen.classList.add('hidden');
  renderPartButtons();
  selectScreen.classList.remove('hidden');
});

saveBtn.addEventListener('click', () => {
  if (currentRange !== 'weak') {
    const masteredIds = getMasteredIds();
    wordList.forEach(w => {
      if (w.isMastered && !masteredIds.includes(w.id)) {
        masteredIds.push(w.id);
      }
    });
    saveMasteredIds(masteredIds);
  }
  showToast("進捗を保存しました！");
});

keepBtn.addEventListener('click', () => {
  completeScreen.classList.add('hidden');
  renderPartButtons();
  selectScreen.classList.remove('hidden');
});

resetBtn.addEventListener('click', () => {
  if (confirm("現在の範囲の進捗をリセットして最初からやり直しますか？")) {
    if (currentRange === 'weak') {
      saveWeakIds([]);
    } else {
      const masteredIds = getMasteredIds();
      const currentPartIds = wordList.map(w => w.id);
      const updatedIds = masteredIds.filter(id => !currentPartIds.includes(id));
      saveMasteredIds(updatedIds);
    }

    completeScreen.classList.add('hidden');
    renderPartButtons();
    selectScreen.classList.remove('hidden');
  }
});

clearRecordBtn.addEventListener('click', () => {
  const name = gradeDisplayNames[currentGrade] || `英検${currentGrade}級`;
  if (confirm(`今までの学習記録（${name}）をクリアしますか？`)) {
    saveMasteredIds([]);
    saveWeakIds([]);
    renderPartButtons();
    showToast(`${name}の記録を消去しました`);
  }
});

if (jaToEnModeBtn) {
  jaToEnModeBtn.addEventListener('click', () => {
    selectRange('all', true);
  });
}
