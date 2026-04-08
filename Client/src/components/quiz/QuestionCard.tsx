import { motion } from 'framer-motion';
import type { Option, Question } from '@/types';
import { cn } from '@/utils/helpers';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle2, XCircle } from 'lucide-react';

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  selectedOptionId: string | null;
  showResult?: boolean;
  onSelect: (optionId: string) => void;
}

function OptionButton({
  option,
  isSelected,
  isCorrect,
  isWrong,
  showResult,
  onClick,
}: {
  option: Option;
  isSelected: boolean;
  isCorrect: boolean;
  isWrong: boolean;
  showResult: boolean;
  onClick: () => void;
}) {
  const base =
    'w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all duration-200 font-medium text-sm';

  const state = showResult
    ? isCorrect
      ? 'border-emerald-500 bg-emerald-100 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-300'
      : isWrong
      ? 'border-red-500 bg-red-100 text-red-900 dark:bg-red-900/20 dark:text-red-300'
      : 'border-[var(--border)] bg-slate-50 text-slate-600 dark:bg-transparent dark:text-[var(--text-muted)] opacity-80'
    : isSelected
    ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 ring-2 ring-primary-400/30'
    : 'border-[var(--border)] text-[var(--text)] hover:border-primary-300 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 cursor-pointer';

  const optionLabel = option.id.toUpperCase();

  return (
    <motion.button
      whileHover={!showResult ? { x: 4 } : {}}
      whileTap={!showResult ? { scale: 0.99 } : {}}
      onClick={onClick}
      disabled={showResult}
      className={cn(base, state)}
      aria-pressed={isSelected}
    >
      {/* Label bubble */}
      <span
        className={cn(
          'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold',
          showResult
            ? isCorrect
              ? 'bg-emerald-500 text-white'
              : isWrong
              ? 'bg-red-500 text-white'
              : 'bg-slate-300 text-slate-700 dark:bg-gray-600 dark:text-gray-300'
            : isSelected
            ? 'bg-primary-500 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-[var(--text-muted)]',
        )}
      >
        {optionLabel}
      </span>

      <span className="flex-1">{option.text}</span>

      {showResult && isCorrect && <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />}
      {showResult && isWrong && <XCircle size={18} className="text-red-500 shrink-0" />}
    </motion.button>
  );
}

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedOptionId,
  showResult = false,
  onSelect,
}: QuestionCardProps) {
  const difficultyVariant =
    question.difficulty === 'easy'
      ? 'success'
      : question.difficulty === 'medium'
      ? 'warning'
      : 'danger';

  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.25 }}
      className="glass rounded-2xl p-6 space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)]">
            Question {questionNumber} of {totalQuestions}
          </span>
          <Badge variant={difficultyVariant} dot>
            {question.difficulty}
          </Badge>
          <Badge variant="primary">
            {question.points} pt{question.points !== 1 ? 's' : ''}
          </Badge>
        </div>
        <span className="text-xs text-[var(--text-muted)] capitalize">{question.category}</span>
      </div>

      {/* Question text */}
      <div>
        <p className="text-base sm:text-lg font-semibold text-[var(--text)] leading-relaxed">
          {question.text}
        </p>
      </div>

      {/* Options */}
      <div className="space-y-2.5" role="radiogroup" aria-label="Answer options">
        {question.options.map((opt) => (
          <OptionButton
            key={opt.id}
            option={opt}
            isSelected={selectedOptionId === opt.id}
            isCorrect={showResult && opt.id === question.correctOptionId}
            isWrong={showResult && selectedOptionId === opt.id && opt.id !== question.correctOptionId}
            showResult={showResult}
            onClick={() => !showResult && onSelect(opt.id)}
          />
        ))}
      </div>

      {/* Explanation — only in review mode */}
      {showResult && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-blue-100 border border-blue-300 rounded-xl p-4 dark:bg-blue-900/20 dark:border-blue-700"
        >
          <p className="text-xs font-semibold text-blue-800 dark:text-blue-400 mb-1">Explanation</p>
          <p className="text-sm text-blue-900 dark:text-blue-300">{question.explanation}</p>
        </motion.div>
      )}
    </motion.div>
  );
}
