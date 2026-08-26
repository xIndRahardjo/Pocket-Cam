/**
 * Pocket Camera Stream & Render Controller
 * Dual-Pipeline Architecture + 4-Method Smartphone Hardware Torch Control
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
    this.showDateStamp = true; // Retro Digicam Date Stamp ON/OFF
    this.isNativeRes = true; // High-Res Snapshot Mode enabled
    
    this.activeFilterId = 'fuji_classic_chrome';
    this.filterParams = {
      grain: 15,
      contrast: 100,
      vignette: 20,
      dither: 50
    };

    // Fast preview canvas resolution (butter smooth rendering)
    this.previewWidth = 640;
    this.previewHeight = 480;
    
    // Native full camera track resolution (for crisp HD photo snapshots)
    this.nativeWidth = 1280;
    this.nativeHeight = 720;
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
    sampleCanvas.width = 1280;
    sampleCanvas.height = 720;
    const sCtx = sampleCanvas.getContext('2d');

    const grad = sCtx.createLinearGradient(0, 0, 1280, 720);
    grad.addColorStop(0, '#1e3c72');
    grad.addColorStop(0.5, '#2a5298');
    grad.addColorStop(1, '#f12711');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 1280, 720);

    sCtx.fillStyle = '#f5a623';
    sCtx.beginPath();
    sCtx.arc(640, 360, 200, 0, Math.PI * 2);
    sCtx.fill();

    sCtx.fillStyle = '#ffffff';
    sCtx.font = 'bold 54px sans-serif';
    sCtx.textAlign = 'center';
    sCtx.fillText('POCKET-CAM NATIVE HD', 640, 350);
    sCtx.font = '28px sans-serif';
    sCtx.fillText('High Definition Camera Simulator', 640, 400);

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
      let videoConstraints = {
        width: { ideal: 1920, max: 3840 },
        height: { ideal: 1080, max: 2160 },
        facingMode: { ideal: this.facingMode }
      };

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(d => d.kind === 'videoinput');
        
        if (this.facingMode === 'environment') {
          const backCam = videoInputs.find(d => 
            d.label.toLowerCase().includes('back') || 
            d.label.toLowerCase().includes('rear') || 
            d.label.toLowerCase().includes('0')
          );
          if (backCam && backCam.deviceId) {
            videoConstraints.deviceId = { exact: backCam.deviceId };
          }
        }
      } catch (e) {
        // Fallback
      }

      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: false });
      } catch (err) {
        console.warn(`Gagal mengaitkan kamera ${this.facingMode}, mencoba fallback standar:`, err);
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: this.facingMode } },
          audio: false
        });
      }

      this.video.srcObject = this.mediaStream;
      await this.video.play();
      this.currentSource = 'webcam';
      this.isStreaming = true;
      
      if (this.flashMode === 'on') {
        await this.enableHardwareTorch(true);
      }

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
    
    const torchApplied = await this.enableHardwareTorch(this.flashMode === 'on');
    return { mode: this.flashMode, torchApplied };
  }

  toggleDateStamp() {
    this.showDateStamp = !this.showDateStamp;
    return this.showDateStamp;
  }

  /**
   * 4-Method Comprehensive Hardware Torch Enabler
   * Method 1: ImageCapture W3C API
   * Method 2: Advanced Track Constraint [{ torch: true }]
   * Method 3: fillLightMode Constraint
   * Method 4: Dynamic Re-acquisition with torch constraint
   */
  async enableHardwareTorch(enable) {
    if (!this.mediaStream) return false;
    const tracks = this.mediaStream.getVideoTracks();
    if (!tracks || tracks.length === 0) return false;
    
    const track = tracks[0];

    // Method 1: ImageCapture W3C Native API
    if (window.ImageCapture) {
      try {
        const imageCapture = new ImageCapture(track);
        if (imageCapture.setOptions) {
          await imageCapture.setOptions({
            fillLightMode: enable ? 'torch' : 'off'
          });
          console.log('Torch via ImageCapture.setOptions succeeded!');
          return true;
        }
      } catch (e) {
        console.warn('ImageCapture setOptions attempt failed:', e);
      }
    }

    // Method 2: Advanced Track Constraint [{ torch: true }]
    try {
      await track.applyConstraints({
        advanced: [{ torch: !!enable }]
      });
      console.log('Torch via applyConstraints advanced torch succeeded!');
      return true;
    } catch (err1) {
      console.warn('Torch constraint v1 failed:', err1);
    }

    // Method 3: Fill Light Mode Constraint
    try {
      await track.applyConstraints({
        advanced: [{ torch: !!enable }, { fillLightMode: enable ? 'flash' : 'off' }]
      });
      console.log('Torch via fillLightMode succeeded!');
      return true;
    } catch (err2) {
      console.warn('Torch constraint v2 failed:', err2);
    }

    // Method 4: Dynamic getUserMedia re-acquisition with torch
    if (enable && this.facingMode === 'environment') {
      try {
        const torchStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            advanced: [{ torch: true }]
          },
          audio: false
        });
        if (torchStream) {
          this.mediaStream = torchStream;
          this.video.srcObject = torchStream;
          await this.video.play();
          console.log('Torch via stream re-acquisition succeeded!');
          return true;
        }
      } catch (err4) {
        console.warn('Stream re-acquisition with torch failed:', err4);
      }
    }

    return false;
  }

  async pulseFlashlight() {
    if (!this.mediaStream) return;
    const tracks = this.mediaStream.getVideoTracks();
    if (!tracks || tracks.length === 0) return;

    try {
      await this.enableHardwareTorch(true);
      setTimeout(async () => {
        if (this.flashMode !== 'on') {
          await this.enableHardwareTorch(false);
        }
      }, 450);
    } catch (e) {
      // Torch fallback
    }
  }

  setResolution(width, height) {
    if (width === 'auto' || width === 0) {
      this.isNativeRes = true;
    } else {
      this.isNativeRes = false;
      this.previewWidth = width;
      this.previewHeight = height;
      this.nativeWidth = width;
      this.nativeHeight = height;
      this.canvas.width = width;
      this.canvas.height = height;
    }
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
    if (this.currentSource === 'webcam' && this.video.readyState >= 2) {
      const vw = this.video.videoWidth;
      const vh = this.video.videoHeight;

      if (vw > 0 && vh > 0) {
        this.nativeWidth = vw;
        this.nativeHeight = vh;

        if (this.isNativeRes) {
          const aspect = vw / vh;
          const pW = Math.min(640, vw);
          const pH = Math.round(pW / aspect);

          if (this.previewWidth !== pW || this.previewHeight !== pH) {
            this.previewWidth = pW;
            this.previewHeight = pH;
            this.canvas.width = pW;
            this.canvas.height = pH;

            const resElem = document.getElementById('lcd-res-indicator');
            if (resElem) resElem.textContent = `HD ${vw}x${vh}`;
          }
        }
      }
    }

    const w = this.previewWidth;
    const h = this.previewHeight;

    this.ctx.clearRect(0, 0, w, h);

    if (this.currentSource === 'webcam' && this.video.readyState >= 2) {
      const vw = this.video.videoWidth;
      const vh = this.video.videoHeight;
      
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

    // Apply Active Filter
    const filterObj = PocketFilters.registry[this.activeFilterId];
    if (filterObj && filterObj.apply) {
      filterObj.apply(this.ctx, w, h, this.filterParams);
    }

    // Draw Retro Digicam Date Stamp
    if (this.showDateStamp) {
      this.ctx.save();
      const now = new Date();
      const yy = String(now.getFullYear()).slice(-2);
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const dateStr = `'${yy} ${mm} ${dd}`;

      const fontSize = Math.max(11, Math.round(w / 35));
      this.ctx.font = `bold ${fontSize}px "Press Start 2P", monospace`;
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
      this.ctx.shadowOffsetX = 2;
      this.ctx.shadowOffsetY = 2;
      this.ctx.shadowBlur = 4;
      this.ctx.fillStyle = '#ff6c00';
      this.ctx.textAlign = 'right';
      this.ctx.fillText(dateStr, w - (w * 0.025), h - (h * 0.035));
      this.ctx.restore();
    }
  }

  captureSnapshot() {
    const offCanvas = document.createElement('canvas');
    const w = this.isNativeRes ? this.nativeWidth : this.previewWidth;
    const h = this.isNativeRes ? this.nativeHeight : this.previewHeight;

    offCanvas.width = w;
    offCanvas.height = h;
    const oCtx = offCanvas.getContext('2d', { willReadFrequently: true });

    if (this.currentSource === 'webcam' && this.video.readyState >= 2) {
      const vw = this.video.videoWidth;
      const vh = this.video.videoHeight;
      
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

      oCtx.save();
      if (this.facingMode === 'user') {
        oCtx.scale(-1, 1);
        oCtx.drawImage(this.video, sx, sy, sw, sh, -w, 0, w, h);
      } else {
        oCtx.drawImage(this.video, sx, sy, sw, sh, 0, 0, w, h);
      }
      oCtx.restore();
    } else if (this.sampleImg && this.sampleImg.complete) {
      oCtx.drawImage(this.sampleImg, 0, 0, w, h);
    }

    const filterObj = PocketFilters.registry[this.activeFilterId];
    if (filterObj && filterObj.apply) {
      filterObj.apply(oCtx, w, h, this.filterParams);
    }

    if (this.showDateStamp) {
      oCtx.save();
      const now = new Date();
      const yy = String(now.getFullYear()).slice(-2);
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const dateStr = `'${yy} ${mm} ${dd}`;

      const fontSize = Math.max(16, Math.round(w / 35));
      oCtx.font = `bold ${fontSize}px "Press Start 2P", monospace`;
      oCtx.shadowColor = 'rgba(0, 0, 0, 0.95)';
      oCtx.shadowOffsetX = 3;
      oCtx.shadowOffsetY = 3;
      oCtx.shadowBlur = 6;
      oCtx.fillStyle = '#ff6c00';
      oCtx.textAlign = 'right';
      oCtx.fillText(dateStr, w - (w * 0.025), h - (h * 0.035));
      oCtx.restore();
    }

    return offCanvas.toDataURL('image/png');
  }
}
