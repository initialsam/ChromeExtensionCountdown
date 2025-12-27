# 國際化更新總結 - 2025-12-27

## ✅ 完成的更新

### 1. 預設語言改為英文
- ✅ `manifest.json` 的 `default_locale` 從 `zh_TW` 改為 `en`
- ✅ 當瀏覽器語言不匹配任何支援語言時，預設顯示英文介面

### 2. 新增語言切換功能
- ✅ 在規則管理頁面 (`site-rules.html`) 新增語言選擇器
- ✅ 支援手動切換語言：
  - English (en)
  - 繁體中文 (zh_TW)
  - 日本語 (ja)
  - Français (fr)
  - Español (es)

### 3. 更新的檔案

#### manifest.json
```json
"default_locale": "en"  // 從 "zh_TW" 改為 "en"
```

#### i18n.js
新增功能：
- `getUserLocale(callback)` - 取得使用者偏好語言
- `setUserLocale(locale, callback)` - 設定使用者偏好語言
- `getEffectiveLocale(callback)` - 取得有效語言（使用者設定 > 瀏覽器語言 > 預設英文）

語言自動偵測邏輯：
```javascript
// 1. 優先使用使用者手動設定的語言
// 2. 若無設定，根據瀏覽器語言自動偵測：
//    - zh-TW, zh-HK → zh_TW
//    - ja → ja
//    - fr → fr
//    - es → es
//    - 其他 → en (預設)
```

#### site-rules.html
新增語言設定區塊：
```html
<div>
  <h2>🌐 語言設定</h2>
  <select id="languageSelect">
    <option value="en">English</option>
    <option value="zh_TW">繁體中文</option>
    <option value="ja">日本語</option>
    <option value="fr">Français</option>
    <option value="es">Español</option>
  </select>
  <p>選擇介面語言（需重新載入頁面）</p>
</div>
```

#### site-rules.js
新增語言切換邏輯：
```javascript
// 載入當前語言設定
I18N.getEffectiveLocale((locale) => {
  languageSelect.value = locale;
});

// 語言切換事件
languageSelect.addEventListener('change', (e) => {
  const newLocale = e.target.value;
  I18N.setUserLocale(newLocale, () => {
    window.location.reload();
  });
});
```

#### 翻譯檔案更新
所有語言新增 `languageHelp` 鍵值：
- ✅ `_locales/en/messages.json` - "Select interface language (requires page reload)"
- ✅ `_locales/zh_TW/messages.json` - "選擇介面語言（需重新載入頁面）"
- ✅ `_locales/ja/messages.json` - "インターフェース言語を選択（ページの再読み込みが必要）"
- ✅ `_locales/fr/messages.json` - "Sélectionnez la langue de l'interface (nécessite un rechargement de la page)"
- ✅ `_locales/es/messages.json` - "Seleccionar idioma de la interfaz (requiere recargar la página)"

現在每種語言有 **51 個翻譯鍵值**（原 50 個 + languageHelp）

## 🎯 功能說明

### 語言優先順序
1. **使用者手動設定** - 最高優先級
2. **瀏覽器語言** - 自動偵測
3. **預設語言** - 英文 (en)

### 使用者體驗

#### 情境 1：第一次使用
```
使用者瀏覽器語言：繁體中文
→ 自動顯示繁體中文介面 ✅
```

#### 情境 2：手動切換語言
```
使用者在規則管理頁面選擇「日本語」
→ 儲存設定後重新載入
→ 所有頁面都顯示日文介面 ✅
```

#### 情境 3：不支援的語言
```
使用者瀏覽器語言：德文 (de)
→ 沒有對應翻譯
→ 顯示英文介面（預設） ✅
```

### 語言切換流程
```
1. 使用者開啟規則管理頁面 (site-rules.html)
2. 捲動到最下方「🌐 語言設定」區塊
3. 從下拉選單選擇想要的語言
4. 頁面自動重新載入
5. 所有介面（包括 popup）都切換到新語言
```

## 📊 測試結果

### JSON 格式驗證
```
✅ _locales/en/messages.json    - Valid (51 keys)
✅ _locales/zh_TW/messages.json - Valid (51 keys)
✅ _locales/ja/messages.json    - Valid (51 keys)
✅ _locales/fr/messages.json    - Valid (51 keys)
✅ _locales/es/messages.json    - Valid (51 keys)
✅ manifest.json                - Valid
```

### 功能測試清單
- ✅ 預設語言為英文
- ✅ 瀏覽器語言自動偵測正常
- ✅ 手動切換語言功能正常
- ✅ 語言設定持久化儲存
- ✅ 切換語言後所有頁面同步更新
- ✅ 所有翻譯鍵值完整

## 📁 檔案清單

修改的檔案：
- ✅ `manifest.json` - 預設語言改為 en
- ✅ `i18n.js` - 新增語言管理函式
- ✅ `site-rules.html` - 新增語言選擇器
- ✅ `site-rules.js` - 新增語言切換邏輯
- ✅ `_locales/en/messages.json` - 新增 languageHelp
- ✅ `_locales/zh_TW/messages.json` - 新增 languageHelp
- ✅ `_locales/ja/messages.json` - 新增 languageHelp
- ✅ `_locales/fr/messages.json` - 新增 languageHelp
- ✅ `_locales/es/messages.json` - 新增 languageHelp

新增的檔案：
- ✅ `UPDATE_SUMMARY.md` - 本更新總結文件

## 🎉 完成！

兩個需求都已完整實作：
1. ✅ **預設語言改為英文** - 不支援的語言會顯示英文介面
2. ✅ **規則管理頁面加上切換語系功能** - 提供5種語言手動選擇

使用者現在可以：
- 享受自動語言偵測的便利性
- 在規則管理頁面手動切換喜好的語言
- 不受瀏覽器語言限制，自由選擇介面語言
