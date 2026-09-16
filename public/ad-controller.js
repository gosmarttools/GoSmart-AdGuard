/**
 * GoSmart AdGuard - Ad Controller & Safe Window Manager
 * Hak Cipta (c) 2026 TUANBAGUES & GoSmart Teknologi Creative. Semua Hak Dilindungi.
 *
 * Modul pendukung untuk pengaturan tayangan iklan, pop-under aman,
 * dan pembukaan jendela sesuai kebijakan peramban (User-Gesture Mandate).
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.GoSmartAdController = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var DEFAULT_OPTIONS = {
    adUrl: '/api/redirect?direct=true&url=' + encodeURIComponent('https://example.com/ad-step'),
    frequencyMinutes: 15, // Capping: 1 kali per 15 menit per pengguna
    triggerSelector: 'a, button, .clickable-zone',
    excludeSelector: '.no-ad-trigger, header a, nav a',
    name: 'GoSmartAdWindow',
    popUnder: true,
    storageKey: 'gosmart_ad_last_triggered'
  };

  function AdController(options) {
    this.options = Object.assign({}, DEFAULT_OPTIONS, options || {});
    this.initialized = false;
    this._handleClick = this._handleClick.bind(this);
  }

  AdController.prototype.canTrigger = function () {
    try {
      var lastTime = localStorage.getItem(this.options.storageKey);
      if (!lastTime) return true;
      var elapsedMs = Date.now() - parseInt(lastTime, 10);
      var cooldownMs = this.options.frequencyMinutes * 60 * 1000;
      return elapsedMs >= cooldownMs;
    } catch (e) {
      return true;
    }
  };

  AdController.prototype.markTriggered = function () {
    try {
      localStorage.setItem(this.options.storageKey, Date.now().toString());
    } catch (e) {
      // localStorage mungkin diblokir di private mode
    }
  };

  AdController.prototype.resetCooldown = function () {
    try {
      localStorage.removeItem(this.options.storageKey);
    } catch (e) {
      // ignore
    }
  };

  AdController.prototype.openAdWindow = function () {
    if (!this.canTrigger()) {
      return false;
    }

    var width = window.screen.availWidth || 800;
    var height = window.screen.availHeight || 600;
    var left = window.screenLeft !== undefined ? window.screenLeft : window.screenX || 0;
    var top = window.screenTop !== undefined ? window.screenTop : window.screenY || 0;

    var windowFeatures = [
      'toolbar=no',
      'location=no',
      'directories=no',
      'status=no',
      'menubar=no',
      'scrollbars=yes',
      'resizable=yes',
      'width=' + Math.min(width, 1024),
      'height=' + Math.min(height, 768),
      'top=' + top,
      'left=' + left
    ].join(',');

    try {
      var adWindow = window.open(this.options.adUrl, '_blank', windowFeatures);

      if (adWindow) {
        if (this.options.popUnder) {
          // Upaya pop-under aman: kembalikan fokus ke jendela utama
          try {
            adWindow.blur();
            window.focus();
          } catch (err) {
            // Beberapa browser membatasi window.blur()
          }
        }
        this.markTriggered();
        return true;
      }
    } catch (err) {
      console.warn('[GoSmart AdController] Gagal membuka window:', err);
    }
    return false;
  };

  AdController.prototype._handleClick = function (e) {
    var target = e.target;
    if (!target) return;

    // Periksa apakah elemen termasuk yang dikecualikan
    if (this.options.excludeSelector && target.closest(this.options.excludeSelector)) {
      return;
    }

    // Periksa apakah elemen cocok dengan target pemicu
    if (this.options.triggerSelector && target.closest(this.options.triggerSelector)) {
      this.openAdWindow();
    }
  };

  AdController.prototype.init = function () {
    if (this.initialized) return;
    this.initialized = true;

    // Browser policy: popup HANYA diizinkan dalam event listener klik/gesture pengguna
    document.addEventListener('click', this._handleClick, false);
  };

  AdController.prototype.destroy = function () {
    document.removeEventListener('click', this._handleClick, false);
    this.initialized = false;
  };

  return AdController;
}));
