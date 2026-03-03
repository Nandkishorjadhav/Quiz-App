import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function NotFoundPage() {
  useDocumentTitle('404 — Not Found');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="glass rounded-3xl p-10 max-w-md w-full text-center shadow-2xl"
      >
        {/* Large 404 */}
        <motion.p
          className="text-[120px] font-extrabold leading-none bg-gradient-to-br from-primary-400 to-accent-500 bg-clip-text text-transparent select-none"
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        >
          404
        </motion.p>

        <h1 className="text-2xl font-bold text-[var(--text)] mt-2">Page Not Found</h1>
        <p className="text-[var(--text-muted)] mt-2 text-sm">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <Button
            variant="outline"
            leftIcon={<ArrowLeft size={16} />}
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
          <Button
            variant="primary"
            leftIcon={<Home size={16} />}
            onClick={() => navigate('/dashboard')}
          >
            Dashboard
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
