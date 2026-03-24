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

export default function RoleSelectionScreen({ onSelectRole, onBack }: { onSelectRole: (role: UserMode) => void, onBack: () => void }) {
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