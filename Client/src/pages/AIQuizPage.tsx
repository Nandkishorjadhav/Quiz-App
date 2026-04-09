import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CircularTimer } from '../components/quiz/CircularTimer';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';

export default function AIQuizPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const {
    quizId,
    topic,
    difficulty,
    questions,
    totalQuestions,
  } = location.state || {};

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [timeRemaining, setTimeRemaining] = useState(totalQuestions ? totalQuestions * 60 : 600);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if no quiz data
  useEffect(() => {
    if (!quizId || !questions) {
      navigate('/');
    }
  }, [quizId, questions, navigate]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining <= 0 || isSubmitted) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Auto-submit when time is up
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, isSubmitted]);

  if (!quizId || !questions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-blue-800 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const answeredCount = Object.keys(answers).length;

  const handleSelectAnswer = (option: string) => {
    if (isSubmitted) return;
    setAnswers({
      ...answers,
      [currentQuestion]: option,
    });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const handleNavigateToQuestion = (index: number) => {
    setCurrentQuestion(index);
  };

  const handleSubmitQuiz = async () => {
    if (answeredCount === 0) {
      setError('Please answer at least one question before submitting');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('authToken');
      const timeTaken = (totalQuestions * 60) - timeRemaining;

      // Convert answers to the required format
      const formattedAnswers = (questions as any[]).map((q: any, index: number) => ({
        questionId: q.id || index + 1,
        selectedAnswer: answers[index] || '',
      }));

      const response = await fetch('http://localhost:5000/api/quiz/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          quizId,
          topic,
          difficulty,
          answers: formattedAnswers,
          timeTaken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit quiz');
      }

      console.log('✓ Quiz submitted:', data.data);

      // Navigate to results page
      navigate('/ai-quiz-results', {
        state: {
          attemptId: data.data.attemptId,
          score: data.data.score,
          totalQuestions: data.data.totalQuestions,
          percentage: data.data.percentage,
          correctAnswers: data.data.correctAnswers,
          timeTaken: data.data.timeTaken,
          topic,
          difficulty,
        },
      });

      setIsSubmitted(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit quiz';
      console.error('Error submitting quiz:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-blue-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
              {topic}
            </h1>
            <p className="text-blue-200 capitalize">
              Difficulty: <span className="font-semibold">{difficulty}</span>
            </p>
          </div>

          {/* Timer */}
          <div className="flex items-center gap-4">
              <CircularTimer timeLeft={timeRemaining} totalTime={totalQuestions * 60} />
            <div className="text-white text-right">
              <div className="text-sm text-blue-200">Time Remaining</div>
              <div className="text-2xl font-bold">
                {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Questions */}
          <div className="lg:col-span-2">
            <Card className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl p-8">
              {/* Question Stats */}
              <div className="mb-6 pb-6 border-b border-white/20">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-blue-300">
                    Question {currentQuestion + 1} of {totalQuestions}
                  </span>
                  <span className="text-sm px-3 py-1 bg-green-500/30 text-green-200 rounded-full">
                    {answeredCount} answered
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 mt-3">
                  <div
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question */}
              <div className="mb-8">
                <h2 className="text-xl md:text-2xl font-bold text-white mb-6">
                  {currentQ.question}
                </h2>

                {/* Options */}
                <div className="space-y-3">
                  {(currentQ as any).options.map((option: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => handleSelectAnswer(option)}
                      disabled={isSubmitted}
                      className={`w-full p-4 text-left rounded-lg font-semibold transition-all border-2 ${
                        answers[currentQuestion] === option
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 border-green-300 text-white shadow-lg'
                          : 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-bold ${
                            answers[currentQuestion] === option
                              ? 'bg-white/30 border-white'
                              : 'border-white/50'
                          }`}
                        >
                          {String.fromCharCode(65 + index)}
                        </span>
                        {option}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 mb-6">
                  {error}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3 justify-between">
                <Button
                  onClick={handlePrev}
                  disabled={currentQuestion === 0 || isSubmitted || loading}
                  className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  ← Previous
                </Button>

                {currentQuestion === totalQuestions - 1 ? (
                  <Button
                    onClick={handleSubmitQuiz}
                    disabled={loading || answeredCount === 0}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-lg transition-all shadow-lg disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Spinner size="sm" />
                        Submitting...
                      </span>
                    ) : (
                      '✓ Submit Quiz'
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    disabled={isSubmitted || loading}
                    className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    Next →
                  </Button>
                )}
              </div>
            </Card>
          </div>

          {/* Question Navigation Grid */}
          <div>
            <Card className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl p-6">
              <h3 className="text-white font-bold mb-4">Question Navigator</h3>
              <div className="grid grid-cols-5 gap-2">
                {(questions as any[]).map((_q: any, index: number) => (
                  <button
                    key={index}
                    onClick={() => handleNavigateToQuestion(index)}
                    disabled={isSubmitted}
                    className={`aspect-square rounded-lg font-bold text-sm transition-all ${
                      index === currentQuestion
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white scale-110 shadow-lg'
                        : answers[index] !== undefined
                        ? 'bg-green-500/50 text-white hover:bg-green-500/70'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              {/* Stats */}
              <div className="mt-6 pt-6 border-t border-white/20 space-y-3 text-sm">
                <div className="flex justify-between text-white">
                  <span>Answered:</span>
                  <span className="font-bold">{answeredCount}/{totalQuestions}</span>
                </div>
                <div className="flex justify-between text-blue-200">
                  <span>Remaining:</span>
                  <span className="font-bold">{totalQuestions - answeredCount}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
