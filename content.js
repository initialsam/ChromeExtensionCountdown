let timerInterval = null;
let remainingSeconds = 0;
let timerIndicator = null;
let fullscreenAlert = null;
let showTime = true;

// 接收來自 popup 的訊息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startTimer') {
    showTime = request.showTime !== undefined ? request.showTime : true;
    startCountdown(request.seconds);
  } else if (request.action === 'stopTimer') {
    stopCountdown();
  }
});

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
    chrome.storage.local.get(['lastSetTime', 'showTime'], (result) => {
      if (result.lastSetTime) {
        showTime = result.showTime !== undefined ? result.showTime : true;
        fullscreenAlert.remove();
        fullscreenAlert = null;
        startCountdown(result.lastSetTime);
      }
    });
  });
  
  // 關閉按鈕
  fullscreenAlert.querySelector('.close-btn').addEventListener('click', () => {
    stopCountdown();
  });
}

// 頁面載入時清除任何殘留的計時器
window.addEventListener('load', () => {
  const existingIndicator = document.getElementById('countdown-timer-indicator');
  if (existingIndicator) {
    existingIndicator.remove();
  }
  
  const existingAlert = document.getElementById('countdown-fullscreen-alert');
  if (existingAlert) {
    existingAlert.remove();
  }
});
