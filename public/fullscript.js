/**
 * GoSmart AdGuard - FullScript Link Injection Client
 * Hak Cipta (c) 2026 TUANBAGUES & GoSmart Teknologi Creative. Semua Hak Dilindungi.
 *
 * Skrip ini dipasang di dalam tag <head> pada website publisher.
 * Mendeteksi tautan keluar (external links) secara otomatis dan membungkusnya
 * ke gateway iklan mandiri dengan filter Whitelist & Blacklist.
 */
(function (window, document) {
  'use strict';

  // Cegah inisialisasi ganda
  if (window.__GOSMART_FULLSCRIPT_LOADED__) return;
  window.__GOSMART_FULLSCRIPT_LOADED__ = true;

  // Baca konfigurasi dari elemen script tag atau variabel global
  var scriptTag = document.getElementById('gosmart-fullscript') || document.currentScript;
  var globalConfig = window.FullScriptConfig || {};

  var CONFIG = {
    adServerUrl: globalConfig.adServerUrl || (scriptTag && scriptTag.getAttribute('data-adserver')) || (window.location.origin + '/api/redirect'),
    publisherToken: globalConfig.publisherToken || (scriptTag && scriptTag.getAttribute('data-token')) || '12cfd687bc39171533f0eb5b0d9bbf708412cb62502693cb8b15ca39d81777c9',
    whitelist: Array.isArray(globalConfig.whitelist) ? globalConfig.whitelist : [],
    blacklist: Array.isArray(globalConfig.blacklist) ? globalConfig.blacklist : [window.location.hostname],
    openNewTab: globalConfig.openNewTab !== false,
    debug: globalConfig.debug === true
  };

  function log(msg, extra) {
    if (CONFIG.debug && window.console && console.log) {
      console.log('[GoSmart FullScript]', msg, extra || '');
    }
  }

  function isExternalLink(urlStr) {
    if (!urlStr || urlStr.indexOf('javascript:') === 0 || urlStr.indexOf('#') === 0 || urlStr.indexOf('mailto:') === 0 || urlStr.indexOf('tel:') === 0) {
      return false;
    }

    try {
      var parsed = new URL(urlStr, window.location.origin);
      // Hanya proses protokol web http & https
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return false;
      }

      var targetHost = parsed.hostname.toLowerCase();
      var currentHost = window.location.hostname.toLowerCase();

      // 1. Abaikan jika sama dengan domain internal saat ini
      if (targetHost === currentHost) {
        return false;
      }

      // 2. Periksa Blacklist: Jika domain ada di daftar blacklist, jangan bungkus
      for (var b = 0; b < CONFIG.blacklist.length; b++) {
        var blocked = CONFIG.blacklist[b].toLowerCase().trim();
        if (blocked && (targetHost === blocked || targetHost.endsWith('.' + blocked))) {
          log('Domain diblokir oleh Blacklist:', targetHost);
          return false;
        }
      }

      // 3. Periksa Whitelist: Jika whitelist diisi, hanya domain yang terdaftar yang dibungkus
      if (CONFIG.whitelist.length > 0) {
        var isWhitelisted = false;
        for (var w = 0; w < CONFIG.whitelist.length; w++) {
          var allowed = CONFIG.whitelist[w].toLowerCase().trim();
          if (allowed && (targetHost === allowed || targetHost.endsWith('.' + allowed))) {
            isWhitelisted = true;
            break;
          }
        }
        if (!isWhitelisted) {
          log('Domain tidak terdaftar di Whitelist:', targetHost);
          return false;
        }
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  function wrapLink(anchor) {
    if (anchor.getAttribute('data-gosmart-wrapped') === 'true') {
      return;
    }

    var originalHref = anchor.getAttribute('href');
    if (!originalHref) return;

    if (isExternalLink(originalHref)) {
      anchor.setAttribute('data-gosmart-wrapped', 'true');
      anchor.setAttribute('data-original-href', originalHref);

      var separator = CONFIG.adServerUrl.indexOf('?') !== -1 ? '&' : '?';
      var wrappedUrl = CONFIG.adServerUrl + separator + 'url=' + encodeURIComponent(originalHref) + '&token=' + encodeURIComponent(CONFIG.publisherToken);

      anchor.setAttribute('href', wrappedUrl);

      if (CONFIG.openNewTab) {
        anchor.setAttribute('target', '_blank');
      }
      anchor.setAttribute('rel', 'nofollow noopener noreferrer');

      log('Tautan dibungkus:', originalHref + ' -> ' + wrappedUrl);
    }
  }

  function processAllLinks() {
    var links = document.querySelectorAll('a[href]:not([data-gosmart-wrapped="true"])');
    for (var i = 0; i < links.length; i++) {
      wrapLink(links[i]);
    }
  }

  // Jalankan saat DOM telah siap
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', processAllLinks);
  } else {
    processAllLinks();
  }

  // Gunakan MutationObserver untuk mendeteksi link dinamis (AJAX, SPA, Infinite Scroll)
  if (window.MutationObserver && document.body) {
    var observer = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var addedNodes = mutations[i].addedNodes;
        for (var j = 0; j < addedNodes.length; j++) {
          var node = addedNodes[j];
          if (node.nodeType === 1) { // ELEMENT_NODE
            if (node.tagName === 'A') {
              wrapLink(node);
            } else if (node.querySelectorAll) {
              var nestedLinks = node.querySelectorAll('a[href]:not([data-gosmart-wrapped="true"])');
              for (var k = 0; k < nestedLinks.length; k++) {
                wrapLink(nestedLinks[k]);
              }
            }
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    // Fallback berkala untuk peramban lawas
    setInterval(processAllLinks, 2500);
  }

  // Ekspos helper di window untuk pengujian & kontrol manual
  window.GoSmartFullScript = {
    config: CONFIG,
    scan: processAllLinks,
    isExternal: isExternalLink,
    version: '1.2.0'
  };

  log('Inisialisasi berhasil dengan token:', CONFIG.publisherToken.substring(0, 10) + '...');
})(window, document);
