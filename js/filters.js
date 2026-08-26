/**
 * Pocket Camera Filter Engine
 * Contains canvas pixel manipulation algorithms & color LUT lookup formulas.
 */

const PocketFilters = {
  // Bayer Matrix 4x4 for Dithering
  bayerMatrix4x4: [
    [ 0/16,  8/16,  2/16, 10/16],
    [12/16,  4/16, 14/16,  6/16],
    [ 3/16, 11/16,  1/16,  9/16],
    [15/16,  7/16, 13/16,  5/16]
  ],

  // Filter Registry Definitions
  registry: {
    // ==========================================
    // --- FUJIFILM FILM SIMULATIONS (FULL LIST) ---
    // ==========================================

    fuji_provia: {
      name: "PROVIA Standard",
      category: "fujifilm",
      description: "Mode warna alami standar Fujifilm, reproduksi warna akurat & seimbang.",
      apply: (ctx, width, height, params) => {
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;
        const contrast = params.contrast / 100;

        for (let i = 0; i < data.length; i += 4) {
          let r = data[i];
          let g = data[i+1];
          let b = data[i+2];

          // Natural balanced curve
          r = ((r / 255 - 0.5) * contrast + 0.5) * 255;
          g = ((g / 255 - 0.5) * contrast + 0.5) * 255;
          b = ((b / 255 - 0.5) * contrast + 0.5) * 255;

          data[i]   = Math.min(255, Math.max(0, r));
          data[i+1] = Math.min(255, Math.max(0, g));
          data[i+2] = Math.min(255, Math.max(0, b));
        }
        ctx.putImageData(imgData, 0, 0);
        PocketFilters.applyGrainAndVignette(ctx, width, height, params);
      }
    },

    fuji_velvia: {
      name: "Velvia Vivid",
      category: "fujifilm",
      description: "Warna sangat kaya, cerah, kontras tinggi ala slide film lanskap Velvia.",
      apply: (ctx, width, height, params) => {
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;
        
        for (let i = 0; i < data.length; i += 4) {
          let r = data[i];
          let g = data[i+1];
          let b = data[i+2];

          // Saturation boost & Velvia color pop
          let avg = (r + g + b) / 3;
          r = avg + (r - avg) * 1.55;
          g = avg + (g - avg) * 1.45;
          b = avg + (b - avg) * 1.6;

          data[i]   = Math.min(255, Math.max(0, r + 5));
          data[i+1] = Math.min(255, Math.max(0, g + 8));
          data[i+2] = Math.min(255, Math.max(0, b));
        }
        ctx.putImageData(imgData, 0, 0);
        PocketFilters.applyGrainAndVignette(ctx, width, height, params);
      }
    },

    fuji_astia: {
      name: "ASTIA Soft",
      category: "fujifilm",
      description: "Gradasi warna lembut khas potret, nada kulit halus & warna pastel menawan.",
      apply: (ctx, width, height, params) => {
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
          let r = data[i];
          let g = data[i+1];
          let b = data[i+2];

          // Soft highlights & gentle warmth
          r = r * 1.05 + 5;
          g = g * 1.02 + 2;
          b = b * 0.98;

          data[i]   = Math.min(255, Math.max(0, r));
          data[i+1] = Math.min(255, Math.max(0, g));
          data[i+2] = Math.min(255, Math.max(0, b));
        }
        ctx.putImageData(imgData, 0, 0);
        PocketFilters.applyGrainAndVignette(ctx, width, height, params);
      }
    },

    fuji_classic_chrome: {
      name: "Classic Chrome",
      category: "fujifilm",
      description: "Tipe warna sinematik Kodachrome, muted saturation, kontras bayangan tajam.",
      apply: (ctx, width, height, params) => {
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;
        const contrast = params.contrast / 100;
        
        for (let i = 0; i < data.length; i += 4) {
          let r = data[i];
          let g = data[i+1];
          let b = data[i+2];

          let lum = 0.299 * r + 0.587 * g + 0.114 * b;
          r = r * 0.7 + lum * 0.3 + 10;
          g = g * 0.75 + lum * 0.25;
          b = b * 0.65 + lum * 0.35 - 10;

          r = ((r / 255 - 0.5) * contrast + 0.5) * 255;
          g = ((g / 255 - 0.5) * contrast + 0.5) * 255;
          b = ((b / 255 - 0.5) * contrast + 0.5) * 255;

          data[i]   = Math.min(255, Math.max(0, r));
          data[i+1] = Math.min(255, Math.max(0, b));
          data[i+2] = Math.min(255, Math.max(0, b));
        }
        ctx.putImageData(imgData, 0, 0);
        PocketFilters.applyGrainAndVignette(ctx, width, height, params);
      }
    },

    fuji_reala_ace: {
      name: "REALA ACE",
      category: "fujifilm",
      description: "Reproduksi warna murni modern, kontras tegas & gradasi tonal presisi.",
      apply: (ctx, width, height, params) => {
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;
        const contrast = (params.contrast / 100) * 1.15;

        for (let i = 0; i < data.length; i += 4) {
          let r = data[i];
          let g = data[i+1];
          let b = data[i+2];

          // High fidelity color matrix with punchy contrast
          r = ((r / 255 - 0.5) * contrast + 0.5) * 255 + 2;
          g = ((g / 255 - 0.5) * contrast + 0.5) * 255 + 2;
          b = ((b / 255 - 0.5) * contrast + 0.5) * 255;

          data[i]   = Math.min(255, Math.max(0, r));
          data[i+1] = Math.min(255, Math.max(0, g));
          data[i+2] = Math.min(255, Math.max(0, b));
        }
        ctx.putImageData(imgData, 0, 0);
        PocketFilters.applyGrainAndVignette(ctx, width, height, params);
      }
    },

    fuji_pro_neg_hi: {
      name: "PRO Neg. Hi",
      category: "fujifilm",
      description: "Film potret komersial studio, kontras bayangan tegas & tone kulit natural.",
      apply: (ctx, width, height, params) => {
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
          let r = data[i];
          let g = data[i+1];
          let b = data[i+2];

          // High contrast shadow portrait matrix
          let lum = 0.299 * r + 0.587 * g + 0.114 * b;
          r = r * 0.9 + lum * 0.1 + 8;
          g = g * 0.88 + lum * 0.12;
          b = b * 0.85 + lum * 0.15;

          data[i]   = Math.min(255, Math.max(0, r));
          data[i+1] = Math.min(255, Math.max(0, g));
          data[i+2] = Math.min(255, Math.max(0, b));
        }
        ctx.putImageData(imgData, 0, 0);
        PocketFilters.applyGrainAndVignette(ctx, width, height, params);
      }
    },

    fuji_pro_neg_std: {
      name: "PRO Neg. Std",
      category: "fujifilm",
      description: "Film potret flat lembut, kontras rendah, ideal untuk grading tone kulit halus.",
      apply: (ctx, width, height, params) => {
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
          let r = data[i];
          let g = data[i+1];
          let b = data[i+2];

          // Soft low contrast flat curve
          let avg = (r + g + b) / 3;
          r = r * 0.75 + avg * 0.25;
          g = g * 0.75 + avg * 0.25;
          b = b * 0.75 + avg * 0.25;

          data[i]   = Math.min(255, Math.max(0, r));
          data[i+1] = Math.min(255, Math.max(0, g));
          data[i+2] = Math.min(255, Math.max(0, b));
        }
        ctx.putImageData(imgData, 0, 0);
        PocketFilters.applyGrainAndVignette(ctx, width, height, params);
      }
    },

    fuji_classic_neg: {
      name: "Classic Neg.",
      category: "fujifilm",
      description: "Nostalgia cetakan Superia 100, bayangan hijau-cyan & highlight hangat.",
      apply: (ctx, width, height, params) => {
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
          let r = data[i];
          let g = data[i+1];
          let b = data[i+2];

          let lum = 0.299 * r + 0.587 * g + 0.114 * b;
          r = r * 0.85 + lum * 0.15 + 15;
          g = g * 0.75 + lum * 0.25 + 8;
          b = b * 0.6 + lum * 0.4 - 15;

          data[i]   = Math.min(255, Math.max(0, r));
          data[i+1] = Math.min(255, Math.max(0, g));
          data[i+2] = Math.min(255, Math.max(0, b));
        }
        ctx.putImageData(imgData, 0, 0);
        PocketFilters.applyGrainAndVignette(ctx, width, height, params);
      }
    },

    fuji_nostalgic_neg: {
      name: "Nostalgic Neg.",
      category: "fujifilm",
      description: "Nuansa fotografi emas 70-an, highlight amber/kuning & shadow kebiruan lembut.",
      apply: (ctx, width, height, params) => {
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
          let r = data[i];
          let g = data[i+1];
          let b = data[i+2];

          // Amber warm highlights & rich shadows
          r = r * 1.1 + 12;
          g = g * 1.02 + 8;
          b = b * 0.82 - 8;

          data[i]   = Math.min(255, Math.max(0, r));
          data[i+1] = Math.min(255, Math.max(0, g));
          data[i+2] = Math.min(255, Math.max(0, b));
        }
        ctx.putImageData(imgData, 0, 0);
        PocketFilters.applyGrainAndVignette(ctx, width, height, params);
      }
    },

    fuji_eterna: {
      name: "ETERNA Cinema",
      category: "fujifilm",
      description: "Tampilan sinema layar lebar, desaturasi lembut & dynamic range luas.",
      apply: (ctx, width, height, params) => {
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
          let r = data[i];
          let g = data[i+1];
          let b = data[i+2];

          // Cinema low saturation & lifted shadows
          let lum = 0.299 * r + 0.587 * g + 0.114 * b;
          r = r * 0.55 + lum * 0.45 + 10;
          g = g * 0.55 + lum * 0.45 + 10;
          b = b * 0.55 + lum * 0.45 + 10;

          data[i]   = Math.min(255, Math.max(0, r));
          data[i+1] = Math.min(255, Math.max(0, g));
          data[i+2] = Math.min(255, Math.max(0, b));
        }
        ctx.putImageData(imgData, 0, 0);
        PocketFilters.applyGrainAndVignette(ctx, width, height, params);
      }
    },

    fuji_eterna_bleach: {
      name: "ETERNA Bleach Bypass",
      category: "fujifilm",
      description: "Efek sinema silver retention: kontras sangat tinggi dengan warna pudar metallic.",
      apply: (ctx, width, height, params) => {
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
          let r = data[i];
          let g = data[i+1];
          let b = data[i+2];

          let lum = 0.299 * r + 0.587 * g + 0.114 * b;
          // Heavy desaturation + hard contrast overlay
          r = r * 0.3 + lum * 0.7;
          g = g * 0.3 + lum * 0.7;
          b = b * 0.3 + lum * 0.7;

          // Bleach contrast boost
          r = ((r / 255 - 0.5) * 1.6 + 0.5) * 255;
          g = ((g / 255 - 0.5) * 1.6 + 0.5) * 255;
          b = ((b / 255 - 0.5) * 1.6 + 0.5) * 255;

          data[i]   = Math.min(255, Math.max(0, r));
          data[i+1] = Math.min(255, Math.max(0, g));
          data[i+2] = Math.min(255, Math.max(0, b));
        }
        ctx.putImageData(imgData, 0, 0);
        PocketFilters.applyGrainAndVignette(ctx, width, height, params);
      }
    },

    fuji_acros: {
      name: "ACROS Mono",
      category: "fujifilm",
      description: "Hitam putih tajam dengan gradasi halus & tekstur film grain kental khas ACROS.",
      apply: (ctx, width, height, params) => {
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;
        const contrast = (params.contrast / 100) * 1.25;

        for (let i = 0; i < data.length; i += 4) {
          let lum = 0.2126 * data[i] + 0.7152 * data[i+1] + 0.0722 * data[i+2];
          lum = ((lum / 255 - 0.5) * contrast + 0.5) * 255;
          lum = Math.min(255, Math.max(0, lum));

          data[i]   = lum;
          data[i+1] = lum;
          data[i+2] = lum;
        }
        ctx.putImageData(imgData, 0, 0);
        const grainOverride = Math.max(params.grain, 25);
        PocketFilters.applyGrainAndVignette(ctx, width, height, { ...params, grain: grainOverride });
      }
    },

    fuji_monochrome: {
      name: "Monochrome Standard",
      category: "fujifilm",
      description: "Hitam-putih standar bersih dengan gradasi tonal halus dan alami.",
      apply: (ctx, width, height, params) => {
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
          let lum = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
          data[i]   = lum;
          data[i+1] = lum;
          data[i+2] = lum;
        }
        ctx.putImageData(imgData, 0, 0);
        PocketFilters.applyGrainAndVignette(ctx, width, height, params);
      }
    },

    fuji_sepia: {
      name: "Sepia Warm",
      category: "fujifilm",
      description: "Foto nuansa cokelat hangat klasik khas cetakan film vintage.",
      apply: (ctx, width, height, params) => {
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
          let r = data[i];
          let g = data[i+1];
          let b = data[i+2];

          let sr = (r * 0.393) + (g * 0.769) + (b * 0.189);
          let sg = (r * 0.349) + (g * 0.686) + (b * 0.168);
          let sb = (r * 0.272) + (g * 0.534) + (b * 0.131);

          data[i]   = Math.min(255, sr);
          data[i+1] = Math.min(255, sg);
          data[i+2] = Math.min(255, sb);
        }
        ctx.putImageData(imgData, 0, 0);
        PocketFilters.applyGrainAndVignette(ctx, width, height, params);
      }
    },

    // ==========================================
    // --- GAME BOY CAMERA FILTERS ---
    // ==========================================
    gameboy_classic: {
      name: "GB Olive Green",
      category: "gameboy",
      description: "4-color Dithered Green Palette original Game Boy (1989).",
      apply: (ctx, width, height, params) => {
        const palette = [
          [15, 56, 15],     // Darkest green (#0f380f)
          [48, 98, 48],     // Dark green (#306230)
          [139, 172, 15],   // Light green (#8bac0f)
          [155, 188, 15]    // Lightest greenish (#9bbc0f)
        ];
        PocketFilters.applyDitheredPalette(ctx, width, height, palette, params);
      }
    },

    gameboy_pocket: {
      name: "GB Pocket B&W",
      category: "gameboy",
      description: "Tampilan Game Boy Pocket murni 4 gradasi monochrome dithered.",
      apply: (ctx, width, height, params) => {
        const palette = [
          [10, 10, 10],     // Black
          [80, 80, 80],     // Dark Grey
          [170, 170, 170],  // Light Grey
          [245, 245, 245]   // White
        ];
        PocketFilters.applyDitheredPalette(ctx, width, height, palette, params);
      }
    },

    // ==========================================
    // --- NINTENDO 3DS & RETRO DIGICAM ---
    // ==========================================
    retro_3ds_lofi: {
      name: "3DS Digicam",
      category: "retro3ds",
      description: "Kamera digital lo-fi 0.3MP era 2000-an / 3DS dengan warna hangat.",
      apply: (ctx, width, height, params) => {
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
          let r = Math.floor(data[i] / 16) * 16 + 8;
          let g = Math.floor(data[i+1] / 16) * 16 + 8;
          let b = Math.floor(data[i+2] / 16) * 16 + 8;

          r = Math.min(255, r + 12);
          g = Math.min(255, g + 4);

          data[i] = r;
          data[i+1] = g;
          data[i+2] = b;
        }
        ctx.putImageData(imgData, 0, 0);
        PocketFilters.applyGrainAndVignette(ctx, width, height, params);
      }
    },

    retro_3ds_thermal: {
      name: "3DS Thermal",
      category: "retro3ds",
      description: "Filter Kamera Thermal/Heatmap infrared khas 3DS DSi camera.",
      apply: (ctx, width, height, params) => {
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
          let lum = (0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2]) / 255;
          let r, g, b;

          if (lum < 0.2) {
            r = 0; g = 0; b = Math.floor(lum * 5 * 255);
          } else if (lum < 0.4) {
            r = 0; g = Math.floor((lum - 0.2) * 5 * 255); b = 255;
          } else if (lum < 0.6) {
            r = 0; g = 255; b = Math.floor((0.6 - lum) * 5 * 255);
          } else if (lum < 0.8) {
            r = Math.floor((lum - 0.6) * 5 * 255); g = 255; b = 0;
          } else {
            r = 255; g = Math.floor((1.0 - lum) * 5 * 255); b = Math.floor((lum - 0.8) * 5 * 255);
          }

          data[i]   = r;
          data[i+1] = g;
          data[i+2] = b;
        }
        ctx.putImageData(imgData, 0, 0);
      }
    },

    retro_3ds_anaglyph: {
      name: "3D Anaglyph",
      category: "retro3ds",
      description: "Efek 3D Red-Cyan stereo split viewfinder Nintendo 3DS.",
      apply: (ctx, width, height, params) => {
        const imgData = ctx.getImageData(0, 0, width, height);
        const copyData = new Uint8ClampedArray(imgData.data);
        const data = imgData.data;
        const shift = Math.floor(width * 0.02);

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const shiftedX = Math.min(width - 1, x + shift);
            const shiftedIdx = (y * width + shiftedX) * 4;

            data[idx]     = copyData[shiftedIdx];
            data[idx + 1] = copyData[idx + 1];
            data[idx + 2] = copyData[idx + 2];
          }
        }
        ctx.putImageData(imgData, 0, 0);
      }
    },

    // ==========================================
    // --- PIXEL ART & CRT FILTERS ---
    // ==========================================
    pixel_8bit: {
      name: "8-Bit Retro",
      category: "pixelart",
      description: "Pixel art konsol 8-bit / arcade dengan reduksi warna posterized.",
      apply: (ctx, width, height, params) => {
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
          data[i]   = Math.round(data[i] / 64) * 64;
          data[i+1] = Math.round(data[i+1] / 64) * 64;
          data[i+2] = Math.round(data[i+2] / 64) * 64;
        }
        ctx.putImageData(imgData, 0, 0);
        PocketFilters.applyGrainAndVignette(ctx, width, height, params);
      }
    },

    pixel_crt: {
      name: "CRT Monitor",
      category: "pixelart",
      description: "Simulasi layar TV tabung CRT dengan garis pendar RGB.",
      apply: (ctx, width, height, params) => {
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        for (let y = 0; y < height; y++) {
          const isScanline = (y % 3 === 0);
          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            if (isScanline) {
              data[idx]     = data[idx] * 0.6;
              data[idx + 1] = data[idx + 1] * 0.6;
              data[idx + 2] = data[idx + 2] * 0.6;
            } else {
              if (x % 3 === 0) data[idx + 1] *= 0.8;
              if (x % 3 === 1) data[idx + 2] *= 0.8;
              if (x % 3 === 2) data[idx] *= 0.8;
            }
          }
        }
        ctx.putImageData(imgData, 0, 0);
      }
    },

    // ==========================================
    // --- VINTAGE & B&W FILTERS ---
    // ==========================================
    vintage_sepia: {
      name: "Vintage Sepia",
      category: "vintage",
      description: "Foto nuansa cokelat hangat klasik khas awal abad ke-20.",
      apply: (ctx, width, height, params) => {
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
          let r = data[i];
          let g = data[i+1];
          let b = data[i+2];

          let sr = (r * 0.393) + (g * 0.769) + (b * 0.189);
          let sg = (r * 0.349) + (g * 0.686) + (b * 0.168);
          let sb = (r * 0.272) + (g * 0.534) + (b * 0.131);

          data[i]   = Math.min(255, sr);
          data[i+1] = Math.min(255, sg);
          data[i+2] = Math.min(255, sb);
        }
        ctx.putImageData(imgData, 0, 0);
        PocketFilters.applyGrainAndVignette(ctx, width, height, params);
      }
    },

    noir_monochrome: {
      name: "High-Contrast Noir",
      category: "vintage",
      description: "Hitam-putih kontras ekstrem ala film noir vintage.",
      apply: (ctx, width, height, params) => {
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
          let lum = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
          let val = lum > 120 ? Math.min(255, lum * 1.3) : Math.max(0, lum * 0.6);
          data[i]   = val;
          data[i+1] = val;
          data[i+2] = val;
        }
        ctx.putImageData(imgData, 0, 0);
        PocketFilters.applyGrainAndVignette(ctx, width, height, params);
      }
    }
  },

  /**
   * Applies Ordered Dithering with 4-color palette
   */
  applyDitheredPalette: (ctx, width, height, palette, params) => {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    const ditherIntensity = (params.dither / 100);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        let r = data[idx];
        let g = data[idx+1];
        let b = data[idx+2];

        let lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        const bayerVal = PocketFilters.bayerMatrix4x4[y % 4][x % 4] - 0.5;
        lum = Math.min(1.0, Math.max(0.0, lum + bayerVal * ditherIntensity));

        let paletteIdx = Math.floor(lum * palette.length);
        if (paletteIdx >= palette.length) paletteIdx = palette.length - 1;

        const color = palette[paletteIdx];
        data[idx]   = color[0];
        data[idx+1] = color[1];
        data[idx+2] = color[2];
      }
    }
    ctx.putImageData(imgData, 0, 0);
  },

  /**
   * Adds Procedural Noise (Film Grain) and Vignette Darkening
   */
  applyGrainAndVignette: (ctx, width, height, params) => {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    const grainAmount = (params.grain / 100) * 40;
    const vignetteAmount = (params.vignette / 100);

    const centerX = width / 2;
    const centerY = height / 2;
    const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;

        if (grainAmount > 0) {
          const noise = (Math.random() - 0.5) * grainAmount;
          data[idx]   = Math.min(255, Math.max(0, data[idx] + noise));
          data[idx+1] = Math.min(255, Math.max(0, data[idx+1] + noise));
          data[idx+2] = Math.min(255, Math.max(0, data[idx+2] + noise));
        }

        if (vignetteAmount > 0) {
          const dx = x - centerX;
          const dy = y - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy) / maxDist;
          const factor = 1 - (dist * dist * vignetteAmount * 0.85);

          data[idx]   = Math.min(255, Math.max(0, data[idx] * factor));
          data[idx+1] = Math.min(255, Math.max(0, data[idx+1] * factor));
          data[idx+2] = Math.min(255, Math.max(0, data[idx+2] * factor));
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }
};
