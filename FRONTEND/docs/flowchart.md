# Flowchart Waiting List App Puskesmas Sekemala

Flowchart ini menggambarkan alur utama aplikasi waiting list, yaitu alur pasien mengambil/cek tiket dan alur admin mengelola status antrian.

## Flowchart Utama

```mermaid
flowchart TD
  A([Mulai]) --> B[Halaman Home]
  B --> C{Pilih jenis pengguna}

  C -->|Pasien| D[Masuk halaman input tiket]
  D --> E[Input nama pasien dan kode tiket dari admin]
  E --> F{Data lengkap?}
  F -->|Tidak| G[Tampilkan pesan error]
  G --> E
  F -->|Ya| H{Kode tiket ditemukan dan nama sesuai?}
  H -->|Tidak| G
  H -->|Ya| I[Halaman tiket berhasil divalidasi]
  I --> J[Halaman informasi tiket]
  J --> K[Tampilkan nomor tiket dan status dari data admin]
  K --> L([Selesai])

  C -->|Admin| M[Halaman login admin]
  M --> N[Input nama admin, ID admin, dan password]
  N --> O{Data login lengkap?}
  O -->|Tidak| P[Tampilkan pesan error]
  P --> N
  O -->|Ya| Q[Simpan sesi admin]
  Q --> R[Halaman sukses login]
  R --> S[Dashboard admin]
  S --> T{Pilih aksi admin}

  T -->|Tambah tiket| U[Halaman input tiket admin]
  U --> V[Hubungkan tiket ke pasien]
  V --> W[Input nama pasien dan kode tiket]
  W --> X{Data lengkap?}
  X -->|Tidak| Y[Tampilkan pesan error]
  Y --> W
  X -->|Ya| Z[Simpan tiket status MENUNGGU]
  Z --> AA[Halaman tiket dibuat]
  AA --> S

  T -->|Kelola status| AB[Pilih nomor tiket]
  AB --> AC{Status baru}
  AC -->|MENUNGGU| AD[Update status MENUNGGU]
  AC -->|DIPANGGIL| AE[Update status DIPANGGIL dan simpan currentCallTicket]
  AC -->|DIBATALKAN| AF[Update status DIBATALKAN]
  AC -->|SELESAI| AG[Update status SELESAI dan hapus currentCallTicket jika aktif]
  AD --> AH[Refresh data tiket]
  AE --> AH
  AF --> AH
  AG --> AH
  AH --> S

  T -->|Lihat akun| AI[Halaman akun admin]
  AI --> AJ{Logout?}
  AJ -->|Tidak| S
  AJ -->|Ya| AK[Hapus sesi admin]
  AK --> M
```

## Flowchart Pasien

```mermaid
flowchart TD
  A([Mulai]) --> B[Buka aplikasi]
  B --> C[Pilih menu pasien]
  C --> D[Input nama pasien]
  D --> E[Input kode tiket dari admin]
  E --> F{Nama dan kode tiket sudah diisi?}
  F -->|Tidak| G[Tampilkan error]
  G --> D
  F -->|Ya| H{Tiket sudah dibuat admin?}
  H -->|Tidak| G
  H -->|Ya| I{Nama sesuai dengan tiket?}
  I -->|Tidak| G
  I -->|Ya| J[Tampilkan halaman welcome tiket]
  J --> K[Buka informasi tiket]
  K --> L[Cari tiket berdasarkan kode]
  L --> M{Tiket ditemukan?}
  M -->|Ya| N[Tampilkan kode tiket dan status terbaru dari admin]
  M -->|Tidak| O[Tampilkan pesan tiket tidak ditemukan]
  N --> P([Selesai])
  O --> P
```

## Flowchart Admin

```mermaid
flowchart TD
  A([Mulai]) --> B[Login admin]
  B --> C[Input nama admin, ID admin, password]
  C --> D{Form lengkap?}
  D -->|Tidak| E[Tampilkan error]
  E --> C
  D -->|Ya| F[Simpan adminSession]
  F --> G[Masuk dashboard admin]

  G --> H{Pilih menu}
  H -->|Tambah tiket| I[Generate kode tiket berikutnya]
  I --> J[Input nama pasien dan kode tiket]
  J --> K{Form lengkap?}
  K -->|Tidak| L[Tampilkan error]
  L --> J
  K -->|Ya| M[Simpan tiket baru]
  M --> N[Status tiket MENUNGGU]
  N --> G

  H -->|Kelola tiket| O[Pilih tiket]
  O --> P{Tentukan status}
  P -->|MENUNGGU| Q[Update tiket menjadi MENUNGGU]
  P -->|DIPANGGIL| R[Update tiket menjadi DIPANGGIL]
  R --> S[Simpan kode tiket sebagai currentCallTicket]
  P -->|DIBATALKAN| T[Update tiket menjadi DIBATALKAN]
  P -->|SELESAI| U[Update tiket menjadi SELESAI]
  U --> V[Hapus currentCallTicket jika tiket sedang dipanggil]

  Q --> W[Refresh dashboard]
  S --> W
  T --> W
  V --> W
  W --> G

  H -->|Akun admin| X[Lihat data akun]
  X --> Y{Logout?}
  Y -->|Tidak| G
  Y -->|Ya| Z[Hapus adminSession]
  Z --> AA([Selesai])
```

## Keterangan Simbol

| Simbol | Arti |
| --- | --- |
| Oval | Mulai atau selesai proses |
| Persegi panjang | Proses atau aktivitas |
| Belah ketupat | Percabangan atau keputusan |
| Panah | Arah alur proses |

## Catatan

Flowchart ini mengikuti fitur yang ada di aplikasi:

- Pasien dapat memasukkan nama dan kode tiket.
- Tiket disimpan dengan status awal `MENUNGGU`.
- Admin dapat login, membuat tiket, memilih tiket, dan mengubah status.
- Status tiket yang digunakan adalah `MENUNGGU`, `DIPANGGIL`, `DIBATALKAN`, dan `SELESAI`.
- Tiket yang sedang dipanggil disimpan sebagai `currentCallTicket`.
