const urlPatternInput = document.getElementById('urlPattern');
const minutesInput = document.getElementById('minutes');
const secondsInput = document.getElementById('seconds');
const greenMinutes = document.getElementById('greenMinutes');
const greenSeconds = document.getElementById('greenSeconds');
const redMinutes = document.getElementById('redMinutes');
const redSeconds = document.getElementById('redSeconds');
const showTimeCheckbox = document.getElementById('showTimeCheckbox');
const addRuleBtn = document.getElementById('addRuleBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const rulesList = document.getElementById('rulesList');

let editingIndex = -1; // 記錄正在編輯的規則索引

// 載入並顯示規則
function loadRules() {
  chrome.storage.local.get(['siteRules'], (result) => {
    const rules = result.siteRules || [];
    displayRules(rules);
  });
}

// 顯示規則列表
function displayRules(rules) {
  if (rules.length === 0) {
    rulesList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <p data-i18n="noRules">${I18N.getMessage('noRules')}</p>
        <p style="margin-top: 10px; font-size: 14px;" data-i18n="addFirstRule">${I18N.getMessage('addFirstRule')}</p>
      </div>
    `;
    return;
  }
  
  rulesList.innerHTML = rules.map((rule, index) => {
    const minutes = Math.floor(rule.seconds / 60);
    const seconds = rule.seconds % 60;
    const timeText = I18N.getTimeText(rule.seconds);
    
    const displayText = rule.showTime !== false ? I18N.getMessage('showTime') : I18N.getMessage('lightOnly');
    
    // 處理燈號顯示
    const greenThreshold = rule.greenThreshold !== undefined ? rule.greenThreshold : 180;
    const redThreshold = rule.redThreshold !== undefined ? rule.redThreshold : 10;
    const greenText = I18N.getTimeText(greenThreshold);
    const redText = I18N.getTimeText(redThreshold);
    
    return `
      <div class="rule-item">
        <div class="rule-info">
          <div class="rule-url">${escapeHtml(rule.urlPattern)}</div>
          <div class="rule-time">⏱️ ${timeText} | 📺 ${displayText}</div>
          <div class="rule-time" style="font-size: 12px; margin-top: 2px">🟢 ${greenText} | 🔴 ${redText}</div>
        </div>
        <div class="rule-actions">
          <button class="btn btn-edit" data-index="${index}" data-i18n="edit">${I18N.getMessage('edit')}</button>
          <button class="btn btn-delete" data-index="${index}" data-i18n="delete">${I18N.getMessage('delete')}</button>
        </div>
      </div>
    `;
  }).join('');
  
  // 綁定編輯按鈕事件
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      editRule(index, rules);
    });
  });
  
  // 綁定刪除按鈕事件
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      deleteRule(index);
    });
  });
}

// 新增或更新規則
addRuleBtn.addEventListener('click', () => {
  const urlPattern = urlPatternInput.value.trim();
  const minutes = parseInt(minutesInput.value) || 0;
  const seconds = parseInt(secondsInput.value) || 0;
  const totalSeconds = minutes * 60 + seconds;
  const showTime = showTimeCheckbox.checked;
  const greenThreshold = (parseInt(greenMinutes.value) || 0) * 60 + (parseInt(greenSeconds.value) || 0);
  const redThreshold = (parseInt(redMinutes.value) || 0) * 60 + (parseInt(redSeconds.value) || 0);
  
  if (!urlPattern) {
    alert(I18N.getMessage('enterUrl'));
    return;
  }
  
  if (totalSeconds <= 0) {
    alert(I18N.getMessage('enterValidTime'));
    return;
  }
  
  chrome.storage.local.get(['siteRules'], (result) => {
    const rules = result.siteRules || [];
    
    if (editingIndex >= 0) {
      // 編輯模式：更新現有規則
      rules[editingIndex] = {
        urlPattern: urlPattern,
        seconds: totalSeconds,
        showTime: showTime,
        greenThreshold: greenThreshold,
        redThreshold: redThreshold
      };
    } else {
      // 新增模式：檢查是否已存在相同的規則
      const exists = rules.some(rule => rule.urlPattern === urlPattern);
      if (exists) {
        if (!confirm(I18N.getMessage('ruleExists'))) {
          return;
        }
        // 移除舊規則
        const index = rules.findIndex(rule => rule.urlPattern === urlPattern);
        rules.splice(index, 1);
      }
      
      rules.push({
        urlPattern: urlPattern,
        seconds: totalSeconds,
        showTime: showTime,
        greenThreshold: greenThreshold,
        redThreshold: redThreshold
      });
    }
    
    chrome.storage.local.set({ siteRules: rules }, () => {
      loadRules();
      resetForm();
      
      // 視覺回饋
      const originalText = addRuleBtn.textContent;
      const successText = editingIndex >= 0 ? I18N.getMessage('updated') : I18N.getMessage('added');
      addRuleBtn.textContent = successText;
      addRuleBtn.style.background = '#22c55e';
      setTimeout(() => {
        addRuleBtn.textContent = originalText;
        addRuleBtn.style.background = '';
      }, 1500);
      
      editingIndex = -1;
    });
  });
});

// 取消編輯
cancelEditBtn.addEventListener('click', () => {
  resetForm();
  editingIndex = -1;
});

// 重置表單
function resetForm() {
  urlPatternInput.value = '';
  minutesInput.value = '10';
  secondsInput.value = '0';
  greenMinutes.value = '3';
  greenSeconds.value = '0';
  redMinutes.value = '0';
  redSeconds.value = '10';
  showTimeCheckbox.checked = true;
  addRuleBtn.textContent = I18N.getMessage('addRule');
  cancelEditBtn.style.display = 'none';
}

// 編輯規則
function editRule(index, rules) {
  const rule = rules[index];
  editingIndex = index;
  
  // 填入表單
  urlPatternInput.value = rule.urlPattern;
  const minutes = Math.floor(rule.seconds / 60);
  const seconds = rule.seconds % 60;
  minutesInput.value = minutes;
  secondsInput.value = seconds;
  
  const greenThreshold = rule.greenThreshold !== undefined ? rule.greenThreshold : 180;
  const redThreshold = rule.redThreshold !== undefined ? rule.redThreshold : 10;
  const gMinutes = Math.floor(greenThreshold / 60);
  const gSeconds = greenThreshold % 60;
  const rMinutes = Math.floor(redThreshold / 60);
  const rSeconds = redThreshold % 60;
  
  greenMinutes.value = gMinutes;
  greenSeconds.value = gSeconds;
  redMinutes.value = rMinutes;
  redSeconds.value = rSeconds;
  showTimeCheckbox.checked = rule.showTime !== false;
  
  // 更改按鈕文字
  addRuleBtn.textContent = I18N.getMessage('saveChanges');
  cancelEditBtn.style.display = 'block';
  
  // 捲動到表單頂部
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 刪除規則
function deleteRule(index) {
  if (!confirm(I18N.getMessage('confirmDelete'))) {
    return;
  }
  
  chrome.storage.local.get(['siteRules'], (result) => {
    const rules = result.siteRules || [];
    rules.splice(index, 1);
    
    chrome.storage.local.set({ siteRules: rules }, () => {
      loadRules();
    });
  });
}

// HTML 轉義
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 頁面載入時顯示規則
loadRules();

// 語言選擇器初始化
const languageSelect = document.getElementById('languageSelect');

// 載入當前語言設定
I18N.getEffectiveLocale().then((locale) => {
  languageSelect.value = locale;
});

// 語言切換事件
languageSelect.addEventListener('change', async (e) => {
  const newLocale = e.target.value;
  await I18N.setUserLocale(newLocale);
  await I18N.setLocale(newLocale);
  
  // 重新載入規則列表以應用新語言
  loadRules();
});

// 匯出設定
document.getElementById('exportBtn').addEventListener('click', () => {
  chrome.storage.local.get(null, (data) => {
    const settings = {
      lastSetTime: data.lastSetTime,
      showTime: data.showTime,
      showBadge: data.showBadge,
      greenThreshold: data.greenThreshold,
      redThreshold: data.redThreshold,
      siteRules: data.siteRules || [],
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `countdown-settings-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    // 視覺回饋
    const exportBtn = document.getElementById('exportBtn');
    const originalText = exportBtn.textContent;
    exportBtn.textContent = I18N.getMessage('exported');
    exportBtn.style.background = '#22c55e';
    setTimeout(() => {
      exportBtn.textContent = originalText;
      exportBtn.style.background = '';
    }, 2000);
  });
});

// 匯入設定
document.getElementById('importBtn').addEventListener('click', () => {
  document.getElementById('importFile').click();
});

document.getElementById('importFile').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const settings = JSON.parse(event.target.result);
      
      if (typeof settings !== 'object') {
        throw new Error('無效的設定檔格式');
      }
      
      const importData = {};
      if (settings.lastSetTime !== undefined) importData.lastSetTime = settings.lastSetTime;
      if (settings.showTime !== undefined) importData.showTime = settings.showTime;
      if (settings.showBadge !== undefined) importData.showBadge = settings.showBadge;
      if (settings.greenThreshold !== undefined) importData.greenThreshold = settings.greenThreshold;
      if (settings.redThreshold !== undefined) importData.redThreshold = settings.redThreshold;
      if (settings.siteRules !== undefined) importData.siteRules = settings.siteRules;
      
      chrome.storage.local.set(importData, () => {
        // 重新載入規則列表
        loadRules();
        
        // 視覺回饋
        const importBtn = document.getElementById('importBtn');
        const originalText = importBtn.textContent;
        importBtn.textContent = I18N.getMessage('imported');
        importBtn.style.background = '#22c55e';
        setTimeout(() => {
          importBtn.textContent = originalText;
          importBtn.style.background = '';
        }, 2000);
      });
    } catch (error) {
      alert(I18N.getMessage('importFailed') + error.message);
    }
  };
  
  reader.readAsText(file);
  e.target.value = '';
});
