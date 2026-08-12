function pickNextWord() {
  const unmastered = wordList.filter(w => !w.isMastered);

  if (unmastered.length === 0) {
    studyScreen.classList.add('hidden');
    completeScreen.classList.remove('hidden');
    return;
  }

  progressText.textContent = `残り: ${unmastered.length} / ${wordList.length}`;

  // 現在の単語が存在し、かつ履歴の最後尾と違う場合のみ履歴に追加する
  if (currentWord) {
    if (wordHistory.length === 0 || wordHistory[wordHistory.length - 1].id !== currentWord.id) {
      wordHistory.push(currentWord);
    }
  }

  let available = unmastered;
  if (unmastered.length > 1 && currentWord) {
    available = unmastered.filter(w => w.id !== currentWord.id);
  }

  const randomIndex = Math.floor(Math.random() * available.length);
  currentWord = available[randomIndex];

  updateCardDisplay();
}

// 前に戻るボタンの処理
if (prevBtn) {
  prevBtn.onclick = () => {
    if (wordHistory.length === 0) {
      showToast("これ以上前に戻れません");
      return;
    }

    // 現在の単語を一時的に保持、または必要なら履歴に戻す
    const previousWord = wordHistory.pop();
    
    // もし現在の単語がマスター済みになってしまっていたら未マスターに戻す処理など
    if (currentWord && currentWord.isMastered) {
      currentWord.isMastered = false;
    }

    currentWord = previousWord;
    updateCardDisplay();

    const unmastered = wordList.filter(w => !w.isMastered);
    progressText.textContent = `残り: ${unmastered.length} / ${wordList.length}`;
  };
}
