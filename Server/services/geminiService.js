import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
const USE_MOCK_MODE = process.env.USE_MOCK_QUIZ === 'true';

// Validate API key on startup
if (!API_KEY || API_KEY === 'sk-your-api-key-here') {
  console.error('❌ GOOGLE_GEMINI_API_KEY is not properly configured');
  console.error('Please set your Google Gemini API key in .env file');
  console.error('Get your free API key from: https://aistudio.google.com/app/apikey');
}

if (USE_MOCK_MODE) {
  console.log('🧪 Mock Quiz Mode ENABLED - Using generated test data instead of Gemini API');
}

let genAI;
let model;

try {
  if (API_KEY && API_KEY !== 'sk-your-api-key-here') {
    genAI = new GoogleGenerativeAI(API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    console.log('✅ Google Gemini API initialized successfully');
  }
} catch (error) {
  console.error('❌ Failed to initialize Google Gemini API:', error.message);
}

/**
 * Generate mock quiz questions for testing
 * @param {string} topic - The topic for questions
 * @param {string} difficulty - Difficulty level (easy/medium/hard)
 * @param {number} numberOfQuestions - Number of questions to generate
 * @returns {Array} Array of mock questions
 */
function generateMockQuestions(topic, difficulty, numberOfQuestions) {
  const mockBank = {
    'React': {
      easy: [
        { question: 'What is React?', options: ['A JavaScript library for UI', 'A CSS framework', 'A database tool', 'A backend framework'], correctAnswer: 'A JavaScript library for UI' },
        { question: 'React was created by?', options: ['Facebook', 'Google', 'Microsoft', 'Netflix'], correctAnswer: 'Facebook' },
        { question: 'What is JSX?', options: ['A syntax extension for React', 'A styling language', 'A testing tool', 'A package manager'], correctAnswer: 'A syntax extension for React' },
      ],
      medium: [
        { question: 'What is the Virtual DOM in React?', options: ['An in-memory representation of UI', 'A real DOM element', 'A browser API', 'A state management library'], correctAnswer: 'An in-memory representation of UI' },
        { question: 'What are React Hooks?', options: ['Functions that let you use state in functional components', 'CSS hover effects', 'Database queries', 'API endpoints'], correctAnswer: 'Functions that let you use state in functional components' },
        { question: 'What does useState do?', options: ['Adds state to functional components', 'Creates a new URL', 'Manages styles', 'Defines props'], correctAnswer: 'Adds state to functional components' },
      ],
      hard: [
        { question: 'What is the difference between state and props?', options: ['State is mutable and local, props are immutable and passed from parent', 'They are identical', 'Props are mutable, state is not', 'State is global, props are local'], correctAnswer: 'State is mutable and local, props are immutable and passed from parent' },
        { question: 'How does React reconciliation work?', options: ['React compares virtual DOMs and updates only changed elements', 'React updates all elements', 'React removes and recreates everything', 'React uses server-side rendering'], correctAnswer: 'React compares virtual DOMs and updates only changed elements' },
        { question: 'What is the purpose of useEffect cleanup?', options: ['To clean up subscriptions and prevent memory leaks', 'To delete components', 'To reset styling', 'To clear localStorage'], correctAnswer: 'To clean up subscriptions and prevent memory leaks' },
      ],
    },
    'JavaScript': {
      easy: [
        { question: 'What is JavaScript?', options: ['A programming language for web development', 'A coffee brand', 'A database system', 'A styling language'], correctAnswer: 'A programming language for web development' },
        { question: 'var, let, const are used for?', options: ['Variable declaration', 'Function definition', 'Object creation', 'Import statements'], correctAnswer: 'Variable declaration' },
        { question: 'What is the difference between == and ===?', options: ['=== checks type, == does not', '== checks type, === does not', 'They are the same', 'Both are for assignment'], correctAnswer: '=== checks type, == does not' },
      ],
      medium: [
        { question: 'What is closure in JavaScript?', options: ['A function that has access to its outer scope even after the outer function returns', 'A loop termination', 'A type of variable', 'A debugging tool'], correctAnswer: 'A function that has access to its outer scope even after the outer function returns' },
        { question: 'What is hoisting?', options: ['Moving declarations to the top of their scope before execution', 'Lifting objects', 'Creating new variables', 'Importing modules'], correctAnswer: 'Moving declarations to the top of their scope before execution' },
        { question: 'What does async/await do?', options: ['Handles asynchronous code in a synchronous manner', 'Makes code faster', 'Automatically saves data', 'Prevents bugs'], correctAnswer: 'Handles asynchronous code in a synchronous manner' },
      ],
      hard: [
        { question: 'What is event bubbling?', options: ['Events propagate from child to parent elements', 'Events propagate from parent to child', 'Events are prevented from propagating', 'Events are duplicated'], correctAnswer: 'Events propagate from child to parent elements' },
        { question: 'What is the event loop?', options: ['Mechanism that allows JavaScript to perform tasks concurrently', 'A UI component', 'A function that loops forever', 'A memory management tool'], correctAnswer: 'Mechanism that allows JavaScript to perform tasks concurrently' },
        { question: 'What is throttling vs debouncing?', options: ['Throttling limits function calls, debouncing delays them', 'They are identical', 'Debouncing limits, throttling delays', 'Both prevent all function calls'], correctAnswer: 'Throttling limits function calls, debouncing delays them' },
      ],
    },
    'Python': {
      easy: [
        { question: 'What is Python?', options: ['A high-level programming language', 'A type of snake', 'A web server', 'A database'], correctAnswer: 'A high-level programming language' },
        { question: 'How do you create a comment in Python?', options: ['Using #', 'Using //', 'Using /* */', 'Using --'], correctAnswer: 'Using #' },
        { question: 'What is a list in Python?', options: ['An ordered collection of items', 'A mathematical formula', 'A function definition', 'An import statement'], correctAnswer: 'An ordered collection of items' },
      ],
      medium: [
        { question: 'What is list comprehension?', options: ['A concise way to create lists using a single line', 'A way to explain lists', 'A type of loop', 'A documentation tool'], correctAnswer: 'A concise way to create lists using a single line' },
        { question: 'What is a lambda function?', options: ['An anonymous function defined in a single line', 'A data type', 'A module', 'A class definition'], correctAnswer: 'An anonymous function defined in a single line' },
        { question: 'What is the difference between append and extend?', options: ['append adds one item, extend adds multiple items', 'They do the same thing', 'extend adds one item, append adds multiple', 'Only one of them exists'], correctAnswer: 'append adds one item, extend adds multiple items' },
      ],
      hard: [
        { question: 'What is a generator?', options: ['A function that returns an iterator using yield', 'A tool to create programs', 'A type of loop', 'A memory allocation method'], correctAnswer: 'A function that returns an iterator using yield' },
        { question: 'What is the GIL in Python?', options: ['Global Interpreter Lock that prevents true multithreading', 'A type of variable', 'A networking protocol', 'A memory management system'], correctAnswer: 'Global Interpreter Lock that prevents true multithreading' },
        { question: 'What is the difference between *args and **kwargs?', options: ['*args is tuple of positional args, **kwargs is dict of keyword args', 'They are identical', '*args is dict, **kwargs is tuple', 'Only one of them is valid'], correctAnswer: '*args is tuple of positional args, **kwargs is dict of keyword args' },
      ],
    },
  };

  // Get mock data for the topic, fallback to generic questions
  const topicData = mockBank[topic] || mockBank['JavaScript'];
  const difficultyQuestions = topicData[difficulty] || topicData.easy;

  // Generate requested number of questions by cycling through available questions
  const questions = [];
  for (let i = 0; i < numberOfQuestions; i++) {
    const baseQuestion = difficultyQuestions[i % difficultyQuestions.length];
    questions.push({
      question: `${baseQuestion.question} (${i + 1}/${numberOfQuestions})`,
      options: baseQuestion.options,
      correctAnswer: baseQuestion.correctAnswer,
    });
  }

  return questions;
}

/**
 * Generate multiple choice questions using Google Gemini
 * @param {string} topic - The topic for questions
 * @param {string} difficulty - Difficulty level (easy/medium/hard)
 * @param {number} numberOfQuestions - Number of questions to generate
 * @returns {Promise<Array>} Array of generated questions
 */
export async function generateQuestionsWithAI(topic, difficulty, numberOfQuestions) {
  try {
    // Use mock mode if enabled
    if (USE_MOCK_MODE) {
      console.log(`🧪 Generating ${numberOfQuestions} mock ${difficulty} questions on: ${topic}`);
      const mockQuestions = generateMockQuestions(topic, difficulty, numberOfQuestions);
      console.log(`✅ Successfully generated ${mockQuestions.length} mock questions`);
      return mockQuestions;
    }

    if (!API_KEY || API_KEY === 'sk-your-api-key-here') {
      throw new Error(
        'Google Gemini API key is not configured. ' +
        'Please set GOOGLE_GEMINI_API_KEY in .env file. ' +
        'Get your free API key from: https://aistudio.google.com/app/apikey'
      );
    }

    if (!model) {
      throw new Error('Google Gemini API failed to initialize. Please check your API key.');
    }

    const prompt = `Generate exactly ${numberOfQuestions} multiple choice questions on the topic "${topic}" with "${difficulty}" difficulty level.

Requirements:
1. Each question must have exactly 4 options (A, B, C, D)
2. Only one correct answer per question
3. Questions should be clear and unambiguous
4. Ensure difficulty matches: 
   - easy: Basic concepts, straightforward answers
   - medium: Some analysis required, practical application
   - hard: Deep understanding, complex scenarios
5. Ensure all questions are unique and not repetitive
6. Return ONLY a valid JSON array in this exact format:

[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A"
  }
]

Important:
- Return ONLY the JSON array, no additional text
- Each question must have the exact structure shown above
- The correctAnswer must be one of the options exactly as written
- Do NOT include any explanation or markdown formatting`;

    console.log(`📝 Generating ${numberOfQuestions} ${difficulty} questions on: ${topic}`);

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Extract JSON from response (in case there's extra text)
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from AI response');
    }

    const questions = JSON.parse(jsonMatch[0]);

    // Validate response
    if (!Array.isArray(questions)) {
      throw new Error('AI response is not an array');
    }

    if (questions.length === 0) {
      throw new Error('AI generated no questions');
    }

    // Validate each question structure
    const validatedQuestions = questions.map((q, index) => {
      if (!q.question || !Array.isArray(q.options) || !q.correctAnswer) {
        throw new Error(`Question ${index + 1} has invalid structure`);
      }

      if (q.options.length !== 4) {
        throw new Error(`Question ${index + 1} does not have exactly 4 options`);
      }

      if (!q.options.includes(q.correctAnswer)) {
        throw new Error(`Question ${index + 1}: correctAnswer is not in options`);
      }

      return {
        question: q.question.trim(),
        options: q.options.map(opt => opt.trim()),
        correctAnswer: q.correctAnswer.trim(),
      };
    });

    console.log(`✅ Successfully generated ${validatedQuestions.length} questions`);
    return validatedQuestions;
  } catch (error) {
    console.error('❌ Error generating questions with AI:', error.message);
    throw new Error(`AI Question Generation failed: ${error.message}`);
  }
}

/**
 * Validate if questions are unique
 * @param {Array} questions - Array of questions to check
 * @returns {boolean} True if all questions are unique
 */
export function areQuestionsUnique(questions) {
  const questionIds = new Set();

  for (const q of questions) {
    // Normalize question text for comparison
    const normalized = q.question.toLowerCase().trim();
    if (questionIds.has(normalized)) {
      return false;
    }
    questionIds.add(normalized);
  }

  return true;
}

/**
 * Test Gemini API connectivity
 * @returns {Promise<boolean>} True if API is working
 */
export async function testGeminiAPI() {
  try {
    if (!API_KEY) {
      console.error('❌ GOOGLE_GEMINI_API_KEY not configured');
      return false;
    }

    const result = await model.generateContent('Say "Gemini AI is working"');
    const text = result.response.text();
    console.log('✅ Gemini API is working:', text);
    return true;
  } catch (error) {
    console.error('❌ Gemini API test failed:', error.message);
    return false;
  }
}

export default {
  generateQuestionsWithAI,
  areQuestionsUnique,
  testGeminiAPI,
};
