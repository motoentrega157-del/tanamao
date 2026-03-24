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

export default function SplashScreen() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full w-full flex flex-col items-center justify-center bg-[#0f1c2c] relative overflow-hidden"
    >
      {/* Background Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] rounded-full bg-secondary-fixed/5 blur-[100px]" />
      <div className="absolute bottom-[-5%] left-[-5%] w-[400px] h-[400px] rounded-full bg-white/5 blur-[120px]" />

      <div className="z-10 flex flex-col items-center gap-8">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="w-24 h-24 rounded-full bg-secondary-fixed flex items-center justify-center shadow-[0_20px_50px_rgba(195,244,0,0.15)]"
        >
          <Bike className="text-on-secondary-fixed w-12 h-12" />
        </motion.div>

        <div className="text-center">
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="font-headline font-extrabold text-5xl text-white tracking-tighter mb-2"
          >
            TaNaMao
          </motion.h1>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: 48 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="h-1 bg-secondary-fixed mx-auto rounded-full" 
          />
        </div>
      </div>

      <div className="absolute bottom-24 z-10 w-full px-8 flex flex-col items-center gap-8">
        <div className="text-center">
          <p className="font-headline font-semibold text-xl text-white/90 mb-1">
            Suas entregas na mão.
          </p>
          <p className="font-body text-xs text-white/40 tracking-widest uppercase font-medium">
            Eficiência em cada movimento
          </p>
        </div>
        
        <div className="w-48 h-[2px] bg-white/10 rounded-full overflow-hidden">
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: '0%' }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="h-full bg-secondary-fixed w-full rounded-full" 
          />
        </div>
      </div>

      <footer className="absolute bottom-8 w-full text-center px-6">
        <p className="font-body text-[0.6875rem] text-white/20 tracking-[0.1em] uppercase">
          Powered by Kinetic Precision
        </p>
      </footer>
    </motion.div>
  );
}