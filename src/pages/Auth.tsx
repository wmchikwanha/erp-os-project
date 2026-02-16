import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';

const PASSWORD_RULES = [
  { label: 'At least 6 characters', test: (p: string) => p.length >= 6 },
  { label: 'Contains a letter', test: (p: string) => /[a-zA-Z]/.test(p) },
  { label: 'Contains a number', test: (p: string) => /\d/.test(p) },
  { label: 'Contains a symbol', test: (p: string) => /[^a-zA-Z0-9]/.test(p) },
];

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const passwordValid = useMemo(
    () => PASSWORD_RULES.every((r) => r.test(password)),
    [password]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast({ title: 'Check your email', description: 'We sent you a password reset link.' });
        setMode('login');
      } else if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/');
      } else {
        if (!passwordValid) {
          toast({ title: 'Weak password', description: 'Password must contain letters, numbers, and symbols (min 6 chars).', variant: 'destructive' });
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;
        toast({ title: 'Check your email', description: 'We sent you a confirmation link to verify your account.' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const heading = mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Reset Password';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-lg font-bold text-primary-foreground">S</span>
          </div>
          <h1 className="text-xl font-semibold">StratedgeOS CRM</h1>
          <p className="text-sm text-muted-foreground mt-1">Enterprise Suite</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-sm font-semibold mb-4">{heading}</h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <Input
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            )}

            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {mode !== 'forgot' && (
              <>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {mode === 'signup' && password.length > 0 && (
                  <ul className="space-y-1 text-[11px]">
                    {PASSWORD_RULES.map((rule) => (
                      <li key={rule.label} className={rule.test(password) ? 'text-green-600' : 'text-muted-foreground'}>
                        {rule.test(password) ? '✓' : '○'} {rule.label}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}

            {mode === 'login' && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  <Checkbox
                    checked={rememberMe}
                    onCheckedChange={(v) => setRememberMe(v === true)}
                    className="h-3.5 w-3.5"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || (mode === 'signup' && !passwordValid && password.length > 0)}
            >
              {loading
                ? 'Please wait...'
                : mode === 'login'
                ? 'Sign In'
                : mode === 'signup'
                ? 'Sign Up'
                : 'Send Reset Link'}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-4">
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <button type="button" onClick={() => setMode('signup')} className="text-primary font-medium hover:underline">Sign Up</button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button type="button" onClick={() => setMode('login')} className="text-primary font-medium hover:underline">Sign In</button>
              </>
            )}
          </p>
        </div>

        <p className="text-[10px] text-muted-foreground text-center mt-6">
          Build · Operate · It's Yours™
        </p>
      </div>
    </div>
  );
}
