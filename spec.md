# Laporan RKH Penyuluh KB

## Current State
Halaman Riwayat Laporan memiliki tombol Edit dan Cetak pada kolom Aksi. Belum ada tombol Delete untuk menghapus laporan. Backend tidak memiliki fungsi deleteRKH.

## Requested Changes (Diff)

### Add
- Fungsi `deleteRKH(action: Action): async ()` di backend (main.mo)
- Entry `deleteRKH` di backend.d.ts
- Tombol delete (ikon Trash2) pada setiap baris di tabel Riwayat Laporan
- Dialog konfirmasi sebelum menghapus (menggunakan AlertDialog atau confirm native)

### Modify
- RiwayatLaporanPage.tsx: tambah state, handler delete, dan tombol Trash2 di kolom Aksi
- Props RiwayatLaporanPage tidak perlu diubah (actor sudah tersedia)

### Remove
- Tidak ada

## Implementation Plan
1. Tambah fungsi `deleteRKH` di main.mo — hapus RKH berdasarkan field `action` milik caller
2. Update backend.d.ts dengan signature `deleteRKH(action: Action): Promise<void>`
3. Update RiwayatLaporanPage.tsx: tambah tombol Trash2, dialog konfirmasi, dan handler yang memanggil actor.deleteRKH
