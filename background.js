let badgeTimerInterval = null;
let badgeRemainingSeconds = 0;
let showBadge = true;

// 監聽來自 popup 的訊息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startBadgeTimer') {
    showBadge = request.showBadge !== undefined ? request.showBadge : true;
    startBadgeTimer(request.seconds);
    sendResponse({ success: true });
  } else if (request.action === 'stopBadgeTimer') {
    stopBadgeTimer();
    sendResponse({ success: true });
  } else if (request.action === 'timerFinished') {
    stopBadgeTimer();
    sendResponse({ success: true });
  }
  return true; // 保持訊息通道開啟
});

// 開始 Badge 倒數計時
function startBadgeTimer(seconds) {
  stopBadgeTimer();
  
  badgeRemainingSeconds = seconds;
  updateBadge();
  
  badgeTimerInterval = setInterval(() => {
    badgeRemainingSeconds--;
    updateBadge();
    
    if (badgeRemainingSeconds <= 0) {
      clearInterval(badgeTimerInterval);
      badgeTimerInterval = null;
      
      // 時間到，顯示紅色背景
      chrome.action.setBadgeBackgroundColor({ color: '#EF4444' });
      chrome.action.setBadgeText({ text: '0' });
    }
  }, 1000);
}

// 停止 Badge 倒數計時
function stopBadgeTimer() {
  if (badgeTimerInterval) {
    clearInterval(badgeTimerInterval);
    badgeTimerInterval = null;
  }
  
  chrome.action.setBadgeText({ text: '' });
}

// 更新 Badge 顯示
function updateBadge() {
  if (!showBadge) {
    chrome.action.setBadgeText({ text: '' });
    return;
  }
  
  const minutes = Math.ceil(badgeRemainingSeconds / 60);
  
  if (badgeRemainingSeconds > 0) {
    // 根據剩餘時間設定顏色
    if (badgeRemainingSeconds > 180) {
      // 3分鐘以上：綠色
      chrome.action.setBadgeBackgroundColor({ color: '#22C55E' });
    } else if (badgeRemainingSeconds > 10) {
      // 3分鐘以內但大於10秒：黃色
      chrome.action.setBadgeBackgroundColor({ color: '#EAB308' });
    } else {
      // 10秒以內：紅色
      chrome.action.setBadgeBackgroundColor({ color: '#EF4444' });
    }
    
    chrome.action.setBadgeText({ text: minutes.toString() });
  }
}

// 監聽擴展安裝或更新
chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({ text: '' });
});
