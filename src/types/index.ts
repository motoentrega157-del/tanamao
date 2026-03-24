import { Timestamp } from 'firebase/firestore';

export interface DeliveryData {
    id?: string;
    origin: string;
    destination: string;
    customerName: string;
    customerPhone: string;
    notes: string;
    status?: string;
    price?: number;
    distance?: number;
    merchantId?: string;
    courierId?: string;
    createdAt?: any;
    originLocation?: { lat: number; lng: number };
    courierLocation?: { lat: number; lng: number };
    destinationLocation?: { lat: number; lng: number };
    confirmationCode?: string;
    offeredTo?: string | null;
    offerExpiresAt?: number | null;
    rejectedBy?: string[];
    routeGeometry?: any;
}

export interface UserProfile {
    uid: string;
    name: string;
    email: string;
    role: UserMode;
    profilePic: string;
    balance?: number;
    vehicleInfo?: string;
    cnpj?: string;
    cpf?: string;
    phone?: string;
    address?: string;
    createdAt?: any;
    isOnline?: boolean;
    lastActive?: any;
    fcmToken?: string;
    savedOrigin?: {
        cep: string;
        street: string;
        number: string;
        complement: string;
        neighborhood: string;
        city: string;
        state: string;
        };
}

export interface Notification {
    id?: string;
    userId: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    isRead: boolean;
    createdAt: any;
}

export interface PricingSettings {
    platformFee: number;
    baseDistance: number;
    basePrice: number;
    pricePerKm: number;
}

export interface FirestoreErrorInfo {
    error: string;
    operationType: OperationType;
    path: string | null;
    authInfo: {
        userId: string | undefined;
        email: string | null | undefined;
        emailVerified: boolean | undefined;
        isAnonymous: boolean | undefined;
        tenantId: string | null | undefined;
        providerInfo: {
          providerId: string;
          displayName: string | null;
          email: string | null;
          photoUrl: string | null;
        }[];
        };
}

export interface HomeScreenProps {
    data: DeliveryData;
    setData: (d: DeliveryData) => void;
    onRequestDelivery: () => void;
    onLogout: () => void;
    onNavigate: (screen: Screen) => void;
    onOpenNotifications: () => void;
    unreadCount: number;
}

export interface NewRideScreenProps {
    onBack: () => void;
    onRequestDelivery: () => void;
    data: DeliveryData;
    setData: (data: DeliveryData) => void;
}

export interface DetailsScreenProps {
    data: DeliveryData;
    setData: (d: DeliveryData) => void;
    onBack: () => void;
    onConfirm: () => void;
    onNavigate: (screen: string) => void;
    isCalling?: boolean;
    pricingSettings: PricingSettings;
    onOpenNotifications?: () => void;
    unreadCount?: number;
}

export interface TrackingScreenProps {
    data: DeliveryData;
    onFinish: () => void;
    onCancel?: () => void;
    showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
    onOpenChat?: (otherUserName: string) => void;
}

export interface CourierTrackingScreenProps {
    data: DeliveryData;
    onGoToEarnings: () => void;
    onGoToConfirmation: (delivery: DeliveryData) => void;
    onLogout: () => void;
    onGoToAvailable: () => void;
    onNavigate: (screen: Screen) => void;
    onOpenChat?: (otherUserName: string) => void;
}

export type Screen = 'splash' | 'landing' | 'role-selection' | 'login' | 'merchant-registration' | 'home' | 'new-ride' | 'details' | 'searching' | 'tracking' | 'courier-available' | 'courier-tracking' | 'courier-earnings' | 'courier-confirmation' | 'admin-dashboard' | 'activities' | 'payments' | 'profile' | 'courier-profile';
export type UserMode = 'merchant' | 'courier' | 'admin';
