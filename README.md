# 📸 Pocket Camera Web Simulator

Web Simulator interaktif untuk **Pocket Camera** dengan filter retro **Fujifilm Film Simulations (2025 Guide)**, **Game Boy Camera Dithering**, **Nintendo 3DS / DSi Digicam**, **Pixel Art**, dan **C++ Exporter**.

---

## ✨ Fitur Utama

- 🎥 **Live Viewfinder & Camera**: Menggunakan webcam laptop/HP real-time (lengkap dengan fallback sample image jika tanpa webcam).
- 🎞️ **14 Fujifilm Film Simulations (2025 Complete Guide)**:
  - *PROVIA Standard, Velvia Vivid, ASTIA Soft, CLASSIC CHROME, REALA ACE, PRO Neg. Hi, PRO Neg. Std, CLASSIC Neg., Nostalgic Neg., ETERNA Cinema, ETERNA Bleach Bypass, ACROS Mono, Monochrome, Sepia*.
- 👾 **Game Boy Camera**: Dithering 4x4 Bayer Matrix (*GB Olive Green 1989* & *GB Pocket B&W*).
- 🎮 **Nintendo 3DS / DSi**: *3DS Digicam (Lo-Fi 0.3MP)*, *3DS Thermal Heatmap*, & *3D Anaglyph*.
- 🕹️ **Kontrol & Suara Hardware**: Tombol Shutter, D-Pad, Suara Beep & Shutter Click Sintetis (Web Audio API), serta Galeri Foto Interaktif.
- 💻 **C++ Code Exporter**: Generator kode C++ RGB565 framebuffer untuk di-flash ke ESP32-CAM jika nanti merakit versi fisiknya.

---

## 🚀 Cara Deploy ke Vercel

Aplikasi ini dibuat murni menggunakan **HTML5, CSS3, dan JavaScript (Vanilla Canvas API)** sehingga sangat ringan dan **dapat di-deploy ke Vercel secara GRATIS** hanya dalam hitungan detik!

### Cara 1: Deploy via Vercel CLI (Termudah dari Terminal)
Jalankan perintah berikut di terminal pada folder project ini:
```bash
npx vercel
```
Ikuti petunjuk di terminal (Login / Confirm project name), dan web app Anda akan langsung online dengan domain gratis Vercel (contoh: `https://pocket-camera-simulator.vercel.app`).

### Cara 2: Deploy via GitHub & Vercel Dashboard
1. Push repositori ini ke akun GitHub Anda:
   ```bash
   git init
   git add .
   git commit -m "Initial commit Pocket Camera Web Simulator"
   git remote add origin https://github.com/USERNAME/Pocket-Cam.git
   git push -u origin main
   ```
2. Buka [Vercel Dashboard](https://vercel.com/new).
3. Pilih **"Import Git Repository"** dan pilih repo `Pocket-Cam`.
4. Klik **Deploy**! (Vercel akan otomatis mendeteksi file `vercel.json` & `index.html`).

---

## 💻 Jalankan Lokal (Development)

```bash
# Menggunakan npx serve
npx serve .

# Atau menggunakan Python HTTP Server
python3 -m http.server 8085
```
Akses di browser: `http://localhost:8085`
