import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

// Validate API key on startup
if (!API_KEY || API_KEY === 'sk-your-api-key-here') {
  console.error('❌ GOOGLE_GEMINI_API_KEY is not properly configured');
  console.error('Please set your Google Gemini API key in .env file');
  console.error('Get your free API key from: https://aistudio.google.com/app/apikey');
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
 * Generate multiple choice questions using Google Gemini
 * @param {string} topic - The topic for questions
 * @param {string} difficulty - Difficulty level (easy/medium/hard)
 * @param {number} numberOfQuestions - Number of questions to generate
 * @returns {Promise<Array>} Array of generated questions
 */
export async function generateQuestionsWithAI(topic, difficulty, numberOfQuestions) {
  try {
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
