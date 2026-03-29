
import { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';

export type UserRole = 'provider' | 'receiver' | 'volunteer' | 'admin_manager' | 'super_admin' | null;

export interface UserData {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'pending' | 'suspended';
  points: number;
  joinDate: string;
  phone?: string;
  address?: string;
  avatar?: string;
  password?: string;
  isNewUser?: boolean; // Field baru: true (1) = tampilkan tour, false (0) = sembunyikan
  selected_badge_id?: number | string;
}

export interface ImpactBreakdownItem {
  name: string;
  weightKg: number;
  factor: number;
  result: number;
  category: string;
}
// ... rest of the file remains unchanged
export interface SocialImpactData {
  totalPoints: number;
  co2Saved: number;
  waterSaved: number;
  landSaved: number;
  wasteReduction: number;
  totalPotentialPoints?: number;
  level?: string;
  // Detailed breakdown fields for persistence
  co2Breakdown?: ImpactBreakdownItem[];
  socialBreakdown?: ImpactBreakdownItem[];
  portionCount?: number;
  co2PerPortion?: number;
  pointsPerPortion?: number;
}

export interface FoodItem {
  id: string;
  providerId?: string;
  providerPhone?: string;
  addressId?: string;
  name: string;
  description?: string;
  quantity: string;
  initialQuantity: number;
  currentQuantity: number;
  minQuantity?: number;
  maxQuantity?: number;
  quantityUnit?: string;
  weightPerUnit?: number;
  expiryTime: string;
  createdAt: string;
  distributionStart?: string;
  distributionEnd?: string;
  imageUrl: string;
  providerName: string;
  location?: { lat: number; lng: number; address: string; addressId?: string };
  status: 'available' | 'claimed' | 'completed' | 'expired';
  deliveryMethod: 'pickup' | 'delivery' | 'both';
  aiVerification?: {
    isEdible: boolean;
    halalScore: number;
    reason?: string;
    ingredients?: string[];
  };
  socialImpact?: SocialImpactData;
}

export interface ClaimHistoryItem {
  id: string;
  foodId: string;
  providerId?: string;
  receiverId?: string;
  receiverName?: string;
  receiverPhone?: string;
  volunteerId?: string;
  foodName: string;
  providerName: string;
  date: string;
  status: 'active' | 'completed' | 'cancelled';
  isScanned?: boolean;
  isReported?: boolean;
  reportReason?: string;
  reportDescription?: string;
  reportEvidence?: string[];
  imageUrl: string;
  uniqueCode?: string;
  claimedQuantity?: string;
  deliveryMethod?: 'pickup' | 'delivery';
  location?: { lat: number; lng: number; address: string; label?: string };
  providerLocation?: { lat: number; lng: number; address: string; label?: string };
  receiverLocation?: { lat: number; lng: number; address: string; label?: string };
  distributionHours?: { start: string; end: string };
  description?: string;
  socialImpact?: SocialImpactData;
  rating?: number;
  review?: string;
  reviewMedia?: string[];
  courierName?: string;
  courierStatus?: 'picking_up' | 'delivering' | 'completed';
}

export interface SavedItem {
  id: string;
  name: string;
  provider: string;
  image: string;
  status: 'available' | 'claimed' | 'expired';
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface BroadcastMessage {
  id: string;
  title: string;
  content: string;
  target: 'all' | 'provider' | 'volunteer' | 'receiver';
  status: 'sent' | 'draft';
  sentAt: string;
  readCount: number;
}

export interface Address {
  id: string;
  userId?: string;
  role?: UserRole;
  label: string;
  fullAddress: string;
  contactName: string;
  contactPhone: string;
  isPrimary: boolean;
  lat?: number;
  lng?: number;
}

export interface Quote {
  text: string;
  author: string;
}

export interface SocialTier {
  id: string;
  name: string;
  minPoints: number;
  benefits: string[];
  color: string;
  icon: string | ReactNode;
}

export interface Rule {
  action: string;
  points: number;
  description: string;
}

export interface SocialSystemConfig {
  tiers: SocialTier[];
  rules: Rule[];
}

export interface Badge {
  id: string;
  name: string;
  role: 'all' | 'provider' | 'volunteer' | 'receiver';
  minPoints: number;
  icon: string | ReactNode;
  description: string;
  image?: string;
  awardedTo?: number;
}

export interface VolunteerTask {
  id: string | number;
  claimId?: string;
  from: string;
  to: string;
  distance: number;
  distanceStr: string;
  items: string;
  status: 'available' | 'active' | 'history';
  stage?: 'pickup' | 'dropoff';
  imageUrl: string;
  description: string;
  ingredients?: string[];
  foodCondition?: number;
  donorLocation?: { lat: number; lng: number; address: string };
  receiverLocation?: { lat: number; lng: number; address: string };
  donorOpenHours?: string;
  receiverDistanceStr?: string;
  quantity?: string;
  donorPhone?: string;
  receiverPhone?: string;
  points: number;
}

export interface RankLevel {
    id: number;
    name: string;
    minPoints: number;
    icon: any; 
    benefits: string[];
}

export interface DailyQuest {
    id: number;
    title: string;
    target: number;
    current: number;
    reward: number;
    completed: boolean;
}

export interface LeaderboardItem {
    id: number;
    name: string;
    points: number;
    rank: number;
    avatar: string;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'report';
  title: string;
  message: string | ReactNode; // Allow JSX
  date: string;
  isRead: boolean;
  priority?: 'high' | 'medium' | 'low';
}

export interface Report {
  id: string;
  orderId?: string;
  foodName: string;
  title: string;
  description: string;
  date: string;
  status: 'new' | 'investigating' | 'resolved' | 'dismissed';
  reporter: string;
  target?: string;
  isUrgent: boolean;
  category?: string;
  priority?: 'high' | 'medium';
  type?: string;
  evidenceUrl?: string;
}

export interface DistributionTask {
    id: string;
    volunteer: string;
    from: string;
    to: string;
    status: 'pending' | 'picking_up' | 'delivering' | 'completed';
    startTime: string;
    priority: 'normal' | 'high';
    distance: string;
}

export interface AdminUser {
    id: string;
    name: string;
    email: string;
    role: 'super_admin' | 'admin_manager';
    permissions: string[];
    status: 'active' | 'suspended';
    lastLogin: string;
}

export interface SystemLog {
    id: string;
    timestamp: string;
    actor: string;
    action: string;
    details: string;
    severity: 'info' | 'warning' | 'critical';
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: ReactNode;
  leftAddon?: ReactNode;
  rightElement?: ReactNode;
  containerClassName?: string;
  labelClassName?: string;
}

export type DeliveryMethod = 'pickup' | 'delivery' | 'both';

export interface ProviderOrder {
    id: string;
    uniqueCode?: string;
    foodName: string;
    description: string;
    quantity: string;
    imageUrl: string;
    status: 'active' | 'claimed' | 'completed' | 'cancelled';
    isScanned?: boolean;
    deliveryMethod: 'pickup' | 'delivery';
    receiver: {
        name: string;
        avatar: string;
        phone: string;
        address: string;
    };
    courier?: {
        name: string;
        avatar: string;
        phone: string;
    };
    timestamps: {
        claimedAt?: string;
        pickedUpAt?: string;
        completedAt?: string;
    };
    rating?: {
        stars: number;
        comment: string;
        mediaUrls?: string[];
    };
    report?: {
        issue: string;
        description: string;
        evidenceUrl?: string;
        isUrgent: boolean;
    };
    impact?: {
        points: number;
        co2: number;
    };
}

export interface Review {
    id: string;
    orderId?: string;
    foodName?: string;
    user: string;
    rating: number;
    comment: string;
    date: string;
    mediaUrls?: string[];
}
