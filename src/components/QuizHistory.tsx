import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { ArrowLeft, History, ChevronDown, ChevronUp, CheckCircle2, XCircle } from 'lucide-react';
import { User } from 'firebase/auth';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrors';
import { AnswerRecord } from '../hooks/useGameEngine';

interface QuizHistoryProps {
  onBack: () => void;
  user: User | null;
}

interface QuizHistoryEntry {
  id: string;
  date: any; // Firestore timestamp
  score: number;
  mode: string;
  totalQuestions: number;
  correctAnswers: number;
  questionsSummary: AnswerRecord[];
}

export function QuizHistory({ onBack, user }: QuizHistoryProps) {
  const [entries, setEntries] = useState<QuizHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'quizHistory'),
      where('userId', '==', user.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newEntries: QuizHistoryEntry[] = [];
      snapshot.forEach((doc) => {
        newEntries.push({ id: doc.id, ...doc.data() } as QuizHistoryEntry);
      });
      setEntries(newEntries);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'quizHistory');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit'
    }).format(date);
  };

  if (!user) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-sand-900/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-sand-800 shadow-2xl overflow-hidden flex flex-col p-8 text-center"
      >
        <History className="w-12 h-12 text-sand-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-sand-50 mb-4">Quiz History</h2>
        <p className="text-sand-400 mb-6">Please log in to view your past quizzes.</p>
        <button 
          onClick={onBack}
          className="px-6 py-3 bg-sand-200 text-dark-950 font-bold rounded-xl hover:bg-sand-300 transition-colors mx-auto"
        >
          Go Back
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-3xl bg-sand-900/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-sand-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[80vh]"
    >
      <div className="p-4 sm:p-6 md:p-8 border-b border-sand-800 flex items-center justify-between bg-sand-950/50">
        <button 
          onClick={onBack}
          className="p-2 rounded-full hover:bg-sand-800 text-sand-400 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <div className="flex items-center gap-2 sm:gap-3">
          <History className="w-5 h-5 sm:w-6 sm:h-6 text-sand-500" />
          <h2 className="text-xl sm:text-2xl font-bold text-sand-50">Quiz History</h2>
        </div>
        <div className="w-9 sm:w-10" /> {/* Spacer for centering */}
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-pulse text-sand-400 font-medium tracking-widest uppercase text-sm sm:text-base">
              Loading History...
            </div>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center text-sand-500 py-12 text-sm sm:text-base">
            No history found. Take a quiz to see it here!
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry, index) => {
              const isExpanded = expandedId === entry.id;
              
              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={entry.id}
                  className="bg-sand-950/40 border border-sand-800/50 rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => toggleExpand(entry.id)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-sand-800/30 transition-colors text-left"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                      <div>
                        <p className="text-sand-50 font-bold text-lg">{entry.score.toLocaleString()} pts</p>
                        <p className="text-sand-400 text-xs sm:text-sm">{formatDate(entry.date)}</p>
                      </div>
                      <div className="flex gap-3 text-xs sm:text-sm">
                        <span className="bg-dark-800 text-sand-300 px-2.5 py-1 rounded-md uppercase tracking-wider font-semibold">
                          {entry.mode}
                        </span>
                        <span className="bg-sand-800/50 text-sand-200 px-2.5 py-1 rounded-md">
                          {entry.correctAnswers} / {entry.totalQuestions} Correct
                        </span>
                      </div>
                    </div>
                    <div className="text-sand-500 p-2">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-sand-800/50 bg-dark-950/50"
                      >
                        <div className="p-4 sm:p-6 space-y-4">
                          {entry.questionsSummary?.map((q, qIdx) => (
                            <div key={qIdx} className="flex gap-3 sm:gap-4 items-start">
                              <div className="mt-0.5 shrink-0">
                                {q.isCorrect ? (
                                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                                ) : (
                                  <XCircle className="w-5 h-5 text-red-500" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sand-100 text-sm sm:text-base font-medium mb-1 leading-snug">
                                  {q.questionText}
                                </p>
                                <div className="text-xs sm:text-sm space-y-0.5">
                                  <p className={q.isCorrect ? "text-green-400/80" : "text-red-400/80"}>
                                    <span className="text-sand-500 mr-1">Your answer:</span> {q.userAnswer}
                                  </p>
                                  {!q.isCorrect && (
                                    <p className="text-green-400/80">
                                      <span className="text-sand-500 mr-1">Correct answer:</span> {q.correctAnswer}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                          {(!entry.questionsSummary || entry.questionsSummary.length === 0) && (
                            <p className="text-sand-500 text-sm text-center py-2">No question details available for this quiz.</p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
