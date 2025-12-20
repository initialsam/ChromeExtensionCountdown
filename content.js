let timerInterval = null;
let remainingSeconds = 0;
let timerIndicator = null;
let fullscreenAlert = null;
let showTime = true;
let autoStarted = false; // 防止重複自動啟動

// 接收來自 popup 的訊息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startTimer') {
    showTime = request.showTime !== undefined ? request.showTime : true;
    startCountdown(request.seconds);
    sendResponse({ success: true });
  } else if (request.action === 'stopTimer') {
    stopCountdown();
    sendResponse({ success: true });
  }
  return true; // 保持訊息通道開啟
});

// 檢查當前網址是否匹配規則並自動啟動
function checkAutoStart() {
  if (autoStarted || timerInterval) return; // 已經啟動或正在計時中
  
  chrome.storage.local.get(['siteRules'], (result) => {
    const rules = result.siteRules || [];
    const currentUrl = window.location.href;
    
    for (const rule of rules) {
      if (matchPattern(currentUrl, rule.urlPattern)) {
        autoStarted = true;
        // 使用規則中的 showTime 設定，預設為 true
        showTime = rule.showTime !== undefined ? rule.showTime : true;
        
        // 啟動計時器（網頁右下角指示器）
        startCountdown(rule.seconds);
        
        // 自動計時規則不啟動 badge 計時器
        // badge 計時器只在手動啟動時使用
        
        break; // 只匹配第一條規則
      }
    }
  });
}

// 萬用字元匹配函數
function matchPattern(str, pattern) {
  // 將萬用字元轉換為正則表達式
  const regexPattern = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // 轉義特殊字元
    .replace(/\*/g, '.*'); // * 轉換為 .*
  
  const regex = new RegExp('^' + regexPattern + '$', 'i');
  return regex.test(str);
}

// 頁面載入時檢查是否需要自動啟動
function initAutoStart() {
  // 確保 DOM 已經載入並延遲一點時間確保頁面穩定
  setTimeout(() => {
    checkAutoStart();
  }, 500);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAutoStart);
} else {
  initAutoStart();
}

// 創建計時器指示器
function createTimerIndicator() {
  if (timerIndicator) {
    timerIndicator.remove();
  }
  
  timerIndicator = document.createElement('div');
  timerIndicator.id = 'countdown-timer-indicator';
  
  if (showTime) {
    timerIndicator.innerHTML = `
      <div class="timer-light"></div>
      <div class="timer-text">00:00</div>
    `;
  } else {
    timerIndicator.innerHTML = `
      <div class="timer-light"></div>
    `;
    timerIndicator.classList.add('light-only');
  }
  
  document.body.appendChild(timerIndicator);
  
  // 點擊訊號燈切換顯示時間（使用事件委派）
  timerIndicator.addEventListener('click', handleIndicatorClick);
}

// 處理指示器點擊
function handleIndicatorClick(e) {
  e.stopPropagation();
  toggleTimeDisplay();
}

// 切換時間顯示
function toggleTimeDisplay() {
  if (!timerIndicator) return;
  
  showTime = !showTime;
  
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeText = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  
  // 移除舊的點擊事件監聽器
  timerIndicator.removeEventListener('click', handleIndicatorClick);
  
  if (showTime) {
    // 顯示時間
    timerIndicator.innerHTML = `
      <div class="timer-light"></div>
      <div class="timer-text">${timeText}</div>
    `;
    timerIndicator.classList.remove('light-only');
  } else {
    // 只顯示訊號燈
    timerIndicator.innerHTML = `
      <div class="timer-light"></div>
    `;
    timerIndicator.classList.add('light-only');
  }
  
  // 重新綁定點擊事件
  timerIndicator.addEventListener('click', handleIndicatorClick);
  
  // 更新燈光顏色
  updateTimerDisplay();
}

// 更新計時器顯示
function updateTimerDisplay() {
  if (!timerIndicator) return;
  
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeText = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  
  const textElement = timerIndicator.querySelector('.timer-text');
  const lightElement = timerIndicator.querySelector('.timer-light');
  
  if (textElement) {
    textElement.textContent = timeText;
  }
  
  if (lightElement) {
    // 3分鐘以上：綠燈
    if (remainingSeconds > 180) {
      lightElement.className = 'timer-light green';
    }
    // 10秒以內：紅燈
    else if (remainingSeconds <= 10 && remainingSeconds > 0) {
      lightElement.className = 'timer-light red';
    }
    // 3分鐘以內（但大於10秒）：黃燈
    else if (remainingSeconds > 0) {
      lightElement.className = 'timer-light yellow';
    }
    // 時間到：紅燈（但會立即顯示全螢幕）
    else {
      lightElement.className = 'timer-light red';
    }
  }
}

// 開始倒數計時
function startCountdown(seconds) {
  stopCountdown();
  
  remainingSeconds = seconds;
  createTimerIndicator();
  updateTimerDisplay();
  
  timerInterval = setInterval(() => {
    remainingSeconds--;
    updateTimerDisplay();
    
    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      
      // 時間到立即顯示全螢幕提醒
      showFullscreenAlert();
    }
  }, 1000);
}

// 停止倒數計時
function stopCountdown() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  if (timerIndicator) {
    timerIndicator.remove();
    timerIndicator = null;
  }
  
  if (fullscreenAlert) {
    fullscreenAlert.remove();
    fullscreenAlert = null;
  }
}

// 顯示全螢幕提醒
function showFullscreenAlert() {
  // 通知 background 計時器結束
  chrome.runtime.sendMessage({ action: 'timerFinished' }, (response) => {
    if (chrome.runtime.lastError) {
      console.log('Background message error:', chrome.runtime.lastError.message);
    }
  });
  
  fullscreenAlert = document.createElement('div');
  fullscreenAlert.id = 'countdown-fullscreen-alert';
  fullscreenAlert.innerHTML = `
    <div class="alert-content">
      <div class="alert-icon">⏰</div>
      <h1>時間到！</h1>
      <div class="alert-buttons">
        <button class="alert-btn restart-btn">重新計時</button>
        <button class="alert-btn close-btn">關閉倒數計時</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(fullscreenAlert);
  
  // 重新計時按鈕
  fullscreenAlert.querySelector('.restart-btn').addEventListener('click', () => {
    chrome.storage.local.get(['lastSetTime', 'showTime', 'showBadge'], (result) => {
      if (result.lastSetTime) {
        showTime = result.showTime !== undefined ? result.showTime : true;
        fullscreenAlert.remove();
        fullscreenAlert = null;
        startCountdown(result.lastSetTime);
        
        // 重新啟動 badge 計時器
        chrome.runtime.sendMessage({
          action: 'startBadgeTimer',
          seconds: result.lastSetTime,
          showBadge: result.showBadge !== undefined ? result.showBadge : true
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.log('Background message error:', chrome.runtime.lastError.message);
          }
        });
      }
    });
  });
  
  // 關閉按鈕
  fullscreenAlert.querySelector('.close-btn').addEventListener('click', () => {
    stopCountdown();
    chrome.runtime.sendMessage({ action: 'stopBadgeTimer' }, (response) => {
      if (chrome.runtime.lastError) {
        console.log('Background message error:', chrome.runtime.lastError.message);
      }
    });
  });
}

// 只在頁面初始化時清除殘留的全螢幕提醒（不清除計時器指示器）
(function cleanupOnInit() {
  const existingAlert = document.getElementById('countdown-fullscreen-alert');
  if (existingAlert && !timerInterval) {
    existingAlert.remove();
  }
})();
