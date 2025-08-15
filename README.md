# Ilmu Falak - Solar Position Calculator

Aplikasi web untuk perhitungan posisi matahari dan arah bayangan dalam konteks Ilmu Falak (Astronomi Islam). Aplikasi ini membantu dalam menentukan arah kiblat menggunakan metode perhitungan posisi matahari dan bayangan.

## 📌 Deskripsi

Ilmu Falak Solar Position Calculator adalah aplikasi berbasis web yang dirancang untuk membantu dalam:
- Perhitungan posisi matahari berdasarkan koordinat dan waktu
- Penentuan arah bayangan matahari
- Visualisasi kompas digital untuk arah matahari dan bayangan
- Integrasi dengan GPS untuk mendapatkan koordinat otomatis
- Kalkulasi presisi menggunakan koordinat DMS (Degrees, Minutes, Seconds)

## 🚀 Teknologi

- **React 18** - Library UI
- **TypeScript** - Type-safe JavaScript  
- **Vite** - Build tool dan dev server
- **Apollo Client** - GraphQL client untuk komunikasi dengan backend
- **SunCalc** - Library untuk perhitungan posisi matahari
- **Moment.js** - Library untuk manipulasi tanggal dan waktu
- **React Geolocated** - Hooks untuk akses GPS/geolokasi
- **React Full Screen** - Component untuk mode fullscreen

## 📦 Instalasi

### Prasyarat
- Node.js >= 18.0.0
- npm atau yarn atau pnpm

### Langkah Instalasi

1. Clone repository
```bash
git clone https://github.com/IF-Apps/ilmu-falak-fe.git
cd ilmu-falak-fe
```

2. Install dependencies
```bash
npm install
```

3. Jalankan development server
```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:5173`

## 🛠️ Scripts

```bash
# Development
npm run dev          # Menjalankan dev server (dengan --host untuk external access)

# Build
npm run build        # Build untuk production (TypeScript check + Vite build)
npm run preview      # Preview production build

# Linting
npm run lint         # Menjalankan ESLint untuk code quality check
```

## 📁 Struktur Folder

```
ilmu-falak-fe/
├── src/
│   ├── assets/          # Static assets (images, icons)
│   ├── util/            # Utility functions untuk perhitungan
│   │   └── scriptUtil.ts # Script untuk kalkulasi solar position
│   ├── App.tsx          # Main App component
│   ├── App.css          # Styling untuk aplikasi
│   ├── main.tsx         # Entry point
│   └── index.css        # Global CSS styles
├── public/              # Public assets (compass.png, icons)
├── eslint.config.js     # ESLint configuration
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Vite configuration
└── package.json         # Dependencies dan scripts
```

## 🎯 Fitur Utama

### 1. Input Koordinat DMS
- Input latitude dan longitude dalam format Degrees, Minutes, Seconds
- Pemilihan arah mata angin (N, S, E, W)
- Auto-detection koordinat menggunakan GPS/geolokasi
- Validasi input koordinat

### 2. Perhitungan Posisi Matahari
- Kalkulasi azimuth matahari berdasarkan koordinat dan waktu
- Perhitungan elevasi matahari
- Integrasi dengan backend GraphQL untuk akurasi tinggi
- Support timezone dan waktu lokal

### 3. Kompas Digital
- Visualisasi arah matahari dengan jarum kompas
- Visualisasi arah bayangan matahari
- Mode fullscreen untuk penggunaan di lapangan
- Compass needle yang responsif

### 4. Interface Responsif
- Design modern dan user-friendly
- Form input yang terstruktur dengan baik
- Real-time update hasil perhitungan
- Mobile-friendly interface

## 🔧 Konfigurasi

### Environment Variables

| Variable | Deskripsi | Default |
|----------|-----------|---------|
| `VITE_API_URL` | URL backend GraphQL API | - |
| `VITE_APP_NAME` | Nama aplikasi | `Falak Calculator` |

### GraphQL Backend

Aplikasi ini terhubung dengan backend GraphQL yang menyediakan query `solarPosition` dengan parameter:
- `lat`: Koordinat latitude dalam format DMS
- `lon`: Koordinat longitude dalam format DMS  
- `dateTime`: Waktu observasi dalam format UTC

Response dari API mencakup:
- `solarAzimuth`: Azimuth matahari dalam derajat
- `shadowAzimuth`: Azimuth bayangan dalam derajat
- `solarElevation`: Elevasi matahari
- `solarDeclination`: Deklinasi matahari
- `hourAngle`: Sudut jam matahari

## 📱 Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🤝 Kontribusi

Kami menerima kontribusi! Untuk berkontribusi:

1. Fork repository
2. Buat branch fitur (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📝 Lisensi

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.

## 📞 Kontak

- Repository: [GitHub](https://github.com/IF-Apps/ilmu-falak-fe)
- Issues: [GitHub Issues](https://github.com/IF-Apps/ilmu-falak-fe/issues)

## 🙏 Acknowledgments

- SunCalc library untuk perhitungan astronomi
- Apollo GraphQL untuk data management
- React community untuk tools dan library
- Open source contributors

---

**Note**: Project ini dikembangkan untuk keperluan pembelajaran dan penelitian Ilmu Falak.
