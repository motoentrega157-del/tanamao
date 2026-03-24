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

export default function NewRideScreen({ onBack, onRequestDelivery, data, setData }: NewRideScreenProps) {
  const { profile, user } = useContext(AuthContext)!;
  const [originCep, setOriginCep] = useState('');
  const [originCepError, setOriginCepError] = useState<string | null>(null);
  const [originStreet, setOriginStreet] = useState('');
  const [originNumber, setOriginNumber] = useState('');
  const [originComplement, setOriginComplement] = useState('');
  const [originNeighborhood, setOriginNeighborhood] = useState('');
  const [originCity, setOriginCity] = useState('');
  const [originState, setOriginState] = useState('');
  const [saveOrigin, setSaveOrigin] = useState(true);

  useEffect(() => {
    if (profile?.savedOrigin) {
      setOriginCep(profile.savedOrigin.cep || '');
      setOriginStreet(profile.savedOrigin.street || '');
      setOriginNumber(profile.savedOrigin.number || '');
      setOriginComplement(profile.savedOrigin.complement || '');
      setOriginNeighborhood(profile.savedOrigin.neighborhood || '');
      setOriginCity(profile.savedOrigin.city || '');
      setOriginState(profile.savedOrigin.state || '');
    }
  }, [profile]);

  const formatCep = (cep: string) => {
    const cleaned = cep.replace(/\D/g, '');
    if (cleaned.length <= 5) return cleaned;
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 8)}`;
  };

  const [destCep, setDestCep] = useState('');
  const [destCepError, setDestCepError] = useState<string | null>(null);
  const [destStreet, setDestStreet] = useState('');
  const [destNumber, setDestNumber] = useState('');
  const [destComplement, setDestComplement] = useState('');
  const [destNeighborhood, setDestNeighborhood] = useState('');
  const [destCity, setDestCity] = useState('');
  const [destState, setDestState] = useState('');

  const [itemDescription, setItemDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);
  const [originCoords, setOriginCoords] = useState<{lat: number, lng: number} | null>(null);
  const [destCoords, setDestCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [pricing, setPricing] = useState({ basePrice: 8, baseDistance: 4, pricePerKm: 2, platformFee: 2.5 });

  useEffect(() => {
    getDoc(doc(db, 'settings', 'pricing')).then(docSnap => {
      if (docSnap.exists()) {
        setPricing(docSnap.data() as any);
      }
    }).catch(e => console.error("Error fetching pricing", e));
  }, []);

  const getCoordinates = async (address: string, fallbackAddress?: string) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      } else if (fallbackAddress) {
        const fallbackResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fallbackAddress)}`);
        const fallbackData = await fallbackResponse.json();
        if (fallbackData && fallbackData.length > 0) {
          return { lat: parseFloat(fallbackData[0].lat), lng: parseFloat(fallbackData[0].lon) };
        }
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    const d = R * c; // Distance in km
    return d * 1.3; // Add 30% to approximate driving distance
  };

  // Fetch address from ViaCEP
  const fetchAddress = async (cep: string, type: 'origin' | 'dest') => {
    const cleanCep = cep.replace(/\D/g, '');
    
    if (type === 'origin') setOriginCepError(null);
    else setDestCepError(null);

    if (cleanCep.length !== 8) {
      if (type === 'origin') setOriginCepError("CEP inválido");
      else setDestCepError("CEP inválido");
      return;
    }

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      if (!response.ok) throw new Error('Falha na rede');
      const result = await response.json();
      
      if (!result.erro) {
        if (type === 'origin') {
          setOriginStreet(result.logradouro || '');
          setOriginNeighborhood(result.bairro || '');
          setOriginCity(result.localidade || '');
          setOriginState(result.uf || '');
        } else {
          setDestStreet(result.logradouro || '');
          setDestNeighborhood(result.bairro || '');
          setDestCity(result.localidade || '');
          setDestState(result.uf || '');
        }
      } else {
        if (type === 'origin') setOriginCepError("CEP não encontrado");
        else setDestCepError("CEP não encontrado");
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      if (type === 'origin') setOriginCepError("Erro ao buscar CEP");
      else setDestCepError("Erro ao buscar CEP");
    }
  };

  // Calculate price when both addresses are filled
  useEffect(() => {
    const calculateRoute = async () => {
      if (originStreet.trim() && originCity.trim() && destStreet.trim() && destCity.trim()) {
        setIsCalculating(true);
        setFormError(null);
        
        const originAddress = `${originStreet}, ${originNumber || ''}, ${originCity}, Brazil`;
        const originFallback = `${originStreet}, ${originCity}, Brazil`;
        const destAddress = `${destStreet}, ${destNumber || ''}, ${destCity}, Brazil`;
        const destFallback = `${destStreet}, ${destCity}, Brazil`;
        
        try {
          const originCoordsRes = await getCoordinates(originAddress, originFallback);
          const destCoordsRes = await getCoordinates(destAddress, destFallback);
          
          if (originCoordsRes && destCoordsRes) {
            setOriginCoords({ lat: originCoordsRes.lat, lng: originCoordsRes.lng });
            setDestCoords({ lat: destCoordsRes.lat, lng: destCoordsRes.lng });
            const dist = calculateDistance(originCoordsRes.lat, originCoordsRes.lng, destCoordsRes.lat, destCoordsRes.lng);
            setCalculatedDistance(dist);
            
            let price = pricing.basePrice;
            if (dist > pricing.baseDistance) {
              price += (dist - pricing.baseDistance) * pricing.pricePerKm;
            }
            price += pricing.platformFee;
            
            setCalculatedPrice(price);
          } else {
            // Fallback if geocoding fails
            setCalculatedDistance(3);
            let price = pricing.basePrice;
            if (3 > pricing.baseDistance) {
              price += (3 - pricing.baseDistance) * pricing.pricePerKm;
            }
            price += pricing.platformFee;
            setCalculatedPrice(price);
          }
        } catch (err) {
          console.error("Error calculating route:", err);
          // Fallback on error
          setCalculatedDistance(3);
          setCalculatedPrice(pricing.basePrice + pricing.platformFee);
        } finally {
          setIsCalculating(false);
        }
      } else {
        setCalculatedPrice(null);
        setCalculatedDistance(null);
      }
    };

    const timeoutId = setTimeout(() => {
      calculateRoute();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [originStreet, originNumber, originCity, destStreet, destNumber, destCity, pricing]);

  const [formError, setFormError] = useState<string | null>(null);

  const getMissingFields = () => {
    const missing = [];
    if (!originCep.trim()) missing.push("CEP de Coleta");
    if (!originStreet.trim()) missing.push("Rua de Coleta");
    if (!originNumber.trim()) missing.push("Número de Coleta");
    if (!originNeighborhood.trim()) missing.push("Bairro de Coleta");
    if (!originCity.trim()) missing.push("Cidade de Coleta");
    if (!originState.trim()) missing.push("Estado de Coleta");
    if (!destCep.trim()) missing.push("CEP de Entrega");
    if (!destStreet.trim()) missing.push("Rua de Entrega");
    if (!destNumber.trim()) missing.push("Número de Entrega");
    if (!destNeighborhood.trim()) missing.push("Bairro de Entrega");
    if (!destCity.trim()) missing.push("Cidade de Entrega");
    if (!destState.trim()) missing.push("Estado de Entrega");
    if (!itemDescription.trim()) missing.push("Descrição do Item");
    if (calculatedPrice === null && !isCalculating) missing.push("Cálculo do Preço (Aguarde ou verifique os endereços)");
    return missing;
  };

  const isFormValid = getMissingFields().length === 0;

  const handleRequest = () => {
    const missing = getMissingFields();
    if (missing.length > 0) {
      setFormError(`Campos faltando: ${missing.join(', ')}`);
      return;
    }
    setFormError(null);
    const originFull = `${originStreet}, ${originNumber} ${originComplement} - ${originNeighborhood}, ${originCity} - ${originState}, ${originCep}`;
    const destFull = `${destStreet}, ${destNumber} ${destComplement} - ${destNeighborhood}, ${destCity} - ${destState}, ${destCep}`;
    
    if (saveOrigin && user) {
      updateDoc(doc(db, 'users', user.uid), {
        savedOrigin: {
          cep: originCep,
          street: originStreet,
          number: originNumber,
          complement: originComplement,
          neighborhood: originNeighborhood,
          city: originCity,
          state: originState
        }
      }).catch(console.error);
    }

    setData({
      ...data,
      origin: originFull,
      destination: destFull,
      notes: `${itemDescription ? `Item: ${itemDescription}. ` : ''}${notes}`,
      price: calculatedPrice || 12.50, // fallback
      distance: calculatedDistance || 0,
      originLocation: originCoords || undefined,
      destinationLocation: destCoords || undefined
    });
    onRequestDelivery();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="h-full w-full bg-[#0f1c2c] relative flex flex-col overflow-hidden"
    >
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-[#0f1c2c] flex justify-between items-center px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-white/5 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-xl font-extrabold text-white tracking-tight">Nova Corrida</h1>
        </div>
        <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
          <img src={profile?.profilePic || ASSETS.PROFILE_PIC} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
      </header>

      <main className="flex-1 pt-20 px-6 pb-32 overflow-y-auto no-scrollbar">
        
        {/* Origin Section */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-4 h-4 rounded-full border-4 border-secondary-fixed flex items-center justify-center">
              <div className="w-1 h-1 bg-secondary-fixed rounded-full" />
            </div>
            <h2 className="text-sm font-bold text-white tracking-widest uppercase">Endereço de Coleta</h2>
          </div>
          
          <div className="space-y-3">
            <div className="flex gap-3">
              <input 
                type="text" 
                placeholder="00000-000" 
                value={formatCep(originCep)}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  const limited = val.slice(0, 8);
                  setOriginCep(limited);
                  if (limited.length === 8) fetchAddress(limited, 'origin');
                  else setOriginCepError(null);
                }}
                className={cn("flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-secondary-fixed focus:ring-1 focus:ring-secondary-fixed outline-none transition-all", originCepError && "border-red-500")}
              />
              {originCepError && <p className="text-red-500 text-[10px] mt-1">{originCepError}</p>}
              <button 
                type="button"
                onClick={() => fetchAddress(originCep, 'origin')}
                className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-secondary-fixed hover:bg-white/10 transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
            <input 
              type="text" 
              placeholder="Avenida Paulista" 
              value={originStreet}
              onChange={(e) => setOriginStreet(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-secondary-fixed focus:ring-1 focus:ring-secondary-fixed outline-none transition-all"
            />
            <div className="flex gap-3">
              <input 
                type="text" 
                placeholder="Nº *" 
                value={originNumber}
                onChange={(e) => setOriginNumber(e.target.value)}
                className="w-28 shrink-0 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-secondary-fixed focus:ring-1 focus:ring-secondary-fixed outline-none transition-all"
              />
              <input 
                type="text" 
                placeholder="Complemento" 
                value={originComplement}
                onChange={(e) => setOriginComplement(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-secondary-fixed focus:ring-1 focus:ring-secondary-fixed outline-none transition-all"
              />
            </div>
            <input 
              type="text" 
              placeholder="Bela Vista" 
              value={originNeighborhood}
              onChange={(e) => setOriginNeighborhood(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-secondary-fixed focus:ring-1 focus:ring-secondary-fixed outline-none transition-all"
            />
            <div className="flex gap-3">
              <input 
                type="text" 
                placeholder="São Paulo" 
                value={originCity}
                onChange={(e) => setOriginCity(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-secondary-fixed focus:ring-1 focus:ring-secondary-fixed outline-none transition-all"
              />
              <input 
                type="text" 
                placeholder="SP" 
                value={originState}
                onChange={(e) => setOriginState(e.target.value)}
                className="w-20 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 text-center focus:border-secondary-fixed focus:ring-1 focus:ring-secondary-fixed outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button 
                onClick={() => setSaveOrigin(!saveOrigin)}
                className={cn(
                  "w-12 h-6 rounded-full transition-colors relative",
                  saveOrigin ? "bg-secondary-fixed" : "bg-white/20"
                )}
              >
                <div className={cn(
                  "w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform",
                  saveOrigin ? "translate-x-6" : "translate-x-0.5"
                )} />
              </button>
              <span className="text-sm text-white/60">Salvar este endereço de coleta</span>
            </div>
          </div>
        </section>

        <div className="w-full h-px bg-white/5 mb-8" />

        {/* Destination Section */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-bold text-white tracking-widest uppercase">Endereço de Entrega</h2>
          </div>
          
          <div className="space-y-3">
            <div className="flex gap-3">
              <input 
                type="text" 
                placeholder="00000-000" 
                value={formatCep(destCep)}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  const limited = val.slice(0, 8);
                  setDestCep(limited);
                  if (limited.length === 8) fetchAddress(limited, 'dest');
                  else setDestCepError(null);
                }}
                className={cn("flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-secondary-fixed focus:ring-1 focus:ring-secondary-fixed outline-none transition-all", destCepError && "border-red-500")}
              />
              {destCepError && <p className="text-red-500 text-[10px] mt-1">{destCepError}</p>}
              <button 
                type="button"
                onClick={() => fetchAddress(destCep, 'dest')}
                className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-secondary-fixed hover:bg-white/10 transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
            <input 
              type="text" 
              placeholder="Rua / Logradouro" 
              value={destStreet}
              onChange={(e) => setDestStreet(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-secondary-fixed focus:ring-1 focus:ring-secondary-fixed outline-none transition-all"
            />
            <div className="flex gap-3">
              <input 
                type="text" 
                placeholder="Nº *" 
                value={destNumber}
                onChange={(e) => setDestNumber(e.target.value)}
                className="w-28 shrink-0 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-secondary-fixed focus:ring-1 focus:ring-secondary-fixed outline-none transition-all"
              />
              <input 
                type="text" 
                placeholder="Complemento" 
                value={destComplement}
                onChange={(e) => setDestComplement(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-secondary-fixed focus:ring-1 focus:ring-secondary-fixed outline-none transition-all"
              />
            </div>
            <input 
              type="text" 
              placeholder="Bairro" 
              value={destNeighborhood}
              onChange={(e) => setDestNeighborhood(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-secondary-fixed focus:ring-1 focus:ring-secondary-fixed outline-none transition-all"
            />
            <div className="flex gap-3">
              <input 
                type="text" 
                placeholder="Cidade" 
                value={destCity}
                onChange={(e) => setDestCity(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-secondary-fixed focus:ring-1 focus:ring-secondary-fixed outline-none transition-all"
              />
              <input 
                type="text" 
                placeholder="UF" 
                value={destState}
                onChange={(e) => setDestState(e.target.value)}
                className="w-20 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 text-center focus:border-secondary-fixed focus:ring-1 focus:ring-secondary-fixed outline-none transition-all"
              />
            </div>
          </div>
        </section>

        {/* Details Section */}
        <section className="mb-8">
          <h2 className="text-sm font-bold text-white tracking-widest uppercase mb-4">Detalhes do Pedido</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-white/60 uppercase tracking-widest mb-2">Descrição do Item</label>
              <input 
                type="text" 
                placeholder="Ex: Pizza Grande, Documentos..." 
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-secondary-fixed focus:ring-1 focus:ring-secondary-fixed outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-white/60 uppercase tracking-widest mb-2">Observações</label>
              <textarea 
                placeholder="Ex: Deixar na portaria, campainha estragada..." 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-secondary-fixed focus:ring-1 focus:ring-secondary-fixed outline-none transition-all resize-none"
              />
            </div>
          </div>
        </section>

        {/* Price Section */}
        <section className="mb-8">
          <div className="flex justify-between items-end mb-2">
            <label className="block text-[10px] font-bold text-white/60 uppercase tracking-widest">Valor da Corrida (R$)</label>
            {calculatedDistance && (
              <span className="text-[10px] font-bold text-secondary-fixed">~ {calculatedDistance.toFixed(1).replace('.', ',')} km</span>
            )}
          </div>
          <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 flex items-center gap-2">
            <span className="text-white/60 font-bold">R$</span>
            {isCalculating ? (
              <div className="w-24 h-8 bg-white/10 rounded animate-pulse" />
            ) : (
              <span className="text-2xl font-black text-white">
                {calculatedPrice ? calculatedPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '---'}
              </span>
            )}
          </div>
        </section>

      </main>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 w-full bg-[#0f1c2c] border-t border-white/5 p-4 flex flex-col gap-4 z-50">
        {formError && (
          <p className="text-red-500 text-xs text-center font-bold">{formError}</p>
        )}
        <div className="flex gap-4">
          <button 
            onClick={onBack}
            className="flex-1 py-4 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleRequest}
            disabled={isCalculating}
            className={cn(
              "flex-[2] py-4 rounded-xl bg-secondary-fixed text-[#0f1c2c] font-black active:scale-[0.98] transition-all flex items-center justify-center gap-2",
              isCalculating && "opacity-50 cursor-not-allowed"
            )}
          >
            {isCalculating ? (
              <>
                <div className="w-5 h-5 border-2 border-[#0f1c2c]/30 border-t-[#0f1c2c] rounded-full animate-spin" />
                Calculando...
              </>
            ) : (
              "Pagar e Solicitar"
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}