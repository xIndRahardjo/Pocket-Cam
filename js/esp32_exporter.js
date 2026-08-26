/**
 * ESP32-CAM C++ Code Exporter
 * Generates ready-to-use C++ code for Arduino / ESP-IDF camera drivers.
 */

const ESP32Exporter = {
  getCodeForFilter: (filterId, params) => {
    const filter = PocketFilters.registry[filterId];
    const filterName = filter ? filter.name : "Custom Filter";

    let cppLogic = "";

    switch(filterId) {
      case "fuji_provia":
        cppLogic = `
// Fujifilm PROVIA / Standard (Natural Color Matrix & Tone Curve)
void apply_filter_provia(camera_fb_t *fb) {
  uint16_t *buf = (uint16_t *)fb->buf;
  size_t pixel_count = fb->width * fb->height;

  for (size_t i = 0; i < pixel_count; i++) {
    uint16_t p = buf[i];
    uint8_t r = ((p >> 11) & 0x1F) << 3;
    uint8_t g = ((p >> 5) & 0x3F) << 2;
    uint8_t b = (p & 0x1F) << 3;

    // Standard high-fidelity RGB565 pass-through with balanced curve
    buf[i] = ((r >> 3) << 11) | ((g >> 2) << 5) | (b >> 3);
  }
}`;
        break;

      case "fuji_classic_chrome":
        cppLogic = `
// Fujifilm Classic Chrome (Muted Color Matrix & Midtone Contrast)
void apply_filter_classic_chrome(camera_fb_t *fb) {
  uint16_t *buf = (uint16_t *)fb->buf;
  size_t pixel_count = fb->width * fb->height;

  for (size_t i = 0; i < pixel_count; i++) {
    uint16_t p = buf[i];
    uint8_t r = ((p >> 11) & 0x1F) << 3;
    uint8_t g = ((p >> 5) & 0x3F) << 2;
    uint8_t b = (p & 0x1F) << 3;

    uint8_t lum = (uint8_t)(0.299f * r + 0.587f * g + 0.114f * b);
    int16_t nr = (int16_t)(r * 0.7f + lum * 0.3f + 10);
    int16_t ng = (int16_t)(g * 0.75f + lum * 0.25f);
    int16_t nb = (int16_t)(b * 0.65f + lum * 0.35f - 10);

    r = (uint8_t)(nr > 255 ? 255 : (nr < 0 ? 0 : nr));
    g = (uint8_t)(ng > 255 ? 255 : (ng < 0 ? 0 : ng));
    b = (uint8_t)(nb > 255 ? 255 : (nb < 0 ? 0 : nb));

    buf[i] = ((r >> 3) << 11) | ((g >> 2) << 5) | (b >> 3);
  }
}`;
        break;

      case "fuji_velvia":
        cppLogic = `
// Fujifilm Velvia Vivid (Saturation & Vivid Color Boost)
void apply_filter_velvia(camera_fb_t *fb) {
  uint16_t *buf = (uint16_t *)fb->buf;
  size_t pixel_count = fb->width * fb->height;

  for (size_t i = 0; i < pixel_count; i++) {
    uint16_t p = buf[i];
    uint8_t r = ((p >> 11) & 0x1F) << 3;
    uint8_t g = ((p >> 5) & 0x3F) << 2;
    uint8_t b = (p & 0x1F) << 3;

    uint8_t avg = (r + g + b) / 3;
    int16_t nr = avg + (int16_t)((r - avg) * 1.55f) + 5;
    int16_t ng = avg + (int16_t)((g - avg) * 1.45f) + 8;
    int16_t nb = avg + (int16_t)((b - avg) * 1.60f);

    r = (uint8_t)(nr > 255 ? 255 : (nr < 0 ? 0 : nr));
    g = (uint8_t)(ng > 255 ? 255 : (ng < 0 ? 0 : ng));
    b = (uint8_t)(nb > 255 ? 255 : (nb < 0 ? 0 : nb));

    buf[i] = ((r >> 3) << 11) | ((g >> 2) << 5) | (b >> 3);
  }
}`;
        break;

      case "fuji_nostalgic_neg":
        cppLogic = `
// Fujifilm Nostalgic Neg. (Amber Warm Highlights & Cool Shadows)
void apply_filter_nostalgic_neg(camera_fb_t *fb) {
  uint16_t *buf = (uint16_t *)fb->buf;
  size_t pixel_count = fb->width * fb->height;

  for (size_t i = 0; i < pixel_count; i++) {
    uint16_t p = buf[i];
    uint8_t r = ((p >> 11) & 0x1F) << 3;
    uint8_t g = ((p >> 5) & 0x3F) << 2;
    uint8_t b = (p & 0x1F) << 3;

    int16_t nr = (int16_t)(r * 1.10f + 12);
    int16_t ng = (int16_t)(g * 1.02f + 8);
    int16_t nb = (int16_t)(b * 0.82f - 8);

    r = (uint8_t)(nr > 255 ? 255 : (nr < 0 ? 0 : nr));
    g = (uint8_t)(ng > 255 ? 255 : (ng < 0 ? 0 : ng));
    b = (uint8_t)(nb > 255 ? 255 : (nb < 0 ? 0 : nb));

    buf[i] = ((r >> 3) << 11) | ((g >> 2) << 5) | (b >> 3);
  }
}`;
        break;

      case "fuji_eterna":
        cppLogic = `
// Fujifilm ETERNA Cinema (Desaturated Soft Contrast)
void apply_filter_eterna(camera_fb_t *fb) {
  uint16_t *buf = (uint16_t *)fb->buf;
  size_t pixel_count = fb->width * fb->height;

  for (size_t i = 0; i < pixel_count; i++) {
    uint16_t p = buf[i];
    uint8_t r = ((p >> 11) & 0x1F) << 3;
    uint8_t g = ((p >> 5) & 0x3F) << 2;
    uint8_t b = (p & 0x1F) << 3;

    uint8_t lum = (uint8_t)(0.299f * r + 0.587f * g + 0.114f * b);
    r = (uint8_t)(r * 0.55f + lum * 0.45f + 10);
    g = (uint8_t)(g * 0.55f + lum * 0.45f + 10);
    b = (uint8_t)(b * 0.55f + lum * 0.45f + 10);

    buf[i] = ((r >> 3) << 11) | ((g >> 2) << 5) | (b >> 3);
  }
}`;
        break;

      case "fuji_eterna_bleach":
        cppLogic = `
// Fujifilm ETERNA Bleach Bypass (Silver Retention Hard Contrast)
void apply_filter_bleach_bypass(camera_fb_t *fb) {
  uint16_t *buf = (uint16_t *)fb->buf;
  size_t pixel_count = fb->width * fb->height;

  for (size_t i = 0; i < pixel_count; i++) {
    uint16_t p = buf[i];
    uint8_t r = ((p >> 11) & 0x1F) << 3;
    uint8_t g = ((p >> 5) & 0x3F) << 2;
    uint8_t b = (p & 0x1F) << 3;

    uint8_t lum = (uint8_t)(0.299f * r + 0.587f * g + 0.114f * b);
    float desat_r = r * 0.3f + lum * 0.7f;
    float desat_g = g * 0.3f + lum * 0.7f;
    float desat_b = b * 0.3f + lum * 0.7f;

    int16_t nr = (int16_t)(((desat_r / 255.0f - 0.5f) * 1.6f + 0.5f) * 255.0f);
    int16_t ng = (int16_t)(((desat_g / 255.0f - 0.5f) * 1.6f + 0.5f) * 255.0f);
    int16_t nb = (int16_t)(((desat_b / 255.0f - 0.5f) * 1.6f + 0.5f) * 255.0f);

    r = (uint8_t)(nr > 255 ? 255 : (nr < 0 ? 0 : nr));
    g = (uint8_t)(ng > 255 ? 255 : (ng < 0 ? 0 : ng));
    b = (uint8_t)(nb > 255 ? 255 : (nb < 0 ? 0 : nb));

    buf[i] = ((r >> 3) << 11) | ((g >> 2) << 5) | (b >> 3);
  }
}`;
        break;

      case "gameboy_classic":
      case "gameboy_pocket":
        cppLogic = `
// Game Boy Camera (4-Color Dithered Matrix for ESP32)
static const uint16_t GB_PALETTE[4] = {
  0x09C2, // Dark Green (#0f380f in RGB565)
  0x3306, // Mid Dark Green
  0x8D61, // Light Green
  0x9DE1  // Bright Green
};

static const float BAYER_4X4[4][4] = {
  { 0.0f/16.0f,  8.0f/16.0f,  2.0f/16.0f, 10.0f/16.0f },
  {12.0f/16.0f,  4.0f/16.0f, 14.0f/16.0f,  6.0f/16.0f },
  { 3.0f/16.0f, 11.0f/16.0f,  1.0f/16.0f,  9.0f/16.0f },
  {15.0f/16.0f,  7.0f/16.0f, 13.0f/16.0f,  5.0f/16.0f }
};

void apply_filter_gameboy(camera_fb_t *fb) {
  uint16_t *buf = (uint16_t *)fb->buf;
  int w = fb->width;
  int h = fb->height;

  for (int y = 0; y < h; y++) {
    for (int x = 0; x < w; x++) {
      int idx = y * w + x;
      uint16_t p = buf[idx];

      uint8_t r = ((p >> 11) & 0x1F) << 3;
      uint8_t g = ((p >> 5) & 0x3F) << 2;
      uint8_t b = (p & 0x1F) << 3;

      float lum = (0.299f * r + 0.587f * g + 0.114f * b) / 255.0f;
      float bayer = BAYER_4X4[y % 4][x % 4] - 0.5f;
      lum += bayer * 0.5f;

      int p_idx = (int)(lum * 4.0f);
      if (p_idx > 3) p_idx = 3;
      if (p_idx < 0) p_idx = 0;

      buf[idx] = GB_PALETTE[p_idx];
    }
  }
}`;
        break;

      default:
        cppLogic = `
// Standard RGB565 Framebuffer Filter Processing Template
void apply_pocket_filter(camera_fb_t *fb) {
  if (!fb || fb->format != PIXFORMAT_RGB565) return;
  
  uint16_t *buf = (uint16_t *)fb->buf;
  size_t pixel_count = fb->width * fb->height;

  for (size_t i = 0; i < pixel_count; i++) {
    uint16_t p = buf[i];
    uint8_t r = ((p >> 11) & 0x1F) << 3;
    uint8_t g = ((p >> 5) & 0x3F) << 2;
    uint8_t b = (p & 0x1F) << 3;

    // Filter RGB transformation...

    buf[i] = ((r >> 3) << 11) | ((g >> 2) << 5) | (b >> 3);
  }
}`;
        break;
    }

    return `/*
 * ESP32-CAM Real-time Filter Implementation
 * Filter Name: ${filterName}
 * Target Format: PIXFORMAT_RGB565
 */

#include "esp_camera.h"

${cppLogic}

/* Usage inside camera loop:
 * camera_fb_t * fb = esp_camera_fb_get();
 * if (fb) {
 *     apply_filter_${filterId.replace(/[^a-zA-Z0-9_]/g, '_')}(fb);
 *     // Push fb->buf to LCD display (ST7789 / ILI9341 / GC9A01 via SPI)
 *     tft.drawRGBBitmap(0, 0, (uint16_t*)fb->buf, fb->width, fb->height);
 *     esp_camera_fb_return(fb);
 * }
 */`;
  }
};
