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

export default function PaymentsScreen({ onLogout, onNavigate, onOpenNotifications, unreadCount }: { onLogout: () => void, onNavigate: (screen: Screen) => void, onOpenNotifications: () => void, unreadCount: number }) {
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