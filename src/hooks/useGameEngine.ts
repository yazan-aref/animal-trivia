import { useState, useEffect, useRef, useCallback } from 'react';
import { Question } from '../utils/parseCsv';

export type GameStatus = 'loading' | 'start' | 'playing' | 'gameover' | 'leaderboard';

const QUESTIONS_PER_GAME = 15;

export function useGameEngine(allQuestions: Question[]) {
  const [status, setStatus] = useState<GameStatus>('loading');
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const currentQuestion = currentQuestions[currentIndex];

  const startGame = useCallback(() => {
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    setCurrentQuestions(shuffled.slice(0, QUESTIONS_PER_GAME));
    setCurrentIndex(0);
    setScore(0);
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
    setIsRevealed(true);
    setTimeout(nextQuestion, 2500);
  }, [nextQuestion]);

  const startQuestionTimer = useCallback(() => {
    if (!currentQuestion) return;
    
    setTimeLeft(currentQuestion.timeLimit);
    setSelectedAnswer(null);
    setIsRevealed(false);
    startTimeRef.current = Date.now();

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, currentQuestion.timeLimit - elapsed);
      setTimeLeft(remaining);

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
    if (isCorrect) {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const ratio = Math.max(0, 1 - (elapsed / currentQuestion.timeLimit));
      const points = Math.round(500 + (500 * ratio));
      setScore(prev => prev + points);
    }

    setTimeout(nextQuestion, 2500);
  }, [isRevealed, currentQuestion, nextQuestion]);

  return {
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
  };
}
