// 動態 i18n 系統 - 支援運行時語言切換
const I18N = {
  currentLocale: 'en',
  messages: {},

  // 所有語言的翻譯資料
  translations: {
    en: null,
    zh_TW: null,
    ja: null,
    fr: null,
    es: null
  },

  // 載入指定語言的翻譯
  loadMessages: async function(locale) {
    if (this.translations[locale]) {
      return this.translations[locale];
    }

    try {
      const response = await fetch(chrome.runtime.getURL(`_locales/${locale}/messages.json`));
      const data = await response.json();
      this.translations[locale] = data;
      return data;
    } catch (error) {
      console.error(`Failed to load locale ${locale}:`, error);
      return null;
    }
  },

  // 初始化 - 載入有效語言
  init: async function() {
    const locale = await this.getEffectiveLocale();
    await this.setLocale(locale);
  },

  // 設定當前語言
  setLocale: async function(locale) {
    this.currentLocale = locale;
    const messages = await this.loadMessages(locale);
    if (messages) {
      this.messages = messages;
      this.updatePage();
    }
  },

  // 取得翻譯訊息
  getMessage: function(key, substitutions) {
    if (this.messages[key] && this.messages[key].message) {
      let message = this.messages[key].message;
      
      // 處理替換參數
      if (substitutions) {
        if (Array.isArray(substitutions)) {
          substitutions.forEach((sub, index) => {
            message = message.replace(`$${index + 1}`, sub);
          });
        } else {
          message = message.replace('$1', substitutions);
        }
      }
      
      return message;
    }
    return key; // 找不到翻譯時返回 key
  },

  // 取得使用者偏好語言
  getUserLocale: function() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['userLocale'], (result) => {
        resolve(result.userLocale || null);
      });
    });
  },

  // 儲存使用者偏好語言
  setUserLocale: function(locale) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ userLocale: locale }, resolve);
    });
  },

  // 取得有效語言（優先順序：使用者設定 > 瀏覽器語言 > 預設）
  getEffectiveLocale: async function() {
    const userLocale = await this.getUserLocale();
    if (userLocale) {
      return userLocale;
    }

    const browserLocale = chrome.i18n.getUILanguage();
    
    if (browserLocale.startsWith('zh-TW') || browserLocale.startsWith('zh-HK') || browserLocale.startsWith('zh_TW')) {
      return 'zh_TW';
    } else if (browserLocale.startsWith('ja')) {
      return 'ja';
    } else if (browserLocale.startsWith('fr')) {
      return 'fr';
    } else if (browserLocale.startsWith('es')) {
      return 'es';
    }
    
    return 'en'; // 預設英文
  },

  // 更新頁面上的所有翻譯
  updatePage: function() {
    // 更新 data-i18n 元素
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const message = this.getMessage(key);
      if (message) {
        element.textContent = message;
      }
    });

    // 更新 data-i18n-placeholder 元素
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      const message = this.getMessage(key);
      if (message) {
        element.placeholder = message;
      }
    });

    // 更新 data-i18n-title 元素
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
      const key = element.getAttribute('data-i18n-title');
      const message = this.getMessage(key);
      if (message) {
        element.title = message;
      }
    });

    // 更新 document title
    const titleElement = document.querySelector('title[data-i18n]');
    if (titleElement) {
      const key = titleElement.getAttribute('data-i18n');
      const message = this.getMessage(key);
      if (message) {
        document.title = message;
      }
    }
  },

  // 取得格式化的時間文字
  getTimeText: function(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    if (minutes > 0) {
      const minuteText = minutes === 1 ? this.getMessage('minute') : this.getMessage('minutes');
      const secondText = this.getMessage('seconds');
      return `${minutes} ${minuteText} ${seconds} ${secondText}`;
    } else {
      const secondText = this.getMessage('seconds');
      return `${seconds} ${secondText}`;
    }
  },

  // 取得當前語言
  getLocale: function() {
    return this.currentLocale;
  }
};

// 自動初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => I18N.init());
} else {
  I18N.init();
}
