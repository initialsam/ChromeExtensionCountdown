let badgeTimerInterval = null;
let badgeRemainingSeconds = 0;
let showBadge = true;
let greenThreshold = 180; // 綠燈門檻（預設3分鐘）
let redThreshold = 10; // 紅燈門檻（預設10秒）

// 初始化時載入設定
chrome.storage.local.get(['greenThreshold', 'redThreshold'], (result) => {
  if (result.greenThreshold !== undefined) {
    greenThreshold = result.greenThreshold;
  }
  if (result.redThreshold !== undefined) {
    redThreshold = result.redThreshold;
  }
});

// 監聽來自 popup 的訊息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startBadgeTimer') {
    showBadge = request.showBadge !== undefined ? request.showBadge : true;
    greenThreshold = request.greenThreshold !== undefined ? request.greenThreshold : 180;
    redThreshold = request.redThreshold !== undefined ? request.redThreshold : 10;
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
  
  // 先從 storage 載入最新的設定，確保使用正確的門檻值
  chrome.storage.local.get(['greenThreshold', 'redThreshold'], (result) => {
    if (result.greenThreshold !== undefined) {
      greenThreshold = result.greenThreshold;
    }
    if (result.redThreshold !== undefined) {
      redThreshold = result.redThreshold;
    }
    
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
  });
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
    if (badgeRemainingSeconds > greenThreshold) {
      // 大於綠燈門檻：綠色
      chrome.action.setBadgeBackgroundColor({ color: '#22C55E' });
    } else if (badgeRemainingSeconds > redThreshold) {
      // 介於紅燈與綠燈之間：黃色
      chrome.action.setBadgeBackgroundColor({ color: '#EAB308' });
    } else {
      // 小於等於紅燈門檻：紅色
      chrome.action.setBadgeBackgroundColor({ color: '#EF4444' });
    }
    
    chrome.action.setBadgeText({ text: minutes.toString() });
  }
}

// 監聽擴展安裝或更新
chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({ text: '' });
  
  // 建立右鍵選單
  chrome.contextMenus.create({
    id: 'addSiteRule',
    title: '新增此網站到倒數計時規則',
    contexts: ['page', 'frame']
  });
});

// 監聽右鍵選單點擊
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'addSiteRule') {
    // 取得當前網址
    const url = new URL(tab.url);
    const urlPattern = `*${url.hostname}*`;
    
    // 取得預設設定
    chrome.storage.local.get(['lastSetTime', 'greenThreshold', 'redThreshold', 'siteRules'], (result) => {
      const defaultTime = result.lastSetTime || 600; // 預設10分鐘
      const greenThreshold = result.greenThreshold !== undefined ? result.greenThreshold : 180;
      const redThreshold = result.redThreshold !== undefined ? result.redThreshold : 10;
      const rules = result.siteRules || [];
      
      // 檢查是否已存在
      const existingIndex = rules.findIndex(rule => rule.urlPattern === urlPattern);
      
      if (existingIndex >= 0) {
        // 已存在，更新規則
        rules[existingIndex] = {
          urlPattern: urlPattern,
          seconds: defaultTime,
          showTime: true,
          greenThreshold: greenThreshold,
          redThreshold: redThreshold
        };
      } else {
        // 新增規則
        rules.push({
          urlPattern: urlPattern,
          seconds: defaultTime,
          showTime: true,
          greenThreshold: greenThreshold,
          redThreshold: redThreshold
        });
      }
      
      // 儲存規則
      chrome.storage.local.set({ siteRules: rules }, () => {
        // 顯示通知
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: '倒數計時規則',
          message: `已新增規則：${urlPattern}\n倒數時間：${Math.floor(defaultTime / 60)}分${defaultTime % 60}秒`
        });
      });
    });
  }
});
