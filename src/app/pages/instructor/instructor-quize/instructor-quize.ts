
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OnInit } from '@angular/core';
import { TrackService } from '../../../core/services/track.service';
import { Track } from '../../../core/models/track';
import { Lesson } from '../../../core/models/lesson';
import {
  QuizService,
  QuizResponse,
  CreateQuizRequest
} from '../../../core/services/quiz';
import { LanguageService } from '../../../core/services/language.service';
import { environment } from '../../../../environments/environment';
import {
  ChangeDetectorRef,inject
} from '@angular/core';
interface TrackOption {
  id: number;
  title: string;
}

interface LessonOption {
  id: number;
  title: string;
  order: number;
}

interface QuizSummary {
  id: number;
  title: string;
  type: 'EndOfLesson' | 'Prerequisite';
  questionCount: number;
  isActive: boolean;
}

interface QuizQuestionForm {
  text: string;
  options: string[];
  correctOptionIndex: number;
}

@Component({
  selector: 'app-instructor-quize',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './instructor-quize.html',
  styleUrl: './instructor-quize.css'
})
export class InstructorQuize implements OnInit {
  // These lists will be populated from your backend.
  tracks: Track[] = [];
  lessons: Lesson[] = [];
  quizzes: QuizSummary[] = [];

  selectedTrackId: number | null = null;
  selectedLessonId: number | null = null;

  quizTitle = '';
  quizDescription = '';
  quizType: 'EndOfLesson' | 'Prerequisite' = 'EndOfLesson';
  questionCount = 10;

  questions: QuizQuestionForm[] = [];

  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';
private cdr = inject(ChangeDetectorRef);
  constructor(
  private trackService: TrackService,
  private quizService: QuizService,
     public languageService: LanguageService,
) {}

ngOnInit(): void {
  this.initializeQuestions();
  this.loadTracks();
}

  get selectedLesson(): LessonOption | undefined {
    return this.lessons.find(
      lesson => lesson.id === Number(this.selectedLessonId)
    );
  }

  get selectedTrack(): TrackOption | undefined {
    return this.tracks.find(
      track => track.id === Number(this.selectedTrackId)
    );
  }
loadTracks(): void {
  this.loading = true;
  this.errorMessage = '';

  this.trackService.getMyTracks().subscribe({
    next: (data) => {
      this.tracks = data;
      this.loading = false;
        this.cdr.markForCheck();
    },
    error: (error) => {
      console.error('Error loading assigned tracks:', error);
      this.errorMessage = 'Failed to load your assigned tracks.';
      this.loading = false;
    }
  });
}
onTrackChange(): void {
  this.selectedLessonId = null;
  this.lessons = [];
  this.quizzes = [];
  this.clearMessages();

  if (!this.selectedTrackId) {
    return;
  }

  this.loading = true;

  this.trackService.getLessonsByTrack(this.selectedTrackId).subscribe({
    next: (data) => {
      this.lessons = data;
      this.loading = false;
        this.cdr.markForCheck();
    },
    error: (error) => {
      console.error('Error loading lessons:', error);
      this.errorMessage = 'Failed to load lessons for this track.';
      this.loading = false;
    }
  });
}

onLessonChange(): void {
  this.quizzes = [];
  this.clearMessages();

  if (!this.selectedLessonId) {
    return;
  }

  this.loading = true;

  this.quizService.getLessonQuizzes(this.selectedLessonId).subscribe({
    next: (data: QuizResponse[]) => {
      this.quizzes = data.map(quiz => ({
        id: quiz.id,
        title: quiz.title,
        type: quiz.type === 0 ? 'EndOfLesson' : 'Prerequisite',
        questionCount: quiz.questionCount,
        isActive: quiz.isActive
      }));

      this.loading = false;
        this.cdr.markForCheck();
    },
    error: (error) => {
      console.error('Error loading lesson quizzes:', error);
      this.errorMessage = 'Failed to load quizzes for this lesson.';
      this.loading = false;
    }
  });
}

onQuestionCountChange(): void {
  this.questionCount = Number(this.questionCount);

  this.initializeQuestions();
}

initializeQuestions(): void {
  this.questions = Array.from(
    { length: Number(this.questionCount) },
    () => ({
      text: '',
      options: ['', ''],
      correctOptionIndex: 0
    })
  );
}

  addOption(questionIndex: number): void {
    this.questions[questionIndex].options.push('');
  }

  removeOption(questionIndex: number, optionIndex: number): void {
    const question = this.questions[questionIndex];

    if (question.options.length <= 2) {
      return;
    }

    question.options.splice(optionIndex, 1);

    if (question.correctOptionIndex === optionIndex) {
      question.correctOptionIndex = 0;
    } else if (question.correctOptionIndex > optionIndex) {
      question.correctOptionIndex--;
    }
  }

  setCorrectOption(
    questionIndex: number,
    optionIndex: number
  ): void {
    this.questions[questionIndex].correctOptionIndex = optionIndex;
  }

  validateQuiz(): boolean {
    this.clearMessages();

    if (!this.selectedTrackId || !this.selectedLessonId) {
      this.errorMessage = 'Please select a track and a lesson.';
      return false;
    }

    if (!this.quizTitle.trim()) {
      this.errorMessage = 'Please enter a quiz title.';
      return false;
    }

    // if (this.questions.length !== this.questionCount) {
    //   this.errorMessage = 'The question count does not match your selection.';
    //   return false;
    // }

    for (let i = 0; i < this.questions.length; i++) {
      const question = this.questions[i];

      if (!question.text.trim()) {
        this.errorMessage = `Please enter the text for question ${i + 1}.`;
        return false;
      }

      if (
        question.options.length < 2 ||
        question.options.some(option => !option.trim())
      ) {
        this.errorMessage =
          `Question ${i + 1} must have at least two non-empty options.`;
        return false;
      }

      if (
        question.correctOptionIndex < 0 ||
        question.correctOptionIndex >= question.options.length
      ) {
        this.errorMessage =
          `Please select the correct answer for question ${i + 1}.`;
        return false;
      }
    }

    return true;
  }


createQuiz(): void {
  if (!this.validateQuiz()) {
    return;
  }

  if (!this.selectedLessonId) {
    this.errorMessage = 'Please select a lesson.';
    return;
  }

  const quizData: CreateQuizRequest = {
    title: this.quizTitle.trim(),
    type: this.quizType === 'EndOfLesson' ? 0 : 1,
    questionCount: Number(this.questionCount),
    questions: this.questions.map(question => ({
      text: question.text.trim(),
      options: question.options.map((option, index) => ({
        text: option.trim(),
        isCorrect: index === question.correctOptionIndex
      }))
    }))
  };

  this.saving = true;
  this.clearMessages();

  this.quizService
    .createQuiz(this.selectedLessonId, quizData)
    .subscribe({
      next: () => {
        this.successMessage = 'Quiz created successfully.';
        this.saving = false;

        this.resetForm();
        this.onLessonChange();
          this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error creating quiz:', error);

        this.errorMessage =
          error.error?.message ||
          'Failed to create quiz. Please try again.';

        this.saving = false;
      }
    });
}


  resetForm(): void {
    this.quizTitle = '';
    this.quizDescription = '';
    this.quizType = 'EndOfLesson';
    this.questionCount = 10;
    this.initializeQuestions();
    this.clearMessages();
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }


}
