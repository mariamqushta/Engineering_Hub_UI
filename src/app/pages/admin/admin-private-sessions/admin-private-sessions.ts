
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { LanguageService } from '../../../core/services/language.service';

interface Student {
  id: string;
  fullName: string;
  userName: string;
  email: string;
  accountType: number;
}

interface Instructor {
  id: string;
  fullName: string;
  userName: string;
  isActive: boolean;
}

interface Track {
  id: number;
  title: string;
  isActive?: boolean;
}

interface PrivateAvailability {
  id: number;
  instructorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  validFrom: string;
  validTo: string | null;
  isActive: boolean;
}

interface PrivateArrangement {
  id: number;
  studentId: string;
  studentName: string;
  instructorId: string;
  instructorName: string;
  trackId: number;
  trackTitle: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  approvalStatus: number;
  meetingLink?: string;
}

interface PrivateOccurrence {
  id: number;
  privateArrangementId: number | null;
  studentId: string;
  studentName: string;
  instructorId: string;
  instructorName: string;
  trackId: number;
  trackTitle: string;
  startUtc: string;
  endUtc: string;
  status: number;
  isReplacement: boolean;
}

interface PrivateRequest {
  id: number;
  studentId: string;
  studentName: string;
  occurrenceId: number;
  instructorName: string;
  trackTitle: string;
  startUtc: string;
  endUtc: string;
  requestType: number;
  status: number;
  createdAtUtc: string;
}

interface ArrangementForm {
  studentId: string;
  instructorId: string;
  trackId: number | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  startDate: string;
  endDate: string;
  meetingLink: string;
}

interface ReplacementForm {
  date: string;
  startTime: string;
  endTime: string;
  meetingLink: string;
}

@Component({
  selector: 'app-admin-private-sessions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-private-sessions.html'
})
export class AdminPrivateSessions implements OnInit {
  private readonly adminApi = `${environment.apiUrl}/api/Admin`;
  private readonly trackApi = `${environment.apiUrl}/api/Track`;

  private cdr = inject(ChangeDetectorRef);

  students: Student[] = [];
  instructors: Instructor[] = [];
  tracks: Track[] = [];

  arrangements: PrivateArrangement[] = [];
  occurrences: PrivateOccurrence[] = [];
  requests: PrivateRequest[] = [];

  instructorAvailabilities: PrivateAvailability[] = [];
  isLoadingAvailability = false;
  availabilityError = '';

  isLoading = true;
  isSaving = false;

  errorMessage = '';
  successMessage = '';

  activeTab: 'create' | 'arrangements' | 'sessions' | 'requests' = 'create';

  get dayNames(): string[] {
    return [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday'
    ].map(day => this.languageService.translate(day));
  }

  readonly accountTypes = {
    GroupStudent: 0,
    PrivateStudent: 1
  };

  readonly approvalStatuses = {
    Pending: 0,
    Approved: 1,
    Rejected: 2
  };

  readonly requestTypes = {
    StudentAbsence: 0,
    InstructorCancellation: 1,
    Cancellation: 2
  };

  readonly sessionStatuses = {
    Scheduled: 0,
    Ongoing: 1,
    Finished: 2,
    Cancelled: 3,
    Active: 4,
    Completed: 5,
    Missed: 6
  };

  arrangementForm: ArrangementForm = this.createEmptyArrangementForm();

  replacementOccurrenceId: number | null = null;

  replacementForm: ReplacementForm = {
    date: '',
    startTime: '10:00',
    endTime: '11:00',
    meetingLink: ''
  };

  occurrenceFromDate = '';
  occurrenceToDate = '';
  occurrenceStatusFilter = '';

  requestStatusFilter = '0';
  requestTypeFilter = '';

  constructor(
    private http: HttpClient,
    public languageService: LanguageService
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  private t(key: string): string {
    return this.languageService.translate(key);
  }

  private createEmptyArrangementForm(): ArrangementForm {
    return {
      studentId: '',
      instructorId: '',
      trackId: null,
      dayOfWeek: 0,
      startTime: '10:00',
      endTime: '11:00',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      meetingLink: ''
    };
  }

  private isValidMeetingLink(value: string): boolean {
    try {
      const url = new URL(value.trim());
      return url.protocol === 'https:' && !!url.hostname;
    } catch {
      return false;
    }
  }

  private getDateRange(): { fromUtc: string; toUtc: string } {
    const from = this.occurrenceFromDate
      ? new Date(`${this.occurrenceFromDate}T00:00:00`)
      : new Date();

    const to = this.occurrenceToDate
      ? new Date(`${this.occurrenceToDate}T23:59:59`)
      : new Date(from.getTime() + 365 * 24 * 60 * 60 * 1000);

    return {
      fromUtc: from.toISOString(),
      toUtc: to.toISOString()
    };
  }

  loadInitialData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    let completed = 0;

    const finish = (): void => {
      completed++;

      if (completed === 6) {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    };

    this.http.get<any>(`${this.adminApi}/students`, {
      withCredentials: true
    }).subscribe({
      next: response => {
        const items = Array.isArray(response)
          ? response
          : response?.students ?? response?.Students ?? [];

        this.students = items
          .map((item: any) => {
            const rawAccountType =
              item.accountType ?? item.AccountType;

            let accountType: number;

            if (
              typeof rawAccountType === 'string' &&
              rawAccountType.toLowerCase() === 'privatestudent'
            ) {
              accountType = this.accountTypes.PrivateStudent;
            } else if (
              typeof rawAccountType === 'string' &&
              rawAccountType.toLowerCase() === 'groupstudent'
            ) {
              accountType = this.accountTypes.GroupStudent;
            } else {
              accountType = Number(rawAccountType ?? 0);
            }

            return {
              id: item.id ?? item.Id,
              fullName: item.fullName ?? item.FullName ?? '',
              userName: item.userName ?? item.UserName ?? '',
              email: item.email ?? item.Email ?? '',
              accountType
            } as Student;
          })
          .filter((student: Student) =>
            student.accountType === this.accountTypes.PrivateStudent
          );

        finish();
      },
      error: error => {
        console.error('Could not load students:', error);
        this.errorMessage = this.t('couldNotLoadStudents');
        finish();
      }
    });

    this.http.get<any>(`${this.adminApi}/instructors`, {
      withCredentials: true
    }).subscribe({
      next: response => {
        this.instructors = (response?.instructors ?? [])
          .map((item: any) => ({
            id: item.id ?? item.Id,
            fullName: item.fullName ?? item.FullName ?? '',
            userName: item.userName ?? item.UserName ?? '',
            isActive: item.isActive ?? item.IsActive ?? false
          }))
          .filter((instructor: Instructor) => instructor.isActive);

        finish();
      },
      error: error => {
        console.error('Could not load instructors:', error);
        this.errorMessage = this.t('couldNotLoadInstructors');
        finish();
      }
    });

    this.http.get<any>(this.trackApi, {
      withCredentials: true
    }).subscribe({
      next: response => {
        const items = Array.isArray(response)
          ? response
          : response?.tracks ?? [];

        this.tracks = items.map((item: any) => ({
          id: item.id ?? item.Id,
          title: item.title ?? item.Title,
          isActive: item.isActive ?? item.IsActive
        }));

        finish();
      },
      error: error => {
        console.error('Could not load tracks:', error);
        this.errorMessage = this.t('couldNotLoadTracks');
        finish();
      }
    });

    this.loadArrangements(finish);
    this.loadOccurrences(finish);
    this.loadRequests(finish);
  }

  // ==========================================
  // Instructor Availability
  // ==========================================

  onInstructorChanged(instructorId: string): void {
    this.instructorAvailabilities = [];
    this.availabilityError = '';

    if (!instructorId) {
      this.isLoadingAvailability = false;
      return;
    }

    this.loadInstructorAvailability(instructorId);
  }

loadInstructorAvailability(instructorId: string): void {
  this.isLoadingAvailability = true;
  this.availabilityError = '';
  this.instructorAvailabilities = [];

  const url =
    `${this.adminApi}/private/availability/${encodeURIComponent(instructorId)}`;

  this.http.get<any>(url, {
    withCredentials: true
  }).subscribe({
    next: response => {

      // Make sure this response still belongs to the selected instructor.
      if (this.arrangementForm.instructorId !== instructorId) {
        return;
      }

      // Support both a direct array and an object containing availability.
      const items = Array.isArray(response)
        ? response
        : response?.availabilities ??
          response?.Availabilities ??
          response?.data ??
          response?.Data ??
          [];

      this.instructorAvailabilities = items.map((item: any) => ({
        id: item.id ?? item.Id,
        instructorId:
          item.instructorId ?? item.InstructorId ?? instructorId,
        dayOfWeek: Number(item.dayOfWeek ?? item.DayOfWeek),
        startTime: item.startTime ?? item.StartTime,
        endTime: item.endTime ?? item.EndTime,
        validFrom: item.validFrom ?? item.ValidFrom,
        validTo: item.validTo ?? item.ValidTo ?? null,
        isActive: item.isActive ?? item.IsActive ?? false
      }));

      this.isLoadingAvailability = false;
      this.cdr.markForCheck();
    },

    error: error => {
      console.error(
        'Could not load instructor availability:',
        error
      );

      if (this.arrangementForm.instructorId !== instructorId) {
        return;
      }

      this.availabilityError =
        this.t('couldNotLoadInstructorAvailability');

      this.isLoadingAvailability = false;
      this.cdr.markForCheck();
    }
  });
}

  // ==========================================
  // Load Data
  // ==========================================

  loadArrangements(done?: () => void): void {
    this.http.get<PrivateArrangement[]>(
      `${this.adminApi}/private/arrangements`,
      { withCredentials: true }
    ).subscribe({
      next: response => {
        this.arrangements = response ?? [];
        done?.();
        this.cdr.markForCheck();
      },
      error: error => {
        console.error('Could not load private arrangements:', error);
        this.errorMessage = this.t('couldNotLoadPrivateArrangements');
        done?.();
        this.cdr.markForCheck();
      }
    });
  }

  loadOccurrences(done?: () => void): void {
    const range = this.getDateRange();

    let params = new HttpParams()
      .set('fromUtc', range.fromUtc)
      .set('toUtc', range.toUtc);

    if (this.occurrenceStatusFilter !== '') {
      params = params.set('status', this.occurrenceStatusFilter);
    }

    this.http.get<PrivateOccurrence[]>(
      `${this.adminApi}/private/occurrences`,
      {
        params,
        withCredentials: true
      }
    ).subscribe({
      next: response => {
        this.occurrences = response ?? [];
        done?.();
        this.cdr.markForCheck();
      },
      error: error => {
        console.error('Could not load private occurrences:', error);
        this.errorMessage = this.t('couldNotLoadPrivateSessions');
        done?.();
        this.cdr.markForCheck();
      }
    });
  }

  loadRequests(done?: () => void): void {
    let params = new HttpParams();

    if (this.requestStatusFilter !== '') {
      params = params.set('status', this.requestStatusFilter);
    }

    if (this.requestTypeFilter !== '') {
      params = params.set('requestType', this.requestTypeFilter);
    }

    this.http.get<PrivateRequest[]>(
      `${this.adminApi}/private/requests`,
      {
        params,
        withCredentials: true
      }
    ).subscribe({
      next: response => {
        this.requests = response ?? [];
        done?.();
        this.cdr.markForCheck();
      },
      error: error => {
        console.error('Could not load private requests:', error);
        this.errorMessage = this.t('couldNotLoadPrivateSessionRequests');
        done?.();
        this.cdr.markForCheck();
      }
    });
  }

  // ==========================================
  // Create Arrangement
  // ==========================================

  createArrangement(): void {
    const form = this.arrangementForm;

    if (
      !form.studentId ||
      !form.instructorId ||
      form.trackId === null ||
      !form.startDate ||
      !form.startTime ||
      !form.endTime
    ) {
      this.errorMessage = this.t('completeRequiredArrangementFields');
      return;
    }

    if (form.startTime >= form.endTime) {
      this.errorMessage = this.t('endTimeMustBeLater');
      return;
    }

    if (form.endDate && form.endDate < form.startDate) {
      this.errorMessage = this.t('endDateCannotBeEarlier');
      return;
    }

    if (!form.meetingLink.trim()) {
      this.errorMessage = this.t('meetingLinkRequired');
      return;
    }

    if (!this.isValidMeetingLink(form.meetingLink)) {
      this.errorMessage = this.t('enterValidMeetingLink');
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = {
      studentId: form.studentId,
      instructorId: form.instructorId,
      trackId: form.trackId,
      dayOfWeek: Number(form.dayOfWeek),
      startTime: `${form.startTime}:00`,
      endTime: `${form.endTime}:00`,
      startDate: `${form.startDate}T00:00:00`,
      endDate: form.endDate
        ? `${form.endDate}T23:59:59`
        : null,
      meetingLink: form.meetingLink.trim()
    };

    this.http.post<any>(
      `${this.adminApi}/private/arrangements`,
      payload,
      { withCredentials: true }
    ).subscribe({
      next: () => {
        this.successMessage =
          this.t('privateArrangementCreatedSuccessfully');

        this.isSaving = false;
        this.arrangementForm = this.createEmptyArrangementForm();

        this.instructorAvailabilities = [];
        this.availabilityError = '';
        this.isLoadingAvailability = false;

        this.loadArrangements();
        this.activeTab = 'arrangements';
        this.cdr.markForCheck();
      },
      error: error => {
        console.error('Could not create private arrangement:', error);

        this.errorMessage =
          error.error?.message ||
          (typeof error.error === 'string' ? error.error : null) ||
          this.t('couldNotCreatePrivateArrangement');

        this.isSaving = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ==========================================
  // Generate Occurrences
  // ==========================================

  generateOccurrences(arrangement: PrivateArrangement): void {
    if (!confirm(
      `${this.t('confirmGenerateNext12Weeks')} ${arrangement.studentName}?`
    )) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const params = new HttpParams().set('weeksAhead', '12');

    this.http.post<any>(
      `${this.adminApi}/private/arrangements/${arrangement.id}/generate`,
      {},
      {
        params,
        withCredentials: true
      }
    ).subscribe({
      next: response => {
        const created = response?.created ?? 0;

        this.successMessage =
          `${created} ${this.t('privateSessionOccurrencesGenerated')}`;

        this.isSaving = false;
        this.loadArrangements();
        this.loadOccurrences();
        this.cdr.markForCheck();
      },
      error: error => {
        console.error('Could not generate sessions:', error);

        this.errorMessage =
          error.error?.message ||
          (typeof error.error === 'string' ? error.error : null) ||
          this.t('couldNotGenerateSessions');

        this.isSaving = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ==========================================
  // End Arrangement
  // ==========================================

  endArrangement(arrangement: PrivateArrangement): void {
    if (!confirm(
      `${this.t('confirmEndArrangement')} ${arrangement.studentName}?`
    )) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.http.put(
      `${this.adminApi}/private/arrangements/${arrangement.id}/end`,
      {},
      {
        withCredentials: true,
        responseType: 'text'
      }
    ).subscribe({
      next: () => {
        this.successMessage =
          this.t('privateArrangementEndedSuccessfully');

        this.isSaving = false;
        arrangement.isActive = false;
        this.loadArrangements();
        this.cdr.markForCheck();
      },
      error: error => {
        console.error('Could not end arrangement:', error);

        this.errorMessage =
          error.error?.message ||
          (typeof error.error === 'string' ? error.error : null) ||
          this.t('couldNotEndPrivateArrangement');

        this.isSaving = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ==========================================
  // Update Occurrence Status
  // ==========================================

  updateOccurrenceStatus(
    occurrence: PrivateOccurrence,
    status: number,
    actionName: string
  ): void {
    const actionKey = actionName === 'Complete'
      ? 'complete'
      : actionName === 'Miss'
        ? 'markMissed'
        : 'cancel';

    if (!confirm(
      `${this.t('confirmActionOnPrivateSession')} ${this.t(actionKey)}?`
    )) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.http.put(
      `${this.adminApi}/private/occurrences/${occurrence.id}/status`,
      { status },
      {
        withCredentials: true,
        responseType: 'text'
      }
    ).subscribe({
      next: () => {
        const statusKey = actionName === 'Complete'
          ? 'completed'
          : actionName === 'Miss'
            ? 'missed'
            : 'cancelled';

        this.successMessage =
          `${this.t('privateSessionMarkedAs')} ${this.t(statusKey)}.`;

        this.isSaving = false;
        this.loadOccurrences();
        this.cdr.markForCheck();
      },
      error: error => {
        console.error('Could not update session status:', error);

        this.errorMessage =
          error.error?.message ||
          (typeof error.error === 'string' ? error.error : null) ||
          this.t('couldNotUpdatePrivateSessionStatus');

        this.isSaving = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ==========================================
  // Replacement Session
  // ==========================================

  openReplacementForm(occurrence: PrivateOccurrence): void {
    this.replacementOccurrenceId = occurrence.id;

    this.replacementForm = {
      date: '',
      startTime: '10:00',
      endTime: '11:00',
      meetingLink: ''
    };

    this.errorMessage = '';
  }

  closeReplacementForm(): void {
    this.replacementOccurrenceId = null;

    this.replacementForm = {
      date: '',
      startTime: '10:00',
      endTime: '11:00',
      meetingLink: ''
    };

    this.errorMessage = '';
  }

  assignReplacement(occurrence: PrivateOccurrence): void {
    const form = this.replacementForm;

    if (!form.date || !form.startTime || !form.endTime) {
      this.errorMessage = this.t('enterReplacementDateAndTime');
      return;
    }

    if (form.startTime >= form.endTime) {
      this.errorMessage = this.t('replacementEndTimeMustBeLater');
      return;
    }

    if (!form.meetingLink.trim()) {
      this.errorMessage = this.t('meetingLinkRequired');
      return;
    }

    if (!this.isValidMeetingLink(form.meetingLink)) {
      this.errorMessage = this.t('enterValidMeetingLink');
      return;
    }

    const start = new Date(`${form.date}T${form.startTime}:00`);
    const end = new Date(`${form.date}T${form.endTime}:00`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      this.errorMessage = this.t('enterValidReplacementDateAndTime');
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = {
      startUtc: start.toISOString(),
      endUtc: end.toISOString(),
      meetingLink: form.meetingLink.trim()
    };

    this.http.post(
      `${this.adminApi}/private/occurrences/${occurrence.id}/replacement`,
      payload,
      { withCredentials: true }
    ).subscribe({
      next: () => {
        this.successMessage =
          this.t('replacementSessionAssignedSuccessfully');

        this.isSaving = false;
        this.replacementOccurrenceId = null;

        this.replacementForm = {
          date: '',
          startTime: '10:00',
          endTime: '11:00',
          meetingLink: ''
        };

        this.loadOccurrences();
        this.cdr.markForCheck();
      },
      error: error => {
        console.error('Could not assign replacement:', error);

        this.errorMessage =
          error.error?.message ||
          (typeof error.error === 'string' ? error.error : null) ||
          this.t('couldNotAssignReplacementSession');

        this.isSaving = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ==========================================
  // Review Requests
  // ==========================================

  reviewRequest(request: PrivateRequest, decision: number): void {
    const approved = decision === this.approvalStatuses.Approved;
    const actionKey = approved ? 'approve' : 'reject';

    if (!confirm(
      `${this.t('confirmRequestAction')} ${this.t(actionKey)}?`
    )) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.http.put(
      `${this.adminApi}/private/requests/${request.id}/review`,
      { decision },
      {
        withCredentials: true,
        responseType: 'text'
      }
    ).subscribe({
      next: () => {
        this.successMessage = approved
          ? this.t('requestApprovedSuccessfully')
          : this.t('requestRejectedSuccessfully');

        this.isSaving = false;
        this.loadRequests();
        this.cdr.markForCheck();
      },
      error: error => {
        console.error('Could not review request:', error);

        this.errorMessage =
          error.error?.message ||
          (typeof error.error === 'string' ? error.error : null) ||
          this.t('couldNotReviewPrivateSessionRequest');

        this.isSaving = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ==========================================
  // Display Helpers
  // ==========================================

  getStatusName(status: number): string {
    const names: Record<number, string> = {
      0: 'scheduled',
      1: 'ongoing',
      2: 'finished',
      3: 'cancelled',
      4: 'active',
      5: 'completed',
      6: 'missed'
    };

    return this.t(names[status] ?? 'unknown');
  }

  getApprovalStatusName(status: number): string {
    const names: Record<number, string> = {
      0: 'pending',
      1: 'approved',
      2: 'rejected'
    };

    return this.t(names[status] ?? 'unknown');
  }

  getRequestTypeName(type: number): string {
    const names: Record<number, string> = {
      0: 'studentAbsence',
      1: 'instructorCancellation',
      2: 'studentCancellation'
    };

    return this.t(names[type] ?? 'unknownRequest');
  }

  formatTime(time: string): string {
    return time?.substring(0, 5) ?? '';
  }

  formatDateTime(value: string): string {
    const locale = this.languageService.currentLanguage === 'ar'
      ? 'ar-EG'
      : 'en-US';

    return new Date(value).toLocaleString(locale);
  }

  get activeArrangements(): PrivateArrangement[] {
    return this.arrangements.filter(item => item.isActive);
  }

  get inactiveArrangements(): PrivateArrangement[] {
    return this.arrangements.filter(item => !item.isActive);
  }

  get pendingRequests(): PrivateRequest[] {
    return this.requests.filter(
      item => item.status === this.approvalStatuses.Pending
    );
  }

  get canAssignReplacement(): (occurrence: PrivateOccurrence) => boolean {
    return (occurrence: PrivateOccurrence) =>
      occurrence.status === this.sessionStatuses.Missed ||
      occurrence.status === this.sessionStatuses.Cancelled;
  }
}
