
import React, { useState, useEffect } from 'react';
import { Mail, Lock, Truck, ArrowRight, Quote as QuoteIcon, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { LOGIN_QUOTES } from '../../constants';
import { UserRole } from '../../types';
import { db } from '../../services/db';

interface LoginViewProps {
  onLogin: (data: { role: UserRole; email?: string; name?: string; id?: string; phone?: string; points?: number; status?: string; address?: string }, remember: boolean) => void;
  onNavigate: (view: 'login' | 'register' | 'forgot-password') => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false); // State untuk Ingat Saya
  const [isLoading, setIsLoading] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [apiError, setApiError] = useState<string | null>(null);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % LOGIN_QUOTES.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    if (!email.includes('@')) newErrors.email = "Format email tidak valid";
    if(password.length < 1) newErrors.password = "Password wajib diisi";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
        const user = await db.loginUser({ email, password });
        onLogin({
            ...user, 
            role: user.role as UserRole 
        }, rememberMe); // Kirim status rememberMe
    } catch (error: any) {
        console.error("Login Failed:", error);
        let errorMessage = error.message || "Email atau password salah.";
        if (errorMessage.toLowerCase().includes("password salah") || errorMessage.toLowerCase().includes("user not found")) {
            errorMessage = "Email/password salah";
        }
        setApiError(errorMessage);
    } finally {
        setIsLoading(false);
    }
  };

  const currentQuote = LOGIN_QUOTES[quoteIndex];

  return (
    <div className="flex w-full h-screen bg-[#FDFBF7] font-sans text-stone-900 overflow-hidden relative selection:bg-orange-500 selection:text-white">
      
      {/* Background Ambience (Cerah) */}
      <div className="absolute top-[-20%] left-[-10%] w-[900px] h-[900px] bg-orange-100/50 rounded-full blur-[150px] pointer-events-none z-0 opacity-80"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] bg-gradient-to-br from-orange-200 to-yellow-200 rounded-full blur-[200px] pointer-events-none z-0 opacity-40"></div>
      
      {/* Left Side - Hero Section (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-7/12 relative flex-col justify-between p-16 overflow-hidden border-r border-stone-200 h-full">
        <div className="absolute inset-0 z-0">
            {/* Bright Aesthetic Food Image */}
            <img 
                src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1080&auto=format&fit=crop" 
                alt="Background" 
                className="w-full h-full object-cover opacity-40 mix-blend-multiply scale-105" 
            />
            {/* Overlay Gradient: Solid Light to Transparent */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#FDFBF7] via-[#FDFBF7]/90 to-transparent"></div>
        </div>

        {/* Brand */}
        <div className="relative z-10 flex items-center gap-4 animate-in slide-in-from-top-10 duration-700">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#F97316] to-[#FBBF24] flex items-center justify-center shadow-[0_10px_30px_rgba(249,115,22,0.2)] border border-orange-200">
                <Truck className="w-8 h-8 text-white fill-current transform -scale-x-100" />
            </div>
            <div>
                <span className="text-5xl font-black tracking-tighter text-stone-900 block leading-none">FOOD AI</span>
                <span className="text-sm font-bold text-orange-600 tracking-[0.35em] block mt-1 uppercase">Rescue Platform</span>
            </div>
        </div>

        {/* Quote */}
        <div className="relative z-10 max-w-2xl mb-12">
            <h1 className="text-7xl font-black leading-[0.9] mb-12 tracking-tight text-stone-900">
                <span className="text-stone-400">STOP</span> WASTING.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-orange-500 to-yellow-600">START SHARING.</span>
            </h1>
            
            <div className="relative pl-8 border-l-4 border-orange-600 py-4 bg-gradient-to-r from-orange-50 to-transparent rounded-r-3xl pr-8 backdrop-blur-sm border-t border-t-white border-b border-b-white">
                 <QuoteIcon className="absolute -top-6 -left-6 w-12 h-12 text-orange-600 fill-orange-600 opacity-10" />
                 <p className="text-2xl text-stone-800 font-serif italic leading-relaxed tracking-wide">"{currentQuote.text}"</p>
                 <div className="flex items-center gap-3 mt-6">
                    <div className="h-0.5 w-12 bg-gradient-to-r from-orange-500 to-yellow-500"></div>
                    <p className="text-sm font-black text-orange-600 uppercase tracking-widest">{currentQuote.author}</p>
                 </div>
            </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-5/12 flex items-center justify-center p-6 lg:p-16 relative z-10 bg-white/80 backdrop-blur-3xl border-l border-stone-200 h-full overflow-y-auto">
          
          <div className="w-full max-w-[420px] space-y-10 relative z-20">
             
             <div className="text-center lg:text-left mb-8">
                <h2 className="text-5xl font-black text-stone-900 tracking-tighter mb-3 leading-none">Selamat Datang</h2>
                <p className="text-stone-500 text-base font-medium">Masuk untuk mulai menyelamatkan pangan.</p>
             </div>

             <form onSubmit={handleLogin} className="space-y-6">
                {apiError && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold animate-in slide-in-from-top-2 shadow-sm backdrop-blur-sm">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        {apiError}
                    </div>
                )}

                <div className="space-y-2 group">
                    <label className="text-[10px] font-black text-orange-600 uppercase tracking-widest ml-2 group-focus-within:text-orange-500 transition-colors">Email Address</label>
                    <Input 
                        label=""
                        type="email" 
                        icon={<Mail className="h-5 w-5 group-focus-within:text-orange-500 transition-colors" />}
                        placeholder="nama@email.com" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        className={`!bg-stone-50 !border-stone-200 !text-stone-900 focus:!border-orange-500 focus:!bg-white focus:ring-4 focus:ring-orange-500/10 rounded-2xl py-4 transition-all h-14 font-medium ${errors.email ? '!border-red-300 focus:!border-red-500' : ''}`} 
                        containerClassName="space-y-0"
                    />
                    {errors.email && <p className="text-red-500 text-[10px] font-bold ml-2">{errors.email}</p>}
                </div>

                <div className="space-y-2 group">
                    <div className="flex justify-between items-center ml-2">
                        <label className="text-[10px] font-black text-orange-600 uppercase tracking-widest group-focus-within:text-orange-500 transition-colors">Password</label>
                        <button type="button" onClick={() => onNavigate('forgot-password')} className="text-stone-400 hover:text-orange-600 font-bold transition-colors text-xs uppercase tracking-widest">Lupa Password?</button>
                    </div>
                    <div className="relative">
                        <Input 
                            label=""
                            type={showPassword ? "text" : "password"} 
                            icon={<Lock className="h-5 w-5 group-focus-within:text-orange-500 transition-colors" />}
                            placeholder="••••••••" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            className={`!bg-stone-50 !border-stone-200 !text-stone-900 focus:!border-orange-500 focus:!bg-white focus:ring-4 focus:ring-orange-500/10 rounded-2xl py-4 pr-12 transition-all h-14 font-medium ${errors.password ? '!border-red-300 focus:!border-red-500' : ''}`} 
                            containerClassName="space-y-0"
                            rightElement={
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-stone-300 hover:text-orange-500 transition-colors">
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            }
                        />
                    </div>
                    {errors.password && <p className="text-red-500 text-[10px] font-bold ml-2">{errors.password}</p>}
                </div>
                
                {/* Remember Me Checkbox */}
                <div className="flex items-center gap-3 ml-1">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input 
                            type="checkbox" 
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-5 h-5 rounded border-stone-300 bg-stone-50 text-orange-600 focus:ring-offset-0 focus:ring-2 focus:ring-orange-500/50 accent-orange-600 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-stone-500 group-hover:text-orange-600 transition-colors select-none">Ingat Saya</span>
                    </label>
                </div>

                <Button 
                    type="submit" 
                    variant="primary" 
                    isLoading={isLoading} 
                    className="w-full h-16 text-base font-black bg-gradient-to-r from-orange-600 via-orange-500 to-yellow-500 hover:from-orange-500 hover:to-yellow-400 text-white border-0 rounded-2xl mt-8 tracking-[0.2em] uppercase shadow-[0_10px_40px_-10px_rgba(234,88,12,0.3)] hover:shadow-[0_15px_50px_-10px_rgba(234,88,12,0.5)] transition-all transform hover:-translate-y-1 relative overflow-hidden group"
                >
                    <span className="relative z-10 flex items-center justify-center gap-2">MASUK SEKARANG <ArrowRight className="w-5 h-5" /></span>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                </Button>
             </form>
             
             <div className="mt-12 pt-8 border-t border-stone-100 text-center">
                <p className="text-stone-400 text-xs font-medium">
                    Belum memiliki akun? <button type="button" onClick={() => onNavigate('register')} className="relative z-20 text-orange-600 hover:text-orange-500 transition-colors ml-1 font-black underline decoration-orange-200 underline-offset-4 decoration-2">Daftar sekarang</button>
                </p>
             </div>
          </div>
      </div>
    </div>
  );
};
