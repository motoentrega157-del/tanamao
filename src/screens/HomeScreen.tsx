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

export default function HomeScreen({ 
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