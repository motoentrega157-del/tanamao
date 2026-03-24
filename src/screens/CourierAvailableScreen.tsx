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
import { auth, db, requestNotificationPermission } from '../firebase';
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
import { createPagBankOrder, type PagBankOrderResponse } from '../services/pagbank';
import { DeliveryData, UserProfile, type Notification, PricingSettings, FirestoreErrorInfo, HomeScreenProps, NewRideScreenProps, DetailsScreenProps, TrackingScreenProps, CourierTrackingScreenProps, Screen, UserMode } from "../types";
import { DeliveryData, UserProfile, type Notification, PricingSettings, FirestoreErrorInfo, HomeScreenProps, NewRideScreenProps, DetailsScreenProps, TrackingScreenProps, CourierTrackingScreenProps, Screen, UserMode } from '../types';
import { cn, handleFirestoreError, AdminErrorBoundary, Modal, AdminNavItem, AdminStatCard, MobileAdminNavItem, NotificationDrawer, PlaceholderScreen, ChatModal, RatingModal, MapUpdater, CourierNavItem, DeliveryMap, EarningsItem, ProfileMenuItem, QuickChip, NavItem, EmptyState, Skeleton, InputField, ASSETS, AuthContext, OperationType } from '../App';

export default function CourierAvailableScreen({ onAccept, onLogout, onNavigate, pricingSettings, onOpenNotifications, unreadCount }: { onAccept: (delivery: DeliveryData) => void, onLogout: () => void, onNavigate: (screen: Screen) => void, pricingSettings: PricingSettings, onOpenNotifications: () => void, unreadCount: number }) {
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