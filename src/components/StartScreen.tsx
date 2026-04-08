import { motion } from 'motion/react';
import { Play, Trophy, Flame } from 'lucide-react';
import { User } from 'firebase/auth';
import { GameMode } from '../hooks/useGameEngine';

interface StartScreenProps {
  onStart: (mode: GameMode) => void;
  user: User | null;
}

export function StartScreen({ onStart, user }: StartScreenProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center text-center max-w-2xl w-full px-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className="mb-6 sm:mb-8 inline-flex items-center justify-center p-3 sm:p-4 bg-sand-900/30 rounded-full border border-sand-800/50"
      >
        <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-sand-400" />
      </motion.div>
      
      <h1 className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tight mb-2 text-[#ead7ad] uppercase">
        The Ultimate
      </h1>
      
      <div className="w-full max-w-md h-24 sm:h-32 bg-gradient-to-b from-[#ead7ad] to-[#c7a06f] opacity-80 rounded-lg mb-8" />
      
      <p className="text-base sm:text-lg md:text-xl text-[#ead7ad] mb-8 sm:mb-12 max-w-lg leading-relaxed font-medium">
        Test your knowledge on wildlife. Answer fast to earn more points and climb the global leaderboard.
      </p>
      
      <div className="flex flex-col sm:flex-row items-center gap-6 w-full sm:w-auto">
        <button
          onClick={() => onStart('classic')}
          className="group relative inline-flex items-center justify-center gap-3 px-10 py-4 bg-[#ead7ad] text-[#21431c] font-black text-lg sm:text-xl rounded-full transition-all hover:scale-105 active:scale-95 w-full sm:w-auto shadow-xl"
        >
          <Play className="w-5 h-5 fill-current" />
          Classic Mode
        </button>

        <button
          onClick={() => onStart('marathon')}
          className="group relative inline-flex items-center justify-center gap-3 px-10 py-4 bg-[#631a1a] text-red-50 border border-red-900/50 font-black text-lg sm:text-xl rounded-full transition-all hover:scale-105 active:scale-95 w-full sm:w-auto shadow-xl"
        >
          <Flame className="w-5 h-5 fill-current" />
          Marathon Mode
        </button>
      </div>
      
      {!user && (
        <p className="text-xs sm:text-sm text-[#ead7ad] mt-4 sm:mt-6">
          <span className="inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-sand-500 mr-2 animate-pulse" />
          Login to save your score to the leaderboard
        </p>
      )}
    </motion.div>
  );
}
