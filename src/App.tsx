import { useState, useEffect } from 'react';
import { loadQuestions, Question } from './utils/parseCsv';
import { StartScreen } from './components/StartScreen';
import { QuizScreen } from './components/QuizScreen';
import { GameOverScreen } from './components/GameOverScreen';
import { Leaderboard } from './components/Leaderboard';
import { AuthButton } from './components/AuthButton';
import { auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useGameEngine } from './hooks/useGameEngine';

export default function App() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [user, setUser] = useState<User | null>(null);

  const {
    status,
    setStatus,
    currentQuestions,
    currentIndex,
    currentQuestion,
    score,
    timeLeft,
    selectedAnswer,
    isRevealed,
    startGame,
    handleSelectAnswer
  } = useGameEngine(questions);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    loadQuestions()
      .then((data) => {
        setQuestions(data);
        setStatus('start');
      })
      .catch((err) => {
        console.error("Failed to load questions:", err);
        setStatus('start');
      });
  }, [setStatus]);

  return (
    <div 
      className="min-h-screen flex flex-col relative overflow-hidden bg-[#21431c] text-sand-50 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url('https://github.com/yazan-aref/Mawil-images/blob/main/green%20bg.png?raw=true')` }}
    >
      {/* Background overlay to ensure readability */}
      <div className="absolute inset-0 bg-dark-950/30 pointer-events-none" />
      
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] sm:w-[40%] sm:h-[40%] rounded-full bg-sand-900/20 blur-[80px] sm:blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] sm:w-[40%] sm:h-[40%] rounded-full bg-sand-800/20 blur-[80px] sm:blur-[120px]" />
      </div>

      <header className="relative z-10 p-4 sm:p-6 flex justify-between items-center max-w-7xl w-full mx-auto">
        <a 
          href="https://www.mawil.org"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 cursor-pointer group"
        >
          <img 
            src="https://github.com/yazan-aref/Mawil-images/blob/main/logo.png?raw=true" 
            alt="Maw'il Logo" 
            className="w-8 h-8 sm:w-10 sm:h-10 object-contain transition-transform group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-sand-200">
            Maw'il <span className="text-sand-500">AnimalTrivia</span>
          </div>
        </a>
        <div className="flex items-center gap-2 sm:gap-4">
          {status !== 'leaderboard' && (
            <button 
              onClick={() => setStatus('leaderboard')}
              className="text-xs sm:text-sm font-medium text-sand-300 hover:text-sand-100 transition-colors"
            >
              Leaderboard
            </button>
          )}
          <AuthButton user={user} />
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 sm:p-6 w-full max-w-4xl mx-auto">
        {status === 'loading' && (
          <div className="animate-pulse text-sand-400 font-medium tracking-widest uppercase text-sm sm:text-base">
            Loading...
          </div>
        )}
        
        {status === 'start' && (
          <StartScreen onStart={startGame} user={user} />
        )}
        
        {status === 'playing' && currentQuestion && (
          <QuizScreen 
            currentQuestion={currentQuestion}
            currentIndex={currentIndex}
            totalQuestions={currentQuestions.length}
            score={score}
            timeLeft={timeLeft}
            selectedAnswer={selectedAnswer}
            isRevealed={isRevealed}
            onSelectAnswer={handleSelectAnswer}
          />
        )}
        
        {status === 'gameover' && (
          <GameOverScreen 
            score={score} 
            totalQuestions={currentQuestions.length}
            onRestart={startGame}
            onViewLeaderboard={() => setStatus('leaderboard')}
            user={user}
          />
        )}
        
        {status === 'leaderboard' && (
          <Leaderboard 
            onBack={() => setStatus('start')} 
            user={user}
          />
        )}
      </main>

      <footer className="relative z-10 p-6 text-center">
        <a 
          href="https://www.mawil.org" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sand-400 hover:text-sand-200 transition-colors text-sm sm:text-base font-medium"
        >
          Brought to you by: <span className="underline underline-offset-4">www.Mawil.org</span>
        </a>
      </footer>
    </div>
  );
}
