// src/app/api/quiz/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, difficulty, questionCount } = body;

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    // Generate quiz using Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Generate a multiple-choice quiz on the topic: "${topic}" with ${questionCount} questions at ${difficulty} difficulty level.

Format the response as a valid JSON array with this structure:
[
  {
    "question": "Question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Brief explanation of the correct answer"
  }
]

Make sure the questions are clear, educational, and appropriate for the ${difficulty} level. For WAEC or JAMB standards, follow Nigerian curriculum standards.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Extract JSON from response
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    const questions = JSON.parse(text);

    // Generate a simple quiz ID
    const quizId = `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return NextResponse.json({ quizId, questions });
  } catch (error: any) {
    console.error('Quiz generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate quiz', details: error.message },
      { status: 500 }
    );
  }
}
    }

    const body = await request.json();
    const { quiz_id, answers } = body;

    if (!quiz_id || !answers) {
      return NextResponse.json(
        { error: 'quiz_id and answers are required' },
        { status: 400 }
      );
    }

    // Get the quiz
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', quiz_id)
      .eq('user_id', user.id)
      .single();

    if (quizError || !quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    // Calculate score
    let correctCount = 0;
    const gradedQuestions = quiz.questions.map((q: any) => {
      const userAnswer = answers[q.id];
      let isCorrect = false;

      if (q.type === 'mcq') {
        isCorrect = userAnswer?.toUpperCase() === q.correct_answer.toUpperCase();
        if (isCorrect) correctCount++;
      }

      return {
        ...q,
        user_answer: userAnswer,
        is_correct: isCorrect,
      };
    });

    const score = Math.round((correctCount / quiz.questions.length) * 100);

    // Update quiz with answers and score
    const { data: updatedQuiz, error: updateError } = await supabase
      .from('quizzes')
      .update({
        questions: gradedQuestions,
        score,
        completed_at: new Date().toISOString(),
      })
      .eq('id', quiz_id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ 
      quiz: updatedQuiz,
      score,
      correct: correctCount,
      total: quiz.questions.length,
    });
  } catch (error) {
    console.error('Quiz submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit quiz' },
      { status: 500 }
    );
  }
}
