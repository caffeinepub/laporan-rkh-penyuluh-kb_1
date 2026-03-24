# Laporan RKH Penyuluh KB

## Current State
Format cetak PDF laporan individual menggunakan tabel horizontal. Lampiran langsung di bawah tanpa pemisahan halaman.

## Requested Changes (Diff)

### Add
- Halaman lampiran terpisah per lampiran dengan header biru
- Daftar lampiran di halaman utama

### Modify
- Detail laporan: dari tabel horizontal ke layout vertikal label-nilai
- Header: logo BKKBN kiri, judul kanan
- Tanda tangan: Yang Membuat Laporan di kanan

### Remove
- Tabel horizontal banyak kolom pada cetak individual

## Implementation Plan
1. Update print section RiwayatLaporanPage.tsx ke format vertikal
2. Section LAMPIRAN mendaftar lampiran
3. Halaman lampiran terpisah dengan page-break
