export interface GrowthPack {
  id: string;
  name: string;
  quantity: number;
  unitLabel: string;
  priceInr: number;
  deliveryInfo: string;
  popular?: boolean;
}

export type PaymentMethodId = 'upi' | 'card' | 'netbanking' | 'wallet';

export interface VerifiedAccount {
  id: string | null;
  username: string;
  profileUrl: string;
  fullName: string | null;
  bio: string | null;
  profilePicUrl: string | null;
  followersCount: number | null;
  followingCount: number | null;
  postsCount: number | null;
  isPrivate: boolean;
  isVerified: boolean;
  externalUrl: string | null;
  categoryName: string | null;
  lookupMode: 'live' | 'unauthenticated_fallback';
  notice?: string;
  verifiedAt: string;
}

export interface OrderConfirmation {
  orderId: string;
  account: VerifiedAccount;
  pack: GrowthPack;
  paymentMethod: PaymentMethodId;
  paymentDetail: string;
  amountPaidInr: number;
  createdAt: string;
}

export interface RecentTransaction {
  id: string;
  maskedHandle: string;
  packSummary: string;
  amountInr: number;
  paymentLabel: string;
  timeAgo: string;
  status: 'Completed' | 'Delivering';
}

export const FOLLOWER_PACKS: GrowthPack[] = [
  {
    id: 'fol-1500',
    name: '1,500 Followers',
    quantity: 1500,
    unitLabel: 'FOLLOWERS',
    priceInr: 129,
    deliveryInfo: 'Starts in 10 mins · 30-day refill',
  },
  {
    id: 'fol-3000',
    name: '3,000 Followers',
    quantity: 3000,
    unitLabel: 'FOLLOWERS',
    priceInr: 249,
    deliveryInfo: 'Starts in 10 mins · 30-day refill',
    popular: true,
  },
  {
    id: 'fol-5000',
    name: '5,000 Followers',
    quantity: 5000,
    unitLabel: 'FOLLOWERS',
    priceInr: 399,
    deliveryInfo: 'Priority start · 45-day refill',
  },
  {
    id: 'fol-10000',
    name: '10,000 Followers',
    quantity: 10000,
    unitLabel: 'FOLLOWERS',
    priceInr: 749,
    deliveryInfo: 'Priority start · 60-day refill',
  },
  {
    id: 'fol-20000',
    name: '20,000 Followers',
    quantity: 20000,
    unitLabel: 'FOLLOWERS',
    priceInr: 1449,
    deliveryInfo: 'Gradual drip · 60-day refill',
  },
  {
    id: 'fol-50000',
    name: '50,000 Followers',
    quantity: 50000,
    unitLabel: 'FOLLOWERS',
    priceInr: 3299,
    deliveryInfo: 'Custom drip · 90-day refill',
  },
];

export const RECENT_TRANSACTIONS: RecentTransaction[] = [
  {
    id: 'IGS-948210',
    maskedHandle: '@rohan****47',
    packSummary: '3,000 FOLLOWERS',
    amountInr: 249,
    paymentLabel: 'UPI',
    timeAgo: '2 mins ago',
    status: 'Completed',
  },
  {
    id: 'IGS-948194',
    maskedHandle: '@ananya****s',
    packSummary: '5,000 FOLLOWERS',
    amountInr: 399,
    paymentLabel: 'PhonePe UPI',
    timeAgo: '6 mins ago',
    status: 'Completed',
  },
  {
    id: 'IGS-948172',
    maskedHandle: '@kiran****fit',
    packSummary: '10,000 FOLLOWERS',
    amountInr: 749,
    paymentLabel: 'Google Pay',
    timeAgo: '11 mins ago',
    status: 'Delivering',
  },
  {
    id: 'IGS-948155',
    maskedHandle: '@studio****19',
    packSummary: '1,500 FOLLOWERS',
    amountInr: 129,
    paymentLabel: 'UPI',
    timeAgo: '18 mins ago',
    status: 'Completed',
  },
];
