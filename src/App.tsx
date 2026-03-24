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
import { DeliveryData, UserProfile, type Notification, PricingSettings, FirestoreErrorInfo, HomeScreenProps, NewRideScreenProps, DetailsScreenProps, TrackingScreenProps, CourierTrackingScreenProps, Screen, UserMode } from "./types";

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

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Constants & Assets ---
export const ASSETS = {
  PROFILE_PIC: "https://lh3.googleusercontent.com/aida-public/AB6AXuD-Ws0cTVBpqdXPnzpDKfIIu4xMaQQ063kYw4JeT5pvj1KxwEKBM6HtzGWVeYvmKWcmImoR1SVCbAAmgJyswm_NuYpz_yzZVf0PxKAmK882_sJi-9gXGxvIl0iM-Ks7oSP5gTyy1zftQmgQNjisOIKKEff-ZN1Tty26B0elydF-mj6C3RI6Yy-GBZcmB71jYnPRgYlYUxQHyyFZKNwaWDmguYGZ_iv4ZzDWPd_KeK4CmfyIgaNeGv3TDbKHQkhaJRViFHXhT-AT7Vw",
  MAP_HOME: "https://lh3.googleusercontent.com/aida-public/AB6AXuDNxnfwKKnI4g4GlXBamBvoeGTKfL73jW3lfePd_uBObNHan92aIIqb2CsEizDmzzG58C1sxtPU3BJlrQqTHOoN4fDrALqpiN0O3jxZIXX35LulAXzM4L6JzBslWNMsZyFe-wKhc6q1XW4f0b-LIe6FxJc4YsY_sPzUmf0SBdSeoDewe1cIe6l6xOExRlAoT91TVUpyWAAENkB0fgQ82CTmVf9fy2Xxiq0EOCoFXiA9qm9lqFk7jQ7dasVp4TST6E2IEW1hf99r3kc",
  MAP_DETAILS: "https://lh3.googleusercontent.com/aida-public/AB6AXuCh93RBJVg5Vq3i-rBrpCmNzE9Zybi8-IbDAnv12LKCoPrb_h9yuWeIfzZMZzgrPAKHBxrcLwIRdXJLjP9fh_DNMGeq2--SKhmrrVgdn3_csSfNnwoO3Iv40oVX0u-LZxWs6NY1_K4dkitB0YvdsGElRxEPHS4BwpClwnBWOUY2cIbYqKeOVgF07Los4bW2Iz7Ch_tmL7m8d8Wpo-2mB-_N9-exmJ-6BMp_KP9P42O_FKIIhulgTzGB4vAJRlySgxHpMfMiAmMtwdI"
};
// --- Error Handling ---
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
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
export const AuthContext = createContext<{
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

export function AdminErrorBoundary({ children }: { children: ReactNode }) {
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

export function Modal({ isOpen, onClose, title, children, dark = false }: { isOpen: boolean, onClose: () => void, title: string, children: ReactNode, dark?: boolean }) {
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

export function AdminNavItem({ icon, label, active, onClick }: { icon: ReactNode, label: string, active: boolean, onClick: () => void }) {
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

export function AdminStatCard({ icon, label, value, color, trend }: { icon: ReactNode, label: string, value: string, color: string, trend?: string }) {
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

export function MobileAdminNavItem({ icon, label, active, onClick }: { icon: ReactNode, label: string, active: boolean, onClick: () => void }) {
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
export function NotificationDrawer({ isOpen, onClose, notifications, onMarkAsRead, onClearAll }: { isOpen: boolean, onClose: () => void, notifications: Notification[], onMarkAsRead: (id: string) => void, onClearAll: () => void }) {
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

export function PlaceholderScreen({ title, onBack, onLogout, onNavigate }: { title: string, onBack: () => void, onLogout: () => void, onNavigate: (screen: Screen) => void }) {
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

export function ChatModal({ deliveryId, onClose, currentUserRole, currentUserId, otherUserName }: { deliveryId: string, onClose: () => void, currentUserRole: 'merchant' | 'courier', currentUserId: string, otherUserName: string }) {
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

export function RatingModal({ deliveryId, targetRole, targetName, onClose, onSubmit }: { deliveryId: string, targetRole: 'merchant' | 'courier', targetName: string, onClose: () => void, onSubmit: (rating: number, comment: string) => void }) {
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

export function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 15);
  }, [center, map]);
  return null;
}

export function CourierNavItem({ icon, label, active, onClick }: { icon: ReactNode, label: string, active?: boolean, onClick?: () => void }) {
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

export function DeliveryMap({ courierLocation, destinationLocation, routeGeometry }: { courierLocation?: { lat: number, lng: number }, destinationLocation?: { lat: number, lng: number }, routeGeometry?: any }) {
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

export function EarningsItem({ id, time, place, price, status, isCancelled = false }: { id: string, time: string, place: string, price: string, status: string, isCancelled?: boolean }) {
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

export function ProfileMenuItem({ icon, label, onClick, danger = false, dark = false }: { icon: ReactNode, label: string, onClick?: () => void, danger?: boolean, dark?: boolean }) {
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

export function QuickChip({ icon, label, onClick }: { icon: ReactNode, label: string, onClick?: () => void }) {
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

export function NavItem({ icon, label, active = false, onClick }: { icon: ReactNode, label: string, active?: boolean, onClick?: () => void }) {
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

export function EmptyState({ icon, title, message }: { icon: ReactNode, title: string, message: string }) {
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

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse bg-white/5 rounded-xl", className)} />
  );
}

export function InputField({ 
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
