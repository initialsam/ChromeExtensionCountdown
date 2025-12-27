# 版本 1.1.0 更新說明

## 📅 發布日期
2025-12-27

## 🎉 主要更新

### 🌍 完整的國際化支援
為擴充功能添加了完整的多語言支援系統，現在支援 5 種語言。

#### 支援的語言
- 🇺🇸 **English** - 預設語言
- 🇹🇼 **繁體中文 (Traditional Chinese)**
- 🇯🇵 **日本語 (Japanese)**
- 🇫🇷 **Français (French)**
- 🇪🇸 **Español (Spanish)**

#### 國際化功能特色
- ✅ **自動語言偵測** - 根據瀏覽器語言自動顯示對應介面
- ✅ **手動語言切換** - 在規則管理頁面可以選擇語言
- ✅ **即時更新** - 切換語言後立即生效，無需重新載入頁面
- ✅ **全域同步** - 所有頁面（popup、規則管理、右鍵選單、通知）都使用相同語言
- ✅ **持久保存** - 語言設定永久記憶

### 🔧 技術改進

#### 1. 動態 i18n 系統
實作了全新的動態語言載入系統：
- 使用 `fetch()` API 動態載入翻譯檔案
- 快取機制提升效能
- 支援運行時語言切換

#### 2. 右鍵選單動態更新
- 右鍵選單文字會自動跟隨使用者選擇的語言
- 使用 `chrome.storage.onChanged` 監聽語言變更
- 切換語言後右鍵選單立即更新

#### 3. 重複規則檢查
- 右鍵新增規則時會檢查是否已存在
- 如果規則已存在，顯示提示通知
- **不會覆蓋現有規則**，保護使用者設定

### 📊 翻譯統計
- **翻譯鍵值**：56 個/語言
- **總翻譯數**：280 個鍵值
- **覆蓋範圍**：100% 所有界面文字

### 🎨 使用者介面更新

#### 語言設定區塊
在規則管理頁面底部新增「🌐 語言設定」區塊：
- 語言下拉選擇器
- 5 種語言可選
- 簡潔清晰的設計

#### 通知訊息
所有通知訊息都支援多語言：
- 新增規則成功
- 規則已存在警告
- 匯入/匯出設定回饋

## 🔄 版本變更細節

### 新增檔案
```
_locales/
  ├── en/messages.json          (56 keys)
  ├── zh_TW/messages.json       (56 keys)
  ├── ja/messages.json          (56 keys)
  ├── fr/messages.json          (56 keys)
  └── es/messages.json          (56 keys)
i18n.js                         (動態 i18n 系統)
```

### 修改檔案
```
manifest.json                   (版本 1.0.0 → 1.1.0)
  • 新增 default_locale: "en"
  • 新增 web_accessible_resources
  • name 和 description 使用 i18n

background.js
  • 右鍵選單使用 i18n
  • 新增 updateContextMenu() 函式
  • 新增 storage.onChanged 監聽器
  • 新增重複規則檢查邏輯
  • 通知訊息國際化

popup.html
  • 所有文字新增 data-i18n 屬性
  • 載入 i18n.js

popup.js
  • 使用 I18N.getMessage() 取代 chrome.i18n.getMessage()

site-rules.html
  • 所有文字新增 data-i18n 屬性
  • 新增語言選擇器
  • 載入 i18n.js

site-rules.js
  • 使用 I18N.getMessage()
  • 新增語言切換邏輯
  • 使用 I18N.getTimeText() 格式化時間
```

## 📝 新增的翻譯鍵值

### 基礎 UI (18 個)
- extensionName, extensionDescription
- title, displaySettings, lightSettings
- showTime, showBadge
- start, clear, edit, delete
- 等等...

### 時間相關 (6 個)
- seconds, minutes, minute
- countdown, timerStarted, timeCleared

### 規則管理 (15 個)
- siteRulesTitle, urlPattern, addRule
- existingRules, noRules
- enterUrl, enterValidTime, ruleExists
- 等等...

### 設定管理 (8 個)
- settingsManagement, exportSettings, importSettings
- exported, imported, importFailed
- language, languageHelp

### 右鍵選單 (5 個)
- contextMenuAddSite
- notificationTitle, notificationAdded
- ruleAlreadyExists, ruleAlreadyExistsMessage

### 其他 (4 個)
- manageSiteRules, saveChanges
- lightOnly, yellowLightInfo

## 🚀 如何使用新功能

### 切換語言
1. 點擊擴充功能圖示
2. 點擊「管理網站規則」（或對應語言的文字）
3. 捲動到底部「🌐 語言設定」
4. 選擇想要的語言
5. 頁面立即更新為新語言

### 驗證右鍵選單
1. 切換語言後
2. 在任何網頁點擊右鍵
3. 右鍵選單應該顯示對應語言的文字

### 使用不同語言的通知
1. 切換到想要的語言
2. 使用右鍵選單新增規則
3. 查看通知訊息使用對應語言

## 🐛 修正的問題

### 語言切換無法生效
**問題**：之前使用 `chrome.i18n.getMessage()` 無法動態切換語言

**解決**：實作動態 i18n 系統，使用 fetch() 載入翻譯檔案

### 右鍵選單語言不同步
**問題**：切換語言後，右鍵選單文字不會更新

**解決**：新增 `storage.onChanged` 監聽器，自動更新右鍵選單

### 重複規則被覆蓋
**問題**：右鍵新增已存在的規則會覆蓋原設定

**解決**：新增重複檢查邏輯，顯示提示而不覆蓋

## 📖 文件

新增了完整的技術文件：
- `I18N_README.md` - 國際化總覽
- `I18N_SUMMARY.md` - 實作總結
- `LANGUAGE_FIX.md` - 語言切換修正說明
- `LANGUAGE_SWITCHING_GUIDE.md` - 使用者指南
- `CONTEXT_MENU_I18N.md` - 右鍵選單國際化
- `CONTEXT_MENU_DYNAMIC_UPDATE.md` - 動態更新說明
- `FINAL_I18N_SUMMARY.md` - 最終總結

## 🎯 技術亮點

### 語言優先順序
```
1. 使用者手動設定 (最高優先)
   ↓
2. 瀏覽器語言設定
   ↓
3. 預設英文
```

### 即時語言切換
```
使用者選擇語言
  ↓
儲存到 storage
  ↓
觸發 onChanged 事件
  ↓
更新所有介面
  ↓
立即生效 ✅
```

### 快取機制
- 已載入的翻譯檔案會被快取
- 避免重複載入
- 提升效能

## ⚡ 效能優化

- **按需載入**：只載入當前需要的語言
- **快取機制**：避免重複載入相同翻譯
- **非同步處理**：使用 async/await 避免阻塞

## 🔒 安全性改進

- **重複檢查**：避免意外覆蓋現有規則
- **錯誤處理**：完善的錯誤處理機制
- **後備方案**：載入失敗時使用預設語言

## 📈 未來計劃

- [ ] 新增更多語言支援
- [ ] 社群翻譯貢獻系統
- [ ] 翻譯品質回報機制
- [ ] 在 popup 也加入語言切換器

## 💡 使用建議

1. **首次使用**：擴充功能會自動偵測您的瀏覽器語言
2. **手動切換**：在規則管理頁面底部可以選擇語言
3. **管理規則**：使用編輯功能而非右鍵重複新增

## 🙏 致謝

感謝所有測試和提供反饋的使用者！

---

**版本：** 1.1.0  
**發布日期：** 2025-12-27  
**上一版本：** 1.0.0  
**下載：** Chrome Web Store

## 📞 回饋

如有任何問題或建議，歡迎：
- 提交 Issue
- 提供翻譯改進建議
- 分享使用心得
