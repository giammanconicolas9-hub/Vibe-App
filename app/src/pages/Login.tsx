import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, ArrowRight, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [whatsapp, setWhatsapp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatsapp.trim()) {
      toast.error('Inserisci il numero di WhatsApp');
      return;
    }

    setLoading(true);
    const cleanWhatsapp = whatsapp.replace(/\D/g, '');
    
    if (cleanWhatsapp.length < 10) {
      toast.error('Numero non valido');
      setLoading(false);
      return;
    }

    const success = await login(cleanWhatsapp);
    if (success) {
      toast.success('Bentornato!');
      navigate('/');
    } else {
      toast.error('Utente non trovato. Registrati prima!');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-xl">
            <span className="text-4xl font-bold text-blue-600">LR</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">LocalRequest</h1>
          <p className="text-blue-100">L'app che inverte gli annunci</p>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Accedi</CardTitle>
            <CardDescription>
              Inserisci il tuo numero WhatsApp per accedere
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
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
                    className="pl-10 h-12 text-lg"
                    maxLength={13}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Inserisci il numero con prefisso 39 (es. 39333123456)
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-lg"
                disabled={loading}
              >
                {loading ? (
                  'Accesso in corso...'
                ) : (
                  <>
                    Accedi
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t text-center">
              <p className="text-gray-600 mb-4">Non hai un account?</p>
              <Button
                variant="outline"
                className="w-full h-12"
                onClick={() => navigate('/register')}
              >
                <UserPlus className="mr-2 w-5 h-5" />
                Registrati ora
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-blue-200 text-sm mt-6">
          Accedendo accetti i nostri Termini di Servizio e Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default Login;
