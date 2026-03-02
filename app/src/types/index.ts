export interface User {
  id: string;
  name: string;
  photo?: string;
  whatsapp: string;
  city: string;
  province: string;
  latitude?: number;
  longitude?: number;
  preferences: Category[];
  createdAt: Date;
  fcmToken?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface RequestAd {
  id: string;
  userId: string;
  user?: User;
  title: string;
  description: string;
  category: Category;
  city: string;
  province: string;
  latitude?: number;
  longitude?: number;
  images: string[];
  budget?: number;
  urgency: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'cancelled';
  views: number;
  contacts: number;
  createdAt: Date;
  expiresAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  requestId: string;
  request?: RequestAd;
  read: boolean;
  createdAt: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const CATEGORIES: Category[] = [
  { id: '1', name: 'Elettronica', icon: 'smartphone', color: '#3B82F6' },
  { id: '2', name: 'Auto', icon: 'car', color: '#EF4444' },
  { id: '3', name: 'Immobili', icon: 'home', color: '#10B981' },
  { id: '4', name: 'Lavoro', icon: 'briefcase', color: '#F59E0B' },
  { id: '5', name: 'Servizi', icon: 'wrench', color: '#8B5CF6' },
  { id: '6', name: 'Arredamento', icon: 'sofa', color: '#EC4899' },
  { id: '7', name: 'Abbigliamento', icon: 'shirt', color: '#06B6D4' },
  { id: '8', name: 'Sport', icon: 'dumbbell', color: '#84CC16' },
  { id: '9', name: 'Libri', icon: 'book', color: '#F97316' },
  { id: '10', name: 'Giochi', icon: 'gamepad-2', color: '#6366F1' },
  { id: '11', name: 'Musica', icon: 'music', color: '#14B8A6' },
  { id: '12', name: 'Animali', icon: 'dog', color: '#A855F7' },
];

export const ITALIAN_CITIES = [
  'Roma', 'Milano', 'Napoli', 'Torino', 'Palermo', 'Genova', 'Bologna', 'Firenze',
  'Bari', 'Catania', 'Venezia', 'Verona', 'Messina', 'Padova', 'Trieste', 'Brescia',
  'Parma', 'Taranto', 'Prato', 'Modena', 'Reggio Calabria', 'Reggio Emilia', 'Perugia',
  'Livorno', 'Ravenna', 'Cagliari', 'Foggia', 'Rimini', 'Salerno', 'Ferrara'
];

export const PROVINCES: Record<string, string> = {
  'Roma': 'RM', 'Milano': 'MI', 'Napoli': 'NA', 'Torino': 'TO', 'Palermo': 'PA',
  'Genova': 'GE', 'Bologna': 'BO', 'Firenze': 'FI', 'Bari': 'BA', 'Catania': 'CT',
  'Venezia': 'VE', 'Verona': 'VR', 'Messina': 'ME', 'Padova': 'PD', 'Trieste': 'TS',
  'Brescia': 'BS', 'Parma': 'PR', 'Taranto': 'TA', 'Prato': 'PO', 'Modena': 'MO',
  'Reggio Calabria': 'RC', 'Reggio Emilia': 'RE', 'Perugia': 'PG', 'Livorno': 'LI',
  'Ravenna': 'RA', 'Cagliari': 'CA', 'Foggia': 'FG', 'Rimini': 'RN', 'Salerno': 'SA',
  'Ferrara': 'FE'
};
