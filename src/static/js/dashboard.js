/**
 * Dashboard Shell Vanilla JS
 * - "/" keyboard shortcut to focus search input
 * - Bootstrap tooltip initialization
 * - View toggle handler
 */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Bootstrap Tooltips if available
  if (window.bootstrap && window.bootstrap.Tooltip) {
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    [...tooltipTriggerList].map(tooltipTriggerEl => new window.bootstrap.Tooltip(tooltipTriggerEl, {
      boundary: document.body
    }));
  }

  // 2. '/' shortcut to focus search input
  const searchInput = document.getElementById('global-search-input');
  if (searchInput) {
    window.addEventListener('keydown', (e) => {
      // Don't trigger if already focusing an input or textarea
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }
      if (e.key === '/') {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      }
    });
  }

  // 3. View toggle support (list vs grid)
  const viewToggleBtns = document.querySelectorAll('[data-view-toggle]');
  viewToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      viewToggleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const targetView = btn.getAttribute('data-view-toggle');
      document.dispatchEvent(new CustomEvent('viewchange', { detail: { view: targetView } }));
    });
  });
});
