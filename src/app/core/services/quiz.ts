
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
export interface QuizOptionRequest {
  text: string;
  isCorrect: boolean;
}
export enum QuizType {
  EndOfLesson = 0,
  Prerequisite = 1
}
export interface QuizQuestionRequest {
  text: string;
  options: QuizOptionRequest[];
}

export interface CreateQuizRequest {
  title: string;
  type: number;
  questionCount: number;
  questions: QuizQuestionRequest[];
}

export interface QuizOptionResponse {
  id: number;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestionResponse {
  id: number;
  text: string;
  order: number;
  options: QuizOptionResponse[];
}

export interface QuizResponse {
  id: number;
  lessonId: number;
  title: string;
  type: number;
  questionCount: number;
  passingScore: number;
  isActive: boolean;
  questions: QuizQuestionResponse[];
}
export interface StudentQuizOption {
  id: number;
  text: string;
}

export interface StudentQuizQuestion {
  id: number;
  text: string;
  order: number;
  options: StudentQuizOption[];
}

export interface StudentQuiz {
  id: number;
  lessonId: number;
  title: string;
  type: number | string;
  questionCount: number;
  passingScore: number;
  questions: StudentQuizQuestion[];
}

export interface SubmitQuizAnswer {
  questionId: number;
  selectedOptionId: number;
}

export interface SubmitQuizRequest {
  answers: SubmitQuizAnswer[];
}

export interface QuizResult {
  id: number;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  passed: boolean;
  submittedAt: string;
  unlockedNextLesson: boolean;
}

export interface SubmitQuizResponse {
  message: string;
  result: QuizResult;
}

@Injectable({
  providedIn: 'root'
})
export class QuizService {
  private readonly apiUrl = 'https://localhost:7109/api/Quiz';

  constructor(private http: HttpClient) {}

  getLessonQuizzes(lessonId: number): Observable<QuizResponse[]> {
    return this.http.get<QuizResponse[]>(
      `${this.apiUrl}/lesson/${lessonId}`,
      { withCredentials: true }
    );
  }

getStudentLessonQuizzes(lessonId: number): Observable<StudentQuiz[]> {
  return this.http.get<StudentQuiz[]>(
    `${this.apiUrl}/lesson/${lessonId}/student`,
    { withCredentials: true }
  );
}

  createQuiz(
    lessonId: number,
    quiz: CreateQuizRequest
  ): Observable<QuizResponse> {
    return this.http.post<QuizResponse>(
      `${this.apiUrl}/lesson/${lessonId}`,
      quiz,
      { withCredentials: true }
    );
  }

  getStudentQuiz(quizId: number): Observable<StudentQuiz> {
    return this.http.get<StudentQuiz>(
      `${this.apiUrl}/${quizId}/student`,
      { withCredentials: true }
    );
  }

  submitQuiz(
    quizId: number,
    request: SubmitQuizRequest
  ): Observable<SubmitQuizResponse> {
    return this.http.post<SubmitQuizResponse>(
      `${this.apiUrl}/${quizId}/submit`,
      request,
      { withCredentials: true }
    );
  }
}
