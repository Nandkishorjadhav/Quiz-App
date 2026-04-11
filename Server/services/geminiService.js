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
 * Generate dynamic mock quiz questions based on topic
 * @param {string} topic - The topic for questions
 * @param {string} difficulty - Difficulty level (easy/medium/hard)
 * @param {number} numberOfQuestions - Number of questions to generate
 * @returns {Array} Array of generated questions
 */
function generateDynamicMockQuestions(topic, difficulty, numberOfQuestions) {
  // Normalize topic
  const normalizedTopic = topic.toLowerCase().trim();

  // Define difficulty-based question patterns
  const difficultyPatterns = {
    easy: {
      patterns: [
        `What is ${topic}?`,
        `${topic} is primarily used for?`,
        `Which of the following is correct about ${topic}?`,
        `What does ${topic} stand for?`,
        `${topic} was created by?`,
        `What is a basic feature of ${topic}?`,
        `Which best describes ${topic}?`,
      ],
      answerStyles: [
        'Basic definition',
        'Common use case',
        'Historical fact',
        'Simple concept',
        'Core feature',
      ],
    },
    medium: {
      patterns: [
        `How does ${topic} handle X?`,
        `What is the difference between X and Y in ${topic}?`,
        `Which is best practice in ${topic}?`,
        `How would you use ${topic} for X?`,
        `What are the advantages of ${topic}?`,
        `How does ${topic} compare to alternatives?`,
        `What is a key concept in ${topic}?`,
      ],
      answerStyles: [
        'Conceptual understanding',
        'Comparative analysis',
        'Best practice',
        'Implementation strategy',
        'Technical feature',
      ],
    },
    hard: {
      patterns: [
        `Advanced: What is the mechanism behind ${topic}?`,
        `How would you optimize ${topic}?`,
        `Explain the architecture of ${topic}`,
        `What advanced feature does ${topic} provide?`,
        `How does ${topic} handle complex scenarios?`,
        `What are the limitations of ${topic}?`,
        `Design pattern in ${topic}: Which approach is best?`,
      ],
      answerStyles: [
        'Deep technical knowledge',
        'Advanced optimization',
        'Architectural decision',
        'Complex implementation',
        'Performance consideration',
      ],
    },
  };

  // Answer options generator
  function generateOptions(correctAnswer) {
    const incorrectOptions = [
      `It's related to system administration`,
      `It's a database management tool`,
      `It's primarily for data visualization`,
      `It's a security protocol`,
      `It's a networking framework`,
      `It's used for version control`,
      `It's a testing framework`,
      `It's related to machine learning`,
      `It's a deployment tool`,
      `It's a caching mechanism`,
    ];

    // Shuffle and pick random incorrect options
    const shuffled = incorrectOptions.sort(() => 0.5 - Math.random());
    const wrong1 = shuffled[0];
    const wrong2 = shuffled[1];
    const wrong3 = shuffled[2];

    const options = [correctAnswer, wrong1, wrong2, wrong3];
    // Shuffle options
    return options.sort(() => 0.5 - Math.random());
  }

  function generateCorrectAnswer(pattern, difficulty) {
    const answers = {
      easy: [
        `A powerful tool for modern ${normalizedTopic} development`,
        `An essential framework in the ${normalizedTopic} ecosystem`,
        `A key technology that simplifies ${normalizedTopic}`,
        `The standard approach in ${normalizedTopic}`,
        `A fundamental concept of ${normalizedTopic}`,
      ],
      medium: [
        `Through its built-in abstraction layer`,
        `Using its event-driven architecture`,
        `By implementing a modular design pattern`,
        `Through middleware and lifecycle hooks`,
        `Using reactive programming principles`,
      ],
      hard: [
        `By optimizing memory allocation and garbage collection`,
        `Through lazy evaluation and just-in-time compilation`,
        `Using sophisticated caching and memoization strategies`,
        `By implementing asynchronous I/O operations efficiently`,
        `Through compile-time optimization and tree-shaking`,
      ],
    };

    return answers[difficulty][Math.floor(Math.random() * answers[difficulty].length)];
  }

  const patterns = difficultyPatterns[difficulty]?.patterns || difficultyPatterns.easy.patterns;
  const questions = [];
  const usedPatterns = new Set();

  for (let i = 0; i < numberOfQuestions; i++) {
    // Get a pattern, cycling through if necessary
    let pattern = patterns[i % patterns.length];
    let attempts = 0;
    while (usedPatterns.has(pattern) && attempts < 5) {
      pattern = patterns[Math.floor(Math.random() * patterns.length)];
      attempts++;
    }
    usedPatterns.add(pattern);

    // Generate question
    const questionText = pattern.replace(/X/g, `${normalizedTopic} features`).replace(/Y/g, `alternative tools`);

    // Generate answer
    const correctAnswer = generateCorrectAnswer(pattern, difficulty);

    // Generate options
    const options = generateOptions(correctAnswer);

    questions.push({
      question: questionText,
      options,
      correctAnswer,
    });
  }

  return questions;
}

/**
 * Generate mock quiz questions for testing
 * @param {string} topic - The topic for questions
 * @param {string} difficulty - Difficulty level (easy/medium/hard)
 * @param {number} numberOfQuestions - Number of questions to generate
 * @returns {Array} Array of mock questions
 */
function generateMockQuestions(topic, difficulty, numberOfQuestions) {
  // Use dynamic generator for ANY topic
  return generateDynamicMockQuestions(topic, difficulty, numberOfQuestions);
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
