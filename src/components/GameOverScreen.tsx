import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { User } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { Trophy, RotateCcw, ListOrdered, Loader2, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrors';
import { GameMode } from '../hooks/useGameEngine';

interface GameOverScreenProps {
  score: number;
  totalQuestions: number;
  onRestart: () => void;
  onViewLeaderboard: () => void;
  user: User | null;
  gameMode: GameMode;
  stats: { correct: number; maxStreak: number };
  fastAnswers: number;
}

const ACHIEVEMENTS = {
  first_quiz: { id: 'first_quiz', title: 'First Steps', description: 'Complete your first quiz.' },
  novice: { id: 'novice', title: 'Trivia Novice', description: 'Answer 100 questions correctly.' },
  expert: { id: 'expert', title: 'Animal Expert', description: 'Achieve a 10-question streak.' },
  speedy: { id: 'speedy', title: 'Speedy Gonzales', description: 'Answer 5 questions in under 10 seconds each.' },
  marathon_runner: { id: 'marathon_runner', title: 'Marathon Runner', description: 'Reach a score of 10,000 in Marathon Mode.' }
};

export function GameOverScreen({ score, totalQuestions, onRestart, onViewLeaderboard, user, gameMode, stats, fastAnswers }: GameOverScreenProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [hasSaved, setHasSaved] = useState(false);
  const [newAchievements, setNewAchievements] = useState<any[]>([]);
  const [highScore, setHighScore] = useState<number | null>(null);

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
        
        let currentTotalCorrect = stats.correct;
        let currentMaxStreak = stats.maxStreak;
        let currentMarathonHighScore = gameMode === 'marathon' ? score : 0;
        let currentAchievements: string[] = [];
        let currentQuizzesCompleted = 1;

        if (docSnap.exists()) {
          const data = docSnap.data();
          currentTotalCorrect += (data.stats?.totalCorrect || 0);
          currentMaxStreak = Math.max(currentMaxStreak, data.stats?.maxStreak || 0);
          currentMarathonHighScore = Math.max(currentMarathonHighScore, data.stats?.marathonHighScore || 0);
          currentAchievements = data.achievements || [];
          
          if (data.quizzesCompleted === undefined) {
            currentQuizzesCompleted = Math.max(1, Math.ceil((data.score || 0) / 15000)) + 1;
          } else {
            currentQuizzesCompleted = data.quizzesCompleted + 1;
          }
        }

        if (gameMode === 'marathon') {
          setHighScore(currentMarathonHighScore);
        }

        const earnedAchievements: string[] = [];
        
        if (currentQuizzesCompleted >= 1 && !currentAchievements.includes('first_quiz')) earnedAchievements.push('first_quiz');
        if (currentTotalCorrect >= 100 && !currentAchievements.includes('novice')) earnedAchievements.push('novice');
        if (currentMaxStreak >= 10 && !currentAchievements.includes('expert')) earnedAchievements.push('expert');
        if (fastAnswers >= 5 && !currentAchievements.includes('speedy')) earnedAchievements.push('speedy');
        if (currentMarathonHighScore >= 10000 && !currentAchievements.includes('marathon_runner')) earnedAchievements.push('marathon_runner');

        if (earnedAchievements.length > 0) {
          setNewAchievements(earnedAchievements.map(id => ACHIEVEMENTS[id as keyof typeof ACHIEVEMENTS]));
        }

        const updatedAchievements = [...currentAchievements, ...earnedAchievements];

        await setDoc(docRef, {
          uid: user.uid,
          displayName: user.displayName || 'Anonymous',
          photoURL: user.photoURL || '',
          score: increment(score),
          quizzesCompleted: currentQuizzesCompleted,
          stats: {
            totalCorrect: currentTotalCorrect,
            maxStreak: currentMaxStreak,
            marathonHighScore: currentMarathonHighScore
          },
          achievements: updatedAchievements,
          timestamp: serverTimestamp()
        }, { merge: true });
        
        setSaveStatus('saved');
        setHasSaved(true);
      } catch (error) {
        console.error("Error saving score:", error);
        setSaveStatus('error');
      } finally {
        setIsSaving(false);
      }
    }

    saveScore();
  }, [user, score, hasSaved, gameMode, stats, fastAnswers]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center text-center max-w-lg w-full bg-dark-900/80 backdrop-blur-xl p-6 sm:p-10 rounded-2xl sm:rounded-3xl border border-dark-800 shadow-2xl"
    >
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-sand-900/50 rounded-full flex items-center justify-center mb-4 sm:mb-6 border border-sand-800">
        <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-sand-400" />
      </div>
      
      <h2 className="text-3xl sm:text-4xl font-bold text-sand-50 mb-2">
        {gameMode === 'marathon' ? 'Marathon Over!' : 'Quiz Complete!'}
      </h2>
      <p className="text-sm sm:text-base text-sand-400 mb-6 sm:mb-8">You answered {totalQuestions} questions.</p>
      
      <div className="bg-dark-950 w-full py-6 sm:py-8 rounded-xl sm:rounded-2xl border border-dark-800 mb-6 sm:mb-8">
        <p className="text-xs sm:text-sm text-sand-500 uppercase tracking-widest font-semibold mb-2">Final Score</p>
        <p className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sand-300 to-sand-500">
          {score.toLocaleString()}
        </p>
        {gameMode === 'marathon' && highScore !== null && (
          <p className="text-xs sm:text-sm text-sand-400 mt-4">
            Marathon High Score: {highScore.toLocaleString()}
          </p>
        )}
      </div>

      {newAchievements.length > 0 && (
        <div className="w-full mb-6 sm:mb-8 space-y-3">
          <p className="text-xs sm:text-sm text-sand-400 uppercase tracking-widest font-semibold">New Achievements Unlocked!</p>
          {newAchievements.map((ach, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.2 }}
              className="flex items-center gap-3 p-3 bg-amber-900/20 border border-amber-500/30 rounded-xl text-left"
            >
              <Award className="w-6 h-6 text-amber-400 shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-100">{ach.title}</p>
                <p className="text-xs text-amber-200/70">{ach.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

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
