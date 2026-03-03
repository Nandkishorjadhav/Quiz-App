import type { CategoryMeta } from '@/types';
import jsLogo from '@/assets/js.webp';
import pythonLogo from '@/assets/python-brands-solid-full.svg';
import javaLogo from '@/assets/java-brands-solid-full.svg';
import cppLogo from '@/assets/C++.webp';

export const CATEGORIES: CategoryMeta[] = [
  {
    id: 'javascript',
    label: 'JavaScript',
    icon: '⚡',
    image: jsLogo,
    color: '#F7DF1E',
    gradient: 'from-yellow-400 to-orange-500',
    description: 'ES6+, async/await, closures, prototypes',
  },
  {
    id: 'python',
    label: 'Python',
    icon: '🐍',
    image: pythonLogo,
    color: '#3776AB',
    gradient: 'from-blue-500 to-cyan-400',
    description: 'Data structures, OOP, decorators, generators',
  },
  {
    id: 'java',
    label: 'Java',
    icon: '☕',
    image: javaLogo,
    color: '#007396',
    gradient: 'from-orange-600 to-red-600',
    description: 'OOP, Collections, Streams, Spring',
  },
  {
    id: 'cpp',
    label: 'C++',
    icon: '⚙️',
    image: cppLogo,
    color: '#00599C',
    gradient: 'from-blue-700 to-indigo-800',
    description: 'Pointers, STL, templates, memory management',
  },
  {
    id: 'sql',
    label: 'SQL',
    icon: '🗄️',
    color: '#CC2927',
    gradient: 'from-teal-500 to-emerald-600',
    description: 'Joins, aggregations, indexes, transactions',
  },
];
