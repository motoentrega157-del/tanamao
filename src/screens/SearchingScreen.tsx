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

export default function SearchingScreen({ deliveryId, onFound, onCancel, showToast, onNavigate }: { deliveryId?: string, onFound: () => void, onCancel: () => void, showToast: (msg: string, type?: 'success' | 'error' | 'info') => void, onNavigate: (screen: Screen) => void }) {
  const { user } = useContext(AuthContext)!;
  const [searchingStatus, setSearchingStatus] = useState('Buscando motoboys online...');
  const [deliveryData, setDeliveryData] = useState<DeliveryData | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancel = async () => {
    if (!deliveryId) return;
    try {
      await updateDoc(doc(db, 'deliveries', deliveryId), {
        status: 'cancelled',
        cancelledAt: serverTimestamp()
      });
      showToast('Entrega cancelada com sucesso.', 'success');
      onCancel();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'deliveries');
      showToast('Erro ao cancelar entrega.', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  useEffect(() => {
    if (!deliveryId || !user) return;

    const deliveryRef = doc(db, 'deliveries', deliveryId);
    
    const unsubscribe = onSnapshot(deliveryRef, async (snapshot) => {
      if (!snapshot.exists()) return;
      
      const data = { id: snapshot.id, ...snapshot.data() } as DeliveryData;
      setDeliveryData(data);
      
      // If accepted, move to tracking
      if (data.status === 'collecting' || data.status === 'in-route') {
        onFound();
        return;
      }

      // Dispatch logic
      const now = Date.now();
      const needsNewOffer = !data.offeredTo || (data.offerExpiresAt && data.offerExpiresAt < now);

      if (data.status === 'searching' && needsNewOffer) {
        try {
          // If the previous offer expired, add to rejectedBy
          const rejectedBy = data.rejectedBy || [];
          if (data.offeredTo && data.offerExpiresAt && data.offerExpiresAt < now) {
            if (!rejectedBy.includes(data.offeredTo)) {
              rejectedBy.push(data.offeredTo);
            }
          }

          // Find online couriers
          const fiveMinutesAgo = new Date(now - 300000);
          
          // Try to find couriers with isOnline == true first
          let couriersQuery = query(
            collection(db, 'users'),
            where('role', '==', 'courier'),
            where('isOnline', '==', true),
            where('lastActive', '>=', Timestamp.fromDate(fiveMinutesAgo))
          );
          
          let couriersSnap = await getDocs(couriersQuery);
          
          // If no online couriers found, try any courier active recently
          if (couriersSnap.empty) {
            couriersQuery = query(
              collection(db, 'users'),
              where('role', '==', 'courier'),
              where('lastActive', '>=', Timestamp.fromDate(fiveMinutesAgo))
            );
            couriersSnap = await getDocs(couriersQuery);
          }
          
          const onlineCouriers = couriersSnap.docs
            .map(d => ({ id: d.id, ...d.data() } as { id: string, name?: string }))
            .filter(c => c.id !== user.uid && !rejectedBy.includes(c.id));

          if (onlineCouriers.length > 0) {
            // Pick the first available one
            const targetCourier = onlineCouriers[0];
            setSearchingStatus(`Chamando ${targetCourier.name || 'Motoboy'}...`);
            
            await updateDoc(deliveryRef, {
              offeredTo: targetCourier.id,
              offerExpiresAt: now + 30000, // 30 seconds to accept
              rejectedBy: rejectedBy
            });
          } else {
            setSearchingStatus('Nenhum motoboy disponível no momento. Tentando novamente...');
            // Reset offeredTo to try again later if someone comes online
            if (data.offeredTo || rejectedBy.length > (data.rejectedBy?.length || 0)) {
              await updateDoc(deliveryRef, {
                offeredTo: null,
                offerExpiresAt: null,
                rejectedBy: rejectedBy
              });
            }
          }
        } catch (error) {
          console.error("Error in dispatch logic:", error);
        }
      }
    });

    return () => unsubscribe();
  }, [deliveryId, user]);

  const simulateCourier = async () => {
    if (!deliveryId) return;
    try {
      // Try to find a real online courier first
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'courier'),
        where('isOnline', '==', true)
      );
      const snap = await getDocs(q);
      const onlineCouriers = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as { id: string, name?: string }))
        .filter(c => c.id !== user?.uid);

      if (onlineCouriers.length > 0) {
        // Force offer to the first online courier
        const target = onlineCouriers[0];
        await updateDoc(doc(db, 'deliveries', deliveryId), {
          offeredTo: target.id,
          offerExpiresAt: Date.now() + 30000,
          lastSimulation: serverTimestamp() // Trigger snapshot
        });
        setSearchingStatus(`Simulação: Chamando ${target.name || 'Motoboy Online'}...`);
      } else {
        // Create mock if none online
        const mockId = 'mock-courier-' + Math.floor(Math.random() * 1000);
        await setDoc(doc(db, 'users', mockId), {
          uid: mockId,
          name: 'Motoboy Simulado ' + mockId.slice(-3),
          email: `mock${mockId.slice(-3)}@tanamao.com`,
          role: 'courier',
          isOnline: true,
          lastActive: serverTimestamp()
        });
        setSearchingStatus('Motoboy simulado criado! Aguardando despacho...');
      }
    } catch (error) {
      console.error("Error simulating courier:", error);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full w-full flex flex-col items-center justify-center bg-[#0f1c2c] p-8 text-center"
    >
      <div className="relative">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute inset-0 bg-secondary-fixed rounded-full blur-2xl"
        />
        <div className="relative w-32 h-32 rounded-full bg-secondary-fixed flex items-center justify-center shadow-2xl">
          <Bike className="w-16 h-16 text-on-secondary-fixed" />
        </div>
      </div>
      
      <div className="mt-12 space-y-4">
        <h2 className="font-headline font-extrabold text-3xl text-white">Procurando Motoboy...</h2>
        <p className="text-white/60 max-w-xs mx-auto">{searchingStatus}</p>
        
        {deliveryId && (
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 mt-4">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Código de Entrega (Passe ao Motoboy)</p>
            <p className="text-3xl font-black text-secondary-fixed tracking-[0.5em]">
              {deliveryData?.confirmationCode || '....'}
            </p>
          </div>
        )}
      </div>

      <div className="mt-12 w-full max-w-xs h-1 bg-white/10 rounded-full overflow-hidden">
        <motion.div 
          animate={{ x: ['-100%', '100%'] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="w-1/2 h-full bg-secondary-fixed rounded-full"
        />
      </div>

      <button 
        onClick={simulateCourier}
        className="mt-12 px-6 py-3 bg-white/5 hover:bg-white/10 text-white/40 text-xs font-black uppercase tracking-widest rounded-full transition-all border border-white/10 active:scale-95"
      >
        Simular Motoboy Online
      </button>

      <button 
        onClick={() => setIsCancelling(true)}
        className="mt-4 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-black uppercase tracking-widest rounded-full transition-all border border-red-500/20 active:scale-95"
      >
        Cancelar Entrega
      </button>

      <Modal 
        isOpen={isCancelling} 
        onClose={() => setIsCancelling(false)} 
        title="Cancelar Entrega"
        dark={true}
      >
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center py-4">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8" />
            </div>
            <p className="text-center text-white/60">
              Tem certeza que deseja cancelar esta entrega? Esta ação não pode ser desfeita.
            </p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setIsCancelling(false)}
              className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all"
            >
              Voltar
            </button>
            <button 
              onClick={handleCancel}
              className="flex-1 py-4 bg-red-500 text-white font-bold rounded-2xl shadow-lg shadow-red-500/20 active:scale-95 transition-all"
            >
              Sim, Cancelar
            </button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}