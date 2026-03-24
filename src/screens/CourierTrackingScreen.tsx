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

export default function CourierTrackingScreen({ 
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