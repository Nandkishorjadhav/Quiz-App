import { z } from 'zod';

// ─── Auth Schemas ─────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(50),
    email: z.string().min(1, 'Email is required').email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string(),
    role: z.enum(['student', 'admin']),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// ─── Admin Question Schema ────────────────────────────────────────────────────

export const questionSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  text: z.string().min(10, 'Question must be at least 10 characters').max(500),
  optionA: z.string().min(1, 'Option A is required').max(200),
  optionB: z.string().min(1, 'Option B is required').max(200),
  optionC: z.string().min(1, 'Option C is required').max(200),
  optionD: z.string().min(1, 'Option D is required').max(200),
  correctOption: z.enum(['a', 'b', 'c', 'd']),
  explanation: z.string().min(10, 'Explanation must be at least 10 characters').max(600),
  points: z.coerce.number().min(1).max(5),
  tags: z.string().optional(),
});

export const customCategorySchema = z.object({
  label: z.string().min(2, 'Name must be at least 2 characters').max(40),
  icon: z.string().min(1, 'Pick an emoji icon').max(4),
  description: z.string().min(10, 'Description too short').max(120),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color e.g. #3B82F6'),
  gradient: z.string().min(1, 'Gradient is required'),
});

export const specialQuizSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(80),
  description: z.string().max(200).optional(),
  category: z.string().min(1, 'Category is required'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  questionCount: z.coerce.number().min(2).max(30),
  timePerQuestion: z.coerce.number().min(10).max(120),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type SignupFormValues = z.infer<typeof signupSchema>;
export type QuestionFormValues = z.infer<typeof questionSchema>;
export type CustomCategoryFormValues = z.infer<typeof customCategorySchema>;
export type SpecialQuizFormValues = z.infer<typeof specialQuizSchema>;
