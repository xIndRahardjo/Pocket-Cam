/**
 * Modern Smartphone Camera App UI Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  const camera = new PocketCamera();

  // Elements
  const categoryDropdown = document.getElementById('category-dropdown');
  const filterSliderContainer = document.getElementById('filter-slider-container');
  const lcdFilterName = document.getElementById('lcd-filter-name');
  const lcdResIndicator = document.getElementById('lcd-res-indicator');
  const lcdStatusFps = document.getElementById('lcd-status-fps');
  const flashOverlay = document.getElementById('flash-overlay');

  // Top Bar & Quick Front Controls
  const btnOpenSettings = document.getElementById('btn-open-settings');
  const btnCloseSettings = document.getElementById('btn-close-settings');
  const settingsDrawer = document.getElementById('settings-drawer');
  const btnFlashToggle = document.getElementById('btn-flash-toggle');
  const flashIconLabel = document.getElementById('flash-icon-label');
  const btnScanlineToggle = document.getElementById('btn-scanline-toggle');
  const btnDateToggle = document.getElementById('btn-date-toggle');

  // C++ Code Panel
  const btnToggleCpp = document.getElementById('btn-toggle-cpp');
  const btnCloseCpp = document.getElementById('btn-close-cpp');
  const cppPanel = document.getElementById('cpp-exporter-panel');
  const cppActiveFilterName = document.getElementById('cpp-active-filter-name');
  const cppCodeBlock = document.getElementById('cpp-code-block');
  const btnCopyCode = document.getElementById('btn-copy-code');

  // Shutter & Camera Controls
  const btnShutter = document.getElementById('btn-shutter');
  const btnFlipCam = document.getElementById('btn-flip-cam');

  // Gallery Controls
  const btnGallery = document.getElementById('btn-gallery');
  const galleryThumbPreview = document.getElementById('gallery-thumb-preview');
  const galleryModal = document.getElementById('gallery-modal');
  const btnCloseGallery = document.getElementById('btn-close-gallery');
  const btnCloseGalleryFooter = document.getElementById('btn-close-gallery-footer');
  const btnClearGallery = document.getElementById('btn-clear-gallery');
  const galleryGrid = document.getElementById('gallery-grid');
  const galleryCount = document.getElementById('gallery-count');

  // Sliders & Settings
  const sliderGrain = document.getElementById('slider-grain');
  const sliderContrast = document.getElementById('slider-contrast');
  const sliderVignette = document.getElementById('slider-vignette');
  const sliderDither = document.getElementById('slider-dither');
  const valGrain = document.getElementById('val-grain');
  const valContrast = document.getElementById('val-contrast');
  const valVignette = document.getElementById('val-vignette');
  const valDither = document.getElementById('val-dither');

  const selectRes = document.getElementById('select-resolution');
  const selectFps = document.getElementById('select-sim-fps');
  const checkLcdLines = document.getElementById('check-lcd-lines');
  const lcdScanlinesOverlay = document.getElementById('lcd-scanline-overlay');

  // Internal State
  let capturedPhotos = [];
  let filterList = Object.keys(PocketFilters.registry);
  let activeFilterIndex = 0;

  // Web Audio Synth for Shutter Click & Beeps
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  function playBeepSound(freq = 600, duration = 0.05) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  function playShutterSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
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

  // --- POPULATE HORIZONTAL FILTER SLIDER CAROUSEL ---
  function renderFilterSlider(category) {
    filterSliderContainer.innerHTML = '';
    
    Object.entries(PocketFilters.registry).forEach(([id, filter]) => {
      if (category === 'all' || filter.category === category) {
        const pill = document.createElement('button');
        pill.className = `filter-pill ${id === camera.activeFilterId ? 'active' : ''}`;
        pill.dataset.id = id;
        pill.textContent = filter.name;

        pill.addEventListener('click', () => {
          selectFilterById(id);
          pill.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        });

        filterSliderContainer.appendChild(pill);
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

      if (categoryDropdown.value !== filterObj.category && categoryDropdown.value !== 'all') {
        categoryDropdown.value = filterObj.category;
        renderFilterSlider(filterObj.category);
      }
    }

    document.querySelectorAll('.filter-pill').forEach(pill => {
      pill.classList.toggle('active', pill.dataset.id === filterId);
    });

    updateCppExporterCode();
    playBeepSound(800, 0.04);
  }

  function updateCppExporterCode() {
    const code = ESP32Exporter.getCodeForFilter(camera.activeFilterId, camera.filterParams);
    cppCodeBlock.textContent = code;
  }

  categoryDropdown.addEventListener('change', (e) => {
    renderFilterSlider(e.target.value);
    playBeepSound(500, 0.03);
  });

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

  // --- SHUTTER & PHOTO CAPTURE ---
  function triggerShutter() {
    playShutterSound();

    if (camera.flashMode === 'on' || camera.flashMode === 'auto') {
      flashOverlay.classList.add('active');
      setTimeout(() => flashOverlay.classList.remove('active'), 250);
      camera.pulseFlashlight();
    }

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
    updateGalleryPreview();
  }

  function updateGalleryPreview() {
    galleryCount.textContent = capturedPhotos.length;
    if (capturedPhotos.length > 0) {
      galleryThumbPreview.classList.remove('empty');
      galleryThumbPreview.innerHTML = `<img src="${capturedPhotos[0].dataUrl}" alt="Thumb">`;
    } else {
      galleryThumbPreview.classList.add('empty');
      galleryThumbPreview.innerHTML = `<span>📷</span>`;
    }
  }

  btnShutter.addEventListener('click', triggerShutter);

  // Quick Front Toggle: Scanline LCD Overlay
  function toggleScanlines(enable) {
    const isScanlineOn = (enable !== undefined) ? enable : lcdScanlinesOverlay.classList.contains('hidden');
    lcdScanlinesOverlay.classList.toggle('hidden', !isScanlineOn);
    checkLcdLines.checked = isScanlineOn;
    btnScanlineToggle.classList.toggle('active', isScanlineOn);
  }

  btnScanlineToggle.addEventListener('click', () => {
    toggleScanlines();
    playBeepSound(650, 0.04);
  });

  checkLcdLines.addEventListener('change', (e) => {
    toggleScanlines(e.target.checked);
  });

  // Quick Front Toggle: Digicam Retro Date Stamp
  btnDateToggle.addEventListener('click', () => {
    const isDateOn = camera.toggleDateStamp();
    btnDateToggle.classList.toggle('active', isDateOn);
    playBeepSound(720, 0.04);
  });

  // Flash LED Toggle
  btnFlashToggle.addEventListener('click', async () => {
    const mode = await camera.toggleFlash();
    playBeepSound(700, 0.05);
    if (mode === 'on') {
      flashIconLabel.textContent = '⚡ ON';
      btnFlashToggle.style.color = '#f5a623';
    } else if (mode === 'auto') {
      flashIconLabel.textContent = '⚡ A';
      btnFlashToggle.style.color = '#00e676';
    } else {
      flashIconLabel.textContent = '⚡';
      btnFlashToggle.style.color = '#ffffff';
    }
  });

  // Camera Flip Button
  btnFlipCam.addEventListener('click', async () => {
    await camera.toggleFacingMode();
    playBeepSound(750, 0.06);
  });

  // Settings Drawer Event Handlers
  btnOpenSettings.addEventListener('click', () => {
    settingsDrawer.classList.remove('hidden');
  });

  btnCloseSettings.addEventListener('click', () => {
    settingsDrawer.classList.add('hidden');
  });

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

  // Side Panel C++ Exporter
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

  // Modal Gallery
  function toggleGalleryModal() {
    galleryModal.classList.toggle('hidden');
    if (!galleryModal.classList.contains('hidden')) {
      renderGallery();
    }
  }

  function renderGallery() {
    if (capturedPhotos.length === 0) {
      galleryGrid.innerHTML = '<p class="empty-msg">Belum ada foto yang diambil. Klik tombol Shutter putih untuk jepret foto!</p>';
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
        updateGalleryPreview();
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
      updateGalleryPreview();
      renderGallery();
    }
  });

  // Initial Setup
  renderFilterSlider('fujifilm');
  selectFilterById('fuji_classic_chrome');
  syncParams();
  camera.startWebcam();
});
