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

// 更新右鍵選單文字
async function updateContextMenu() {
  // 取得使用者設定的語言
  const result = await chrome.storage.local.get(['userLocale']);
  const userLocale = result.userLocale;
  
  // 根據語言設定載入對應的翻譯
  let menuTitle = 'Add this site to countdown rules'; // 預設英文
  
  if (userLocale) {
    try {
      const response = await fetch(chrome.runtime.getURL(`_locales/${userLocale}/messages.json`));
      const messages = await response.json();
      if (messages.contextMenuAddSite && messages.contextMenuAddSite.message) {
        menuTitle = messages.contextMenuAddSite.message;
      }
    } catch (error) {
      console.log('Failed to load locale, using browser default');
    }
  }
  
  // 如果沒有使用者設定，使用瀏覽器預設
  if (!userLocale) {
    menuTitle = chrome.i18n.getMessage('contextMenuAddSite');
  }
  
  // 更新右鍵選單
  chrome.contextMenus.update('addSiteRule', {
    title: menuTitle
  }, () => {
    if (chrome.runtime.lastError) {
      console.log('Context menu update error:', chrome.runtime.lastError);
    }
  });
}

// 監聽擴展安裝或更新
chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({ text: '' });
  
  // 建立右鍵選單（使用 i18n）
  chrome.contextMenus.create({
    id: 'addSiteRule',
    title: chrome.i18n.getMessage('contextMenuAddSite'),
    contexts: ['page', 'frame']
  }, () => {
    // 創建後立即檢查是否需要更新語言
    updateContextMenu();
  });
});

// 監聽 storage 變更，當使用者切換語言時更新右鍵選單
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.userLocale) {
    updateContextMenu();
  }
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
        // 已存在，顯示提示而不覆蓋
        chrome.storage.local.get(['userLocale'], async (localeResult) => {
          const userLocale = localeResult.userLocale;
          let notifTitle = 'Rule Already Exists';
          let notifMessage = `Rule for ${urlPattern} already exists.\nPlease manage rules in the settings page.`;
          
          // 根據語言載入對應翻譯
          if (userLocale) {
            try {
              const response = await fetch(chrome.runtime.getURL(`_locales/${userLocale}/messages.json`));
              const messages = await response.json();
              if (messages.ruleAlreadyExists && messages.ruleAlreadyExistsMessage) {
                notifTitle = messages.ruleAlreadyExists.message;
                notifMessage = messages.ruleAlreadyExistsMessage.message.replace('$1', urlPattern);
              }
            } catch (error) {
              // 使用瀏覽器預設語言
              notifTitle = chrome.i18n.getMessage('ruleAlreadyExists') || notifTitle;
              notifMessage = chrome.i18n.getMessage('ruleAlreadyExistsMessage', [urlPattern]) || notifMessage;
            }
          } else {
            // 使用瀏覽器預設語言
            notifTitle = chrome.i18n.getMessage('ruleAlreadyExists') || notifTitle;
            notifMessage = chrome.i18n.getMessage('ruleAlreadyExistsMessage', [urlPattern]) || notifMessage;
          }
          
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: notifTitle,
            message: notifMessage
          });
        });
        return; // 不繼續執行
      }
      
      // 新增規則
      rules.push({
        urlPattern: urlPattern,
        seconds: defaultTime,
        showTime: true,
        greenThreshold: greenThreshold,
        redThreshold: redThreshold
      });
      
      // 儲存規則
      chrome.storage.local.set({ siteRules: rules }, () => {
        // 格式化時間文字（根據語言）
        const minutes = Math.floor(defaultTime / 60);
        const seconds = defaultTime % 60;
        const locale = chrome.i18n.getUILanguage();
        let timeText = '';
        
        // 根據不同語言格式化時間
        if (locale.startsWith('zh')) {
          timeText = minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;
        } else if (locale.startsWith('ja')) {
          timeText = minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;
        } else if (locale.startsWith('fr')) {
          timeText = minutes > 0 ? `${minutes} min ${seconds} sec` : `${seconds} sec`;
        } else if (locale.startsWith('es')) {
          timeText = minutes > 0 ? `${minutes} min ${seconds} seg` : `${seconds} seg`;
        } else {
          // English
          const minText = minutes === 1 ? 'minute' : 'minutes';
          timeText = minutes > 0 ? `${minutes} ${minText} ${seconds} sec` : `${seconds} sec`;
        }
        
        // 顯示通知（使用 i18n）
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: chrome.i18n.getMessage('notificationTitle'),
          message: chrome.i18n.getMessage('notificationAdded', [urlPattern, timeText])
        });
      });
    });
  }
});
