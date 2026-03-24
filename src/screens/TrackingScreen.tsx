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

export default function TrackingScreen({ data, onFinish, onCancel, showToast, onOpenChat }: TrackingScreenProps) {
  const [eta, setEta] = useState<string>('Calculando...');
  const [delivery, setDelivery] = useState<DeliveryData>(data);
  const [route, setRoute] = useState<any>(data.routeGeometry);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancel = async () => {
    try {
      await updateDoc(doc(db, 'deliveries', delivery.id!), {
        status: 'cancelled',
        cancelledAt: serverTimestamp()
      });
      showToast('Entrega cancelada com sucesso.', 'success');
      if (onCancel) {
        onCancel();
      } else {
        onFinish();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'deliveries');
      showToast('Erro ao cancelar entrega.', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  useEffect(() => {
    if (!data.id) return;
    const unsubscribe = onSnapshot(doc(db, 'deliveries', data.id), (doc) => {
      if (doc.exists()) {
        setDelivery({ ...doc.data(), id: doc.id } as DeliveryData);
      }
    });
    return () => unsubscribe();
  }, [data.id]);

  useEffect(() => {
    const fetchRoute = async () => {
      if (delivery.courierLocation && delivery.destinationLocation) {
        try {
          const response = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${delivery.courierLocation.lng},${delivery.courierLocation.lat};${delivery.destinationLocation.lng},${delivery.destinationLocation.lat}?overview=full&geometries=geojson`
          );
          const data = await response.json();
          if (data.routes && data.routes.length > 0) {
            setRoute(data.routes[0].geometry);
          }
        } catch (error) {
          console.error("Error fetching route:", error);
        }
      }
    };
    fetchRoute();
  }, [delivery.courierLocation, delivery.destinationLocation]);

  useEffect(() => {
    if (delivery.courierLocation && delivery.destinationLocation) {
      const dist = Math.sqrt(
        Math.pow(delivery.courierLocation.lat - delivery.destinationLocation.lat, 2) + 
        Math.pow(delivery.courierLocation.lng - delivery.destinationLocation.lng, 2)
      );
      const distKm = dist * 111;
      const timeHours = distKm / 30;
      const timeMins = Math.max(1, Math.round(timeHours * 60));
      setEta(`${timeMins} min`);
    } else {
      setEta('15 min');
    }
  }, [delivery.courierLocation, delivery.destinationLocation]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full w-full relative flex flex-col"
    >
      <div className="absolute inset-0 z-0 opacity-80">
        <DeliveryMap courierLocation={delivery.courierLocation} destinationLocation={delivery.destinationLocation} routeGeometry={route} />
      </div>

      {delivery && delivery.id && (
        <div className="absolute top-0 w-full p-6 z-10 pointer-events-none">
          <div className="bg-surface-container-low/90 backdrop-blur-md p-4 rounded-3xl shadow-xl border border-outline-variant flex items-center gap-4 pointer-events-auto">
            <div className="w-12 h-12 rounded-full bg-secondary-fixed flex items-center justify-center">
              <Bike className="w-6 h-6 text-on-secondary-fixed" />
            </div>
            <div className="flex-1">
              <h3 className="font-headline font-bold text-on-surface">Motoboy a caminho</h3>
              <p className="text-xs text-on-surface-variant">Chegada em aproximadamente {eta}</p>
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-0 w-full p-6 z-10 pointer-events-none">
        <div className="bg-surface-container-lowest rounded-[2.5rem] p-8 shadow-2xl border border-outline-variant space-y-6 pointer-events-auto">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="font-headline font-extrabold text-2xl text-on-surface">Entrega em curso</h2>
              <p className="text-on-surface-variant text-sm">Para: {delivery.customerName || 'João Silva'}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="bg-secondary-fixed/20 text-secondary-fixed px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                {delivery.status === 'collecting' ? 'Indo Coletar' : 'Em Rota'}
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Valor Cobrado</p>
                <p className="font-headline font-black text-lg text-on-surface">R$ {delivery.price?.toFixed(2).replace('.', ',')}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center">
                <MapPin className="w-5 h-5 text-on-surface-variant" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Destino</p>
                <p className="text-sm font-semibold text-on-surface truncate">{delivery.destination || 'Av. Paulista, 1200 - Ap 42'}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Distância</p>
                <p className="text-sm font-semibold text-on-surface">{delivery.distance || 3} km</p>
              </div>
            </div>
            
            {delivery.confirmationCode && (
              <div className="flex items-center gap-4 p-4 bg-secondary-fixed/10 rounded-2xl border border-secondary-fixed/20">
                <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center">
                  <Package className="w-5 h-5 text-on-secondary-fixed" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-secondary-fixed">Código de Entrega</p>
                  <p className="text-xl font-bold text-on-surface tracking-widest">{delivery.confirmationCode}</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => onOpenChat && onOpenChat('Motoboy')}
              className="flex items-center justify-center gap-3 py-4 bg-surface-container-high text-on-surface rounded-2xl font-bold active:scale-95 transition-transform border border-outline-variant"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Chat</span>
            </button>
            <button 
              onClick={onFinish}
              className="flex items-center justify-center gap-3 py-4 bg-primary-container text-white font-headline font-bold rounded-2xl active:scale-[0.98] transition-all"
            >
              {delivery.status === 'delivered' ? 'Voltar para o Início' : 'Acompanhando...'}
            </button>
          </div>

          {delivery.status === 'collecting' && (
            <button 
              onClick={() => setIsCancelling(true)}
              className="w-full py-4 bg-red-500/10 text-red-500 font-bold rounded-2xl border border-red-500/20 active:scale-[0.98] transition-all mt-2"
            >
              Cancelar Entrega
            </button>
          )}
        </div>
      </div>

      <Modal 
        isOpen={isCancelling} 
        onClose={() => setIsCancelling(false)} 
        title="Cancelar Entrega"
      >
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center py-4">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8" />
            </div>
            <p className="text-center text-on-surface-variant">
              Tem certeza que deseja cancelar esta entrega? Esta ação não pode ser desfeita.
            </p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setIsCancelling(false)}
              className="flex-1 py-4 bg-surface-container-highest text-on-surface font-bold rounded-xl active:scale-95 transition-all"
            >
              Voltar
            </button>
            <button 
              onClick={handleCancel}
              className="flex-1 py-4 bg-red-500 text-white font-bold rounded-xl active:scale-95 transition-all shadow-lg shadow-red-500/20"
            >
              Sim, Cancelar
            </button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}