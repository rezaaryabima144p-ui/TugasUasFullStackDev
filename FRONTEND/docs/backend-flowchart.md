# Backend Flowchart Waiting List App Puskesmas Sekemala

Dokumen ini menjelaskan alur sistem yang perlu dipikirkan backend. Fokus utamanya adalah autentikasi admin, pembuatan tiket oleh admin, validasi tiket pasien, update status, dan forgot password yang aman.

## Flowchart Sistem Utama

```mermaid
flowchart TD
  A([Mulai]) --> B{Jenis pengguna}

  B -->|Admin| C[Login admin]
  C --> D[Backend validasi admin_code dan password]
  D --> E{Valid?}
  E -->|Tidak| F[Kirim error login]
  F --> C
  E -->|Ya| G[Buat session/token]
  G --> H[Dashboard admin]

  H --> I{Aksi admin}
  I -->|Buat tiket| J[Input pasien, poli, dokter, ruangan]
  J --> K[Backend validasi data]
  K --> L{Valid?}
  L -->|Tidak| M[Kirim error validasi]
  M --> J
  L -->|Ya| N[Create patient jika belum ada]
  N --> O[Generate ticket_code]
  O --> P[Simpan ticket status MENUNGGU]
  P --> Q[Simpan status history]
  Q --> H

  I -->|Ubah status| R[Pilih tiket dan status baru]
  R --> S[Backend validasi tiket dan status]
  S --> T{Valid?}
  T -->|Tidak| U[Kirim error]
  U --> H
  T -->|Ya| V[Update status ticket]
  V --> W[Simpan status history]
  W --> X{Status baru}
  X -->|DIPANGGIL| Y[Buat/tandai ticket_call aktif]
  X -->|SELESAI| Z[Tutup ticket_call aktif]
  X -->|DIBATALKAN| AA[Tandai tiket dibatalkan]
  X -->|MENUNGGU| AB[Kembalikan status menunggu]
  Y --> H
  Z --> H
  AA --> H
  AB --> H

  I -->|Logout| AC[Hapus session/token]
  AC --> AD([Selesai])

  B -->|Pasien| AE[Input nama pasien dan kode tiket]
  AE --> AF[Backend verifikasi ticket_code dan nama pasien]
  AF --> AG{Cocok?}
  AG -->|Tidak| AH[Kirim error tiket tidak valid]
  AH --> AE
  AG -->|Ya| AI[Kirim detail tiket]
  AI --> AJ[Frontend tampilkan status tiket]
  AJ --> AK[Frontend refresh/polling status]
  AK --> AI
```

## Flowchart Login Admin

```mermaid
flowchart TD
  A([Mulai]) --> B[Admin input nama, ID admin, password]
  B --> C[POST /api/admin/login]
  C --> D[Backend cari admin by admin_code]
  D --> E{Admin ditemukan dan ACTIVE?}
  E -->|Tidak| F[Response login gagal generik]
  E -->|Ya| G[Compare password dengan password_hash]
  G --> H{Password cocok?}
  H -->|Tidak| F
  H -->|Ya| I[Update last_login_at]
  I --> J[Buat session/token]
  J --> K[Response data admin dan token]
  K --> L([Selesai])
```

## Flowchart Buat Tiket Admin

```mermaid
flowchart TD
  A([Mulai]) --> B[Admin pilih poli, dokter, ruangan]
  B --> C[Admin input nama pasien]
  C --> D[POST /api/tickets]
  D --> E[Backend validasi token admin]
  E --> F{Admin valid?}
  F -->|Tidak| G[Response unauthorized]
  F -->|Ya| H[Validasi clinic, doctor, room aktif]
  H --> I{Master data valid?}
  I -->|Tidak| J[Response validation error]
  I -->|Ya| K[Create/find patient]
  K --> L[Generate ticket_code berikutnya]
  L --> M[Create ticket status MENUNGGU]
  M --> N[Create ticket_status_history]
  N --> O[Response detail tiket]
  O --> P([Selesai])
```

## Flowchart Validasi Tiket Pasien

```mermaid
flowchart TD
  A([Mulai]) --> B[Pasien input nama dan kode tiket]
  B --> C[GET /api/tickets/verify]
  C --> D[Backend cari ticket by ticket_code]
  D --> E{Tiket ditemukan?}
  E -->|Tidak| F[Response tiket tidak valid]
  E -->|Ya| G[Compare nama pasien]
  G --> H{Nama cocok?}
  H -->|Tidak| F
  H -->|Ya| I[Response detail tiket]
  I --> J[Frontend tampilkan informasi tiket]
  J --> K([Selesai])
```

## Flowchart Update Status Tiket

```mermaid
flowchart TD
  A([Mulai]) --> B[Admin pilih tiket]
  B --> C[Admin pilih status baru]
  C --> D[PATCH /api/tickets/:ticketCode/status]
  D --> E[Backend validasi token admin]
  E --> F{Admin valid?}
  F -->|Tidak| G[Response unauthorized]
  F -->|Ya| H[Cari tiket]
  H --> I{Tiket ditemukan?}
  I -->|Tidak| J[Response not found]
  I -->|Ya| K[Simpan status lama]
  K --> L[Update status baru]
  L --> M[Create status history]
  M --> N{Status baru}
  N -->|MENUNGGU| O[Pastikan tidak ada call aktif]
  N -->|DIPANGGIL| P[Create ticket_call ACTIVE dan set called_at]
  N -->|DIBATALKAN| Q[Set canceled_at dan cancel call aktif jika ada]
  N -->|SELESAI| R[Set finished_at dan tutup call aktif]
  O --> S[Response detail tiket]
  P --> S
  Q --> S
  R --> S
  S --> T([Selesai])
```

## Flowchart Forgot Password Aman

```mermaid
flowchart TD
  A([Mulai]) --> B[Admin input ID admin dan email]
  B --> C[POST /api/admin/forgot-password]
  C --> D[Backend validasi format email]
  D --> E{Format valid?}
  E -->|Tidak| F[Response error format]
  E -->|Ya| G[Cari admin by ID dan email]
  G --> H{Data cocok dan admin aktif?}
  H -->|Tidak| I[Response generik]
  H -->|Ya| J[Generate reset token]
  J --> K[Simpan token_hash dan expires_at]
  K --> L[Kirim link reset ke email]
  L --> I[Response generik]
  I --> M([Selesai])
```

## Catatan Keamanan Backend

| Area | Rekomendasi |
| --- | --- |
| Admin account | Dibuat manual lewat seeder atau superadmin, bukan sign up publik |
| Password | Simpan `password_hash`, jangan simpan password asli |
| Login error | Gunakan pesan generik agar akun tidak mudah ditebak |
| Session | Gunakan HttpOnly cookie atau token yang aman |
| Forgot password | Gunakan token sekali pakai, expired 10-15 menit |
| Rate limit | Batasi login dan forgot password |
| Audit | Simpan history perubahan status tiket |
| Authorization | Semua endpoint admin wajib cek token/session |

## Kontrak Data Frontend

### Login Admin

Request:

```json
{
  "adminId": "ADM001",
  "password": "AdminSekemala2026!"
}
```

Response sukses:

```json
{
  "admin": {
    "adminId": "ADM001",
    "name": "ADMIN SEKEMALA",
    "email": "admin@puskesmassekemala.test",
    "phone": "081234567890",
    "role": "SUPER_ADMIN"
  },
  "token": "session-or-jwt-token"
}
```

### Buat Tiket

Request:

```json
{
  "patientName": "Nurul",
  "clinicId": 2,
  "doctorId": 1,
  "roomId": 2
}
```

Response:

```json
{
  "ticketCode": "001",
  "patientName": "Nurul",
  "clinicName": "Poli Umum",
  "doctorName": "drg. Andi Pratama, Sp.KG",
  "roomName": "Ruangan 2",
  "status": "MENUNGGU"
}
```

### Verifikasi Tiket Pasien

Request:

```txt
GET /api/tickets/verify?ticketCode=001&patientName=Nurul
```

Response:

```json
{
  "ticketCode": "001",
  "patientName": "Nurul",
  "clinicName": "Poli Umum",
  "doctorName": "drg. Andi Pratama, Sp.KG",
  "roomName": "Ruangan 2",
  "status": "DIPANGGIL"
}
```

