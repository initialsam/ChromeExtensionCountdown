let totalSeconds = 0;

const display = document.getElementById('display');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const status = document.getElementById('status');
const showTimeCheckbox = document.getElementById('showTimeCheckbox');
const showBadgeCheckbox = document.getElementById('showBadgeCheckbox');
const siteRulesBtn = document.getElementById('siteRulesBtn');

// 載入上次設定的時間和顯示設定
chrome.storage.local.get(['lastSetTime', 'showTime', 'showBadge'], (result) => {
  if (result.lastSetTime) {
    totalSeconds = result.lastSetTime;
    updateDisplay();
  }
  if (result.showTime !== undefined) {
    showTimeCheckbox.checked = result.showTime;
  }
  if (result.showBadge !== undefined) {
    showBadgeCheckbox.checked = result.showBadge;
  }
});

// 更新顯示
function updateDisplay() {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  display.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// 時間按鈕事件
document.querySelectorAll('.time-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.type;
    const value = parseInt(btn.dataset.value);
    
    if (type === 'minutes') {
      totalSeconds += value * 60;
    } else {
      totalSeconds += value;
    }
    
    updateDisplay();
    
    // 視覺回饋
    btn.style.transform = 'scale(0.95)';
    setTimeout(() => {
      btn.style.transform = '';
    }, 100);
  });
});

// 開始按鈕
startBtn.addEventListener('click', () => {
  if (totalSeconds <= 0) {
    status.textContent = '請先設定時間！';
    status.style.color = '#fca5a5';
    setTimeout(() => {
      status.textContent = '';
    }, 2000);
    return;
  }
  
  // 儲存設定時間和顯示設定
  const showTime = showTimeCheckbox.checked;
  const showBadge = showBadgeCheckbox.checked;
  chrome.storage.local.set({ lastSetTime: totalSeconds, showTime: showTime, showBadge: showBadge });
  
  // 發送訊息給 background 開始倒數
  chrome.runtime.sendMessage({
    action: 'startBadgeTimer',
    seconds: totalSeconds,
    showBadge: showBadge
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
        showTime: showTime
      }, (response) => {
        // 忽略錯誤（例如在不支援 content script 的頁面）
        if (chrome.runtime.lastError) {
          console.log('Content script not available:', chrome.runtime.lastError.message);
        }
      });
      
      status.textContent = '計時已開始！';
      status.style.color = '#86efac';
      
      setTimeout(() => {
        window.close();
      }, 1000);
    }
  });
});

// 清除按鈕
resetBtn.addEventListener('click', () => {
  totalSeconds = 0;
  updateDisplay();
  status.textContent = '已清除時間';
  status.style.color = '#fca5a5';
  setTimeout(() => {
    status.textContent = '';
  }, 1500);
});

// 網站規則按鈕
siteRulesBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: 'site-rules.html' });
});
