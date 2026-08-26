/**
 * Pocket Camera UI Controller & Interactivity
 */

document.addEventListener('DOMContentLoaded', () => {
  const camera = new PocketCamera();

  // Elements
  const filterContainer = document.getElementById('filter-options-container');
  const tabBtns = document.querySelectorAll('.tab-btn');
  const lcdFilterName = document.getElementById('lcd-filter-name');
  const lcdResIndicator = document.getElementById('lcd-res-indicator');
  const lcdSdStatus = document.getElementById('lcd-sd-status');
  
  // Sliders
  const sliderGrain = document.getElementById('slider-grain');
  const sliderContrast = document.getElementById('slider-contrast');
  const sliderVignette = document.getElementById('slider-vignette');
  const sliderDither = document.getElementById('slider-dither');
  
  const valGrain = document.getElementById('val-grain');
  const valContrast = document.getElementById('val-contrast');
  const valVignette = document.getElementById('val-vignette');
  const valDither = document.getElementById('val-dither');

  // Hardware Controls
  const btnShutter = document.getElementById('btn-shutter');
  const btnGallery = document.getElementById('btn-gallery');
  const btnSourceToggle = document.getElementById('btn-source-toggle');
  const btnDpadLeft = document.getElementById('btn-dpad-left');
  const btnDpadRight = document.getElementById('btn-dpad-right');
  const btnDpadUp = document.getElementById('btn-dpad-up');
  const btnDpadDown = document.getElementById('btn-dpad-down');

  // Settings
  const selectRes = document.getElementById('select-resolution');
  const selectFps = document.getElementById('select-sim-fps');
  const checkLcdLines = document.getElementById('check-lcd-lines');
  const lcdScanlinesOverlay = document.getElementById('lcd-scanline-overlay');
  const flashOverlay = document.getElementById('flash-overlay');

  // Side Panel C++ Exporter
  const btnToggleCpp = document.getElementById('btn-toggle-cpp');
  const btnCloseCpp = document.getElementById('btn-close-cpp');
  const cppPanel = document.getElementById('cpp-exporter-panel');
  const cppActiveFilterName = document.getElementById('cpp-active-filter-name');
  const cppCodeBlock = document.getElementById('cpp-code-block');
  const btnCopyCode = document.getElementById('btn-copy-code');

  // Gallery Modal
  const galleryModal = document.getElementById('gallery-modal');
  const btnCloseGallery = document.getElementById('btn-close-gallery');
  const btnCloseGalleryFooter = document.getElementById('btn-close-gallery-footer');
  const btnClearGallery = document.getElementById('btn-clear-gallery');
  const galleryGrid = document.getElementById('gallery-grid');
  const galleryCount = document.getElementById('gallery-count');

  // Internal State
  let capturedPhotos = [];
  let currentCategory = 'fujifilm';
  let filterList = Object.keys(PocketFilters.registry);
  let activeFilterIndex = 0;

  // Initialize Web Audio API Synth for Beeps and Shutter Click
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  function playBeepSound(freq = 600, duration = 0.05) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  function playShutterSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    // Mechanical shutter noise synthesis
    const bufferSize = audioCtx.sampleRate * 0.15;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const whiteNoise = audioCtx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000, audioCtx.currentTime);
    filter.Q.setValueAtTime(3, audioCtx.currentTime);

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    whiteNoise.start();
  }

  // --- RENDER FILTER OPTIONS CARDS ---
  function renderFilterOptions(category) {
    filterContainer.innerHTML = '';
    
    Object.entries(PocketFilters.registry).forEach(([id, filter]) => {
      if (category === 'all' || filter.category === category) {
        const card = document.createElement('div');
        card.className = `filter-card ${id === camera.activeFilterId ? 'active' : ''}`;
        card.dataset.id = id;
        
        card.innerHTML = `
          <div class="filter-title">${filter.name}</div>
          <div class="filter-desc">${filter.description}</div>
        `;

        card.addEventListener('click', () => {
          selectFilterById(id);
        });

        filterContainer.appendChild(card);
      }
    });
  }

  function selectFilterById(filterId) {
    camera.setFilter(filterId);
    activeFilterIndex = filterList.indexOf(filterId);
    
    const filterObj = PocketFilters.registry[filterId];
    if (filterObj) {
      lcdFilterName.textContent = filterObj.name.toUpperCase();
      cppActiveFilterName.textContent = filterObj.name;
    }

    // Update active highlight in UI
    document.querySelectorAll('.filter-card').forEach(card => {
      card.classList.toggle('active', card.dataset.id === filterId);
    });

    updateCppExporterCode();
    playBeepSound(800, 0.04);
  }

  function updateCppExporterCode() {
    const code = ESP32Exporter.getCodeForFilter(camera.activeFilterId, camera.filterParams);
    cppCodeBlock.textContent = code;
  }

  // --- TAB BUTTON HANDLERS ---
  tabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      tabBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentCategory = e.target.dataset.category;
      renderFilterOptions(currentCategory);
      playBeepSound(500, 0.03);
    });
  });

  // --- SLIDERS EVENT LISTENERS ---
  function syncParams() {
    const params = {
      grain: parseInt(sliderGrain.value, 10),
      contrast: parseInt(sliderContrast.value, 10),
      vignette: parseInt(sliderVignette.value, 10),
      dither: parseInt(sliderDither.value, 10)
    };
    valGrain.textContent = `${params.grain}%`;
    valContrast.textContent = `${params.contrast}%`;
    valVignette.textContent = `${params.vignette}%`;
    valDither.textContent = `${params.dither}%`;
    
    camera.updateParams(params);
    updateCppExporterCode();
  }

  [sliderGrain, sliderContrast, sliderVignette, sliderDither].forEach(s => {
    s.addEventListener('input', syncParams);
  });

  // --- HARDWARE BUTTON HANDLERS ---
  function triggerShutter() {
    playShutterSound();

    // Trigger visual flash
    flashOverlay.classList.add('active');
    setTimeout(() => flashOverlay.classList.remove('active'), 100);

    // Capture snapshot
    const dataUrl = camera.captureSnapshot();
    const activeFilterObj = PocketFilters.registry[camera.activeFilterId];
    const timestamp = new Date().toLocaleTimeString();

    const photo = {
      id: Date.now(),
      dataUrl,
      filterName: activeFilterObj ? activeFilterObj.name : 'Retro',
      res: `${camera.targetWidth}x${camera.targetHeight}`,
      time: timestamp
    };

    capturedPhotos.unshift(photo);
    updateSdStatus();
  }

  function updateSdStatus() {
    lcdSdStatus.textContent = `SD: OK [${capturedPhotos.length}/99]`;
    galleryCount.textContent = capturedPhotos.length;
  }

  btnShutter.addEventListener('click', triggerShutter);

  btnSourceToggle.addEventListener('click', () => {
    const src = camera.toggleSource();
    btnSourceToggle.classList.toggle('pressed');
    setTimeout(() => btnSourceToggle.classList.remove('pressed'), 200);
    playBeepSound(700, 0.05);
  });

  // D-Pad Filter Cycle
  function nextFilter() {
    activeFilterIndex = (activeFilterIndex + 1) % filterList.length;
    selectFilterById(filterList[activeFilterIndex]);
  }

  function prevFilter() {
    activeFilterIndex = (activeFilterIndex - 1 + filterList.length) % filterList.length;
    selectFilterById(filterList[activeFilterIndex]);
  }

  btnDpadRight.addEventListener('click', nextFilter);
  btnDpadLeft.addEventListener('click', prevFilter);
  btnDpadUp.addEventListener('click', prevFilter);
  btnDpadDown.addEventListener('click', nextFilter);

  // --- KEYBOARD SHORTCUTS ---
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

    if (e.code === 'Space') {
      e.preventDefault();
      triggerShutter();
    } else if (e.code === 'ArrowRight' || e.code === 'ArrowDown') {
      e.preventDefault();
      nextFilter();
    } else if (e.code === 'ArrowLeft' || e.code === 'ArrowUp') {
      e.preventDefault();
      prevFilter();
    } else if (e.key.toLowerCase() === 'g') {
      toggleGalleryModal();
    } else if (e.key.toLowerCase() === 'c') {
      cppPanel.classList.toggle('hidden');
    }
  });

  // --- SETTINGS CONTROLS ---
  selectRes.addEventListener('change', (e) => {
    const [w, h] = e.target.value.split('x').map(Number);
    camera.setResolution(w, h);
    lcdResIndicator.textContent = `${w}x${h}`;
    playBeepSound(650, 0.04);
  });

  selectFps.addEventListener('change', (e) => {
    camera.setTargetFps(e.target.value);
    playBeepSound(650, 0.04);
  });

  checkLcdLines.addEventListener('change', (e) => {
    lcdScanlinesOverlay.classList.toggle('hidden', !e.target.checked);
  });

  // --- SIDE PANEL C++ EXPORTER ---
  btnToggleCpp.addEventListener('click', () => {
    cppPanel.classList.toggle('hidden');
  });

  btnCloseCpp.addEventListener('click', () => {
    cppPanel.classList.add('hidden');
  });

  btnCopyCode.addEventListener('click', () => {
    navigator.clipboard.writeText(cppCodeBlock.textContent);
    btnCopyCode.textContent = 'Copied!';
    setTimeout(() => btnCopyCode.textContent = 'Copy Code', 2000);
  });

  // --- GALLERY MODAL HANDLERS ---
  function toggleGalleryModal() {
    galleryModal.classList.toggle('hidden');
    if (!galleryModal.classList.contains('hidden')) {
      renderGallery();
    }
  }

  function renderGallery() {
    if (capturedPhotos.length === 0) {
      galleryGrid.innerHTML = '<p class="empty-msg">Belum ada foto yang diambil. Gunakan tombol Shutter untuk mengambil foto!</p>';
      return;
    }

    galleryGrid.innerHTML = '';
    capturedPhotos.forEach(photo => {
      const item = document.createElement('div');
      item.className = 'gallery-item';
      item.innerHTML = `
        <img src="${photo.dataUrl}" alt="Pocket Photo">
        <div class="gallery-info">
          <span class="filter-tag">${photo.filterName}</span>
          <small>${photo.res} • ${photo.time}</small>
        </div>
        <div class="gallery-actions">
          <a href="${photo.dataUrl}" download="pocket_cam_${photo.id}.png">Download</a>
          <button class="del-btn" data-id="${photo.id}">Hapus</button>
        </div>
      `;

      item.querySelector('.del-btn').addEventListener('click', () => {
        capturedPhotos = capturedPhotos.filter(p => p.id !== photo.id);
        updateSdStatus();
        renderGallery();
      });

      galleryGrid.appendChild(item);
    });
  }

  btnGallery.addEventListener('click', toggleGalleryModal);
  btnCloseGallery.addEventListener('click', toggleGalleryModal);
  btnCloseGalleryFooter.addEventListener('click', toggleGalleryModal);

  btnClearGallery.addEventListener('click', () => {
    if (confirm('Apakah Anda yakin ingin menghapus semua foto di galeri?')) {
      capturedPhotos = [];
      updateSdStatus();
      renderGallery();
    }
  });

  // --- INITIAL START ---
  renderFilterOptions(currentCategory);
  selectFilterById('fuji_classic_chrome');
  syncParams();
  camera.startWebcam();
});
