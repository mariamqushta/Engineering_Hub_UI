
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LanguageService } from '../../../core/services/language.service';
import { environment } from '../../../../environments/environment';
import { Time12Pipe } from '../../../shared/pipes/time-12.pipe';

interface AdminActivityStudent {
  userName: string;
  fullName?: string;
  email?: string;
  bookingStatus?: string | number;
}

interface AdminInteractiveActivity {
  id: number;
  interactiveScheduleId?: number | null;
  title: string;
  description?: string | null;
  trackTitle?: string;
  instructorUserName?: string | null;
  date: string;
  startTime: string;
  endTime: string;
  meetingUrl?: string | null;
  capacity: number;
  status: string | number;
  approvalStatus: string | number;
  students: AdminActivityStudent[];
  occurrences?: AdminInteractiveActivity[];
}

type RescheduleScope = 'activity' | 'occurrence';

@Component({
  selector: 'app-admin-interactive',
  standalone: true,
  imports: [CommonModule, FormsModule, Time12Pipe],
  templateUrl: './admin-interactive.html'
})
export class AdminInteractive implements OnInit {
  private readonly apiUrl =
    `${environment.apiUrl}/api/Admin`;

  private cdr = inject(ChangeDetectorRef);

  activities: AdminInteractiveActivity[] = [];
  searchTerm = '';
  expandedActivityId: number | null = null;
  isLoading = false;
  errorMessage = '';
  actionMessage = '';
  processingId: number | null = null;
  reschedulingKey: string | null = null;
  rescheduleForm = {
    date: '',
    startTime: '',
    endTime: ''
  };
totalActivitiesCount = 0;
  constructor(
    private http: HttpClient,
    public languageService: LanguageService
  ) {}

  ngOnInit(): void {
    this.loadActivities();
  }

  loadActivities(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.http.get<
      AdminInteractiveActivity[] |
      { activities: AdminInteractiveActivity[] }
    >(`${this.apiUrl}/interactive-activities`, {
      withCredentials: true
    }).subscribe({
      next: response => {
        const items = Array.isArray(response)
          ? response
          : response?.activities ?? [];

        const grouped = new Map<string, AdminInteractiveActivity>();
const uniqueActivityKeys = new Set<string>();

for (const activity of items) {
  const key = activity.interactiveScheduleId
    ? `schedule-${activity.interactiveScheduleId}`
    : `activity-${activity.id}`;

  uniqueActivityKeys.add(key);
}

this.totalActivitiesCount = uniqueActivityKeys.size;
        for (const activity of items) {
          const scheduleId = activity.interactiveScheduleId;

          // Group only by the actual schedule ID.
          const key = scheduleId
            ? `schedule-${scheduleId}`
            : `activity-${activity.id}`;

          const existing = grouped.get(key);

          if (existing) {
            existing.occurrences = [
              ...(existing.occurrences ?? [existing]),
              activity
            ];
          } else {
            grouped.set(key, {
              ...activity,
              students: activity.students ?? [],
              occurrences: [activity]
            });
          }
        }

        this.activities = Array.from(grouped.values());

        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: error => {
        console.error('Could not load interactive activities:', error);
        this.errorMessage =
          error.error?.message ||
          'Could not load interactive activities.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  get filteredActivities(): AdminInteractiveActivity[] {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) return this.activities;

    return this.activities.filter(activity =>
      (activity.title ?? '').toLowerCase().includes(term) ||
      (activity.trackTitle ?? '').toLowerCase().includes(term) ||
      (activity.instructorUserName ?? '').toLowerCase().includes(term) ||
      activity.students.some(student =>
        (student.userName ?? '').toLowerCase().includes(term) ||
        (student.fullName ?? '').toLowerCase().includes(term)
      )
    );
  }

get totalBookings(): number {
  return this.activities.reduce((total, activity) => {
    // Individual activity: count its bookings normally.
    if (!activity.interactiveScheduleId) {
      return total + (activity.students?.length ?? 0);
    }

    // Recurring schedule: count bookings from only one occurrence.
    const firstOccurrence =
      activity.occurrences?.[0] ?? activity;

    return total + (firstOccurrence.students?.length ?? 0);
  }, 0);
}

  toggleStudents(activityId: number): void {
    this.expandedActivityId =
      this.expandedActivityId === activityId ? null : activityId;
  }

  isPending(status: string | number): boolean {
    return ['pending', '0'].includes(String(status).toLowerCase());
  }

  approvalLabel(status: string | number): string {
    const value = String(status).toLowerCase();

    if (value === '0' || value === 'pending') return 'Pending';
    if (value === '1' || value === 'approved') return 'Approved';
    if (value === '2' || value === 'rejected') return 'Rejected';

    return value;
  }

  approvalClass(status: string | number): string {
    const value = String(status).toLowerCase();

    if (value === '0' || value === 'pending')
      return 'bg-amber-100 text-amber-700';

    if (value === '1' || value === 'approved')
      return 'bg-emerald-100 text-emerald-700';

    if (value === '2' || value === 'rejected')
      return 'bg-red-100 text-red-700';

    return 'bg-slate-100 text-slate-700';
  }

  approveActivity(activity: AdminInteractiveActivity): void {
    this.runAction(
      `${this.apiUrl}/interactive-activities/${activity.id}/approve`,
      'Activity approved successfully.'
    );
  }

  rejectActivity(activity: AdminInteractiveActivity): void {
    if (!confirm(`Reject "${activity.title}"?`)) return;

    this.runAction(
      `${this.apiUrl}/interactive-activities/${activity.id}/reject`,
      'Activity rejected.'
    );
  }

  cancelActivity(activity: AdminInteractiveActivity): void {
    if (!confirm(`Cancel "${activity.title}"?`)) return;

    this.runAction(
      `${this.apiUrl}/interactive-activities/${activity.id}/cancel`,
      'Activity cancelled.'
    );
  }

  openRescheduleForm(
    activity: AdminInteractiveActivity,
    scope: RescheduleScope
  ): void {
    const key = this.rescheduleKey(activity, scope);

    if (this.reschedulingKey === key) {
      this.cancelReschedule();
      return;
    }

    this.reschedulingKey = key;
    this.rescheduleForm = {
      date: activity.date.substring(0, 10),
      startTime: activity.startTime.substring(0, 5),
      endTime: activity.endTime.substring(0, 5)
    };
    this.errorMessage = '';
  }

  isRescheduling(
    activity: AdminInteractiveActivity,
    scope: RescheduleScope
  ): boolean {
    return this.reschedulingKey === this.rescheduleKey(activity, scope);
  }

  cancelReschedule(): void {
    this.reschedulingKey = null;
  }

  saveReschedule(
    activity: AdminInteractiveActivity,
    scope: RescheduleScope
  ): void {
    const { date, startTime, endTime } = this.rescheduleForm;

    if (
      !this.isValidDate(date) ||
      !this.isValidTime(startTime) ||
      !this.isValidTime(endTime) ||
      endTime <= startTime
    ) {
      this.errorMessage =
        'Enter a valid date and time. End time must be later than start time.';
      return;
    }

    this.runAction(
      `${this.apiUrl}/interactive-activities/${activity.id}/reschedule`,
      'Activity rescheduled successfully.',
      {
        date,
        startTime: `${startTime}:00`,
        endTime: `${endTime}:00`
      }
    );
  }

  approveSchedule(activity: AdminInteractiveActivity): void {
    if (!activity.interactiveScheduleId) return;

    this.runAction(
      `${this.apiUrl}/interactive-schedules/${activity.interactiveScheduleId}/approve`,
      'Recurring schedule approved successfully.'
    );
  }

  rejectSchedule(activity: AdminInteractiveActivity): void {
    if (!activity.interactiveScheduleId) return;
    if (!confirm(`Reject the entire schedule "${activity.title}"?`)) return;

    this.runAction(
      `${this.apiUrl}/interactive-schedules/${activity.interactiveScheduleId}/reject`,
      'Recurring schedule rejected.'
    );
  }

  private runAction(
    url: string,
    successMessage: string,
    body: object = {}
  ): void {
    this.processingId = this.processingId ?? -1;
    this.errorMessage = '';
    this.actionMessage = '';

    // The moderation routes use PUT.
    this.http.put(url, body, {
      withCredentials: true
    }).subscribe({
      next: () => {
        this.actionMessage = successMessage;
        this.processingId = null;
        this.reschedulingKey = null;
        this.loadActivities();
      },
      error: error => {
        console.error('Moderation action failed:', error);
        this.errorMessage =
          error.error?.message ||
          (typeof error.error === 'string' ? error.error : null) ||
          (error.status === 409
            ? this.languageService.translate('scheduleOverlapError')
            : 'The action could not be completed.');
        this.processingId = null;
        this.cdr.markForCheck();
      }
    });
  }

  private rescheduleKey(
    activity: AdminInteractiveActivity,
    scope: RescheduleScope
  ): string {
    return `${scope}-${activity.id}`;
  }

  private isValidDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) &&
      date.toISOString().substring(0, 10) === value;
  }

  private isValidTime(value: string): boolean {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  }

  statusClass(status: string | number): string {
    const value = String(status).toLowerCase();

    if (['scheduled', '0'].includes(value))
      return 'bg-blue-100 text-blue-700';

    if (['active', '1'].includes(value))
      return 'bg-emerald-100 text-emerald-700';

    if (['finished', '2', 'completed'].includes(value))
      return 'bg-slate-200 text-slate-700';

    if (['cancelled', 'canceled', '3'].includes(value))
      return 'bg-red-100 text-red-700';

    return 'bg-amber-100 text-amber-700';
  }

  bookingStatusClass(status: string | number | undefined): string {
    const value = String(status ?? 'Unknown').toLowerCase();

    if (value === 'approved' || value === 'confirmed')
      return 'bg-emerald-100 text-emerald-700';

    if (value === 'pending')
      return 'bg-amber-100 text-amber-700';

    if (value === 'rejected' || value === 'cancelled')
      return 'bg-red-100 text-red-700';

    return 'bg-slate-100 text-slate-700';
  }
}
