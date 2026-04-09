import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ConfettiEffect } from '../components/quiz/ConfettiEffect';

export default function AIQuizResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    attemptId,
    score,
    totalQuestions,
    percentage,
    correctAnswers,
    timeTaken,
    topic,
    difficulty,
  } = location.state || {};

  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (percentage >= 70) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
  }, [percentage]);

  if (!attemptId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-blue-800 flex items-center justify-center">
        <Button onClick={() => navigate('/')}>← Go Home</Button>
      </div>
    );
  }

  const getGradeColor = (pct: number) => {
    if (pct >= 90) return 'text-green-400';
    if (pct >= 80) return 'text-emerald-400';
    if (pct >= 70) return 'text-blue-400';
    if (pct >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getGradeBg = (pct: number) => {
    if (pct >= 90) return 'from-green-600 to-emerald-600';
    if (pct >= 80) return 'from-emerald-600 to-teal-600';
    if (pct >= 70) return 'from-blue-600 to-cyan-600';
    if (pct >= 60) return 'from-yellow-600 to-orange-600';
    return 'from-red-600 to-pink-600';
  };

  const getGradeText = (pct: number) => {
    if (pct >= 90) return 'Outstanding! 🌟';
    if (pct >= 80) return 'Excellent! 🎉';
    if (pct >= 70) return 'Good Job! 👍';
    if (pct >= 60) return 'Decent! 💪';
    return 'Keep Trying! 📚';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-blue-800 p-4 md:p-8">
      {showConfetti && <ConfettiEffect trigger={showConfetti} />}

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            Quiz Completed!
          </h1>
          <p className="text-blue-200 text-lg">
            Great effort on {topic}
          </p>
        </div>

        {/* Score Card */}
        <Card className={`backdrop-blur-xl bg-gradient-to-br ${getGradeBg(percentage || 0)} border border-white/20 shadow-2xl p-8 mb-6`}>
          <div className="text-center space-y-6">
            {/* Grade Circle */}
            <div className="flex justify-center">
              <div className="relative w-48 h-48 rounded-full border-8 border-white/30 flex items-center justify-center bg-white/10 backdrop-blur-md">
                <div className="text-center">
                  <div className={`text-6xl font-bold ${getGradeColor(percentage || 0)}`}>
                    {Math.round(percentage || 0)}%
                  </div>
                  <div className="text-white mt-2 text-lg font-semibold">
                    {getGradeText(percentage)}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="text-white space-y-2">
              <p className="text-2xl font-bold">
                {correctAnswers} out of {totalQuestions} Correct
              </p>
              <p className="text-lg text-white/80">
                Score: <span className="font-bold">{score}/{totalQuestions}</span>
              </p>
            </div>
          </div>
        </Card>

        {/* Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {/* Time Taken */}
          <Card className="backdrop-blur-xl bg-white/10 border border-white/20 p-4 text-center">
            <div className="text-3xl mb-2">⏱️</div>
            <div className="text-2xl font-bold text-white">
              {Math.floor(timeTaken / 60)}:{(timeTaken % 60).toString().padStart(2, '0')}
            </div>
            <div className="text-sm text-blue-200">Time Taken</div>
          </Card>

          {/* Difficulty */}
          <Card className="backdrop-blur-xl bg-white/10 border border-white/20 p-4 text-center">
            <div className="text-3xl mb-2">⚡</div>
            <div className="text-2xl font-bold text-white capitalize">
              {difficulty}
            </div>
            <div className="text-sm text-blue-200">Difficulty</div>
          </Card>

          {/* Attempt ID */}
          <Card className="backdrop-blur-xl bg-white/10 border border-white/20 p-4 text-center md:col-span-3">
            <div className="text-sm text-blue-200 break-all">
              Attempt ID: <span className="font-mono text-white">{attemptId}</span>
            </div>
          </Card>
        </div>

        {/* Feedback */}
        <Card className="backdrop-blur-xl bg-white/10 border border-white/20 p-6 mb-6">
          <h3 className="text-white font-bold mb-3 text-lg">📊 Quiz Summary</h3>
          <div className="space-y-2 text-white/80">
            <p>✓ Questions Answered: {correctAnswers}/{totalQuestions}</p>
            <p>✓ Success Rate: {Math.round(percentage)}%</p>
            <p>✓ Time per Question: {(timeTaken / totalQuestions).toFixed(1)}s</p>
            <p>✓ Topic: {topic}</p>
            <p>✓ Difficulty: {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</p>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={() => navigate('/ai-quiz-generator')}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold text-lg rounded-lg transition-all shadow-lg"
          >
            ✨ Try Another Quiz
          </Button>

          <Button
            onClick={() => navigate('/dashboard')}
            className="w-full py-4 bg-white/10 hover:bg-white/20 text-white font-bold text-lg rounded-lg transition-all border border-white/30"
          >
            ← Back to Dashboard
          </Button>
        </div>

        {/* Leaderboard Link */}
        <div className="mt-8 text-center">
          <Button
            onClick={() => navigate('/ai-leaderboard')}
            className="px-6 py-2 text-blue-300 hover:text-white transition-colors"
          >
            View AI Leaderboard →
          </Button>
        </div>
      </div>
    </div>
  );
}
