// FINAL PREMIUM UI (RESPONSIVE + LIGHT MODE FIXED + BIGGER CARD)
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Brain, BookOpen, AlertCircle, Check } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';
import { useAuth } from '../context/AuthContext';
import { generateQuiz } from '../services/aiQuizService';

export default function AIQuizGenerator() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [numberOfQuestions, setNumberOfQuestions] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const topicSuggestions = ['JavaScript','React','Python','DB','Web','API','DSA','ML'];

  const handleGenerateQuiz = async (e: any) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!topic.trim()) return setError('Enter topic');

    setLoading(true);
    try {
      const data = await generateQuiz(topic, difficulty, numberOfQuestions);
      setSuccess(true);
      setTimeout(() => navigate('/ai-quiz', { state: data }), 800);
    } catch (err: any) {
      setError(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className=" flex items-center justify-center bg-transparent ">

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >

        {/* HEADER */}
        <div className="text-center mb-10">
          <Brain className="w-14 h-14 mx-auto text-purple-500 mb-4" />
          <h1 className="text-5xl font-black bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-transparent bg-clip-text">
            AI Quiz Generator
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
            Generate smart quizzes instantly
          </p>
        </div>

        {/* CARD */}
        <Card className="relative p-8 md:p-10 rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-xl transition-all duration-300">

          {/* LOADING */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm rounded-3xl z-50">
              <Spinner />
            </div>
          )}

          {/* SUCCESS */}
          {success && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-500/10 backdrop-blur-md rounded-3xl z-50">
              <Check className="w-16 h-16 text-green-400" />
              <p className="text-xl font-bold mt-3">🚀 Quiz Ready!</p>
            </div>
          )}

          <form onSubmit={handleGenerateQuiz} className="space-y-7">

            {/* ERROR */}
            {error && (
              <div className="flex gap-2 p-3 text-sm bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-300 rounded-lg">
                <AlertCircle size={18}/> {error}
              </div>
            )}

            {/* TOPIC */}
            <div>
              <label className="flex items-center gap-2 text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <BookOpen size={18}/> Topic
              </label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter topic..."
                className="bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 text-base"
              />

              <div className="flex flex-wrap gap-2 mt-3">
                {topicSuggestions.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTopic(t)}
                    className="text-sm px-4 py-1.5 rounded-full bg-gray-200 dark:bg-white/5 hover:bg-purple-500 hover:text-white transition"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* DIFFICULTY */}
            <div>
              <label className="flex items-center gap-2 text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
                <Zap size={18}/> Difficulty
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['easy','medium','hard'].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setDifficulty(level as any)}
                    className={`py-3 rounded-xl text-base font-bold transition-all ${
                      difficulty === level
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                        : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
                    }`}>
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* SLIDER */}
            <div>
              <label className="text-base text-gray-600 dark:text-gray-400">
                Questions: <span className="font-bold">{numberOfQuestions}</span>
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={numberOfQuestions}
                onChange={(e) => setNumberOfQuestions(parseInt(e.target.value))}
                className="w-full mt-2 accent-purple-500"
              />
            </div>

            {/* BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-lg text-white bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:scale-[1.03] active:scale-95 transition-all shadow-lg"
            >
              {loading ? 'Generating...' : '✨ Generate Quiz'}
            </button>

            {user && (
              <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                Logged in as <span className="font-semibold">{user.name}</span>
              </p>
            )}
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
