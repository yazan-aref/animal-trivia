import { motion } from 'motion/react';
import { Question } from '../utils/parseCsv';
import { cn } from '../lib/utils';
import { CheckCircle2, XCircle } from 'lucide-react';

interface QuizScreenProps {
  currentQuestion: Question;
  currentIndex: number;
  totalQuestions: number;
  score: number;
  timeLeft: number;
  selectedAnswer: number | null;
  isRevealed: boolean;
  onSelectAnswer: (index: number) => void;
}

export function QuizScreen({ 
  currentQuestion, 
  currentIndex, 
  totalQuestions, 
  score, 
  timeLeft, 
  selectedAnswer, 
  isRevealed, 
  onSelectAnswer 
}: QuizScreenProps) {
  const progressPercent = (timeLeft / currentQuestion.timeLimit) * 100;

  return (
    <div className="w-full max-w-3xl flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-6 sm:mb-8 text-sand-400 font-medium text-sm sm:text-base">
        <div className="bg-dark-900 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-dark-800">
          Q {currentIndex + 1} <span className="hidden sm:inline">of {totalQuestions}</span>
        </div>
        <div className="bg-dark-900 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-dark-800 flex items-center gap-2">
          <TrophyIcon className="w-3 h-3 sm:w-4 sm:h-4 text-sand-500" />
          <span className="text-sand-200">{score} pts</span>
        </div>
      </div>

      <motion.div 
        key={currentQuestion.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="w-full bg-dark-900/50 backdrop-blur-md rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 border border-dark-800 shadow-2xl mb-8"
      >
        <h2 className="text-xl sm:text-2xl md:text-4xl font-bold text-sand-50 text-center leading-tight mb-6 sm:mb-8">
          {currentQuestion.text}
        </h2>

        <div className="relative w-full h-2 sm:h-3 bg-dark-950 rounded-full overflow-hidden mb-6 sm:mb-8">
          <motion.div 
            className={cn(
              "absolute top-0 left-0 h-full rounded-full transition-colors duration-300",
              progressPercent > 50 ? "bg-sand-400" : progressPercent > 20 ? "bg-amber-500" : "bg-red-500"
            )}
            style={{ width: `${progressPercent}%` }}
            layoutId="timer-bar"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedAnswer === idx;
            const isCorrect = currentQuestion.correctAnswers.includes(idx);
            
            let stateClass = "bg-dark-800 hover:bg-dark-700 border-dark-700 text-sand-200";
            
            if (isRevealed) {
              if (isCorrect) {
                stateClass = "bg-green-900/40 border-green-500/50 text-green-100";
              } else if (isSelected && !isCorrect) {
                stateClass = "bg-red-900/40 border-red-500/50 text-red-100";
              } else {
                stateClass = "bg-dark-900/50 border-dark-800 text-dark-500 opacity-50";
              }
            } else if (isSelected) {
              stateClass = "bg-sand-800 border-sand-600 text-sand-50";
            }

            return (
              <button
                key={idx}
                disabled={isRevealed}
                onClick={() => onSelectAnswer(idx)}
                className={cn(
                  "relative flex items-center justify-between p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 text-left text-base sm:text-lg font-medium transition-all duration-200",
                  "active:scale-[0.98]",
                  stateClass
                )}
              >
                <span>{option}</span>
                {isRevealed && isCorrect && <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 shrink-0 ml-2" />}
                {isRevealed && isSelected && !isCorrect && <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-400 shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

function TrophyIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7c0 6 3 10 6 10s6-4 6-10V2z" />
    </svg>
  );
}
