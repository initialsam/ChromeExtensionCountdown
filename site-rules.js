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
        <p>尚未設定任何規則</p>
        <p style="margin-top: 10px; font-size: 14px;">在上方新增您的第一條規則</p>
      </div>
    `;
    return;
  }
  
  rulesList.innerHTML = rules.map((rule, index) => {
    const minutes = Math.floor(rule.seconds / 60);
    const seconds = rule.seconds % 60;
    const timeText = minutes > 0 
      ? `${minutes} 分鐘 ${seconds} 秒` 
      : `${seconds} 秒`;
    
    const displayText = rule.showTime !== false ? '顯示時間' : '僅訊號燈';
    
    // 處理燈號顯示
    const greenThreshold = rule.greenThreshold !== undefined ? rule.greenThreshold : 180;
    const redThreshold = rule.redThreshold !== undefined ? rule.redThreshold : 10;
    const greenMin = Math.floor(greenThreshold / 60);
    const greenSec = greenThreshold % 60;
    const redMin = Math.floor(redThreshold / 60);
    const redSec = redThreshold % 60;
    
    const greenText = greenMin > 0 ? `${greenMin}分${greenSec}秒` : `${greenSec}秒`;
    const redText = redMin > 0 ? `${redMin}分${redSec}秒` : `${redSec}秒`;
    
    return `
      <div class="rule-item">
        <div class="rule-info">
          <div class="rule-url">${escapeHtml(rule.urlPattern)}</div>
          <div class="rule-time">⏱️ ${timeText} | 📺 ${displayText}</div>
          <div class="rule-time" style="font-size: 12px; margin-top: 2px">🟢 ${greenText} | 🔴 ${redText}</div>
        </div>
        <div class="rule-actions">
          <button class="btn btn-edit" data-index="${index}">編輯</button>
          <button class="btn btn-delete" data-index="${index}">刪除</button>
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
    alert('請輸入網站網址！');
    return;
  }
  
  if (totalSeconds <= 0) {
    alert('請設定大於 0 的時間！');
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
        if (!confirm('此網址已存在規則，是否要更新？')) {
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
      const successText = editingIndex >= 0 ? '✓ 已更新！' : '✓ 已新增！';
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
  addRuleBtn.textContent = '➕ 新增規則';
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
  addRuleBtn.textContent = '💾 儲存修改';
  cancelEditBtn.style.display = 'block';
  
  // 捲動到表單頂部
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 刪除規則
function deleteRule(index) {
  if (!confirm('確定要刪除此規則嗎？')) {
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
    exportBtn.textContent = '✓ 已匯出！';
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
        importBtn.textContent = '✓ 已匯入！';
        importBtn.style.background = '#22c55e';
        setTimeout(() => {
          importBtn.textContent = originalText;
          importBtn.style.background = '';
        }, 2000);
      });
    } catch (error) {
      alert('匯入失敗：' + error.message);
    }
  };
  
  reader.readAsText(file);
  e.target.value = '';
});
