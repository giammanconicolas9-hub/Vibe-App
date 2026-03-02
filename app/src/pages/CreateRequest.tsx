import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/backend/api';
import type { Category } from '@/types';
import { CATEGORIES } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  Camera, 
  X, 
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
  Dog,
  AlertCircle,
  Clock,
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

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

const STEPS = ['Categoria', 'Dettagli', 'Foto', 'Conferma'];

const URGENCY_OPTIONS = [
  { value: 'low', label: 'Bassa', description: 'Ho tempo, nessuna fretta' },
  { value: 'medium', label: 'Media', description: 'Preferirei trovarlo presto' },
  { value: 'high', label: 'Alta', description: 'Ne ho bisogno urgentemente' },
];

const EXPIRY_OPTIONS = [
  { value: 3, label: '3 giorni' },
  { value: 7, label: '7 giorni' },
  { value: 14, label: '14 giorni' },
  { value: 30, label: '30 giorni' },
];

const CreateRequest: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Form data
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium');
  const [expiryDays, setExpiryDays] = useState(7);
  const [images, setImages] = useState<string[]>([]);

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleImageClick = () => {
    if (images.length >= 3) {
      toast.warning('Massimo 3 foto');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const validateStep = () => {
    switch (currentStep) {
      case 0:
        if (!selectedCategory) {
          toast.error('Seleziona una categoria');
          return false;
        }
        return true;
      case 1:
        if (!title.trim()) {
          toast.error('Inserisci un titolo');
          return false;
        }
        if (title.length < 5) {
          toast.error('Il titolo deve essere di almeno 5 caratteri');
          return false;
        }
        if (!description.trim()) {
          toast.error('Inserisci una descrizione');
          return false;
        }
        return true;
      case 2:
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
    } else {
      navigate('/');
    }
  };

  const handleSubmit = async () => {
    if (!selectedCategory || !user) return;
    
    setLoading(true);
    
    try {
      api.createRequest({
        userId: user.id,
        title: title.trim(),
        description: description.trim(),
        category: selectedCategory,
        city: user.city,
        province: user.province,
        images,
        budget: budget ? parseInt(budget) : undefined,
        urgency,
        status: 'active',
        expiresAt: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000),
      });

      toast.success('Richiesta pubblicata con successo!');
      navigate('/');
    } catch (error) {
      toast.error('Errore durante la pubblicazione');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Seleziona categoria</Label>
              <p className="text-sm text-gray-500">
                Scegli la categoria più adatta per la tua richiesta
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto p-1">
              {CATEGORIES.map((category) => {
                const Icon = iconMap[category.icon] || Smartphone;
                const isSelected = selectedCategory?.id === category.id;
                
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category)}
                    className={`p-4 rounded-xl text-left transition-all border-2 ${
                      isSelected
                        ? 'border-blue-600 shadow-lg'
                        : 'border-transparent bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <Icon 
                        className="w-6 h-6" 
                        style={{ color: category.color }}
                      />
                    </div>
                    <span className="font-medium text-sm">{category.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Titolo</Label>
              <Input
                id="title"
                placeholder="Es. Cerco iPhone 14 Pro"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-12"
                maxLength={50}
              />
              <p className="text-xs text-gray-500 text-right">
                {title.length}/50
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrizione</Label>
              <Textarea
                id="description"
                placeholder="Descrivi cosa stai cercando in dettaglio..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-32 resize-none"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 text-right">
                {description.length}/500
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Budget (opzionale)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                <Input
                  id="budget"
                  type="number"
                  placeholder="Es. 500"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="pl-8 h-12"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Urgente</Label>
              <RadioGroup 
                value={urgency} 
                onValueChange={(v) => setUrgency(v as 'low' | 'medium' | 'high')}
                className="space-y-2"
              >
                {URGENCY_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center space-x-3">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                      <span className="font-medium">{option.label}</span>
                      <p className="text-sm text-gray-500">{option.description}</p>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label>Durata annuncio</Label>
              <div className="grid grid-cols-4 gap-2">
                {EXPIRY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setExpiryDays(option.value)}
                    className={`p-3 rounded-lg text-sm font-medium transition-all ${
                      expiryDays === option.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Aggiungi foto (opzionale)</Label>
              <p className="text-sm text-gray-500">
                Aggiungi fino a 3 foto per aiutare gli altri a capire cosa cerchi
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {images.map((img, index) => (
                <div key={index} className="relative aspect-square">
                  <img
                    src={img}
                    alt={`Foto ${index + 1}`}
                    className="w-full h-full object-cover rounded-xl"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {images.length < 3 && (
                <button
                  onClick={handleImageClick}
                  className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <Camera className="w-8 h-8 text-gray-400" />
                  <span className="text-sm text-gray-500">Aggiungi</span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Pronto per pubblicare?</h3>
              <p className="text-gray-600">
                Ecco un riepilogo della tua richiesta
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-4">
              {selectedCategory && (
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${selectedCategory.color}20` }}
                  >
                    {React.createElement(iconMap[selectedCategory.icon] || Smartphone, {
                      className: 'w-5 h-5',
                      style: { color: selectedCategory.color }
                    })}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Categoria</p>
                    <p className="font-medium">{selectedCategory.name}</p>
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 mb-1">Titolo</p>
                <p className="font-medium">{title}</p>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 mb-1">Descrizione</p>
                <p className="text-sm text-gray-700">{description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Budget</p>
                  <p className="font-medium">{budget ? `€${budget}` : 'Non specificato'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Urgenza</p>
                  <Badge variant="secondary">
                    {URGENCY_OPTIONS.find(u => u.value === urgency)?.label}
                  </Badge>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{user.city}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                  <Clock className="w-4 h-4" />
                  <span>Scade tra {expiryDays} giorni</span>
                </div>
              </div>

              {images.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-500 mb-2">Foto ({images.length})</p>
                  <div className="grid grid-cols-3 gap-2">
                    {images.map((img, i) => (
                      <img key={i} src={img} alt="" className="rounded-lg aspect-square object-cover" />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-blue-50 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-700">
                La tua richiesta sarà notificata istantaneamente agli utenti di {user.city} 
                che hanno selezionato questa categoria nelle preferenze.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold">Nuova richiesta</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto p-4">
        <Card>
          <CardHeader className="pb-2">
            <Progress value={progress} className="mb-4" />
            <CardTitle className="text-xl">{STEPS[currentStep]}</CardTitle>
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
                  Indietro
                </Button>
              )}
              
              {currentStep < STEPS.length - 1 ? (
                <Button
                  onClick={handleNext}
                  className="flex-1 h-12"
                >
                  Avanti
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  className="flex-1 h-12 bg-green-600 hover:bg-green-700"
                  disabled={loading}
                >
                  {loading ? 'Pubblicazione...' : 'Pubblica richiesta'}
                  <Check className="ml-2 w-5 h-5" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CreateRequest;
