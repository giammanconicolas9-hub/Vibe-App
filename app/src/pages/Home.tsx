import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { requestsAPI, authAPI } from '@/services/api';
import type { RequestAd } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  Plus, 
  MapPin, 
  Clock, 
  Eye, 
  MessageCircle,
  Search,
  Menu,
  Smartphone,
  Car,
  Home as HomeIcon,
  Briefcase,
  Wrench,
  Sofa,
  Shirt,
  Dumbbell,
  Book,
  Gamepad2,
  Music,
  Dog,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

const iconMap: Record<string, React.ElementType> = {
  smartphone: Smartphone,
  car: Car,
  home: HomeIcon,
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

const urgencyColors = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
};

const urgencyLabels = {
  low: 'Bassa',
  medium: 'Media',
  high: 'Alta',
};

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { unreadCount } = useNotifications();
  
  const [feedRequests, setFeedRequests] = useState<RequestAd[]>([]);
  const [myRequests, setMyRequests] = useState<RequestAd[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    availableRequests: 0,
    myActiveRequests: 0,
    myTotalRequests: 0
  });

  const loadData = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const [feedResponse, myResponse, statsResponse] = await Promise.all([
        requestsAPI.getFeed({ limit: 50 }),
        requestsAPI.getMyRequests({ limit: 50 }),
        requestsAPI.getStats()
      ]);

      if (feedResponse.success) {
        setFeedRequests(feedResponse.data.requests);
      }

      if (myResponse.success) {
        setMyRequests(myResponse.data.requests);
      }

      if (statsResponse.success) {
        setStats(statsResponse.data);
      }
    } catch (error) {
      console.error('Errore caricamento dati:', error);
      toast.error('Errore caricamento dati');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user) {
      loadData();
    }
  }, [isAuthenticated, authLoading, user, navigate, loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    toast.success('Aggiornato!');
  };

  const filteredRequests = selectedCategory
    ? feedRequests.filter(r => r.category.id === selectedCategory)
    : feedRequests;

  const handleContact = async (request: RequestAd) => {
    try {
      const response = await requestsAPI.contactRequest(request.id);
      
      if (response.success) {
        const message = encodeURIComponent(
          `Ciao! Ho visto la tua richiesta su LocalRequest: "${request.title}". Posso aiutarti!`
        );
        const whatsappUrl = `https://wa.me/${response.data.whatsapp}?text=${message}`;
        window.open(whatsappUrl, '_blank');
        
        // Aggiorna conteggio contatti localmente
        setFeedRequests(prev =>
          prev.map(r =>
            r.id === request.id ? { ...r, contacts: r.contacts + 1 } : r
          )
        );
      }
    } catch (error) {
      toast.error('Errore durante il contatto');
    }
  };

  const formatTimeAgo = (date: string | Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Adesso';
    if (minutes < 60) return `${minutes}m fa`;
    if (hours < 24) return `${hours}h fa`;
    return `${days}g fa`;
  };

  const formatBudget = (budget?: number) => {
    if (!budget) return 'Budget non specificato';
    return `€${budget.toLocaleString()}`;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">LR</span>
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">LocalRequest</h1>
              <p className="text-xs text-gray-500">{user?.city}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => navigate('/notifications')}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-2">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => navigate('/profile')}
                  >
                    <Avatar className="w-6 h-6 mr-2">
                      <AvatarImage src={user?.photo} />
                      <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    Profilo
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-red-600"
                    onClick={() => {
                      authAPI.logout();
                      navigate('/login');
                    }}
                  >
                    Esci
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto pb-24">
        {/* Stats */}
        <div className="px-4 py-4">
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-blue-50 border-blue-100">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.availableRequests}</p>
                <p className="text-xs text-blue-700">Annunci per te</p>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-100">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-green-600">{stats.myActiveRequests}</p>
                <p className="text-xs text-green-700">Le tue richieste</p>
              </CardContent>
            </Card>
            <Card className="bg-purple-50 border-purple-100">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-purple-600">{unreadCount}</p>
                <p className="text-xs text-purple-700">Notifiche</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="feed" className="w-full">
          <div className="px-4">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="feed">Annunci per te</TabsTrigger>
              <TabsTrigger value="my">Le mie richieste</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="feed" className="mt-4">
            {/* Category Filter */}
            <div className="px-4 mb-4">
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-2 pb-2">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedCategory === null
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border'
                    }`}
                  >
                    Tutti
                  </button>
                  {user?.preferences.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedCategory === cat.id
                          ? 'text-white'
                          : 'bg-white text-gray-700 border'
                      }`}
                      style={{
                        backgroundColor: selectedCategory === cat.id ? cat.color : undefined,
                      }}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Feed */}
            <div className="px-4 space-y-4">
              {filteredRequests.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Nessun annuncio trovato
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Non ci sono richieste nella tua zona per le categorie selezionate
                  </p>
                </div>
              ) : (
                filteredRequests.map((request) => {
                  const Icon = iconMap[request.category.icon] || Smartphone;
                  
                  return (
                    <Card key={request.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div 
                            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${request.category.color}20` }}
                          >
                            <Icon 
                              className="w-6 h-6" 
                              style={{ color: request.category.color }}
                            />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-semibold text-gray-900 line-clamp-1">
                                {request.title}
                              </h3>
                              <Badge 
                                variant="secondary" 
                                className={urgencyColors[request.urgency]}
                              >
                                {urgencyLabels[request.urgency]}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {request.description}
                            </p>
                            
                            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {request.city}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTimeAgo(request.createdAt)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {request.views}
                              </span>
                            </div>

                            <div className="flex items-center justify-between mt-4 pt-3 border-t">
                              <div className="flex items-center gap-2">
                                <Avatar className="w-6 h-6">
                                  <AvatarImage src={request.user?.photo} />
                                  <AvatarFallback className="text-xs">
                                    {request.user?.name?.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm text-gray-600">
                                  {request.user?.name?.split(' ')[0]}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-blue-600">
                                  {formatBudget(request.budget)}
                                </span>
                                <Button
                                  size="sm"
                                  className="h-8 bg-green-600 hover:bg-green-700"
                                  onClick={() => handleContact(request)}
                                >
                                  <MessageCircle className="w-4 h-4 mr-1" />
                                  Contatta
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="my" className="mt-4 px-4 space-y-4">
            {myRequests.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Nessuna richiesta
                </h3>
                <p className="text-gray-500 text-sm mb-4">
                  Pubblica la tua prima richiesta per trovare ciò che cerchi
                </p>
              </div>
            ) : (
              myRequests.map((request) => {
                const Icon = iconMap[request.category.icon] || Smartphone;
                
                return (
                  <Card key={request.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${request.category.color}20` }}
                        >
                          <Icon 
                            className="w-6 h-6" 
                            style={{ color: request.category.color }}
                          />
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {request.title}
                          </h3>
                          
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {request.views} visualizzazioni
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="w-3 h-3" />
                              {request.contacts} contatti
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-3">
                            <Badge 
                              variant={request.status === 'active' ? 'default' : 'secondary'}
                            >
                              {request.status === 'active' ? 'Attiva' : 'Completata'}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              Scade: {new Date(request.expiresAt).toLocaleDateString('it-IT')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* FAB */}
      <div className="fixed bottom-6 right-4 z-50">
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg"
          onClick={() => navigate('/create')}
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
};

export default Home;
