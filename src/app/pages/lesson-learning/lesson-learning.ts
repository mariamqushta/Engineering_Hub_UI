
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
trackId: number | null = null;

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
        console.log('Full lesson response:', lesson);
        this.lesson = lesson;
        this.trackId = lesson.trackId;
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
  console.log('Track ID:', this.trackId);

  if (this.trackId !== null) {
    this.router.navigate(['/track', this.trackId]);
  }
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
