📑 PVS DATABASE AND CONFIGURATION SCHEMATICS v7.0

Dokumentasi spesifikasi struktur data relasional Google Sheets untuk mendukung fungsionalitas core logic backend Kode.gs dan frontend app.js.

📐 Panduan Penamaan Sheet & Header Kolom (Wajib di Baris Ke-1)

Untuk memastikan interkoneksi data tidak mengalami error, buat 4 buah Tab Sheet baru di Google Spreadsheet Anda dengan nama dan susunan header kolom persis seperti di bawah ini:

1. Sheet: Pengaturan_Branding

Kolom A: id_setting (PK)

Kolom B: nama_calon_kades

Kolom C: drive_id_foto_paslon

Kolom D: drive_id_banner_login

Kolom E: updated_at

2. Sheet: User_Timses

Kolom A: user_id (PK)

Kolom B: username

Kolom C: password_hash

Kolom D: nama_lengkap

Kolom E: role (Isi dengan: ADMIN atau TIMSES)

Kolom F: status_aktif (Isi dengan: Active atau Inactive)

Kolom G: last_login

3. Sheet: DPT

Kolom A: nik (PK)

Kolom B: no_kk

Kolom C: nama_warga

Kolom D: dusun

Kolom E: rt

Kolom F: rw

Kolom G: tps_id

4. Sheet: Warga_Terdata

Kolom A: voter_id (PK)

Kolom B: nik (FK to DPT - Unique Constraint)

Kolom C: klasifikasi (Isi dengan: PRO, KONTRA, atau RAGU-RAGU)

Kolom D: input_by_user_id (FK to User_Timses)

Kolom E: created_at

🚀 Langkah Deploy Cepat (PPV-Gateway)

Langkah 1: Setup Backend (Google Apps Script)

Buka Google Sheets baru Anda.

Klik menu Ekstensi -> Apps Script.

Hapus semua kode bawaan, lalu paste seluruh isi file Kode.gs yang sudah kita buat sebelumnya.

Klik tombol Simpan (ikon disket).

Pada toolbar atas, pastikan fungsi yang terpilih adalah setupDatabase (jika ada), lalu klik Run (Jalankan). Langkah ini akan otomatis membuatkan seluruh tab sheet dan dummy data uji coba di Spreadsheet Anda tanpa perlu Anda ketik manual!

Langkah 2: Deploy Sebagai Web App

Di pojok kanan atas editor script, klik Terapkan (Deploy) -> Terapkan Baru (New Deployment).

Pilih jenis penerapan: Aplikasi Web (Web App).

Konfigurasi setelan:

Jalankan sebagai: Saya (Email Anda)

Yang memiliki akses: Siapa saja (Anyone)

Klik Terapkan (Deploy) dan berikan izin akses (Authorize Access) ke Google Drive & Sheets Anda jika diminta.

Salin URL Aplikasi Web (Web App URL) yang muncul di akhir proses.

Langkah 3: Koneksikan ke Frontend (GitHub Pages)

Buka file app.js yang ada di repositori GitHub lokal/online Anda.

Temukan variabel const GAS_API_URL = ""; di baris paling atas (baris ke-9).

Paste URL Aplikasi Web yang sudah Anda salin tadi di dalam tanda kutip tersebut. Contoh:
const GAS_API_URL = "https://script.google.com/macros/s/AKfycb.../exec";

Simpan perubahan Anda, lalu commit dan push ke GitHub Pages Anda.

🔑 Kredensial Akun Uji Coba (Demo Accounts)

Jika Anda ingin mencoba fitur login dan simulasi sebelum menghubungkan API URL asli, silakan gunakan kredensial bawaan berikut:

Akses Admin (Desktop Control Room):

Username: admin

Password: admin123

Akses Timses (Mobile Field Form):

Username: timses1

Password: timses123
