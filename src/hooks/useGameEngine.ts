import { useState, useEffect, useRef, useCallback } from 'react';
import { Question } from '../utils/parseCsv';
import { audioController } from '../utils/audio';

export type GameStatus = 'loading' | 'start' | 'playing' | 'gameover' | 'leaderboard' | 'history';
export type GameMode = 'classic' | 'marathon';

export interface AnswerRecord {
  questionText: string;
  isCorrect: boolean;
  userAnswer: string;
  correctAnswer: string;
}

const QUESTIONS_PER_GAME = 15;

export function useGameEngine(allQuestions: Question[]) {
  const [status, setStatus] = useState<GameStatus>('loading');
  const [gameMode, setGameMode] = useState<GameMode>('classic');
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  // Stats tracking
  const [streak, setStreak] = useState(0);
  const [fastAnswers, setFastAnswers] = useState(0);
  const [stats, setStats] = useState({ correct: 0, maxStreak: 0 });
  const [answerHistory, setAnswerHistory] = useState<AnswerRecord[]>([]);

  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastTickRef = useRef<number>(0);

  const currentQuestion = currentQuestions[currentIndex];

  const startGame = useCallback((mode: GameMode = 'classic') => {
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    setGameMode(mode);
    if (mode === 'classic') {
      setCurrentQuestions(shuffled.slice(0, QUESTIONS_PER_GAME));
    } else {
      setCurrentQuestions(shuffled);
    }
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setFastAnswers(0);
    setStats({ correct: 0, maxStreak: 0 });
    setAnswerHistory([]);
    setIsRevealed(false);
    setSelectedAnswer(null);
    setStatus('playing');
  }, [allQuestions]);

  const nextQuestion = useCallback(() => {
    if (currentIndex < currentQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsRevealed(false);
      setSelectedAnswer(null);
    } else {
      setStatus('gameover');
    }
  }, [currentIndex, currentQuestions.length]);

  const handleTimeUp = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    audioController.playIncorrect();
    setIsRevealed(true);
    setStreak(0);

    if (currentQuestion) {
      setAnswerHistory(prev => [...prev, {
        questionText: currentQuestion.text,
        isCorrect: false,
        userAnswer: "Time's up!",
        correctAnswer: currentQuestion.options[currentQuestion.correctAnswers[0]]
      }]);
    }

    setTimeout(() => {
      if (gameMode === 'marathon') {
        setStatus('gameover');
      } else {
        nextQuestion();
      }
    }, 2500);
  }, [nextQuestion, gameMode, currentQuestion]);

  const startQuestionTimer = useCallback(() => {
    if (!currentQuestion) return;
    
    setTimeLeft(currentQuestion.timeLimit);
    setSelectedAnswer(null);
    setIsRevealed(false);
    startTimeRef.current = Date.now();
    lastTickRef.current = 0;

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, currentQuestion.timeLimit - elapsed);
      setTimeLeft(remaining);

      const currentSecond = Math.ceil(remaining);
      if (currentSecond <= 5 && currentSecond > 0 && currentSecond !== lastTickRef.current) {
        audioController.playTick();
        lastTickRef.current = currentSecond;
      }

      if (remaining <= 0) {
        handleTimeUp();
      }
    }, 100);
  }, [currentQuestion, handleTimeUp]);

  useEffect(() => {
    if (status === 'playing' && currentQuestion) {
      startQuestionTimer();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, currentIndex, currentQuestion, startQuestionTimer]);

  const handleSelectAnswer = useCallback((index: number) => {
    if (isRevealed || !currentQuestion) return;
    
    if (timerRef.current) clearInterval(timerRef.current);
    setSelectedAnswer(index);
    setIsRevealed(true);

    const isCorrect = currentQuestion.correctAnswers.includes(index);
    
    setAnswerHistory(prev => [...prev, {
      questionText: currentQuestion.text,
      isCorrect,
      userAnswer: currentQuestion.options[index],
      correctAnswer: currentQuestion.options[currentQuestion.correctAnswers[0]]
    }]);

    if (isCorrect) {
      audioController.playCorrect();
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const ratio = Math.max(0, 1 - (elapsed / currentQuestion.timeLimit));
      const points = Math.round(500 + (500 * ratio));
      setScore(prev => prev + points);
      
      setStreak(prev => {
        const newStreak = prev + 1;
        setStats(s => ({ ...s, correct: s.correct + 1, maxStreak: Math.max(s.maxStreak, newStreak) }));
        return newStreak;
      });

      if (elapsed < 10) {
        setFastAnswers(prev => prev + 1);
      }
    } else {
      audioController.playIncorrect();
      setStreak(0);
    }

    setTimeout(() => {
      if (gameMode === 'marathon' && !isCorrect) {
        setStatus('gameover');
      } else {
        nextQuestion();
      }
    }, 2500);
  }, [isRevealed, currentQuestion, nextQuestion, gameMode]);

  return {
    status,
    setStatus,
    gameMode,
    currentQuestions,
    currentIndex,
    currentQuestion,
    score,
    timeLeft,
    selectedAnswer,
    isRevealed,
    streak,
    fastAnswers,
    stats,
    answerHistory,
    startGame,
    handleSelectAnswer
  };
}
