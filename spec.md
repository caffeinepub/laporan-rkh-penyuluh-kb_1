# Laporan RKH Penyuluh KB

## Current State
Proyek baru, belum ada implementasi.

## Requested Changes (Diff)

### Add
- Halaman registrasi: form isi data (Nama Lengkap, NIP, Jabatan, Unit Kerja, Wilayah Kerja, Nomor HP, Password)
- Sistem token akses: setelah daftar, user menunggu admin set token; user input token untuk masuk dashboard
- Dashboard: ringkasan statistik laporan bulan ini
- Input Laporan RKH: form (Tanggal Kegiatan, Kegiatan, Sasaran, Jumlah Sasaran, Lokasi, Hasil Kegiatan, Keterangan opsional, Lampiran: Dokumen/PDF maks 1 file + Gambar/Foto maks 1 file)
- Riwayat Laporan: tabel dengan filter Bulan/Tahun, tombol Cetak Laporan (PDF), edit & delete laporan
- Profil Saya: edit profil + upload tanda tangan
- Admin Panel tabs: Pengguna (list user + total laporan), Semua Laporan (semua laporan semua user), Rekap (rekap per bulan/tahun), Token Akses (set token per user)
- PDF download: laporan RKH resmi format BKKBN dengan tabel kegiatan + tanda tangan + lampiran foto/dokumen tergabung
- Role: admin (NIP: 123456, role admin) dan penyuluh biasa

### Modify
- (tidak ada, proyek baru)

### Remove
- (tidak ada)

## Implementation Plan
1. Backend Motoko: user profiles, laporan RKH (tanggal, kegiatan, sasaran, jumlah, lokasi, hasil, keterangan, lampiran refs), token akses per user, role admin
2. Blob storage untuk lampiran (dokumen PDF dan gambar foto) dan tanda tangan
3. Authorization dengan role admin/user
4. User approval flow dengan token
5. Frontend: halaman login/register, token entry, dashboard, input laporan, riwayat laporan, profil, admin panel
6. PDF generation menggunakan jsPDF di frontend dengan data laporan + foto
