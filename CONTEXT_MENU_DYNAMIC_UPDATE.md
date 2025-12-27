# 右鍵選單動態語言更新

## 🎯 功能說明

現在右鍵選單會自動跟隨使用者切換的語言即時更新，不需要重新開啟瀏覽器或手動重新載入。

## ✅ 已實作功能

### 1. 動態更新函式
```javascript
async function updateContextMenu() {
  // 1. 讀取使用者設定的語言
  const userLocale = await getUserLocale();
  
  // 2. 載入對應語言的翻譯
  const messages = await loadMessages(userLocale);
  
  // 3. 更新右鍵選單文字
  chrome.contextMenus.update('addSiteRule', {
    title: messages.contextMenuAddSite
  });
}
```

### 2. 自動監聽語言變更
```javascript
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.userLocale) {
    updateContextMenu(); // 自動更新
  }
});
```

### 3. 語言優先順序
1. 使用者手動設定的語言（最高優先）
2. 瀏覽器預設語言
3. 英文（預設）

## 🚀 測試步驟

### 準備工作
```
⚠️ 重要：必須先重新載入擴充功能！

1. 開啟 chrome://extensions/
2. 找到「倒數計時」或「Countdown Timer」
3. 點擊 🔄 重新載入按鈕
```

### 測試流程

#### 步驟 1：切換到日文
```
1. 點擊擴充功能圖示
2. 點擊「管理網站規則」
3. 捲動到底部「🌐 語言設定」
4. 選擇「日本語」
5. 觀察頁面立即更新為日文
```

#### 步驟 2：驗證右鍵選單
```
1. 在任何網頁上點擊右鍵
2. 查看選單中的文字
3. 應該顯示：「このサイトをカウントダウンルールに追加」✅
```

#### 步驟 3：切換到英文
```
1. 回到規則管理頁面
2. 在語言選擇器選擇「English」
3. 觀察頁面立即更新為英文
```

#### 步驟 4：再次驗證右鍵選單
```
1. 在任何網頁上點擊右鍵
2. 查看選單中的文字
3. 應該顯示：「Add this site to countdown rules」✅
```

#### 步驟 5：測試其他語言
```
繁體中文：新增此網站到倒數計時規則
法文：Ajouter ce site aux règles de compte à rebours
西班牙文：Agregar este sitio a las reglas de cuenta regresiva
```

## 📊 運作原理

### 事件流程圖
```
使用者在規則管理頁面選擇語言
         ↓
I18N.setUserLocale(locale)
         ↓
chrome.storage.local.set({ userLocale: locale })
         ↓
觸發 storage.onChanged 事件
         ↓
background.js 監聽到變更
         ↓
執行 updateContextMenu()
         ↓
fetch _locales/{locale}/messages.json
         ↓
讀取 contextMenuAddSite 翻譯
         ↓
chrome.contextMenus.update()
         ↓
右鍵選單文字立即更新 ✅
```

## 🔧 技術細節

### updateContextMenu() 函式流程

1. **讀取使用者語言設定**
   ```javascript
   const result = await chrome.storage.local.get(['userLocale']);
   const userLocale = result.userLocale;
   ```

2. **載入對應翻譯檔案**
   ```javascript
   const response = await fetch(
     chrome.runtime.getURL(`_locales/${userLocale}/messages.json`)
   );
   const messages = await response.json();
   ```

3. **更新右鍵選單**
   ```javascript
   chrome.contextMenus.update('addSiteRule', {
     title: messages.contextMenuAddSite.message
   });
   ```

### 錯誤處理

- 如果載入翻譯失敗，使用瀏覽器預設語言
- 如果沒有使用者設定，使用瀏覽器預設語言
- 所有錯誤都會記錄到 console

## ✨ 優勢

| 特色 | 說明 |
|------|------|
| ⚡ 即時更新 | 切換語言後立即生效，無需等待 |
| 🔄 自動同步 | 右鍵選單自動跟隨使用者設定 |
| 🌍 全域一致 | popup、規則頁面、右鍵選單都使用相同語言 |
| 💾 持久保存 | 語言設定永久記憶 |
| 🛡️ 容錯處理 | 載入失敗時有適當的後備方案 |

## 📝 相關檔案

- `background.js` - 包含 updateContextMenu() 和監聽器
- `i18n.js` - 動態語言切換系統
- `site-rules.js` - 語言選擇器邏輯
- `_locales/*/messages.json` - 各語言翻譯檔案

## 🎉 完成！

現在右鍵選單會完美地跟隨使用者的語言設定，提供一致的多語言體驗！

### 快速測試清單
- [ ] 重新載入擴充功能
- [ ] 切換到日文
- [ ] 檢查右鍵選單顯示日文 ✅
- [ ] 切換到英文
- [ ] 檢查右鍵選單顯示英文 ✅
- [ ] 測試其他語言
- [ ] 確認所有語言都正常 ✅

