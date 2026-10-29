
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { LanguageService } from '../../../core/services/language.service';
import { environment } from '../../../../environments/environment';
import {
  QuizService,
  StudentQuiz,
  SubmitQuizResponse
} from '../../../core/services/quiz';
import { Location } from '@angular/common';
@Component({
  selector: 'app-prerequisite-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './prerequisite-quiz.html',
  styleUrl: './prerequisite-quiz.css'
})
export class PrerequisiteQuiz implements OnInit {
    private cdr = inject(ChangeDetectorRef);
    private location = inject(Location);
  lessonId = 0;
  quizId = 0;

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
    const lessonId = Number(
      this.route.snapshot.paramMap.get('lessonId')
    );

    const quizId = Number(
      this.route.snapshot.paramMap.get('quizId')
    );

    if (
      !Number.isInteger(lessonId) ||
      lessonId <= 0 ||
      !Number.isInteger(quizId) ||
      quizId <= 0
    ) {
      this.errorMessage = 'Invalid lesson or quiz ID.';
      this.loading = false;
      return;
    }

    this.lessonId = lessonId;
    this.quizId = quizId;

    this.loadQuiz();
  }

  loadQuiz(): void {
    this.loading = true;
    this.errorMessage = '';

    this.quizService.getStudentQuiz(this.quizId).subscribe({
      next: (quiz) => {
        this.quiz = quiz;
        this.loading = false;
        this.cdr.markForCheck();
        // Verify that the requested quiz belongs to this lesson.
        if (quiz.lessonId !== this.lessonId) {
          this.quiz = null;
          this.errorMessage =
            'This quiz does not belong to the selected lesson.';
        } else if (
          quiz.type !== 1 &&
          quiz.type !== '1' &&
          quiz.type !== 'Prerequisite'
        ) {
          this.quiz = null;
          this.errorMessage =
            'This quiz is not a prerequisite quiz.';
        }
      },
      error: (error) => {
        console.error('Error loading prerequisite quiz:', error);
        this.errorMessage =
          'Could not load the prerequisite quiz. Please try again.';
        this.loading = false;
      }
    });
  }

  selectAnswer(questionId: number, optionId: number): void {
    this.selectedAnswers[questionId] = optionId;
    this.errorMessage = '';
  }

  submitQuiz(): void {
    if (!this.quiz || this.submitting || this.quizResult) {
      return;
    }

    const unanswered = this.quiz.questions.some(
      (question) => !this.selectedAnswers[question.id]
    );

    if (unanswered) {
      this.errorMessage =
        'Please answer every question before submitting.';
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

    this.quizService.submitQuiz(this.quizId, request).subscribe({
      next: (response: SubmitQuizResponse) => {
        this.quizResult = response;
        this.submitting = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error submitting prerequisite quiz:', error);
        this.errorMessage =
          'Could not submit your answers. Please try again.';
        this.submitting = false;
      }
    });
  }

  retryQuiz(): void {
    this.selectedAnswers = {};
    this.quizResult = null;
    this.errorMessage = '';
  }

  openLesson(): void {
    this.router.navigate(['/learn/lesson', this.lessonId]);
  }

goBack(): void {
  this.location.back();
}
}
