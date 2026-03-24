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

export default function CourierEarningsScreen({ onGoToTracking, onLogout, onNavigate, onOpenNotifications, unreadCount }: { onGoToTracking: () => void, onLogout: () => void, onNavigate: (screen: Screen) => void, onOpenNotifications: () => void, unreadCount: number }) {
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