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

export default function LoginScreen({ onLogin, onBack, onRegister, role, showToast }: { onLogin: () => void, onBack: () => void, onRegister: () => void, role: UserMode, showToast: (msg: string, type?: any) => void }) {
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'google' | 'email'>(role === 'courier' ? 'google' : 'email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleGoogleLogin = async () => {
    if (loading) return;
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      onLogin();
    } catch (error) {
      console.error("Login failed:", error);
      showToast("Falha no login. Tente novamente.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      showToast("Por favor, informe seu e-mail para redefinir a senha.", "info");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      showToast("E-mail de redefinição enviado! Verifique sua caixa de entrada.", "success");
    } catch (error: any) {
      console.error("Reset error:", error);
      showToast("Falha ao enviar e-mail de redefinição. Verifique o endereço informado.", "error");
    }
  };

  const handleEmailAction = async (e: FormEvent, action: 'login' | 'register') => {
    e.preventDefault();
    if (loading) return;
    
    console.log(`${action === 'register' ? 'Registering' : 'Logging in'} for:`, email, "as role:", role);
    if (!email || !password) {
      showToast("Por favor, informe e-mail e senha.", "info");
      return;
    }

    setLoading(true);
    try {
      if (action === 'register') {
        // Only allow master admin to register as admin via this flow
        if (role === 'admin' && email !== 'mauriciocardoso896@gmail.com') {
          showToast("Apenas o administrador mestre pode criar contas administrativas.", "error");
          setLoading(false);
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log("Registration successful, user:", userCredential.user.uid);
      } else {
        // If logging in as admin, warn if not master email
        if (role === 'admin' && email !== 'mauriciocardoso896@gmail.com') {
          console.warn("Attempting admin login with non-master email. User will be treated as merchant.");
        }
        console.log("Attempting sign in for:", email);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log("Login successful, user:", userCredential.user.uid);
      }
      console.log("Auth action complete, calling onLogin");
      onLogin();
    } catch (error: any) {
      console.error("Auth error code:", error.code);
      console.error("Auth error message:", error.message);
      let message = "Falha na autenticação. Verifique suas credenciais.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        message = "E-mail ou senha incorretos. Se você ainda não tem uma conta, clique em 'Criar Conta'.";
      } else if (error.code === 'auth/email-already-in-use') {
        message = "Este e-mail já está em uso. Clique em 'Entrar'.";
      } else if (error.code === 'auth/weak-password') {
        message = "A senha deve ter pelo menos 6 caracteres.";
      } else if (error.code === 'auth/too-many-requests') {
        message = "Muitas tentativas falhas. Tente novamente mais tarde ou redefina sua senha.";
      }
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const isMerchant = role === 'merchant';
  const isAdmin = role === 'admin';

  const handleTestAccess = async (type: 'test' | 'admin') => {
    if (loading) return;
    setLoading(true);
    
    const testEmail = type === 'admin' ? 'mauriciocardoso896@gmail.com' : (isMerchant ? 'loja@teste.com' : 'entregador@teste.com');
    const testPass = type === 'admin' ? 'admin123' : 'senha123';
    
    setEmail(testEmail);
    setPassword(testPass);
    if (isMerchant) setCnpj('12.345.678/0001-90');

    try {
      // Try to login first
      await signInWithEmailAndPassword(auth, testEmail, testPass);
      showToast(`Acesso ${type === 'admin' ? 'Admin' : 'Teste'} realizado!`, "success");
      onLogin();
    } catch (error: any) {
      // If user doesn't exist, create it automatically for testing
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        try {
          await createUserWithEmailAndPassword(auth, testEmail, testPass);
          showToast(`Conta de ${type} criada e logada automaticamente!`, "success");
          onLogin();
        } catch (regError: any) {
          showToast("Erro no acesso automático. Tente o botão 'Entrar'.", "error");
        }
      } else {
        showToast("Erro ao acessar conta de teste.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full w-full flex flex-col items-center justify-start pt-24 pb-32 p-8 relative overflow-y-auto no-scrollbar bg-surface"
    >
      {/* Background Decorative Elements for Merchant or Admin */}
      {(isMerchant || isAdmin) && (
        <>
          <div className={cn("absolute top-0 left-0 w-full h-1.5", isMerchant ? "bg-secondary-fixed" : "bg-white/20")} />
          <div className={cn("absolute -top-32 -right-32 w-80 h-80 rounded-full blur-[100px]", isMerchant ? "bg-secondary-fixed/10" : "bg-white/5")} />
          <div className={cn("absolute -bottom-32 -left-32 w-80 h-80 rounded-full blur-[100px]", isMerchant ? "bg-secondary-fixed/10" : "bg-white/5")} />
        </>
      )}

      <button 
        onClick={onBack}
        className="absolute top-8 left-8 w-12 h-12 rounded-2xl flex items-center justify-center active:scale-90 transition-transform border shadow-md z-[100] bg-surface-container-low text-on-surface border-outline-variant"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      <div className="mb-10 text-center relative z-10">
        <motion.div 
          layoutId="login-icon"
          className={cn(
            "w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-2xl transition-all duration-500",
            role === 'courier' ? "bg-secondary-fixed shadow-[0_20px_50px_rgba(195,244,0,0.3)]" : 
            role === 'admin' ? "bg-white/20 shadow-xl" :
            "bg-surface-container-high shadow-[0_20px_60px_rgba(0,0,0,0.3)] border border-outline-variant"
          )}
        >
          {role === 'courier' ? <Bike className="w-12 h-12 text-on-secondary-fixed" /> : 
           role === 'admin' ? <ShieldCheck className="w-12 h-12 text-white" /> :
           <div className="relative">
             <Store className="w-12 h-12 text-secondary-fixed" />
             <div className="absolute -top-1 -right-1 w-4 h-4 bg-secondary-fixed rounded-full border-2 border-surface" />
           </div>}
        </motion.div>
        
        <h1 className="text-4xl font-black tracking-tighter mb-2 font-headline italic text-on-surface">
          TaNaMao <span className="text-secondary-fixed">Business</span>
        </h1>
      </div>

      <div className="w-full max-w-sm space-y-6 relative z-10">
        {/* Method Toggle */}
        {!isAdmin && (
          <div className="flex p-1.5 rounded-2xl mb-2 bg-surface-container-low">
            <button 
              onClick={() => setLoginMethod('google')}
              className={cn(
                "flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300",
                loginMethod === 'google' ? "bg-surface-container-high text-on-surface shadow-md" : "text-on-surface-variant"
              )}
            >
              Google Auth
            </button>
            <button 
              onClick={() => setLoginMethod('email')}
              className={cn(
                "flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300",
                loginMethod === 'email' ? "bg-surface-container-high text-on-surface shadow-md" : "text-on-surface-variant"
              )}
            >
              Acesso Direto
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {loginMethod === 'google' && !isAdmin ? (
            <motion.div
              key="google-login"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-4"
            >
              <button 
                onClick={handleGoogleLogin}
                disabled={loading}
                className={cn(
                  "w-full py-4.5 font-black rounded-2xl flex items-center justify-center gap-4 active:scale-95 transition-all shadow-xl border bg-white text-[#1A1C1E]",
                  isMerchant ? "border-black/5 hover:bg-surface-container-low" : "border-transparent"
                )}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-primary-container border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
                    <span className="text-xs uppercase tracking-[0.15em]">Entrar com Google</span>
                  </>
                )}
              </button>
              
              {role === 'courier' && (
                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                  <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest"><span className="bg-[#0f1c2c] px-4 text-white/20">Acesso Rápido</span></div>
                </div>
              )}

              {role === 'courier' && (
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => handleTestAccess('test')}
                    disabled={loading}
                    className="py-3.5 bg-white/5 text-white/40 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    Visitante
                  </button>
                  <button 
                    onClick={() => handleTestAccess('test')}
                    disabled={loading}
                    className="py-3.5 bg-white/5 text-white/40 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    Suporte
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.form
              key="email-login"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-4"
            >
              <div className="space-y-3">
                {isMerchant && (
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center opacity-40">
                      <span className="text-[10px] font-black text-secondary-fixed">CNPJ</span>
                    </div>
                    <input 
                      type="text" 
                      placeholder="00.000.000/0000-00"
                      value={cnpj}
                      onChange={(e) => setCnpj(e.target.value)}
                      className="w-full pl-14 pr-4 py-4 bg-surface-container-low border border-outline-variant rounded-2xl text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary-fixed/20 transition-all placeholder:text-on-surface-variant/30"
                    />
                  </div>
                )}
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40 text-on-surface" />
                  <input 
                    type="email" 
                    placeholder={isAdmin ? "E-mail administrativo" : "E-mail do gestor"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-surface-container-low border border-outline-variant rounded-2xl text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary-fixed/20 transition-all placeholder:text-on-surface-variant/30"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40 text-on-surface" />
                  <input 
                    type="password" 
                    placeholder="Sua senha de acesso"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-surface-container-low border border-outline-variant rounded-2xl text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary-fixed/20 transition-all placeholder:text-on-surface-variant/30"
                  />
                </div>
              </div>
              
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="remember" className="w-4 h-4 rounded border-black/10 text-primary-container focus:ring-primary-container/20" />
                  <label htmlFor="remember" className={cn("text-[10px] font-bold uppercase tracking-wider", isMerchant ? "text-on-surface-variant/60" : "text-white/30")}>Lembrar</label>
                </div>
                <button 
                  type="button" 
                  onClick={handlePasswordReset}
                  className={cn("text-[10px] font-black uppercase tracking-widest hover:underline", isMerchant ? "text-primary-container" : "text-white/40")}
                >
                  Esqueci a senha
                </button>
              </div>

              <div className="flex gap-3 mt-4">
                <button 
                  type="button"
                  onClick={(e) => handleEmailAction(e as any, 'login')}
                  disabled={loading || !email || !password}
                  className={cn(
                    "flex-1 py-4.5 font-black rounded-2xl shadow-xl active:scale-95 transition-all disabled:opacity-50 uppercase tracking-[0.2em] text-[10px]",
                    isMerchant 
                      ? "bg-secondary-fixed text-on-secondary-fixed shadow-secondary-fixed/30" 
                      : "bg-white text-[#1A1C1E] shadow-white/10"
                  )}
                >
                  {loading ? (
                    <div className={cn("w-5 h-5 border-2 border-t-transparent rounded-full animate-spin mx-auto", isMerchant ? "border-white" : "border-primary-container")} />
                  ) : (
                    "Entrar"
                  )}
                </button>
                <button 
                  type="button"
                  onClick={onRegister}
                  disabled={loading}
                  className={cn(
                    "flex-1 py-4.5 font-black rounded-2xl shadow-xl active:scale-95 transition-all disabled:opacity-50 uppercase tracking-[0.2em] text-[10px]",
                    isMerchant 
                      ? "bg-surface-container-high text-on-surface border border-outline-variant shadow-sm" 
                      : "bg-white/10 text-white border border-white/20 shadow-sm"
                  )}
                >
                  {loading ? (
                    <div className={cn("w-5 h-5 border-2 border-t-transparent rounded-full animate-spin mx-auto", isMerchant ? "border-primary-container" : "border-white")} />
                  ) : (
                    "Criar Conta"
                  )}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Test Login Helper */}
        <div className={cn(
          "pt-6 border-t mt-6 relative z-10 w-full",
          isMerchant ? "border-black/5" : "border-white/10"
        )}>
          <p className={cn(
            "text-[9px] font-black text-center uppercase tracking-[0.3em] mb-4",
            isMerchant ? "text-on-surface-variant/30" : "text-white/20"
          )}>
            Ambiente de Teste
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button 
              type="button"
              onClick={() => handleTestAccess('test')}
              disabled={loading}
              className={cn(
                "py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 flex flex-col items-center justify-center gap-0.5",
                isMerchant ? "bg-black/5 text-on-surface-variant/60" : "bg-white/5 text-white/40"
              )}
            >
              <span>{loading ? "..." : "Acesso Teste"}</span>
              {!loading && <span className="text-[7px] opacity-50 lowercase tracking-normal">{isMerchant ? 'loja@teste.com' : 'entregador@teste.com'}</span>}
            </button>
            <button 
              type="button"
              onClick={() => handleTestAccess('admin')}
              disabled={loading}
              className={cn(
                "py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 flex flex-col items-center justify-center gap-0.5",
                isMerchant ? "bg-black/5 text-on-surface-variant/60" : "bg-white/5 text-white/40"
              )}
            >
              <span>{loading ? "..." : "Acesso Admin"}</span>
              {!loading && <span className="text-[7px] opacity-50 lowercase tracking-normal">mauriciocardoso896@gmail.com</span>}
            </button>
          </div>
        </div>

        {isMerchant && (
          <div className="text-center pt-6">
            <p className={cn("text-xs font-bold", isMerchant ? "text-on-surface-variant/60" : "text-white/40")}>
              Ainda não é parceiro? {' '}
              <button onClick={onRegister} className="text-primary-container font-black uppercase tracking-widest text-[10px] hover:underline ml-1">
                Cadastre sua loja
              </button>
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}