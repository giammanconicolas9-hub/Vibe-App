import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  User, 
  Phone, 
  MapPin, 
  Camera, 
  ArrowRight, 
  ArrowLeft, 
  Check,
  Smartphone,
  Car,
  Home,
  Briefcase,
  Wrench,
  Sofa,
  Shirt,
  Dumbbell,
  Book,
  Gamepad2,
  Music,
  Dog
} from 'lucide-react';
import { toast } from 'sonner';
import { CATEGORIES, ITALIAN_CITIES } from '@/types';
import type { Category } from '@/types';

const STEPS = ['Dati personali', 'La tua città', 'Preferenze', 'Conferma'];

const iconMap: Record<string, React.ElementType> = {
  smartphone: Smartphone,
  car: Car,
  home: Home,
  briefcase: Briefcase,
  wrench: Wrench,
  sofa: Sofa,
  shirt: Shirt,
  dumbbell: Dumbbell,
  book: Book,
  'gamepad-2': Gamepad2,
  music: Music,
  dog: Dog,
};

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Form data
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [photo, setPhoto] = useState<string>('');
  const [city, setCity] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleCategory = (category: Category) => {
    setSelectedCategories(prev => {
      const exists = prev.find(c => c.id === category.id);
      if (exists) {
        return prev.filter(c => c.id !== category.id);
      }
      if (prev.length >= 5) {
        toast.warning('Puoi selezionare massimo 5 categorie');
        return prev;
      }
      return [...prev, category];
    });
  };

  const validateStep = () => {
    switch (currentStep) {
      case 0:
        if (!name.trim()) {
          toast.error('Inserisci il tuo nome');
          return false;
        }
        if (!whatsapp.trim() || whatsapp.replace(/\D/g, '').length < 10) {
          toast.error('Inserisci un numero WhatsApp valido');
          return false;
        }
        return true;
      case 1:
        if (!city) {
          toast.error('Seleziona la tua città');
          return false;
        }
        return true;
      case 2:
        if (selectedCategories.length === 0) {
          toast.error('Seleziona almeno una categoria');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(prev => prev + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    const province = ITALIAN_CITIES.find(c => c === city) 
      ? ITALIAN_CITIES.find(c => c === city)!.substring(0, 2).toUpperCase()
      : 'RM';

    const success = await register({
      name,
      whatsapp: whatsapp.replace(/\D/g, ''),
      photo: photo || undefined,
      city,
      province,
      preferences: selectedCategories,
    });

    if (success) {
      toast.success('Registrazione completata!');
      navigate('/');
    } else {
      toast.error('Errore durante la registrazione');
    }
    setLoading(false);
  };

  const formatWhatsapp = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    if (cleaned.length <= 10) return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 10)}`;
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <div 
                onClick={handlePhotoClick}
                className="relative cursor-pointer group"
              >
                <Avatar className="w-28 h-28 border-4 border-blue-100">
                  <AvatarImage src={photo} />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-2xl">
                    <Camera className="w-10 h-10" />
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
              <p className="text-sm text-gray-500">Tocca per aggiungere foto</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="name"
                  placeholder="Es. Marco Rossi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">Numero WhatsApp</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="whatsapp"
                  type="tel"
                  placeholder="Es. 333 123 4567"
                  value={formatWhatsapp(whatsapp)}
                  onChange={(e) => setWhatsapp(e.target.value.replace(/\s/g, ''))}
                  className="pl-10 h-12"
                  maxLength={13}
                />
              </div>
              <p className="text-xs text-gray-500">
                Il numero sarà usato per i contatti
              </p>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Seleziona la tua città</Label>
              <p className="text-sm text-gray-500">
                Riceverai annunci solo dalla tua zona
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto p-1">
              {ITALIAN_CITIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCity(c)}
                  className={`p-3 rounded-lg text-left transition-all ${
                    city === c
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-medium truncate">{c}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Scegli le categorie di interesse</Label>
              <p className="text-sm text-gray-500">
                Seleziona fino a 5 categorie. Riceverai notifiche solo per queste.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto p-1">
              {CATEGORIES.map((category) => {
                const Icon = iconMap[category.icon] || Smartphone;
                const isSelected = selectedCategories.some(c => c.id === category.id);
                
                return (
                  <button
                    key={category.id}
                    onClick={() => toggleCategory(category)}
                    className={`p-3 rounded-lg text-left transition-all ${
                      isSelected
                        ? 'shadow-lg'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                    style={{
                      backgroundColor: isSelected ? category.color : undefined,
                      color: isSelected ? 'white' : undefined,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm font-medium">{category.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {selectedCategories.map((cat) => (
                <Badge 
                  key={cat.id}
                  style={{ backgroundColor: cat.color }}
                  className="text-white"
                >
                  {cat.name}
                </Badge>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Tutto pronto!</h3>
              <p className="text-gray-600">
                Ecco un riepilogo del tuo profilo
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={photo} />
                  <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{name}</p>
                  <p className="text-sm text-gray-500">{formatWhatsapp(whatsapp)}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 mb-1">Zona</p>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">{city}</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 mb-2">Categorie selezionate</p>
                <div className="flex flex-wrap gap-2">
                  {selectedCategories.map((cat) => (
                    <Badge 
                      key={cat.id}
                      style={{ backgroundColor: cat.color }}
                      className="text-white"
                    >
                      {cat.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Crea account</h1>
          <p className="text-blue-100 text-sm">Passo {currentStep + 1} di {STEPS.length}</p>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardHeader className="pb-2">
            <Progress value={progress} className="mb-4" />
            <CardTitle className="text-xl">{STEPS[currentStep]}</CardTitle>
            <CardDescription>
              {currentStep === 0 && 'Inserisci i tuoi dati personali'}
              {currentStep === 1 && 'Scegli dove ricevere annunci'}
              {currentStep === 2 && 'Cosa ti interessa?'}
              {currentStep === 3 && 'Verifica i tuoi dati'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderStep()}

            <div className="flex gap-3 mt-6">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1 h-12"
                >
                  <ArrowLeft className="mr-2 w-5 h-5" />
                  Indietro
                </Button>
              )}
              
              {currentStep < STEPS.length - 1 ? (
                <Button
                  onClick={handleNext}
                  className="flex-1 h-12"
                >
                  Avanti
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  className="flex-1 h-12 bg-green-600 hover:bg-green-700"
                  disabled={loading}
                >
                  {loading ? 'Registrazione...' : 'Completa registrazione'}
                  <Check className="ml-2 w-5 h-5" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-blue-200 text-sm mt-4">
          Hai già un account?{' '}
          <button 
            onClick={() => navigate('/login')}
            className="text-white underline"
          >
            Accedi
          </button>
        </p>
      </div>
    </div>
  );
};

export default Register;
