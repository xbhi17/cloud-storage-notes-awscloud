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
  const showModalParam = urlParams.get('show_modal');

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

  // =========================================================================
  // 8. UPLOAD DROPZONE & CLIENT VALIDATION & PROGRESS BAR
  // =========================================================================
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('modalFileInput');
  const dropzonePrompt = document.querySelector('.dropzone-prompt');
  const filePreview = document.getElementById('dropzoneFilePreview');
  const fileNameDisplay = document.getElementById('dropzoneFileName');
  const fileSizeDisplay = document.getElementById('dropzoneFileSize');
  const removeFileBtn = document.getElementById('dropzoneRemoveFile');
  const errorNotice = document.getElementById('uploadErrorNotice');
  const errorText = document.getElementById('uploadErrorText');
  const uploadForm = document.getElementById('uploadForm');
  const progressWrapper = document.getElementById('uploadProgressWrapper');
  const progressBar = document.getElementById('uploadProgressBar');
  const progressPercent = document.getElementById('uploadProgressPercent');
  const progressStatus = document.getElementById('uploadProgressStatus');
  const uploadSubmitBtn = document.getElementById('uploadSubmitBtn');

  // Allowed extensions mirroring server rules (Config.ALLOWED_EXTENSIONS)
  const allowedExtensions = new Set([
    'pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'md', 'csv', 'xlsx', 'xls', 'pptx', 'ppt',
    'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico',
    'zip', 'tar', 'gz', 'rar', '7z',
    'py', 'js', 'html', 'css', 'json', 'ts', 'java', 'cpp', 'c', 'sql', 'sh'
  ]);
  const MAX_FILE_SIZE = 16 * 1024 * 1024; // 16 MB

  const showError = (msg) => {
    if (errorNotice && errorText) {
      errorText.textContent = msg;
      errorNotice.classList.remove('d-none');
    }
  };

  const clearError = () => {
    if (errorNotice) {
      errorNotice.classList.add('d-none');
    }
  };

  const validateFile = (file) => {
    if (!file) return false;
    clearError();

    // Size check
    if (file.size > MAX_FILE_SIZE) {
      showError(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds 16 MB maximum limit.`);
      return false;
    }

    // Extension check
    const ext = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : '';
    if (!allowedExtensions.has(ext)) {
      showError(`Unsupported file extension ".${ext || 'unknown'}". Allowed: PDF, Docs, Code, Images, Archives.`);
      return false;
    }

    return true;
  };

  const handleSelectedFile = (file) => {
    if (!validateFile(file)) {
      if (fileInput) fileInput.value = '';
      if (filePreview) filePreview.classList.add('d-none');
      if (dropzonePrompt) dropzonePrompt.classList.remove('d-none');
      return;
    }

    if (fileNameDisplay) fileNameDisplay.textContent = file.name;
    if (fileSizeDisplay) fileSizeDisplay.textContent = (file.size / 1024).toFixed(1) + ' KB';
    if (dropzonePrompt) dropzonePrompt.classList.add('d-none');
    if (filePreview) {
      filePreview.classList.remove('d-none');
      filePreview.classList.add('d-flex');
    }
  };

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleSelectedFile(e.target.files[0]);
      }
    });
  }

  if (dropzone) {
    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files && files.length > 0) {
        if (fileInput) {
          fileInput.files = files; // Sync with file input
        }
        handleSelectedFile(files[0]);
      }
    });
  }

  if (removeFileBtn) {
    removeFileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (fileInput) fileInput.value = '';
      if (filePreview) {
        filePreview.classList.add('d-none');
        filePreview.classList.remove('d-flex');
      }
      if (dropzonePrompt) dropzonePrompt.classList.remove('d-none');
      clearError();
    });
  }

  // Upload Form Submission with XMLHttpRequest Progress Bar
  if (uploadForm) {
    uploadForm.addEventListener('submit', (e) => {
      const file = fileInput && fileInput.files && fileInput.files[0];
      if (!validateFile(file)) {
        e.preventDefault();
        return;
      }

      // If browser supports XMLHttpRequest upload, submit via AJAX to show progress bar
      if (window.XMLHttpRequest && file) {
        e.preventDefault();
        const formData = new FormData(uploadForm);
        const xhr = new XMLHttpRequest();

        if (progressWrapper) progressWrapper.classList.remove('d-none');
        if (uploadSubmitBtn) {
          uploadSubmitBtn.disabled = true;
          uploadSubmitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1" role="status"></span> Uploading...`;
        }

        xhr.upload.addEventListener('progress', (ev) => {
          if (ev.lengthComputable) {
            const percent = Math.round((ev.loaded / ev.total) * 100);
            if (progressBar) progressBar.style.width = `${percent}%`;
            if (progressPercent) progressPercent.textContent = `${percent}%`;
          }
        });

        xhr.addEventListener('load', () => {
          if (progressStatus) progressStatus.textContent = 'Uploaded! Processing...';
          // Reload page to display flash messages and updated file explorer
          window.location.reload();
        });

        xhr.addEventListener('error', () => {
          showError('Upload failed. Please check network connection.');
          if (uploadSubmitBtn) {
            uploadSubmitBtn.disabled = false;
            uploadSubmitBtn.innerHTML = `<span>Upload File</span>`;
          }
        });

        xhr.open('POST', uploadForm.action);
        xhr.send(formData);
      }
    });
  }

  // =========================================================================
  // 9. DOWNLOAD: PREPARING TOAST STATE
  // =========================================================================
  const downloadToastEl = document.getElementById('downloadToast');
  let downloadToastInstance = null;
  if (downloadToastEl && window.bootstrap && window.bootstrap.Toast) {
    downloadToastInstance = new window.bootstrap.Toast(downloadToastEl, { delay: 3500 });
  }

  document.querySelectorAll('.btn-download-action').forEach(btn => {
    btn.addEventListener('click', () => {
      if (downloadToastInstance) {
        downloadToastInstance.show();
      }
    });
  });

  // =========================================================================
  // 10. DELETE: CONFIRMATION MODAL WITH FOCUS TRAP & FOCUS RETURN
  // =========================================================================
  const deleteModalEl = document.getElementById('deleteConfirmModal');
  const deleteForm = document.getElementById('deleteForm');
  const deleteFileNameSpan = document.getElementById('deleteModalFileName');
  const deleteCancelBtn = document.getElementById('deleteModalCancelBtn');
  let deleteModalInstance = null;
  let lastActiveTrigger = null;

  if (deleteModalEl && window.bootstrap && window.bootstrap.Modal) {
    deleteModalInstance = new window.bootstrap.Modal(deleteModalEl);

    // Focus Cancel button by default when opened
    deleteModalEl.addEventListener('shown.bs.modal', () => {
      if (deleteCancelBtn) {
        deleteCancelBtn.focus();
      }
    });

    // Return focus to triggering button when closed
    deleteModalEl.addEventListener('hidden.bs.modal', () => {
      if (lastActiveTrigger && typeof lastActiveTrigger.focus === 'function') {
        lastActiveTrigger.focus();
      }
    });
  }

  document.querySelectorAll('.btn-delete-trigger').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      lastActiveTrigger = btn;
      const filename = btn.getAttribute('data-filename');

      if (deleteFileNameSpan) deleteFileNameDisplay(filename);
      if (deleteForm) {
        // Set form action to /delete/<path:filename>
        deleteForm.action = `/delete/${encodeURIComponent(filename)}`;
      }

      if (deleteModalInstance) {
        deleteModalInstance.show();
      }
    });
  });

  const deleteFileNameDisplay = (fname) => {
    if (deleteFileNameSpan) {
      deleteFileNameSpan.textContent = fname;
    }
  };

  // Support ?show_modal=upload or ?show_modal=delete for automated screenshot testing
  if (showModalParam === 'upload') {
    setTimeout(() => {
      const uploadModalEl = document.getElementById('uploadModal');
      if (uploadModalEl && window.bootstrap && window.bootstrap.Modal) {
        const uploadModal = window.bootstrap.Modal.getOrCreateInstance(uploadModalEl);
        uploadModal.show();
      }
    }, 200);
  } else if (showModalParam === 'delete') {
    setTimeout(() => {
      deleteFileNameDisplay('CS601_Distributed_Systems.pdf');
      if (deleteForm) {
        deleteForm.action = '/delete/CS601_Distributed_Systems.pdf';
      }
      if (deleteModalEl && window.bootstrap && window.bootstrap.Modal) {
        const deleteModal = window.bootstrap.Modal.getOrCreateInstance(deleteModalEl);
        deleteModal.show();
      }
    }, 200);
  }
});


