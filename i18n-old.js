// i18n helper functions
const I18N = {
  // Get message from Chrome i18n API
  getMessage: function(key, substitutions) {
    return chrome.i18n.getMessage(key, substitutions);
  },

  // Get current locale
  getLocale: function() {
    return chrome.i18n.getUILanguage();
  },

  // Get user's preferred locale from storage
  getUserLocale: function(callback) {
    chrome.storage.local.get(['userLocale'], (result) => {
      callback(result.userLocale || null);
    });
  },

  // Set user's preferred locale
  setUserLocale: function(locale, callback) {
    chrome.storage.local.set({ userLocale: locale }, callback);
  },

  // Get effective locale (user preference or browser default)
  getEffectiveLocale: function(callback) {
    this.getUserLocale((userLocale) => {
      if (userLocale) {
        callback(userLocale);
      } else {
        const browserLocale = this.getLocale();
        // Map browser locale to supported locales
        const supported = ['en', 'zh_TW', 'ja', 'fr', 'es'];
        let effectiveLocale = 'en'; // Default to English
        
        if (browserLocale.startsWith('zh-TW') || browserLocale.startsWith('zh_HK')) {
          effectiveLocale = 'zh_TW';
        } else if (browserLocale.startsWith('ja')) {
          effectiveLocale = 'ja';
        } else if (browserLocale.startsWith('fr')) {
          effectiveLocale = 'fr';
        } else if (browserLocale.startsWith('es')) {
          effectiveLocale = 'es';
        }
        
        callback(effectiveLocale);
      }
    });
  },

  // Initialize page with i18n
  initPage: function() {
    // Replace all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const message = chrome.i18n.getMessage(key);
      if (message) {
        element.textContent = message;
      }
    });

    // Replace all elements with data-i18n-placeholder attribute
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      const message = chrome.i18n.getMessage(key);
      if (message) {
        element.placeholder = message;
      }
    });

    // Replace all elements with data-i18n-title attribute
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
      const key = element.getAttribute('data-i18n-title');
      const message = chrome.i18n.getMessage(key);
      if (message) {
        element.title = message;
      }
    });

    // Update document title
    const titleElement = document.querySelector('title');
    if (titleElement && titleElement.hasAttribute('data-i18n')) {
      const key = titleElement.getAttribute('data-i18n');
      const message = chrome.i18n.getMessage(key);
      if (message) {
        document.title = message;
      }
    }
  },

  // Get display text for time
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
  }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => I18N.initPage());
} else {
  I18N.initPage();
}
