# 語言切換修正說明

## 🔧 問題原因

Chrome Extension 的 `chrome.i18n.getMessage()` API 只會讀取瀏覽器的 UI 語言設定，**無法動態切換**。即使我們儲存了使用者選擇的語言，Chrome 仍會使用瀏覽器設定的語言來載入 `_locales` 資料夾。

## ✅ 解決方案

實作了一個**動態 i18n 系統**，可以在運行時載入和切換不同語言的翻譯檔案。

### 核心改變

1. **新的 i18n.js**
   - 使用 `fetch()` 動態載入 `_locales/*/messages.json`
   - 支援即時語言切換，不需要重新載入頁面
   - 快取已載入的翻譯資料

2. **manifest.json**
   - 新增 `web_accessible_resources` 讓 i18n.js 可以讀取翻譯檔案
   ```json
   "web_accessible_resources": [{
     "resources": ["_locales/*/messages.json"],
     "matches": ["<all_urls>"]
   }]
   ```

3. **語言切換流程**
   ```
   使用者選擇語言
   → 儲存到 chrome.storage.local
   → 載入新語言的 messages.json
   → 更新頁面上所有 i18n 元素
   → 完成！（不需重新載入）
   ```

## 🎯 新的使用方式

### 切換語言（無需重新載入）

```javascript
// 在 site-rules.html 切換語言
languageSelect.addEventListener('change', async (e) => {
  const newLocale = e.target.value;
  await I18N.setUserLocale(newLocale);  // 儲存偏好
  await I18N.setLocale(newLocale);      // 立即套用
  loadRules();                          // 更新動態內容
});
```

### API 變更

所有的 `chrome.i18n.getMessage()` 改為 `I18N.getMessage()`：

#### 之前 ❌
```javascript
const text = chrome.i18n.getMessage('keyName');
```

#### 現在 ✅
```javascript
const text = I18N.getMessage('keyName');
```

### 新的 I18N API

```javascript
// 取得翻譯
I18N.getMessage('key')

// 設定語言（會立即更新頁面）
await I18N.setLocale('ja')

// 取得當前語言
I18N.getLocale()

// 取得有效語言（使用者設定 > 瀏覽器 > 預設）
await I18N.getEffectiveLocale()

// 儲存使用者偏好
await I18N.setUserLocale('zh_TW')

// 取得使用者偏好
await I18N.getUserLocale()

// 格式化時間文字
I18N.getTimeText(180) // "3 minutes 0 sec"
```

## 📦 修改的檔案

1. **i18n.js** - 完全重寫為動態系統
2. **manifest.json** - 新增 web_accessible_resources
3. **popup.js** - chrome.i18n.getMessage → I18N.getMessage
4. **site-rules.js** - chrome.i18n.getMessage → I18N.getMessage，語言切換邏輯更新

## ✨ 優勢

### 之前的系統 ❌
- ✗ 無法動態切換語言
- ✗ 必須重新開啟 Chrome 才能生效
- ✗ 依賴瀏覽器語言設定

### 現在的系統 ✅
- ✓ **即時切換語言**（無需重新載入頁面）
- ✓ 使用者設定優先於瀏覽器設定
- ✓ 快取機制提升效能
- ✓ 完整的語言管理 API

## 🚀 測試步驟

1. **重新載入擴充功能**
   - 打開 `chrome://extensions/`
   - 點擊「重新載入」按鈕

2. **測試語言切換**
   - 開啟規則管理頁面
   - 捲動到「🌐 語言設定」
   - 選擇不同語言（如：日本語）
   - 觀察頁面**立即**更新為日文 ✨

3. **測試持久化**
   - 關閉規則管理頁面
   - 開啟擴充功能 popup
   - 確認 popup 也顯示日文 ✓

4. **測試自動偵測**
   - 開啟開發者工具
   - Console 輸入：`chrome.storage.local.remove('userLocale')`
   - 重新載入頁面
   - 應該顯示瀏覽器預設語言 ✓

## 📊 效能優化

- **快取機制**：已載入的語言會被快取，不會重複載入
- **非同步載入**：使用 async/await 避免阻塞 UI
- **按需載入**：只載入當前需要的語言檔案

## 🎉 完成！

現在語言切換功能可以正常運作了！使用者選擇語言後會**立即生效**，不需要重新開啟瀏覽器或重新載入頁面。
