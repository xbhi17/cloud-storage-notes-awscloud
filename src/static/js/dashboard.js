/**
 * Dashboard Shell & Data Display Vanilla JS
 * - "/" keyboard shortcut to focus search input
 * - Instant client-side search across files
 * - Category filter chips (All, Documents, Images, Other) with live counts
 * - Grid / List view switching with localStorage persistence
 * - Table header column sorting and topbar sort dropdown synchronization
 * - Dynamic empty states and "Clear filters" action
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Bootstrap Tooltips
  const initTooltips = () => {
    if (window.bootstrap && window.bootstrap.Tooltip) {
      const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
      [...tooltipTriggerList].map(tooltipTriggerEl => new window.bootstrap.Tooltip(tooltipTriggerEl, {
        boundary: document.body
      }));
    }
  };
  initTooltips();

  // 2. State & Cache
  const urlParams = new URLSearchParams(window.location.search);
  const initialView = urlParams.get('view') || localStorage.getItem('notes_dashboard_view') || 'list';

  const state = {
    view: initialView,
    search: '',
    category: 'all',
    sort: 'date-desc'
  };

  const searchInput = document.getElementById('global-search-input');
  const sortSelect = document.getElementById('global-sort-select');
  const listViewContainer = document.getElementById('list-view-container');
  const gridViewContainer = document.getElementById('grid-view-container');
  const viewToggleBtns = document.querySelectorAll('[data-view-toggle]');
  const filterChips = document.querySelectorAll('[data-filter-category]');
  const noResultsState = document.getElementById('no-search-results');
  const clearFiltersBtn = document.getElementById('clear-filters-btn');
  const visibleCountBadge = document.getElementById('visible-count-badge');

  const listRows = Array.from(document.querySelectorAll('.file-item-row'));
  const gridCards = Array.from(document.querySelectorAll('.file-item-card'));

  // 3. View switching & persistence
  const setView = (viewMode) => {
    state.view = viewMode;
    localStorage.setItem('notes_dashboard_view', viewMode);

    viewToggleBtns.forEach(btn => {
      if (btn.getAttribute('data-view-toggle') === viewMode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    if (viewMode === 'grid') {
      if (listViewContainer) listViewContainer.classList.add('d-none');
      if (gridViewContainer) gridViewContainer.classList.remove('d-none');
    } else {
      if (gridViewContainer) gridViewContainer.classList.add('d-none');
      if (listViewContainer) listViewContainer.classList.remove('d-none');
    }
  };

  // Set initial view
  setView(state.view);

  viewToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const viewMode = btn.getAttribute('data-view-toggle');
      setView(viewMode);
    });
  });

  // 4. "/" keyboard shortcut to focus search input
  if (searchInput) {
    window.addEventListener('keydown', (e) => {
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

    // Instant client-side search
    searchInput.addEventListener('input', (e) => {
      state.search = e.target.value.trim().toLowerCase();
      applyFilters();
    });

    // Don't submit GET form on enter if search input is focused, unless user presses Enter
    searchInput.form?.addEventListener('submit', (e) => {
      e.preventDefault(); // Client-side search is instantaneous
    });
  }

  // 5. Category filter chips
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.category = chip.getAttribute('data-filter-category');
      applyFilters();
    });
  });

  // 6. Filtering & Fast visibility toggling
  const applyFilters = () => {
    let visibleCount = 0;

    // Filter list rows
    listRows.forEach(row => {
      const key = row.getAttribute('data-key') || '';
      const category = row.getAttribute('data-category') || 'other';

      const matchesSearch = !state.search || key.includes(state.search);
      const matchesCategory = state.category === 'all' || category === state.category;

      if (matchesSearch && matchesCategory) {
        row.classList.remove('is-filtered-out');
        visibleCount++;
      } else {
        row.classList.add('is-filtered-out');
      }
    });

    // Filter grid cards
    gridCards.forEach(card => {
      const key = card.getAttribute('data-key') || '';
      const category = card.getAttribute('data-category') || 'other';

      const matchesSearch = !state.search || key.includes(state.search);
      const matchesCategory = state.category === 'all' || category === state.category;

      if (matchesSearch && matchesCategory) {
        card.classList.remove('is-filtered-out');
      } else {
        card.classList.add('is-filtered-out');
      }
    });

    // Update UI counters & empty states
    if (visibleCountBadge) {
      visibleCountBadge.textContent = `${visibleCount} file${visibleCount !== 1 ? 's' : ''}`;
    }

    if (noResultsState) {
      if (visibleCount === 0 && (listRows.length > 0)) {
        noResultsState.classList.remove('d-none');
        if (listViewContainer) listViewContainer.classList.add('d-none');
        if (gridViewContainer) gridViewContainer.classList.add('d-none');
      } else {
        noResultsState.classList.add('d-none');
        setView(state.view); // Restore current active view
      }
    }
  };

  // Clear filters
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
      state.search = '';
      state.category = 'all';
      if (searchInput) searchInput.value = '';
      filterChips.forEach(c => {
        if (c.getAttribute('data-filter-category') === 'all') {
          c.classList.add('active');
        } else {
          c.classList.remove('active');
        }
      });
      applyFilters();
    });
  }

  // 7. Sorting Functionality
  const sortFiles = (sortKey) => {
    state.sort = sortKey;
    if (sortSelect && sortSelect.value !== sortKey) {
      sortSelect.value = sortKey;
    }

    const [field, direction] = sortKey.split('-');
    const multiplier = direction === 'asc' ? 1 : -1;

    const compareFn = (a, b) => {
      let valA, valB;
      if (field === 'name') {
        valA = a.getAttribute('data-key');
        valB = b.getAttribute('data-key');
        return valA.localeCompare(valB) * multiplier;
      } else if (field === 'type') {
        valA = a.getAttribute('data-type');
        valB = b.getAttribute('data-type');
        return valA.localeCompare(valB) * multiplier;
      } else if (field === 'size') {
        valA = parseFloat(a.getAttribute('data-size') || 0);
        valB = parseFloat(b.getAttribute('data-size') || 0);
        return (valA - valB) * multiplier;
      } else if (field === 'date') {
        valA = a.getAttribute('data-modified');
        valB = b.getAttribute('data-modified');
        return valA.localeCompare(valB) * multiplier;
      }
      return 0;
    };

    // Sort list tbody
    const tbody = document.querySelector('#file-table-body');
    if (tbody) {
      const sortedRows = [...listRows].sort(compareFn);
      sortedRows.forEach(row => tbody.appendChild(row));
    }

    // Sort grid row
    const gridRow = document.querySelector('#file-grid-row');
    if (gridRow) {
      const sortedCards = [...gridCards].sort(compareFn);
      sortedCards.forEach(card => gridRow.appendChild(card));
    }

    // Update table header sorted indicators
    document.querySelectorAll('th.sortable').forEach(th => {
      const thField = th.getAttribute('data-sort-field');
      const sortIcon = th.querySelector('.sort-indicator');
      if (thField === field) {
        th.classList.add('sorted');
        if (sortIcon) {
          sortIcon.textContent = direction === 'asc' ? ' ↑' : ' ↓';
        }
      } else {
        th.classList.remove('sorted');
        if (sortIcon) sortIcon.textContent = '';
      }
    });
  };

  // Topbar sort select change
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      sortFiles(e.target.value);
    });
  }

  // Clickable table header column sorting
  document.querySelectorAll('th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const field = th.getAttribute('data-sort-field');
      const currentSort = state.sort;
      let newDirection = 'asc';
      if (currentSort.startsWith(field)) {
        newDirection = currentSort.endsWith('asc') ? 'desc' : 'asc';
      }
      sortFiles(`${field}-${newDirection}`);
    });
  });

  // Initial sort
  sortFiles(state.sort);
});
