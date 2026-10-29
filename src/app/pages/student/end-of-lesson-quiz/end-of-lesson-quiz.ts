
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import {
  QuizService,
  StudentQuiz,
  SubmitQuizResponse
} from '../../../core/services/quiz';
import { LanguageService } from '../../../core/services/language.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-end-of-lesson-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './end-of-lesson-quiz.html'
})
export class EndOfLessonQuiz implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  lessonId = 0;

  quiz: StudentQuiz | null = null;
  selectedAnswers: { [questionId: number]: number } = {};

  quizResult: SubmitQuizResponse | null = null;

  loading = true;
  submitting = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private quizService: QuizService,
         public languageService: LanguageService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('lessonId'));

    if (!Number.isInteger(id) || id <= 0) {
      this.errorMessage = 'Invalid lesson ID.';
      this.loading = false;
      return;
    }

    this.lessonId = id;
    this.loadQuiz();
  }

  loadQuiz(): void {
    this.loading = true;
    this.errorMessage = '';

    this.quizService.getStudentLessonQuizzes(this.lessonId).subscribe({
      next: (quizzes) => {
        // EndOfLesson = 0. Support both numeric and string API responses.
        this.quiz =
          quizzes.find(
            (item) =>
              item.type === 0 ||
              item.type === '0' ||
              item.type === 'EndOfLesson'
          ) ?? null;

        if (!this.quiz) {
          this.errorMessage = 'No end-of-lesson quiz was found for this lesson.';
        }

        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading end-of-lesson quiz:', error);
        this.errorMessage = 'Could not load the quiz. Please try again.';
        this.loading = false;
      }
    });
  }

  submitQuiz(): void {
    if (!this.quiz || this.submitting || this.quizResult) {
      return;
    }

    const unanswered = this.quiz.questions.some(
      (question) => !this.selectedAnswers[question.id]
    );

    if (unanswered) {
      this.errorMessage = 'Please answer every question before submitting.';
      return;
    }

    this.errorMessage = '';
    this.submitting = true;

    const request = {
      answers: this.quiz.questions.map((question) => ({
        questionId: question.id,
        selectedOptionId: this.selectedAnswers[question.id]
      }))
    };

    this.quizService.submitQuiz(this.quiz.id, request).subscribe({
      next: (response: SubmitQuizResponse) => {
        this.quizResult = response;
        this.submitting = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error submitting quiz:', error);
        this.errorMessage = 'Could not submit your answers. Please try again.';
        this.submitting = false;
      }
    });
  }

  retryQuiz(): void {
    this.selectedAnswers = {};
    this.quizResult = null;
    this.errorMessage = '';
  }

  backToLesson(): void {
    this.router.navigate(['/learn/lesson', this.lessonId]);
  }

selectAnswer(questionId: number, optionId: number): void {
  this.selectedAnswers[questionId] = optionId;
  this.errorMessage = '';
}

}
