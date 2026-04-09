
import { Quote, SocialSystemConfig, Badge } from './types';

export const LOGIN_QUOTES: Quote[] = [
  {
    text: "Jika kamu tidak bisa memberi makan seratus orang, maka berilah makan satu orang saja.",
    author: "Mother Teresa"
  },
  {
    text: "Membuang makanan sama dengan mencuri dari meja mereka yang miskin dan lapar.",
    author: "Pope Francis"
  },
  {
    text: "Tidak ada cinta yang lebih tulus daripada cinta terhadap makanan yang dibagikan.",
    author: "George Bernard Shaw"
  },
  {
    text: "Menyelamatkan makanan adalah langkah nyata untuk menjaga bumi dan sesama.",
    author: "Food AI Rescue"
  }
];

// Gambar Flat Lay Makanan dengan tone gelap/warm yang elegan
export const BACKGROUND_IMAGE = "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=1080&auto=format&fit=crop";

export const QR_HANDOVER_POINTS = 50;
export const REVIEW_POINTS = 10;

export const SOCIAL_SYSTEM: { [key: string]: SocialSystemConfig } = {
  provider: {
    tiers: [
      { id: '1', name: "Donatur Pemula", minPoints: 0, benefits: ["Akses Dashboard Dasar"], color: "bg-stone-500", icon: "🌱" },
      { id: '2', name: "Sahabat Pangan", minPoints: 500, benefits: ["Lencana Profil", "Prioritas Distribusi"], color: "bg-blue-500", icon: "🤝" },
      { id: '3', name: "Juragan Berkah", minPoints: 2000, benefits: ["Verified Badge", "Analitik Lanjutan", "Support Prioritas"], color: "bg-yellow-500", icon: "👑" },
      { id: '4', name: "Sultan Donasi", minPoints: 5000, benefits: ["Partner Eksklusif", "Liputan Media", "Akses API"], color: "bg-purple-600", icon: "💎" }
    ],
    rules: [
      { action: "Donasi Makanan", points: 10, description: "Per 1 Kg makanan yang berhasil didonasikan" },
      { action: "Respon Cepat", points: 2, description: "Merespon request < 15 menit" },
      { action: "Rating Sempurna", points: 5, description: "Mendapat bintang 5 dari penerima" },
      { action: "Zero Waste Streak", points: 50, description: "Tidak ada donasi expired dalam sebulan" }
    ]
  },
  volunteer: {
    tiers: [
      { id: '1', name: "Relawan Baru", minPoints: 0, benefits: ["Akses Misi Standar"], color: "bg-stone-500", icon: "🚶" },
      { id: '2', name: "Pengantar Harapan", minPoints: 1000, benefits: ["Akses Misi Urgent", "Merchandise Kaos"], color: "bg-green-500", icon: "🚴" },
      { id: '3', name: "Pahlawan Pangan", minPoints: 5000, benefits: ["Akses Misi Bulk (Mobil)", "Voucher BBM"], color: "bg-orange-500", icon: "🚗" },
      { id: '4', name: "Legenda Penyelamat", minPoints: 10000, benefits: ["Undangan Gala Dinner", "Sertifikat Gubernur"], color: "bg-red-600", icon: "🦸" }
    ],
    rules: [
      { action: "Misi Selesai", points: 50, description: "Menyelesaikan 1 pengantaran standar" },
      { action: "Jarak Tempuh", points: 5, description: "Per 1 KM jarak pengantaran" },
      { action: "Misi Urgent", points: 25, description: "Bonus mengambil misi prioritas tinggi" },
      { action: "Verifikasi QC", points: 15, description: "Membantu cek kualitas makanan di lokasi" }
    ]
  },
  receiver: {
    tiers: [
      { id: '1', name: "Member Baru", minPoints: 0, benefits: ["Maks 1 Klaim Aktif"], color: "bg-stone-400", icon: "👋" },
      { id: '2', name: "Terpercaya (Trusted)", minPoints: 100, benefits: ["Maks 3 Klaim Aktif", "Bisa Request Delivery"], color: "bg-teal-500", icon: "🛡️" },
      { id: '3', name: "Komunitas Inti", minPoints: 500, benefits: ["Prioritas Notifikasi", "Akses Makanan Premium"], color: "bg-indigo-500", icon: "🌟" }
    ],
    rules: [
      { action: "Klaim Sukses", points: 10, description: "Mengambil makanan tepat waktu" },
      { action: "Ulasan Balik", points: 5, description: "Memberi review jujur ke donatur" },
      { action: "Lapor Masalah", points: 15, description: "Melaporkan makanan tidak layak (valid)" },
      { action: "No Show (Minus)", points: -50, description: "Pinalti jika tidak datang tanpa kabar" }
    ]
  }
};

export const ACHIEVEMENT_BADGES: Badge[] = [
  // Provider Badges
  { id: '101', name: 'Zero Waste Hero', role: 'provider', minPoints: 1000, icon: '🌍', description: 'Menyelamatkan lebih dari 100kg makanan.', image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=600' },
  { id: '102', name: 'Community Star', role: 'provider', minPoints: 500, icon: '⭐', description: 'Mendapatkan rata-rata rating 4.8+.', image: 'https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&q=80&w=600' },
  
  // Volunteer Badges
  { id: '201', name: 'Speed Runner', role: 'volunteer', minPoints: 800, icon: '⚡', description: 'Menyelesaikan 10 misi urgent tepat waktu.', image: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=600' },
  { id: '202', name: 'Long Haul', role: 'volunteer', minPoints: 1500, icon: '🚛', description: 'Total jarak tempuh lebih dari 500km.', image: 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&q=80&w=600' },
  
  // Receiver Badges
  { id: '301', name: 'Verified Account', role: 'recipient', minPoints: 100, icon: '🛡️', description: 'Data diri lengkap dan terverifikasi.', image: 'https://images.unsplash.com/photo-1614036634955-ae5e90f9b9eb?auto=format&fit=crop&q=80&w=600' },
  { id: '302', name: 'Food Saver', role: 'recipient', minPoints: 300, icon: '🍱', description: 'Konsisten mengklaim dan mengulas makanan.', image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=600' },
  
  // All
  { id: '401', name: 'Early Adopter', role: 'all', minPoints: 50, icon: '🚀', description: 'Bergabung di fase beta aplikasi.', image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600' },
];
