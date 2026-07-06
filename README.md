# Dokumen Starter Kit

Fondasi aplikasi desktop berbasis Electron + React + TypeScript + Tailwind CSS, dengan Python sebagai document engine.

## Prasyarat Windows

- Node.js 22 LTS atau versi yang memenuhi syarat Vite terbaru.
- Python 3.12+ yang dapat dipanggil melalui `py -3`.
- Git opsional.

## Instalasi dependency

```powershell
npm install
```

Untuk tahap fondasi ini, jangan jalankan aplikasi dahulu apabila mengikuti alur pembangunan semua fondasi sebelum first run.

## Pemeriksaan tanpa membuka aplikasi

```powershell
npm run typecheck
npm run python:check
```

## First run nanti

```powershell
npm run dev
```

## Struktur

- `electron/`: main process, preload, dan IPC desktop.
- `src/`: React renderer dan tampilan aplikasi.
- `python-engine/`: engine pemrosesan dokumen lokal.
- `resources/`: ikon dan binary tambahan saat packaging.
