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

export default function RegistrationScreen({ role, onBack, onComplete, showToast }: { role: UserMode, onBack: () => void, onComplete: () => void, showToast: (msg: string, type?: any) => void }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    taxId: '', // CNPJ or CPF
    email: '',
    password: '',
    phone: '',
    address: ''
  });

  const isMerchant = role === 'merchant';

  const handleNext = () => {
    if (step === 1) {
      if (!formData.name || !formData.taxId) {
        showToast("Por favor, preencha todos os campos.", "error");
        return;
      }
    }
    if (step === 2) {
      if (!formData.phone) {
        showToast("Por favor, preencha o telefone.", "error");
        return;
      }
      if (isMerchant && (!formData.address || formData.address.length < 10)) {
        showToast("Por favor, insira o endereço completo da loja.", "error");
        return;
      }
    }
    setStep(s => s + 1);
  };
  const handleBack = () => step > 1 ? setStep(s => s - 1) : onBack();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const isValidEmail = (email: string) => {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email);
    };

    if (!formData.email || !formData.password || !formData.name || !formData.taxId) {
      showToast("Por favor, preencha todos os campos obrigatórios.", "error");
      return;
    }

    if (!isValidEmail(formData.email)) {
      showToast("Por favor, insira um e-mail válido.", "error");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      const profile: UserProfile = {
        uid: user.uid,
        name: formData.name,
        email: formData.email,
        role: role,
        cnpj: isMerchant ? formData.taxId : undefined,
        cpf: !isMerchant ? formData.taxId : undefined,
        phone: formData.phone,
        address: formData.address,
        profilePic: ASSETS.PROFILE_PIC,
        createdAt: new Date().toISOString(),
        isOnline: role === 'courier' ? false : undefined,
        lastActive: role === 'courier' ? new Date().toISOString() : undefined
      };

      await setDoc(doc(db, 'users', user.uid), profile);
      
      showToast(`Cadastro realizado com sucesso! Bem-vindo ao TaNaMao ${isMerchant ? 'Business' : 'Parceiro'}.`, "success");
      onComplete();
    } catch (error: any) {
      console.error("Registration error:", error);
      let message = "Falha no cadastro. Tente novamente.";
      if (error.code === 'auth/email-already-in-use') message = "Este e-mail já está em uso.";
      if (error.code === 'auth/weak-password') message = "A senha deve ter pelo menos 6 caracteres.";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full w-full bg-surface flex flex-col items-center justify-center p-8 relative overflow-y-auto no-scrollbar"
    >
      <div className={cn("absolute top-0 left-0 w-full h-1.5", isMerchant ? "bg-secondary-fixed" : "bg-primary-container")} />
      
      <button 
        onClick={handleBack}
        className="absolute top-8 left-8 w-12 h-12 rounded-2xl flex items-center justify-center bg-surface-container-low text-on-surface border border-outline-variant shadow-sm active:scale-90 transition-transform z-[100]"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      <div className="w-full max-w-sm">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs italic", isMerchant ? "bg-secondary-fixed text-on-secondary-fixed" : "bg-primary-container text-white")}>
              {step}
            </div>
            <h2 className="text-2xl font-black tracking-tighter italic text-on-surface">
              {step === 1 ? (isMerchant ? 'Dados da Loja' : 'Dados Pessoais') : step === 2 ? 'Contato' : 'Segurança'}
            </h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="space-y-4">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Test Helper for Step 1 */}
                <button 
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      name: isMerchant ? 'Pizzaria Teste' : 'João Entregador',
                      taxId: isMerchant ? '12.345.678/0001-90' : '123.456.789-00',
                      phone: '(11) 99999-9999',
                      address: 'Rua de Teste, 123'
                    });
                    showToast("Dados de teste preenchidos!", "info");
                  }}
                  className="w-full py-2.5 bg-primary-container/5 text-primary-container rounded-xl text-[9px] font-black uppercase tracking-widest border border-primary-container/10 mb-2"
                >
                  Preencher Dados de Teste
                </button>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 ml-1">
                    {isMerchant ? 'Nome Fantasia' : 'Nome Completo'}
                  </label>
                  <input 
                    type="text" 
                    placeholder={isMerchant ? "Ex: Pizzaria do Zé" : "Seu nome completo"}
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-5 py-4 bg-surface-container-low border border-outline-variant rounded-2xl text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary-fixed/20 transition-all placeholder:text-on-surface-variant/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 ml-1">
                    {isMerchant ? 'CNPJ' : 'CPF'}
                  </label>
                  <input 
                    type="text" 
                    placeholder={isMerchant ? "00.000.000/0000-00" : "000.000.000-00"}
                    value={formData.taxId}
                    onChange={e => setFormData({...formData, taxId: e.target.value})}
                    className="w-full px-5 py-4 bg-surface-container-low border border-outline-variant rounded-2xl text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary-fixed/20 transition-all placeholder:text-on-surface-variant/30"
                  />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 ml-1">Telefone / WhatsApp</label>
                  <input 
                    type="tel" 
                    placeholder="(00) 00000-0000"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-5 py-4 bg-surface-container-low border border-outline-variant rounded-2xl text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary-fixed/20 transition-all placeholder:text-on-surface-variant/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 ml-1">Endereço Completo</label>
                  <textarea 
                    placeholder="Rua, número, bairro, cidade..."
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    className="w-full px-5 py-4 bg-surface-container-low border border-outline-variant rounded-2xl text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary-fixed/20 transition-all min-h-[100px] resize-none placeholder:text-on-surface-variant/30"
                  />
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Test Helper for Step 3 */}
                <button 
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      email: isMerchant ? 'loja@teste.com' : 'entregador@teste.com',
                      password: 'senha123'
                    });
                    showToast("Credenciais de teste preenchidas!", "info");
                  }}
                  className="w-full py-2.5 bg-primary-container/5 text-primary-container rounded-xl text-[9px] font-black uppercase tracking-widest border border-primary-container/10 mb-2"
                >
                  Preencher Credenciais de Teste
                </button>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 ml-1">E-mail de Acesso</label>
                  <input 
                    type="email" 
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full px-5 py-4 bg-surface-container-low border border-outline-variant rounded-2xl text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary-fixed/20 transition-all placeholder:text-on-surface-variant/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 ml-1">Senha de Acesso</label>
                  <input 
                    type="password" 
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    className="w-full px-5 py-4 bg-surface-container-low border border-outline-variant rounded-2xl text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary-fixed/20 transition-all placeholder:text-on-surface-variant/30"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </div>

          <div className="mt-8">
            {step < 3 ? (
              <button 
                type="button"
                onClick={handleNext}
                className={cn("w-full py-5 font-black rounded-2xl shadow-xl active:scale-95 transition-all uppercase tracking-[0.2em] text-xs", isMerchant ? "bg-primary-container text-white shadow-primary-container/30" : "bg-primary-container text-white shadow-primary-container/30")}
              >
                Próximo Passo
              </button>
            ) : (
              <button 
                type="submit"
                disabled={loading}
                className={cn("w-full py-5 font-black rounded-2xl shadow-xl active:scale-95 transition-all uppercase tracking-[0.2em] text-xs", isMerchant ? "bg-secondary-fixed text-on-secondary-fixed shadow-secondary-fixed/30" : "bg-secondary-fixed text-on-secondary-fixed shadow-secondary-fixed/30")}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-on-secondary-fixed border-t-transparent rounded-full animate-spin mx-auto" />
                ) : (
                  'Finalizar Cadastro'
                )}
              </button>
            )}
          </div>
        </form>

        <div className="mt-8 flex justify-center gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className={cn("h-1 rounded-full transition-all duration-500", i === step ? "w-8 bg-primary-container" : "w-2 bg-black/5")} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}