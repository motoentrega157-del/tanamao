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

export default function MerchantProfileScreen({ onLogout, onNavigate, onOpenNotifications, unreadCount }: { onLogout: () => void, onNavigate: (screen: Screen) => void, onOpenNotifications: () => void, unreadCount: number }) {
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