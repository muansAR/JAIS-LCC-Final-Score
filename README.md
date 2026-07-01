<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# 🕌 JAIS REBORN - LCC Pro Scoring System

**LCC Pro Scoring System (Offline Pro)** adalah aplikasi sistem penilaian (scoring) digital modern yang dirancang khusus untuk mengelola kompetisi Cerdas Cermat (Lomba Cerdas Cermat / LCC) Islami secara profesional. Aplikasi ini dapat berjalan sepenuhnya secara offline, memastikan stabilitas tinggi selama perlombaan berlangsung tanpa bergantung pada koneksi internet.

---

## ✨ Fitur Utama

*   **Sistem Multi-Regu (A, B, C):** Mendukung manajemen skor dan status siap (*Ready/Active*) untuk 3 regu sekaligus secara real-time.
*   **Manajemen Babak Terintegrasi:** Alur kompetisi terbagi menjadi beberapa babak terstruktur:
    *   *Babak 1: Wajib (Mandatory)*
    *   *Babak 2: Lemparan*
    *   *Babak 3: Rebutan*
    *   *Sudden Death (Babak Penentuan)*
*   **Log Scoring Cepat:** Tombol aksi sekali klik untuk mencatat jawaban **Benar (+100)**, **Salah (-50)**, atau **Pass (0)**, lengkap dengan dukungan *keyboard shortcuts*.
*   **Quick Adjust Score:** Tombol penyesuaian instan (+10/-10) untuk koreksi skor secara cepat jika terjadi kekeliruan teknis.
*   **Game Timer Digital:** Penghitung waktu mundur interaktif (5s, 10s, 15s, 20s) dengan kontrol *Start/Pause* menggunakan tombol `Space` dan *Reset* menggunakan tombol `R`.
*   **Projector Screen Mode:** Mode tampilan khusus yang bersih dan elegan untuk diproyeksikan ke layar penonton/peserta.
*   **Evaluasi Pemenang & Standings:** Fitur otomatis untuk memeriksa kondisi skor seri (*ties*) dan mengunci posisi juara secara sah.
*   **Statistik Akurasi Tim & Grafik:** Menyajikan data performa berupa total percobaan (*attempts*), persentase akurasi, serta grafik progresi skor langsung (*Live Score Progression Graph*).
*   **Ekspor Laporan:** Dukungan fitur *Export & Report* untuk mengunduh hasil akhir pertandingan.

---

## 🎹 Pintasan Keyboard (Shortcuts)

Untuk mempercepat kerja operator/juri di meja registrasi, aplikasi ini mendukung pintasan berikut:

| Tombol | Aksi |
| :--- | :--- |
| **`[1]`** | Log Jawaban **BENAR** (+100 poin) |
| **`[2]`** | Log Jawaban **SALAH** (-50 poin) |
| **`[3]`** | Log **PASS** (0 poin) |
| **`Space`** | *Start / Pause* Timer |
| **`R`** | *Reset* Timer |

---

## 🚀 Cara Penggunaan (Panduan Operator)

### 1. Persiapan Babak Wajib
1. Pilih regu yang akan bermain pada panel **"SELECT ACTIVE TEAM FOR ROUND 1"** (misal: Regu A). Status regu akan berubah menjadi ⚡ *ACTIVE TURN*.
2. Bacakan pertanyaan nomor 1.
3. Jalankan timer dengan menekan tombol **START** atau tombol `Space`.

### 2. Penginputan Nilai
* Jika regu menjawab **Benar**, klik tombol hijau **CORRECT (+100)** atau tekan angka `1`. Aplikasi otomatis beralih ke pertanyaan berikutnya.
* Jika regu menjawab **Salah**, klik tombol merah **WRONG (-50)** atau tekan angka `2`.
* Jika regu memilih untuk **Melewati**, klik tombol kuning **PASS (0)** atau tekan angka `3`.

### 3. Penentuan Pemenang
Setelah seluruh babak selesai, gulir ke bagian bawah halaman dan klik **Check Standing & Ties** pada panel *Evaluate Winner Standings* untuk mengunci hasil pertandingan dan melihat urutan juara secara sah.

---

## 🛠️ Teknologi yang Digunakan

*   **Frontend:** React / Vue.js (atau sebutkan framework yang kamu pakai, misal: Tailwind CSS untuk styling modern bertema *Dark Mode*).
*   **Konektivitas:** 100% Offline Client-Side (Localhost).
## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
"# JAIS-LCC-Final-Score" 
