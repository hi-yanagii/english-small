// --- 基本設定と変数の準備 ---
let currentGrade = '5'; // 現在選択中の級（初期値は5級）
let wordList = [];      // 勉強する単語のリストを格納する場所
let currentWord = null; // 現在出題中の単語データを保持する変数
let currentRange = '';  // 選択したカテゴリー範囲（例: '1_date'）
let currentAudio = null;// 音声再生の管理用
let isJapaneseToEnglish = false; // 和英モードかどうかの判定フラグ
let wordHistory = [];   // 「前に戻る」機能を実現するための履歴配列

// --- UI要素（HTML上のボタンや画面）の取得 ---
const gradeScreen = document.getElementById('grade-screen'); // 級選択画面
const selectScreen = document.getElementById('select-screen'); // カテゴリー選択画面
const studyScreen = document.getElementById('study-screen'); // 学習画面
const completeScreen = document.getElementById('complete-screen'); // 完了画面
const selectTitle = document.getElementById('select-title'); // 選択画面のタイトル
const progressText = document.getElementById('progress-text'); // 進捗表示テキスト
const wordText = document.getElementById('word-text'); // 単語表示部分
const meaningText = document.getElementById('meaning-text'); // 意味表示部分

const flipBtn = document.getElementById('flip-btn'); // 「意味を見る」ボタン
const judgeBtnGroup = document.getElementById('judge-btn-group'); // 判定ボタンのグループ
const forgetBtn = document.getElementById('forget-btn'); // 「苦手」ボタン
const rememberBtn = document.getElementById('remember-btn'); // 「覚えた」ボタン

const backToGradeBtn = document.getElementById('back-to-grade-btn'); // 級選択へ戻るボタン
const changePartBtn = document.getElementById('change-part-btn'); // カテゴリー選択へ戻るボタン
const prevBtn = document.getElementById('prev-btn'); // 「戻る」ボタン
const saveBtn = document.getElementById('save-btn'); // 進捗保存ボタン
const keepBtn = document.getElementById('keep-btn'); // 完了画面から戻るボタン
const resetBtn = document.getElementById('reset-btn'); // リセットボタン
const toast = document.getElementById('toast'); // 通知メッセージ用部品
const partListContainer = document.getElementById('part-list'); // カテゴリーボタンの配置場所
const speakerBtn = document.getElementById('speaker-btn'); // スピーカーボタン
const weakModeBtn = document.getElementById('weak-mode-btn'); // 苦手単語モードボタン
const clearRecordBtn = document.getElementById('clear-record-btn'); // 全記録消去ボタン
const jaToEnModeBtn = document.getElementById('ja-to-en-mode-btn'); // 和英モード切替ボタン

const weakListBtn = document.getElementById('weak-list-btn'); // 苦手リスト表示ボタン
const modalOverlay = document.getElementById('modal-overlay'); // 苦手リストの背景（モーダル）
const closeModalBtn = document.getElementById('close-modal-btn'); // 閉じるボタン
const weakTableBody = document.getElementById('weak-table-body'); // リストの中身を表示する場所
const modalTitle = document.getElementById('modal-title'); // モーダルのタイトル

// --- 各級ごとのカテゴリー定義 ---
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

// --- 音声再生処理 ---
function playAudio(word) {
  if (!word) return;

  // すでに再生中なら停止して最初からやり直す
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  // 単語名からファイル名を作成（スペースをアンダースコアに変換）
  const fileName = word.toLowerCase().replace(/\s+/g, '_');
  currentAudio = new Audio(`audio/${fileName}.mp3`);
  currentAudio.volume = 1.0;

  // 再生を試み、エラーが出たらブラウザ標準の音声合成で読み上げる
  const playPromise = currentAudio.play();
  if (playPromise !== undefined) {
    playPromise.catch(() => {
      speakWithTTS(word);
    });
  }
}

// --- ブラウザ音声合成機能 ---
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

// --- データの保存用キー作成 ---
function getStorageKey() { return `eiken${currentGrade}_mastered_ids`; }
function getWeakStorageKey() { return `eiken${currentGrade}_weak_ids`; }

// --- マスター・苦手データの読み込みと保存 ---
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

// --- 苦手リストへの追加 ---
function addWeakId(id) {
  const weakIds = getWeakIds();
  if (!weakIds.includes(id)) {
    weakIds.push(id);
    saveWeakIds(weakIds);
  }
}

// --- 一時的なメッセージ表示 ---
function showToast(message) {
  toast.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => { toast.classList.add('hidden'); }, 1500);
}

// --- 級選択処理 ---
function selectGrade(grade) {
  currentGrade = grade;
  selectTitle.textContent = `${gradeDisplayNames[currentGrade] || `英検${currentGrade}級`}単語帳`;
  
  gradeScreen.classList.add('hidden');
  selectScreen.classList.remove('hidden');
  
  renderPartButtons(); // ボタンを表示
}

// --- カテゴリー選択画面の描画 ---
function renderPartButtons() {
  partListContainer.innerHTML = '';
  const masteredIds = getMasteredIds();
  const weakIds = getWeakIds();
  const allGradeWords = (typeof wordsData !== 'undefined' && wordsData[currentGrade]) ? wordsData[currentGrade] : [];
  const categories = categoryNames[currentGrade] || [];

  // 苦手ボタンの更新
  const currentWeakWords = allGradeWords.filter(w => weakIds.includes(w.id));
  weakModeBtn.textContent = `🔥 苦手単語集中暗記 (${currentWeakWords.length}語)`;
  weakModeBtn.disabled = currentWeakWords.length === 0;
  weakListBtn.disabled = currentWeakWords.length === 0;

  // カテゴリーボタンの作成
  categories.forEach(cat => {
    const partWords = allGradeWords.filter(w => w.part === cat.key);
    const isCompleted = partWords.length > 0 && partWords.every(w => masteredIds.includes(w.id));

    const wrapper = document.createElement('div');
    wrapper.className = 'btn-part-wrapper';

    const btn = document.createElement('button');
    btn.className = 'btn btn-part';
    btn.textContent = `${cat.name} (${partWords.length}語)`;
    
    if (isCompleted) btn.classList.add('btn-completed');
    btn.onclick = () => selectRange(cat.key, false);
    wrapper.appendChild(btn);
    partListContainer.appendChild(wrapper);
  });

  // 全範囲ボタンの作成
  const allWrapper = document.createElement('div');
  allWrapper.className = 'btn-part-wrapper';
  const allBtn = document.createElement('button');
  allBtn.className = 'btn btn-part';
  allBtn.textContent = `全範囲 (${allGradeWords.length}語)`;
  const isAllCompleted = allGradeWords.length > 0 && allGradeWords.every(w => masteredIds.includes(w.id));
  if (isAllCompleted) allBtn.classList.add('btn-completed');
  allBtn.onclick = () => selectRange('all', false);
  allWrapper.appendChild(allBtn);
  partListContainer.appendChild(allWrapper);
}

// --- 範囲選択時の初期設定 ---
function selectRange(range, isJaToEn = false) {
  currentRange = range;
  isJapaneseToEnglish = isJaToEn;
  wordHistory = []; // 履歴をクリア
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

// --- 次の単語を選ぶ処理 ---
function pickNextWord() {
  const unmastered = wordList.filter(w => !w.isMastered);

  // 全てマスター済みの場合は完了画面へ
  if (unmastered.length === 0) {
    studyScreen.classList.add('hidden');
    completeScreen.classList.remove('hidden');
    return;
  }

  progressText.textContent = `残り: ${unmastered.length} / ${wordList.length}`;

  // 現在の単語を履歴に追加
  if (currentWord) wordHistory.push(currentWord);

  let available = unmastered;
  if (unmastered.length > 1 && currentWord) {
    available = unmastered.filter(w => w.id !== currentWord.id);
  }

  const randomIndex = Math.floor(Math.random() * available.length);
  currentWord = available[randomIndex];

  displayCurrentWord();
}

// --- 単語を表示する ---
function displayCurrentWord() {
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

// --- 「戻る」ボタンの機能 ---
if (prevBtn) {
  prevBtn.onclick = () => {
    if (wordHistory.length === 0) {
      showToast("これ以上前に戻れません");
      return;
    }
    if (currentWord && currentWord.isMastered) currentWord.isMastered = false;
    currentWord = wordHistory.pop();
    displayCurrentWord();
    const unmastered = wordList.filter(w => !w.isMastered);
    progressText.textContent = `残り: ${unmastered.length} / ${wordList.length}`;
  };
}

// --- 苦手リストモーダルの表示 ---
function openWeakListModal() {
  const weakIds = getWeakIds();
  const allGradeWords = (typeof wordsData !== 'undefined' && wordsData[currentGrade]) ? wordsData[currentGrade] : [];
  const currentWeakWords = allGradeWords.filter(w => weakIds.includes(w.id));

  modalTitle.textContent = `${gradeDisplayNames[currentGrade] || `英検${currentGrade}級`} 苦手単語 (${currentWeakWords.length}語)`;
  weakTableBody.innerHTML = '';

  currentWeakWords.forEach(item => {
    const tr = document.createElement('tr');
    tr.dataset.id = item.id;
    // ...各項目を表示するテーブルの構築（略）
    // (ここでは説明の都合上、DOM作成部分は省略しますが、実際はチェックボックス付きで生成されます)
  });
  modalOverlay.classList.remove('hidden');
}

// --- 苦手単語の保存と閉じる処理 ---
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

// --- イベント登録 ---
weakListBtn.addEventListener('click', () => { openWeakListModal(); });
closeModalBtn.addEventListener('click', () => { saveCheckedWeakWords(); modalOverlay.classList.add('hidden'); });
modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) { saveCheckedWeakWords(); modalOverlay.classList.add('hidden'); } });

if (speakerBtn) { speakerBtn.addEventListener('click', () => { if (currentWord) playAudio(currentWord.word); }); }
wordText.style.cursor = 'pointer';
wordText.addEventListener('click', () => { if (currentWord) playAudio(currentWord.word); });

flipBtn.addEventListener('click', () => {
  meaningText.classList.remove('invisible');
  flipBtn.classList.add('hidden');
  judgeBtnGroup.classList.remove('hidden');
  if (currentWord) playAudio(currentWord.word);
});

forgetBtn.addEventListener('click', () => {
  if (currentWord) addWeakId(currentWord.id);
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

// --- 各画面制御 ---
backToGradeBtn.addEventListener('click', () => { selectScreen.classList.add('hidden'); gradeScreen.classList.remove('hidden'); });
changePartBtn.addEventListener('click', () => { if (currentAudio) currentAudio.pause(); studyScreen.classList.add('hidden'); renderPartButtons(); selectScreen.classList.remove('hidden'); });
saveBtn.addEventListener('click', () => { 
    // 保存処理 ...
    showToast("進捗を保存しました！"); 
});
keepBtn.addEventListener('click', () => { completeScreen.classList.add('hidden'); renderPartButtons(); selectScreen.classList.remove('hidden'); });

// --- リセットと記録クリア ---
resetBtn.addEventListener('click', () => {
  if (confirm("現在の範囲の進捗をリセットして最初からやり直しますか？")) {
    // リセットロジック...
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
  jaToEnModeBtn.addEventListener('click', () => { selectRange('all', true); });
}
