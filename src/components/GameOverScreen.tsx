import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { User } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { Trophy, RotateCcw, ListOrdered, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrors';

interface GameOverScreenProps {
  score: number;
  totalQuestions: number;
  onRestart: () => void;
  onViewLeaderboard: () => void;
  user: User | null;
}

export function GameOverScreen({ score, totalQuestions, onRestart, onViewLeaderboard, user }: GameOverScreenProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    // Trigger confetti on mount
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#c7a06f', '#e3d1b3', '#fdfbf7']
      });
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#c7a06f', '#e3d1b3', '#fdfbf7']
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function saveScore() {
      if (!user || score === 0 || hasSaved) return;
      
      setIsSaving(true);
      try {
        const docRef = doc(db, 'leaderboard', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          // If the document exists but doesn't have quizzesCompleted (legacy user)
          if (data.quizzesCompleted === undefined) {
            const inferredQuizzes = Math.max(1, Math.ceil((data.score || 0) / 15000));
            await setDoc(docRef, {
              uid: user.uid,
              displayName: user.displayName || 'Anonymous',
              photoURL: user.photoURL || '',
              score: increment(score),
              quizzesCompleted: inferredQuizzes + 1,
              timestamp: serverTimestamp()
            }, { merge: true });
          } else {
            // Normal increment
            await setDoc(docRef, {
              uid: user.uid,
              displayName: user.displayName || 'Anonymous',
              photoURL: user.photoURL || '',
              score: increment(score),
              quizzesCompleted: increment(1),
              timestamp: serverTimestamp()
            }, { merge: true });
          }
        } else {
          // New user
          await setDoc(docRef, {
            uid: user.uid,
            displayName: user.displayName || 'Anonymous',
            photoURL: user.photoURL || '',
            score: score,
            quizzesCompleted: 1,
            timestamp: serverTimestamp()
          });
        }
        
        setSaveStatus('saved');
        setHasSaved(true);
      } catch (error) {
        console.error("Error saving score:", error);
        setSaveStatus('error');
        // We don't throw here to avoid crashing the UI, but we log it
      } finally {
        setIsSaving(false);
      }
    }

    saveScore();
  }, [user, score, hasSaved]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center text-center max-w-lg w-full bg-dark-900/80 backdrop-blur-xl p-6 sm:p-10 rounded-2xl sm:rounded-3xl border border-dark-800 shadow-2xl"
    >
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-sand-900/50 rounded-full flex items-center justify-center mb-4 sm:mb-6 border border-sand-800">
        <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-sand-400" />
      </div>
      
      <h2 className="text-3xl sm:text-4xl font-bold text-sand-50 mb-2">Quiz Complete!</h2>
      <p className="text-sm sm:text-base text-sand-400 mb-6 sm:mb-8">You answered {totalQuestions} questions.</p>
      
      <div className="bg-dark-950 w-full py-6 sm:py-8 rounded-xl sm:rounded-2xl border border-dark-800 mb-6 sm:mb-8">
        <p className="text-xs sm:text-sm text-sand-500 uppercase tracking-widest font-semibold mb-2">Final Score</p>
        <p className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sand-300 to-sand-500">
          {score.toLocaleString()}
        </p>
      </div>

      {user ? (
        <div className="mb-6 sm:mb-8 h-6 flex items-center justify-center">
          {isSaving ? (
            <p className="text-sand-400 flex items-center gap-2 text-xs sm:text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Saving score...
            </p>
          ) : saveStatus === 'saved' ? (
            <p className="text-green-400 text-xs sm:text-sm">Score saved to leaderboard!</p>
          ) : saveStatus === 'error' ? (
            <p className="text-red-400 text-xs sm:text-sm">Failed to save score.</p>
          ) : null}
        </div>
      ) : (
        <div className="mb-6 sm:mb-8 p-4 bg-sand-900/20 border border-sand-800/50 rounded-xl">
          <p className="text-xs sm:text-sm text-sand-300">
            Login with Google to save your score to the global leaderboard!
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
        <button
          onClick={onRestart}
          className="flex-1 flex items-center justify-center gap-2 py-3 sm:py-4 bg-dark-800 hover:bg-dark-700 text-sand-50 font-semibold rounded-xl transition-colors text-sm sm:text-base"
        >
          <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
          Play Again
        </button>
        <button
          onClick={onViewLeaderboard}
          className="flex-1 flex items-center justify-center gap-2 py-3 sm:py-4 bg-sand-200 hover:bg-sand-300 text-dark-950 font-bold rounded-xl transition-colors text-sm sm:text-base"
        >
          <ListOrdered className="w-4 h-4 sm:w-5 sm:h-5" />
          Leaderboard
        </button>
      </div>
    </motion.div>
  );
}
