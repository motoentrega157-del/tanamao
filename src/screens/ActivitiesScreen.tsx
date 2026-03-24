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

export default function ActivitiesScreen({ onNavigate, onLogout, onOpenNotifications, unreadCount, showToast }: { onNavigate: (screen: Screen) => void, onLogout: () => void, onOpenNotifications: () => void, unreadCount: number, showToast: (msg: string, type?: 'success' | 'error' | 'info') => void }) {
  const { user, profile } = useContext(AuthContext)!;
  const [activities, setActivities] = useState<DeliveryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'status'>('date');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const isCourier = profile?.role === 'courier';

  const handleCancel = async () => {
    if (!cancellingId) return;
    try {
      await updateDoc(doc(db, 'deliveries', cancellingId), {
        status: 'cancelled',
        cancelledAt: serverTimestamp()
      });
      showToast('Entrega cancelada com sucesso.', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'deliveries');
      showToast('Erro ao cancelar entrega.', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  useEffect(() => {
    if (!user) return;

    const field = isCourier ? 'courierId' : 'merchantId';
    const q = query(
      collection(db, 'deliveries'),
      where(field, '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as DeliveryData));
      setActivities(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'deliveries');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, profile, isCourier]);

  const filteredAndSortedActivities = useMemo(() => {
    let result = [...activities];

    if (filterStatus !== 'all') {
      result = result.filter(a => a.status === filterStatus);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(a => 
        a.customerName?.toLowerCase().includes(term) || 
        a.destination?.toLowerCase().includes(term) ||
        a.id?.toLowerCase().includes(term)
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = a.createdAt?.toDate()?.getTime() || 0;
        const dateB = b.createdAt?.toDate()?.getTime() || 0;
        return dateB - dateA;
      } else if (sortBy === 'price') {
        return (b.price || 0) - (a.price || 0);
      } else {
        return (a.status || '').localeCompare(b.status || '');
      }
    });

    return result;
  }, [activities, filterStatus, sortBy, searchTerm]);

  const totalAmount = useMemo(() => {
    return filteredAndSortedActivities.reduce((acc, curr) => acc + (curr.price || 0), 0);
  }, [filteredAndSortedActivities]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "h-full w-full relative flex flex-col",
        isCourier ? "bg-[#0f1c2c]" : "bg-surface"
      )}
    >
      <header className="fixed top-0 w-full z-50 backdrop-blur-xl flex flex-col px-6 py-4 border-b bg-surface/80 border-outline-variant">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onNavigate(isCourier ? 'courier-profile' : 'profile')}
              className={cn(
                "w-10 h-10 rounded-full overflow-hidden border active:scale-90 transition-transform",
                isCourier ? "border-secondary-fixed" : "border-outline-variant"
              )}
            >
              <img src={profile?.profilePic || ASSETS.PROFILE_PIC} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </button>
            <h1 className={cn("text-xl font-extrabold tracking-tight font-headline", isCourier ? "text-white" : "text-on-surface")}>Histórico</h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onOpenNotifications}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors relative"
            >
              <Bell className={cn("w-6 h-6", isCourier ? "text-white" : "text-on-surface")} />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-4 h-4 bg-secondary-fixed text-on-secondary-fixed text-[8px] font-black rounded-full flex items-center justify-center border-2 border-surface">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <div className="p-1 rounded-xl flex gap-1 bg-surface-container-low">
              <button 
                onClick={() => setSortBy('date')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  sortBy === 'date' 
                    ? "bg-secondary-fixed text-on-secondary-fixed shadow-lg" 
                    : "text-on-surface-variant"
                )}
              >
                Data
              </button>
              <button 
                onClick={() => setSortBy('price')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  sortBy === 'price' 
                    ? "bg-secondary-fixed text-on-secondary-fixed shadow-lg" 
                    : "text-on-surface-variant"
                )}
              >
                Preço
              </button>
              <button 
                onClick={() => setSortBy('status')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  sortBy === 'status' 
                    ? "bg-secondary-fixed text-on-secondary-fixed shadow-lg" 
                    : "text-on-surface-variant"
                )}
              >
                Status
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4",
            isCourier ? "text-white/40" : "text-on-surface-variant"
          )} />
          <input 
            type="text"
            placeholder="Buscar por cliente ou destino..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              "w-full pl-11 pr-4 py-3 rounded-2xl text-sm font-bold outline-none transition-all border",
              isCourier 
                ? "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-secondary-fixed/50" 
                : "bg-surface-container-low border-outline-variant text-on-surface placeholder:text-on-surface-variant/40 focus:border-secondary-fixed/50"
            )}
          />
        </div>
      </header>

      <main className="flex-1 pt-44 px-4 pb-32 overflow-y-auto no-scrollbar">
        {/* Summary Card */}
        {!loading && filteredAndSortedActivities.length > 0 && (
          <div className={cn(
            "mb-6 p-6 rounded-[2.5rem] border flex justify-between items-center shadow-sm",
            isCourier 
              ? "bg-gradient-to-br from-secondary-fixed/20 to-secondary-fixed/5 border-secondary-fixed/20" 
              : "bg-gradient-to-br from-surface-container-highest/50 to-surface-container-low/50 border-outline-variant"
          )}>
            <div>
              <p className={cn(
                "text-[10px] font-black uppercase tracking-[0.2em] mb-1",
                isCourier ? "text-secondary-fixed/80" : "text-on-surface-variant"
              )}>
                {isCourier ? 'Total de Ganhos' : 'Total Gasto'}
              </p>
              <p className={cn(
                "text-2xl font-black font-headline",
                isCourier ? "text-white" : "text-on-surface"
              )}>
                R$ {totalAmount.toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <p className={cn(
                "text-[10px] font-black uppercase tracking-[0.2em] mb-1",
                isCourier ? "text-secondary-fixed/80" : "text-on-surface-variant"
              )}>
                Entregas
              </p>
              <p className={cn(
                "text-2xl font-black font-headline",
                isCourier ? "text-white" : "text-on-surface"
              )}>
                {filteredAndSortedActivities.length}
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-6 no-scrollbar">
          {['all', 'searching', 'collecting', 'delivering', 'delivered'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={cn(
                "px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border",
                filterStatus === status 
                  ? "bg-secondary-fixed text-on-secondary-fixed border-secondary-fixed shadow-lg" 
                  : isCourier 
                    ? "bg-white/5 text-white/40 border-white/10 hover:bg-white/10"
                    : "bg-surface-container-low text-on-surface-variant border-outline-variant hover:bg-surface-container-highest"
              )}
            >
              {status === 'all' ? 'Todos' :
               status === 'searching' ? 'Buscando' :
               status === 'collecting' ? 'Coletando' :
               status === 'delivering' ? 'Em Entrega' : 'Entregues'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 rounded-[2.5rem]" />
            <Skeleton className="h-32 rounded-[2.5rem]" />
            <Skeleton className="h-32 rounded-[2.5rem]" />
          </div>
        ) : filteredAndSortedActivities.length === 0 ? (
          <EmptyState 
            icon={<History />} 
            title="Nenhuma Atividade" 
            message={searchTerm ? "Nenhum resultado para sua busca." : "Você ainda não possui registros de entregas."} 
          />
        ) : (
          <div className="space-y-4">
            {filteredAndSortedActivities.map((activity, i) => (
              <motion.div 
                layout
                key={`activity-${activity.id || i}`} 
                onClick={() => setExpandedId(expandedId === activity.id ? null : activity.id)}
                className={cn(
                  "rounded-[2.5rem] p-6 border transition-all cursor-pointer",
                  isCourier 
                    ? "bg-white/5 border-white/10 hover:bg-white/10" 
                    : "bg-surface-container-low border-outline-variant shadow-sm hover:bg-surface-container-highest"
                )}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-14 h-14 rounded-[1.5rem] flex items-center justify-center shadow-inner",
                      activity.status === 'delivered' 
                        ? "bg-green-500/20 text-green-400" 
                        : "bg-blue-500/20 text-blue-400"
                    )}>
                      {activity.status === 'delivered' ? <CheckCircle2 className="w-8 h-8" /> : <Package className="w-8 h-8" />}
                    </div>
                    <div>
                      <p className={cn(
                        "font-headline font-black text-lg",
                        isCourier ? "text-white" : "text-on-surface"
                      )}>
                        {activity.status === 'delivered' ? 'Entregue' : 
                         activity.status === 'searching' ? 'Buscando Motoboy' :
                         activity.status === 'collecting' ? 'Coletando' :
                         activity.status === 'delivering' ? 'Em Entrega' : 'Pendente'}
                      </p>
                      <p className={cn(
                        "text-[10px] uppercase tracking-widest font-black opacity-60",
                        isCourier ? "text-white/40" : "text-on-surface-variant"
                      )}>
                        {activity.createdAt?.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-[9px] font-black uppercase tracking-widest mb-1",
                      isCourier ? "text-white/40" : "text-on-surface-variant"
                    )}>
                      {isCourier ? 'Ganhos' : 'Valor'}
                    </p>
                    <p className={cn(
                      "font-headline font-black px-4 py-1.5 rounded-2xl text-base",
                      isCourier ? "bg-secondary-fixed text-on-secondary-fixed" : "bg-secondary-fixed text-on-secondary-fixed"
                    )}>
                      R$ {activity.price?.toFixed(2)}
                    </p>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedId === activity.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className={cn(
                        "space-y-4 border-t pt-5 mt-4",
                        isCourier ? "border-white/5" : "border-outline-variant"
                      )}>
                        {/* Customer Details */}
                        <div className={cn(
                          "flex items-center justify-between p-4 rounded-3xl border",
                          isCourier ? "bg-white/5 border-white/5" : "bg-surface-container-lowest border-outline-variant"
                        )}>
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-10 h-10 rounded-2xl flex items-center justify-center",
                              isCourier ? "bg-white/10" : "bg-surface-container-highest"
                            )}>
                              <User className={cn("w-5 h-5", isCourier ? "text-white" : "text-on-surface")} />
                            </div>
                            <div>
                              <p className={cn("text-sm font-black", isCourier ? "text-white" : "text-on-surface")}>
                                {activity.customerName || 'Cliente'}
                              </p>
                              <p className={cn("text-xs font-bold", isCourier ? "text-white/40" : "text-on-surface-variant")}>
                                {activity.customerPhone || 'Sem telefone'}
                              </p>
                            </div>
                          </div>
                          <button className={cn(
                            "w-10 h-10 rounded-2xl flex items-center justify-center active:scale-90 transition-transform shadow-lg",
                            isCourier ? "bg-secondary-fixed text-on-secondary-fixed" : "bg-secondary-fixed text-on-secondary-fixed"
                          )}>
                            <Phone className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Route */}
                        <div className="space-y-3 px-2">
                          <div className="flex items-start gap-4">
                            <div className="mt-1.5 flex flex-col items-center gap-1.5">
                              <div className={cn("w-2 h-2 rounded-full", isCourier ? "bg-white/20" : "bg-outline-variant")} />
                              <div className={cn("w-0.5 h-6", isCourier ? "bg-white/10" : "bg-outline-variant/30")} />
                              <MapPin className="w-4 h-4 text-red-500" />
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex flex-col">
                                <span className={cn("text-[9px] font-black uppercase tracking-widest opacity-40", isCourier ? "text-white" : "text-on-surface")}>Origem</span>
                                <p className={cn("text-xs font-bold truncate", isCourier ? "text-white/60" : "text-on-surface-variant")}>{activity.origin}</p>
                              </div>
                              <div className="flex flex-col">
                                <span className={cn("text-[9px] font-black uppercase tracking-widest opacity-40", isCourier ? "text-white" : "text-on-surface")}>Destino</span>
                                <p className={cn("text-xs font-bold truncate", isCourier ? "text-white" : "text-on-surface")}>{activity.destination}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        <div className={cn(
                          "pt-4 border-t space-y-4",
                          isCourier ? "border-white/5" : "border-outline-variant"
                        )}>
                          {activity.notes && (
                            <div className={cn(
                              "p-4 rounded-3xl",
                              isCourier ? "bg-white/5" : "bg-yellow-500/10"
                            )}>
                              <div className="flex items-center gap-2 mb-2">
                                <StickyNote className={cn("w-4 h-4", isCourier ? "text-white/40" : "text-yellow-600")} />
                                <span className={cn("text-[10px] font-black uppercase tracking-widest", isCourier ? "text-white/40" : "text-yellow-600")}>Observações</span>
                              </div>
                              <p className={cn("text-xs font-bold leading-relaxed", isCourier ? "text-white/80" : "text-yellow-800")}>{activity.notes}</p>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-4">
                            <div className={cn(
                              "p-4 rounded-3xl border",
                              isCourier ? "bg-white/5 border-white/5" : "bg-surface-container-lowest border-outline-variant"
                            )}>
                              <p className={cn("text-[9px] font-black uppercase tracking-widest opacity-40 mb-1", isCourier ? "text-white" : "text-on-surface")}>ID do Pedido</p>
                              <p className={cn("text-xs font-black", isCourier ? "text-white" : "text-on-surface")}>#{activity.id?.slice(-6).toUpperCase()}</p>
                            </div>
                            <div className={cn(
                              "p-4 rounded-3xl border",
                              isCourier ? "bg-white/5 border-white/5" : "bg-surface-container-lowest border-outline-variant"
                            )}>
                              <p className={cn("text-[9px] font-black uppercase tracking-widest opacity-40 mb-1", isCourier ? "text-white" : "text-on-surface")}>Método</p>
                              <p className={cn("text-xs font-black", isCourier ? "text-white" : "text-on-surface")}>Cartão / App</p>
                            </div>
                          </div>
                          
                          {!isCourier && (activity.status === 'searching' || activity.status === 'collecting') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCancellingId(activity.id || null);
                              }}
                              className="w-full py-4 bg-red-500/10 text-red-500 font-bold rounded-2xl border border-red-500/20 active:scale-[0.98] transition-all"
                            >
                              Cancelar Entrega
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className={cn(
        "fixed bottom-0 left-0 w-full backdrop-blur-md border-t flex justify-around items-center px-4 pb-6 pt-3 z-50 rounded-t-[2rem]",
        isCourier ? "bg-[#0f1c2c]/90 border-white/5" : "bg-surface/90 border-outline-variant h-[70.5px] pb-2 pt-2"
      )}>
        {isCourier ? (
          <>
            <CourierNavItem icon={<HomeIcon className="w-5 h-5" />} label="Início" onClick={() => onNavigate('courier-available')} />
            <CourierNavItem icon={<Bike className="w-5 h-5" />} label="Entregas" onClick={() => onNavigate('courier-tracking')} />
            <CourierNavItem icon={<ReceiptText className="w-5 h-5" />} label="Atividades" active onClick={() => onNavigate('activities')} />
            <CourierNavItem icon={<UserCircle className="w-5 h-5" />} label="Perfil" onClick={() => onNavigate('courier-profile')} />
          </>
        ) : (
          <>
            <NavItem icon={<HomeIcon />} label="Home" onClick={() => onNavigate('home')} />
            <NavItem icon={<ReceiptText />} label="Atividades" active onClick={() => onNavigate('activities')} />
            <NavItem icon={<Wallet />} label="Pagamentos" onClick={() => onNavigate('payments')} />
            <NavItem icon={<UserCircle />} label="Perfil" onClick={() => onNavigate('profile')} />
          </>
        )}
      </nav>

      <Modal 
        isOpen={!!cancellingId} 
        onClose={() => setCancellingId(null)} 
        title="Cancelar Entrega"
        dark={isCourier}
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
              onClick={() => setCancellingId(null)}
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