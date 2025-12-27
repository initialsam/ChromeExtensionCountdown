let totalSeconds = 0;

const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const status = document.getElementById('status');
const showTimeCheckbox = document.getElementById('showTimeCheckbox');
const showBadgeCheckbox = document.getElementById('showBadgeCheckbox');
const siteRulesBtn = document.getElementById('siteRulesBtn');
const greenMinutes = document.getElementById('greenMinutes');
const greenSeconds = document.getElementById('greenSeconds');
const redMinutes = document.getElementById('redMinutes');
const redSeconds = document.getElementById('redSeconds');
const minutesInput = document.getElementById('minutesInput');
const secondsInput = document.getElementById('secondsInput');

// 載入上次設定的時間和顯示設定
chrome.storage.local.get(['lastSetTime', 'showTime', 'showBadge', 'greenThreshold', 'redThreshold'], (result) => {
  if (result.lastSetTime) {
    totalSeconds = result.lastSetTime;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    minutesInput.value = minutes;
    secondsInput.value = seconds;
  }
  if (result.showTime !== undefined) {
    showTimeCheckbox.checked = result.showTime;
  }
  if (result.showBadge !== undefined) {
    showBadgeCheckbox.checked = result.showBadge;
  }
  if (result.greenThreshold !== undefined) {
    const gMinutes = Math.floor(result.greenThreshold / 60);
    const gSeconds = result.greenThreshold % 60;
    greenMinutes.value = gMinutes;
    greenSeconds.value = gSeconds;
  }
  if (result.redThreshold !== undefined) {
    const rMinutes = Math.floor(result.redThreshold / 60);
    const rSeconds = result.redThreshold % 60;
    redMinutes.value = rMinutes;
    redSeconds.value = rSeconds;
  }
});

// 開始按鈕
startBtn.addEventListener('click', () => {
  const minutes = parseInt(minutesInput.value) || 0;
  const seconds = parseInt(secondsInput.value) || 0;
  totalSeconds = minutes * 60 + seconds;
  
  if (totalSeconds <= 0) {
    status.textContent = I18N.getMessage('pleaseSetTime');
    status.style.color = '#fca5a5';
    setTimeout(() => {
      status.textContent = '';
    }, 2000);
    return;
  }
  
  // 儲存設定時間和顯示設定
  const showTime = showTimeCheckbox.checked;
  const showBadge = showBadgeCheckbox.checked;
  const greenThreshold = (parseInt(greenMinutes.value) || 0) * 60 + (parseInt(greenSeconds.value) || 0);
  const redThreshold = (parseInt(redMinutes.value) || 0) * 60 + (parseInt(redSeconds.value) || 0);
  chrome.storage.local.set({ 
    lastSetTime: totalSeconds, 
    showTime: showTime, 
    showBadge: showBadge,
    greenThreshold: greenThreshold,
    redThreshold: redThreshold
  });
  
  // 發送訊息給 background 開始倒數
  chrome.runtime.sendMessage({
    action: 'startBadgeTimer',
    seconds: totalSeconds,
    showBadge: showBadge,
    greenThreshold: greenThreshold,
    redThreshold: redThreshold
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.log('Background script error:', chrome.runtime.lastError.message);
    }
  });
  
  // 發送訊息給 content script 開始計時
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'startTimer',
        seconds: totalSeconds,
        showTime: showTime,
        greenThreshold: greenThreshold,
        redThreshold: redThreshold
      }, (response) => {
        // 忽略錯誤（例如在不支援 content script 的頁面）
        if (chrome.runtime.lastError) {
          console.log('Content script not available:', chrome.runtime.lastError.message);
        }
      });
      
      status.textContent = I18N.getMessage('timerStarted');
      status.style.color = '#86efac';
      
      setTimeout(() => {
        window.close();
      }, 1000);
    }
  });
});

// 清除按鈕
resetBtn.addEventListener('click', () => {
  minutesInput.value = '0';
  secondsInput.value = '0';
  totalSeconds = 0;
  status.textContent = I18N.getMessage('timeCleared');
  status.style.color = '#fca5a5';
  setTimeout(() => {
    status.textContent = '';
  }, 1500);
});

// 網站規則按鈕
siteRulesBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: 'site-rules.html' });
});
