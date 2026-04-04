import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { ArrowLeft, Trophy, Medal } from 'lucide-react';
import { User } from 'firebase/auth';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrors';

interface LeaderboardProps {
  onBack: () => void;
  user: User | null;
}

interface LeaderboardEntry {
  uid: string;
  displayName: string;
  photoURL: string;
  score: number;
}

export function Leaderboard({ onBack, user }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'leaderboard'),
      orderBy('score', 'desc'),
      limit(15)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newEntries: LeaderboardEntry[] = [];
      snapshot.forEach((doc) => {
        newEntries.push(doc.data() as LeaderboardEntry);
      });
      setEntries(newEntries);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'leaderboard');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl bg-dark-900/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-dark-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[80vh]"
    >
      <div className="p-4 sm:p-6 md:p-8 border-b border-dark-800 flex items-center justify-between bg-dark-950/50">
        <button 
          onClick={onBack}
          className="p-2 rounded-full hover:bg-dark-800 text-sand-400 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <div className="flex items-center gap-2 sm:gap-3">
          <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-sand-500" />
          <h2 className="text-xl sm:text-2xl font-bold text-sand-50">Top Players</h2>
        </div>
        <div className="w-9 sm:w-10" /> {/* Spacer for centering */}
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-pulse text-sand-400 font-medium tracking-widest uppercase text-sm sm:text-base">
              Loading Scores...
            </div>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center text-sand-500 py-12 text-sm sm:text-base">
            No scores yet. Be the first to play!
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {entries.map((entry, index) => {
              const isCurrentUser = user?.uid === entry.uid;
              
              return (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={entry.uid}
                  className={`flex items-center p-3 sm:p-4 rounded-xl sm:rounded-2xl border ${
                    isCurrentUser 
                      ? 'bg-sand-900/30 border-sand-700/50' 
                      : 'bg-dark-800/50 border-dark-700/50 hover:bg-dark-800'
                  } transition-colors`}
                >
                  <div className="w-6 sm:w-8 flex justify-center mr-3 sm:mr-4">
                    {index === 0 ? (
                      <Medal className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
                    ) : index === 1 ? (
                      <Medal className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300" />
                    ) : index === 2 ? (
                      <Medal className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
                    ) : (
                      <span className="text-sand-500 font-bold text-sm sm:text-base">{index + 1}</span>
                    )}
                  </div>
                  
                  <img 
                    src={entry.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.uid}`} 
                    alt={entry.displayName}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-dark-600 mr-3 sm:mr-4"
                    referrerPolicy="no-referrer"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base text-sand-50 font-semibold truncate">
                      {entry.displayName}
                      {isCurrentUser && <span className="ml-2 text-[10px] sm:text-xs bg-sand-800 text-sand-200 px-2 py-0.5 rounded-full">You</span>}
                    </p>
                  </div>
                  
                  <div className="text-right ml-3 sm:ml-4">
                    <p className="text-lg sm:text-xl font-bold text-sand-300">
                      {entry.score.toLocaleString()}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
