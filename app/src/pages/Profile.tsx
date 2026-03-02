import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Camera, 
  User, 
  Phone, 
  MapPin, 
  LogOut,
  Save,
  Edit3,
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
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import { CATEGORIES } from '@/types';

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

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, updateProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Edit form
  const [name, setName] = useState(user?.name || '');
  const [photo, setPhoto] = useState(user?.photo || '');
  const [selectedCategories, setSelectedCategories] = useState(user?.preferences || []);

  if (!isAuthenticated || !user) {
    navigate('/login');
    return null;
  }

  const handlePhotoClick = () => {
    if (!editing) return;
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

  const toggleCategory = (category: typeof CATEGORIES[0]) => {
    if (!editing) return;
    
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

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Inserisci il tuo nome');
      return;
    }

    if (selectedCategories.length === 0) {
      toast.error('Seleziona almeno una categoria');
      return;
    }

    setLoading(true);
    
    const success = await updateProfile({
      name: name.trim(),
      photo: photo || undefined,
      preferences: selectedCategories,
    });

    if (success) {
      toast.success('Profilo aggiornato!');
      setEditing(false);
    } else {
      toast.error('Errore durante l\'aggiornamento');
    }
    
    setLoading(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.info('Hai effettuato il logout');
  };

  const formatWhatsapp = (whatsapp: string) => {
    if (whatsapp.length < 10) return whatsapp;
    return `+${whatsapp.slice(0, 2)} ${whatsapp.slice(2, 5)} ${whatsapp.slice(5, 8)} ${whatsapp.slice(8)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-semibold">Il mio profilo</h1>
          </div>
          
          {!editing ? (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setEditing(true)}
            >
              <Edit3 className="w-4 h-4 mr-1" />
              Modifica
            </Button>
          ) : (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setEditing(false);
                setName(user.name);
                setPhoto(user.photo || '');
                setSelectedCategories(user.preferences);
              }}
            >
              Annulla
            </Button>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto p-4 space-y-4">
        {/* Profile Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center">
              <div 
                onClick={handlePhotoClick}
                className={`relative ${editing ? 'cursor-pointer group' : ''}`}
              >
                <Avatar className="w-28 h-28 border-4 border-blue-100">
                  <AvatarImage src={editing ? photo : user.photo} />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-3xl">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {editing && (
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                )}
              </div>
              
              {editing && (
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              )}

              <div className="mt-4 text-center w-full">
                {editing ? (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="name">Nome</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="text-center h-12"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-bold">{user.name}</h2>
                    <p className="text-gray-500 flex items-center justify-center gap-2 mt-1">
                      <Phone className="w-4 h-4" />
                      {formatWhatsapp(user.whatsapp)}
                    </p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              La mia zona
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold">{user.city}</p>
                <p className="text-sm text-gray-500">Provincia di {user.province}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-3">
              Ricevi annunci solo da questa zona. Per cambiare città, contatta il supporto.
            </p>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-purple-600" />
              Preferenze
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-gray-500 mb-4">
              {editing 
                ? 'Seleziona le categorie di annunci che vuoi ricevere (max 5):'
                : 'Ricevi notifiche per queste categorie:'
              }
            </p>
            
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((category) => {
                const Icon = iconMap[category.icon] || Smartphone;
                const isSelected = selectedCategories.some(c => c.id === category.id);
                
                return (
                  <button
                    key={category.id}
                    onClick={() => toggleCategory(category)}
                    disabled={!editing}
                    className={`p-3 rounded-lg text-left transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'shadow-md'
                        : editing ? 'bg-gray-100 hover:bg-gray-200' : 'bg-gray-50 opacity-50'
                    } ${!editing && !isSelected ? 'hidden' : ''}`}
                    style={{
                      backgroundColor: isSelected ? category.color : undefined,
                      color: isSelected ? 'white' : undefined,
                    }}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-medium">{category.name}</span>
                    {isSelected && editing && (
                      <Check className="w-4 h-4 ml-auto" />
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Statistiche</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {user.preferences.length}
                </p>
                <p className="text-xs text-blue-700">Categorie</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {new Date(user.createdAt).toLocaleDateString('it-IT', { month: 'short' })}
                </p>
                <p className="text-xs text-green-700">Iscritto dal</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{user.city}</p>
                <p className="text-xs text-purple-700">Zona</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        {editing && (
          <Button
            className="w-full h-12"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? (
              'Salvataggio...'
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Salva modifiche
              </>
            )}
          </Button>
        )}

        {/* Logout */}
        <Separator className="my-4" />
        
        <Button
          variant="outline"
          className="w-full h-12 text-red-600 border-red-200 hover:bg-red-50"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-2" />
          Esci dall'account
        </Button>

        <p className="text-center text-xs text-gray-400 pb-4">
          LocalRequest v1.0.0
        </p>
      </main>
    </div>
  );
};

export default Profile;
