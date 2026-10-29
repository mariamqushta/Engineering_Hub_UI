import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  catchError,
  finalize,
  forkJoin,
  map,
  of,
  switchMap,
  timeout
} from 'rxjs';

import { AssignmentService } from '../../../core/services/assignment.service';
import { LanguageService } from '../../../core/services/language.service';
import { environment } from '../../../../environments/environment';

interface Submission {
  id?: number;
  assignmentId?: number;
  studentId?: string;
  submittedAt?: string;
  content?: string | null;
  fileUrl?: string | null;
  hasFile?: boolean;
  originalFileName?: string | null;
  grade?: number | null;
  feedback?: string | null;
}

interface Assignment {
  id: number;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  fileUrl?: string | null;
  hasAttachment?: boolean;
  attachmentOriginalFileName?: string | null;
  submission?: Submission | null;
  checkingSubmission?: boolean;
}

@Component({
  selector: 'app-student-assignment',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './student-assignment.html',
  styleUrl: './student-assignment.css'
})
export class StudentAssignment implements OnInit {
  private readonly apiUrl = `${environment.apiUrl}/api`;

  lessonId = 0;
  assignments: Assignment[] = [];

  answers: Record<number, string> = {};
  selectedFiles: Record<number, File | null> = {};

  loading = true;
  submittingAssignmentId: number | null = null;

  errorMessage = '';
  successMessage = '';

constructor(
  private route: ActivatedRoute,
  private cdr: ChangeDetectorRef,
  private assignmentService: AssignmentService,
  private http: HttpClient,
     public languageService: LanguageService,
) {}
// const id = Number(params.get('id'));
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));

      if (!Number.isFinite(id) || id <= 0) {
        this.lessonId = 0;
        this.assignments = [];
        this.loading = false;
        this.errorMessage = 'Invalid lesson ID.';
        this.cdr.detectChanges();
        return;
      }

      this.lessonId = id;
      this.loadAssignments();
    });
  }

  loadAssignments(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.assignments = [];
    this.answers = {};
    this.selectedFiles = {};

    this.assignmentService
      .getLessonAssignments(this.lessonId)
      .pipe(
        switchMap((items: any[]) => {
          const prepared: Assignment[] = (items ?? []).map(item => ({
            ...item,
            submission: null,
            checkingSubmission: true
          }));

          this.assignments = prepared;

          if (prepared.length === 0) {
            return of(prepared);
          }

          return forkJoin(
            prepared.map(assignment =>
              this.assignmentService
                .getMySubmission(assignment.id)
                .pipe(
                  map(submission => ({
                    assignmentId: assignment.id,
                    submission
                  })),
                  catchError(error => {
                    console.error(
                      `Could not check submission for assignment ${assignment.id}:`,
                      error
                    );

                    return of({
                      assignmentId: assignment.id,
                      submission: null
                    });
                  })
                )
            )
          ).pipe(
            map(results => {
              for (const result of results) {
                const assignment = prepared.find(
                  item => item.id === result.assignmentId
                );

                if (assignment) {
                  assignment.submission = result.submission;
                  assignment.checkingSubmission = false;

                  if (result.submission) {
                    this.answers[assignment.id] =
                      result.submission.content ?? '';
                  }
                }
              }

              return prepared;
            })
          );
        }),
        finalize(() => {
          this.loading = false;

          this.assignments.forEach(assignment => {
            assignment.checkingSubmission = false;
          });

          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: assignments => {
          this.assignments = assignments;
          this.cdr.detectChanges();
        },
        error: error => {
          console.error('Error loading assignments:', error);
          this.assignments = [];
          this.errorMessage = 'Unable to load assignments. Please try again.';
          this.cdr.detectChanges();
        }
      });
  }


  loadMySubmission(assignment: Assignment): void {
    assignment.checkingSubmission = true;
    this.cdr.detectChanges();

    this.assignmentService
      .getMySubmission(assignment.id)
      .pipe(
        finalize(() => {
          assignment.checkingSubmission = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: submission => {
          assignment.submission = submission;

          if (submission) {
            this.answers[assignment.id] = submission.content ?? '';
          }

          this.cdr.detectChanges();
        },
        error: error => {
          console.error('Could not refresh submission status:', error);
          this.errorMessage =
            'Your submission may have been sent, but its status could not be refreshed.';
          this.cdr.detectChanges();
        }
      });
  }


onFileSelected(assignmentId: number, event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0] ?? null;

  if (file && file.size > 20 * 1024 * 1024) {
    this.errorMessage = 'The file size must not exceed 20 MB.';
    this.selectedFiles[assignmentId] = null;
    input.value = '';
    this.cdr.detectChanges();
    return;
  }

  this.errorMessage = '';
  this.selectedFiles[assignmentId] = file;
}

  submitAssignment(assignment: Assignment): void {
    if (this.submittingAssignmentId !== null) {
      return;
    }

    const content = (this.answers[assignment.id] ?? '').trim();
    const file = this.selectedFiles[assignment.id] ?? null;

    if (!content && !file) {
      this.errorMessage = 'Please enter an answer or attach a file.';
      this.successMessage = '';
      return;
    }

    const formData = new FormData();
    formData.append('Content', content);

    if (file) {
      formData.append('File', file);
    }

    this.submittingAssignmentId = assignment.id;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.detectChanges();

    this.http
      .post(
        `${this.apiUrl}/${assignment.id}/submit-with-file`,
        formData,
        { withCredentials: true }
      )
      .pipe(
        finalize(() => {
          this.submittingAssignmentId = null;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.successMessage = 'Assignment submitted successfully.';
          this.selectedFiles[assignment.id] = null;

          const fileInput = document.getElementById(
            `file-${assignment.id}`
          ) as HTMLInputElement | null;

          if (fileInput) {
            fileInput.value = '';
          }

          this.cdr.detectChanges();
          this.loadMySubmission(assignment);
        },
        error: error => {
          console.error('Assignment submission failed:', error);

          this.errorMessage =
            error?.error?.message ??
            error?.error ??
            'Failed to submit the assignment. Please try again.';

          this.cdr.detectChanges();
        }
      });
  }

  isGraded(assignment: Assignment): boolean {
    return (
      assignment.submission?.grade !== null &&
      assignment.submission?.grade !== undefined
    );
  }
}
