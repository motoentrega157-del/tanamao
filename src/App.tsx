/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { cloneElement, useState, useEffect, useContext, createContext, useMemo, useRef, type ReactNode, type ChangeEvent, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { 
  Bike, 
  Bell, 
  MapPin, 
  Plus, 
  Home as HomeIcon, 
  Briefcase, 
  History, 
  Search, 
  ArrowLeft, 
  ArrowRight,
  User, 
  Phone, 
  StickyNote,
  ReceiptText,
  Wallet,
  UserCircle,
  Store,
  Menu,
  MessageCircle,
  PhoneCall,
  Navigation,
  CheckCircle2,
  Check,
  Camera,
  Lock,
  ChevronRight,
  TrendingUp,
  Calendar,
  XCircle,
  LogOut,
  ShieldCheck,
  Users,
  BarChart3,
  Settings,
  Clock,
  DollarSign,
  Truck,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  AlertCircle,
  HelpCircle,
  Grid,
  MoreHorizontal,
  Activity,
  Zap,
  Layers,
  PieChart,
  Server,
  RefreshCw,
  Package,
  Wrench,
  ChevronLeft,
  Star,
  Send,
  X
} from 'lucide-react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  addDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import { auth, db, requestNotificationPermission } from './firebase';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { createPagBankOrder, type PagBankOrderResponse } from './services/pagbank';

// --- Helpers ---
const sendNotification = async (userId: string, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      title,
      message,
      type,
      isRead: false,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};

const sendBrowserNotification = (title: string, body: string) => {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon: '/vite.svg' });
  }
};

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Constants & Assets ---
const ASSETS = {
  PROFILE_PIC: "https://lh3.googleusercontent.com/aida-public/AB6AXuD-Ws0cTVBpqdXPnzpDKfIIu4xMaQQ063kYw4JeT5pvj1KxwEKBM6HtzGWVeYvmKWcmImoR1SVCbAAmgJyswm_NuYpz_yzZVf0PxKAmK882_sJi-9gXGxvIl0iM-Ks7oSP5gTyy1zftQmgQNjisOIKKEff-ZN1Tty26B0elydF-mj6C3RI6Yy-GBZcmB71jYnPRgYlYUxQHyyFZKNwaWDmguYGZ_iv4ZzDWPd_KeK4CmfyIgaNeGv3TDbKHQkhaJRViFHXhT-AT7Vw",
  MAP_HOME: "https://lh3.googleusercontent.com/aida-public/AB6AXuDNxnfwKKnI4g4GlXBamBvoeGTKfL73jW3lfePd_uBObNHan92aIIqb2CsEizDmzzG58C1sxtPU3BJlrQqTHOoN4fDrALqpiN0O3jxZIXX35LulAXzM4L6JzBslWNMsZyFe-wKhc6q1XW4f0b-LIe6FxJc4YsY_sPzUmf0SBdSeoDewe1cIe6l6xOExRlAoT91TVUpyWAAENkB0fgQ82CTmVf9fy2Xxiq0EOCoFXiA9qm9lqFk7jQ7dasVp4TST6E2IEW1hf99r3kc",
  MAP_DETAILS: "https://lh3.googleusercontent.com/aida-public/AB6AXuCh93RBJVg5Vq3i-rBrpCmNzE9Zybi8-IbDAnv12LKCoPrb_h9yuWeIfzZMZzgrPAKHBxrcLwIRdXJLjP9fh_DNMGeq2--SKhmrrVgdn3_csSfNnwoO3Iv40oVX0u-LZxWs6NY1_K4dkitB0YvdsGElRxEPHS4BwpClwnBWOUY2cIbYqKeOVgF07Los4bW2Iz7Ch_tmL7m8d8Wpo-2mB-_N9-exmJ-6BMp_KP9P42O_FKIIhulgTzGB4vAJRlySgxHpMfMiAmMtwdI"
};

type Screen = 'splash' | 'landing' | 'role-selection' | 'login' | 'merchant-registration' | 'home' | 'new-ride' | 'details' | 'searching' | 'tracking' | 'courier-available' | 'courier-tracking' | 'courier-earnings' | 'courier-confirmation' | 'admin-dashboard' | 'activities' | 'payments' | 'profile' | 'courier-profile';
type UserMode = 'merchant' | 'courier' | 'admin';

interface DeliveryData {
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

interface UserProfile {
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

interface Notification {
  id?: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: any;
}

interface PricingSettings {
  platformFee: number;
  baseDistance: number;
  basePrice: number;
  pricePerKm: number;
}

// --- Error Handling ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
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
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Context ---
const AuthContext = createContext<{
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => void;
} | null>(null);

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [userMode, setUserMode] = useState<UserMode>('merchant');
  const [selectedRole, setSelectedRole] = useState<UserMode | null>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCalling, setIsCalling] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [deliveryData, setDeliveryData] = useState<DeliveryData>({
    origin: 'Sua Loja: Av. Paulista, 1000',
    destination: '',
    customerName: '',
    customerPhone: '',
    notes: ''
  });

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ title: string, message: string, onConfirm: () => void } | null>(null);
  const [pricingSettings, setPricingSettings] = useState<PricingSettings>({
    platformFee: 2.50,
    baseDistance: 4,
    basePrice: 8.00,
    pricePerKm: 2.00
  });

  const [chatState, setChatState] = useState<{show: boolean, deliveryId: string, otherUserName: string}>({show: false, deliveryId: '', otherUserName: ''});
  const [ratingState, setRatingState] = useState<{show: boolean, deliveryId: string, targetRole: 'merchant'|'courier', targetName: string, targetId: string}>({show: false, deliveryId: '', targetRole: 'merchant', targetName: '', targetId: ''});
  const [paymentState, setPaymentState] = useState<{show: boolean, qrCode: string, amount: number, deliveryId: string} | null>(null);

  // Global Dispatcher Logic
  useEffect(() => {
    if (!user || (profile?.role !== 'merchant' && profile?.role !== 'admin')) return;

    const q = query(
      collection(db, 'deliveries'), 
      where('merchantId', '==', user.uid),
      where('status', '==', 'searching')
    );
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const now = Date.now();
      for (const docSnapshot of snapshot.docs) {
        const delivery = docSnapshot.data() as DeliveryData;
        
        if (!delivery.offeredTo || (delivery.offerExpiresAt && delivery.offerExpiresAt < now)) {
          try {
            const couriersQuery = query(collection(db, 'users'), where('role', '==', 'courier'));
            const couriersSnap = await getDocs(couriersQuery);
            const couriers = couriersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            
            const rejectedBy = delivery.rejectedBy || [];
            const availableCouriers = couriers.filter(c => !rejectedBy.includes(c.id));
            
            if (availableCouriers.length > 0) {
              const randomCourier = availableCouriers[Math.floor(Math.random() * availableCouriers.length)];
              const newRejectedBy = [...rejectedBy];
              
              if (delivery.offeredTo && delivery.offerExpiresAt && delivery.offerExpiresAt < now) {
                if (!newRejectedBy.includes(delivery.offeredTo)) {
                  newRejectedBy.push(delivery.offeredTo);
                }
              }

              await updateDoc(doc(db, 'deliveries', docSnapshot.id), {
                offeredTo: randomCourier.id,
                offerExpiresAt: now + 30000,
                rejectedBy: newRejectedBy
              });
            } else if (rejectedBy.length > 0) {
              await updateDoc(doc(db, 'deliveries', docSnapshot.id), {
                rejectedBy: [],
                offeredTo: null,
                offerExpiresAt: null
              });
            }
          } catch (error) {
            console.error("Dispatcher error:", error);
          }
        }
      }
    });
    return () => unsubscribe();
  }, [user, profile]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({ title, message, onConfirm });
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { isRead: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const clearAllNotifications = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'notifications'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      const batch = snap.docs.map(d => deleteDoc(d.ref));
      await Promise.all(batch);
      setNotifications([]);
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  const currentScreenRef = useRef<Screen>(currentScreen);
  useEffect(() => {
    currentScreenRef.current = currentScreen;
  }, [currentScreen]);

  const prevStatuses = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
      setNotifications(newNotifications);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user || !profile) return;
    
    // Request FCM token and save it to the user profile
    const setupFCM = async () => {
      try {
        const token = await requestNotificationPermission();
        if (token && token !== profile.fcmToken) {
          await updateDoc(doc(db, 'users', user.uid), { fcmToken: token });
        }
      } catch (error) {
        console.error('Failed to setup FCM:', error);
      }
    };
    setupFCM();
  }, [user, profile]);

  useEffect(() => {
    if (!user || !profile) return;

    const field = profile.role === 'courier' ? 'courierId' : 'merchantId';
    
    const q = query(collection(db, 'deliveries'), where(field, '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const data = change.doc.data() as DeliveryData;
        const id = change.doc.id;
        
        if (change.type === 'added') {
          prevStatuses.current[id] = data.status || '';
        } else if (change.type === 'modified') {
          const oldStatus = prevStatuses.current[id];
          const newStatus = data.status || '';
          
          if (oldStatus !== newStatus) {
            if (profile.role === 'merchant') {
              if (newStatus === 'collecting') {
                showToast(`Sua entrega para ${data.customerName} foi aceita!`, 'success');
                sendBrowserNotification('Entrega Aceita', `O motoboy está a caminho para coletar a entrega de ${data.customerName}.`);
              }
              if (newStatus === 'in-route') {
                showToast(`O motoboy coletou a entrega de ${data.customerName}.`, 'info');
                sendBrowserNotification('Entrega Coletada', `O motoboy coletou a entrega e está a caminho do destino.`);
              }
              if (newStatus === 'delivered') {
                showToast(`Entrega para ${data.customerName} concluída!`, 'success');
                sendBrowserNotification('Entrega Concluída', `A entrega para ${data.customerName} foi realizada com sucesso!`);
              }
            } else if (profile.role === 'courier') {
              if (newStatus === 'cancelled') {
                showToast(`A entrega para ${data.customerName} foi cancelada.`, 'error');
                sendBrowserNotification('Entrega Cancelada', `A entrega para ${data.customerName} foi cancelada pelo comerciante.`);
              }
            }
            prevStatuses.current[id] = newStatus;
          }
        }
      });
    });

    return () => unsubscribe();
  }, [user, profile]);

  useEffect(() => {
    // Test connection to Firestore
    const testConnection = async () => {
      try {
        const { getDocFromServer } = await import('firebase/firestore');
        await getDocFromServer(doc(db, 'test', 'connection'));
        console.log("Firestore connection test successful");
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. The client is offline.");
        }
      }
    };
    testConnection();

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser?.email);
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
        // Only redirect to role-selection if we are not already on an auth screen
        const publicScreens: Screen[] = ['splash', 'landing', 'role-selection', 'login', 'merchant-registration'];
        if (!publicScreens.includes(currentScreenRef.current)) {
          console.log("No user, redirecting to landing");
          setCurrentScreen('landing');
        }
      } else {
        // User logged in, profile listener will handle the rest
        setLoading(true);
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    // Fetch pricing settings
    const unsubscribePricing = onSnapshot(doc(db, 'settings', 'pricing'), (docSnap) => {
      if (docSnap.exists()) {
        setPricingSettings(docSnap.data() as PricingSettings);
      } else {
        // Initialize default settings if they don't exist (only if admin, to avoid permission errors)
        if (user.email === 'mauriciocardoso896@gmail.com') {
          setDoc(doc(db, 'settings', 'pricing'), {
            platformFee: 2.50,
            baseDistance: 4,
            basePrice: 8.00,
            pricePerKm: 2.00
          }).catch(err => console.error("Failed to initialize pricing settings", err));
        } else {
          // Fallback to defaults in memory if doc doesn't exist and user is not admin
          setPricingSettings({
            platformFee: 2.50,
            baseDistance: 4,
            basePrice: 8.00,
            pricePerKm: 2.00
          });
        }
      }
    }, (error) => {
      console.error("Error fetching pricing settings:", error);
    });

    console.log("Starting profile listener for:", user.uid);
    const unsubscribeProfile = onSnapshot(doc(db, 'users', user.uid), (profileSnapshot) => {
      if (profileSnapshot.exists()) {
        const data = profileSnapshot.data() as UserProfile;
        
        // Force admin role for master email in Firestore if needed
        if (user.email === 'mauriciocardoso896@gmail.com' && data.role !== 'admin') {
          console.log("Master user detected without admin role, updating...");
          updateDoc(doc(db, 'users', user.uid), { role: 'admin' }).catch(err => {
            console.error("Failed to auto-escalate master admin:", err);
          });
          data.role = 'admin';
        }
        
        setProfile(data);
        setUserMode(data.role);
        
        // Handle redirection
        const isAuthScreen = currentScreenRef.current === 'splash' || currentScreenRef.current === 'landing' || currentScreenRef.current === 'login' || currentScreenRef.current === 'role-selection';
        if (isAuthScreen) {
          const nextScreen = data.role === 'admin' ? 'admin-dashboard' : data.role === 'courier' ? 'courier-available' : 'home';
          if (currentScreenRef.current !== nextScreen) {
            console.log("Profile loaded, redirecting to:", nextScreen);
            setCurrentScreen(nextScreen);
          }
        }
      } else {
        // New user profile creation
        console.log("Profile does not exist, creating...");
        let newRole = selectedRole || 'merchant';
        if (newRole === 'admin' && user.email !== 'mauriciocardoso896@gmail.com') {
          newRole = 'merchant';
        }
        
        const newProfile: UserProfile = {
          uid: user.uid,
          name: user.displayName || 'Usuário',
          email: user.email || '',
          role: newRole,
          profilePic: user.photoURL || ASSETS.PROFILE_PIC,
          createdAt: new Date().toISOString()
        };

        setDoc(doc(db, 'users', user.uid), newProfile).then(() => {
          setProfile(newProfile);
          setUserMode(newRole);
          const nextScreen = newRole === 'admin' ? 'admin-dashboard' : newRole === 'courier' ? 'courier-available' : 'home';
          setCurrentScreen(nextScreen);
        }).catch(err => {
          console.error("Error creating profile:", err);
          showToast("Erro ao criar perfil de usuário.", "error");
        });
      }
      setLoading(false);
    }, (error) => {
      console.error("Profile listener error:", error);
      // Don't throw here to avoid crash loops, just show toast and stop loading
      if (error.code !== 'permission-denied') {
        showToast("Erro ao carregar perfil. Verifique sua conexão.", "error");
      }
      setLoading(false);
      // Fallback: if we are stuck on splash, go back to landing
      if (currentScreenRef.current === 'splash') {
        setCurrentScreen('landing');
      }
    });

    return () => {
      unsubscribeProfile();
      unsubscribePricing();
    };
  }, [user, selectedRole]);

  useEffect(() => {
    if (currentScreen === 'splash') {
      const timer = setTimeout(() => {
        if (!loading) {
          if (user && profile) {
            const nextScreen = profile.role === 'admin' ? 'admin-dashboard' : profile.role === 'courier' ? 'courier-available' : 'home';
            if (currentScreenRef.current !== nextScreen) {
              console.log("Splash timer final redirect to:", nextScreen);
              setCurrentScreen(nextScreen);
            }
          } else if (!user) {
            console.log("Splash timer final redirect to landing");
            setCurrentScreen('landing');
          }
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentScreen, loading, user, profile]);

  useEffect(() => {
    if (!user || userMode !== 'courier') return;
    
    const updateActiveStatus = async () => {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          lastActive: serverTimestamp(),
          isOnline: true
        });
      } catch (error) {
        console.error("Error updating active status:", error);
      }
    };

    updateActiveStatus();
    const interval = setInterval(updateActiveStatus, 30000); // Every 30s
    
    return () => clearInterval(interval);
  }, [user, userMode]);

  const handleSelectRole = (role: UserMode) => {
    setSelectedRole(role);
    setCurrentScreen('login');
  };

  const handleRequestDelivery = () => {
    setCurrentScreen('details');
  };

  // --- Courier Online Status Heartbeat ---
  useEffect(() => {
    if (!user || userMode !== 'courier') return;

    const updateOnlineStatus = async (status: boolean) => {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          isOnline: status,
          lastActive: serverTimestamp()
        });
      } catch (error) {
        console.error("Error updating online status:", error);
      }
    };

    updateOnlineStatus(true);
    const interval = setInterval(() => updateOnlineStatus(true), 60000); // Every minute

    return () => {
      clearInterval(interval);
      updateOnlineStatus(false);
    };
  }, [user, userMode]);

  const handleCallMotoboy = async () => {
    if (!deliveryData.customerName?.trim() || !deliveryData.customerPhone?.trim()) {
      showToast('Por favor, preencha os dados do cliente.', 'error');
      return;
    }
    
    if (!user || isCalling) return;
    setIsCalling(true);

    try {
      const { id, ...restDeliveryData } = deliveryData;
      const price = deliveryData.price || 12.50;
      
      const newDelivery: any = {
        ...restDeliveryData,
        merchantId: user.uid,
        status: 'pending_payment',
        price: price,
        createdAt: serverTimestamp(),
        confirmationCode: Math.floor(1000 + Math.random() * 9000).toString(),
        originLocation: deliveryData.originLocation || { lat: -23.5505, lng: -46.6333 },
        destinationLocation: deliveryData.destinationLocation || {
          lat: -23.5505 + (Math.random() - 0.5) * 0.05,
          lng: -46.6333 + (Math.random() - 0.5) * 0.05
        }
      };

      // Ensure required fields for security rules
      if (!newDelivery.origin) newDelivery.origin = "Endereço de Coleta";
      if (!newDelivery.destination) newDelivery.destination = "Endereço de Entrega";

      // Remove undefined fields to prevent Firestore errors
      Object.keys(newDelivery).forEach(key => {
        if (newDelivery[key] === undefined || newDelivery[key] === null) {
          delete newDelivery[key];
        }
      });

      console.log("Creating delivery in Firestore:", newDelivery);
      const docRef = await addDoc(collection(db, 'deliveries'), newDelivery);
      const deliveryId = docRef.id;
      
      // Update local state with ID immediately
      const deliveryWithId = { ...newDelivery, id: deliveryId };
      setDeliveryData(deliveryWithId);

      // Create PagBank Order
      try {
        console.log("Creating PagBank order for delivery:", deliveryId);
        const pagBankOrder = await createPagBankOrder(deliveryId, price, {
          name: profile?.name || user.email?.split('@')[0] || "Cliente",
          email: user.email || "cliente@tanamao.com",
          tax_id: "12345678909" // Placeholder for demo
        });

        const qrCode = pagBankOrder.qr_codes?.[0]?.links.find(l => l.rel === 'QRCODE.PNG')?.href || '';
        setPaymentState({ show: true, qrCode, amount: price, deliveryId });
      } catch (err) {
        console.error("PagBank error, proceeding without payment for demo:", err);
        // For demo purposes, if PagBank fails (e.g. no API key), we just proceed
        await updateDoc(doc(db, 'deliveries', deliveryId), { status: 'searching' });
        setCurrentScreen('searching');
        showToast('Buscando motoboy (Pagamento simulado)...', 'info');
      }
    } catch (error) {
      console.error("Error in handleCallMotoboy:", error);
      showToast("Erro ao processar solicitação. Verifique os dados e tente novamente.", "error");
      try {
        handleFirestoreError(error, OperationType.CREATE, 'deliveries');
      } catch (e) {
        // handleFirestoreError throws, we already handled the UI feedback
      }
    } finally {
      setIsCalling(false);
    }
  };

  const toggleMode = async () => {
    if (!user || !profile) return;
    const newMode = userMode === 'merchant' ? 'courier' : 'merchant';
    
    // In a real app, we might want to update the profile role in DB too
    // But for this demo, let's just switch local mode if user is not admin
    if (profile.role !== 'admin') {
      setUserMode(newMode);
      setCurrentScreen(newMode === 'merchant' ? 'home' : 'courier-tracking');
    } else {
      // Admin can switch to any mode
      setUserMode(newMode);
      setCurrentScreen(newMode === 'merchant' ? 'home' : 'courier-tracking');
    }
  };

  const logout = () => {
    signOut(auth);
    setCurrentScreen('role-selection');
  };

  if (loading && currentScreen !== 'splash') {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-surface">
        <div className="w-8 h-8 border-4 border-secondary-fixed border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout }}>
      <div className="h-screen w-full overflow-hidden bg-surface">
        <AnimatePresence mode="wait">
          {currentScreen === 'splash' && <SplashScreen />}
          {currentScreen === 'landing' && <LandingScreen onSelectRole={handleSelectRole} onNavigate={setCurrentScreen} />}
          {currentScreen === 'role-selection' && <RoleSelectionScreen onSelectRole={handleSelectRole} onBack={() => setCurrentScreen('landing')} />}
          {currentScreen === 'login' && <LoginScreen onLogin={() => setCurrentScreen('splash')} onBack={() => setCurrentScreen('landing')} onRegister={() => setCurrentScreen('registration')} role={selectedRole || 'merchant'} showToast={showToast} />}
          {currentScreen === 'registration' && <RegistrationScreen role={selectedRole || 'merchant'} onBack={() => setCurrentScreen('login')} onComplete={() => setCurrentScreen('splash')} showToast={showToast} />}
          
          {/* Admin Dashboard */}
          {userMode === 'admin' && currentScreen === 'admin-dashboard' && (
            <AdminErrorBoundary>
              <AdminDashboard onLogout={logout} showToast={showToast} showConfirm={showConfirm} pricingSettings={pricingSettings} />
            </AdminErrorBoundary>
          )}

          {/* Merchant Screens */}
          {userMode === 'merchant' && currentScreen === 'home' && (
            <HomeScreen 
              data={deliveryData}
              setData={setDeliveryData}
              onRequestDelivery={() => setCurrentScreen('new-ride')} 
              onLogout={logout}
              onNavigate={(screen) => setCurrentScreen(screen)}
              onOpenNotifications={() => setIsNotificationsOpen(true)}
              unreadCount={notifications.filter(n => !n.isRead).length}
            />
          )}
          {userMode === 'merchant' && currentScreen === 'new-ride' && (
            <NewRideScreen 
              onBack={() => setCurrentScreen('home')}
              onRequestDelivery={handleRequestDelivery}
              data={deliveryData}
              setData={setDeliveryData}
            />
          )}
          {userMode === 'merchant' && currentScreen === 'activities' && (
            <ActivitiesScreen 
              onNavigate={setCurrentScreen} 
              onLogout={logout} 
              onOpenNotifications={() => setIsNotificationsOpen(true)}
              unreadCount={notifications.filter(n => !n.isRead).length}
              showToast={showToast}
            />
          )}
          {userMode === 'merchant' && currentScreen === 'payments' && (
            <PaymentsScreen 
              onLogout={logout} 
              onNavigate={setCurrentScreen} 
              onOpenNotifications={() => setIsNotificationsOpen(true)}
              unreadCount={notifications.filter(n => !n.isRead).length}
            />
          )}
          {userMode === 'merchant' && currentScreen === 'profile' && (
            <MerchantProfileScreen 
              onLogout={logout} 
              onNavigate={setCurrentScreen} 
              onOpenNotifications={() => setIsNotificationsOpen(true)}
              unreadCount={notifications.filter(n => !n.isRead).length}
            />
          )}
          {userMode === 'merchant' && currentScreen === 'details' && (
            <DetailsScreen 
              data={deliveryData}
              setData={setDeliveryData}
              onBack={() => setCurrentScreen('home')} 
              onConfirm={handleCallMotoboy}
              onNavigate={setCurrentScreen}
              isCalling={isCalling}
              pricingSettings={pricingSettings}
              onOpenNotifications={() => setIsNotificationsOpen(true)}
              unreadCount={notifications.filter(n => !n.isRead).length}
            />
          )}
          {userMode === 'merchant' && currentScreen === 'searching' && <SearchingScreen deliveryId={deliveryData.id} showToast={showToast} onFound={() => setCurrentScreen('tracking')} onNavigate={setCurrentScreen} onCancel={() => {
            setDeliveryData({
              origin: '',
              destination: '',
              customerName: '',
              customerPhone: '',
              notes: '',
              itemDescription: '',
              price: 0,
              distance: 0,
              originLocation: null,
              destinationLocation: null
            });
            setCurrentScreen('home');
          }} />}
          {userMode === 'merchant' && currentScreen === 'tracking' && (
            <TrackingScreen 
              data={deliveryData}
              showToast={showToast}
              onOpenChat={(otherUserName) => setChatState({show: true, deliveryId: deliveryData.id!, otherUserName})}
              onFinish={async () => {
                if (deliveryData.id) {
                  await updateDoc(doc(db, 'deliveries', deliveryData.id), { status: 'delivered', deliveredAt: serverTimestamp() });
                }
                setRatingState({show: true, deliveryId: deliveryData.id!, targetRole: 'courier', targetName: 'Motoboy', targetId: deliveryData.courierId || ''});
                setDeliveryData({
                  origin: 'Sua Loja: Av. Paulista, 1000',
                  destination: '',
                  customerName: '',
                  customerPhone: '',
                  notes: ''
                });
                setCurrentScreen('home');
              }}
              onCancel={() => {
                setDeliveryData({
                  origin: 'Sua Loja: Av. Paulista, 1000',
                  destination: '',
                  customerName: '',
                  customerPhone: '',
                  notes: ''
                });
                setCurrentScreen('home');
              }}
            />
          )}

          {/* Courier Screens */}
          {userMode === 'courier' && currentScreen === 'courier-available' && (
            <CourierAvailableScreen 
              onAccept={(delivery) => {
                setDeliveryData(delivery);
                setCurrentScreen('courier-tracking');
              }}
              onLogout={logout}
              onNavigate={setCurrentScreen}
              pricingSettings={pricingSettings}
              onOpenNotifications={() => setIsNotificationsOpen(true)}
              unreadCount={notifications.filter(n => !n.isRead).length}
            />
          )}
          {userMode === 'courier' && currentScreen === 'activities' && (
            <ActivitiesScreen 
              onNavigate={setCurrentScreen} 
              onLogout={logout} 
              onOpenNotifications={() => setIsNotificationsOpen(true)}
              unreadCount={notifications.filter(n => !n.isRead).length}
              showToast={showToast}
            />
          )}
          {userMode === 'courier' && currentScreen === 'courier-tracking' && (
            <CourierTrackingScreen 
              data={deliveryData}
              onOpenChat={(otherUserName) => setChatState({show: true, deliveryId: deliveryData.id!, otherUserName})}
              onGoToEarnings={() => setCurrentScreen('courier-earnings')}
              onGoToConfirmation={(updatedDelivery) => {
                setDeliveryData(updatedDelivery);
                setCurrentScreen('courier-confirmation');
              }}
              onLogout={logout}
              onGoToAvailable={() => setCurrentScreen('courier-available')}
              onNavigate={setCurrentScreen}
              onOpenNotifications={() => setIsNotificationsOpen(true)}
              unreadCount={notifications.filter(n => !n.isRead).length}
            />
          )}
          {userMode === 'courier' && currentScreen === 'courier-earnings' && (
            <CourierEarningsScreen 
              onGoToTracking={() => setCurrentScreen('courier-tracking')}
              onLogout={logout}
              onNavigate={setCurrentScreen}
              onOpenNotifications={() => setIsNotificationsOpen(true)}
              unreadCount={notifications.filter(n => !n.isRead).length}
            />
          )}
          {userMode === 'courier' && currentScreen === 'courier-confirmation' && (
            <CourierConfirmationScreen 
              data={deliveryData}
              onOpenChat={(otherUserName) => setChatState({show: true, deliveryId: deliveryData.id!, otherUserName})}
              onBack={() => setCurrentScreen('courier-tracking')}
              isFinishing={isFinishing}
              onFinish={async () => {
                if (isFinishing) return;
                setIsFinishing(true);
                try {
                  if (deliveryData.id) {
                    await updateDoc(doc(db, 'deliveries', deliveryData.id), { status: 'delivered', deliveredAt: serverTimestamp() });
                    // Add earning
                    await addDoc(collection(db, 'earnings'), {
                      courierId: user?.uid,
                      deliveryId: deliveryData.id,
                      amount: 10.00,
                      status: 'completed',
                      createdAt: serverTimestamp()
                    });
                  }
                  setRatingState({show: true, deliveryId: deliveryData.id!, targetRole: 'merchant', targetName: 'Lojista', targetId: deliveryData.merchantId || ''});
                  setCurrentScreen('courier-earnings');
                } catch (error) {
                  handleFirestoreError(error, OperationType.UPDATE, `deliveries/${deliveryData.id}`);
                } finally {
                  setIsFinishing(false);
                }
              }}
            />
          )}
          {userMode === 'courier' && currentScreen === 'courier-profile' && (
            <CourierProfileScreen 
              onLogout={logout} 
              onNavigate={setCurrentScreen} 
              onOpenNotifications={() => setIsNotificationsOpen(true)}
              unreadCount={notifications.filter(n => !n.isRead).length}
            />
          )}
        </AnimatePresence>

        {/* Toast Notification */}
        <AnimatePresence>
            {toast && (
              <motion.div
                key="toast"
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.9 }}
                className={cn(
                  "fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border",
                  toast.type === 'success' ? "bg-green-500 text-white border-green-400" :
                  toast.type === 'error' ? "bg-red-500 text-white border-red-400" :
                  "bg-secondary-fixed text-on-secondary-fixed border-secondary-fixed/20"
                )}
              >
                {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> :
                 toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> :
                 <Bell className="w-5 h-5" />}
                <span className="font-black text-[10px] uppercase tracking-widest">{toast.message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Confirmation Modal */}
          <AnimatePresence>
            {confirmModal && (
              <div key="confirm-modal" className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setConfirmModal(null)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative z-10 overflow-hidden"
                >
                  <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-2xl font-black text-[#0f1c2c] tracking-tighter mb-2">{confirmModal.title}</h3>
                  <p className="text-gray-500 font-medium text-sm leading-relaxed mb-8">{confirmModal.message}</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setConfirmModal(null)}
                      className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-gray-400 hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        confirmModal.onConfirm();
                        setConfirmModal(null);
                      }}
                      className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-red-500/20 hover:bg-red-600 transition-colors"
                    >
                      Confirmar
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <NotificationDrawer 
            isOpen={isNotificationsOpen}
            onClose={() => setIsNotificationsOpen(false)}
            notifications={notifications}
            onMarkAsRead={markNotificationAsRead}
            onClearAll={clearAllNotifications}
          />

          <AnimatePresence>
            {chatState.show && (
              <ChatModal 
                deliveryId={chatState.deliveryId}
                otherUserName={chatState.otherUserName}
                currentUserRole={userMode === 'merchant' ? 'merchant' : 'courier'}
                currentUserId={user?.uid || ''}
                onClose={() => setChatState(prev => ({ ...prev, show: false }))}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {ratingState.show && (
              <RatingModal 
                deliveryId={ratingState.deliveryId}
                targetRole={ratingState.targetRole}
                targetName={ratingState.targetName}
                onClose={() => setRatingState(prev => ({ ...prev, show: false }))}
                onSubmit={async (rating, comment) => {
                  try {
                    await addDoc(collection(db, 'ratings'), {
                      deliveryId: ratingState.deliveryId,
                      targetId: ratingState.targetId,
                      fromId: user?.uid,
                      rating,
                      comment,
                      createdAt: serverTimestamp()
                    });
                    setRatingState(prev => ({ ...prev, show: false }));
                    showToast('Avaliação enviada com sucesso!', 'success');
                  } catch (error) {
                    console.error("Error submitting rating", error);
                    showToast('Erro ao enviar avaliação', 'error');
                  }
                }}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {paymentState?.show && (
              <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative z-10 overflow-hidden text-center"
                >
                  <div className="w-16 h-16 bg-secondary-fixed/20 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                    <Wallet className="w-8 h-8 text-secondary-fixed" />
                  </div>
                  <h3 className="text-2xl font-black text-[#0f1c2c] tracking-tighter mb-2">Pagar com Pix</h3>
                  <p className="text-gray-500 font-medium text-sm leading-relaxed mb-6">
                    Escaneie o QR Code abaixo para confirmar sua entrega.
                  </p>
                  
                  {paymentState.qrCode ? (
                    <div className="bg-gray-50 p-4 rounded-3xl mb-6 flex items-center justify-center border border-gray-100">
                      <img src={paymentState.qrCode} alt="Pix QR Code" className="w-48 h-48" />
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-3xl mb-6 flex flex-col items-center justify-center border border-gray-100 aspect-square">
                      <div className="w-12 h-12 border-4 border-secondary-fixed border-t-transparent rounded-full animate-spin mb-4" />
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Gerando QR Code...</p>
                    </div>
                  )}

                  <div className="mb-8">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Total a pagar</p>
                    <p className="text-3xl font-black text-secondary-fixed">R$ {paymentState.amount.toFixed(2).replace('.', ',')}</p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={async () => {
                        // In a real app, the webhook would update the status
                        // For demo, we manually update it
                        await updateDoc(doc(db, 'deliveries', paymentState.deliveryId), { status: 'searching' });
                        setPaymentState(null);
                        setCurrentScreen('searching');
                        showToast('Pagamento confirmado!', 'success');
                      }}
                      className="w-full py-4 bg-secondary-fixed text-on-secondary-fixed rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-secondary-fixed/20 active:scale-95 transition-transform"
                    >
                      Já paguei
                    </button>
                    <button
                      onClick={() => setPaymentState(null)}
                      className="w-full py-4 text-gray-400 font-black uppercase tracking-widest text-[10px] hover:bg-gray-50 rounded-2xl transition-colors"
                    >
                      Pagar depois
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
      </div>
    </AuthContext.Provider>
  );
}

// --- Auth Components ---

function LandingScreen({ onSelectRole, onNavigate }: { onSelectRole: (role: UserMode) => void, onNavigate: (screen: Screen) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full w-full bg-[#0f1c2c] overflow-y-auto no-scrollbar"
    >
      {/* Top Bar */}
      <header className="flex justify-between items-center px-6 py-4 bg-[#0f1c2c] border-b border-white/10 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-extrabold text-[#c3f400] tracking-tight font-headline uppercase">TaNaMao</h1>
        </div>
        <button 
          onClick={() => onNavigate('role-selection')} 
          className="px-5 py-2 rounded-full bg-[#c3f400] text-[#0f1c2c] text-xs font-bold uppercase tracking-widest active:scale-95 transition-transform"
        >
          Entrar
        </button>
      </header>

      {/* Hero Section */}
      <section className="bg-[#1a2332] text-white px-6 py-12 relative overflow-hidden">
        {/* Background grid pattern */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        
        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
          <div className="bg-white/10 border border-white/20 rounded-full px-3 py-1 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#c3f400]" />
            <span className="text-[10px] font-bold text-[#c3f400] tracking-widest uppercase">Logística Inteligente</span>
          </div>
          
          <h2 className="text-4xl font-extrabold font-headline leading-tight">
            TaNaMao:<br/>Conectando<br/><span className="text-[#c3f400]">Comércio</span> e<br/><span className="text-[#c3f400]">Entregas</span>
          </h2>
          
          <p className="text-white/60 text-sm max-w-xs mx-auto">
            A plataforma definitiva para escalar seu negócio local ou maximizar seus ganhos como entregador.
          </p>
          
          {/* Graphic */}
          <div className="w-full max-w-xs mx-auto mt-8 relative">
            <div className="bg-[#0f1c2c]/80 border border-white/10 rounded-2xl p-6 backdrop-blur-sm relative z-10 h-48 flex items-center justify-center">
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Connecting Lines */}
                <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
                  <path d="M 160 96 L 80 48" stroke="rgba(195,244,0,0.2)" strokeWidth="2" fill="none" />
                  <path d="M 160 96 L 240 48" stroke="rgba(195,244,0,0.2)" strokeWidth="2" fill="none" />
                  <path d="M 160 96 L 80 144" stroke="rgba(195,244,0,0.2)" strokeWidth="2" fill="none" />
                  <path d="M 160 96 L 240 144" stroke="rgba(195,244,0,0.2)" strokeWidth="2" fill="none" />
                </svg>
                
                {/* Central Server */}
                <div className="w-16 h-24 border-2 border-[#c3f400]/50 rounded-lg flex flex-col items-center justify-center gap-2 bg-[#0f1c2c] z-10 relative shadow-[0_0_30px_rgba(195,244,0,0.2)]">
                  <div className="w-10 h-1 bg-[#c3f400]/50 rounded-full" />
                  <div className="w-10 h-1 bg-[#c3f400]/50 rounded-full" />
                  <div className="w-10 h-1 bg-[#c3f400]/50 rounded-full" />
                </div>

                {/* Floating Icons */}
                <div className="absolute top-4 left-8 bg-[#1a2332] p-2 rounded-full border border-[#c3f400]/30 z-10">
                  <Search className="w-4 h-4 text-[#c3f400]" />
                </div>
                <div className="absolute top-4 right-8 bg-[#1a2332] p-2 rounded-full border border-[#c3f400]/30 z-10">
                  <BarChart3 className="w-4 h-4 text-[#c3f400]" />
                </div>
                <div className="absolute bottom-4 left-8 bg-[#1a2332] p-2 rounded-full border border-[#c3f400]/30 z-10">
                  <Settings className="w-4 h-4 text-[#c3f400]" />
                </div>
                <div className="absolute bottom-4 right-8 bg-[#1a2332] p-2 rounded-full border border-[#c3f400]/30 z-10">
                  <Activity className="w-4 h-4 text-[#c3f400]" />
                </div>
              </div>
              
              <div className="absolute left-0 bottom-0 translate-y-1/2 -translate-x-4 bg-[#1a2332] border border-white/10 rounded-xl p-3 shadow-xl z-20">
                <p className="text-[8px] text-white/40 uppercase font-bold tracking-widest mb-1">Pedidos Hoje</p>
                <p className="text-[#c3f400] font-bold text-lg">+1,240</p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => onNavigate('role-selection')}
            className="w-full max-w-xs bg-[#c3f400] text-[#0f1c2c] font-bold py-4 rounded-xl flex items-center justify-center gap-2 mt-8 active:scale-95 transition-transform"
          >
            Começar Agora <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-[#1a2332] px-6 py-16 text-center border-y border-white/5">
        <h3 className="text-2xl font-extrabold text-[#c3f400] font-headline mb-2 uppercase tracking-tight">Planos Sob Medida</h3>
        <p className="text-white/40 text-sm mb-10 font-medium">Simples, transparente e eficiente.</p>
        
        <div className="space-y-6 max-w-sm mx-auto">
          {/* Merchant Plan */}
          <div className="bg-[#0f1c2c] rounded-[2rem] p-8 shadow-2xl border border-white/10 text-left relative overflow-hidden">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                <Store className="w-6 h-6 text-[#c3f400]" />
              </div>
              <div>
                <h4 className="font-bold text-white text-lg">Plano Comerciante</h4>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Ideal para lojas</p>
              </div>
            </div>
            
            <div className="mb-6 flex items-baseline gap-1">
              <span className="text-sm font-bold text-white/40">R$</span>
              <span className="text-4xl font-black text-white font-headline">29,90</span>
              <span className="text-sm text-white/40">/ mês</span>
            </div>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3 text-sm text-white/60"><CheckCircle2 className="w-4 h-4 text-[#c3f400]" /> Painel de gestão completo</li>
              <li className="flex items-center gap-3 text-sm text-white/60"><CheckCircle2 className="w-4 h-4 text-[#c3f400]" /> Integração com motoboys locais</li>
              <li className="flex items-center gap-3 text-sm text-white/60"><CheckCircle2 className="w-4 h-4 text-[#c3f400]" /> Relatórios de vendas em tempo real</li>
              <li className="flex items-center gap-3 text-sm text-white/60"><CheckCircle2 className="w-4 h-4 text-[#c3f400]" /> Suporte prioritário 24/7</li>
            </ul>
            
            <button 
              onClick={() => onSelectRole('merchant')}
              className="w-full py-4 rounded-xl border-2 border-[#c3f400] text-[#c3f400] font-bold active:bg-white/5 transition-colors"
            >
              Cadastrar Loja
            </button>
          </div>

          {/* Courier Plan */}
          <div className="bg-[#c3f400] rounded-[2rem] p-8 shadow-xl text-left relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-[#0f1c2c] text-[#c3f400] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
              Mais Popular
            </div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[#0f1c2c] flex items-center justify-center">
                <Bike className="w-6 h-6 text-[#c3f400]" />
              </div>
              <div>
                <h4 className="font-bold text-[#0f1c2c] text-lg">Plano Motoboy</h4>
                <p className="text-[10px] font-bold text-[#0f1c2c]/40 uppercase tracking-widest">Para entregadores</p>
              </div>
            </div>
            
            <div className="mb-6 flex items-baseline gap-1">
              <span className="text-sm font-bold text-[#0f1c2c]/60">R$</span>
              <span className="text-4xl font-black text-[#0f1c2c] font-headline">29,90</span>
              <span className="text-sm text-[#0f1c2c]/60">/ mês</span>
            </div>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3 text-sm text-[#0f1c2c]/80"><CheckCircle2 className="w-4 h-4 text-[#0f1c2c]" /> Taxa zero por entrega</li>
              <li className="flex items-center gap-3 text-sm text-[#0f1c2c]/80"><CheckCircle2 className="w-4 h-4 text-[#0f1c2c]" /> Roteirização inteligente AI</li>
              <li className="flex items-center gap-3 text-sm text-[#0f1c2c]/80"><CheckCircle2 className="w-4 h-4 text-[#0f1c2c]" /> Seguro contra acidentes</li>
              <li className="flex items-center gap-3 text-sm text-[#0f1c2c]/80"><CheckCircle2 className="w-4 h-4 text-[#0f1c2c]" /> Saque imediato de ganhos</li>
            </ul>
            
            <button 
              onClick={() => onSelectRole('courier')}
              className="w-full py-4 rounded-xl bg-[#0f1c2c] text-[#c3f400] font-bold active:scale-95 transition-transform"
            >
              Ser Parceiro
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#0f1c2c] px-6 py-16">
        <div className="bg-[#1a2332] rounded-[2rem] p-8 text-center shadow-2xl max-w-sm mx-auto border border-white/5">
          <h3 className="text-xl font-extrabold text-white font-headline mb-4">Pronto para transformar sua logística?</h3>
          <p className="text-white/40 text-sm mb-8 font-medium">Junte-se a milhares de parceiros que já estão acelerando com a TaNaMao.</p>
          
          <button 
            onClick={() => onNavigate('role-selection')}
            className="w-full py-4 rounded-xl bg-[#c3f400] text-[#0f1c2c] font-bold flex items-center justify-center gap-2 mb-4 active:scale-95 transition-transform"
          >
            <LogOut className="w-5 h-5 rotate-180" /> Entrar na Plataforma
          </button>
          <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Acesso seguro via criptografia</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0f1c2c] text-white/60 py-12 px-6 text-center">
        <h2 className="text-xl font-extrabold text-white tracking-tight font-headline uppercase mb-8">TaNaMao</h2>
        <div className="flex justify-center gap-6 text-[10px] font-bold uppercase tracking-widest mb-8">
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <a href="#" className="hover:text-white transition-colors">Support</a>
          <a href="#" className="hover:text-white transition-colors">Contact</a>
        </div>
        <div className="w-12 h-px bg-white/10 mx-auto mb-8" />
        <p className="text-[10px] font-bold uppercase tracking-widest">© 2024 TÁNAMÃO DELIVERY. ALL RIGHTS RESERVED.</p>
      </footer>
    </motion.div>
  );
}

function RoleSelectionScreen({ onSelectRole, onBack }: { onSelectRole: (role: UserMode) => void, onBack: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full w-full bg-[#0f1c2c] flex flex-col items-center justify-center px-6 py-12 overflow-y-auto relative no-scrollbar"
    >
      <button 
        onClick={onBack}
        className="absolute top-8 left-8 w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white active:scale-90 transition-transform z-[100]"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      <div className="mb-10 text-center">
        <h1 className="text-5xl font-extrabold text-secondary-fixed tracking-tight font-headline italic mb-2">TaNaMao</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 w-full max-w-sm">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectRole('merchant')}
          className="bg-white/5 rounded-[2rem] p-6 flex flex-row items-center gap-6 shadow-2xl border border-white/10 group relative overflow-hidden text-left"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary-fixed/10 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 shrink-0">
            <Store className="w-8 h-8 text-primary-fixed" />
          </div>
          <div className="relative z-10">
            <h3 className="text-xl font-black text-white font-headline mb-0.5">Sou Lojista</h3>
            <p className="text-[10px] text-white/40 font-bold leading-tight">Quero solicitar entregas rápidas para meus clientes</p>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectRole('courier')}
          className="bg-white/5 rounded-[2rem] p-6 flex flex-row items-center gap-6 shadow-2xl border border-white/10 group relative overflow-hidden text-left"
        >
          <div className="w-16 h-16 rounded-2xl bg-secondary-fixed/10 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 shrink-0">
            <Bike className="w-8 h-8 text-secondary-fixed" />
          </div>
          <div className="relative z-10">
            <h3 className="text-xl font-black text-white font-headline mb-0.5">Sou Entregador</h3>
            <p className="text-[10px] text-white/40 font-bold leading-tight">Quero realizar entregas e aumentar meus ganhos</p>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectRole('admin')}
          className="bg-white/5 rounded-[2rem] p-6 flex flex-row items-center gap-6 shadow-2xl border border-white/10 group relative overflow-hidden text-left"
        >
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 shrink-0">
            <ShieldCheck className="w-8 h-8 text-white/80" />
          </div>
          <div className="relative z-10">
            <h3 className="text-xl font-black text-white font-headline mb-0.5">Administrador</h3>
            <p className="text-[10px] text-white/40 font-bold leading-tight">Gestão completa da plataforma e monitoramento</p>
          </div>
        </motion.button>
      </div>
    </motion.div>
  );
}

function RegistrationScreen({ role, onBack, onComplete, showToast }: { role: UserMode, onBack: () => void, onComplete: () => void, showToast: (msg: string, type?: any) => void }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    taxId: '', // CNPJ or CPF
    email: '',
    password: '',
    phone: '',
    address: ''
  });

  const isMerchant = role === 'merchant';

  const handleNext = () => {
    if (step === 1) {
      if (!formData.name || !formData.taxId) {
        showToast("Por favor, preencha todos os campos.", "error");
        return;
      }
    }
    if (step === 2) {
      if (!formData.phone) {
        showToast("Por favor, preencha o telefone.", "error");
        return;
      }
      if (isMerchant && (!formData.address || formData.address.length < 10)) {
        showToast("Por favor, insira o endereço completo da loja.", "error");
        return;
      }
    }
    setStep(s => s + 1);
  };
  const handleBack = () => step > 1 ? setStep(s => s - 1) : onBack();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const isValidEmail = (email: string) => {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email);
    };

    if (!formData.email || !formData.password || !formData.name || !formData.taxId) {
      showToast("Por favor, preencha todos os campos obrigatórios.", "error");
      return;
    }

    if (!isValidEmail(formData.email)) {
      showToast("Por favor, insira um e-mail válido.", "error");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      const profile: UserProfile = {
        uid: user.uid,
        name: formData.name,
        email: formData.email,
        role: role,
        cnpj: isMerchant ? formData.taxId : undefined,
        cpf: !isMerchant ? formData.taxId : undefined,
        phone: formData.phone,
        address: formData.address,
        profilePic: ASSETS.PROFILE_PIC,
        createdAt: new Date().toISOString(),
        isOnline: role === 'courier' ? false : undefined,
        lastActive: role === 'courier' ? new Date().toISOString() : undefined
      };

      await setDoc(doc(db, 'users', user.uid), profile);
      
      showToast(`Cadastro realizado com sucesso! Bem-vindo ao TaNaMao ${isMerchant ? 'Business' : 'Parceiro'}.`, "success");
      onComplete();
    } catch (error: any) {
      console.error("Registration error:", error);
      let message = "Falha no cadastro. Tente novamente.";
      if (error.code === 'auth/email-already-in-use') message = "Este e-mail já está em uso.";
      if (error.code === 'auth/weak-password') message = "A senha deve ter pelo menos 6 caracteres.";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full w-full bg-surface flex flex-col items-center justify-center p-8 relative overflow-y-auto no-scrollbar"
    >
      <div className={cn("absolute top-0 left-0 w-full h-1.5", isMerchant ? "bg-secondary-fixed" : "bg-primary-container")} />
      
      <button 
        onClick={handleBack}
        className="absolute top-8 left-8 w-12 h-12 rounded-2xl flex items-center justify-center bg-surface-container-low text-on-surface border border-outline-variant shadow-sm active:scale-90 transition-transform z-[100]"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      <div className="w-full max-w-sm">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs italic", isMerchant ? "bg-secondary-fixed text-on-secondary-fixed" : "bg-primary-container text-white")}>
              {step}
            </div>
            <h2 className="text-2xl font-black tracking-tighter italic text-on-surface">
              {step === 1 ? (isMerchant ? 'Dados da Loja' : 'Dados Pessoais') : step === 2 ? 'Contato' : 'Segurança'}
            </h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="space-y-4">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Test Helper for Step 1 */}
                <button 
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      name: isMerchant ? 'Pizzaria Teste' : 'João Entregador',
                      taxId: isMerchant ? '12.345.678/0001-90' : '123.456.789-00',
                      phone: '(11) 99999-9999',
                      address: 'Rua de Teste, 123'
                    });
                    showToast("Dados de teste preenchidos!", "info");
                  }}
                  className="w-full py-2.5 bg-primary-container/5 text-primary-container rounded-xl text-[9px] font-black uppercase tracking-widest border border-primary-container/10 mb-2"
                >
                  Preencher Dados de Teste
                </button>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 ml-1">
                    {isMerchant ? 'Nome Fantasia' : 'Nome Completo'}
                  </label>
                  <input 
                    type="text" 
                    placeholder={isMerchant ? "Ex: Pizzaria do Zé" : "Seu nome completo"}
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-5 py-4 bg-surface-container-low border border-outline-variant rounded-2xl text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary-fixed/20 transition-all placeholder:text-on-surface-variant/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 ml-1">
                    {isMerchant ? 'CNPJ' : 'CPF'}
                  </label>
                  <input 
                    type="text" 
                    placeholder={isMerchant ? "00.000.000/0000-00" : "000.000.000-00"}
                    value={formData.taxId}
                    onChange={e => setFormData({...formData, taxId: e.target.value})}
                    className="w-full px-5 py-4 bg-surface-container-low border border-outline-variant rounded-2xl text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary-fixed/20 transition-all placeholder:text-on-surface-variant/30"
                  />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 ml-1">Telefone / WhatsApp</label>
                  <input 
                    type="tel" 
                    placeholder="(00) 00000-0000"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-5 py-4 bg-surface-container-low border border-outline-variant rounded-2xl text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary-fixed/20 transition-all placeholder:text-on-surface-variant/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 ml-1">Endereço Completo</label>
                  <textarea 
                    placeholder="Rua, número, bairro, cidade..."
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    className="w-full px-5 py-4 bg-surface-container-low border border-outline-variant rounded-2xl text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary-fixed/20 transition-all min-h-[100px] resize-none placeholder:text-on-surface-variant/30"
                  />
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Test Helper for Step 3 */}
                <button 
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      email: isMerchant ? 'loja@teste.com' : 'entregador@teste.com',
                      password: 'senha123'
                    });
                    showToast("Credenciais de teste preenchidas!", "info");
                  }}
                  className="w-full py-2.5 bg-primary-container/5 text-primary-container rounded-xl text-[9px] font-black uppercase tracking-widest border border-primary-container/10 mb-2"
                >
                  Preencher Credenciais de Teste
                </button>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 ml-1">E-mail de Acesso</label>
                  <input 
                    type="email" 
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full px-5 py-4 bg-surface-container-low border border-outline-variant rounded-2xl text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary-fixed/20 transition-all placeholder:text-on-surface-variant/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 ml-1">Senha de Acesso</label>
                  <input 
                    type="password" 
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    className="w-full px-5 py-4 bg-surface-container-low border border-outline-variant rounded-2xl text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary-fixed/20 transition-all placeholder:text-on-surface-variant/30"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </div>

          <div className="mt-8">
            {step < 3 ? (
              <button 
                type="button"
                onClick={handleNext}
                className={cn("w-full py-5 font-black rounded-2xl shadow-xl active:scale-95 transition-all uppercase tracking-[0.2em] text-xs", isMerchant ? "bg-primary-container text-white shadow-primary-container/30" : "bg-primary-container text-white shadow-primary-container/30")}
              >
                Próximo Passo
              </button>
            ) : (
              <button 
                type="submit"
                disabled={loading}
                className={cn("w-full py-5 font-black rounded-2xl shadow-xl active:scale-95 transition-all uppercase tracking-[0.2em] text-xs", isMerchant ? "bg-secondary-fixed text-on-secondary-fixed shadow-secondary-fixed/30" : "bg-secondary-fixed text-on-secondary-fixed shadow-secondary-fixed/30")}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-on-secondary-fixed border-t-transparent rounded-full animate-spin mx-auto" />
                ) : (
                  'Finalizar Cadastro'
                )}
              </button>
            )}
          </div>
        </form>

        <div className="mt-8 flex justify-center gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className={cn("h-1 rounded-full transition-all duration-500", i === step ? "w-8 bg-primary-container" : "w-2 bg-black/5")} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function LoginScreen({ onLogin, onBack, onRegister, role, showToast }: { onLogin: () => void, onBack: () => void, onRegister: () => void, role: UserMode, showToast: (msg: string, type?: any) => void }) {
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'google' | 'email'>(role === 'courier' ? 'google' : 'email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleGoogleLogin = async () => {
    if (loading) return;
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      onLogin();
    } catch (error) {
      console.error("Login failed:", error);
      showToast("Falha no login. Tente novamente.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      showToast("Por favor, informe seu e-mail para redefinir a senha.", "info");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      showToast("E-mail de redefinição enviado! Verifique sua caixa de entrada.", "success");
    } catch (error: any) {
      console.error("Reset error:", error);
      showToast("Falha ao enviar e-mail de redefinição. Verifique o endereço informado.", "error");
    }
  };

  const handleEmailAction = async (e: FormEvent, action: 'login' | 'register') => {
    e.preventDefault();
    if (loading) return;
    
    console.log(`${action === 'register' ? 'Registering' : 'Logging in'} for:`, email, "as role:", role);
    if (!email || !password) {
      showToast("Por favor, informe e-mail e senha.", "info");
      return;
    }

    setLoading(true);
    try {
      if (action === 'register') {
        // Only allow master admin to register as admin via this flow
        if (role === 'admin' && email !== 'mauriciocardoso896@gmail.com') {
          showToast("Apenas o administrador mestre pode criar contas administrativas.", "error");
          setLoading(false);
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log("Registration successful, user:", userCredential.user.uid);
      } else {
        // If logging in as admin, warn if not master email
        if (role === 'admin' && email !== 'mauriciocardoso896@gmail.com') {
          console.warn("Attempting admin login with non-master email. User will be treated as merchant.");
        }
        console.log("Attempting sign in for:", email);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log("Login successful, user:", userCredential.user.uid);
      }
      console.log("Auth action complete, calling onLogin");
      onLogin();
    } catch (error: any) {
      console.error("Auth error code:", error.code);
      console.error("Auth error message:", error.message);
      let message = "Falha na autenticação. Verifique suas credenciais.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        message = "E-mail ou senha incorretos. Se você ainda não tem uma conta, clique em 'Criar Conta'.";
      } else if (error.code === 'auth/email-already-in-use') {
        message = "Este e-mail já está em uso. Clique em 'Entrar'.";
      } else if (error.code === 'auth/weak-password') {
        message = "A senha deve ter pelo menos 6 caracteres.";
      } else if (error.code === 'auth/too-many-requests') {
        message = "Muitas tentativas falhas. Tente novamente mais tarde ou redefina sua senha.";
      }
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const isMerchant = role === 'merchant';
  const isAdmin = role === 'admin';

  const handleTestAccess = async (type: 'test' | 'admin') => {
    if (loading) return;
    setLoading(true);
    
    const testEmail = type === 'admin' ? 'mauriciocardoso896@gmail.com' : (isMerchant ? 'loja@teste.com' : 'entregador@teste.com');
    const testPass = type === 'admin' ? 'admin123' : 'senha123';
    
    setEmail(testEmail);
    setPassword(testPass);
    if (isMerchant) setCnpj('12.345.678/0001-90');

    try {
      // Try to login first
      await signInWithEmailAndPassword(auth, testEmail, testPass);
      showToast(`Acesso ${type === 'admin' ? 'Admin' : 'Teste'} realizado!`, "success");
      onLogin();
    } catch (error: any) {
      // If user doesn't exist, create it automatically for testing
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        try {
          await createUserWithEmailAndPassword(auth, testEmail, testPass);
          showToast(`Conta de ${type} criada e logada automaticamente!`, "success");
          onLogin();
        } catch (regError: any) {
          showToast("Erro no acesso automático. Tente o botão 'Entrar'.", "error");
        }
      } else {
        showToast("Erro ao acessar conta de teste.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full w-full flex flex-col items-center justify-start pt-24 pb-32 p-8 relative overflow-y-auto no-scrollbar bg-surface"
    >
      {/* Background Decorative Elements for Merchant or Admin */}
      {(isMerchant || isAdmin) && (
        <>
          <div className={cn("absolute top-0 left-0 w-full h-1.5", isMerchant ? "bg-secondary-fixed" : "bg-white/20")} />
          <div className={cn("absolute -top-32 -right-32 w-80 h-80 rounded-full blur-[100px]", isMerchant ? "bg-secondary-fixed/10" : "bg-white/5")} />
          <div className={cn("absolute -bottom-32 -left-32 w-80 h-80 rounded-full blur-[100px]", isMerchant ? "bg-secondary-fixed/10" : "bg-white/5")} />
        </>
      )}

      <button 
        onClick={onBack}
        className="absolute top-8 left-8 w-12 h-12 rounded-2xl flex items-center justify-center active:scale-90 transition-transform border shadow-md z-[100] bg-surface-container-low text-on-surface border-outline-variant"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      <div className="mb-10 text-center relative z-10">
        <motion.div 
          layoutId="login-icon"
          className={cn(
            "w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-2xl transition-all duration-500",
            role === 'courier' ? "bg-secondary-fixed shadow-[0_20px_50px_rgba(195,244,0,0.3)]" : 
            role === 'admin' ? "bg-white/20 shadow-xl" :
            "bg-surface-container-high shadow-[0_20px_60px_rgba(0,0,0,0.3)] border border-outline-variant"
          )}
        >
          {role === 'courier' ? <Bike className="w-12 h-12 text-on-secondary-fixed" /> : 
           role === 'admin' ? <ShieldCheck className="w-12 h-12 text-white" /> :
           <div className="relative">
             <Store className="w-12 h-12 text-secondary-fixed" />
             <div className="absolute -top-1 -right-1 w-4 h-4 bg-secondary-fixed rounded-full border-2 border-surface" />
           </div>}
        </motion.div>
        
        <h1 className="text-4xl font-black tracking-tighter mb-2 font-headline italic text-on-surface">
          TaNaMao <span className="text-secondary-fixed">Business</span>
        </h1>
      </div>

      <div className="w-full max-w-sm space-y-6 relative z-10">
        {/* Method Toggle */}
        {!isAdmin && (
          <div className="flex p-1.5 rounded-2xl mb-2 bg-surface-container-low">
            <button 
              onClick={() => setLoginMethod('google')}
              className={cn(
                "flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300",
                loginMethod === 'google' ? "bg-surface-container-high text-on-surface shadow-md" : "text-on-surface-variant"
              )}
            >
              Google Auth
            </button>
            <button 
              onClick={() => setLoginMethod('email')}
              className={cn(
                "flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300",
                loginMethod === 'email' ? "bg-surface-container-high text-on-surface shadow-md" : "text-on-surface-variant"
              )}
            >
              Acesso Direto
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {loginMethod === 'google' && !isAdmin ? (
            <motion.div
              key="google-login"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-4"
            >
              <button 
                onClick={handleGoogleLogin}
                disabled={loading}
                className={cn(
                  "w-full py-4.5 font-black rounded-2xl flex items-center justify-center gap-4 active:scale-95 transition-all shadow-xl border bg-white text-[#1A1C1E]",
                  isMerchant ? "border-black/5 hover:bg-surface-container-low" : "border-transparent"
                )}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-primary-container border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
                    <span className="text-xs uppercase tracking-[0.15em]">Entrar com Google</span>
                  </>
                )}
              </button>
              
              {role === 'courier' && (
                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                  <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest"><span className="bg-[#0f1c2c] px-4 text-white/20">Acesso Rápido</span></div>
                </div>
              )}

              {role === 'courier' && (
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => handleTestAccess('test')}
                    disabled={loading}
                    className="py-3.5 bg-white/5 text-white/40 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    Visitante
                  </button>
                  <button 
                    onClick={() => handleTestAccess('test')}
                    disabled={loading}
                    className="py-3.5 bg-white/5 text-white/40 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    Suporte
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.form
              key="email-login"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-4"
            >
              <div className="space-y-3">
                {isMerchant && (
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center opacity-40">
                      <span className="text-[10px] font-black text-secondary-fixed">CNPJ</span>
                    </div>
                    <input 
                      type="text" 
                      placeholder="00.000.000/0000-00"
                      value={cnpj}
                      onChange={(e) => setCnpj(e.target.value)}
                      className="w-full pl-14 pr-4 py-4 bg-surface-container-low border border-outline-variant rounded-2xl text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary-fixed/20 transition-all placeholder:text-on-surface-variant/30"
                    />
                  </div>
                )}
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40 text-on-surface" />
                  <input 
                    type="email" 
                    placeholder={isAdmin ? "E-mail administrativo" : "E-mail do gestor"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-surface-container-low border border-outline-variant rounded-2xl text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary-fixed/20 transition-all placeholder:text-on-surface-variant/30"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40 text-on-surface" />
                  <input 
                    type="password" 
                    placeholder="Sua senha de acesso"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-surface-container-low border border-outline-variant rounded-2xl text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary-fixed/20 transition-all placeholder:text-on-surface-variant/30"
                  />
                </div>
              </div>
              
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="remember" className="w-4 h-4 rounded border-black/10 text-primary-container focus:ring-primary-container/20" />
                  <label htmlFor="remember" className={cn("text-[10px] font-bold uppercase tracking-wider", isMerchant ? "text-on-surface-variant/60" : "text-white/30")}>Lembrar</label>
                </div>
                <button 
                  type="button" 
                  onClick={handlePasswordReset}
                  className={cn("text-[10px] font-black uppercase tracking-widest hover:underline", isMerchant ? "text-primary-container" : "text-white/40")}
                >
                  Esqueci a senha
                </button>
              </div>

              <div className="flex gap-3 mt-4">
                <button 
                  type="button"
                  onClick={(e) => handleEmailAction(e as any, 'login')}
                  disabled={loading || !email || !password}
                  className={cn(
                    "flex-1 py-4.5 font-black rounded-2xl shadow-xl active:scale-95 transition-all disabled:opacity-50 uppercase tracking-[0.2em] text-[10px]",
                    isMerchant 
                      ? "bg-secondary-fixed text-on-secondary-fixed shadow-secondary-fixed/30" 
                      : "bg-white text-[#1A1C1E] shadow-white/10"
                  )}
                >
                  {loading ? (
                    <div className={cn("w-5 h-5 border-2 border-t-transparent rounded-full animate-spin mx-auto", isMerchant ? "border-white" : "border-primary-container")} />
                  ) : (
                    "Entrar"
                  )}
                </button>
                <button 
                  type="button"
                  onClick={onRegister}
                  disabled={loading}
                  className={cn(
                    "flex-1 py-4.5 font-black rounded-2xl shadow-xl active:scale-95 transition-all disabled:opacity-50 uppercase tracking-[0.2em] text-[10px]",
                    isMerchant 
                      ? "bg-surface-container-high text-on-surface border border-outline-variant shadow-sm" 
                      : "bg-white/10 text-white border border-white/20 shadow-sm"
                  )}
                >
                  {loading ? (
                    <div className={cn("w-5 h-5 border-2 border-t-transparent rounded-full animate-spin mx-auto", isMerchant ? "border-primary-container" : "border-white")} />
                  ) : (
                    "Criar Conta"
                  )}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Test Login Helper */}
        <div className={cn(
          "pt-6 border-t mt-6 relative z-10 w-full",
          isMerchant ? "border-black/5" : "border-white/10"
        )}>
          <p className={cn(
            "text-[9px] font-black text-center uppercase tracking-[0.3em] mb-4",
            isMerchant ? "text-on-surface-variant/30" : "text-white/20"
          )}>
            Ambiente de Teste
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button 
              type="button"
              onClick={() => handleTestAccess('test')}
              disabled={loading}
              className={cn(
                "py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 flex flex-col items-center justify-center gap-0.5",
                isMerchant ? "bg-black/5 text-on-surface-variant/60" : "bg-white/5 text-white/40"
              )}
            >
              <span>{loading ? "..." : "Acesso Teste"}</span>
              {!loading && <span className="text-[7px] opacity-50 lowercase tracking-normal">{isMerchant ? 'loja@teste.com' : 'entregador@teste.com'}</span>}
            </button>
            <button 
              type="button"
              onClick={() => handleTestAccess('admin')}
              disabled={loading}
              className={cn(
                "py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 flex flex-col items-center justify-center gap-0.5",
                isMerchant ? "bg-black/5 text-on-surface-variant/60" : "bg-white/5 text-white/40"
              )}
            >
              <span>{loading ? "..." : "Acesso Admin"}</span>
              {!loading && <span className="text-[7px] opacity-50 lowercase tracking-normal">mauriciocardoso896@gmail.com</span>}
            </button>
          </div>
        </div>

        {isMerchant && (
          <div className="text-center pt-6">
            <p className={cn("text-xs font-bold", isMerchant ? "text-on-surface-variant/60" : "text-white/40")}>
              Ainda não é parceiro? {' '}
              <button onClick={onRegister} className="text-primary-container font-black uppercase tracking-widest text-[10px] hover:underline ml-1">
                Cadastre sua loja
              </button>
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function AdminErrorBoundary({ children }: { children: ReactNode }) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const handleError = (e: ErrorEvent) => {
      console.error("Caught error in AdminDashboard:", e.error);
      setHasError(true);
      setError(e.error);
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#0f1c2c] text-white p-10 text-center">
        <AlertCircle className="w-20 h-20 text-red-500 mb-6" />
        <h1 className="text-3xl font-black mb-4 tracking-tighter">Ops! Ocorreu um erro no Dashboard</h1>
        <p className="text-white/60 mb-8 max-w-md font-medium">Não foi possível carregar o painel administrativo. Por favor, tente recarregar a página.</p>
        <pre className="bg-black/20 p-4 rounded-xl text-[10px] font-mono text-left mb-8 overflow-auto max-w-full border border-white/10">
          {error?.message || "Erro desconhecido"}
        </pre>
        <button onClick={() => window.location.reload()} className="bg-secondary-fixed text-on-secondary-fixed px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-secondary-fixed/20">
          Recarregar Página
        </button>
      </div>
    );
  }

  return <>{children}</>;
}

// --- Admin Dashboard ---

function AdminDashboard({ onLogout, showToast, showConfirm, pricingSettings }: { onLogout: () => void, showToast: (msg: string, type?: any) => void, showConfirm: (title: string, msg: string, onConfirm: () => void) => void, pricingSettings: PricingSettings }) {
  console.log("AdminDashboard: Rendering...");
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'deliveries' | 'settings'>('users');
  const [stats, setStats] = useState({ users: 0, deliveries: 0, revenue: 0 });
  const [recentDeliveries, setRecentDeliveries] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [allDeliveries, setAllDeliveries] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  const [localSettings, setLocalSettings] = useState<PricingSettings>(pricingSettings);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    setLocalSettings(pricingSettings);
  }, [pricingSettings]);

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await updateDoc(doc(db, 'settings', 'pricing'), {
        platformFee: Number(localSettings.platformFee),
        baseDistance: Number(localSettings.baseDistance),
        basePrice: Number(localSettings.basePrice),
        pricePerKm: Number(localSettings.pricePerKm)
      });
      showToast('Configurações salvas com sucesso.', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'settings/pricing');
      showToast('Erro ao salvar configurações.', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const fetchAdminData = async () => {
    try {
      console.log("AdminDashboard: Fetching users...");
      const usersSnap = await getDocs(collection(db, 'users'));
      console.log("AdminDashboard: Fetching deliveries...");
      const deliveriesSnap = await getDocs(query(collection(db, 'deliveries'), orderBy('createdAt', 'desc')));
      
      const users = usersSnap.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfile))
        .sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : (a.createdAt ? new Date(a.createdAt) : new Date(0));
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : (b.createdAt ? new Date(b.createdAt) : new Date(0));
          return dateB.getTime() - dateA.getTime();
        });
      const deliveries = deliveriesSnap.docs.map(doc => ({ ...doc.data(), id: doc.id })) as DeliveryData[];
      
      console.log(`AdminDashboard: Loaded ${users.length} users and ${deliveries.length} deliveries`);
      
      setAllUsers(users);
      setAllDeliveries(deliveries);
      setRecentDeliveries(deliveries.slice(0, 5));
      
      setStats({
        users: users.length,
        deliveries: deliveries.length,
        revenue: deliveries.reduce((acc, d) => acc + (d.price || 0), 0)
      });

      // Aggregate real chart data (last 7 days)
      const dailyData: Record<string, { count: number, revenue: number }> = {};
      const now = new Date();
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dayKey = d.toLocaleDateString('pt-BR', { weekday: 'short' });
        dailyData[dayKey] = { count: 0, revenue: 0 };
      }

      deliveries.forEach(d => {
        const date = d.createdAt?.toDate ? d.createdAt.toDate() : (d.createdAt ? new Date(d.createdAt) : null);
        if (date) {
          const dayKey = date.toLocaleDateString('pt-BR', { weekday: 'short' });
          if (dailyData[dayKey]) {
            dailyData[dayKey].count++;
            dailyData[dayKey].revenue += (d.price || 0);
          }
        }
      });

      const chart = Object.entries(dailyData).map(([name, data]) => ({
        name,
        entregas: data.count,
        receita: data.revenue
      })).reverse();
      
      setChartData(chart);

    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'admin-data');
    }
  };

  const { user, profile } = useContext(AuthContext)!;

  const handleCreateTestRide = async () => {
    if (!user) return;
    try {
      const mockDeliveryId = 'test-' + Math.floor(Math.random() * 10000);
      const newDelivery = {
        merchantId: user.uid,
        origin: 'Ponto de Teste A: Av. Paulista, 1000',
        destination: 'Ponto de Teste B: Rua Augusta, 500',
        customerName: 'Cliente de Teste',
        customerPhone: '(11) 99999-9999',
        notes: 'Esta é uma corrida de teste criada pelo administrador.',
        status: 'searching',
        price: 15.00,
        createdAt: serverTimestamp(),
        confirmationCode: Math.floor(1000 + Math.random() * 9000).toString(),
        destinationLocation: {
          lat: -23.5505 + (Math.random() - 0.5) * 0.05,
          lng: -46.6333 + (Math.random() - 0.5) * 0.05
        }
      };
      await addDoc(collection(db, 'deliveries'), newDelivery);
      showToast('Corrida de teste criada! Buscando motoboys...', 'success');
      fetchAdminData();
    } catch (error) {
      console.error("Error creating test ride:", error);
      showToast('Erro ao criar corrida de teste.', 'error');
    }
  };

  const handleSimulateCourier = async () => {
    try {
      const mockId = 'mock-courier-' + Math.floor(Math.random() * 1000);
      await setDoc(doc(db, 'users', mockId), {
        uid: mockId,
        name: 'Motoboy Simulado ' + mockId.slice(-3),
        email: `mock${mockId.slice(-3)}@tanamao.com`,
        role: 'courier',
        isOnline: true,
        lastActive: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      showToast('Motoboy simulado criado com sucesso!', 'success');
      fetchAdminData();
    } catch (error) {
      console.error("Error simulating courier:", error);
      showToast('Erro ao simular motoboy. Verifique as permissões.', 'error');
    }
  };

  useEffect(() => {
    console.log("AdminDashboard: Initial fetch effect");
    fetchAdminData();
  }, []);

  const handleUpdateUserRole = async (uid: string, newRole: UserMode) => {
    if (isUpdatingRole) return;
    setIsUpdatingRole(true);
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole });
      setIsUserModalOpen(false);
      showToast('Cargo atualizado com sucesso.', 'success');
      fetchAdminData();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (isDeletingUser) return;
    showConfirm(
      'Excluir Usuário',
      'Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.',
      async () => {
        setIsDeletingUser(uid);
        try {
          await deleteDoc(doc(db, 'users', uid));
          showToast('Usuário excluído com sucesso.', 'success');
          fetchAdminData();
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `users/${uid}`);
        } finally {
          setIsDeletingUser(null);
        }
      }
    );
  };

  return (
    <div className="h-full w-full bg-surface flex flex-col lg:flex-row overflow-hidden">
      {/* Sidebar (Desktop) */}
      <aside className="hidden lg:flex w-72 bg-[#0f1c2c] text-white flex-col shadow-2xl z-20">
        <div className="p-8 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-secondary-fixed flex items-center justify-center shadow-lg shadow-secondary-fixed/20">
            <Bike className="w-7 h-7 text-on-secondary-fixed" />
          </div>
          <div>
            <span className="text-2xl font-black tracking-tighter italic block leading-none">TaNaMao</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">Admin Panel</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2">
          <AdminNavItem icon={<BarChart3 className="w-5 h-5" />} label="Visão Geral" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
          <AdminNavItem icon={<Users className="w-5 h-5" />} label="Usuários" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
          <AdminNavItem icon={<Truck className="w-5 h-5" />} label="Entregas" active={activeTab === 'deliveries'} onClick={() => setActiveTab('deliveries')} />
          <AdminNavItem icon={<Settings className="w-5 h-5" />} label="Configurações" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>

        <div className="p-6 border-t border-white/5">
          <div className="bg-white/5 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-secondary-fixed/20 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-secondary-fixed" />
              </div>
              <div>
                <p className="text-sm font-bold">Admin Master</p>
                <p className="text-[10px] text-white/40">Status: Online</p>
              </div>
            </div>
            <button 
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-red-500/10 hover:text-red-400 text-white/60 rounded-xl transition-all font-bold text-sm"
            >
              <LogOut className="w-4 h-4" />
              Sair do Sistema
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden bg-[#0f1c2c] text-white p-4 flex items-center justify-between z-30 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary-fixed flex items-center justify-center shadow-lg shadow-secondary-fixed/20">
            <Bike className="w-6 h-6 text-on-secondary-fixed" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tighter italic block leading-none">TaNaMao</span>
            <span className="text-[8px] uppercase tracking-[0.2em] text-white/40 font-bold">Admin Panel</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
            <ShieldCheck className="w-5 h-5 text-secondary-fixed" />
          </div>
          <button 
            onClick={onLogout}
            className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-400"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto no-scrollbar p-4 lg:p-10 pb-24 lg:pb-10">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 lg:gap-0 mb-8 lg:mb-12">
          <div>
            <h1 className="text-2xl lg:text-4xl font-black text-on-surface tracking-tight mb-1 lg:mb-2">
              {activeTab === 'overview' && 'Dashboard'}
              {activeTab === 'users' && 'Gestão de Usuários'}
              {activeTab === 'deliveries' && 'Logística de Entregas'}
              {activeTab === 'settings' && 'Configurações'}
            </h1>
          </div>
          <div className="flex items-center gap-4 bg-surface-container-low p-2 rounded-2xl shadow-sm border border-outline-variant w-full lg:w-auto">
            <div className="flex-1 lg:flex-none px-4 py-1 lg:py-2 text-left lg:text-right">
              <p className="text-[8px] lg:text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Data Atual</p>
              <p className="text-sm lg:text-base font-bold text-on-surface">{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-surface-container-highest flex items-center justify-center border border-outline-variant shrink-0">
              <Calendar className="w-5 h-5 lg:w-6 lg:h-6 text-on-surface-variant" />
            </div>
          </div>
        </header>

        {activeTab === 'overview' && (
          <div className="space-y-6 lg:space-y-10">
            {/* Simulation Tools */}
            <div className="bg-[#0f1c2c] p-6 lg:p-8 rounded-3xl lg:rounded-[2.5rem] shadow-xl border border-white/5 relative overflow-hidden group">
              <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-secondary-fixed/20 flex items-center justify-center shadow-inner">
                    <Zap className="w-8 h-8 text-secondary-fixed animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white mb-1">Simulador de Testes</h3>
                    <p className="text-sm text-white/40 font-bold">Crie motoboys fictícios ou corridas de teste para validar o sistema.</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                  <button 
                    onClick={handleCreateTestRide}
                    className="flex-1 lg:flex-none px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-3"
                  >
                    <Truck className="w-5 h-5" />
                    Criar Corrida Teste
                  </button>
                  <button 
                    onClick={handleSimulateCourier}
                    className="flex-1 lg:flex-none px-8 py-4 bg-secondary-fixed text-on-secondary-fixed rounded-2xl font-black text-sm shadow-lg shadow-secondary-fixed/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    <Plus className="w-5 h-5" />
                    Simular Motoboy Online
                  </button>
                </div>
              </div>
              <div className="absolute top-[-50%] right-[-10%] w-64 h-64 bg-secondary-fixed/5 blur-[100px] rounded-full group-hover:bg-secondary-fixed/10 transition-all duration-700" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-8">
              <AdminStatCard icon={<Users />} label="Usuários Ativos" value={stats.users.toString()} color="blue" trend="+12%" />
              <AdminStatCard icon={<Truck />} label="Entregas Totais" value={stats.deliveries.toString()} color="green" trend="+5.4%" />
              <AdminStatCard icon={<DollarSign />} label="Receita Bruta" value={`R$ ${stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} color="lime" trend="+8.1%" />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
              <div className="lg:col-span-2 bg-white p-6 lg:p-8 rounded-3xl lg:rounded-[2.5rem] shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6 lg:mb-8">
                  <h3 className="text-lg lg:text-xl font-black text-[#0f1c2c]">Desempenho Semanal</h3>
                  <select className="bg-gray-50 border-none rounded-xl text-[10px] lg:text-xs font-bold px-3 lg:px-4 py-2 outline-none">
                    <option>Últimos 7 dias</option>
                    <option>Últimos 30 dias</option>
                  </select>
                </div>
                <div className="h-[200px] lg:h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#c3f400" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#c3f400" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 600, fill: '#9ca3af'}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 600, fill: '#9ca3af'}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', fontWeight: 'bold', fontSize: '12px' }}
                      />
                      <Area type="monotone" dataKey="receita" stroke="#c3f400" strokeWidth={4} fillOpacity={1} fill="url(#colorRec)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-[#0f1c2c] p-6 lg:p-8 rounded-3xl lg:rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-lg lg:text-xl font-black mb-6">Metas do Mês</h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-2 text-white/40">
                        <span>Entregas</span>
                        <span>85%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-secondary-fixed w-[85%] rounded-full" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-2 text-white/40">
                        <span>Novos Merchants</span>
                        <span>62%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-400 w-[62%] rounded-full" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-2 text-white/40">
                        <span>Satisfação</span>
                        <span>94%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-green-400 w-[94%] rounded-full" />
                      </div>
                    </div>
                  </div>
                  <button className="w-full mt-8 lg:mt-10 py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-bold text-sm transition-all border border-white/10">
                    Ver Relatório Completo
                  </button>
                </div>
                <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-secondary-fixed/10 blur-[80px] rounded-full" />
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              <div className="bg-white p-6 lg:p-8 rounded-3xl lg:rounded-[2.5rem] shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6 lg:mb-8">
                  <h3 className="text-lg lg:text-xl font-black text-[#0f1c2c] flex items-center gap-3">
                    <Clock className="w-5 h-5 lg:w-6 lg:h-6 text-secondary-fixed" />
                    Últimas Entregas
                  </h3>
                  <button onClick={() => setActiveTab('deliveries')} className="text-xs font-bold text-secondary-fixed hover:underline">Ver todas</button>
                </div>
                <div className="space-y-4">
                  {recentDeliveries.map((delivery, i) => (
                    <div key={`recent-${delivery.id || i}`} className="flex items-center justify-between p-4 lg:p-5 bg-gray-50 rounded-2xl lg:rounded-3xl border border-gray-100 hover:border-secondary-fixed/30 transition-all group">
                      <div className="flex items-center gap-3 lg:gap-4 min-w-0">
                        <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform shrink-0">
                          <Truck className="w-5 h-5 lg:w-6 lg:h-6 text-gray-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-[#0f1c2c] text-sm lg:text-base truncate">{delivery.destination}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter truncate">{delivery.customerName} • R$ {delivery.price?.toFixed(2)}</p>
                        </div>
                      </div>
                      <span className={cn(
                        "px-3 lg:px-4 py-1.5 rounded-full text-[8px] lg:text-[10px] font-black uppercase tracking-widest shrink-0",
                        delivery.status === 'delivered' ? 'bg-green-100 text-green-600' : 
                        delivery.status === 'searching' ? 'bg-blue-100 text-blue-600 animate-pulse' :
                        'bg-yellow-100 text-yellow-600'
                      )}>
                        {delivery.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 lg:p-8 rounded-3xl lg:rounded-[2.5rem] shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6 lg:mb-8">
                  <h3 className="text-lg lg:text-xl font-black text-[#0f1c2c] flex items-center gap-3">
                    <Users className="w-5 h-5 lg:w-6 lg:h-6 text-secondary-fixed" />
                    Novos Membros
                  </h3>
                  <button onClick={() => setActiveTab('users')} className="text-xs font-bold text-secondary-fixed hover:underline">Ver todos</button>
                </div>
                <div className="space-y-4">
                  {allUsers.slice(0, 5).map((u, i) => (
                    <div key={`recent-user-${u.uid || i}`} className="flex items-center justify-between p-4 lg:p-5 bg-gray-50 rounded-2xl lg:rounded-3xl border border-gray-100 group">
                      <div className="flex items-center gap-3 lg:gap-4 min-w-0">
                        <div className="relative shrink-0">
                          <img src={u.profilePic} alt={u.name} className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl object-cover shadow-sm group-hover:scale-110 transition-transform" />
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 lg:w-4 lg:h-4 rounded-full bg-green-500 border-2 border-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-[#0f1c2c] text-sm lg:text-base truncate">{u.name}</p>
                          <p className="text-[10px] text-gray-400 font-bold truncate">{u.email}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="px-2 lg:px-3 py-1 bg-[#0f1c2c] text-white rounded-lg text-[8px] lg:text-[9px] font-black uppercase tracking-widest">
                          {u.role}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-3xl lg:rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 lg:p-8 border-b border-gray-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gray-50/50">
              <div className="relative w-full lg:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Buscar usuários..." 
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-secondary-fixed outline-none transition-all"
                />
              </div>
              <div className="flex gap-3 w-full lg:w-auto">
                <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-3 lg:py-2 bg-white border border-gray-200 rounded-xl text-xs lg:text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">
                  <Filter className="w-4 h-4" />
                  Filtrar
                </button>
                <button className="flex-[2] lg:flex-none flex items-center justify-center gap-2 px-6 py-3 lg:py-2 bg-secondary-fixed text-on-secondary-fixed rounded-xl text-xs lg:text-sm font-black shadow-lg shadow-secondary-fixed/20 active:scale-95 transition-all">
                  <Plus className="w-4 h-4" />
                  Novo Usuário
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[600px] lg:min-w-full">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 lg:px-8 py-4 lg:py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Perfil</th>
                    <th className="px-6 lg:px-8 py-4 lg:py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Email</th>
                    <th className="px-6 lg:px-8 py-4 lg:py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Papel</th>
                    <th className="px-6 lg:px-8 py-4 lg:py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allUsers.map((u, i) => (
                    <tr key={`all-user-${u.uid || i}`} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 lg:px-8 py-4 lg:py-5">
                        <div className="flex items-center gap-3 lg:gap-4">
                          <img src={u.profilePic} alt="" className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl shadow-sm" />
                          <span className="font-black text-[#0f1c2c] text-sm lg:text-base">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-6 lg:px-8 py-4 lg:py-5 text-xs lg:text-sm font-bold text-gray-400">{u.email}</td>
                      <td className="px-6 lg:px-8 py-4 lg:py-5">
                        <span className={cn(
                          "px-3 lg:px-4 py-1.5 rounded-full text-[8px] lg:text-[10px] font-black uppercase tracking-widest",
                          u.role === 'admin' ? 'bg-purple-100 text-purple-600' :
                          u.role === 'courier' ? 'bg-blue-100 text-blue-600' :
                          'bg-gray-100 text-gray-600'
                        )}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 lg:px-8 py-4 lg:py-5 text-right">
                        <div className="flex justify-end gap-2 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => { setEditingUser(u); setIsUserModalOpen(true); }}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(u.uid)}
                            disabled={isDeletingUser === u.uid}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            {isDeletingUser === u.uid ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'deliveries' && (
          <div className="bg-white rounded-3xl lg:rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 lg:p-8 border-b border-gray-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gray-50/50">
              <h3 className="text-lg lg:text-xl font-black text-[#0f1c2c]">Histórico de Entregas</h3>
              <div className="flex gap-3 w-full lg:w-auto">
                <div className="flex bg-gray-100 p-1 rounded-xl w-full lg:w-auto overflow-x-auto">
                  <button className="flex-1 lg:flex-none px-4 py-1.5 bg-white shadow-sm rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Todas</button>
                  <button className="flex-1 lg:flex-none px-4 py-1.5 text-gray-400 hover:text-gray-600 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Ativas</button>
                  <button className="flex-1 lg:flex-none px-4 py-1.5 text-gray-400 hover:text-gray-600 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Concluídas</button>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[700px] lg:min-w-full">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 lg:px-8 py-4 lg:py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Destino</th>
                    <th className="px-6 lg:px-8 py-4 lg:py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Cliente</th>
                    <th className="px-6 lg:px-8 py-4 lg:py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Data</th>
                    <th className="px-6 lg:px-8 py-4 lg:py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Valor</th>
                    <th className="px-6 lg:px-8 py-4 lg:py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allDeliveries.map((d, i) => (
                    <tr key={`all-delivery-${d.id || i}`} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 lg:px-8 py-4 lg:py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                            <MapPin className="w-4 h-4 text-gray-400" />
                          </div>
                          <span className="font-black text-[#0f1c2c] text-xs lg:text-sm">{d.destination}</span>
                        </div>
                      </td>
                      <td className="px-6 lg:px-8 py-4 lg:py-5">
                        <p className="font-bold text-xs lg:text-sm text-[#0f1c2c]">{d.customerName}</p>
                        <p className="text-[9px] lg:text-[10px] text-gray-400 font-bold">{d.customerPhone}</p>
                      </td>
                      <td className="px-6 lg:px-8 py-4 lg:py-5 text-xs lg:text-sm font-bold text-gray-400">
                        {d.createdAt?.toDate ? d.createdAt.toDate().toLocaleDateString('pt-BR') : 'Recent'}
                      </td>
                      <td className="px-6 lg:px-8 py-4 lg:py-5 font-black text-[#0f1c2c] text-xs lg:text-sm">R$ {d.price?.toFixed(2)}</td>
                      <td className="px-6 lg:px-8 py-4 lg:py-5">
                        <span className={cn(
                          "px-3 lg:px-4 py-1.5 rounded-full text-[8px] lg:text-[10px] font-black uppercase tracking-widest",
                          d.status === 'delivered' ? 'bg-green-100 text-green-600' : 
                          d.status === 'searching' ? 'bg-blue-100 text-blue-600' :
                          'bg-yellow-100 text-yellow-600'
                        )}>
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <div className="bg-white p-6 lg:p-10 rounded-3xl lg:rounded-[2.5rem] shadow-sm border border-gray-100">
              <h3 className="text-xl lg:text-2xl font-black text-[#0f1c2c] mb-6 lg:mb-8">Parâmetros de Cobrança</h3>
              <div className="space-y-4 lg:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 lg:p-6 bg-gray-50 rounded-2xl lg:rounded-3xl border border-gray-100 gap-4">
                  <div>
                    <p className="font-black text-[#0f1c2c] text-sm lg:text-base">Taxa Fixa da Plataforma</p>
                    <p className="text-[10px] lg:text-xs text-gray-400 font-bold">Valor embutido em todas as corridas</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-gray-400 text-sm lg:text-base">R$</span>
                    <input type="number" value={localSettings.platformFee} onChange={(e) => setLocalSettings({...localSettings, platformFee: Number(e.target.value)})} className="w-full sm:w-24 bg-white border border-gray-200 rounded-xl px-3 py-2 font-black text-right outline-none focus:ring-2 focus:ring-secondary-fixed" />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 lg:p-6 bg-gray-50 rounded-2xl lg:rounded-3xl border border-gray-100 gap-4">
                  <div>
                    <p className="font-black text-[#0f1c2c] text-sm lg:text-base">Distância Base (km)</p>
                    <p className="text-[10px] lg:text-xs text-gray-400 font-bold">Até quantos km cobra o valor base</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="number" value={localSettings.baseDistance} onChange={(e) => setLocalSettings({...localSettings, baseDistance: Number(e.target.value)})} className="w-full sm:w-24 bg-white border border-gray-200 rounded-xl px-3 py-2 font-black text-right outline-none focus:ring-2 focus:ring-secondary-fixed" />
                    <span className="font-black text-gray-400 text-sm lg:text-base">km</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 lg:p-6 bg-gray-50 rounded-2xl lg:rounded-3xl border border-gray-100 gap-4">
                  <div>
                    <p className="font-black text-[#0f1c2c] text-sm lg:text-base">Valor Base</p>
                    <p className="text-[10px] lg:text-xs text-gray-400 font-bold">Valor cobrado até a distância base</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-gray-400 text-sm lg:text-base">R$</span>
                    <input type="number" value={localSettings.basePrice} onChange={(e) => setLocalSettings({...localSettings, basePrice: Number(e.target.value)})} className="w-full sm:w-24 bg-white border border-gray-200 rounded-xl px-3 py-2 font-black text-right outline-none focus:ring-2 focus:ring-secondary-fixed" />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 lg:p-6 bg-gray-50 rounded-2xl lg:rounded-3xl border border-gray-100 gap-4">
                  <div>
                    <p className="font-black text-[#0f1c2c] text-sm lg:text-base">Valor por Km Adicional</p>
                    <p className="text-[10px] lg:text-xs text-gray-400 font-bold">Cobrado acima da distância base</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-gray-400 text-sm lg:text-base">R$</span>
                    <input type="number" value={localSettings.pricePerKm} onChange={(e) => setLocalSettings({...localSettings, pricePerKm: Number(e.target.value)})} className="w-full sm:w-24 bg-white border border-gray-200 rounded-xl px-3 py-2 font-black text-right outline-none focus:ring-2 focus:ring-secondary-fixed" />
                  </div>
                </div>
              </div>
              <button 
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
                className="w-full mt-8 lg:mt-10 py-4 lg:py-5 bg-[#0f1c2c] text-white rounded-2xl lg:rounded-[1.5rem] font-black tracking-widest uppercase text-xs lg:text-sm shadow-xl shadow-[#0f1c2c]/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSavingSettings ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>

            <div className="bg-[#0f1c2c] p-6 lg:p-10 rounded-3xl lg:rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-xl lg:text-2xl font-black mb-6 lg:mb-8">Segurança e Logs</h3>
                <div className="space-y-4">
                  <div className="p-4 lg:p-6 bg-white/5 rounded-2xl lg:rounded-3xl border border-white/10">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-secondary-fixed/20 flex items-center justify-center">
                        <Lock className="w-5 h-5 text-secondary-fixed" />
                      </div>
                      <p className="font-bold">Backup Automático</p>
                    </div>
                    <p className="text-xs text-white/40 font-medium mb-4">Último backup realizado hoje às 04:00 AM</p>
                    <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-xs transition-all">Realizar Backup Agora</button>
                  </div>
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-blue-400" />
                      </div>
                      <p className="font-bold">Logs de Acesso</p>
                    </div>
                    <p className="text-xs text-white/40 font-medium mb-4">12 novos acessos administrativos detectados</p>
                    <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-xs transition-all">Ver Logs de Auditoria</button>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-secondary-fixed/5 blur-[100px] rounded-full" />
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0f1c2c]/90 backdrop-blur-md border-t border-white/5 px-6 py-3 flex justify-between items-center z-30">
        <MobileAdminNavItem icon={<BarChart3 />} label="Início" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
        <MobileAdminNavItem icon={<Users />} label="Usuários" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
        <MobileAdminNavItem icon={<Truck />} label="Entregas" active={activeTab === 'deliveries'} onClick={() => setActiveTab('deliveries')} />
        <MobileAdminNavItem icon={<Settings />} label="Ajustes" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
      </nav>

      {/* User Edit Modal */}
      <Modal 
        isOpen={isUserModalOpen} 
        onClose={() => setIsUserModalOpen(false)} 
        title="Editar Usuário"
      >
        {editingUser && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
              <img src={editingUser.profilePic} alt="" className="w-16 h-16 rounded-2xl object-cover shadow-md" />
              <div>
                <p className="text-xl font-black text-[#0f1c2c]">{editingUser.name}</p>
                <p className="text-sm text-gray-400 font-bold">{editingUser.email}</p>
              </div>
            </div>
            
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3">Alterar Papel do Usuário</label>
              <div className="grid grid-cols-3 gap-3">
                {(['merchant', 'courier', 'admin'] as UserMode[]).map(role => (
                  <button
                    key={role}
                    onClick={() => handleUpdateUserRole(editingUser.uid, role)}
                    disabled={isUpdatingRole}
                    className={cn(
                      "py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 disabled:opacity-50",
                      editingUser.role === role 
                        ? "bg-[#0f1c2c] text-white border-[#0f1c2c] shadow-lg" 
                        : "bg-white text-gray-400 border-gray-100 hover:border-gray-200"
                    )}
                  >
                    {isUpdatingRole && editingUser.role !== role ? (
                      <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto" />
                    ) : (
                      role
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 bg-yellow-50 rounded-2xl border border-yellow-100 flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0" />
              <p className="text-[10px] text-yellow-700 font-bold leading-relaxed">
                Alterar o papel de um usuário impacta diretamente suas permissões de acesso e funcionalidades disponíveis no aplicativo.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Modal({ isOpen, onClose, title, children, dark = false }: { isOpen: boolean, onClose: () => void, title: string, children: ReactNode, dark?: boolean }) {
  if (!isOpen) return null;
  return (
    <div className={cn(
      "fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm",
      dark ? "p-0" : "p-4"
    )}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={cn(
          "w-full overflow-hidden shadow-2xl flex flex-col",
          dark ? "bg-surface h-full max-w-none rounded-none" : "bg-white max-w-md rounded-[2.5rem]"
        )}
      >
        <div className={cn(
          "flex items-center",
          dark ? "bg-surface/80 backdrop-blur-xl border-b border-outline-variant px-6 py-4" : "border-b border-gray-100 bg-gray-50/30 p-8 justify-between"
        )}>
          {dark ? (
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="p-2 hover:bg-surface-container-highest rounded-full transition-colors">
                <ChevronLeft className="w-6 h-6 text-on-surface" />
              </button>
              <h3 className="text-xl font-extrabold text-on-surface tracking-tight font-headline">{title}</h3>
            </div>
          ) : (
            <>
              <h3 className="text-2xl font-black tracking-tight text-[#0f1c2c]">{title}</h3>
              <button onClick={onClose} className="p-2 rounded-full transition-colors hover:bg-gray-100">
                <XCircle className="w-7 h-7 text-gray-300" />
              </button>
            </>
          )}
        </div>
        <div className={cn("flex-1 overflow-y-auto", dark ? "p-6" : "p-8")}>
          {children}
        </div>
      </motion.div>
    </div>
  );
}

function AdminNavItem({ icon, label, active, onClick }: { icon: ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all relative group",
        active 
          ? "bg-secondary-fixed text-on-secondary-fixed shadow-xl shadow-secondary-fixed/20" 
          : "text-white/40 hover:text-white hover:bg-white/5"
      )}
    >
      <span className={cn("transition-colors", active ? "text-on-secondary-fixed" : "text-white/20 group-hover:text-white/60")}>
        {icon}
      </span>
      <span className="font-black text-sm tracking-tight">{label}</span>
      {active && (
        <motion.div 
          layoutId="activeNav"
          className="absolute right-4 w-1.5 h-1.5 bg-on-secondary-fixed rounded-full"
        />
      )}
    </button>
  );
}

function AdminStatCard({ icon, label, value, color, trend }: { icon: ReactNode, label: string, value: string, color: string, trend?: string }) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    lime: 'bg-secondary-fixed/10 text-[#0f1c2c]'
  };

  return (
    <div className="bg-white p-4 lg:p-8 rounded-3xl lg:rounded-[3rem] shadow-sm border border-gray-100 flex items-center gap-4 lg:gap-8 group hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-500">
      <div className={cn("w-12 h-12 lg:w-20 lg:h-20 rounded-2xl lg:rounded-[2rem] flex items-center justify-center transition-transform duration-500 group-hover:scale-110 shrink-0", colors[color])}>
        {cloneElement(icon as any, { className: 'w-6 h-6 lg:w-10 lg:h-10' })}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <p className="text-[8px] lg:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] truncate">{label}</p>
          {trend && <span className="text-[8px] lg:text-[10px] font-black text-green-500 bg-green-50 px-2 py-0.5 rounded-lg shrink-0">{trend}</span>}
        </div>
        <p className="text-xl lg:text-4xl font-black text-[#0f1c2c] tracking-tighter truncate">{value}</p>
      </div>
    </div>
  );
}

function MobileAdminNavItem({ icon, label, active, onClick }: { icon: ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-all",
        active ? "text-secondary-fixed" : "text-white/40"
      )}
    >
      <div className={cn(
        "p-2 rounded-xl transition-all",
        active ? "bg-secondary-fixed/10" : "bg-transparent"
      )}>
        {cloneElement(icon as any, { className: 'w-6 h-6' })}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
    </button>
  );
}

// --- Components ---
function NotificationDrawer({ isOpen, onClose, notifications, onMarkAsRead, onClearAll }: { isOpen: boolean, onClose: () => void, notifications: Notification[], onMarkAsRead: (id: string) => void, onClearAll: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-surface shadow-2xl z-[101] flex flex-col"
          >
            <header className="p-6 border-b border-outline-variant flex items-center justify-between bg-surface">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary-fixed/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-secondary-fixed" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-on-surface font-headline">Notificações</h2>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                    {notifications.filter(n => !n.isRead).length} não lidas
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button 
                    onClick={onClearAll}
                    className="p-2 text-on-surface-variant hover:text-error transition-colors"
                    title="Limpar tudo"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
                <button 
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-surface-container-low transition-colors"
                >
                  <XCircle className="w-6 h-6 text-on-surface-variant" />
                </button>
              </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
              {notifications.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                  <div className="w-20 h-20 rounded-full bg-surface-container-low flex items-center justify-center">
                    <Bell className="w-10 h-10 text-outline-variant" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-on-surface">Tudo limpo por aqui!</h3>
                    <p className="text-sm text-on-surface-variant">Você não tem nenhuma notificação no momento.</p>
                  </div>
                </div>
              ) : (
                notifications.map((notification) => (
                  <motion.div 
                    key={notification.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "p-5 rounded-[1.5rem] border transition-all cursor-pointer relative group",
                      notification.isRead 
                        ? "bg-surface-container-low border-outline-variant/30" 
                        : "bg-surface-container border-secondary-fixed/30 shadow-sm"
                    )}
                    onClick={() => notification.id && onMarkAsRead(notification.id)}
                  >
                    {!notification.isRead && (
                      <div className="absolute top-5 right-5 w-2 h-2 rounded-full bg-secondary-fixed shadow-[0_0_8px_rgba(195,244,0,0.5)]" />
                    )}
                    <div className="flex gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                        notification.type === 'success' ? "bg-emerald-500/10 text-emerald-500" :
                        notification.type === 'error' ? "bg-error/10 text-error" :
                        notification.type === 'warning' ? "bg-amber-500/10 text-amber-500" :
                        "bg-secondary-fixed/10 text-secondary-fixed"
                      )}>
                        {notification.type === 'success' && <CheckCircle2 className="w-6 h-6" />}
                        {notification.type === 'error' && <AlertCircle className="w-6 h-6" />}
                        {notification.type === 'warning' && <AlertCircle className="w-6 h-6" />}
                        {notification.type === 'info' && <Bell className="w-6 h-6" />}
                      </div>
                      <div className="flex-1 space-y-1">
                        <h4 className={cn(
                          "font-bold text-on-surface",
                          !notification.isRead && "text-lg"
                        )}>
                          {notification.title}
                        </h4>
                        <p className="text-sm text-on-surface-variant leading-relaxed">
                          {notification.message}
                        </p>
                        <p className="text-[10px] font-black text-outline-variant uppercase tracking-widest pt-1">
                          {notification.createdAt?.toDate ? notification.createdAt.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Agora'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </main>

            <footer className="p-6 border-t border-outline-variant bg-surface-container-low">
              <button 
                onClick={onClose}
                className="w-full py-4 bg-on-surface text-surface rounded-2xl font-bold active:scale-[0.98] transition-all"
              >
                FECHAR
              </button>
            </footer>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function SplashScreen() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full w-full flex flex-col items-center justify-center bg-[#0f1c2c] relative overflow-hidden"
    >
      {/* Background Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] rounded-full bg-secondary-fixed/5 blur-[100px]" />
      <div className="absolute bottom-[-5%] left-[-5%] w-[400px] h-[400px] rounded-full bg-white/5 blur-[120px]" />

      <div className="z-10 flex flex-col items-center gap-8">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="w-24 h-24 rounded-full bg-secondary-fixed flex items-center justify-center shadow-[0_20px_50px_rgba(195,244,0,0.15)]"
        >
          <Bike className="text-on-secondary-fixed w-12 h-12" />
        </motion.div>

        <div className="text-center">
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="font-headline font-extrabold text-5xl text-white tracking-tighter mb-2"
          >
            TaNaMao
          </motion.h1>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: 48 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="h-1 bg-secondary-fixed mx-auto rounded-full" 
          />
        </div>
      </div>

      <div className="absolute bottom-24 z-10 w-full px-8 flex flex-col items-center gap-8">
        <div className="text-center">
          <p className="font-headline font-semibold text-xl text-white/90 mb-1">
            Suas entregas na mão.
          </p>
          <p className="font-body text-xs text-white/40 tracking-widest uppercase font-medium">
            Eficiência em cada movimento
          </p>
        </div>
        
        <div className="w-48 h-[2px] bg-white/10 rounded-full overflow-hidden">
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: '0%' }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="h-full bg-secondary-fixed w-full rounded-full" 
          />
        </div>
      </div>

      <footer className="absolute bottom-8 w-full text-center px-6">
        <p className="font-body text-[0.6875rem] text-white/20 tracking-[0.1em] uppercase">
          Powered by Kinetic Precision
        </p>
      </footer>
    </motion.div>
  );
}

function ActivitiesScreen({ onNavigate, onLogout, onOpenNotifications, unreadCount, showToast }: { onNavigate: (screen: Screen) => void, onLogout: () => void, onOpenNotifications: () => void, unreadCount: number, showToast: (msg: string, type?: 'success' | 'error' | 'info') => void }) {
  const { user, profile } = useContext(AuthContext)!;
  const [activities, setActivities] = useState<DeliveryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'status'>('date');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const isCourier = profile?.role === 'courier';

  const handleCancel = async () => {
    if (!cancellingId) return;
    try {
      await updateDoc(doc(db, 'deliveries', cancellingId), {
        status: 'cancelled',
        cancelledAt: serverTimestamp()
      });
      showToast('Entrega cancelada com sucesso.', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'deliveries');
      showToast('Erro ao cancelar entrega.', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  useEffect(() => {
    if (!user) return;

    const field = isCourier ? 'courierId' : 'merchantId';
    const q = query(
      collection(db, 'deliveries'),
      where(field, '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as DeliveryData));
      setActivities(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'deliveries');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, profile, isCourier]);

  const filteredAndSortedActivities = useMemo(() => {
    let result = [...activities];

    if (filterStatus !== 'all') {
      result = result.filter(a => a.status === filterStatus);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(a => 
        a.customerName?.toLowerCase().includes(term) || 
        a.destination?.toLowerCase().includes(term) ||
        a.id?.toLowerCase().includes(term)
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = a.createdAt?.toDate()?.getTime() || 0;
        const dateB = b.createdAt?.toDate()?.getTime() || 0;
        return dateB - dateA;
      } else if (sortBy === 'price') {
        return (b.price || 0) - (a.price || 0);
      } else {
        return (a.status || '').localeCompare(b.status || '');
      }
    });

    return result;
  }, [activities, filterStatus, sortBy, searchTerm]);

  const totalAmount = useMemo(() => {
    return filteredAndSortedActivities.reduce((acc, curr) => acc + (curr.price || 0), 0);
  }, [filteredAndSortedActivities]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "h-full w-full relative flex flex-col",
        isCourier ? "bg-[#0f1c2c]" : "bg-surface"
      )}
    >
      <header className="fixed top-0 w-full z-50 backdrop-blur-xl flex flex-col px-6 py-4 border-b bg-surface/80 border-outline-variant">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onNavigate(isCourier ? 'courier-profile' : 'profile')}
              className={cn(
                "w-10 h-10 rounded-full overflow-hidden border active:scale-90 transition-transform",
                isCourier ? "border-secondary-fixed" : "border-outline-variant"
              )}
            >
              <img src={profile?.profilePic || ASSETS.PROFILE_PIC} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </button>
            <h1 className={cn("text-xl font-extrabold tracking-tight font-headline", isCourier ? "text-white" : "text-on-surface")}>Histórico</h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onOpenNotifications}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors relative"
            >
              <Bell className={cn("w-6 h-6", isCourier ? "text-white" : "text-on-surface")} />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-4 h-4 bg-secondary-fixed text-on-secondary-fixed text-[8px] font-black rounded-full flex items-center justify-center border-2 border-surface">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <div className="p-1 rounded-xl flex gap-1 bg-surface-container-low">
              <button 
                onClick={() => setSortBy('date')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  sortBy === 'date' 
                    ? "bg-secondary-fixed text-on-secondary-fixed shadow-lg" 
                    : "text-on-surface-variant"
                )}
              >
                Data
              </button>
              <button 
                onClick={() => setSortBy('price')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  sortBy === 'price' 
                    ? "bg-secondary-fixed text-on-secondary-fixed shadow-lg" 
                    : "text-on-surface-variant"
                )}
              >
                Preço
              </button>
              <button 
                onClick={() => setSortBy('status')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  sortBy === 'status' 
                    ? "bg-secondary-fixed text-on-secondary-fixed shadow-lg" 
                    : "text-on-surface-variant"
                )}
              >
                Status
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4",
            isCourier ? "text-white/40" : "text-on-surface-variant"
          )} />
          <input 
            type="text"
            placeholder="Buscar por cliente ou destino..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              "w-full pl-11 pr-4 py-3 rounded-2xl text-sm font-bold outline-none transition-all border",
              isCourier 
                ? "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-secondary-fixed/50" 
                : "bg-surface-container-low border-outline-variant text-on-surface placeholder:text-on-surface-variant/40 focus:border-secondary-fixed/50"
            )}
          />
        </div>
      </header>

      <main className="flex-1 pt-44 px-4 pb-32 overflow-y-auto no-scrollbar">
        {/* Summary Card */}
        {!loading && filteredAndSortedActivities.length > 0 && (
          <div className={cn(
            "mb-6 p-6 rounded-[2.5rem] border flex justify-between items-center shadow-sm",
            isCourier 
              ? "bg-gradient-to-br from-secondary-fixed/20 to-secondary-fixed/5 border-secondary-fixed/20" 
              : "bg-gradient-to-br from-surface-container-highest/50 to-surface-container-low/50 border-outline-variant"
          )}>
            <div>
              <p className={cn(
                "text-[10px] font-black uppercase tracking-[0.2em] mb-1",
                isCourier ? "text-secondary-fixed/80" : "text-on-surface-variant"
              )}>
                {isCourier ? 'Total de Ganhos' : 'Total Gasto'}
              </p>
              <p className={cn(
                "text-2xl font-black font-headline",
                isCourier ? "text-white" : "text-on-surface"
              )}>
                R$ {totalAmount.toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <p className={cn(
                "text-[10px] font-black uppercase tracking-[0.2em] mb-1",
                isCourier ? "text-secondary-fixed/80" : "text-on-surface-variant"
              )}>
                Entregas
              </p>
              <p className={cn(
                "text-2xl font-black font-headline",
                isCourier ? "text-white" : "text-on-surface"
              )}>
                {filteredAndSortedActivities.length}
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-6 no-scrollbar">
          {['all', 'searching', 'collecting', 'delivering', 'delivered'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={cn(
                "px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border",
                filterStatus === status 
                  ? "bg-secondary-fixed text-on-secondary-fixed border-secondary-fixed shadow-lg" 
                  : isCourier 
                    ? "bg-white/5 text-white/40 border-white/10 hover:bg-white/10"
                    : "bg-surface-container-low text-on-surface-variant border-outline-variant hover:bg-surface-container-highest"
              )}
            >
              {status === 'all' ? 'Todos' :
               status === 'searching' ? 'Buscando' :
               status === 'collecting' ? 'Coletando' :
               status === 'delivering' ? 'Em Entrega' : 'Entregues'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 rounded-[2.5rem]" />
            <Skeleton className="h-32 rounded-[2.5rem]" />
            <Skeleton className="h-32 rounded-[2.5rem]" />
          </div>
        ) : filteredAndSortedActivities.length === 0 ? (
          <EmptyState 
            icon={<History />} 
            title="Nenhuma Atividade" 
            message={searchTerm ? "Nenhum resultado para sua busca." : "Você ainda não possui registros de entregas."} 
          />
        ) : (
          <div className="space-y-4">
            {filteredAndSortedActivities.map((activity, i) => (
              <motion.div 
                layout
                key={`activity-${activity.id || i}`} 
                onClick={() => setExpandedId(expandedId === activity.id ? null : activity.id)}
                className={cn(
                  "rounded-[2.5rem] p-6 border transition-all cursor-pointer",
                  isCourier 
                    ? "bg-white/5 border-white/10 hover:bg-white/10" 
                    : "bg-surface-container-low border-outline-variant shadow-sm hover:bg-surface-container-highest"
                )}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-14 h-14 rounded-[1.5rem] flex items-center justify-center shadow-inner",
                      activity.status === 'delivered' 
                        ? "bg-green-500/20 text-green-400" 
                        : "bg-blue-500/20 text-blue-400"
                    )}>
                      {activity.status === 'delivered' ? <CheckCircle2 className="w-8 h-8" /> : <Package className="w-8 h-8" />}
                    </div>
                    <div>
                      <p className={cn(
                        "font-headline font-black text-lg",
                        isCourier ? "text-white" : "text-on-surface"
                      )}>
                        {activity.status === 'delivered' ? 'Entregue' : 
                         activity.status === 'searching' ? 'Buscando Motoboy' :
                         activity.status === 'collecting' ? 'Coletando' :
                         activity.status === 'delivering' ? 'Em Entrega' : 'Pendente'}
                      </p>
                      <p className={cn(
                        "text-[10px] uppercase tracking-widest font-black opacity-60",
                        isCourier ? "text-white/40" : "text-on-surface-variant"
                      )}>
                        {activity.createdAt?.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-[9px] font-black uppercase tracking-widest mb-1",
                      isCourier ? "text-white/40" : "text-on-surface-variant"
                    )}>
                      {isCourier ? 'Ganhos' : 'Valor'}
                    </p>
                    <p className={cn(
                      "font-headline font-black px-4 py-1.5 rounded-2xl text-base",
                      isCourier ? "bg-secondary-fixed text-on-secondary-fixed" : "bg-secondary-fixed text-on-secondary-fixed"
                    )}>
                      R$ {activity.price?.toFixed(2)}
                    </p>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedId === activity.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className={cn(
                        "space-y-4 border-t pt-5 mt-4",
                        isCourier ? "border-white/5" : "border-outline-variant"
                      )}>
                        {/* Customer Details */}
                        <div className={cn(
                          "flex items-center justify-between p-4 rounded-3xl border",
                          isCourier ? "bg-white/5 border-white/5" : "bg-surface-container-lowest border-outline-variant"
                        )}>
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-10 h-10 rounded-2xl flex items-center justify-center",
                              isCourier ? "bg-white/10" : "bg-surface-container-highest"
                            )}>
                              <User className={cn("w-5 h-5", isCourier ? "text-white" : "text-on-surface")} />
                            </div>
                            <div>
                              <p className={cn("text-sm font-black", isCourier ? "text-white" : "text-on-surface")}>
                                {activity.customerName || 'Cliente'}
                              </p>
                              <p className={cn("text-xs font-bold", isCourier ? "text-white/40" : "text-on-surface-variant")}>
                                {activity.customerPhone || 'Sem telefone'}
                              </p>
                            </div>
                          </div>
                          <button className={cn(
                            "w-10 h-10 rounded-2xl flex items-center justify-center active:scale-90 transition-transform shadow-lg",
                            isCourier ? "bg-secondary-fixed text-on-secondary-fixed" : "bg-secondary-fixed text-on-secondary-fixed"
                          )}>
                            <Phone className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Route */}
                        <div className="space-y-3 px-2">
                          <div className="flex items-start gap-4">
                            <div className="mt-1.5 flex flex-col items-center gap-1.5">
                              <div className={cn("w-2 h-2 rounded-full", isCourier ? "bg-white/20" : "bg-outline-variant")} />
                              <div className={cn("w-0.5 h-6", isCourier ? "bg-white/10" : "bg-outline-variant/30")} />
                              <MapPin className="w-4 h-4 text-red-500" />
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex flex-col">
                                <span className={cn("text-[9px] font-black uppercase tracking-widest opacity-40", isCourier ? "text-white" : "text-on-surface")}>Origem</span>
                                <p className={cn("text-xs font-bold truncate", isCourier ? "text-white/60" : "text-on-surface-variant")}>{activity.origin}</p>
                              </div>
                              <div className="flex flex-col">
                                <span className={cn("text-[9px] font-black uppercase tracking-widest opacity-40", isCourier ? "text-white" : "text-on-surface")}>Destino</span>
                                <p className={cn("text-xs font-bold truncate", isCourier ? "text-white" : "text-on-surface")}>{activity.destination}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        <div className={cn(
                          "pt-4 border-t space-y-4",
                          isCourier ? "border-white/5" : "border-outline-variant"
                        )}>
                          {activity.notes && (
                            <div className={cn(
                              "p-4 rounded-3xl",
                              isCourier ? "bg-white/5" : "bg-yellow-500/10"
                            )}>
                              <div className="flex items-center gap-2 mb-2">
                                <StickyNote className={cn("w-4 h-4", isCourier ? "text-white/40" : "text-yellow-600")} />
                                <span className={cn("text-[10px] font-black uppercase tracking-widest", isCourier ? "text-white/40" : "text-yellow-600")}>Observações</span>
                              </div>
                              <p className={cn("text-xs font-bold leading-relaxed", isCourier ? "text-white/80" : "text-yellow-800")}>{activity.notes}</p>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-4">
                            <div className={cn(
                              "p-4 rounded-3xl border",
                              isCourier ? "bg-white/5 border-white/5" : "bg-surface-container-lowest border-outline-variant"
                            )}>
                              <p className={cn("text-[9px] font-black uppercase tracking-widest opacity-40 mb-1", isCourier ? "text-white" : "text-on-surface")}>ID do Pedido</p>
                              <p className={cn("text-xs font-black", isCourier ? "text-white" : "text-on-surface")}>#{activity.id?.slice(-6).toUpperCase()}</p>
                            </div>
                            <div className={cn(
                              "p-4 rounded-3xl border",
                              isCourier ? "bg-white/5 border-white/5" : "bg-surface-container-lowest border-outline-variant"
                            )}>
                              <p className={cn("text-[9px] font-black uppercase tracking-widest opacity-40 mb-1", isCourier ? "text-white" : "text-on-surface")}>Método</p>
                              <p className={cn("text-xs font-black", isCourier ? "text-white" : "text-on-surface")}>Cartão / App</p>
                            </div>
                          </div>
                          
                          {!isCourier && (activity.status === 'searching' || activity.status === 'collecting') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCancellingId(activity.id || null);
                              }}
                              className="w-full py-4 bg-red-500/10 text-red-500 font-bold rounded-2xl border border-red-500/20 active:scale-[0.98] transition-all"
                            >
                              Cancelar Entrega
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className={cn(
        "fixed bottom-0 left-0 w-full backdrop-blur-md border-t flex justify-around items-center px-4 pb-6 pt-3 z-50 rounded-t-[2rem]",
        isCourier ? "bg-[#0f1c2c]/90 border-white/5" : "bg-surface/90 border-outline-variant h-[70.5px] pb-2 pt-2"
      )}>
        {isCourier ? (
          <>
            <CourierNavItem icon={<HomeIcon className="w-5 h-5" />} label="Início" onClick={() => onNavigate('courier-available')} />
            <CourierNavItem icon={<Bike className="w-5 h-5" />} label="Entregas" onClick={() => onNavigate('courier-tracking')} />
            <CourierNavItem icon={<ReceiptText className="w-5 h-5" />} label="Atividades" active onClick={() => onNavigate('activities')} />
            <CourierNavItem icon={<UserCircle className="w-5 h-5" />} label="Perfil" onClick={() => onNavigate('courier-profile')} />
          </>
        ) : (
          <>
            <NavItem icon={<HomeIcon />} label="Home" onClick={() => onNavigate('home')} />
            <NavItem icon={<ReceiptText />} label="Atividades" active onClick={() => onNavigate('activities')} />
            <NavItem icon={<Wallet />} label="Pagamentos" onClick={() => onNavigate('payments')} />
            <NavItem icon={<UserCircle />} label="Perfil" onClick={() => onNavigate('profile')} />
          </>
        )}
      </nav>

      <Modal 
        isOpen={!!cancellingId} 
        onClose={() => setCancellingId(null)} 
        title="Cancelar Entrega"
        dark={isCourier}
      >
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center py-4">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8" />
            </div>
            <p className="text-center text-on-surface-variant">
              Tem certeza que deseja cancelar esta entrega? Esta ação não pode ser desfeita.
            </p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setCancellingId(null)}
              className="flex-1 py-4 bg-surface-container-highest text-on-surface font-bold rounded-xl active:scale-95 transition-all"
            >
              Voltar
            </button>
            <button 
              onClick={handleCancel}
              className="flex-1 py-4 bg-red-500 text-white font-bold rounded-xl active:scale-95 transition-all shadow-lg shadow-red-500/20"
            >
              Sim, Cancelar
            </button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}

function MerchantProfileScreen({ onLogout, onNavigate, onOpenNotifications, unreadCount }: { onLogout: () => void, onNavigate: (screen: Screen) => void, onOpenNotifications: () => void, unreadCount: number }) {
  const { user, profile } = useContext(AuthContext)!;
  const [isUpdating, setIsUpdating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [todayOrders, setTodayOrders] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);

  // Modal states
  const [isStoreDataOpen, setIsStoreDataOpen] = useState(false);
  const [isPaymentMethodsOpen, setIsPaymentMethodsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isAddBalanceOpen, setIsAddBalanceOpen] = useState(false);

  // Notifications state
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    "Notification" in window && Notification.permission === "granted"
  );

  const toggleNotifications = async () => {
    if (!("Notification" in window)) {
      alert("Seu navegador não suporta notificações push.");
      return;
    }
    if (!notificationsEnabled) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setNotificationsEnabled(true);
      } else {
        alert("Permissão para notificações foi negada pelo navegador.");
      }
    } else {
      setNotificationsEnabled(false);
    }
  };

  // Support ticket state
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSent, setTicketSent] = useState(false);

  // Add balance state
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceAdded, setBalanceAdded] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'deliveries'),
      where('merchantId', '==', user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let total = 0;
      let todayCount = 0;
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

      snapshot.forEach((doc) => {
        const data = doc.data() as DeliveryData;
        const price = data.price || 0;
        total += price;
        
        if (data.createdAt) {
          const createdAt = (data.createdAt as any).toMillis ? (data.createdAt as any).toMillis() : Date.now();
          if (createdAt >= todayStart) {
            todayCount++;
          }
        }
      });

      setTotalSpent(total);
      setTodayOrders(todayCount);
    });
    return () => unsubscribe();
  }, [user]);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.uid) return;

    setIsUpdating(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        await updateDoc(doc(db, 'users', profile.uid), {
          profilePic: base64String
        });
        setIsUpdating(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error updating profile pic:", error);
      setIsUpdating(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full w-full bg-surface relative flex flex-col"
    >
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl flex justify-between items-center px-6 py-4 border-b border-outline-variant">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onNavigate('home')}
            className="p-2 hover:bg-surface-container-highest rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-on-surface" />
          </button>
          <h1 className="text-xl font-extrabold text-on-surface tracking-tight font-headline">TaNaMao</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onOpenNotifications}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors relative"
          >
            <Bell className="w-6 h-6 text-on-surface" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-secondary-fixed text-on-secondary-fixed text-[8px] font-black rounded-full flex items-center justify-center border-2 border-surface">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <button 
            onClick={onLogout}
            className="p-2 text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 pt-24 px-6 pb-32 overflow-y-auto no-scrollbar">
        {/* Profile Header */}
        <div className="flex flex-col items-center py-8 space-y-4">
          <div className="relative">
            <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-outline-variant shadow-2xl bg-surface-container-highest">
              {isUpdating ? (
                <div className="w-full h-full flex items-center justify-center bg-black/20">
                  <div className="w-8 h-8 border-4 border-secondary-fixed/20 border-t-secondary-fixed rounded-full animate-spin" />
                </div>
              ) : (
                <img 
                  src={profile?.profilePic || ASSETS.PROFILE_PIC} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-10 h-10 bg-secondary-fixed text-on-secondary-fixed rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-transform border-4 border-surface"
            >
              <Camera className="w-5 h-5" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*"
            />
          </div>
          
          <div className="text-center">
            <h2 className="text-2xl font-black text-on-surface tracking-tight">{profile?.name || 'Sua Loja'}</h2>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="px-3 py-1 bg-secondary-fixed/10 text-secondary-fixed text-[10px] font-black uppercase tracking-widest rounded-full">Lojista</span>
              <div className="flex items-center gap-1 text-secondary-fixed">
                <Star className="w-3 h-3 fill-current" />
                <span className="text-xs font-black">4.8</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-surface-container-low p-6 rounded-[2rem] border border-outline-variant shadow-sm">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Pedidos Hoje</p>
            <p className="text-2xl font-black text-on-surface">{todayOrders}</p>
          </div>
          <div className="bg-surface-container-low p-6 rounded-[2rem] border border-outline-variant shadow-sm">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Gasto Total</p>
            <p className="text-2xl font-black text-on-surface">R$ {totalSpent.toFixed(2).replace('.', ',')}</p>
          </div>
        </div>

        {/* Store Info */}
        <div className="bg-surface-container-low rounded-[2.5rem] p-6 border border-outline-variant flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-secondary-fixed/10 flex items-center justify-center">
              <Clock className="w-6 h-6 text-secondary-fixed" />
            </div>
            <div>
              <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Horário de Funcionamento</p>
              <p className="text-on-surface font-bold">{profile?.operatingHours || '08:00 - 22:00'}</p>
            </div>
          </div>
          <button className="text-secondary-fixed text-xs font-black uppercase tracking-widest">Editar</button>
        </div>

        {/* Menu Items */}
        <div className="space-y-2">
          <p className="px-4 text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] mb-4">Configurações</p>
          <ProfileMenuItem dark icon={<UserCircle className="w-5 h-5" />} label="Dados da Loja" onClick={() => setIsStoreDataOpen(true)} />
          <ProfileMenuItem dark icon={<Wallet className="w-5 h-5" />} label="Formas de Pagamento" onClick={() => setIsPaymentMethodsOpen(true)} />
          <ProfileMenuItem dark icon={<Wallet className="w-5 h-5" />} label="Adicionar Saldo" onClick={() => setIsAddBalanceOpen(true)} />
          <ProfileMenuItem dark icon={<Bell className="w-5 h-5" />} label="Notificações" onClick={() => setIsNotificationsOpen(true)} />
          <ProfileMenuItem dark icon={<HelpCircle className="w-5 h-5" />} label="Ajuda e Suporte" onClick={() => setIsSupportOpen(true)} />
          <ProfileMenuItem dark icon={<LogOut className="w-5 h-5" />} label="Sair da conta" danger onClick={onLogout} />
        </div>

        <div className="mt-12 text-center">
          <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">TaNaMao v2.4.0 • 2026</p>
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 w-full h-[70.5px] bg-surface/90 backdrop-blur-md border-t border-outline-variant flex justify-around items-center px-4 pb-2 pt-2 z-50 rounded-t-[2rem]">
        <NavItem icon={<HomeIcon />} label="Home" onClick={() => onNavigate('home')} />
        <NavItem icon={<ReceiptText />} label="Atividades" onClick={() => onNavigate('activities')} />
        <NavItem icon={<Wallet />} label="Pagamentos" onClick={() => onNavigate('payments')} />
        <NavItem icon={<UserCircle />} label="Perfil" active onClick={() => onNavigate('profile')} />
      </nav>

      {/* Modals */}
      <Modal dark isOpen={isStoreDataOpen} onClose={() => setIsStoreDataOpen(false)} title="Dados da Loja">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Nome da Loja</label>
            <input type="text" value={profile?.name || ''} readOnly className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface font-medium focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Email</label>
            <input type="email" value={user?.email || ''} readOnly className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface font-medium focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Telefone</label>
            <input type="tel" value={profile?.phone || ''} readOnly className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface font-medium focus:outline-none" />
          </div>
        </div>
      </Modal>

      <Modal dark isOpen={isPaymentMethodsOpen} onClose={() => setIsPaymentMethodsOpen(false)} title="Formas de Pagamento">
        <div className="space-y-4">
          <div className="p-4 border border-outline-variant bg-surface-container-low rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary-fixed/10 rounded-xl flex items-center justify-center text-secondary-fixed">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-on-surface">Saldo no App</p>
                <p className="text-xs text-on-surface-variant">Principal</p>
              </div>
            </div>
            <div className="w-4 h-4 rounded-full border-4 border-secondary-fixed bg-surface" />
          </div>
          <button className="w-full py-4 border-2 border-dashed border-outline-variant rounded-2xl text-on-surface-variant font-bold hover:bg-surface-container-highest transition-colors flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" />
            Adicionar Novo Cartão
          </button>
        </div>
      </Modal>

      <Modal dark isOpen={isAddBalanceOpen} onClose={() => setIsAddBalanceOpen(false)} title="Adicionar Saldo">
        <div className="space-y-4">
          {balanceAdded ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-secondary-fixed/20 text-secondary-fixed rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2">Saldo Adicionado!</h3>
              <p className="text-on-surface-variant mb-6">O valor foi creditado na sua conta.</p>
              <button 
                onClick={() => {
                  setBalanceAdded(false);
                  setIsAddBalanceOpen(false);
                  setBalanceAmount('');
                }}
                className="w-full py-4 bg-surface-container-highest text-on-surface font-bold rounded-xl"
              >
                Fechar
              </button>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Valor (R$)</label>
                <input 
                  type="number" 
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-secondary-fixed" 
                />
              </div>
              <button 
                onClick={() => {
                  if (balanceAmount) setBalanceAdded(true);
                }}
                disabled={!balanceAmount}
                className="w-full py-4 bg-secondary-fixed text-on-secondary-fixed font-bold rounded-xl disabled:opacity-50"
              >
                Gerar PIX Copia e Cola
              </button>
            </>
          )}
        </div>
      </Modal>
      <Modal dark isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} title="Notificações">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-outline-variant bg-surface-container-low rounded-2xl">
            <div>
              <p className="font-bold text-on-surface">Notificações Push</p>
              <p className="text-xs text-on-surface-variant">Receba alertas sobre pedidos</p>
            </div>
            <button 
              onClick={toggleNotifications}
              className={cn(
                "w-12 h-6 rounded-full transition-colors relative",
                notificationsEnabled ? "bg-secondary-fixed" : "bg-surface-container-highest"
              )}
            >
              <div className={cn(
                "w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform",
                notificationsEnabled ? "translate-x-6" : "translate-x-0.5"
              )} />
            </button>
          </div>
        </div>
      </Modal>

      <Modal dark isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} title="Ajuda e Suporte">
        <div className="space-y-4">
          {ticketSent ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-secondary-fixed/20 text-secondary-fixed rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2">Mensagem Enviada!</h3>
              <p className="text-on-surface-variant mb-6">Nossa equipe responderá em breve.</p>
              <button 
                onClick={() => {
                  setTicketSent(false);
                  setIsSupportOpen(false);
                  setTicketMessage('');
                }}
                className="w-full py-4 bg-surface-container-highest text-on-surface font-bold rounded-xl"
              >
                Fechar
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-on-surface-variant">Como podemos ajudar? Envie uma mensagem para o administrador.</p>
              <textarea 
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                placeholder="Descreva seu problema ou dúvida..."
                className="w-full h-32 bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-secondary-fixed resize-none"
              />
              <button 
                onClick={() => {
                  if (ticketMessage.trim()) setTicketSent(true);
                }}
                disabled={!ticketMessage.trim()}
                className="w-full py-4 bg-secondary-fixed text-on-secondary-fixed font-bold rounded-xl disabled:opacity-50"
              >
                Enviar Mensagem
              </button>
            </>
          )}
        </div>
      </Modal>
    </motion.div>
  );
}

function PaymentsScreen({ onLogout, onNavigate, onOpenNotifications, unreadCount }: { onLogout: () => void, onNavigate: (screen: Screen) => void, onOpenNotifications: () => void, unreadCount: number }) {
  const { user } = useContext(AuthContext)!;
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'deliveries'),
      where('merchantId', '==', user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let total = 0;
      snapshot.forEach((doc) => {
        const data = doc.data() as DeliveryData;
        total += data.price || 0;
      });
      setTotalSpent(total);
    });
    return () => unsubscribe();
  }, [user]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full w-full bg-surface relative flex flex-col"
    >
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl flex justify-between items-center px-6 py-4 border-b border-outline-variant">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onNavigate('home')}
            className="p-2 hover:bg-surface-container-highest rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-on-surface" />
          </button>
          <h1 className="text-xl font-extrabold text-on-surface tracking-tight font-headline">Pagamentos</h1>
        </div>
        <button 
          onClick={onOpenNotifications}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors relative"
        >
          <Bell className="w-6 h-6 text-on-surface" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-4 h-4 bg-secondary-fixed text-on-secondary-fixed text-[8px] font-black rounded-full flex items-center justify-center border-2 border-surface">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </header>

      <main className="flex-1 pt-24 px-6 pb-32 overflow-y-auto no-scrollbar">
        <div className="bg-gradient-to-br from-surface-container-low to-surface-container-highest rounded-[2.5rem] p-8 border border-outline-variant relative overflow-hidden shadow-2xl mb-8">
          <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em] mb-3">Total Gasto na Plataforma</p>
          <h2 className="font-headline font-black text-5xl text-on-surface tracking-tighter mb-10">R$ {totalSpent.toFixed(2).replace('.', ',')}</h2>
          
          <button className="w-full py-5 bg-primary text-on-primary rounded-2xl font-headline font-black text-lg flex items-center justify-center gap-3 active:scale-95 transition-transform shadow-lg">
            <Wallet className="w-6 h-6" />
            <span>Adicionar Saldo</span>
          </button>
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] ml-2">Pagamentos Pendentes</h3>
          <div className="bg-surface-container-low rounded-[2rem] p-6 border border-outline-variant flex items-center justify-between">
            <div>
              <p className="font-bold text-on-surface">Entrega #8845</p>
              <p className="text-sm text-on-surface-variant">R$ 18,50</p>
            </div>
            <button className="px-6 py-3 bg-secondary-fixed text-on-secondary-fixed font-bold rounded-xl active:scale-95 transition-transform">
              Pagar
            </button>
          </div>
        </div>

        <div className="space-y-4 mt-8">
          <h3 className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] ml-2">Histórico de Faturas</h3>
          <div className="bg-surface-container-low rounded-[2rem] p-6 border border-outline-variant flex flex-col items-center justify-center text-center space-y-3">
            <ReceiptText className="w-10 h-10 text-on-surface-variant/50" />
            <p className="text-sm font-medium text-on-surface-variant">Nenhuma fatura fechada ainda.</p>
          </div>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 w-full h-[70.5px] bg-surface/90 backdrop-blur-md border-t border-outline-variant flex justify-around items-center px-4 pb-2 pt-2 z-50 rounded-t-[2rem]">
        <NavItem icon={<HomeIcon />} label="Home" onClick={() => onNavigate('home')} />
        <NavItem icon={<ReceiptText />} label="Atividades" onClick={() => onNavigate('activities')} />
        <NavItem icon={<Wallet />} label="Pagamentos" active onClick={() => onNavigate('payments')} />
        <NavItem icon={<UserCircle />} label="Perfil" onClick={() => onNavigate('profile')} />
      </nav>
    </motion.div>
  );
}

function PlaceholderScreen({ title, onBack, onLogout, onNavigate }: { title: string, onBack: () => void, onLogout: () => void, onNavigate: (screen: Screen) => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full w-full bg-surface relative flex flex-col"
    >
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl flex justify-between items-center px-6 py-4 border-b border-outline-variant">
        <div className="flex items-center gap-3">
          <button 
            onClick={onLogout}
            className="w-10 h-10 rounded-full bg-surface-container-highest overflow-hidden border border-outline-variant active:scale-90 transition-transform"
          >
            <img src={ASSETS.PROFILE_PIC} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </button>
          <h1 className="text-xl font-extrabold text-on-surface tracking-tight font-headline">TaNaMao</h1>
        </div>
      </header>
      <main className="flex-1 pt-24 px-6 pb-32 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-20 h-20 rounded-3xl bg-surface-container-highest flex items-center justify-center border border-outline-variant">
          <Wrench className="w-10 h-10 text-on-surface-variant" />
        </div>
        <h2 className="font-headline font-extrabold text-2xl text-on-surface">{title}</h2>
        <p className="text-on-surface-variant font-medium">Esta tela está em desenvolvimento.</p>
        <button 
          onClick={onBack}
          className="mt-8 px-6 py-3 bg-secondary-fixed text-on-secondary-fixed font-bold rounded-xl active:scale-95 transition-transform"
        >
          Voltar para o Início
        </button>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 w-full h-[70.5px] bg-surface/90 backdrop-blur-md border-t border-outline-variant flex justify-around items-center px-4 pb-2 pt-2 z-50">
        <NavItem icon={<HomeIcon />} label="Home" onClick={() => onNavigate('home')} />
        <NavItem icon={<ReceiptText />} label="Atividades" active={title === 'Atividades'} onClick={() => onNavigate('activities')} />
        <NavItem icon={<Wallet />} label="Pagamentos" active={title === 'Pagamentos'} onClick={() => onNavigate('payments')} />
        <NavItem icon={<UserCircle />} label="Perfil" active={title === 'Perfil'} onClick={() => onNavigate('profile')} />
      </nav>
    </motion.div>
  );
}

interface HomeScreenProps {
  data: DeliveryData;
  setData: (d: DeliveryData) => void;
  onRequestDelivery: () => void;
  onLogout: () => void;
  onNavigate: (screen: Screen) => void;
  onOpenNotifications: () => void;
  unreadCount: number;
}

function HomeScreen({ 
  data, 
  setData, 
  onRequestDelivery,
  onLogout,
  onNavigate,
  onOpenNotifications,
  unreadCount
}: HomeScreenProps) {
  const [activeDeliveries, setActiveDeliveries] = useState<DeliveryData[]>([]);
  const { user, profile } = useContext(AuthContext)!;

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'deliveries'), 
      where('merchantId', '==', user.uid),
      where('status', 'in', ['searching', 'collecting', 'in-route']),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setActiveDeliveries(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as DeliveryData)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'deliveries');
    });
    return () => unsubscribe();
  }, [user]);

  const handleTestRide = async () => {
    if (!user) return;
    try {
      const locations = [
        { name: 'Av. Paulista, 1578', lat: -23.5614, lng: -46.6559 },
        { name: 'Rua Augusta, 1500', lat: -23.5595, lng: -46.6633 },
        { name: 'Av. Brigadeiro Faria Lima, 2000', lat: -23.5855, lng: -46.6815 },
        { name: 'Rua Oscar Freire, 500', lat: -23.5673, lng: -46.6685 },
        { name: 'Parque Ibirapuera, Portão 3', lat: -23.5874, lng: -46.6576 },
        { name: 'Shopping Eldorado', lat: -23.5725, lng: -46.6955 },
        { name: 'Estação da Luz', lat: -23.5350, lng: -46.6340 },
        { name: 'Mercado Municipal de SP', lat: -23.5417, lng: -46.6297 },
        { name: 'Rua da Consolação, 2000', lat: -23.5550, lng: -46.6600 },
        { name: 'Av. Rebouças, 3000', lat: -23.5700, lng: -46.6850 }
      ];

      const originIdx = Math.floor(Math.random() * locations.length);
      let destIdx = Math.floor(Math.random() * locations.length);
      while (destIdx === originIdx) {
        destIdx = Math.floor(Math.random() * locations.length);
      }

      const originLoc = locations[originIdx];
      const destLoc = locations[destIdx];
      
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${originLoc.lng},${originLoc.lat};${destLoc.lng},${destLoc.lat}?overview=full&geometries=geojson`);
      const routeData = await res.json();
      
      let distance = 3.5;
      let routeGeometry = null;
      if (routeData.routes && routeData.routes.length > 0) {
        distance = routeData.routes[0].distance / 1000;
        routeGeometry = routeData.routes[0].geometry;
      }

      const randomCep = () => `${Math.floor(10000 + Math.random() * 90000)}-${Math.floor(100 + Math.random() * 900)}`;
      const names = ['João Silva', 'Maria Oliveira', 'Pedro Santos', 'Ana Costa', 'Lucas Pereira', 'Carla Souza'];

      await addDoc(collection(db, 'deliveries'), {
        merchantId: user.uid,
        origin: `${originLoc.name} (CEP: ${randomCep()})`,
        destination: `${destLoc.name} (CEP: ${randomCep()})`,
        customerName: names[Math.floor(Math.random() * names.length)],
        customerPhone: `119${Math.floor(10000000 + Math.random() * 90000000)}`,
        notes: 'Corrida de teste aleatória',
        status: 'searching',
        price: Math.max(10, Math.round(distance * 2.5 * 10) / 10),
        distance: Math.round(distance * 10) / 10,
        createdAt: serverTimestamp(),
        originCoords: { lat: originLoc.lat, lng: originLoc.lng },
        destinationCoords: { lat: destLoc.lat, lng: destLoc.lng },
        routeGeometry: routeGeometry
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full w-full relative"
    >
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl flex justify-between items-center px-6 py-4 border-b border-outline-variant">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onNavigate('profile')}
            className="w-10 h-10 rounded-full bg-surface-container-highest overflow-hidden border border-outline-variant active:scale-90 transition-transform"
          >
            <img 
              src={profile?.profilePic || ASSETS.PROFILE_PIC} 
              alt="Profile" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </button>
          <h1 className="text-xl font-extrabold text-on-surface tracking-tight font-headline">TaNaMao</h1>
        </div>
        <button 
          onClick={onOpenNotifications}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors relative"
        >
          <Bell className="w-6 h-6 text-on-surface" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-4 h-4 bg-secondary-fixed text-on-secondary-fixed text-[8px] font-black rounded-full flex items-center justify-center border-2 border-surface">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </header>

      {/* Map Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src={ASSETS.MAP_HOME} 
          alt="Map" 
          className="w-full h-full object-cover grayscale-[20%] opacity-90"
          referrerPolicy="no-referrer"
        />
        
        {/* Active Deliveries on Map */}
        {activeDeliveries.map((delivery, i) => (
          <motion.div 
            key={`active-${delivery.id || i}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute"
            style={{ top: `${30 + (i * 10)}%`, left: `${40 + (i * 15)}%` }}
          >
            <div className="bg-secondary-fixed text-on-secondary-fixed p-2.5 rounded-2xl shadow-xl border-2 border-surface">
              <Bike className="w-5 h-5" />
            </div>
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-surface-container-low px-2 py-1 rounded-lg shadow-md border border-outline-variant whitespace-nowrap">
              <p className="text-[8px] font-black uppercase tracking-widest text-on-surface">
                {delivery.status === 'searching' ? 'Procurando...' : 'Em rota'}
              </p>
            </div>
          </motion.div>
        ))}

        <div className="absolute top-24 left-1/2 -translate-x-1/2 px-4 py-2 bg-surface/80 backdrop-blur-md rounded-full shadow-lg flex items-center gap-2 border border-outline-variant">
          <div className="w-2 h-2 bg-secondary-fixed rounded-full animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface">
            {activeDeliveries.length > 0 ? `${activeDeliveries.length} entregas ativas` : 'Nenhuma entrega ativa'}
          </span>
        </div>
      </div>

      {/* Bottom Sheet */}
      <div className="absolute bottom-0 left-0 w-full z-10 px-4 pb-28">
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="max-w-xl mx-auto bg-surface-container-lowest rounded-[2rem] p-6 shadow-[0_-12px_40px_rgba(0,0,0,0.4)] border border-outline-variant"
        >
          <div className="w-12 h-1 bg-surface-container-highest rounded-full mx-auto mb-6" />
          
          <div className="mb-6">
            <h2 className="font-headline font-bold text-2xl leading-tight text-on-surface">Olá, {user?.displayName?.split(' ')[0] || 'Comerciante'}</h2>
            <p className="text-on-surface-variant text-sm">Pronto para enviar seus pedidos hoje?</p>
          </div>

          <div className="bg-surface-container-low rounded-2xl p-6 mb-6 text-center">
            <div className="w-16 h-16 bg-secondary-fixed/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bike className="w-8 h-8 text-secondary-fixed" />
            </div>
            <h3 className="text-lg font-bold text-on-surface mb-2">Nova Entrega</h3>
            <p className="text-sm text-on-surface-variant mb-6">Insira os endereços de coleta e entrega para calcular o valor e solicitar um motoboy.</p>
            <button 
              onClick={onRequestDelivery}
              className="w-full py-4 bg-secondary-fixed text-on-secondary-fixed font-headline font-extrabold text-lg rounded-2xl shadow-lg shadow-secondary-fixed/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Solicitar Entrega
            </button>
            <button 
              onClick={handleTestRide}
              className="w-full mt-3 py-3 bg-surface-container-highest text-on-surface font-headline font-bold text-md rounded-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Bike className="w-4 h-4" />
              Criar Corrida Teste
            </button>
          </div>
        </motion.div>
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 w-full h-[70.5px] bg-surface/90 backdrop-blur-md border-t border-outline-variant flex justify-around items-center px-4 pb-2 pt-2 z-50">
        <NavItem icon={<HomeIcon />} label="Home" active onClick={() => onNavigate('home')} />
        <NavItem icon={<ReceiptText />} label="Atividades" onClick={() => onNavigate('activities')} />
        <NavItem icon={<Wallet />} label="Pagamentos" onClick={() => onNavigate('payments')} />
        <NavItem icon={<UserCircle />} label="Perfil" onClick={() => onNavigate('profile')} />
      </nav>
    </motion.div>
  );
}

interface NewRideScreenProps {
  onBack: () => void;
  onRequestDelivery: () => void;
  data: DeliveryData;
  setData: (data: DeliveryData) => void;
}

function NewRideScreen({ onBack, onRequestDelivery, data, setData }: NewRideScreenProps) {
  const { profile, user } = useContext(AuthContext)!;
  const [originCep, setOriginCep] = useState('');
  const [originCepError, setOriginCepError] = useState<string | null>(null);
  const [originStreet, setOriginStreet] = useState('');
  const [originNumber, setOriginNumber] = useState('');
  const [originComplement, setOriginComplement] = useState('');
  const [originNeighborhood, setOriginNeighborhood] = useState('');
  const [originCity, setOriginCity] = useState('');
  const [originState, setOriginState] = useState('');
  const [saveOrigin, setSaveOrigin] = useState(true);

  useEffect(() => {
    if (profile?.savedOrigin) {
      setOriginCep(profile.savedOrigin.cep || '');
      setOriginStreet(profile.savedOrigin.street || '');
      setOriginNumber(profile.savedOrigin.number || '');
      setOriginComplement(profile.savedOrigin.complement || '');
      setOriginNeighborhood(profile.savedOrigin.neighborhood || '');
      setOriginCity(profile.savedOrigin.city || '');
      setOriginState(profile.savedOrigin.state || '');
    }
  }, [profile]);

  const formatCep = (cep: string) => {
    const cleaned = cep.replace(/\D/g, '');
    if (cleaned.length <= 5) return cleaned;
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 8)}`;
  };

  const [destCep, setDestCep] = useState('');
  const [destCepError, setDestCepError] = useState<string | null>(null);
  const [destStreet, setDestStreet] = useState('');
  const [destNumber, setDestNumber] = useState('');
  const [destComplement, setDestComplement] = useState('');
  const [destNeighborhood, setDestNeighborhood] = useState('');
  const [destCity, setDestCity] = useState('');
  const [destState, setDestState] = useState('');

  const [itemDescription, setItemDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);
  const [originCoords, setOriginCoords] = useState<{lat: number, lng: number} | null>(null);
  const [destCoords, setDestCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [pricing, setPricing] = useState({ basePrice: 8, baseDistance: 4, pricePerKm: 2, platformFee: 2.5 });

  useEffect(() => {
    getDoc(doc(db, 'settings', 'pricing')).then(docSnap => {
      if (docSnap.exists()) {
        setPricing(docSnap.data() as any);
      }
    }).catch(e => console.error("Error fetching pricing", e));
  }, []);

  const getCoordinates = async (address: string, fallbackAddress?: string) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      } else if (fallbackAddress) {
        const fallbackResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fallbackAddress)}`);
        const fallbackData = await fallbackResponse.json();
        if (fallbackData && fallbackData.length > 0) {
          return { lat: parseFloat(fallbackData[0].lat), lng: parseFloat(fallbackData[0].lon) };
        }
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    const d = R * c; // Distance in km
    return d * 1.3; // Add 30% to approximate driving distance
  };

  // Fetch address from ViaCEP
  const fetchAddress = async (cep: string, type: 'origin' | 'dest') => {
    const cleanCep = cep.replace(/\D/g, '');
    
    if (type === 'origin') setOriginCepError(null);
    else setDestCepError(null);

    if (cleanCep.length !== 8) {
      if (type === 'origin') setOriginCepError("CEP inválido");
      else setDestCepError("CEP inválido");
      return;
    }

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      if (!response.ok) throw new Error('Falha na rede');
      const result = await response.json();
      
      if (!result.erro) {
        if (type === 'origin') {
          setOriginStreet(result.logradouro || '');
          setOriginNeighborhood(result.bairro || '');
          setOriginCity(result.localidade || '');
          setOriginState(result.uf || '');
        } else {
          setDestStreet(result.logradouro || '');
          setDestNeighborhood(result.bairro || '');
          setDestCity(result.localidade || '');
          setDestState(result.uf || '');
        }
      } else {
        if (type === 'origin') setOriginCepError("CEP não encontrado");
        else setDestCepError("CEP não encontrado");
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      if (type === 'origin') setOriginCepError("Erro ao buscar CEP");
      else setDestCepError("Erro ao buscar CEP");
    }
  };

  // Calculate price when both addresses are filled
  useEffect(() => {
    const calculateRoute = async () => {
      if (originStreet.trim() && originCity.trim() && destStreet.trim() && destCity.trim()) {
        setIsCalculating(true);
        setFormError(null);
        
        const originAddress = `${originStreet}, ${originNumber || ''}, ${originCity}, Brazil`;
        const originFallback = `${originStreet}, ${originCity}, Brazil`;
        const destAddress = `${destStreet}, ${destNumber || ''}, ${destCity}, Brazil`;
        const destFallback = `${destStreet}, ${destCity}, Brazil`;
        
        try {
          const originCoordsRes = await getCoordinates(originAddress, originFallback);
          const destCoordsRes = await getCoordinates(destAddress, destFallback);
          
          if (originCoordsRes && destCoordsRes) {
            setOriginCoords({ lat: originCoordsRes.lat, lng: originCoordsRes.lng });
            setDestCoords({ lat: destCoordsRes.lat, lng: destCoordsRes.lng });
            const dist = calculateDistance(originCoordsRes.lat, originCoordsRes.lng, destCoordsRes.lat, destCoordsRes.lng);
            setCalculatedDistance(dist);
            
            let price = pricing.basePrice;
            if (dist > pricing.baseDistance) {
              price += (dist - pricing.baseDistance) * pricing.pricePerKm;
            }
            price += pricing.platformFee;
            
            setCalculatedPrice(price);
          } else {
            // Fallback if geocoding fails
            setCalculatedDistance(3);
            let price = pricing.basePrice;
            if (3 > pricing.baseDistance) {
              price += (3 - pricing.baseDistance) * pricing.pricePerKm;
            }
            price += pricing.platformFee;
            setCalculatedPrice(price);
          }
        } catch (err) {
          console.error("Error calculating route:", err);
          // Fallback on error
          setCalculatedDistance(3);
          setCalculatedPrice(pricing.basePrice + pricing.platformFee);
        } finally {
          setIsCalculating(false);
        }
      } else {
        setCalculatedPrice(null);
        setCalculatedDistance(null);
      }
    };

    const timeoutId = setTimeout(() => {
      calculateRoute();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [originStreet, originNumber, originCity, destStreet, destNumber, destCity, pricing]);

  const [formError, setFormError] = useState<string | null>(null);

  const getMissingFields = () => {
    const missing = [];
    if (!originCep.trim()) missing.push("CEP de Coleta");
    if (!originStreet.trim()) missing.push("Rua de Coleta");
    if (!originNumber.trim()) missing.push("Número de Coleta");
    if (!originNeighborhood.trim()) missing.push("Bairro de Coleta");
    if (!originCity.trim()) missing.push("Cidade de Coleta");
    if (!originState.trim()) missing.push("Estado de Coleta");
    if (!destCep.trim()) missing.push("CEP de Entrega");
    if (!destStreet.trim()) missing.push("Rua de Entrega");
    if (!destNumber.trim()) missing.push("Número de Entrega");
    if (!destNeighborhood.trim()) missing.push("Bairro de Entrega");
    if (!destCity.trim()) missing.push("Cidade de Entrega");
    if (!destState.trim()) missing.push("Estado de Entrega");
    if (!itemDescription.trim()) missing.push("Descrição do Item");
    if (calculatedPrice === null && !isCalculating) missing.push("Cálculo do Preço (Aguarde ou verifique os endereços)");
    return missing;
  };

  const isFormValid = getMissingFields().length === 0;

  const handleRequest = () => {
    const missing = getMissingFields();
    if (missing.length > 0) {
      setFormError(`Campos faltando: ${missing.join(', ')}`);
      return;
    }
    setFormError(null);
    const originFull = `${originStreet}, ${originNumber} ${originComplement} - ${originNeighborhood}, ${originCity} - ${originState}, ${originCep}`;
    const destFull = `${destStreet}, ${destNumber} ${destComplement} - ${destNeighborhood}, ${destCity} - ${destState}, ${destCep}`;
    
    if (saveOrigin && user) {
      updateDoc(doc(db, 'users', user.uid), {
        savedOrigin: {
          cep: originCep,
          street: originStreet,
          number: originNumber,
          complement: originComplement,
          neighborhood: originNeighborhood,
          city: originCity,
          state: originState
        }
      }).catch(console.error);
    }

    setData({
      ...data,
      origin: originFull,
      destination: destFull,
      notes: `${itemDescription ? `Item: ${itemDescription}. ` : ''}${notes}`,
      price: calculatedPrice || 12.50, // fallback
      distance: calculatedDistance || 0,
      originLocation: originCoords || undefined,
      destinationLocation: destCoords || undefined
    });
    onRequestDelivery();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="h-full w-full bg-[#0f1c2c] relative flex flex-col overflow-hidden"
    >
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-[#0f1c2c] flex justify-between items-center px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-white/5 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-xl font-extrabold text-white tracking-tight">Nova Corrida</h1>
        </div>
        <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
          <img src={profile?.profilePic || ASSETS.PROFILE_PIC} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
      </header>

      <main className="flex-1 pt-20 px-6 pb-32 overflow-y-auto no-scrollbar">
        
        {/* Origin Section */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-4 h-4 rounded-full border-4 border-secondary-fixed flex items-center justify-center">
              <div className="w-1 h-1 bg-secondary-fixed rounded-full" />
            </div>
            <h2 className="text-sm font-bold text-white tracking-widest uppercase">Endereço de Coleta</h2>
          </div>
          
          <div className="space-y-3">
            <div className="flex gap-3">
              <input 
                type="text" 
                placeholder="00000-000" 
                value={formatCep(originCep)}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  const limited = val.slice(0, 8);
                  setOriginCep(limited);
                  if (limited.length === 8) fetchAddress(limited, 'origin');
                  else setOriginCepError(null);
                }}
                className={cn("flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-secondary-fixed focus:ring-1 focus:ring-secondary-fixed outline-none transition-all", originCepError && "border-red-500")}
              />
              {originCepError && <p className="text-red-500 text-[10px] mt-1">{originCepError}</p>}
              <button 
                type="button"
                onClick={() => fetchAddress(originCep, 'origin')}
                className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-secondary-fixed hover:bg-white/10 transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
            <input 
              type="text" 
              placeholder="Avenida Paulista" 
              value={originStreet}
              onChange={(e) => setOriginStreet(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-secondary-fixed focus:ring-1 focus:ring-secondary-fixed outline-none transition-all"
            />
            <div className="flex gap-3">
              <input 
                type="text" 
                placeholder="Nº *" 
                value={originNumber}
                onChange={(e) => setOriginNumber(e.target.value)}
                className="w-28 shrink-0 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-secondary-fixed focus:ring-1 focus:ring-secondary-fixed outline-none transition-all"
              />
              <input 
                type="text" 
                placeholder="Complemento" 
                value={originComplement}
                onChange={(e) => setOriginComplement(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-secondary-fixed focus:ring-1 focus:ring-secondary-fixed outline-none transition-all"
              />
            </div>
            <input 
              type="text" 
              placeholder="Bela Vista" 
              value={originNeighborhood}
              onChange={(e) => setOriginNeighborhood(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-secondary-fixed focus:ring-1 focus:ring-secondary-fixed outline-none transition-all"
            />
            <div className="flex gap-3">
              <input 
                type="text" 
                placeholder="São Paulo" 
                value={originCity}
                onChange={(e) => setOriginCity(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-secondary-fixed focus:ring-1 focus:ring-secondary-fixed outline-none transition-all"
              />
              <input 
                type="text" 
                placeholder="SP" 
                value={originState}
                onChange={(e) => setOriginState(e.target.value)}
                className="w-20 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 text-center focus:border-secondary-fixed focus:ring-1 focus:ring-secondary-fixed outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button 
                onClick={() => setSaveOrigin(!saveOrigin)}
                className={cn(
                  "w-12 h-6 rounded-full transition-colors relative",
                  saveOrigin ? "bg-secondary-fixed" : "bg-white/20"
                )}
              >
                <div className={cn(
                  "w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform",
                  saveOrigin ? "translate-x-6" : "translate-x-0.5"
                )} />
              </button>
              <span className="text-sm text-white/60">Salvar este endereço de coleta</span>
            </div>
          </div>
        </section>

        <div className="w-full h-px bg-white/5 mb-8" />

        {/* Destination Section */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-bold text-white tracking-widest uppercase">Endereço de Entrega</h2>
          </div>
          
          <div className="space-y-3">
            <div className="flex gap-3">
              <input 
                type="text" 
                placeholder="00000-000" 
                value={formatCep(destCep)}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  const limited = val.slice(0, 8);
                  setDestCep(limited);
                  if (limited.length === 8) fetchAddress(limited, 'dest');
                  else setDestCepError(null);
                }}
                className={cn("flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-secondary-fixed focus:ring-1 focus:ring-secondary-fixed outline-none transition-all", destCepError && "border-red-500")}
              />
              {destCepError && <p className="text-red-500 text-[10px] mt-1">{destCepError}</p>}
              <button 
                type="button"
                onClick={() => fetchAddress(destCep, 'dest')}
                className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-secondary-fixed hover:bg-white/10 transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
            <input 
              type="text" 
              placeholder="Rua / Logradouro" 
              value={destStreet}
              onChange={(e) => setDestStreet(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-secondary-fixed focus:ring-1 focus:ring-secondary-fixed outline-none transition-all"
            />
            <div className="flex gap-3">
              <input 
                type="text" 
                placeholder="Nº *" 
                value={destNumber}
                onChange={(e) => setDestNumber(e.target.value)}
                className="w-28 shrink-0 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-secondary-fixed focus:ring-1 focus:ring-secondary-fixed outline-none transition-all"
              />
              <input 
                type="text" 
                placeholder="Complemento" 
                value={destComplement}
                onChange={(e) => setDestComplement(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-secondary-fixed focus:ring-1 focus:ring-secondary-fixed outline-none transition-all"
              />
            </div>
            <input 
              type="text" 
              placeholder="Bairro" 
              value={destNeighborhood}
              onChange={(e) => setDestNeighborhood(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-secondary-fixed focus:ring-1 focus:ring-secondary-fixed outline-none transition-all"
            />
            <div className="flex gap-3">
              <input 
                type="text" 
                placeholder="Cidade" 
                value={destCity}
                onChange={(e) => setDestCity(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-secondary-fixed focus:ring-1 focus:ring-secondary-fixed outline-none transition-all"
              />
              <input 
                type="text" 
                placeholder="UF" 
                value={destState}
                onChange={(e) => setDestState(e.target.value)}
                className="w-20 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 text-center focus:border-secondary-fixed focus:ring-1 focus:ring-secondary-fixed outline-none transition-all"
              />
            </div>
          </div>
        </section>

        {/* Details Section */}
        <section className="mb-8">
          <h2 className="text-sm font-bold text-white tracking-widest uppercase mb-4">Detalhes do Pedido</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-white/60 uppercase tracking-widest mb-2">Descrição do Item</label>
              <input 
                type="text" 
                placeholder="Ex: Pizza Grande, Documentos..." 
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-secondary-fixed focus:ring-1 focus:ring-secondary-fixed outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-white/60 uppercase tracking-widest mb-2">Observações</label>
              <textarea 
                placeholder="Ex: Deixar na portaria, campainha estragada..." 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-secondary-fixed focus:ring-1 focus:ring-secondary-fixed outline-none transition-all resize-none"
              />
            </div>
          </div>
        </section>

        {/* Price Section */}
        <section className="mb-8">
          <div className="flex justify-between items-end mb-2">
            <label className="block text-[10px] font-bold text-white/60 uppercase tracking-widest">Valor da Corrida (R$)</label>
            {calculatedDistance && (
              <span className="text-[10px] font-bold text-secondary-fixed">~ {calculatedDistance.toFixed(1).replace('.', ',')} km</span>
            )}
          </div>
          <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 flex items-center gap-2">
            <span className="text-white/60 font-bold">R$</span>
            {isCalculating ? (
              <div className="w-24 h-8 bg-white/10 rounded animate-pulse" />
            ) : (
              <span className="text-2xl font-black text-white">
                {calculatedPrice ? calculatedPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '---'}
              </span>
            )}
          </div>
        </section>

      </main>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 w-full bg-[#0f1c2c] border-t border-white/5 p-4 flex flex-col gap-4 z-50">
        {formError && (
          <p className="text-red-500 text-xs text-center font-bold">{formError}</p>
        )}
        <div className="flex gap-4">
          <button 
            onClick={onBack}
            className="flex-1 py-4 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleRequest}
            disabled={isCalculating}
            className={cn(
              "flex-[2] py-4 rounded-xl bg-secondary-fixed text-[#0f1c2c] font-black active:scale-[0.98] transition-all flex items-center justify-center gap-2",
              isCalculating && "opacity-50 cursor-not-allowed"
            )}
          >
            {isCalculating ? (
              <>
                <div className="w-5 h-5 border-2 border-[#0f1c2c]/30 border-t-[#0f1c2c] rounded-full animate-spin" />
                Calculando...
              </>
            ) : (
              "Pagar e Solicitar"
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

interface DetailsScreenProps {
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

function DetailsScreen({ 
  data, 
  setData, 
  onBack, 
  onConfirm,
  onNavigate,
  isCalling,
  pricingSettings,
  onOpenNotifications,
  unreadCount = 0
}: DetailsScreenProps) {
  // Use a default distance of 3km if not set
  const distance = data.distance || 3;

  const calculatePrice = (dist: number) => {
    const { platformFee, baseDistance, basePrice, pricePerKm } = pricingSettings;
    let finalPrice = 0;
    if (dist <= baseDistance) {
      finalPrice = basePrice + platformFee;
    } else {
      finalPrice = (dist * pricePerKm) + platformFee;
    }
    return finalPrice;
  };

  const estimatedPrice = calculatePrice(distance);

  // Update data.price when distance changes
  useEffect(() => {
    if (data.price !== estimatedPrice || data.distance !== distance) {
      setData({ ...data, price: estimatedPrice, distance });
    }
  }, [distance, estimatedPrice, data.price, data.distance, setData, data]);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full w-full bg-surface relative overflow-y-auto no-scrollbar"
    >
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl flex justify-between items-center px-6 py-4 border-b border-outline-variant">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-dashed border-secondary-fixed/50 active:scale-90 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-on-surface" />
          </button>
          <h1 className="font-headline font-extrabold text-on-surface tracking-tight text-xl">TaNaMao</h1>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={onOpenNotifications}
            className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-highest border border-outline-variant active:scale-90 transition-all"
          >
            <Bell className="w-5 h-5 text-on-surface" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-on-error text-[10px] font-black rounded-full flex items-center justify-center border-2 border-surface">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-surface-container-highest border border-outline-variant shadow-sm">
            <img src={ASSETS.PROFILE_PIC} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
        </div>
      </header>

      <main className="pt-20 pb-32">
        {/* Map Section */}
        <div className="relative w-full h-[320px] overflow-hidden">
          <img 
            src={ASSETS.MAP_DETAILS} 
            alt="Route Map" 
            className="w-full h-full object-cover opacity-60 grayscale-[30%]"
            referrerPolicy="no-referrer"
          />
          
          <div className="absolute top-6 left-6 right-6 flex flex-col gap-3">
            <div className="bg-surface-container-low p-4 rounded-xl shadow-lg flex items-center gap-3 border border-outline-variant">
              <div className="w-6 h-6 rounded-full bg-secondary-fixed/20 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full border-2 border-secondary-fixed flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-secondary-fixed" />
                </div>
              </div>
              <span className="text-xs font-bold text-on-surface truncate">Sua Loja: {data.origin}</span>
            </div>
            <div className="bg-surface-container-low p-4 rounded-xl shadow-lg flex items-center gap-3 border border-outline-variant">
              <MapPin className="w-5 h-5 text-red-500" />
              <span className="text-xs font-bold text-on-surface truncate">Destino: {data.destination || 'Rua Oscar Freire, 450'}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 -mt-16 relative z-10 space-y-6">
          {/* Estimate Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-container-low p-6 rounded-3xl shadow-xl flex flex-col items-center justify-center text-center border border-outline-variant">
              <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-black mb-2">Preço Estimado</span>
              <span className="font-headline font-black text-2xl text-on-surface">R$ {estimatedPrice.toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="bg-surface-container-low p-6 rounded-3xl shadow-xl flex flex-col items-center justify-center text-center border border-outline-variant">
              <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-black mb-2">Distância</span>
              <div className="flex items-baseline gap-1">
                <span className="font-headline font-black text-2xl text-on-surface">{distance}</span>
                <span className="font-headline font-black text-sm text-on-surface-variant">km</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <section className="bg-surface-container-low/50 p-6 rounded-[2.5rem] space-y-6">
            <h2 className="font-headline font-black text-xl text-on-surface px-2">Dados da Entrega</h2>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="block text-[10px] uppercase tracking-widest font-black text-on-surface-variant ml-1">Distância (Simulação)</label>
                <div className="flex items-center bg-surface-container-low rounded-2xl px-4 py-4 border border-outline-variant focus-within:ring-2 ring-secondary-fixed transition-all shadow-sm">
                  <MapPin className="w-5 h-5 text-on-surface-variant mr-3" />
                  <input 
                    type="number" 
                    value={data.distance || ''}
                    onChange={(e) => setData({ ...data, distance: Number(e.target.value) })}
                    className="bg-transparent border-none p-0 w-full focus:ring-0 text-on-surface font-bold placeholder:text-outline-variant/60" 
                    placeholder="Ex: 5" 
                  />
                  <span className="text-on-surface-variant font-bold ml-2">km</span>
                </div>
              </div>

              <InputField 
                label="Nome do Cliente" 
                icon={<User className="w-5 h-5" />} 
                placeholder="Ex: João Silva" 
                value={data.customerName}
                onChange={(val) => setData({ ...data, customerName: val })}
              />
              <InputField 
                label="Telefone / WhatsApp" 
                icon={<Phone className="w-5 h-5" />} 
                placeholder="(11) 99999-9999" 
                type="tel" 
                value={data.customerPhone}
                onChange={(val) => setData({ ...data, customerPhone: val })}
              />
              
              <div className="space-y-2">
                <label className="block text-[10px] uppercase tracking-widest font-black text-on-surface-variant ml-1">Observações</label>
                <div className="flex items-start bg-surface-container-low rounded-2xl px-4 py-4 border border-outline-variant focus-within:ring-2 ring-secondary-fixed transition-all shadow-sm">
                  <Menu className="w-5 h-5 text-on-surface-variant mr-3 mt-0.5" />
                  <textarea 
                    value={data.notes}
                    onChange={(e) => setData({ ...data, notes: e.target.value })}
                    className="bg-transparent border-none p-0 w-full focus:ring-0 text-on-surface font-bold placeholder:text-outline-variant/60 resize-none" 
                    placeholder="Ex: Apartamento 42, bloco B..." 
                    rows={2}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Action */}
          <div className="pt-4">
            <button 
              onClick={onConfirm}
              disabled={isCalling || !data.customerName?.trim() || !data.customerPhone?.trim()}
              className={`w-full font-headline font-black text-xl py-6 rounded-3xl shadow-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all ${
                isCalling || !data.customerName?.trim() || !data.customerPhone?.trim()
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-50' 
                  : 'bg-secondary-fixed text-on-secondary-fixed shadow-secondary-fixed/30 hover:brightness-110'
              }`}
            >
              {isCalling ? (
                <div className="w-6 h-6 border-2 border-on-secondary-fixed border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Chamar Motoboy</span>
                  <Bike className="w-6 h-6" />
                </>
              )}
            </button>
            {(!data.customerName?.trim() || !data.customerPhone?.trim()) && (
              <p className="text-center text-[10px] font-black text-error mt-2 uppercase tracking-widest">Preencha o nome e telefone do cliente</p>
            )}
            <p className="text-center text-[10px] font-black text-on-surface-variant mt-6 uppercase tracking-widest opacity-60">Pagamento na entrega pela plataforma</p>
          </div>
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 w-full h-[70.5px] bg-surface/90 backdrop-blur-md border-t border-outline-variant flex justify-around items-center px-4 pb-2 pt-2 z-50 rounded-t-[2rem]">
        <NavItem icon={<HomeIcon className="w-5 h-5" />} label="Home" onClick={() => onNavigate('home')} />
        <NavItem icon={<ReceiptText className="w-5 h-5" />} label="Atividades" active onClick={() => onNavigate('activities')} />
        <NavItem icon={<Wallet className="w-5 h-5" />} label="Pagamentos" onClick={() => onNavigate('payments')} />
        <NavItem icon={<UserCircle className="w-5 h-5" />} label="Perfil" onClick={() => onNavigate('profile')} />
      </nav>
    </motion.div>
  );
}

function SearchingScreen({ deliveryId, onFound, onCancel, showToast, onNavigate }: { deliveryId?: string, onFound: () => void, onCancel: () => void, showToast: (msg: string, type?: 'success' | 'error' | 'info') => void, onNavigate: (screen: Screen) => void }) {
  const { user } = useContext(AuthContext)!;
  const [searchingStatus, setSearchingStatus] = useState('Buscando motoboys online...');
  const [deliveryData, setDeliveryData] = useState<DeliveryData | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancel = async () => {
    if (!deliveryId) return;
    try {
      await updateDoc(doc(db, 'deliveries', deliveryId), {
        status: 'cancelled',
        cancelledAt: serverTimestamp()
      });
      showToast('Entrega cancelada com sucesso.', 'success');
      onCancel();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'deliveries');
      showToast('Erro ao cancelar entrega.', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  useEffect(() => {
    if (!deliveryId || !user) return;

    const deliveryRef = doc(db, 'deliveries', deliveryId);
    
    const unsubscribe = onSnapshot(deliveryRef, async (snapshot) => {
      if (!snapshot.exists()) return;
      
      const data = { id: snapshot.id, ...snapshot.data() } as DeliveryData;
      setDeliveryData(data);
      
      // If accepted, move to tracking
      if (data.status === 'collecting' || data.status === 'in-route') {
        onFound();
        return;
      }

      // Dispatch logic
      const now = Date.now();
      const needsNewOffer = !data.offeredTo || (data.offerExpiresAt && data.offerExpiresAt < now);

      if (data.status === 'searching' && needsNewOffer) {
        try {
          // If the previous offer expired, add to rejectedBy
          const rejectedBy = data.rejectedBy || [];
          if (data.offeredTo && data.offerExpiresAt && data.offerExpiresAt < now) {
            if (!rejectedBy.includes(data.offeredTo)) {
              rejectedBy.push(data.offeredTo);
            }
          }

          // Find online couriers
          const fiveMinutesAgo = new Date(now - 300000);
          
          // Try to find couriers with isOnline == true first
          let couriersQuery = query(
            collection(db, 'users'),
            where('role', '==', 'courier'),
            where('isOnline', '==', true),
            where('lastActive', '>=', Timestamp.fromDate(fiveMinutesAgo))
          );
          
          let couriersSnap = await getDocs(couriersQuery);
          
          // If no online couriers found, try any courier active recently
          if (couriersSnap.empty) {
            couriersQuery = query(
              collection(db, 'users'),
              where('role', '==', 'courier'),
              where('lastActive', '>=', Timestamp.fromDate(fiveMinutesAgo))
            );
            couriersSnap = await getDocs(couriersQuery);
          }
          
          const onlineCouriers = couriersSnap.docs
            .map(d => ({ id: d.id, ...d.data() } as { id: string, name?: string }))
            .filter(c => c.id !== user.uid && !rejectedBy.includes(c.id));

          if (onlineCouriers.length > 0) {
            // Pick the first available one
            const targetCourier = onlineCouriers[0];
            setSearchingStatus(`Chamando ${targetCourier.name || 'Motoboy'}...`);
            
            await updateDoc(deliveryRef, {
              offeredTo: targetCourier.id,
              offerExpiresAt: now + 30000, // 30 seconds to accept
              rejectedBy: rejectedBy
            });
          } else {
            setSearchingStatus('Nenhum motoboy disponível no momento. Tentando novamente...');
            // Reset offeredTo to try again later if someone comes online
            if (data.offeredTo || rejectedBy.length > (data.rejectedBy?.length || 0)) {
              await updateDoc(deliveryRef, {
                offeredTo: null,
                offerExpiresAt: null,
                rejectedBy: rejectedBy
              });
            }
          }
        } catch (error) {
          console.error("Error in dispatch logic:", error);
        }
      }
    });

    return () => unsubscribe();
  }, [deliveryId, user]);

  const simulateCourier = async () => {
    if (!deliveryId) return;
    try {
      // Try to find a real online courier first
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'courier'),
        where('isOnline', '==', true)
      );
      const snap = await getDocs(q);
      const onlineCouriers = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as { id: string, name?: string }))
        .filter(c => c.id !== user?.uid);

      if (onlineCouriers.length > 0) {
        // Force offer to the first online courier
        const target = onlineCouriers[0];
        await updateDoc(doc(db, 'deliveries', deliveryId), {
          offeredTo: target.id,
          offerExpiresAt: Date.now() + 30000,
          lastSimulation: serverTimestamp() // Trigger snapshot
        });
        setSearchingStatus(`Simulação: Chamando ${target.name || 'Motoboy Online'}...`);
      } else {
        // Create mock if none online
        const mockId = 'mock-courier-' + Math.floor(Math.random() * 1000);
        await setDoc(doc(db, 'users', mockId), {
          uid: mockId,
          name: 'Motoboy Simulado ' + mockId.slice(-3),
          email: `mock${mockId.slice(-3)}@tanamao.com`,
          role: 'courier',
          isOnline: true,
          lastActive: serverTimestamp()
        });
        setSearchingStatus('Motoboy simulado criado! Aguardando despacho...');
      }
    } catch (error) {
      console.error("Error simulating courier:", error);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full w-full flex flex-col items-center justify-center bg-[#0f1c2c] p-8 text-center"
    >
      <div className="relative">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute inset-0 bg-secondary-fixed rounded-full blur-2xl"
        />
        <div className="relative w-32 h-32 rounded-full bg-secondary-fixed flex items-center justify-center shadow-2xl">
          <Bike className="w-16 h-16 text-on-secondary-fixed" />
        </div>
      </div>
      
      <div className="mt-12 space-y-4">
        <h2 className="font-headline font-extrabold text-3xl text-white">Procurando Motoboy...</h2>
        <p className="text-white/60 max-w-xs mx-auto">{searchingStatus}</p>
        
        {deliveryId && (
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 mt-4">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Código de Entrega (Passe ao Motoboy)</p>
            <p className="text-3xl font-black text-secondary-fixed tracking-[0.5em]">
              {deliveryData?.confirmationCode || '....'}
            </p>
          </div>
        )}
      </div>

      <div className="mt-12 w-full max-w-xs h-1 bg-white/10 rounded-full overflow-hidden">
        <motion.div 
          animate={{ x: ['-100%', '100%'] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="w-1/2 h-full bg-secondary-fixed rounded-full"
        />
      </div>

      <button 
        onClick={simulateCourier}
        className="mt-12 px-6 py-3 bg-white/5 hover:bg-white/10 text-white/40 text-xs font-black uppercase tracking-widest rounded-full transition-all border border-white/10 active:scale-95"
      >
        Simular Motoboy Online
      </button>

      <button 
        onClick={() => setIsCancelling(true)}
        className="mt-4 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-black uppercase tracking-widest rounded-full transition-all border border-red-500/20 active:scale-95"
      >
        Cancelar Entrega
      </button>

      <Modal 
        isOpen={isCancelling} 
        onClose={() => setIsCancelling(false)} 
        title="Cancelar Entrega"
        dark={true}
      >
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center py-4">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8" />
            </div>
            <p className="text-center text-white/60">
              Tem certeza que deseja cancelar esta entrega? Esta ação não pode ser desfeita.
            </p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setIsCancelling(false)}
              className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all"
            >
              Voltar
            </button>
            <button 
              onClick={handleCancel}
              className="flex-1 py-4 bg-red-500 text-white font-bold rounded-2xl shadow-lg shadow-red-500/20 active:scale-95 transition-all"
            >
              Sim, Cancelar
            </button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}

function ChatModal({ deliveryId, onClose, currentUserRole, currentUserId, otherUserName }: { deliveryId: string, onClose: () => void, currentUserRole: 'merchant' | 'courier', currentUserId: string, otherUserName: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, `deliveries/${deliveryId}/messages`), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    return () => unsubscribe();
  }, [deliveryId]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    try {
      await addDoc(collection(db, `deliveries/${deliveryId}/messages`), {
        text: newMessage,
        senderId: currentUserId,
        senderRole: currentUserRole,
        createdAt: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message", error);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex flex-col justify-end">
      <div className="bg-surface-container-lowest h-[80vh] rounded-t-3xl flex flex-col shadow-2xl border-t border-outline-variant">
        <div className="flex items-center justify-between p-6 border-b border-outline-variant">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary-fixed/20 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-secondary-fixed" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-on-surface">Chat</h3>
              <p className="text-xs text-on-surface-variant">com {otherUserName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
            <X className="w-6 h-6 text-on-surface-variant" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-surface-container-lowest">
          {messages.map(msg => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl ${isMe ? 'bg-secondary-fixed text-on-secondary-fixed rounded-tr-sm' : 'bg-surface-container-high text-on-surface rounded-tl-sm'}`}>
                  <p className="text-sm">{msg.text}</p>
                  <span className={`text-[10px] mt-1 block ${isMe ? 'text-on-secondary-fixed/70 text-right' : 'text-on-surface-variant'}`}>
                    {msg.createdAt?.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-4 border-t border-outline-variant bg-surface-container-lowest flex gap-3">
          <input 
            type="text" 
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSend()}
            placeholder="Digite sua mensagem..."
            className="flex-1 bg-surface-container-high text-on-surface rounded-full px-6 py-3 outline-none border border-outline-variant focus:border-secondary-fixed transition-colors"
          />
          <button 
            onClick={handleSend} 
            disabled={!newMessage.trim()}
            className="w-12 h-12 bg-secondary-fixed rounded-full flex items-center justify-center text-on-secondary-fixed disabled:opacity-50 active:scale-95 transition-transform"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function RatingModal({ deliveryId, targetRole, targetName, onClose, onSubmit }: { deliveryId: string, targetRole: 'merchant' | 'courier', targetName: string, onClose: () => void, onSubmit: (rating: number, comment: string) => void }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest rounded-[2rem] p-8 w-full max-w-sm space-y-8 shadow-2xl border border-outline-variant">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-secondary-fixed/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8 text-secondary-fixed" />
          </div>
          <h3 className="font-headline font-extrabold text-2xl text-on-surface">Avalie a Entrega</h3>
          <p className="text-sm text-on-surface-variant">Como foi sua experiência com {targetName}?</p>
        </div>
        
        <div className="flex justify-center gap-2">
          {[1,2,3,4,5].map(star => (
            <button key={star} onClick={() => setRating(star)} className="p-1 hover:scale-110 transition-transform">
              <Star className={`w-10 h-10 ${star <= rating ? 'fill-secondary-fixed text-secondary-fixed' : 'text-outline-variant'}`} />
            </button>
          ))}
        </div>
        
        <textarea 
          placeholder="Deixe um comentário (opcional)"
          value={comment}
          onChange={e => setComment(e.target.value)}
          className="w-full bg-surface-container-high text-on-surface rounded-2xl p-4 outline-none resize-none h-28 border border-outline-variant focus:border-secondary-fixed transition-colors text-sm"
        />
        
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-4 bg-surface-container-high text-on-surface font-bold rounded-2xl active:scale-95 transition-transform"
          >
            Pular
          </button>
          <button 
            onClick={() => onSubmit(rating, comment)}
            disabled={rating === 0}
            className="flex-1 py-4 bg-secondary-fixed text-on-secondary-fixed font-bold rounded-2xl disabled:opacity-50 active:scale-95 transition-transform shadow-lg shadow-secondary-fixed/20"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}

interface TrackingScreenProps {
  data: DeliveryData;
  onFinish: () => void;
  onCancel?: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onOpenChat?: (otherUserName: string) => void;
}

function TrackingScreen({ data, onFinish, onCancel, showToast, onOpenChat }: TrackingScreenProps) {
  const [eta, setEta] = useState<string>('Calculando...');
  const [delivery, setDelivery] = useState<DeliveryData>(data);
  const [route, setRoute] = useState<any>(data.routeGeometry);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancel = async () => {
    try {
      await updateDoc(doc(db, 'deliveries', delivery.id!), {
        status: 'cancelled',
        cancelledAt: serverTimestamp()
      });
      showToast('Entrega cancelada com sucesso.', 'success');
      if (onCancel) {
        onCancel();
      } else {
        onFinish();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'deliveries');
      showToast('Erro ao cancelar entrega.', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  useEffect(() => {
    if (!data.id) return;
    const unsubscribe = onSnapshot(doc(db, 'deliveries', data.id), (doc) => {
      if (doc.exists()) {
        setDelivery({ ...doc.data(), id: doc.id } as DeliveryData);
      }
    });
    return () => unsubscribe();
  }, [data.id]);

  useEffect(() => {
    const fetchRoute = async () => {
      if (delivery.courierLocation && delivery.destinationLocation) {
        try {
          const response = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${delivery.courierLocation.lng},${delivery.courierLocation.lat};${delivery.destinationLocation.lng},${delivery.destinationLocation.lat}?overview=full&geometries=geojson`
          );
          const data = await response.json();
          if (data.routes && data.routes.length > 0) {
            setRoute(data.routes[0].geometry);
          }
        } catch (error) {
          console.error("Error fetching route:", error);
        }
      }
    };
    fetchRoute();
  }, [delivery.courierLocation, delivery.destinationLocation]);

  useEffect(() => {
    if (delivery.courierLocation && delivery.destinationLocation) {
      const dist = Math.sqrt(
        Math.pow(delivery.courierLocation.lat - delivery.destinationLocation.lat, 2) + 
        Math.pow(delivery.courierLocation.lng - delivery.destinationLocation.lng, 2)
      );
      const distKm = dist * 111;
      const timeHours = distKm / 30;
      const timeMins = Math.max(1, Math.round(timeHours * 60));
      setEta(`${timeMins} min`);
    } else {
      setEta('15 min');
    }
  }, [delivery.courierLocation, delivery.destinationLocation]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full w-full relative flex flex-col"
    >
      <div className="absolute inset-0 z-0 opacity-80">
        <DeliveryMap courierLocation={delivery.courierLocation} destinationLocation={delivery.destinationLocation} routeGeometry={route} />
      </div>

      {delivery && delivery.id && (
        <div className="absolute top-0 w-full p-6 z-10 pointer-events-none">
          <div className="bg-surface-container-low/90 backdrop-blur-md p-4 rounded-3xl shadow-xl border border-outline-variant flex items-center gap-4 pointer-events-auto">
            <div className="w-12 h-12 rounded-full bg-secondary-fixed flex items-center justify-center">
              <Bike className="w-6 h-6 text-on-secondary-fixed" />
            </div>
            <div className="flex-1">
              <h3 className="font-headline font-bold text-on-surface">Motoboy a caminho</h3>
              <p className="text-xs text-on-surface-variant">Chegada em aproximadamente {eta}</p>
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-0 w-full p-6 z-10 pointer-events-none">
        <div className="bg-surface-container-lowest rounded-[2.5rem] p-8 shadow-2xl border border-outline-variant space-y-6 pointer-events-auto">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="font-headline font-extrabold text-2xl text-on-surface">Entrega em curso</h2>
              <p className="text-on-surface-variant text-sm">Para: {delivery.customerName || 'João Silva'}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="bg-secondary-fixed/20 text-secondary-fixed px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                {delivery.status === 'collecting' ? 'Indo Coletar' : 'Em Rota'}
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Valor Cobrado</p>
                <p className="font-headline font-black text-lg text-on-surface">R$ {delivery.price?.toFixed(2).replace('.', ',')}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center">
                <MapPin className="w-5 h-5 text-on-surface-variant" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Destino</p>
                <p className="text-sm font-semibold text-on-surface truncate">{delivery.destination || 'Av. Paulista, 1200 - Ap 42'}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Distância</p>
                <p className="text-sm font-semibold text-on-surface">{delivery.distance || 3} km</p>
              </div>
            </div>
            
            {delivery.confirmationCode && (
              <div className="flex items-center gap-4 p-4 bg-secondary-fixed/10 rounded-2xl border border-secondary-fixed/20">
                <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center">
                  <Package className="w-5 h-5 text-on-secondary-fixed" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-secondary-fixed">Código de Entrega</p>
                  <p className="text-xl font-bold text-on-surface tracking-widest">{delivery.confirmationCode}</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => onOpenChat && onOpenChat('Motoboy')}
              className="flex items-center justify-center gap-3 py-4 bg-surface-container-high text-on-surface rounded-2xl font-bold active:scale-95 transition-transform border border-outline-variant"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Chat</span>
            </button>
            <button 
              onClick={onFinish}
              className="flex items-center justify-center gap-3 py-4 bg-primary-container text-white font-headline font-bold rounded-2xl active:scale-[0.98] transition-all"
            >
              {delivery.status === 'delivered' ? 'Voltar para o Início' : 'Acompanhando...'}
            </button>
          </div>

          {delivery.status === 'collecting' && (
            <button 
              onClick={() => setIsCancelling(true)}
              className="w-full py-4 bg-red-500/10 text-red-500 font-bold rounded-2xl border border-red-500/20 active:scale-[0.98] transition-all mt-2"
            >
              Cancelar Entrega
            </button>
          )}
        </div>
      </div>

      <Modal 
        isOpen={isCancelling} 
        onClose={() => setIsCancelling(false)} 
        title="Cancelar Entrega"
      >
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center py-4">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8" />
            </div>
            <p className="text-center text-on-surface-variant">
              Tem certeza que deseja cancelar esta entrega? Esta ação não pode ser desfeita.
            </p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setIsCancelling(false)}
              className="flex-1 py-4 bg-surface-container-highest text-on-surface font-bold rounded-xl active:scale-95 transition-all"
            >
              Voltar
            </button>
            <button 
              onClick={handleCancel}
              className="flex-1 py-4 bg-red-500 text-white font-bold rounded-xl active:scale-95 transition-all shadow-lg shadow-red-500/20"
            >
              Sim, Cancelar
            </button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 15);
  }, [center, map]);
  return null;
}

function CourierAvailableScreen({ onAccept, onLogout, onNavigate, pricingSettings, onOpenNotifications, unreadCount }: { onAccept: (delivery: DeliveryData) => void, onLogout: () => void, onNavigate: (screen: Screen) => void, pricingSettings: PricingSettings, onOpenNotifications: () => void, unreadCount: number }) {
  const { profile, user } = useContext(AuthContext)!;
  const [offeredDelivery, setOfferedDelivery] = useState<DeliveryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [userLocation, setUserLocation] = useState<[number, number]>([-23.5505, -46.6333]); // Default to SP
  const [timeLeft, setTimeLeft] = useState(30);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastNotifiedRef = useRef<string | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  useEffect(() => {
    if (!user || !isOnline) return;

    const updateActive = async () => {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          lastActive: serverTimestamp()
        });
      } catch (error) {
        console.error("Heartbeat error:", error);
      }
    };

    updateActive();
    const interval = setInterval(updateActive, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [user, isOnline]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'deliveries'),
      where('status', '==', 'searching'),
      where('offeredTo', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        const data = { id: docSnap.id, ...docSnap.data() } as DeliveryData;
        setOfferedDelivery(data);
        
        if (data.id && lastNotifiedRef.current !== data.id) {
          sendBrowserNotification('Nova Entrega Disponível!', `Nova entrega para ${data.customerName || 'Cliente'}`);
          lastNotifiedRef.current = data.id;
        }
        
        if (data.offerExpiresAt) {
           const remaining = Math.max(0, Math.floor((data.offerExpiresAt - Date.now()) / 1000));
           setTimeLeft(remaining);
        }

        if (!audioRef.current) {
          audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          audioRef.current.loop = true;
          audioRef.current.play().catch(e => console.log("Audio play failed", e));
        }
      } else {
        setOfferedDelivery(null);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'deliveries');
    });

    return () => {
      unsubscribe();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [user]);

  useEffect(() => {
    if (!offeredDelivery) return;
    const interval = setInterval(() => {
      if (offeredDelivery.offerExpiresAt) {
         const remaining = Math.max(0, Math.floor((offeredDelivery.offerExpiresAt - Date.now()) / 1000));
         setTimeLeft(remaining);
         if (remaining <= 0) {
           handleReject(offeredDelivery);
           clearInterval(interval);
         }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [offeredDelivery]);

  const handleAccept = async (delivery: DeliveryData) => {
    if (!delivery.id || !auth.currentUser || acceptingId) return;
    setAcceptingId(delivery.id);

    try {
      await updateDoc(doc(db, 'deliveries', delivery.id), {
        status: 'collecting',
        courierId: auth.currentUser.uid,
        offeredTo: null,
        offerExpiresAt: null
      });
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      onAccept({ ...delivery, status: 'collecting', courierId: auth.currentUser.uid });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `deliveries/${delivery.id}`);
    } finally {
      setAcceptingId(null);
    }
  };

  const handleReject = async (delivery: DeliveryData) => {
    if (!delivery.id || !auth.currentUser) return;
    try {
      const rejectedBy = delivery.rejectedBy || [];
      await updateDoc(doc(db, 'deliveries', delivery.id), {
        offeredTo: null,
        offerExpiresAt: null,
        rejectedBy: [...rejectedBy, auth.currentUser.uid]
      });
      setOfferedDelivery(null);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    } catch (error) {
      console.error(error);
    }
  };

  const toggleOnline = async () => {
    if (!user) return;
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        isOnline: newStatus,
        lastActive: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating online status:", error);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full w-full bg-[#0f1c2c] relative flex flex-col overflow-hidden"
    >
      {/* Map Background */}
      <div className="absolute inset-0 z-0">
        <MapContainer 
          center={userLocation} 
          zoom={15} 
          zoomControl={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          <MapUpdater center={userLocation} />
          <Marker position={userLocation} icon={L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background-color: #c3f400; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(195,244,0,0.5);"></div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6]
          })} />
        </MapContainer>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f1c2c]/90 via-[#0f1c2c]/20 to-[#0f1c2c]/40 pointer-events-none" />
      </div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-[#0f1c2c]/80 backdrop-blur-xl flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <button 
              onClick={() => onNavigate('courier-profile')}
              className="w-10 h-10 rounded-full overflow-hidden border-2 border-secondary-fixed active:scale-90 transition-transform"
            >
              <img src={profile?.profilePic || ASSETS.PROFILE_PIC} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </button>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-secondary-fixed rounded-full border-2 border-[#0f1c2c] flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-on-secondary-fixed rounded-full" />
            </div>
          </div>
          <h1 className="text-xl font-extrabold text-secondary-fixed tracking-tight font-headline italic">TaNaMao</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div 
            onClick={toggleOnline}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all cursor-pointer",
              isOnline ? "bg-secondary-fixed/20 text-secondary-fixed" : "bg-white/10 text-white/40"
            )}
          >
            <div className={cn("w-2 h-2 rounded-full", isOnline ? "bg-secondary-fixed animate-pulse" : "bg-white/40")} />
            <span className="text-[10px] font-black uppercase tracking-widest">{isOnline ? 'Online' : 'Offline'}</span>
          </div>
          <button 
            onClick={onOpenNotifications}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors relative"
          >
            <Bell className="w-6 h-6 text-white" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-secondary-fixed text-on-secondary-fixed text-[8px] font-black rounded-full flex items-center justify-center border-2 border-[#0f1c2c]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="flex-1 pt-24 px-6 pb-32 space-y-6 overflow-y-auto no-scrollbar relative z-10">
        <div className="flex flex-col items-center justify-center py-4 gap-2">
          <div className="flex items-center gap-2 bg-[#0f1c2c]/60 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 shadow-lg">
            <div className="w-1.5 h-1.5 bg-secondary-fixed rounded-full animate-pulse" />
            <p className="text-white/80 font-black uppercase tracking-[0.2em] text-[10px]">
              {offeredDelivery ? "Entrega encontrada!" : "Aguardando novas chamadas..."}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-64 rounded-[2.5rem]" />
            <Skeleton className="h-20 rounded-2xl" />
          </div>
        ) : !offeredDelivery ? (
          <EmptyState 
            icon={<Bike />} 
            title="Nenhuma Entrega" 
            message="Estamos buscando as melhores oportunidades para você. Fique atento!" 
          />
        ) : (
          <div className="space-y-6">
              <motion.div 
                key={`offered-${offeredDelivery.id}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#0f1c2c]/60 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-secondary-fixed/50 space-y-6 shadow-[0_0_30px_rgba(195,244,0,0.2)] relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-fixed/10 rounded-full blur-3xl -mr-16 -mt-16" />
                
                {/* Progress Bar for Expiration */}
                <div className="absolute top-0 left-0 w-full h-1 bg-white/10 overflow-hidden">
                  <motion.div 
                    initial={{ width: '100%' }}
                    animate={{ width: `${(timeLeft / 30) * 100}%` }}
                    transition={{ duration: 1, ease: 'linear' }}
                    className={cn(
                      "h-full transition-colors duration-500",
                      timeLeft > 10 ? "bg-secondary-fixed" : "bg-red-500"
                    )}
                  />
                </div>
                
                <div className="flex justify-between items-start relative z-10">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-secondary-fixed uppercase tracking-[0.3em] animate-pulse">Nova Entrega Disponível</p>
                    <h3 className="font-headline font-black text-4xl text-white tracking-tighter">R$ {offeredDelivery.price?.toFixed(2)}</h3>
                  </div>
                  <div className="bg-secondary-fixed/20 px-4 py-2 rounded-2xl border border-secondary-fixed/30 text-center">
                    <p className="text-[10px] font-black text-secondary-fixed uppercase tracking-widest mb-0.5">Tempo</p>
                    <p className={cn("text-xl font-black transition-colors duration-500", timeLeft > 10 ? "text-white" : "text-red-500")}>{timeLeft}s</p>
                  </div>
                </div>

                <div className="space-y-4 relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-secondary-fixed/10 flex items-center justify-center shrink-0">
                      <Store className="w-5 h-5 text-secondary-fixed" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Retirada</p>
                      <p className="text-sm font-bold text-white truncate">{offeredDelivery.origin}</p>
                    </div>
                  </div>

                  <div className="ml-5 h-6 border-l-2 border-dashed border-white/10" />

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-white/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Entrega</p>
                      <p className="text-sm font-bold text-white truncate">{offeredDelivery.destination}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4 relative z-10">
                  <button 
                    onClick={() => handleReject(offeredDelivery)}
                    disabled={acceptingId === offeredDelivery.id}
                    className="flex-1 py-4 bg-white/5 text-white/60 font-headline font-black text-lg rounded-2xl border border-white/10 hover:bg-white/10 active:scale-[0.98] transition-all"
                  >
                    Recusar
                  </button>
                  <button 
                    onClick={() => handleAccept(offeredDelivery)}
                    disabled={acceptingId === offeredDelivery.id}
                    className="flex-[2] py-4 bg-secondary-fixed text-on-secondary-fixed font-headline font-black text-lg rounded-2xl shadow-lg shadow-secondary-fixed/20 hover:bg-secondary-fixed/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    {acceptingId === offeredDelivery.id ? (
                      <div className="w-6 h-6 border-2 border-on-secondary-fixed/20 border-t-on-secondary-fixed rounded-full animate-spin" />
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        Aceitar
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 w-full h-[70.5px] bg-[#0f1c2c]/90 backdrop-blur-md border-t border-white/5 flex justify-around items-center px-2 pb-2 pt-2 z-50">
        <CourierNavItem icon={<HomeIcon className="w-5 h-5" />} label="Início" active onClick={() => onNavigate('courier-available')} />
        <CourierNavItem icon={<Bike className="w-5 h-5" />} label="Entregas" onClick={() => onNavigate('courier-tracking')} />
        <CourierNavItem icon={<TrendingUp className="w-5 h-5" />} label="Ganhos" onClick={() => onNavigate('courier-earnings')} />
        <CourierNavItem icon={<UserCircle className="w-5 h-5" />} label="Perfil" onClick={() => onNavigate('courier-profile')} />
      </nav>
    </motion.div>
  );
}

function CourierNavItem({ icon, label, active, onClick }: { icon: ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <motion.button 
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 px-2 py-1 rounded-2xl transition-all",
        active ? "text-secondary-fixed" : "text-white/40"
      )}
    >
      <motion.div 
        animate={active ? { scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] } : {}}
        className={cn(
          "p-1.5 rounded-xl transition-all",
          active ? "bg-secondary-fixed/10 shadow-[0_0_15px_rgba(195,244,0,0.2)]" : "bg-transparent"
        )}
      >
        {cloneElement(icon as any, { className: "w-5 h-5" })}
      </motion.div>
      <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
      {active && (
        <motion.div 
          layoutId="courier-nav-active" 
          initial={{ width: 0 }}
          animate={{ width: 4 }}
          className="h-1 bg-secondary-fixed rounded-full mt-0.5" 
        />
      )}
    </motion.button>
  );
}

function DeliveryMap({ courierLocation, destinationLocation, routeGeometry }: { courierLocation?: { lat: number, lng: number }, destinationLocation?: { lat: number, lng: number }, routeGeometry?: any }) {
  // Default to a central location if none provided
  const defaultCenter: [number, number] = [-23.5505, -46.6333]; // Sao Paulo
  const center: [number, number] = courierLocation ? [courierLocation.lat, courierLocation.lng] : defaultCenter;

  const customIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', // Destination icon
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  const courierIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3062/3062634.png', // Courier icon
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  const positions = routeGeometry?.coordinates?.map((coord: [number, number]) => [coord[1], coord[0]] as [number, number]) || [];

  return (
    <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%', zIndex: 0 }} zoomControl={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapUpdater center={center} />
      {positions.length > 0 && (
        <Polyline 
          positions={positions} 
          color="#10b981" 
          weight={6} 
          opacity={0.9} 
          dashArray="10, 10"
        />
      )}
      {courierLocation && (
        <Marker position={[courierLocation.lat, courierLocation.lng]} icon={courierIcon}>
          <Popup>Entregador</Popup>
        </Marker>
      )}
      {destinationLocation && (
        <Marker position={[destinationLocation.lat, destinationLocation.lng]} icon={customIcon}>
          <Popup>Destino</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}

interface CourierTrackingScreenProps {
  data: DeliveryData;
  onGoToEarnings: () => void;
  onGoToConfirmation: (delivery: DeliveryData) => void;
  onLogout: () => void;
  onGoToAvailable: () => void;
  onNavigate: (screen: Screen) => void;
  onOpenChat?: (otherUserName: string) => void;
}

function CourierTrackingScreen({ 
  data, 
  onGoToEarnings, 
  onGoToConfirmation, 
  onLogout,
  onGoToAvailable,
  onNavigate,
  onOpenNotifications,
  unreadCount,
  onOpenChat
}: CourierTrackingScreenProps & { onOpenNotifications: () => void, unreadCount: number }) {
  const { profile } = useContext(AuthContext)!;
  const [delivery, setDelivery] = useState<DeliveryData | null>(data?.id ? data : null);
  const [pastDeliveries, setPastDeliveries] = useState<DeliveryData[]>([]);
  const [eta, setEta] = useState<string>('Calculando...');
  const [notifiedDelay, setNotifiedDelay] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [deliveryCode, setDeliveryCode] = useState('');
  const [currentRouteGeometry, setCurrentRouteGeometry] = useState<any>(null);

  useEffect(() => {
    setNotifiedDelay(false);
  }, [delivery?.id]);

  useEffect(() => {
    const fetchRoute = async () => {
      if (!delivery || !delivery.courierLocation) return;
      
      const targetLocation = delivery.status === 'collecting' ? delivery.originLocation : delivery.destinationLocation;
      if (!targetLocation) return;

      try {
        const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${delivery.courierLocation.lng},${delivery.courierLocation.lat};${targetLocation.lng},${targetLocation.lat}?overview=full&geometries=geojson`);
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          setCurrentRouteGeometry(data.routes[0].geometry);
        }
      } catch (e) {
        console.error("Error fetching route:", e);
      }
    };

    fetchRoute();
  }, [delivery?.status, delivery?.id, delivery?.originLocation, delivery?.destinationLocation]); // intentionally omitted courierLocation to avoid spamming OSRM

  useEffect(() => {
    if (!auth.currentUser) return;
    
    // Fetch active delivery
    const qActive = query(
      collection(db, 'deliveries'),
      where('courierId', '==', auth.currentUser.uid),
      where('status', 'in', ['collecting', 'in-route'])
    );

    const unsubscribeActive = onSnapshot(qActive, (snapshot) => {
      if (!snapshot.empty) {
        const d = { ...snapshot.docs[0].data(), id: snapshot.docs[0].id } as DeliveryData;
        setDelivery(d);
        setLoading(false);
      } else {
        setDelivery(null);
        // Fetch past deliveries
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const qPast = query(
          collection(db, 'deliveries'),
          where('courierId', '==', auth.currentUser.uid),
          where('status', '==', 'delivered'),
          where('createdAt', '>=', Timestamp.fromDate(oneWeekAgo)),
          orderBy('createdAt', 'desc')
        );
        
        getDocs(qPast).then(pastSnapshot => {
          const past = pastSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as DeliveryData));
          setPastDeliveries(past);
          setLoading(false);
        }).catch(err => {
          console.error("Error fetching past deliveries:", err);
          setLoading(false);
        });
      }
    });

    return () => unsubscribeActive();
  }, []);

  useEffect(() => {
    if (!delivery?.id) return;
    
    let watchId: number;
    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          if (delivery.destinationLocation) {
            const dist = Math.sqrt(
              Math.pow(latitude - delivery.destinationLocation.lat, 2) + 
              Math.pow(longitude - delivery.destinationLocation.lng, 2)
            );
            // Rough conversion: 1 degree ~ 111km. Speed ~ 30km/h
            const distKm = dist * 111;
            const timeHours = distKm / 30;
            const timeMins = Math.max(1, Math.round(timeHours * 60));
            setEta(`${timeMins} min`);

            if (timeMins > 20 && !notifiedDelay && delivery.merchantId) {
              sendNotification(
                delivery.merchantId, 
                "Atraso na entrega", 
                `O motoboy está previsto para chegar em ${timeMins} minutos.`, 
                'warning'
              );
              setNotifiedDelay(true);
            }
          } else {
            setEta('15 min');
          }

          try {
            await updateDoc(doc(db, 'deliveries', delivery.id!), {
              courierLocation: { lat: latitude, lng: longitude }
            });
          } catch (error) {
            console.error("Error updating location:", error);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [delivery?.id, delivery?.destinationLocation?.lat, delivery?.destinationLocation?.lng]);

  const handleUpdateStatus = async () => {
    if (!delivery?.id || isUpdating) return;
    
    if (delivery.status === 'collecting') {
      setIsUpdating(true);
      try {
        await updateDoc(doc(db, 'deliveries', delivery.id), { status: 'in-route' });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `deliveries/${delivery.id}`);
      } finally {
        setIsUpdating(false);
      }
      return;
    }

    if (delivery.status === 'in-route') {
      onGoToConfirmation(delivery);
      return;
    }
  };

  // handleConfirmCode removed as it's now in handleConfirm in CourierConfirmationScreen

  if (loading) {
    return (
      <div className="h-full w-full bg-[#0f1c2c] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-secondary-fixed border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!delivery) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="h-full w-full bg-[#0f1c2c] flex flex-col"
      >
        <header className="fixed top-0 w-full z-50 bg-[#0f1c2c]/80 backdrop-blur-xl flex justify-between items-center px-6 py-4 border-b border-white/5">
          <h1 className="text-xl font-extrabold text-white tracking-tight">Corridas Passadas</h1>
        </header>

        <main className="flex-1 pt-24 px-6 pb-32 space-y-4 overflow-y-auto no-scrollbar">
          {pastDeliveries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-white/5 backdrop-blur-md rounded-[2rem] border border-white/10">
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
                <History className="w-10 h-10 text-white/40" />
              </div>
              <p className="text-white/60 font-medium">Nenhuma corrida na última semana.</p>
            </div>
          ) : (
            pastDeliveries.map(d => (
              <div key={d.id} className="bg-white/5 p-6 rounded-[2rem] border border-white/10 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-secondary-fixed font-black text-xl">R$ {d.price?.toFixed(2)}</span>
                  <span className="text-white/40 text-xs font-bold uppercase tracking-widest">{d.createdAt?.toDate().toLocaleDateString()}</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Destino</p>
                  <p className="text-white/80 text-sm truncate font-medium">{d.destination}</p>
                </div>
              </div>
            ))
          )}
        </main>

        <nav className="fixed bottom-0 left-0 w-full h-[70.5px] bg-[#0f1c2c]/90 backdrop-blur-md border-t border-white/5 flex justify-around items-center px-2 pb-2 pt-2 z-50">
          <CourierNavItem icon={<HomeIcon className="w-5 h-5" />} label="Início" onClick={() => onNavigate('courier-available')} />
          <CourierNavItem icon={<Bike className="w-5 h-5" />} label="Entregas" active onClick={() => onNavigate('courier-tracking')} />
          <CourierNavItem icon={<TrendingUp className="w-5 h-5" />} label="Ganhos" onClick={() => onNavigate('courier-earnings')} />
          <CourierNavItem icon={<UserCircle className="w-5 h-5" />} label="Perfil" onClick={() => onNavigate('courier-profile')} />
        </nav>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full w-full bg-[#0f1c2c] relative flex flex-col"
    >
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-[#0f1c2c]/80 backdrop-blur-xl flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-4">
          <Menu className="w-6 h-6 text-secondary-fixed" />
          <h1 className="text-xl font-extrabold text-secondary-fixed tracking-tight font-headline italic">TaNaMao</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onOpenNotifications}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors relative"
          >
            <Bell className="w-6 h-6 text-white" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-secondary-fixed text-on-secondary-fixed text-[8px] font-black rounded-full flex items-center justify-center border-2 border-[#0f1c2c]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <button 
            onClick={() => onNavigate('courier-profile')}
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-secondary-fixed active:scale-90 transition-transform"
          >
            <img src={profile?.profilePic || ASSETS.PROFILE_PIC} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </button>
        </div>
      </header>

      {/* Map Background */}
      <div className="absolute inset-0 z-0 opacity-80">
        <DeliveryMap 
          courierLocation={delivery.courierLocation} 
          destinationLocation={delivery.status === 'collecting' ? delivery.originLocation : delivery.destinationLocation} 
          routeGeometry={currentRouteGeometry || delivery.routeGeometry} 
        />
      </div>

      <main className="flex-1 pt-20 px-6 pb-32 z-10 space-y-6 overflow-y-auto no-scrollbar pointer-events-none">
        {/* Progress Bar */}
        <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 pointer-events-auto">
          <div className="flex justify-between items-center relative px-2">
            {/* Connecting Lines */}
            <div className="absolute top-[20px] left-10 right-10 h-[2px] bg-white/10 -translate-y-1/2" />
            <div className="absolute top-[20px] left-10 w-[calc(50%-40px)] h-[2px] bg-secondary-fixed -translate-y-1/2" />
            
            <div className="relative flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center shadow-[0_0_15px_rgba(195,244,0,0.3)]">
                <Briefcase className="w-5 h-5 text-on-secondary-fixed" />
              </div>
              <span className="text-[9px] font-bold text-secondary-fixed uppercase tracking-widest">Coleta</span>
            </div>
            
            <div className="relative flex flex-col items-center gap-2">
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", delivery.status === 'in-route' ? "bg-secondary-fixed shadow-[0_0_15px_rgba(195,244,0,0.3)]" : "bg-white/10")}>
                <Bike className={cn("w-5 h-5", delivery.status === 'in-route' ? "text-on-secondary-fixed" : "text-white/20")} />
              </div>
              <span className={cn("text-[9px] font-bold uppercase tracking-widest", delivery.status === 'in-route' ? "text-secondary-fixed" : "text-white/20")}>Em Rota</span>
            </div>
            
            <div className="relative flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-white/20" />
              </div>
              <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Entrega</span>
            </div>
          </div>
        </div>

        {/* Courier Info Card */}
        <div className="bg-surface-container-lowest rounded-[2.5rem] p-6 shadow-2xl space-y-6 pointer-events-auto border border-outline-variant">
          <div className="flex gap-4">
            <div className="w-20 h-20 rounded-3xl overflow-hidden bg-surface-container-low border border-outline-variant">
              <img src={ASSETS.PROFILE_PIC} alt="Courier" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-headline font-extrabold text-xl text-on-surface">{delivery.customerName || 'João Silva'}</h3>
                  <p className="text-xs text-on-surface-variant font-medium">ETA: <span className="font-bold text-secondary-fixed bg-surface-container-highest px-2 py-0.5 rounded-lg">{eta}</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Pedido</p>
                  <p className="font-headline font-extrabold text-xl text-on-surface">#{delivery.id?.slice(-4) || '8842'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1 bg-surface-container-highest text-secondary-fixed px-2 py-0.5 rounded-lg text-xs font-bold border border-outline-variant">
                  <span>★</span>
                  <span>4.9</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-secondary-fixed animate-pulse" />
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                    {delivery.status === 'collecting' ? 'Indo para coleta' : 'A caminho da entrega'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => onOpenChat && onOpenChat('Lojista')}
              className="flex items-center justify-center gap-3 py-4 bg-surface-container-high text-on-surface rounded-2xl font-bold active:scale-95 transition-transform border border-outline-variant">
              <MessageCircle className="w-5 h-5" />
              <span>Chat</span>
            </button>
            <a 
              href={`tel:${delivery.customerPhone}`}
              className="flex items-center justify-center gap-3 py-4 bg-surface-container-high text-on-surface rounded-2xl font-bold active:scale-95 transition-transform border border-outline-variant"
            >
              <Phone className="w-5 h-5" />
              <span>Ligar</span>
            </a>
            <button 
              onClick={() => {
                const loc = delivery.status === 'collecting' ? delivery.originLocation : delivery.destinationLocation;
                if (loc) {
                  window.open(`https://waze.com/ul?ll=${loc.lat},${loc.lng}&navigate=yes`, '_blank');
                } else {
                  const address = delivery.status === 'collecting' ? delivery.origin : delivery.destination;
                  window.open(`https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`, '_blank');
                }
              }}
              className="flex items-center justify-center gap-3 py-4 bg-surface-container-high text-on-surface rounded-2xl font-bold active:scale-95 transition-transform border border-outline-variant"
            >
              <Navigation className="w-5 h-5" />
              <span>Waze</span>
            </button>
            <button 
              onClick={() => {
                const loc = delivery.status === 'collecting' ? delivery.originLocation : delivery.destinationLocation;
                if (loc) {
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`, '_blank');
                } else {
                  const address = delivery.status === 'collecting' ? delivery.origin : delivery.destination;
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`, '_blank');
                }
              }}
              className="flex items-center justify-center gap-3 py-4 bg-surface-container-high text-on-surface rounded-2xl font-bold active:scale-95 transition-transform border border-outline-variant"
            >
              <Navigation className="w-5 h-5" />
              <span>Maps</span>
            </button>
            <button 
              onClick={handleUpdateStatus}
              disabled={isUpdating}
              className="col-span-2 flex items-center justify-center gap-3 py-4 bg-secondary-fixed text-on-secondary-fixed rounded-2xl font-bold active:scale-95 transition-transform shadow-lg shadow-secondary-fixed/20 disabled:opacity-50"
            >
              {isUpdating ? (
                <div className="w-5 h-5 border-2 border-on-secondary-fixed border-t-transparent rounded-full animate-spin" />
              ) : (
                delivery.status === 'collecting' ? 'Coletado' : 'Cheguei no Local'
              )}
            </button>
          </div>
        </div>

        {/* Destination Card */}
        <div className="bg-[#0f1c2c] rounded-3xl p-5 border border-white/10 flex items-center gap-4 pointer-events-auto">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
            <Navigation className="w-6 h-6 text-secondary-fixed" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Valor a Receber</p>
            <p className="font-headline font-extrabold text-lg text-secondary-fixed">R$ {delivery.price?.toFixed(2).replace('.', ',')}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Estimativa</p>
            <p className="font-headline font-extrabold text-lg text-white">{eta}</p>
          </div>
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 w-full h-[70.5px] bg-[#0f1c2c]/90 backdrop-blur-md border-t border-white/5 flex justify-around items-center px-2 pb-2 pt-2 z-50">
        <CourierNavItem icon={<HomeIcon className="w-5 h-5" />} label="Início" onClick={() => onNavigate('courier-available')} />
        <CourierNavItem icon={<Bike className="w-5 h-5" />} label="Entregas" active onClick={() => onNavigate('courier-tracking')} />
        <CourierNavItem icon={<TrendingUp className="w-5 h-5" />} label="Ganhos" onClick={() => onNavigate('courier-earnings')} />
        <CourierNavItem icon={<UserCircle className="w-5 h-5" />} label="Perfil" onClick={() => onNavigate('courier-profile')} />
      </nav>

      {/* Code Confirmation Modal - Removed as it's now in CourierConfirmationScreen */}
    </motion.div>
  );
}

function CourierEarningsScreen({ onGoToTracking, onLogout, onNavigate, onOpenNotifications, unreadCount }: { onGoToTracking: () => void, onLogout: () => void, onNavigate: (screen: Screen) => void, onOpenNotifications: () => void, unreadCount: number }) {
  const { user, profile } = useContext(AuthContext)!;
  const [earnings, setEarnings] = useState(0);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [todayDeliveries, setTodayDeliveries] = useState(0);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const handleRequestWithdrawal = () => setShowWithdrawModal(true);
  const confirmWithdrawal = () => {
    setShowWithdrawModal(false);
    // TODO: Implementar lógica real de saque
    alert('Saque solicitado com sucesso!');
  };

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'deliveries'),
      where('courierId', '==', user.uid),
      where('status', '==', 'delivered')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let total = 0;
      let todayTotal = 0;
      let todayCount = 0;
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

      snapshot.forEach((doc) => {
        const data = doc.data() as DeliveryData;
        const price = data.price || 0;
        total += price;
        
        if (data.createdAt) {
          const createdAt = (data.createdAt as any).toMillis ? (data.createdAt as any).toMillis() : Date.now();
          if (createdAt >= todayStart) {
            todayTotal += price;
            todayCount++;
          }
        }
      });

      setEarnings(total);
      setTodayEarnings(todayTotal);
      setTodayDeliveries(todayCount);
    });
    return () => unsubscribe();
  }, [user]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full w-full bg-[#0f1c2c] flex flex-col"
    >
      <header className="fixed top-0 w-full z-50 bg-[#0f1c2c]/80 backdrop-blur-xl flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-extrabold text-secondary-fixed tracking-tight font-headline italic">TaNaMao</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onOpenNotifications}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors relative"
          >
            <Bell className="w-6 h-6 text-white" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-secondary-fixed text-on-secondary-fixed text-[8px] font-black rounded-full flex items-center justify-center border-2 border-[#0f1c2c]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <div className="relative">
            <button 
              onClick={() => onNavigate('courier-profile')}
              className="w-10 h-10 rounded-full overflow-hidden border-2 border-secondary-fixed active:scale-90 transition-transform"
            >
              <img src={profile?.profilePic || ASSETS.PROFILE_PIC} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </button>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-secondary-fixed rounded-full border-2 border-[#0f1c2c] flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-on-secondary-fixed rounded-full" />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-24 px-6 pb-32 space-y-8 overflow-y-auto no-scrollbar">
        {earnings === 0 && todayEarnings === 0 ? (
          <EmptyState 
            icon={<TrendingUp />} 
            title="Sem Ganhos Ainda" 
            message="Realize sua primeira entrega hoje para começar a ver seus lucros aqui!" 
          />
        ) : (
          <>
            {/* Balance Card */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-[2.5rem] p-8 border border-white/10 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-48 h-48 bg-secondary-fixed/10 rounded-full blur-3xl -mr-24 -mt-24" />
              <p className="text-[10px] font-black text-secondary-fixed uppercase tracking-[0.3em] mb-3">Saldo Total Disponível</p>
              <h2 className="font-headline font-black text-5xl text-white tracking-tighter mb-10">R$ {earnings.toFixed(2).replace('.', ',')}</h2>
              
              <button onClick={handleRequestWithdrawal} className="w-full py-5 bg-secondary-fixed text-on-secondary-fixed rounded-2xl font-headline font-black text-lg flex items-center justify-center gap-3 active:scale-95 transition-transform shadow-[0_15px_40px_rgba(195,244,0,0.3)]">
                <ReceiptText className="w-6 h-6" />
                <span>Solicitar Saque via Pix</span>
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-[2rem] p-6 border border-white/10 flex flex-col gap-2">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Ganhos Hoje</p>
                <p className="font-headline font-black text-2xl text-white">R$ {todayEarnings.toFixed(2).replace('.', ',')}</p>
              </div>
              <div className="bg-white/5 rounded-[2rem] p-6 border border-white/10 flex flex-col gap-2">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Entregas</p>
                <p className="font-headline font-black text-2xl text-white">{todayDeliveries} Corridas</p>
              </div>
            </div>
          </>
        )}

        <button onClick={handleRequestWithdrawal} className="w-full py-4 bg-secondary-fixed text-on-secondary-fixed font-headline font-black text-lg rounded-2xl shadow-lg shadow-secondary-fixed/20 active:scale-[0.98] transition-all">
          Solicitar Saque
        </button>

        {/* History List */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-headline font-black text-2xl text-white">Últimas Corridas</h3>
            <button 
              onClick={() => onNavigate('activities')}
              className="text-secondary-fixed text-xs font-black uppercase tracking-widest"
            >
              Ver tudo
            </button>
          </div>

          <div className="space-y-4">
            <EarningsItem id="#8842" time="Hoje, 14:20" place="Restaurante Sabor" price="R$ 18,50" status="CONCLUÍDO" />
            <EarningsItem id="#8839" time="Hoje, 13:05" place="Burger King Central" price="R$ 12,20" status="CONCLUÍDO" />
            <EarningsItem id="#8835" time="Ontem, 20:45" place="Farmácia Preço" price="R$ 0,00" status="CANCELADO" isCancelled />
            <EarningsItem id="#8830" time="Ontem, 19:15" place="Pizza Express" price="R$ 25,90" status="CONCLUÍDO" />
          </div>
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 w-full h-[70.5px] bg-[#0f1c2c]/90 backdrop-blur-md border-t border-white/5 flex justify-around items-center px-2 pb-2 pt-2 z-50">
        <CourierNavItem icon={<HomeIcon className="w-5 h-5" />} label="Início" onClick={() => onNavigate('courier-available')} />
        <CourierNavItem icon={<Bike className="w-5 h-5" />} label="Entregas" onClick={() => onNavigate('courier-tracking')} />
        <CourierNavItem icon={<TrendingUp className="w-5 h-5" />} label="Ganhos" active onClick={() => onNavigate('courier-earnings')} />
        <CourierNavItem icon={<UserCircle className="w-5 h-5" />} label="Perfil" onClick={() => onNavigate('courier-profile')} />
      </nav>

      {showWithdrawModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0f1c2c]/80 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#1a2b3c] p-8 rounded-[2rem] border border-white/10 w-full max-w-sm space-y-6"
          >
            <h3 className="text-2xl font-black text-white font-headline">Confirmar Saque</h3>
            <p className="text-white/70">Deseja realmente solicitar o saque de <strong>R$ {earnings.toFixed(2).replace('.', ',')}</strong> via Pix?</p>
            <div className="flex gap-4">
              <button onClick={() => setShowWithdrawModal(false)} className="flex-1 py-3 rounded-xl bg-white/10 text-white font-bold">Cancelar</button>
              <button onClick={confirmWithdrawal} className="flex-1 py-3 rounded-xl bg-secondary-fixed text-on-secondary-fixed font-bold">Confirmar</button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

function CourierConfirmationScreen({ data, onBack, onFinish, isFinishing, onOpenChat }: { data: DeliveryData, onBack: () => void, onFinish: () => void, isFinishing?: boolean, onOpenChat?: (otherUserName: string) => void }) {
  const [enteredCode, setEnteredCode] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (enteredCode === (data.confirmationCode || '')) {
      setError('');
      onFinish();
    } else {
      setError('Código inválido. Solicite ao cliente.');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="h-full w-full bg-[#0f1c2c] flex flex-col"
    >
      <header className="fixed top-0 w-full z-50 bg-[#0f1c2c]/80 backdrop-blur-xl flex justify-between items-center px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 active:scale-90 transition-transform">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-lg font-black text-white font-headline">Confirmação</h1>
        </div>
        <h1 className="text-xl font-extrabold text-secondary-fixed tracking-tight font-headline italic">TaNaMao</h1>
      </header>

      <main className="flex-1 pt-24 px-8 pb-12 flex flex-col items-center text-center space-y-10 overflow-y-auto no-scrollbar">
        <div className="space-y-3">
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Pedido em andamento</p>
          <h2 className="font-headline font-black text-5xl text-white tracking-tight">Finalizar Entrega</h2>
        </div>

        {/* Info Card */}
        <div className="w-full bg-white/5 rounded-[3rem] p-8 border border-white/10 space-y-8 text-left shadow-2xl">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-secondary-fixed/10 flex items-center justify-center shadow-inner">
              <MapPin className="w-8 h-8 text-secondary-fixed" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-2">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Endereço de Entrega</p>
                <div className="flex items-center gap-1.5 bg-secondary-fixed/20 px-3 py-1 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary-fixed animate-pulse" />
                  <span className="text-[8px] font-black text-secondary-fixed uppercase tracking-widest">No Local</span>
                </div>
              </div>
              <p className="text-xl font-black text-white leading-tight mb-1">{data.destination || 'Av. Brigadeiro Faria Lima, 3477'}</p>
              <p className="text-xs font-bold text-white/40">Itaim Bibi, São Paulo - SP</p>
            </div>
          </div>

          <div className="h-px bg-white/10" />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Cliente</p>
              <p className="text-xl font-black text-white">{data.customerName || 'Ricardo Silveira'}</p>
            </div>
            <div className="flex gap-4">
              <button className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-white active:scale-90 transition-transform border border-white/10 shadow-lg">
                <MessageCircle className="w-6 h-6" />
              </button>
              <button className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-white active:scale-90 transition-transform border border-white/10 shadow-lg">
                <Phone className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Verification Section */}
        <div className="w-full space-y-8">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-secondary-fixed/10 flex items-center justify-center">
              <ShieldCheck className="w-10 h-10 text-secondary-fixed" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white font-headline">Código de Finalização</h3>
              <p className="text-sm font-bold text-white/40 max-w-[240px] mx-auto">Solicite o código de 4 dígitos ao cliente para finalizar a entrega.</p>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <input 
              type="text"
              maxLength={4}
              value={enteredCode}
              onChange={(e) => setEnteredCode(e.target.value.replace(/\D/g, ''))}
              className="w-48 h-16 text-center text-3xl font-black text-white bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-secondary-fixed transition-all tracking-[0.5em]"
              placeholder="...."
            />
          </div>
          {error && <p className="text-red-500 text-sm font-bold">{error}</p>}

          <button className="flex items-center justify-center gap-3 mx-auto text-secondary-fixed font-black uppercase tracking-widest text-xs active:scale-95 transition-transform">
            <Camera className="w-5 h-5" />
            <span>Anexar Foto (Opcional)</span>
          </button>
        </div>

        {/* Action Button */}
        <div className="w-full pt-4 space-y-6">
          <button 
            onClick={handleConfirm}
            disabled={isFinishing}
            className="w-full py-6 bg-secondary-fixed text-on-secondary-fixed rounded-3xl font-headline font-black text-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-[0_20px_50px_rgba(195,244,0,0.3)] disabled:opacity-50"
          >
            {isFinishing ? (
              <div className="w-6 h-6 border-2 border-on-secondary-fixed border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>FINALIZAR AGORA</span>
                <CheckCircle2 className="w-6 h-6" />
              </>
            )}
          </button>
          <button className="text-white/40 font-black uppercase tracking-widest text-[10px] hover:text-white transition-colors">Problemas com a entrega?</button>
        </div>
      </main>
    </motion.div>
  );
}

function EarningsItem({ id, time, place, price, status, isCancelled = false }: { id: string, time: string, place: string, price: string, status: string, isCancelled?: boolean }) {
  return (
    <div className="bg-white/5 rounded-[2rem] p-6 border border-white/10 flex items-center gap-4 group hover:bg-white/10 transition-all">
      <div className={cn(
        "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
        isCancelled ? "bg-red-500/10 text-red-500" : "bg-secondary-fixed/10 text-secondary-fixed"
      )}>
        {isCancelled ? <XCircle className="w-7 h-7" /> : <Bike className="w-7 h-7" />}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-black text-white text-base mb-0.5">Entrega {id}</h4>
        <p className="text-[10px] text-white/40 font-black uppercase tracking-widest truncate">{time} • {place}</p>
      </div>
      <div className="text-right">
        <p className="font-headline font-black text-xl text-white mb-1">{price}</p>
        <div className={cn(
          "inline-block px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-[0.2em]",
          isCancelled ? "bg-red-500/10 text-red-500" : "bg-secondary-fixed/10 text-secondary-fixed"
        )}>
          {status}
        </div>
      </div>
    </div>
  );
}


// --- UI Primitives ---

function CourierProfileScreen({ onLogout, onNavigate, onOpenNotifications, unreadCount }: { onLogout: () => void, onNavigate: (screen: Screen) => void, onOpenNotifications: () => void, unreadCount: number }) {
  const { user, profile } = useContext(AuthContext)!;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [todayDeliveries, setTodayDeliveries] = useState(0);

  const [notificationsEnabled, setNotificationsEnabled] = useState(
    "Notification" in window && Notification.permission === "granted"
  );

  const toggleNotifications = async () => {
    if (!("Notification" in window)) {
      alert("Seu navegador não suporta notificações push.");
      return;
    }
    if (!notificationsEnabled) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setNotificationsEnabled(true);
      } else {
        alert("Permissão para notificações foi negada pelo navegador.");
      }
    } else {
      setNotificationsEnabled(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'deliveries'),
      where('courierId', '==', user.uid),
      where('status', '==', 'delivered')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let todayTotal = 0;
      let todayCount = 0;
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

      snapshot.forEach((doc) => {
        const data = doc.data() as DeliveryData;
        const price = data.price || 0;
        
        if (data.createdAt) {
          const createdAt = (data.createdAt as any).toMillis ? (data.createdAt as any).toMillis() : Date.now();
          if (createdAt >= todayStart) {
            todayTotal += price;
            todayCount++;
          }
        }
      });

      setTodayEarnings(todayTotal);
      setTodayDeliveries(todayCount);
    });
    return () => unsubscribe();
  }, [user]);

  const handleProfilePicClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUpdating(true);
    try {
      // In a real app, we'd upload to Firebase Storage.
      // For this environment, we'll use a base64 string for simulation.
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        await updateDoc(doc(db, 'users', user.uid), {
          profilePic: base64String
        });
        setIsUpdating(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error updating profile pic:", error);
      setIsUpdating(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full w-full bg-[#0f1c2c] flex flex-col"
    >
      <header className="fixed top-0 w-full z-50 bg-[#0f1c2c]/80 backdrop-blur-xl flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('courier-available')} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 active:scale-90 transition-transform">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-xl font-extrabold text-secondary-fixed tracking-tight font-headline italic">TaNaMao</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onOpenNotifications}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors relative"
          >
            <Bell className="w-6 h-6 text-white" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-secondary-fixed text-on-secondary-fixed text-[8px] font-black rounded-full flex items-center justify-center border-2 border-[#0f1c2c]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-secondary-fixed">
            <img src={profile?.profilePic || ASSETS.PROFILE_PIC} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
        </div>
      </header>

      <main className="flex-1 pt-24 px-6 pb-32 space-y-8 overflow-y-auto no-scrollbar">
        {/* Profile Header */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-white/10 shadow-2xl bg-[#0f1c2c]">
              <img 
                src={profile?.profilePic || ASSETS.PROFILE_PIC} 
                alt="Profile" 
                className={cn("w-full h-full object-cover", isUpdating && "opacity-50")} 
                referrerPolicy="no-referrer" 
              />
              {isUpdating && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-secondary-fixed border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <button 
              onClick={handleProfilePicClick}
              className="absolute -bottom-2 -right-2 w-10 h-10 bg-secondary-fixed text-[#0f1c2c] rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-transform"
            >
              <Camera className="w-5 h-5" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
          </div>
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-white font-headline">{profile?.name || 'Ricardo Almeida'}</h2>
            <div className="flex items-center justify-center gap-2">
              <div className="bg-secondary-fixed/20 text-secondary-fixed px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <Zap className="w-3 h-3 fill-current" />
                <span>Motoboy Premium</span>
              </div>
              <div className="flex items-center gap-1 text-white/60 font-black text-xs">
                <span className="text-secondary-fixed">★</span>
                <span>4.9</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-3xl p-6 shadow-sm border border-white/10 flex flex-col gap-1">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Entregas Hoje</p>
            <div className="flex items-baseline gap-1">
              <p className="text-2xl font-black text-white">{todayDeliveries}</p>
            </div>
          </div>
          <div className="bg-white/5 rounded-3xl p-6 shadow-sm border border-white/10 flex flex-col gap-1">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Ganhos Diários</p>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-secondary-fixed">R$</span>
              <p className="text-2xl font-black text-white">{todayEarnings.toFixed(2).replace('.', ',')}</p>
            </div>
          </div>
        </div>

        {/* Vehicle Info */}
        <div className="bg-white/5 rounded-[2.5rem] p-6 border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-secondary-fixed/10 flex items-center justify-center">
              <Bike className="w-6 h-6 text-secondary-fixed" />
            </div>
            <div>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Veículo</p>
              <p className="text-white font-bold">{profile?.vehicleType || 'Moto (CG 160)'}</p>
            </div>
          </div>
          <button className="text-secondary-fixed text-xs font-black uppercase tracking-widest">Alterar</button>
        </div>

        {/* Menu Items */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">Configurações</h3>
          <div className="bg-white/5 rounded-[2.5rem] p-4 shadow-sm border border-white/10 space-y-1">
            <div className="flex items-center justify-between p-4 rounded-2xl transition-colors active:bg-white/5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5">
                  <Bell className="w-5 h-5 text-white/80" />
                </div>
                <span className="font-black text-sm uppercase tracking-widest text-white">Notificações Push</span>
              </div>
              <button 
                onClick={toggleNotifications}
                className={cn(
                  "w-12 h-6 rounded-full transition-colors relative",
                  notificationsEnabled ? "bg-secondary-fixed" : "bg-white/10"
                )}
              >
                <div className={cn(
                  "w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform",
                  notificationsEnabled ? "translate-x-6" : "translate-x-0.5"
                )} />
              </button>
            </div>
            <ProfileMenuItem dark icon={<User className="w-5 h-5 text-white/80" />} label="Editar Perfil" />
            <ProfileMenuItem dark icon={<Lock className="w-5 h-5 text-white/80" />} label="Segurança" />
            <ProfileMenuItem dark icon={<HelpCircle className="w-5 h-5 text-white/80" />} label="Central de Ajuda" />
            <ProfileMenuItem dark icon={<Briefcase className="w-5 h-5 text-white/80" />} label="Termos de Uso" />
            <ProfileMenuItem dark icon={<LogOut className="w-5 h-5" />} label="Sair da conta" onClick={onLogout} danger />
          </div>
        </div>

        <div className="text-center pb-8">
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest opacity-40">Tanamao V2.4.0 • 2024</p>
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 w-full h-[70.5px] bg-[#0f1c2c]/90 backdrop-blur-md border-t border-white/5 flex justify-around items-center px-2 pb-2 pt-2 z-50">
        <CourierNavItem icon={<HomeIcon className="w-5 h-5" />} label="Início" onClick={() => onNavigate('courier-available')} />
        <CourierNavItem icon={<Bike className="w-5 h-5" />} label="Entregas" onClick={() => onNavigate('courier-tracking')} />
        <CourierNavItem icon={<TrendingUp className="w-5 h-5" />} label="Ganhos" onClick={() => onNavigate('courier-earnings')} />
        <CourierNavItem icon={<UserCircle className="w-5 h-5" />} label="Perfil" active onClick={() => onNavigate('courier-profile')} />
      </nav>
    </motion.div>
  );
}

function ProfileMenuItem({ icon, label, onClick, danger = false, dark = false }: { icon: ReactNode, label: string, onClick?: () => void, danger?: boolean, dark?: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between p-4 rounded-2xl transition-colors",
        dark ? "active:bg-white/5" : "active:bg-black/5",
        danger ? "text-red-500" : (dark ? "text-white" : "text-on-surface")
      )}
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          danger ? "bg-red-500/10" : (dark ? "bg-white/5" : "bg-surface-container-high")
        )}>
          {icon}
        </div>
        <span className="font-black text-sm uppercase tracking-widest">{label}</span>
      </div>
      <ChevronRight className={cn("w-5 h-5", dark ? "opacity-40 text-white" : "opacity-20")} />
    </button>
  );
}

function QuickChip({ icon, label, onClick }: { icon: ReactNode, label: string, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 bg-surface-container-low rounded-3xl border border-outline-variant active:scale-95 transition-all shadow-sm"
    >
      <span className="text-on-surface-variant">{icon}</span>
      <span className="text-sm font-semibold text-on-surface">{label}</span>
    </button>
  );
}

function NavItem({ icon, label, active = false, onClick }: { icon: ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <motion.button 
      whileTap={{ scale: 0.9 }}
      onClick={onClick} 
      className={cn(
        "flex flex-col items-center justify-center gap-1 tap-highlight-none transition-all",
        active ? 'text-secondary-fixed' : 'text-white/40'
      )}
    >
      <motion.div 
        animate={active ? { scale: [1, 1.1, 1] } : {}}
        className={cn(
          "p-1.5 rounded-xl transition-all",
          active ? "bg-secondary-fixed/10 shadow-[0_0_10px_rgba(195,244,0,0.1)]" : "opacity-60"
        )}
      >
        {icon}
      </motion.div>
      <span className="text-[9px] font-black tracking-wider uppercase">{label}</span>
      {active && (
        <motion.div 
          layoutId="merchant-nav-active" 
          initial={{ width: 0 }}
          animate={{ width: 4 }}
          className="h-1 bg-secondary-fixed rounded-full mt-0.5" 
        />
      )}
    </motion.button>
  );
}

function EmptyState({ icon, title, message }: { icon: ReactNode, title: string, message: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center text-center p-12 space-y-4"
    >
      <div className="w-20 h-20 rounded-[2rem] bg-white/5 flex items-center justify-center text-white/20 shadow-inner border border-white/5">
        {cloneElement(icon as any, { className: "w-10 h-10" })}
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-black text-white font-headline tracking-tight">{title}</h3>
        <p className="text-xs font-bold text-white/40 max-w-[200px] leading-relaxed">{message}</p>
      </div>
    </motion.div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse bg-white/5 rounded-xl", className)} />
  );
}

function InputField({ 
  label, 
  icon, 
  placeholder, 
  type = "text", 
  value, 
  onChange 
}: { 
  label: string, 
  icon: ReactNode, 
  placeholder: string, 
  type?: string,
  value?: string,
  onChange?: (val: string) => void
}) {
  return (
    <div className="space-y-2">
      <label className="block text-[10px] uppercase tracking-widest font-black text-on-surface-variant ml-1">{label}</label>
      <div className="flex items-center bg-surface-container-low rounded-2xl px-4 py-4 border border-outline-variant focus-within:ring-2 ring-secondary-fixed transition-all shadow-sm">
        <span className="text-on-surface-variant mr-3">{icon}</span>
        <input 
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="bg-transparent border-none p-0 w-full focus:ring-0 text-on-surface font-bold placeholder:text-outline-variant/60" 
          placeholder={placeholder} 
        />
      </div>
    </div>
  );
}
