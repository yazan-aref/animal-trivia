import { motion } from 'motion/react';
import { Play, Trophy } from 'lucide-react';
import { User } from 'firebase/auth';

interface StartScreenProps {
  onStart: () => void;
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
      
      <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-4 sm:mb-6 text-[#ead7ad]">
        The Ultimate <br/>
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-sand-300 to-sand-600">
          Animal Trivia
        </span>
      </h1>
      
      <p className="text-base sm:text-lg md:text-xl text-[#ead7ad] mb-8 sm:mb-12 max-w-lg leading-relaxed">
        Test your knowledge of the animal kingdom. Answer fast to earn more points and climb the global leaderboard.
      </p>
      
      <div className="flex flex-col items-center gap-4 w-full sm:w-auto">
        <button
          onClick={onStart}
          className="group relative inline-flex items-center justify-center gap-3 px-6 py-3 sm:px-8 sm:py-4 bg-sand-200 text-dark-950 font-bold text-base sm:text-lg rounded-full overflow-hidden transition-transform hover:scale-105 active:scale-95 w-full sm:w-auto"
        >
          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-sand-100 to-sand-300 opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="relative flex items-center gap-2">
            <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            Start Game
          </span>
        </button>
        
        {!user && (
          <p className="text-xs sm:text-sm text-[#ead7ad] mt-2 sm:mt-4">
            <span className="inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-sand-500 mr-2 animate-pulse" />
            Login to save your score to the leaderboard
          </p>
        )}
      </div>
    </motion.div>
  );
}
