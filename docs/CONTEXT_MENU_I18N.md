# 右鍵選單國際化支援

## ✅ 完成項目

已為右鍵選單功能新增多國語言支援，現在會根據使用者的瀏覽器語言顯示對應的文字。

## 📝 新增的翻譯

### 1. 右鍵選單文字 (`contextMenuAddSite`)

| 語言 | 翻譯 |
|------|------|
| 🇺🇸 English | Add this site to countdown rules |
| 🇹🇼 繁體中文 | 新增此網站到倒數計時規則 |
| 🇯🇵 日本語 | このサイトをカウントダウンルールに追加 |
| 🇫🇷 Français | Ajouter ce site aux règles de compte à rebours |
| 🇪🇸 Español | Agregar este sitio a las reglas de cuenta regresiva |

### 2. 通知標題 (`notificationTitle`)

| 語言 | 翻譯 |
|------|------|
| 🇺🇸 English | Countdown Timer Rule |
| 🇹🇼 繁體中文 | 倒數計時規則 |
| 🇯🇵 日本語 | カウントダウンタイマールール |
| 🇫🇷 Français | Règle de compte à rebours |
| 🇪🇸 Español | Regla de temporizador |

### 3. 通知訊息 (`notificationAdded`)

| 語言 | 翻譯格式 |
|------|----------|
| 🇺🇸 English | Rule added: {url}<br>Countdown: {time} |
| 🇹🇼 繁體中文 | 已新增規則：{url}<br>倒數時間：{time} |
| 🇯🇵 日本語 | ルールを追加しました：{url}<br>カウントダウン：{time} |
| 🇫🇷 Français | Règle ajoutée : {url}<br>Compte à rebours : {time} |
| 🇪🇸 Español | Regla agregada: {url}<br>Cuenta regresiva: {time} |

## 🔧 技術實作

### background.js 更新

#### 之前 ❌
```javascript
chrome.contextMenus.create({
  id: 'addSiteRule',
  title: '新增此網站到倒數計時規則',  // 寫死的中文
  contexts: ['page', 'frame']
});
```

#### 現在 ✅
```javascript
chrome.contextMenus.create({
  id: 'addSiteRule',
  title: chrome.i18n.getMessage('contextMenuAddSite'),  // 使用 i18n
  contexts: ['page', 'frame']
});
```

### 通知訊息國際化

```javascript
// 根據語言格式化時間
const locale = chrome.i18n.getUILanguage();
let timeText = '';

if (locale.startsWith('zh')) {
  timeText = `${minutes}分${seconds}秒`;
} else if (locale.startsWith('ja')) {
  timeText = `${minutes}分${seconds}秒`;
} else if (locale.startsWith('fr')) {
  timeText = `${minutes} min ${seconds} sec`;
} else if (locale.startsWith('es')) {
  timeText = `${minutes} min ${seconds} seg`;
} else {
  // English
  timeText = `${minutes} minutes ${seconds} sec`;
}

// 使用參數化的訊息
chrome.notifications.create({
  title: chrome.i18n.getMessage('notificationTitle'),
  message: chrome.i18n.getMessage('notificationAdded', [urlPattern, timeText])
});
```

## 🎯 工作原理

### 1. 右鍵選單
- 在擴充功能安裝時創建
- 使用 `chrome.i18n.getMessage()` 讀取瀏覽器語言對應的翻譯
- 自動根據瀏覽器語言顯示

### 2. 通知訊息
- 使用參數化訊息格式 (`$1`, `$2`)
- 時間格式根據語言調整：
  - 中文/日文：`3分30秒`
  - 法文：`3 min 30 sec`
  - 西班牙文：`3 min 30 seg`
  - 英文：`3 minutes 30 sec`

## 📊 測試

### 測試步驟

1. **重新載入擴充功能**
   ```
   chrome://extensions/ → 點擊重新載入
   ```

2. **測試右鍵選單**
   - 在任何網頁上點擊右鍵
   - 查看「新增此網站到倒數計時規則」是否顯示正確語言
   
3. **測試通知**
   - 使用右鍵選單新增規則
   - 查看通知訊息是否使用正確語言

### 不同語言測試

#### 英文環境
```
Right-click menu: "Add this site to countdown rules"
Notification: "Countdown Timer Rule"
             "Rule added: *example.com*
              Countdown: 10 minutes 0 sec"
```

#### 繁體中文環境
```
右鍵選單：「新增此網站到倒數計時規則」
通知：「倒數計時規則」
     「已新增規則：*example.com*
      倒數時間：10分0秒」
```

#### 日文環境
```
右クリックメニュー：「このサイトをカウントダウンルールに追加」
通知：「カウントダウンタイマールール」
     「ルールを追加しました：*example.com*
      カウントダウン：10分0秒」
```

## 📦 更新的檔案

1. **background.js** - 使用 i18n API
2. **_locales/en/messages.json** - 新增 3 個翻譯鍵值
3. **_locales/zh_TW/messages.json** - 新增 3 個翻譯鍵值
4. **_locales/ja/messages.json** - 新增 3 個翻譯鍵值
5. **_locales/fr/messages.json** - 新增 3 個翻譯鍵值
6. **_locales/es/messages.json** - 新增 3 個翻譯鍵值

現在每種語言有 **54 個翻譯鍵值**（從 51 個增加到 54 個）

## ✨ 優勢

- ✅ 自動根據瀏覽器語言顯示
- ✅ 支援 5 種語言
- ✅ 時間格式符合各語言習慣
- ✅ 無需額外設定

## 🎉 完成！

右鍵選單和通知現在完全支援多國語言！
