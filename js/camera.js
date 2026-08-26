/**
 * Pocket Camera Stream & Render Controller
 */

class PocketCamera {
  constructor() {
    this.canvas = document.getElementById('viewfinder-canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    this.video = document.getElementById('webcam-video');
    
    this.currentSource = 'webcam'; // 'webcam' or 'sample'
    this.sampleImg = null;
    
    this.activeFilterId = 'fuji_classic_chrome';
    this.filterParams = {
      grain: 15,
      contrast: 100,
      vignette: 20,
      dither: 50
    };

    this.targetWidth = 320;
    this.targetHeight = 240;
    this.simFps = 30;

    this.isStreaming = false;
    this.lastFrameTime = 0;
    this.actualFps = 30;
    this.frameCount = 0;
    this.fpsTimer = performance.now();

    this.initSampleImage();
  }

  initSampleImage() {
    // Generate an animated synthetic retro test pattern canvas as sample source
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 640;
    sampleCanvas.height = 480;
    const sCtx = sampleCanvas.getContext('2d');

    // Draw gradient background
    const grad = sCtx.createLinearGradient(0, 0, 640, 480);
    grad.addColorStop(0, '#1e3c72');
    grad.addColorStop(0.5, '#2a5298');
    grad.addColorStop(1, '#f12711');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 640, 480);

    // Draw retro shapes & text
    sCtx.fillStyle = '#f5a623';
    sCtx.beginPath();
    sCtx.arc(320, 240, 120, 0, Math.PI * 2);
    sCtx.fill();

    sCtx.fillStyle = '#ffffff';
    sCtx.font = 'bold 36px sans-serif';
    sCtx.textAlign = 'center';
    sCtx.fillText('POCKET-CAM TEST', 320, 230);
    sCtx.font = '20px sans-serif';
    sCtx.fillText('ESP32-CAM Simulator', 320, 270);

    this.sampleImg = new Image();
    this.sampleImg.src = sampleCanvas.toDataURL();
  }

  async startWebcam() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false
      });
      this.video.srcObject = stream;
      await this.video.play();
      this.currentSource = 'webcam';
      this.isStreaming = true;
      this.startRenderLoop();
      return true;
    } catch (err) {
      console.warn('Webcam tidak tersedia / ditolak. Berpindah ke Sample Source:', err);
      this.currentSource = 'sample';
      this.isStreaming = true;
      this.startRenderLoop();
      return false;
    }
  }

  toggleSource() {
    if (this.currentSource === 'webcam') {
      this.currentSource = 'sample';
    } else {
      this.startWebcam();
    }
    return this.currentSource;
  }

  setResolution(width, height) {
    this.targetWidth = width;
    this.targetHeight = height;
    this.canvas.width = width;
    this.canvas.height = height;
  }

  setTargetFps(fps) {
    this.simFps = parseInt(fps, 10);
  }

  setFilter(filterId) {
    if (PocketFilters.registry[filterId]) {
      this.activeFilterId = filterId;
    }
  }

  updateParams(newParams) {
    this.filterParams = { ...this.filterParams, ...newParams };
  }

  startRenderLoop() {
    const loop = (timestamp) => {
      if (!this.isStreaming) return;

      const elapsed = timestamp - this.lastFrameTime;
      const interval = 1000 / this.simFps;

      if (elapsed >= interval) {
        this.lastFrameTime = timestamp - (elapsed % interval);
        this.renderFrame();

        // Calculate actual FPS
        this.frameCount++;
        if (timestamp - this.fpsTimer >= 1000) {
          this.actualFps = this.frameCount;
          this.frameCount = 0;
          this.fpsTimer = timestamp;
          
          const fpsElem = document.getElementById('lcd-status-fps');
          if (fpsElem) fpsElem.textContent = `${this.actualFps} FPS`;
        }
      }

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  renderFrame() {
    const w = this.targetWidth;
    const h = this.targetHeight;

    // Clear canvas
    this.ctx.clearRect(0, 0, w, h);

    // Draw raw frame source onto canvas
    if (this.currentSource === 'webcam' && this.video.readyState >= 2) {
      // Draw mirrored webcam
      this.ctx.save();
      this.ctx.scale(-1, 1);
      this.ctx.drawImage(this.video, -w, 0, w, h);
      this.ctx.restore();
    } else if (this.sampleImg && this.sampleImg.complete) {
      this.ctx.drawImage(this.sampleImg, 0, 0, w, h);
    } else {
      // Fallback color box
      this.ctx.fillStyle = '#111';
      this.ctx.fillRect(0, 0, w, h);
      this.ctx.fillStyle = '#f5a623';
      this.ctx.fillText('NO CAMERA STREAM', 20, h / 2);
      return;
    }

    // Apply Active Filter Engine
    const filterObj = PocketFilters.registry[this.activeFilterId];
    if (filterObj && filterObj.apply) {
      filterObj.apply(this.ctx, w, h, this.filterParams);
    }
  }

  captureSnapshot() {
    // Return data URL of current canvas view
    return this.canvas.toDataURL('image/png');
  }
}
