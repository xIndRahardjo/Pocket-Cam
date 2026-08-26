/**
 * Pocket Camera Stream & Render Controller
 */

class PocketCamera {
  constructor() {
    this.canvas = document.getElementById('viewfinder-canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    this.video = document.getElementById('webcam-video');
    
    this.currentSource = 'webcam'; // 'webcam' or 'sample'
    this.facingMode = 'user'; // 'user' (front) or 'environment' (back)
    this.mediaStream = null;
    this.sampleImg = null;
    this.flashMode = 'off'; // 'off', 'on', 'auto'
    
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
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 640;
    sampleCanvas.height = 480;
    const sCtx = sampleCanvas.getContext('2d');

    const grad = sCtx.createLinearGradient(0, 0, 640, 480);
    grad.addColorStop(0, '#1e3c72');
    grad.addColorStop(0.5, '#2a5298');
    grad.addColorStop(1, '#f12711');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 640, 480);

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

  async stopMediaTracks() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
  }

  async startWebcam(desiredFacingMode = null) {
    if (desiredFacingMode) {
      this.facingMode = desiredFacingMode;
    }

    await this.stopMediaTracks();

    try {
      let constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: { ideal: this.facingMode }
        },
        audio: false
      };

      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        console.warn(`Gagal membuka kamera mode ${this.facingMode}, mencoba fallback kamera standar:`, err);
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      this.video.srcObject = this.mediaStream;
      await this.video.play();
      this.currentSource = 'webcam';
      this.isStreaming = true;
      
      // Auto apply torch/flash to the new stream if enabled
      await this.applyTorchState();

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

  async toggleFacingMode() {
    this.facingMode = (this.facingMode === 'user') ? 'environment' : 'user';
    await this.startWebcam(this.facingMode);
    return this.facingMode;
  }

  async toggleFlash() {
    const modes = ['off', 'on', 'auto'];
    const nextIdx = (modes.indexOf(this.flashMode) + 1) % modes.length;
    this.flashMode = modes[nextIdx];
    await this.applyTorchState();
    return this.flashMode;
  }

  async applyTorchState(forceTorchState = null) {
    if (!this.mediaStream) return;
    const track = this.mediaStream.getVideoTracks()[0];
    if (!track) return;

    const shouldEnable = (forceTorchState !== null) ? forceTorchState : (this.flashMode === 'on');

    try {
      const capabilities = (typeof track.getCapabilities === 'function') ? track.getCapabilities() : {};
      const settings = (typeof track.getSettings === 'function') ? track.getSettings() : {};

      if (capabilities.torch || 'torch' in settings || 'torch' in track.getConstraints()) {
        await track.applyConstraints({
          advanced: [{ torch: shouldEnable }]
        });
      }
    } catch (err) {
      console.warn('Tidak dapat mengubah status torch/senter HP:', err);
    }
  }

  async pulseFlashlight() {
    // Pulse physical flash for 350ms on shutter press (works on Android back camera)
    if (!this.mediaStream) return;
    const track = this.mediaStream.getVideoTracks()[0];
    if (!track) return;

    try {
      await track.applyConstraints({ advanced: [{ torch: true }] });
      setTimeout(async () => {
        if (this.flashMode !== 'on') {
          await track.applyConstraints({ advanced: [{ torch: false }] }).catch(() => {});
        }
      }, 350);
    } catch (e) {
      // Torch constraint not supported on this specific browser/facing mode
    }
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

    this.ctx.clearRect(0, 0, w, h);

    if (this.currentSource === 'webcam' && this.video.readyState >= 2) {
      const vw = this.video.videoWidth;
      const vh = this.video.videoHeight;
      
      // Calculate exact aspect ratio cropping to match canvas pixel ratio
      let sx = 0, sy = 0, sw = vw, sh = vh;
      const targetRatio = w / h;
      const videoRatio = vw / vh;
      
      if (videoRatio > targetRatio) {
        sw = vh * targetRatio;
        sx = (vw - sw) / 2;
      } else {
        sh = vw / targetRatio;
        sy = (vh - sh) / 2;
      }

      this.ctx.save();
      if (this.facingMode === 'user') {
        this.ctx.scale(-1, 1);
        this.ctx.drawImage(this.video, sx, sy, sw, sh, -w, 0, w, h);
      } else {
        this.ctx.drawImage(this.video, sx, sy, sw, sh, 0, 0, w, h);
      }
      this.ctx.restore();
    } else if (this.sampleImg && this.sampleImg.complete) {
      this.ctx.drawImage(this.sampleImg, 0, 0, w, h);
    } else {
      this.ctx.fillStyle = '#111';
      this.ctx.fillRect(0, 0, w, h);
      this.ctx.fillStyle = '#f5a623';
      this.ctx.fillText('NO CAMERA STREAM', 20, h / 2);
      return;
    }

    const filterObj = PocketFilters.registry[this.activeFilterId];
    if (filterObj && filterObj.apply) {
      filterObj.apply(this.ctx, w, h, this.filterParams);
    }
  }

  captureSnapshot() {
    return this.canvas.toDataURL('image/png');
  }
}
