# 📑 PANDUAN PEREKAYASAAN DATABASE RELASIONAL (GOOGLE SHEETS)

Agar seluruh arsitektur backend `Kode.gs` dapat berjalan dengan lancar tanpa error relasional, pastikan Anda membuat **6 nama Sheet** di dalam Google Spreadsheet Anda dengan struktur kolom persis (dimulai dari Kolom A baris ke-1) sebagai berikut:

### 1. Sheet: `app_settings`
| Kolom A | Kolom B | Kolom C | Kolom D | Kolom E |
| :--- | :--- | :--- | :--- | :--- |
| **id_setting** | **nama_calon_kades** | **drive_id_foto_login** | **drive_id_foto_dashboard** | **updated_at** |
*Isi Baris ke-2 dengan dummy data awal, misal: `SET-01`, `H. Ahmad Fauzi`, ``, ``, `2026-07-20`*

### 2. Sheet: `users`
| Kolom A | Kolom B | Kolom C | Kolom D | Kolom E | Kolom F | Kolom G |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **user_id** | **username** | **password_hash** | **nama_lengkap** | **role** | **tps_id** | **status_aktif** |
*Dummy Data untuk Testing Akses:*
* `USR-01` | `admin` | `admin123` | `Budi Setiawan` | `Admin` |  | `Active`
* `USR-02` | `timses1` | `timses123` | `Rahmat Lapangan` | `Timses` |  | `Active`
* `USR-03` | `saksi1` | `saksi123` | `Agus Saksi` | `Saksi` | `TPS-01` | `Active`

### 3. Sheet: `data_dpt`
| Kolom A | Kolom B | Kolom C | Kolom D | Kolom E | Kolom F | Kolom G |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **nik** | **no_kk** | **nama_warga** | **tps_id** | **dusun** | **rt** | **rw** |
*Dummy Data untuk Testing Input Validasi:*
* `3201010101010001` | `3201010101019999` | `Supardi` | `TPS-01` | `Krajan` | `01` | `02`

### 4. Sheet: `warga_voters`
| Kolom A | Kolom B | Kolom C | Kolom D | Kolom E |
| :--- | :--- | :--- | :--- | :--- |
| **voter_id** | **nik** | **klasifikasi** | **input_by_user_id** | **created_at** |

### 5. Sheet: `tps_real_count`
| Kolom A | Kolom B | Kolom C | Kolom D | Kolom E | Kolom F | Kolom G | Kolom H | Kolom I |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **tps_id** | **nama_tps** | **total_dpt_tps** | **suara_calon_kita** | **suara_lawan_1** | **suara_lawan_2** | **suara_tidak_sah** | **saksi_user_id** | **status_lock_suara** |
*Dummy Data Awal:*
* `TPS-01` | `TPS 01 Desa Krajan` | `300` | `0` | `0` | `0` | `0` |  | `No`

### 6. Sheet: `agenda_laporan`
| Kolom A | Kolom B | Kolom C | Kolom D | Kolom E | Kolom F |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **laporan_id** | **tanggal_agenda** | **nama_kegiatan** | **deskripsi** | **foto_drive_id** | **submitted_by** |

# 📑 PVS DATABASE AND CONFIGURATION SCHEMATICS v5.6

Dokumentasi spesifikasi struktur data relasional Google Sheets untuk mendukung fungsionalitas core logic `Kode.gs`. 

### 📐 Panduan Penamaan Sheet & Header Kolom (Baris 1)

#### 1. Sheet: `app_settings`
*   **Kolom A:** `id_setting`
*   **Kolom B:** `nama_calon_kades`
*   **Kolom C:** `drive_id_foto_login`
*   **Kolom D:** `drive_id_foto_dashboard`
*   **Kolom E:** `updated_at`

#### 2. Sheet: `users`
*   **Kolom A:** `user_id`
*   **Kolom B:** `username`
*   **Kolom C:** `password_hash`
*   **Kolom D:** `nama_lengkap`
*   **Kolom E:** `role`
*   **Kolom F:** `tps_id`
*   **Kolom G:** `status_aktif`

#### 3. Sheet: `data_dpt`
*   **Kolom A:** `nik`
*   **Kolom B:** `no_kk`
*   **Kolom C:** `nama_warga`
*   **Kolom F:** `tps_id`
*   **Kolom E:** `dusun`
*   **Kolom F:** `rt`
*   **Kolom G:** `rw`

#### 4. Sheet: `warga_voters`
*   **Kolom A:** `voter_id`
*   **Kolom B:** `nik`
*   **Kolom C:** `klasifikasi`
*   **Kolom D:** `input_by_user_id`
*   **Kolom E:** `created_at`

#### 5. Sheet: `tps_real_count`
*   **Kolom A:** `tps_id`
*   **Kolom B:** `nama_tps`
*   **Kolom C:** `total_dpt_tps`
*   **Kolom D:** `suara_calon_kita`
*   **Kolom E:** `suara_lawan_1`
*   **Kolom F:** `suara_lawan_2`
*   **Kolom G:** `suara_tidak_sah`
*   **Kolom H:** `saksi_user_id`
*   **Kolom I:** `status_lock_suara`

#### 6. Sheet: `agenda_laporan`
*   **Kolom A:** `laporan_id`
*   **Kolom B:** `tanggal_agenda`
*   **Kolom C:** `nama_kegiatan`
*   **Kolom D:** `deskripsi`
*   **Kolom E:** `foto_drive_id`
*   **Kolom F:** `submitted_by`
