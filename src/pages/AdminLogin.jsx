import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { getAdminHomePath, isAdminAuthenticated, loginAdmin } from '../services/adminAuth';

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAdminAuthenticated()) {
    return <Navigate to={getAdminHomePath()} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      await loginAdmin(email, password);
      toast.success('Connexion admin reussie');
      navigate(location.state?.from || getAdminHomePath(), { replace: true });
    } catch (error) {
      toast.error(error.message || 'Connexion impossible');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background font-inter flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 space-y-5"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center">
            <Lock className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-inter font-bold text-foreground text-lg">Connexion admin</h1>
            <p className="font-inter text-xs text-muted-foreground">Accès réservé au personnel</p>
          </div>
        </div>

        <div className="space-y-3">
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            className="bg-secondary border-border font-inter"
            required
          />
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Mot de passe"
            className="bg-secondary border-border font-inter"
            required
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-primary-foreground font-inter font-bold h-11 rounded-xl"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Se connecter
        </Button>
      </form>
    </div>
  );
}
