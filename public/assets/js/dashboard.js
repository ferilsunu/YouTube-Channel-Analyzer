/**
 * YouTube Channel Analyzer & Intelligence Dashboard Controller v3.1
 * Author: Feril Sunu
 */

(function () {
  'use strict';

  function formatNumber(n) {
    if (n === undefined || n === null || isNaN(n)) return '0';
    const num = Number(n);
    if (num < 1e3) return num.toLocaleString();
    if (num >= 1e3 && num < 1e6) return +(num / 1e3).toFixed(1) + 'K';
    if (num >= 1e6 && num < 1e9) return +(num / 1e6).toFixed(1) + 'M';
    if (num >= 1e9 && num < 1e12) return +(num / 1e9).toFixed(1) + 'B';
    return +(num / 1e12).toFixed(1) + 'T';
  }

  function parseFormattedNumber(str) {
    if (!str) return 0;
    const clean = str.replace(/[^0-9.KMBTkmbt]/g, '');
    const mult = clean.slice(-1).toUpperCase();
    const val = parseFloat(clean);
    if (isNaN(val)) return 0;
    if (mult === 'K') return val * 1e3;
    if (mult === 'M') return val * 1e6;
    if (mult === 'B') return val * 1e9;
    if (mult === 'T') return val * 1e12;
    return val;
  }

  /* =========================================================
     1. VIDEO MODAL PLAYER
     ========================================================= */
  const modalBackdrop = document.getElementById('video-modal-backdrop');
  const modalIframe = document.getElementById('modal-video-iframe');
  const modalTitle = document.getElementById('modal-video-title');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const videoCards = document.querySelectorAll('.video-item-card');

  function openVideoModal(videoId, title) {
    if (!modalBackdrop || !modalIframe) return;
    modalTitle.textContent = title || 'Video Preview';
    modalIframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`;
    modalBackdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeVideoModal() {
    if (!modalBackdrop || !modalIframe) return;
    modalBackdrop.classList.remove('open');
    modalIframe.src = '';
    document.body.style.overflow = '';
  }

  videoCards.forEach(card => {
    card.addEventListener('click', () => {
      const videoId = card.getAttribute('data-videoid');
      const title = card.getAttribute('data-title');
      if (videoId) openVideoModal(videoId, title);
    });
  });

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeVideoModal);

  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) closeVideoModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalBackdrop?.classList.contains('open')) {
      closeVideoModal();
    }
  });

  /* =========================================================
     2. DYNAMIC CPM MONETIZATION SIMULATOR
     ========================================================= */
  const cpmSlider = document.getElementById('cpm-slider');
  const cpmDisplayVal = document.getElementById('cpm-display-val');
  const simMonthlyVal = document.getElementById('sim-monthly-val');
  const simYearlyVal = document.getElementById('sim-yearly-val');

  if (cpmSlider) {
    const rawViewsStr = cpmSlider.getAttribute('data-views') || '0';
    const velocityStr = cpmSlider.getAttribute('data-velocity') || '4';

    const recentAvgViews = parseFormattedNumber(rawViewsStr);
    const uploadsPerMonth = Math.max(1, parseFloat(velocityStr) || 4);

    cpmSlider.addEventListener('input', () => {
      const cpm = parseFloat(cpmSlider.value);
      if (cpmDisplayVal) cpmDisplayVal.textContent = `$${cpm.toFixed(2)}`;

      const monthlyViews = recentAvgViews * uploadsPerMonth;
      const monthlyEarnings = Math.round((monthlyViews / 1000) * cpm);
      const yearlyEarnings = monthlyEarnings * 12;

      if (simMonthlyVal) simMonthlyVal.textContent = `$${formatNumber(monthlyEarnings)}`;
      if (simYearlyVal) simYearlyVal.textContent = `$${formatNumber(yearlyEarnings)}`;
    });
  }

  /* =========================================================
     3. COPY CHANNEL AUDIT REPORT & TOAST
     ========================================================= */
  const btnCopyAudit = document.getElementById('btn-copy-audit');
  const toastNotify = document.getElementById('toast-notify');
  const toastMessage = document.getElementById('toast-message');

  function showToast(msg) {
    if (!toastNotify) return;
    if (toastMessage) toastMessage.textContent = msg;
    toastNotify.classList.add('show');
    setTimeout(() => {
      toastNotify.classList.remove('show');
    }, 2800);
  }

  if (btnCopyAudit) {
    btnCopyAudit.addEventListener('click', () => {
      const title = btnCopyAudit.getAttribute('data-title');
      const handle = btnCopyAudit.getAttribute('data-handle');
      const subs = btnCopyAudit.getAttribute('data-subs');
      const views = btnCopyAudit.getAttribute('data-views');
      const eng = btnCopyAudit.getAttribute('data-eng');
      const rev = btnCopyAudit.getAttribute('data-rev');

      const textReport = [
        `[YouTube Channel Audit] ${title} (${handle})`,
        `• Subscribers: ${subs}`,
        `• Total Lifetime Views: ${views}`,
        `• Engagement Rate: ${eng}`,
        `• Est. Monthly Revenue: ${rev}`,
        `• Source: https://analyzer.ferilsunu.com`
      ].join('\n');

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textReport)
          .then(() => showToast('Channel Audit copied to clipboard!'))
          .catch(() => showToast('Report copied!'));
      } else {
        showToast('Report copied!');
      }
    });
  }

  // Initialize Lucide icons
  function initIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initIcons);
  } else {
    initIcons();
  }

})();
