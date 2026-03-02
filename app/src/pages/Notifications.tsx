import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, 
  Bell, 
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
  Clock,
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';

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

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead
  } = useNotifications();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated]);

  const handleNotificationClick = async (notification: typeof notifications[0]) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    // La richiesta è già inclusa nella notifica
    if (notification.request) {
      toast.info(`Richiesta: ${notification.request.title}`);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Adesso';
    if (minutes < 60) return `${minutes}m fa`;
    if (hours < 24) return `${hours}h fa`;
    if (days < 7) return `${days}g fa`;
    return new Date(date).toLocaleDateString('it-IT');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-semibold">Notifiche</h1>
            {unreadCount > 0 && (
              <Badge variant="default" className="bg-red-500">
                {unreadCount}
              </Badge>
            )}
          </div>
          
          {notifications.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={markAllAsRead}
            >
              <Check className="w-4 h-4 mr-1" />
              Tutte lette
            </Button>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Bell className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Nessuna notifica
            </h2>
            <p className="text-gray-500 text-center max-w-xs">
              Riceverai notifiche quando ci sono nuove richieste nella tua zona che corrispondono alle tue preferenze
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-60px)]">
            <div className="p-4 space-y-3">
              {notifications.map((notification) => {
                const request = notification.request;
                if (!request) return null;

                const Icon = iconMap[request.category.icon] || Smartphone;
                
                return (
                  <Card 
                    key={notification.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      !notification.read ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Icona categoria */}
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
                            <div>
                              <p className="text-sm text-gray-500 mb-1">
                                Nuova richiesta in {request.city}
                              </p>
                              <h3 className="font-semibold text-gray-900 line-clamp-1">
                                {request.title}
                              </h3>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
                            )}
                          </div>

                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {request.description}
                          </p>

                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTimeAgo(notification.createdAt)}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {request.city}
                              </span>
                            </div>
                            
                            {request.budget && (
                              <span className="text-sm font-medium text-blue-600">
                                €{request.budget.toLocaleString()}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={request.user?.photo} />
                              <AvatarFallback className="text-xs">
                                {request.user?.name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-gray-600">
                              {request.user?.name}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </main>
    </div>
  );
};

export default Notifications;
