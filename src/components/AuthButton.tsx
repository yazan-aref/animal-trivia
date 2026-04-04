import { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { auth } from '../firebase';
import { LogIn, LogOut, Loader2 } from 'lucide-react';

interface AuthButtonProps {
  user: User | null;
}

export function AuthButton({ user }: AuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <button disabled className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-dark-800 text-sand-400 text-xs sm:text-sm font-medium">
        <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
        <span className="hidden sm:inline">Please wait...</span>
      </button>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-2 sm:gap-3">
        <img 
          src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
          alt="Profile" 
          className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-sand-700"
          referrerPolicy="no-referrer"
        />
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-dark-800 hover:bg-dark-700 text-sand-200 text-xs sm:text-sm font-medium transition-colors"
        >
          <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={handleLogin}
      className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-sand-200 hover:bg-sand-300 text-dark-950 text-xs sm:text-sm font-bold transition-colors"
    >
      <LogIn className="w-3 h-3 sm:w-4 sm:h-4" />
      <span className="hidden sm:inline">Sign In</span>
      <span className="sm:hidden">Login</span>
    </button>
  );
}
