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

export default function LandingScreen({ onSelectRole, onNavigate }: { onSelectRole: (role: UserMode) => void, onNavigate: (screen: Screen) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full w-full bg-[#0f1c2c] overflow-y-auto no-scrollbar"
    >
      {/* Top Bar */}
      <header className="flex justify-between items-center px-6 py-4 bg-[#0f1c2c] border-b border-white/10 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-extrabold text-[#c3f400] tracking-tight font-headline uppercase">TaNaMao</h1>
        </div>
        <button 
          onClick={() => onNavigate('role-selection')} 
          className="px-5 py-2 rounded-full bg-[#c3f400] text-[#0f1c2c] text-xs font-bold uppercase tracking-widest active:scale-95 transition-transform"
        >
          Entrar
        </button>
      </header>

      {/* Hero Section */}
      <section className="bg-[#1a2332] text-white px-6 py-12 relative overflow-hidden">
        {/* Background grid pattern */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        
        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
          <div className="bg-white/10 border border-white/20 rounded-full px-3 py-1 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#c3f400]" />
            <span className="text-[10px] font-bold text-[#c3f400] tracking-widest uppercase">Logística Inteligente</span>
          </div>
          
          <h2 className="text-4xl font-extrabold font-headline leading-tight">
            TaNaMao:<br/>Conectando<br/><span className="text-[#c3f400]">Comércio</span> e<br/><span className="text-[#c3f400]">Entregas</span>
          </h2>
          
          <p className="text-white/60 text-sm max-w-xs mx-auto">
            A plataforma definitiva para escalar seu negócio local ou maximizar seus ganhos como entregador.
          </p>
          
          {/* Graphic */}
          <div className="w-full max-w-xs mx-auto mt-8 relative">
            <div className="bg-[#0f1c2c]/80 border border-white/10 rounded-2xl p-6 backdrop-blur-sm relative z-10 h-48 flex items-center justify-center">
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Connecting Lines */}
                <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
                  <path d="M 160 96 L 80 48" stroke="rgba(195,244,0,0.2)" strokeWidth="2" fill="none" />
                  <path d="M 160 96 L 240 48" stroke="rgba(195,244,0,0.2)" strokeWidth="2" fill="none" />
                  <path d="M 160 96 L 80 144" stroke="rgba(195,244,0,0.2)" strokeWidth="2" fill="none" />
                  <path d="M 160 96 L 240 144" stroke="rgba(195,244,0,0.2)" strokeWidth="2" fill="none" />
                </svg>
                
                {/* Central Server */}
                <div className="w-16 h-24 border-2 border-[#c3f400]/50 rounded-lg flex flex-col items-center justify-center gap-2 bg-[#0f1c2c] z-10 relative shadow-[0_0_30px_rgba(195,244,0,0.2)]">
                  <div className="w-10 h-1 bg-[#c3f400]/50 rounded-full" />
                  <div className="w-10 h-1 bg-[#c3f400]/50 rounded-full" />
                  <div className="w-10 h-1 bg-[#c3f400]/50 rounded-full" />
                </div>

                {/* Floating Icons */}
                <div className="absolute top-4 left-8 bg-[#1a2332] p-2 rounded-full border border-[#c3f400]/30 z-10">
                  <Search className="w-4 h-4 text-[#c3f400]" />
                </div>
                <div className="absolute top-4 right-8 bg-[#1a2332] p-2 rounded-full border border-[#c3f400]/30 z-10">
                  <BarChart3 className="w-4 h-4 text-[#c3f400]" />
                </div>
                <div className="absolute bottom-4 left-8 bg-[#1a2332] p-2 rounded-full border border-[#c3f400]/30 z-10">
                  <Settings className="w-4 h-4 text-[#c3f400]" />
                </div>
                <div className="absolute bottom-4 right-8 bg-[#1a2332] p-2 rounded-full border border-[#c3f400]/30 z-10">
                  <Activity className="w-4 h-4 text-[#c3f400]" />
                </div>
              </div>
              
              <div className="absolute left-0 bottom-0 translate-y-1/2 -translate-x-4 bg-[#1a2332] border border-white/10 rounded-xl p-3 shadow-xl z-20">
                <p className="text-[8px] text-white/40 uppercase font-bold tracking-widest mb-1">Pedidos Hoje</p>
                <p className="text-[#c3f400] font-bold text-lg">+1,240</p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => onNavigate('role-selection')}
            className="w-full max-w-xs bg-[#c3f400] text-[#0f1c2c] font-bold py-4 rounded-xl flex items-center justify-center gap-2 mt-8 active:scale-95 transition-transform"
          >
            Começar Agora <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-[#1a2332] px-6 py-16 text-center border-y border-white/5">
        <h3 className="text-2xl font-extrabold text-[#c3f400] font-headline mb-2 uppercase tracking-tight">Planos Sob Medida</h3>
        <p className="text-white/40 text-sm mb-10 font-medium">Simples, transparente e eficiente.</p>
        
        <div className="space-y-6 max-w-sm mx-auto">
          {/* Merchant Plan */}
          <div className="bg-[#0f1c2c] rounded-[2rem] p-8 shadow-2xl border border-white/10 text-left relative overflow-hidden">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                <Store className="w-6 h-6 text-[#c3f400]" />
              </div>
              <div>
                <h4 className="font-bold text-white text-lg">Plano Comerciante</h4>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Ideal para lojas</p>
              </div>
            </div>
            
            <div className="mb-6 flex items-baseline gap-1">
              <span className="text-sm font-bold text-white/40">R$</span>
              <span className="text-4xl font-black text-white font-headline">29,90</span>
              <span className="text-sm text-white/40">/ mês</span>
            </div>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3 text-sm text-white/60"><CheckCircle2 className="w-4 h-4 text-[#c3f400]" /> Painel de gestão completo</li>
              <li className="flex items-center gap-3 text-sm text-white/60"><CheckCircle2 className="w-4 h-4 text-[#c3f400]" /> Integração com motoboys locais</li>
              <li className="flex items-center gap-3 text-sm text-white/60"><CheckCircle2 className="w-4 h-4 text-[#c3f400]" /> Relatórios de vendas em tempo real</li>
              <li className="flex items-center gap-3 text-sm text-white/60"><CheckCircle2 className="w-4 h-4 text-[#c3f400]" /> Suporte prioritário 24/7</li>
            </ul>
            
            <button 
              onClick={() => onSelectRole('merchant')}
              className="w-full py-4 rounded-xl border-2 border-[#c3f400] text-[#c3f400] font-bold active:bg-white/5 transition-colors"
            >
              Cadastrar Loja
            </button>
          </div>

          {/* Courier Plan */}
          <div className="bg-[#c3f400] rounded-[2rem] p-8 shadow-xl text-left relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-[#0f1c2c] text-[#c3f400] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
              Mais Popular
            </div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[#0f1c2c] flex items-center justify-center">
                <Bike className="w-6 h-6 text-[#c3f400]" />
              </div>
              <div>
                <h4 className="font-bold text-[#0f1c2c] text-lg">Plano Motoboy</h4>
                <p className="text-[10px] font-bold text-[#0f1c2c]/40 uppercase tracking-widest">Para entregadores</p>
              </div>
            </div>
            
            <div className="mb-6 flex items-baseline gap-1">
              <span className="text-sm font-bold text-[#0f1c2c]/60">R$</span>
              <span className="text-4xl font-black text-[#0f1c2c] font-headline">29,90</span>
              <span className="text-sm text-[#0f1c2c]/60">/ mês</span>
            </div>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3 text-sm text-[#0f1c2c]/80"><CheckCircle2 className="w-4 h-4 text-[#0f1c2c]" /> Taxa zero por entrega</li>
              <li className="flex items-center gap-3 text-sm text-[#0f1c2c]/80"><CheckCircle2 className="w-4 h-4 text-[#0f1c2c]" /> Roteirização inteligente AI</li>
              <li className="flex items-center gap-3 text-sm text-[#0f1c2c]/80"><CheckCircle2 className="w-4 h-4 text-[#0f1c2c]" /> Seguro contra acidentes</li>
              <li className="flex items-center gap-3 text-sm text-[#0f1c2c]/80"><CheckCircle2 className="w-4 h-4 text-[#0f1c2c]" /> Saque imediato de ganhos</li>
            </ul>
            
            <button 
              onClick={() => onSelectRole('courier')}
              className="w-full py-4 rounded-xl bg-[#0f1c2c] text-[#c3f400] font-bold active:scale-95 transition-transform"
            >
              Ser Parceiro
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#0f1c2c] px-6 py-16">
        <div className="bg-[#1a2332] rounded-[2rem] p-8 text-center shadow-2xl max-w-sm mx-auto border border-white/5">
          <h3 className="text-xl font-extrabold text-white font-headline mb-4">Pronto para transformar sua logística?</h3>
          <p className="text-white/40 text-sm mb-8 font-medium">Junte-se a milhares de parceiros que já estão acelerando com a TaNaMao.</p>
          
          <button 
            onClick={() => onNavigate('role-selection')}
            className="w-full py-4 rounded-xl bg-[#c3f400] text-[#0f1c2c] font-bold flex items-center justify-center gap-2 mb-4 active:scale-95 transition-transform"
          >
            <LogOut className="w-5 h-5 rotate-180" /> Entrar na Plataforma
          </button>
          <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Acesso seguro via criptografia</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0f1c2c] text-white/60 py-12 px-6 text-center">
        <h2 className="text-xl font-extrabold text-white tracking-tight font-headline uppercase mb-8">TaNaMao</h2>
        <div className="flex justify-center gap-6 text-[10px] font-bold uppercase tracking-widest mb-8">
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <a href="#" className="hover:text-white transition-colors">Support</a>
          <a href="#" className="hover:text-white transition-colors">Contact</a>
        </div>
        <div className="w-12 h-px bg-white/10 mx-auto mb-8" />
        <p className="text-[10px] font-bold uppercase tracking-widest">© 2024 TÁNAMÃO DELIVERY. ALL RIGHTS RESERVED.</p>
      </footer>
    </motion.div>
  );
}