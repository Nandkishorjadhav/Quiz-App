import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';
import { Badge } from '../components/ui/Badge';

export default function AILeaderboardPage() {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:5000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setCurrentUser(data.data.user);
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:5000/api/quiz/leaderboard?limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch leaderboard');
      }

      setLeaderboard(data.data || []);
      setError('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load leaderboard';
      console.error('Error fetching leaderboard:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-500 to-yellow-600';
    if (rank === 2) return 'from-gray-400 to-gray-500';
    if (rank === 3) return 'from-orange-500 to-orange-600';
    return 'from-blue-500 to-blue-600';
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-400';
    if (percentage >= 80) return 'text-emerald-400';
    if (percentage >= 70) return 'text-blue-400';
    if (percentage >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-blue-800 flex items-center justify-center p-4">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-blue-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
              🏆 AI Quiz Leaderboard
            </h1>
            <p className="text-blue-200 text-lg">
              Top performers on AI-generated quizzes
            </p>
          </div>
          <button
            onClick={() => navigate('/ai-quiz-generator')}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-lg transition-all shadow-lg"
          >
            ✨ Take a Quiz
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Leaderboard */}
        {leaderboard.length > 0 ? (
          <div className="space-y-4">
            {(leaderboard as any[]).map((entry) => {
              const isCurrentUser = currentUser && (entry as any).userId === (currentUser as any).id;

              return (
                <Card
                  key={entry.userId}
                  className={`backdrop-blur-xl border-2 shadow-xl transition-all ${
                    isCurrentUser
                      ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-purple-400/50 scale-105'
                      : 'bg-white/10 border-white/20 hover:border-white/40'
                  }`}
                >
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      {/* Rank & Name */}
                      <div className="md:col-span-4 flex items-center gap-4">
                        <div
                          className={`w-14 h-14 rounded-full bg-gradient-to-br ${getRankColor(
                            entry.rank
                          )} flex items-center justify-center text-white font-bold text-xl shadow-lg`}
                        >
                          {getMedalEmoji(entry.rank)}
                        </div>
                        <div>
                          <div className="font-bold text-white text-lg">
                            {entry.userName}
                            {isCurrentUser && <Badge variant="primary" className="ml-2">You</Badge>}
                          </div>
                          <div className="text-sm text-blue-200">#{entry.rank} Position</div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="md:col-span-5 grid grid-cols-3 gap-4">
                        {/* Score */}
                        <div className="text-center">
                          <div className={`text-xl font-bold ${getPercentageColor(entry.bestScore)}`}>
                            {Math.round(entry.bestScore)}%
                          </div>
                          <div className="text-xs text-blue-200">Best Score</div>
                        </div>

                        {/* Average */}
                        <div className="text-center">
                          <div className="text-xl font-bold text-blue-300">
                            {entry.averageScore.toFixed(1)}%
                          </div>
                          <div className="text-xs text-blue-200">Average</div>
                        </div>

                        {/* Attempts */}
                        <div className="text-center">
                          <div className="text-xl font-bold text-white">
                            {entry.totalAttempts}
                          </div>
                          <div className="text-xs text-blue-200">Attempts</div>
                        </div>
                      </div>

                      {/* Time */}
                      <div className="md:col-span-3 text-right">
                        <div className="text-sm text-blue-200">Total Time</div>
                        <div className="text-lg font-bold text-white">
                          {formatTime(entry.totalTimeSpent)}
                        </div>
                      </div>
                    </div>

                    {/* Last Attempt */}
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="text-xs text-blue-300">
                        Last attempt: {new Date(entry.lastAttemptAt).toLocaleDateString()} at{' '}
                        {new Date(entry.lastAttemptAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="backdrop-blur-xl bg-white/10 border border-white/20 p-12 text-center">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="text-2xl font-bold text-white mb-2">No Leaderboard Data Yet</h3>
            <p className="text-blue-200 mb-6">
              Be the first to generate and complete an AI quiz!
            </p>
            <button
              onClick={() => navigate('/ai-quiz-generator')}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-lg transition-all shadow-lg"
            >
              ✨ Start Quiz
            </button>
          </Card>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-blue-300 hover:text-white transition-colors text-lg"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
