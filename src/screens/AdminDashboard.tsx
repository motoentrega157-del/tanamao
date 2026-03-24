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

export default function AdminDashboard({ onLogout, showToast, showConfirm, pricingSettings }: { onLogout: () => void, showToast: (msg: string, type?: any) => void, showConfirm: (title: string, msg: string, onConfirm: () => void) => void, pricingSettings: PricingSettings }) {
  console.log("AdminDashboard: Rendering...");
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'deliveries' | 'settings'>('users');
  const [stats, setStats] = useState({ users: 0, deliveries: 0, revenue: 0 });
  const [recentDeliveries, setRecentDeliveries] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [allDeliveries, setAllDeliveries] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  const [localSettings, setLocalSettings] = useState<PricingSettings>(pricingSettings);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    setLocalSettings(pricingSettings);
  }, [pricingSettings]);

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await updateDoc(doc(db, 'settings', 'pricing'), {
        platformFee: Number(localSettings.platformFee),
        baseDistance: Number(localSettings.baseDistance),
        basePrice: Number(localSettings.basePrice),
        pricePerKm: Number(localSettings.pricePerKm)
      });
      showToast('Configurações salvas com sucesso.', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'settings/pricing');
      showToast('Erro ao salvar configurações.', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const fetchAdminData = async () => {
    try {
      console.log("AdminDashboard: Fetching users...");
      const usersSnap = await getDocs(collection(db, 'users'));
      console.log("AdminDashboard: Fetching deliveries...");
      const deliveriesSnap = await getDocs(query(collection(db, 'deliveries'), orderBy('createdAt', 'desc')));
      
      const users = usersSnap.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfile))
        .sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : (a.createdAt ? new Date(a.createdAt) : new Date(0));
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : (b.createdAt ? new Date(b.createdAt) : new Date(0));
          return dateB.getTime() - dateA.getTime();
        });
      const deliveries = deliveriesSnap.docs.map(doc => ({ ...doc.data(), id: doc.id })) as DeliveryData[];
      
      console.log(`AdminDashboard: Loaded ${users.length} users and ${deliveries.length} deliveries`);
      
      setAllUsers(users);
      setAllDeliveries(deliveries);
      setRecentDeliveries(deliveries.slice(0, 5));
      
      setStats({
        users: users.length,
        deliveries: deliveries.length,
        revenue: deliveries.reduce((acc, d) => acc + (d.price || 0), 0)
      });

      // Aggregate real chart data (last 7 days)
      const dailyData: Record<string, { count: number, revenue: number }> = {};
      const now = new Date();
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dayKey = d.toLocaleDateString('pt-BR', { weekday: 'short' });
        dailyData[dayKey] = { count: 0, revenue: 0 };
      }

      deliveries.forEach(d => {
        const date = d.createdAt?.toDate ? d.createdAt.toDate() : (d.createdAt ? new Date(d.createdAt) : null);
        if (date) {
          const dayKey = date.toLocaleDateString('pt-BR', { weekday: 'short' });
          if (dailyData[dayKey]) {
            dailyData[dayKey].count++;
            dailyData[dayKey].revenue += (d.price || 0);
          }
        }
      });

      const chart = Object.entries(dailyData).map(([name, data]) => ({
        name,
        entregas: data.count,
        receita: data.revenue
      })).reverse();
      
      setChartData(chart);

    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'admin-data');
    }
  };

  const { user, profile } = useContext(AuthContext)!;

  const handleCreateTestRide = async () => {
    if (!user) return;
    try {
      const mockDeliveryId = 'test-' + Math.floor(Math.random() * 10000);
      const newDelivery = {
        merchantId: user.uid,
        origin: 'Ponto de Teste A: Av. Paulista, 1000',
        destination: 'Ponto de Teste B: Rua Augusta, 500',
        customerName: 'Cliente de Teste',
        customerPhone: '(11) 99999-9999',
        notes: 'Esta é uma corrida de teste criada pelo administrador.',
        status: 'searching',
        price: 15.00,
        createdAt: serverTimestamp(),
        confirmationCode: Math.floor(1000 + Math.random() * 9000).toString(),
        destinationLocation: {
          lat: -23.5505 + (Math.random() - 0.5) * 0.05,
          lng: -46.6333 + (Math.random() - 0.5) * 0.05
        }
      };
      await addDoc(collection(db, 'deliveries'), newDelivery);
      showToast('Corrida de teste criada! Buscando motoboys...', 'success');
      fetchAdminData();
    } catch (error) {
      console.error("Error creating test ride:", error);
      showToast('Erro ao criar corrida de teste.', 'error');
    }
  };

  const handleSimulateCourier = async () => {
    try {
      const mockId = 'mock-courier-' + Math.floor(Math.random() * 1000);
      await setDoc(doc(db, 'users', mockId), {
        uid: mockId,
        name: 'Motoboy Simulado ' + mockId.slice(-3),
        email: `mock${mockId.slice(-3)}@tanamao.com`,
        role: 'courier',
        isOnline: true,
        lastActive: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      showToast('Motoboy simulado criado com sucesso!', 'success');
      fetchAdminData();
    } catch (error) {
      console.error("Error simulating courier:", error);
      showToast('Erro ao simular motoboy. Verifique as permissões.', 'error');
    }
  };

  useEffect(() => {
    console.log("AdminDashboard: Initial fetch effect");
    fetchAdminData();
  }, []);

  const handleUpdateUserRole = async (uid: string, newRole: UserMode) => {
    if (isUpdatingRole) return;
    setIsUpdatingRole(true);
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole });
      setIsUserModalOpen(false);
      showToast('Cargo atualizado com sucesso.', 'success');
      fetchAdminData();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (isDeletingUser) return;
    showConfirm(
      'Excluir Usuário',
      'Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.',
      async () => {
        setIsDeletingUser(uid);
        try {
          await deleteDoc(doc(db, 'users', uid));
          showToast('Usuário excluído com sucesso.', 'success');
          fetchAdminData();
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `users/${uid}`);
        } finally {
          setIsDeletingUser(null);
        }
      }
    );
  };

  return (
    <div className="h-full w-full bg-surface flex flex-col lg:flex-row overflow-hidden">
      {/* Sidebar (Desktop) */}
      <aside className="hidden lg:flex w-72 bg-[#0f1c2c] text-white flex-col shadow-2xl z-20">
        <div className="p-8 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-secondary-fixed flex items-center justify-center shadow-lg shadow-secondary-fixed/20">
            <Bike className="w-7 h-7 text-on-secondary-fixed" />
          </div>
          <div>
            <span className="text-2xl font-black tracking-tighter italic block leading-none">TaNaMao</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">Admin Panel</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2">
          <AdminNavItem icon={<BarChart3 className="w-5 h-5" />} label="Visão Geral" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
          <AdminNavItem icon={<Users className="w-5 h-5" />} label="Usuários" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
          <AdminNavItem icon={<Truck className="w-5 h-5" />} label="Entregas" active={activeTab === 'deliveries'} onClick={() => setActiveTab('deliveries')} />
          <AdminNavItem icon={<Settings className="w-5 h-5" />} label="Configurações" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>

        <div className="p-6 border-t border-white/5">
          <div className="bg-white/5 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-secondary-fixed/20 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-secondary-fixed" />
              </div>
              <div>
                <p className="text-sm font-bold">Admin Master</p>
                <p className="text-[10px] text-white/40">Status: Online</p>
              </div>
            </div>
            <button 
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-red-500/10 hover:text-red-400 text-white/60 rounded-xl transition-all font-bold text-sm"
            >
              <LogOut className="w-4 h-4" />
              Sair do Sistema
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden bg-[#0f1c2c] text-white p-4 flex items-center justify-between z-30 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary-fixed flex items-center justify-center shadow-lg shadow-secondary-fixed/20">
            <Bike className="w-6 h-6 text-on-secondary-fixed" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tighter italic block leading-none">TaNaMao</span>
            <span className="text-[8px] uppercase tracking-[0.2em] text-white/40 font-bold">Admin Panel</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
            <ShieldCheck className="w-5 h-5 text-secondary-fixed" />
          </div>
          <button 
            onClick={onLogout}
            className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-400"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto no-scrollbar p-4 lg:p-10 pb-24 lg:pb-10">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 lg:gap-0 mb-8 lg:mb-12">
          <div>
            <h1 className="text-2xl lg:text-4xl font-black text-on-surface tracking-tight mb-1 lg:mb-2">
              {activeTab === 'overview' && 'Dashboard'}
              {activeTab === 'users' && 'Gestão de Usuários'}
              {activeTab === 'deliveries' && 'Logística de Entregas'}
              {activeTab === 'settings' && 'Configurações'}
            </h1>
          </div>
          <div className="flex items-center gap-4 bg-surface-container-low p-2 rounded-2xl shadow-sm border border-outline-variant w-full lg:w-auto">
            <div className="flex-1 lg:flex-none px-4 py-1 lg:py-2 text-left lg:text-right">
              <p className="text-[8px] lg:text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Data Atual</p>
              <p className="text-sm lg:text-base font-bold text-on-surface">{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-surface-container-highest flex items-center justify-center border border-outline-variant shrink-0">
              <Calendar className="w-5 h-5 lg:w-6 lg:h-6 text-on-surface-variant" />
            </div>
          </div>
        </header>

        {activeTab === 'overview' && (
          <div className="space-y-6 lg:space-y-10">
            {/* Simulation Tools */}
            <div className="bg-[#0f1c2c] p-6 lg:p-8 rounded-3xl lg:rounded-[2.5rem] shadow-xl border border-white/5 relative overflow-hidden group">
              <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-secondary-fixed/20 flex items-center justify-center shadow-inner">
                    <Zap className="w-8 h-8 text-secondary-fixed animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white mb-1">Simulador de Testes</h3>
                    <p className="text-sm text-white/40 font-bold">Crie motoboys fictícios ou corridas de teste para validar o sistema.</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                  <button 
                    onClick={handleCreateTestRide}
                    className="flex-1 lg:flex-none px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-3"
                  >
                    <Truck className="w-5 h-5" />
                    Criar Corrida Teste
                  </button>
                  <button 
                    onClick={handleSimulateCourier}
                    className="flex-1 lg:flex-none px-8 py-4 bg-secondary-fixed text-on-secondary-fixed rounded-2xl font-black text-sm shadow-lg shadow-secondary-fixed/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    <Plus className="w-5 h-5" />
                    Simular Motoboy Online
                  </button>
                </div>
              </div>
              <div className="absolute top-[-50%] right-[-10%] w-64 h-64 bg-secondary-fixed/5 blur-[100px] rounded-full group-hover:bg-secondary-fixed/10 transition-all duration-700" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-8">
              <AdminStatCard icon={<Users />} label="Usuários Ativos" value={stats.users.toString()} color="blue" trend="+12%" />
              <AdminStatCard icon={<Truck />} label="Entregas Totais" value={stats.deliveries.toString()} color="green" trend="+5.4%" />
              <AdminStatCard icon={<DollarSign />} label="Receita Bruta" value={`R$ ${stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} color="lime" trend="+8.1%" />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
              <div className="lg:col-span-2 bg-white p-6 lg:p-8 rounded-3xl lg:rounded-[2.5rem] shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6 lg:mb-8">
                  <h3 className="text-lg lg:text-xl font-black text-[#0f1c2c]">Desempenho Semanal</h3>
                  <select className="bg-gray-50 border-none rounded-xl text-[10px] lg:text-xs font-bold px-3 lg:px-4 py-2 outline-none">
                    <option>Últimos 7 dias</option>
                    <option>Últimos 30 dias</option>
                  </select>
                </div>
                <div className="h-[200px] lg:h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#c3f400" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#c3f400" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 600, fill: '#9ca3af'}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 600, fill: '#9ca3af'}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', fontWeight: 'bold', fontSize: '12px' }}
                      />
                      <Area type="monotone" dataKey="receita" stroke="#c3f400" strokeWidth={4} fillOpacity={1} fill="url(#colorRec)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-[#0f1c2c] p-6 lg:p-8 rounded-3xl lg:rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-lg lg:text-xl font-black mb-6">Metas do Mês</h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-2 text-white/40">
                        <span>Entregas</span>
                        <span>85%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-secondary-fixed w-[85%] rounded-full" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-2 text-white/40">
                        <span>Novos Merchants</span>
                        <span>62%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-400 w-[62%] rounded-full" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-2 text-white/40">
                        <span>Satisfação</span>
                        <span>94%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-green-400 w-[94%] rounded-full" />
                      </div>
                    </div>
                  </div>
                  <button className="w-full mt-8 lg:mt-10 py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-bold text-sm transition-all border border-white/10">
                    Ver Relatório Completo
                  </button>
                </div>
                <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-secondary-fixed/10 blur-[80px] rounded-full" />
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              <div className="bg-white p-6 lg:p-8 rounded-3xl lg:rounded-[2.5rem] shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6 lg:mb-8">
                  <h3 className="text-lg lg:text-xl font-black text-[#0f1c2c] flex items-center gap-3">
                    <Clock className="w-5 h-5 lg:w-6 lg:h-6 text-secondary-fixed" />
                    Últimas Entregas
                  </h3>
                  <button onClick={() => setActiveTab('deliveries')} className="text-xs font-bold text-secondary-fixed hover:underline">Ver todas</button>
                </div>
                <div className="space-y-4">
                  {recentDeliveries.map((delivery, i) => (
                    <div key={`recent-${delivery.id || i}`} className="flex items-center justify-between p-4 lg:p-5 bg-gray-50 rounded-2xl lg:rounded-3xl border border-gray-100 hover:border-secondary-fixed/30 transition-all group">
                      <div className="flex items-center gap-3 lg:gap-4 min-w-0">
                        <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform shrink-0">
                          <Truck className="w-5 h-5 lg:w-6 lg:h-6 text-gray-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-[#0f1c2c] text-sm lg:text-base truncate">{delivery.destination}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter truncate">{delivery.customerName} • R$ {delivery.price?.toFixed(2)}</p>
                        </div>
                      </div>
                      <span className={cn(
                        "px-3 lg:px-4 py-1.5 rounded-full text-[8px] lg:text-[10px] font-black uppercase tracking-widest shrink-0",
                        delivery.status === 'delivered' ? 'bg-green-100 text-green-600' : 
                        delivery.status === 'searching' ? 'bg-blue-100 text-blue-600 animate-pulse' :
                        'bg-yellow-100 text-yellow-600'
                      )}>
                        {delivery.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 lg:p-8 rounded-3xl lg:rounded-[2.5rem] shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6 lg:mb-8">
                  <h3 className="text-lg lg:text-xl font-black text-[#0f1c2c] flex items-center gap-3">
                    <Users className="w-5 h-5 lg:w-6 lg:h-6 text-secondary-fixed" />
                    Novos Membros
                  </h3>
                  <button onClick={() => setActiveTab('users')} className="text-xs font-bold text-secondary-fixed hover:underline">Ver todos</button>
                </div>
                <div className="space-y-4">
                  {allUsers.slice(0, 5).map((u, i) => (
                    <div key={`recent-user-${u.uid || i}`} className="flex items-center justify-between p-4 lg:p-5 bg-gray-50 rounded-2xl lg:rounded-3xl border border-gray-100 group">
                      <div className="flex items-center gap-3 lg:gap-4 min-w-0">
                        <div className="relative shrink-0">
                          <img src={u.profilePic} alt={u.name} className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl object-cover shadow-sm group-hover:scale-110 transition-transform" />
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 lg:w-4 lg:h-4 rounded-full bg-green-500 border-2 border-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-[#0f1c2c] text-sm lg:text-base truncate">{u.name}</p>
                          <p className="text-[10px] text-gray-400 font-bold truncate">{u.email}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="px-2 lg:px-3 py-1 bg-[#0f1c2c] text-white rounded-lg text-[8px] lg:text-[9px] font-black uppercase tracking-widest">
                          {u.role}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-3xl lg:rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 lg:p-8 border-b border-gray-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gray-50/50">
              <div className="relative w-full lg:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Buscar usuários..." 
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-secondary-fixed outline-none transition-all"
                />
              </div>
              <div className="flex gap-3 w-full lg:w-auto">
                <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-3 lg:py-2 bg-white border border-gray-200 rounded-xl text-xs lg:text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">
                  <Filter className="w-4 h-4" />
                  Filtrar
                </button>
                <button className="flex-[2] lg:flex-none flex items-center justify-center gap-2 px-6 py-3 lg:py-2 bg-secondary-fixed text-on-secondary-fixed rounded-xl text-xs lg:text-sm font-black shadow-lg shadow-secondary-fixed/20 active:scale-95 transition-all">
                  <Plus className="w-4 h-4" />
                  Novo Usuário
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[600px] lg:min-w-full">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 lg:px-8 py-4 lg:py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Perfil</th>
                    <th className="px-6 lg:px-8 py-4 lg:py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Email</th>
                    <th className="px-6 lg:px-8 py-4 lg:py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Papel</th>
                    <th className="px-6 lg:px-8 py-4 lg:py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allUsers.map((u, i) => (
                    <tr key={`all-user-${u.uid || i}`} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 lg:px-8 py-4 lg:py-5">
                        <div className="flex items-center gap-3 lg:gap-4">
                          <img src={u.profilePic} alt="" className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl shadow-sm" />
                          <span className="font-black text-[#0f1c2c] text-sm lg:text-base">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-6 lg:px-8 py-4 lg:py-5 text-xs lg:text-sm font-bold text-gray-400">{u.email}</td>
                      <td className="px-6 lg:px-8 py-4 lg:py-5">
                        <span className={cn(
                          "px-3 lg:px-4 py-1.5 rounded-full text-[8px] lg:text-[10px] font-black uppercase tracking-widest",
                          u.role === 'admin' ? 'bg-purple-100 text-purple-600' :
                          u.role === 'courier' ? 'bg-blue-100 text-blue-600' :
                          'bg-gray-100 text-gray-600'
                        )}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 lg:px-8 py-4 lg:py-5 text-right">
                        <div className="flex justify-end gap-2 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => { setEditingUser(u); setIsUserModalOpen(true); }}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(u.uid)}
                            disabled={isDeletingUser === u.uid}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            {isDeletingUser === u.uid ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'deliveries' && (
          <div className="bg-white rounded-3xl lg:rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 lg:p-8 border-b border-gray-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gray-50/50">
              <h3 className="text-lg lg:text-xl font-black text-[#0f1c2c]">Histórico de Entregas</h3>
              <div className="flex gap-3 w-full lg:w-auto">
                <div className="flex bg-gray-100 p-1 rounded-xl w-full lg:w-auto overflow-x-auto">
                  <button className="flex-1 lg:flex-none px-4 py-1.5 bg-white shadow-sm rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Todas</button>
                  <button className="flex-1 lg:flex-none px-4 py-1.5 text-gray-400 hover:text-gray-600 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Ativas</button>
                  <button className="flex-1 lg:flex-none px-4 py-1.5 text-gray-400 hover:text-gray-600 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Concluídas</button>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[700px] lg:min-w-full">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 lg:px-8 py-4 lg:py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Destino</th>
                    <th className="px-6 lg:px-8 py-4 lg:py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Cliente</th>
                    <th className="px-6 lg:px-8 py-4 lg:py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Data</th>
                    <th className="px-6 lg:px-8 py-4 lg:py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Valor</th>
                    <th className="px-6 lg:px-8 py-4 lg:py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allDeliveries.map((d, i) => (
                    <tr key={`all-delivery-${d.id || i}`} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 lg:px-8 py-4 lg:py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                            <MapPin className="w-4 h-4 text-gray-400" />
                          </div>
                          <span className="font-black text-[#0f1c2c] text-xs lg:text-sm">{d.destination}</span>
                        </div>
                      </td>
                      <td className="px-6 lg:px-8 py-4 lg:py-5">
                        <p className="font-bold text-xs lg:text-sm text-[#0f1c2c]">{d.customerName}</p>
                        <p className="text-[9px] lg:text-[10px] text-gray-400 font-bold">{d.customerPhone}</p>
                      </td>
                      <td className="px-6 lg:px-8 py-4 lg:py-5 text-xs lg:text-sm font-bold text-gray-400">
                        {d.createdAt?.toDate ? d.createdAt.toDate().toLocaleDateString('pt-BR') : 'Recent'}
                      </td>
                      <td className="px-6 lg:px-8 py-4 lg:py-5 font-black text-[#0f1c2c] text-xs lg:text-sm">R$ {d.price?.toFixed(2)}</td>
                      <td className="px-6 lg:px-8 py-4 lg:py-5">
                        <span className={cn(
                          "px-3 lg:px-4 py-1.5 rounded-full text-[8px] lg:text-[10px] font-black uppercase tracking-widest",
                          d.status === 'delivered' ? 'bg-green-100 text-green-600' : 
                          d.status === 'searching' ? 'bg-blue-100 text-blue-600' :
                          'bg-yellow-100 text-yellow-600'
                        )}>
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <div className="bg-white p-6 lg:p-10 rounded-3xl lg:rounded-[2.5rem] shadow-sm border border-gray-100">
              <h3 className="text-xl lg:text-2xl font-black text-[#0f1c2c] mb-6 lg:mb-8">Parâmetros de Cobrança</h3>
              <div className="space-y-4 lg:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 lg:p-6 bg-gray-50 rounded-2xl lg:rounded-3xl border border-gray-100 gap-4">
                  <div>
                    <p className="font-black text-[#0f1c2c] text-sm lg:text-base">Taxa Fixa da Plataforma</p>
                    <p className="text-[10px] lg:text-xs text-gray-400 font-bold">Valor embutido em todas as corridas</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-gray-400 text-sm lg:text-base">R$</span>
                    <input type="number" value={localSettings.platformFee} onChange={(e) => setLocalSettings({...localSettings, platformFee: Number(e.target.value)})} className="w-full sm:w-24 bg-white border border-gray-200 rounded-xl px-3 py-2 font-black text-right outline-none focus:ring-2 focus:ring-secondary-fixed" />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 lg:p-6 bg-gray-50 rounded-2xl lg:rounded-3xl border border-gray-100 gap-4">
                  <div>
                    <p className="font-black text-[#0f1c2c] text-sm lg:text-base">Distância Base (km)</p>
                    <p className="text-[10px] lg:text-xs text-gray-400 font-bold">Até quantos km cobra o valor base</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="number" value={localSettings.baseDistance} onChange={(e) => setLocalSettings({...localSettings, baseDistance: Number(e.target.value)})} className="w-full sm:w-24 bg-white border border-gray-200 rounded-xl px-3 py-2 font-black text-right outline-none focus:ring-2 focus:ring-secondary-fixed" />
                    <span className="font-black text-gray-400 text-sm lg:text-base">km</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 lg:p-6 bg-gray-50 rounded-2xl lg:rounded-3xl border border-gray-100 gap-4">
                  <div>
                    <p className="font-black text-[#0f1c2c] text-sm lg:text-base">Valor Base</p>
                    <p className="text-[10px] lg:text-xs text-gray-400 font-bold">Valor cobrado até a distância base</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-gray-400 text-sm lg:text-base">R$</span>
                    <input type="number" value={localSettings.basePrice} onChange={(e) => setLocalSettings({...localSettings, basePrice: Number(e.target.value)})} className="w-full sm:w-24 bg-white border border-gray-200 rounded-xl px-3 py-2 font-black text-right outline-none focus:ring-2 focus:ring-secondary-fixed" />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 lg:p-6 bg-gray-50 rounded-2xl lg:rounded-3xl border border-gray-100 gap-4">
                  <div>
                    <p className="font-black text-[#0f1c2c] text-sm lg:text-base">Valor por Km Adicional</p>
                    <p className="text-[10px] lg:text-xs text-gray-400 font-bold">Cobrado acima da distância base</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-gray-400 text-sm lg:text-base">R$</span>
                    <input type="number" value={localSettings.pricePerKm} onChange={(e) => setLocalSettings({...localSettings, pricePerKm: Number(e.target.value)})} className="w-full sm:w-24 bg-white border border-gray-200 rounded-xl px-3 py-2 font-black text-right outline-none focus:ring-2 focus:ring-secondary-fixed" />
                  </div>
                </div>
              </div>
              <button 
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
                className="w-full mt-8 lg:mt-10 py-4 lg:py-5 bg-[#0f1c2c] text-white rounded-2xl lg:rounded-[1.5rem] font-black tracking-widest uppercase text-xs lg:text-sm shadow-xl shadow-[#0f1c2c]/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSavingSettings ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>

            <div className="bg-[#0f1c2c] p-6 lg:p-10 rounded-3xl lg:rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-xl lg:text-2xl font-black mb-6 lg:mb-8">Segurança e Logs</h3>
                <div className="space-y-4">
                  <div className="p-4 lg:p-6 bg-white/5 rounded-2xl lg:rounded-3xl border border-white/10">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-secondary-fixed/20 flex items-center justify-center">
                        <Lock className="w-5 h-5 text-secondary-fixed" />
                      </div>
                      <p className="font-bold">Backup Automático</p>
                    </div>
                    <p className="text-xs text-white/40 font-medium mb-4">Último backup realizado hoje às 04:00 AM</p>
                    <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-xs transition-all">Realizar Backup Agora</button>
                  </div>
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-blue-400" />
                      </div>
                      <p className="font-bold">Logs de Acesso</p>
                    </div>
                    <p className="text-xs text-white/40 font-medium mb-4">12 novos acessos administrativos detectados</p>
                    <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-xs transition-all">Ver Logs de Auditoria</button>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-secondary-fixed/5 blur-[100px] rounded-full" />
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0f1c2c]/90 backdrop-blur-md border-t border-white/5 px-6 py-3 flex justify-between items-center z-30">
        <MobileAdminNavItem icon={<BarChart3 />} label="Início" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
        <MobileAdminNavItem icon={<Users />} label="Usuários" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
        <MobileAdminNavItem icon={<Truck />} label="Entregas" active={activeTab === 'deliveries'} onClick={() => setActiveTab('deliveries')} />
        <MobileAdminNavItem icon={<Settings />} label="Ajustes" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
      </nav>

      {/* User Edit Modal */}
      <Modal 
        isOpen={isUserModalOpen} 
        onClose={() => setIsUserModalOpen(false)} 
        title="Editar Usuário"
      >
        {editingUser && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
              <img src={editingUser.profilePic} alt="" className="w-16 h-16 rounded-2xl object-cover shadow-md" />
              <div>
                <p className="text-xl font-black text-[#0f1c2c]">{editingUser.name}</p>
                <p className="text-sm text-gray-400 font-bold">{editingUser.email}</p>
              </div>
            </div>
            
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3">Alterar Papel do Usuário</label>
              <div className="grid grid-cols-3 gap-3">
                {(['merchant', 'courier', 'admin'] as UserMode[]).map(role => (
                  <button
                    key={role}
                    onClick={() => handleUpdateUserRole(editingUser.uid, role)}
                    disabled={isUpdatingRole}
                    className={cn(
                      "py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 disabled:opacity-50",
                      editingUser.role === role 
                        ? "bg-[#0f1c2c] text-white border-[#0f1c2c] shadow-lg" 
                        : "bg-white text-gray-400 border-gray-100 hover:border-gray-200"
                    )}
                  >
                    {isUpdatingRole && editingUser.role !== role ? (
                      <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto" />
                    ) : (
                      role
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 bg-yellow-50 rounded-2xl border border-yellow-100 flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0" />
              <p className="text-[10px] text-yellow-700 font-bold leading-relaxed">
                Alterar o papel de um usuário impacta diretamente suas permissões de acesso e funcionalidades disponíveis no aplicativo.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}