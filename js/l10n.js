class L10nManager {
  constructor() {
    this.supportedLanguages = ['zh_TW', 'en_US', 'jp_JP', 'kr_KR'];
    this.defaultLanguage = 'zh_TW';
    this.currentLanguage = localStorage.getItem('sa_lang') || this.detectLanguage();
    this.translations = {};
  }

  detectLanguage() {
    const browserLang = navigator.language.replace('-', '_');
    // Map basic browser language strings to our specific formats
    if (browserLang.startsWith('zh')) {
      return 'zh_TW';
    } else if (browserLang.startsWith('ja') || browserLang.startsWith('jp')) {
      return 'jp_JP';
    } else if (browserLang.startsWith('ko') || browserLang.startsWith('kr')) {
      return 'kr_KR';
    }
    return 'en_US';
  }

  async init() {
    await this.loadTranslations(this.currentLanguage);
    this.translateDOM();
    this.updateFAQLink();
    this.setupSelector();
  }

  updateFAQLink() {
    const faqLink = document.getElementById("nav-faq-link");
    if (faqLink) {
      if (this.currentLanguage === "zh_TW") {
        faqLink.href = "/faq_zh.html";
      } else if (this.currentLanguage === "jp_JP") {
        faqLink.href = "/faq_jp.html";
      } else if (this.currentLanguage === "kr_KR") {
        faqLink.href = "/faq_kr.html";
      } else {
        faqLink.href = "/faq.html";
      }
    }
  }

  async loadTranslations(lang) {
    try {
      const response = await fetch(`/locales/${lang}.json`);
      if (!response.ok) throw new Error(`Status ${response.status}`);
      this.translations = await response.json();
      this.currentLanguage = lang;
      localStorage.setItem('sa_lang', lang);
      document.documentElement.lang = lang.substring(0, 2);
    } catch (e) {
      console.error(`Failed to load translations for ${lang}:`, e);
      // Fallback to default if load fails and we aren't already trying to load default
      if (lang !== this.defaultLanguage) {
        await this.loadTranslations(this.defaultLanguage);
      }
    }
  }

  t(key) {
    return key.split('.').reduce((obj, i) => (obj ? obj[i] : null), this.translations) || key;
  }

  translateDOM() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.t(key);
      if (translation) {
        if (element.tagName === 'INPUT') {
          element.placeholder = translation;
        } else {
          element.innerHTML = translation;
        }
      }
    });
  }

  async setLanguage(lang) {
    if (!this.supportedLanguages.includes(lang)) return;
    await this.loadTranslations(lang);
    this.translateDOM();
    this.updateFAQLink();
    
    // Update select element if present
    const select = document.getElementById('language-selector');
    if (select) {
      select.value = lang;
    }

    // Dispatch global event for custom component reactivity
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: lang }));
  }

  setupSelector() {
    const select = document.getElementById('language-selector');
    if (select) {
      select.value = this.currentLanguage;
      select.addEventListener('change', (e) => {
        this.setLanguage(e.target.value);
      });
    }
  }
}

const L10n = new L10nManager();
document.addEventListener('DOMContentLoaded', () => L10n.init());
window.L10n = L10n; // Expose globally for manual calls
