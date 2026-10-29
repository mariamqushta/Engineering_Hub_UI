
import { Component, OnInit, ChangeDetectorRef,inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { TrackService } from '../../core/services/track.service';
import { Lesson } from '../../core/models/lesson';
import { LessonContent } from '../../core/models/LessonContent';
import { Location } from '@angular/common';
import { LanguageService } from '../../core/services/language.service';
import { environment } from '../../../environments/environment';
@Component({
  selector: 'app-lesson-learning',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lesson-learning.html',
  styleUrl: './lesson-learning.css'
})
export class LessonLearning implements OnInit {
  lesson: Lesson | null = null;
  private location = inject(Location);
  contents: LessonContent[] = [];
currentContentIndex = 0;

get currentContent(): LessonContent | null {
  return this.contents[this.currentContentIndex] ?? null;
}

get totalContents(): number {
  return this.contents.length;
}

previousContent(): void {
  if (this.currentContentIndex > 0) {
    this.currentContentIndex--;
  }
}

nextContent(): void {
  if (this.currentContentIndex < this.contents.length - 1) {
    this.currentContentIndex++;
  }
}

  loading = true;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private trackService: TrackService,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
     public languageService: LanguageService,
    // private quizService: QuizService,
  ) {}

  ngOnInit(): void {
    const lessonId = Number(this.route.snapshot.paramMap.get('id'));

    if (!lessonId || isNaN(lessonId)) {
      this.errorMessage = 'Invalid lesson ID.';
      this.loading = false;
      return;
    }

    this.trackService.getLesson(lessonId).subscribe({
      next: (lesson) => {
        this.lesson = lesson;

        this.trackService.getLessonContents(lessonId).subscribe({
         next: (contents) => {
            this.contents = contents;
            this.currentContentIndex = 0;
            // this.loadEndOfLessonQuiz(lessonId);
            this.loading = false;
            this.cdr.detectChanges();
          },
          error: () => {
            this.errorMessage = 'Could not load lesson content.';
            this.loading = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: (error) => {
        this.errorMessage =
          error.error?.message || 'Could not load this lesson. Please log in or check your enrollment.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getContentUrl(url: string | null): string {
    if (!url) return '';
    return url.startsWith('http')
  ? url
  : `${environment.apiUrl}${url}`;
  }

goBack(): void {
  this.location.back();
}

  getPdfUrl(url: string | null): SafeResourceUrl {
  const fullUrl = this.getContentUrl(url);
  return this.sanitizer.bypassSecurityTrustResourceUrl(fullUrl);
}

openAssignmentPage(): void {
  if (!this.lesson) {
    return;
  }

  this.router.navigate([
    '/learn/lesson',
    this.lesson.id,
    'assignment'
  ]);
}
// loadEndOfLessonQuiz(lessonId: number): void {
//   this.quizLoading = true;
//   this.quizError = '';

//   this.quizService.getStudentLessonQuizzes(lessonId).subscribe({
//     next: (quizzes) => {
//       this.endOfLessonQuiz =
//         quizzes.find(
//           quiz =>
//             quiz.type === 0 ||
//             quiz.type === '0' ||
//             quiz.type === 'EndOfLesson'
//         ) ?? null;

//       if (!this.endOfLessonQuiz) {
//         this.quizError = 'No End-of-Lesson Quiz is available yet.';
//       }

//       this.quizLoading = false;
//       this.cdr.detectChanges();
//     },
//     error: (error) => {
//       console.error('Could not load End-of-Lesson Quiz:', error);
//       this.quizError = 'Could not load the quiz. Please try again.';
//       this.quizLoading = false;
//       this.cdr.detectChanges();
//     }
//   });
// }
// openEndOfLessonQuiz(): void {
//   if (!this.endOfLessonQuiz) {
//     if (this.lesson) {
//       this.loadEndOfLessonQuiz(this.lesson.id);
//     }
//     return;
//   }

//   this.showEndOfLessonQuiz = true;
// }

// backToLastContent(): void {
//   this.showEndOfLessonQuiz = false;
//   this.quizResult = null;
//   this.quizError = '';

//   if (this.contents.length > 0) {
//     this.currentContentIndex = this.contents.length - 1;
//   }
// }

// selectAnswer(questionId: number, optionId: number): void {
//   this.selectedAnswers[questionId] = optionId;
// }

// submitEndOfLessonQuiz(): void {
//   if (!this.endOfLessonQuiz || this.quizSubmitting) {
//     return;
//   }

//   const questions = this.endOfLessonQuiz.questions;

//   if (questions.some(q => !this.selectedAnswers[q.id])) {
//     this.quizError = 'Please answer every question before submitting.';
//     return;
//   }

//   this.quizSubmitting = true;
//   this.quizError = '';

//   this.quizService.submitQuiz(this.endOfLessonQuiz.id, {
//     answers: questions.map(question => ({
//       questionId: question.id,
//       selectedOptionId: this.selectedAnswers[question.id]
//     }))
//   }).subscribe({
//     next: (response) => {
//       this.quizResult = response;
//       this.quizSubmitting = false;
//       this.cdr.detectChanges();
//     },
//     error: (error) => {
//       console.error('Could not submit quiz:', error);
//       this.quizError =
//         error.error?.message || 'Could not submit the quiz. Please try again.';
//       this.quizSubmitting = false;
//       this.cdr.detectChanges();
//     }
//   });
// }
openEndOfLessonQuiz(): void {
  if (!this.lesson) {
    return;
  }

  this.router.navigate([
    '/learn/lesson',
    this.lesson.id,
    'quiz'
  ]);
}
}
