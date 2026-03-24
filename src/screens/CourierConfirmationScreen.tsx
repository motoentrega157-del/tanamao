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

export default function CourierConfirmationScreen({ data, onBack, onFinish, isFinishing, onOpenChat }: { data: DeliveryData, onBack: () => void, onFinish: () => void, isFinishing?: boolean, onOpenChat?: (otherUserName: string) => void }) {
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