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

export default function DetailsScreen({ 
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