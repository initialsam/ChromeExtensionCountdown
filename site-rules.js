const urlPatternInput = document.getElementById('urlPattern');
const minutesInput = document.getElementById('minutes');
const secondsInput = document.getElementById('seconds');
const greenMinutes = document.getElementById('greenMinutes');
const greenSeconds = document.getElementById('greenSeconds');
const redMinutes = document.getElementById('redMinutes');
const redSeconds = document.getElementById('redSeconds');
const showTimeCheckbox = document.getElementById('showTimeCheckbox');
const addRuleBtn = document.getElementById('addRuleBtn');
const rulesList = document.getElementById('rulesList');

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
        <button class="btn btn-delete" data-index="${index}">刪除</button>
      </div>
    `;
  }).join('');
  
  // 綁定刪除按鈕事件
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      deleteRule(index);
    });
  });
}

// 新增規則
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
    
    // 檢查是否已存在相同的規則
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
    
    chrome.storage.local.set({ siteRules: rules }, () => {
      loadRules();
      urlPatternInput.value = '';
      minutesInput.value = '10';
      secondsInput.value = '0';
      greenMinutes.value = '3';
      greenSeconds.value = '0';
      redMinutes.value = '0';
      redSeconds.value = '10';
      showTimeCheckbox.checked = true;
      
      // 視覺回饋
      const originalText = addRuleBtn.textContent;
      addRuleBtn.textContent = '✓ 已新增！';
      addRuleBtn.style.background = '#22c55e';
      setTimeout(() => {
        addRuleBtn.textContent = originalText;
        addRuleBtn.style.background = '';
      }, 1500);
    });
  });
});

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
