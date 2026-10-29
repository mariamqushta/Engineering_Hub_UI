import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs';
import { TrackService } from '../../../core/services/track.service';
import { AssignmentService } from '../../../core/services/assignment.service';
import { LanguageService } from '../../../core/services/language.service';
import { environment } from '../../../../environments/environment';
@Component({
  selector: 'app-instructor-assignments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './instructor-assignments.html',
  styleUrl: './instructor-assignments.css'
})
export class InstructorAssignments implements OnInit {
  private readonly apiUrl = `${environment.apiUrl}/api/Assignment`;

  tracks: any[] = [];
  lessons: any[] = [];
  assignments: any[] = [];
  submissions: any[] = [];

  selectedTrackId: number | null = null;
  selectedLessonId: number | null = null;
  selectedAssignmentId: number | null = null;

  loadingTracks = false;
  loadingLessons = false;
  loadingAssignments = false;
  loadingSubmissions = false;

  submitting = false;
  gradingSubmissionId: number | null = null;

  errorMessage = '';
  successMessage = '';

  // Assignment creation fields
  title = '';
  description = '';
  dueDate = '';
  selectedFile: File | null = null;

  // Grading fields
  gradeInputs: Record<number, number | null> = {};
  feedbackInputs: Record<number, string> = {};
activeView: 'create' | 'review' = 'create';

removeSelectedFile(): void {
  this.selectedFile = null;
  this.errorMessage = '';

  const fileInput = document.getElementById(
    'assignmentFile'
  ) as HTMLInputElement | null;

  if (fileInput) {
    fileInput.value = '';
  }
}

onLessonChange(): void {
  this.assignments = [];
  this.submissions = [];
  this.selectedAssignmentId = null;
  this.errorMessage = '';

  if (this.selectedLessonId !== null) {
    this.loadInstructorAssignments();
  } else {
    this.loadingAssignments = false;
    this.loadingSubmissions = false;
  }

  this.cdr.detectChanges();
}

onReviewAssignmentChange(value: number | string | null): void {
  if (value === null || value === '') {
    this.selectedAssignmentId = null;
    this.submissions = [];
    this.loadingSubmissions = false;
    this.errorMessage = '';
    this.cdr.detectChanges();
    return;
  }

  const assignmentId = Number(value);

  if (!Number.isFinite(assignmentId) || assignmentId <= 0) {
    this.selectedAssignmentId = null;
    this.submissions = [];
    this.loadingSubmissions = false;
    this.cdr.detectChanges();
    return;
  }

  this.loadSubmissions(assignmentId);
}
  constructor(
    private trackService: TrackService,
    private assignmentService: AssignmentService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
     public languageService: LanguageService,
  ) {}

  ngOnInit(): void {
    this.loadTracks();
  }
setView(view: 'create' | 'review'): void {
  this.activeView = view;
  this.errorMessage = '';
  this.successMessage = '';

  if (view === 'review' && this.selectedLessonId !== null) {
    this.loadInstructorAssignments();
  }
}
  loadTracks(): void {
    this.loadingTracks = true;
    this.errorMessage = '';

    this.trackService
      .getMyTracks()
      .pipe(
        timeout(15000),
        finalize(() => {
          this.loadingTracks = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: tracks => {
          this.tracks = tracks ?? [];
          this.cdr.detectChanges();
        },
        error: error => {
          console.error('Failed to load instructor tracks:', error);
          this.tracks = [];
          this.errorMessage = 'Unable to load your tracks.';
          this.cdr.detectChanges();
        }
      });
  }

  onTrackChange(): void {
    this.lessons = [];
    this.assignments = [];
    this.submissions = [];
    this.selectedLessonId = null;
    this.selectedAssignmentId = null;
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.selectedTrackId) {
      this.loadingLessons = false;
      this.loadingAssignments = false;
      this.loadingSubmissions = false;
      this.cdr.detectChanges();
      return;
    }

    this.loadingLessons = true;

    this.trackService
      .getLessonsByTrack(Number(this.selectedTrackId))
      .pipe(
        timeout(15000),
        finalize(() => {
          this.loadingLessons = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: lessons => {
          this.lessons = lessons ?? [];
          this.cdr.detectChanges();
        },
        error: error => {
          console.error('Failed to load lessons:', error);
          this.lessons = [];
          this.errorMessage = 'Unable to load lessons for this track.';
          this.cdr.detectChanges();
        }
      });
  }

  loadInstructorAssignments(): void {
    if (!this.selectedLessonId) {
      this.assignments = [];
      this.loadingAssignments = false;
      this.cdr.detectChanges();
      return;
    }

    this.loadingAssignments = true;
    this.assignments = [];
    this.submissions = [];
    this.selectedAssignmentId = null;
    this.errorMessage = '';

    this.assignmentService
      .getInstructorAssignments(Number(this.selectedLessonId))
      .pipe(
        finalize(() => {
          this.loadingAssignments = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: assignments => {
          this.assignments = assignments ?? [];
          this.cdr.detectChanges();
        },
        error: error => {
          console.error('Failed to load instructor assignments:', error);
          this.assignments = [];
          this.errorMessage = 'Unable to load assignments.';
          this.cdr.detectChanges();
        }
      });
  }

  loadSubmissions(assignmentId: number): void {
    this.selectedAssignmentId = assignmentId;
    this.loadingSubmissions = true;
    this.submissions = [];
    this.errorMessage = '';

    this.assignmentService
      .getSubmissions(assignmentId)
      .pipe(
        finalize(() => {
          this.loadingSubmissions = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: submissions => {
          this.submissions = submissions ?? [];

          for (const submission of this.submissions) {
            this.gradeInputs[submission.id] =
              submission.grade ?? null;

            this.feedbackInputs[submission.id] =
              submission.feedback ?? '';
          }

          this.cdr.detectChanges();
        },
        error: error => {
          console.error('Failed to load submissions:', error);
          this.submissions = [];
          this.errorMessage = 'Unable to load student submissions.';
          this.cdr.detectChanges();
        }
      });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (file && file.size > 20 * 1024 * 1024) {
      this.errorMessage = 'The file size must not exceed 20 MB.';
      this.selectedFile = null;
      input.value = '';
      this.cdr.detectChanges();
      return;
    }

    this.errorMessage = '';
    this.selectedFile = file;
  }

  createAssignment(): void {
    if (!this.selectedLessonId) {
      this.errorMessage = 'Please select a lesson first.';
      return;
    }

    if (!this.title.trim()) {
      this.errorMessage = 'Please enter an assignment title.';
      return;
    }

    const formData = new FormData();
    formData.append('Title', this.title.trim());
    formData.append('Description', this.description.trim());
    formData.append('DueDate', this.dueDate || '');

    if (this.selectedFile) {
      formData.append('File', this.selectedFile);
    }

    this.submitting = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.detectChanges();

    this.http
      .post(
        `${this.apiUrl}/lesson/${this.selectedLessonId}/with-file`,
        formData,
        { withCredentials: true }
      )
      .pipe(
        timeout(15000),
        finalize(() => {
          this.submitting = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.successMessage = 'Assignment created successfully.';

          this.title = '';
          this.description = '';
          this.dueDate = '';
          this.selectedFile = null;

          this.loadInstructorAssignments();
          this.cdr.detectChanges();
        },
        error: error => {
          console.error('Failed to create assignment:', error);
          this.errorMessage =
            error?.error?.message ??
            error?.error ??
            'Unable to create the assignment.';

          this.cdr.detectChanges();
        }
      });
  }

  saveGrade(submissionId: number): void {
    const grade = this.gradeInputs[submissionId];
    const feedback = this.feedbackInputs[submissionId] ?? '';

    if (grade === null || grade === undefined || Number.isNaN(Number(grade))) {
      this.errorMessage = 'Please enter a valid grade.';
      return;
    }

    this.gradingSubmissionId = submissionId;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.detectChanges();

    this.http
      .put(
        `${this.apiUrl}/submissions/${submissionId}/grade`,
        {
          grade: Number(grade),
          feedback
        },
        {
          withCredentials: true,
          responseType: 'text'
        }
      )
      .pipe(
        timeout(15000),
        finalize(() => {
          this.gradingSubmissionId = null;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.successMessage = 'Grade saved successfully.';

          if (this.selectedAssignmentId !== null) {
            this.loadSubmissions(this.selectedAssignmentId);
          }

          this.cdr.detectChanges();
        },
        error: error => {
          console.error('Failed to save grade:', error);
          this.errorMessage =
            error?.error?.message ??
            error?.error ??
            'Unable to save the grade.';

          this.cdr.detectChanges();
        }
      });
  }
}
