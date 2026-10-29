
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { LanguageService } from '../../../core/services/language.service';
import { environment } from '../../../../environments/environment';
import { TrackService } from '../../../core/services/track.service';
import { Track } from '../../../core/models/track';

type ActivityFormMode = 'single' | 'recurring';

interface InteractiveActivity {
  id: number;
  trackId: number;
  scheduleId: number | null;
  title: string;
  description: string | null;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  price: number;
  meetingUrl: string | null;
  status: number;
}

interface RecurringActivityGroup {
  key: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  days: string[];
  occurrences: InteractiveActivity[];
}

@Component({
  selector: 'app-instructor-interactive',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './instructor-interactive.html',
  styleUrl: './instructor-interactive.css'
})
export class InstructorInteractive implements OnInit {
  private readonly apiUrl = `${environment.apiUrl}/api`;

  tracks: Track[] = [];
  activities: InteractiveActivity[] = [];

  selectedTrackId: number | null = null;

  isLoadingTracks = false;
  isLoadingActivities = false;
  isSaving = false;
  isCancelling: number | null = null;

  showForm = false;
  errorMessage = '';
  successMessage = '';

  minDate = this.getLocalDate();
  activityFormMode: ActivityFormMode = 'single';

  readonly weekdays = [
    { label: 'Sunday', value: 0 },
    { label: 'Monday', value: 1 },
    { label: 'Tuesday', value: 2 },
    { label: 'Wednesday', value: 3 },
    { label: 'Thursday', value: 4 },
    { label: 'Friday', value: 5 },
    { label: 'Saturday', value: 6 }
  ];

  form = {
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    capacity: 20,
    price: 0,
    meetingUrl: ''
  };

  scheduleForm = {
    title: '',
    description: '',
    daysOfWeek: [] as number[],
    startDate: this.getLocalDate(),
    endDate: '',
    startTime: '',
    endTime: '',
    capacity: 20,
    price: 0,
    meetingUrl: ''
  };

  constructor(
    private trackService: TrackService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
     public languageService: LanguageService,
  ) {}

  ngOnInit(): void {
    this.loadMyTracks();
  }

  get selectedTrack(): Track | undefined {
    return this.tracks.find(
      track => track.id === this.selectedTrackId
    );
  }

  /**
   * Groups only activities that have the same backend schedule ID.
   * Activities without a schedule ID remain individual cards.
   */
  get normalActivities(): InteractiveActivity[] {
  return this.activities
    .filter(activity => activity.scheduleId === null)
    .sort((a, b) => a.date.localeCompare(b.date));
}

get recurringSchedules(): RecurringActivityGroup[] {
  const groups = new Map<number, InteractiveActivity[]>();

  for (const activity of this.activities) {
    if (activity.scheduleId === null) {
      continue;
    }

    const scheduleId = activity.scheduleId;

    if (!groups.has(scheduleId)) {
      groups.set(scheduleId, []);
    }

    const occurrences = groups.get(scheduleId)!;

    // Prevent duplicate occurrences within the same schedule.
    if (!occurrences.some(item => item.id === activity.id)) {
      occurrences.push(activity);
    }
  }

  const dayNames = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday',
    'Thursday', 'Friday', 'Saturday'
  ];

  return Array.from(groups.entries()).map(([scheduleId, items]) => {
    const occurrences = [...items].sort(
      (a, b) => a.date.localeCompare(b.date)
    );

    const first = occurrences[0];
    const last = occurrences[occurrences.length - 1];

    const days = [
      ...new Set(
        occurrences.map(item => {
          const date = item.date.substring(0, 10);
          return dayNames[new Date(`${date}T12:00:00`).getDay()];
        })
      )
    ].sort(
      (a, b) => dayNames.indexOf(a) - dayNames.indexOf(b)
    );

    return {
      key: `schedule-${scheduleId}`,
      title: first.title,
      description: first.description,
      startDate: first.date,
      endDate: last.date,
      startTime: first.startTime,
      endTime: first.endTime,
      days,
      occurrences
    };
  });
}
  loadMyTracks(): void {
    this.isLoadingTracks = true;
    this.errorMessage = '';

    this.trackService.getMyTracks()
      .pipe(finalize(() => {
        this.isLoadingTracks = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (response: any) => {
          const data = Array.isArray(response)
            ? response
            : response?.data ?? response?.tracks ?? [];
          console.log('API response:', response);
console.log('First API item:', data[0]);
console.log(
  'Schedule IDs:',
  data.map((item: any) => ({
    id: item.id,
    scheduleId: item.scheduleId,
    ScheduleId: item.ScheduleId,
    interactiveScheduleId: item.interactiveScheduleId,
    InteractiveScheduleId: item.InteractiveScheduleId
  }))
);
          this.tracks = data.map((item: any) => ({
            id: Number(item.id ?? item.Id ?? item.trackId ?? item.TrackId),
            title: item.title ?? item.Title ?? item.name ?? item.Name ?? '',
            description: item.description ?? item.Description ?? '',
            price: Number(item.price ?? item.Price ?? 0),
            isActive: item.isActive ?? item.IsActive ?? true
          })).filter((track: Track) => track.id > 0);

          if (this.tracks.length > 0) {
            this.selectedTrackId = this.tracks[0].id;
            this.loadActivities();
          }
        },
        error: error => {
          console.error('Error loading instructor tracks:', error);

          this.errorMessage =
            error.status === 401 || error.status === 403
              ? 'Your instructor session has expired or you do not have permission. Please log in again.'
              : 'Could not load your assigned tracks. Please try again.';
        }
      });
  }

  onTrackChange(value: string | number): void {
    const trackId = Number(value);

    this.selectedTrackId =
      Number.isFinite(trackId) && trackId > 0 ? trackId : null;

    this.activities = [];
    this.showForm = false;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.selectedTrackId !== null) {
      this.loadActivities();
    }
  }

  loadActivities(): void {
    if (this.selectedTrackId === null) {
      this.activities = [];
      return;
    }

    this.isLoadingActivities = true;
    this.errorMessage = '';

    this.trackService
      .getInteractiveActivitiesByTrack(this.selectedTrackId)
      .pipe(finalize(() => {
        this.isLoadingActivities = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (response: any) => {
          const data = Array.isArray(response)
            ? response
            : response?.data ?? response?.activities ?? [];

          this.activities = data.map((item: any) => ({
            id: Number(item.id ?? item.Id),
            trackId: Number(item.trackId ?? item.TrackId),
            scheduleId: this.readScheduleId(item),
            title: item.title ?? item.Title ?? '',
            description: item.description ?? item.Description ?? null,
            date: item.date ?? item.Date ?? '',
            startTime: item.startTime ?? item.StartTime ?? '',
            endTime: item.endTime ?? item.EndTime ?? '',
            capacity: Number(item.capacity ?? item.Capacity ?? 0),
            price: Number(item.price ?? item.Price ?? 0),
            meetingUrl: item.meetingUrl ?? item.MeetingUrl ?? null,
            status: Number(item.status ?? item.Status ?? 0)
          }));

          this.cdr.detectChanges();
        },
        error: error => {
          console.error('Error loading interactive activities:', error);
          this.errorMessage =
            'Could not load interactive activities for this track.';
          this.cdr.detectChanges();
        }
      });
  }

private readScheduleId(item: any): number | null {
  const value =
    item.scheduleId ??
    item.ScheduleId ??
    item.interactiveScheduleId ??
    item.InteractiveScheduleId;

  if (value === null || value === undefined || value === '') {
    return null;
  }

  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

  openCreateForm(): void {
    if (this.selectedTrackId === null) {
      this.errorMessage = 'Please select a track first.';
      return;
    }

    this.resetForm();
    this.resetScheduleForm();
    this.activityFormMode = 'single';
    this.showForm = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  closeCreateForm(): void {
    this.showForm = false;
    this.resetForm();
    this.resetScheduleForm();
    this.activityFormMode = 'single';
  }

  setActivityFormMode(mode: ActivityFormMode): void {
    this.activityFormMode = mode;
    this.errorMessage = '';
    this.successMessage = '';
  }

  toggleScheduleDay(day: number, checked: boolean): void {
    if (checked) {
      if (!this.scheduleForm.daysOfWeek.includes(day)) {
        this.scheduleForm.daysOfWeek = [
          ...this.scheduleForm.daysOfWeek,
          day
        ];
      }
    } else {
      this.scheduleForm.daysOfWeek =
        this.scheduleForm.daysOfWeek.filter(value => value !== day);
    }
  }

  createSchedule(): void {
    if (this.selectedTrackId === null) {
      this.errorMessage = 'Please select a track first.';
      return;
    }

    const schedule = this.scheduleForm;

    if (
      !schedule.title.trim() ||
      !schedule.startDate ||
      !schedule.endDate ||
      !schedule.startTime ||
      !schedule.endTime
    ) {
      this.errorMessage = 'Please complete all required schedule fields.';
      return;
    }

    if (schedule.daysOfWeek.length === 0) {
      this.errorMessage = 'Select at least one weekday.';
      return;
    }

    if (schedule.startDate < this.minDate) {
      this.errorMessage = 'The schedule start date cannot be in the past.';
      return;
    }

    if (schedule.endDate < schedule.startDate) {
      this.errorMessage = 'The end date must be on or after the start date.';
      return;
    }

    if (schedule.endTime <= schedule.startTime) {
      this.errorMessage = 'End time must be later than start time.';
      return;
    }

    if (
      !Number.isInteger(schedule.capacity) ||
      schedule.capacity < 1 ||
      !Number.isFinite(Number(schedule.price)) ||
      Number(schedule.price) < 0
    ) {
      this.errorMessage =
        'Capacity must be at least 1 and price cannot be negative.';
      return;
    }

    const meetingUrl = schedule.meetingUrl.trim();

    if (!this.isValidMeetingUrl(meetingUrl)) {
      this.errorMessage =
        'Please enter a valid meeting URL starting with http:// or https://.';
      return;
    }

    const payload = {
      trackId: this.selectedTrackId,
      title: schedule.title.trim(),
      description: schedule.description.trim() || null,
      daysOfWeek: [...schedule.daysOfWeek],
      startDate: schedule.startDate,
      endDate: schedule.endDate,
      startTime: `${schedule.startTime}:00`,
      endTime: `${schedule.endTime}:00`,
      capacity: Number(schedule.capacity),
      price: Number(schedule.price),
      meetingUrl: meetingUrl || null
    };

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.http.post(
      `${this.apiUrl}/InteractiveActivity/schedule`,
      payload,
      { withCredentials: true }
    )
    .pipe(finalize(() => {
      this.isSaving = false;
      this.cdr.detectChanges();
    }))
    .subscribe({
      next: () => {
        this.showForm = false;
        this.activityFormMode = 'single';
        this.resetScheduleForm();
        this.successMessage = 'Recurring schedule created successfully.';
        this.loadActivities();
      },
      error: error => {
        console.error('Error creating recurring schedule:', error);
        this.errorMessage =
          error.error?.message ??
          (typeof error.error === 'string' ? error.error : null) ??
          'Could not create the recurring schedule.';
        this.cdr.detectChanges();
      }
    });
  }

  createActivity(): void {
    if (this.selectedTrackId === null) {
      this.errorMessage = 'Please select a track first.';
      return;
    }

    if (
      !this.form.title.trim() ||
      !this.form.date ||
      !this.form.startTime ||
      !this.form.endTime
    ) {
      this.errorMessage = 'Please complete all required fields.';
      return;
    }

    if (this.form.endTime <= this.form.startTime) {
      this.errorMessage = 'End time must be later than start time.';
      return;
    }

    if (this.form.date < this.minDate) {
      this.errorMessage = 'Activity date cannot be in the past.';
      return;
    }

    if (
      !Number.isInteger(this.form.capacity) ||
      this.form.capacity < 1 ||
      !Number.isFinite(Number(this.form.price)) ||
      Number(this.form.price) < 0
    ) {
      this.errorMessage =
        'Capacity must be at least 1 and price cannot be negative.';
      return;
    }

    const meetingUrl = this.form.meetingUrl.trim();

    if (!this.isValidMeetingUrl(meetingUrl)) {
      this.errorMessage =
        'Please enter a valid meeting URL starting with http:// or https://.';
      return;
    }

    const payload = {
      trackId: this.selectedTrackId,
      title: this.form.title.trim(),
      description: this.form.description.trim() || null,
      date: this.form.date,
      startTime: `${this.form.startTime}:00`,
      endTime: `${this.form.endTime}:00`,
      capacity: Number(this.form.capacity),
      price: Number(this.form.price),
      meetingUrl: meetingUrl || null
    };

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.http.post(
      `${this.apiUrl}/InteractiveActivity`,
      payload,
      { withCredentials: true }
    )
    .pipe(finalize(() => {
      this.isSaving = false;
      this.cdr.detectChanges();
    }))
    .subscribe({
      next: () => {
        this.showForm = false;
        this.resetForm();
        this.successMessage = 'Interactive activity created successfully.';
        this.loadActivities();
      },
      error: error => {
        console.error('Error creating interactive activity:', error);
        this.errorMessage =
          error.error?.message ??
          (typeof error.error === 'string' ? error.error : null) ??
          'Could not create the activity. Check your track assignment and entered details.';
        this.cdr.detectChanges();
      }
    });
  }

  cancelActivity(activity: InteractiveActivity): void {
    if (activity.status === 3) {
      this.errorMessage = 'This activity is already cancelled.';
      return;
    }

    if (activity.status === 2 || activity.status === 5) {
      this.errorMessage = 'This activity has already finished.';
      return;
    }

    if (!confirm(`Are you sure you want to cancel "${activity.title}"?`)) {
      return;
    }

    this.isCancelling = activity.id;
    this.errorMessage = '';
    this.successMessage = '';

    this.http.put(
      `${this.apiUrl}/InteractiveActivity/${activity.id}/cancel`,
      {},
      { withCredentials: true }
    )
    .pipe(finalize(() => {
      this.isCancelling = null;
      this.cdr.detectChanges();
    }))
    .subscribe({
      next: () => {
        this.successMessage =
          'Interactive activity cancelled successfully.';
        this.loadActivities();
      },
      error: error => {
        console.error('Error cancelling interactive activity:', error);
        this.errorMessage =
          error.error?.message ??
          (typeof error.error === 'string' ? error.error : null) ??
          'Could not cancel this activity.';
        this.cdr.detectChanges();
      }
    });
  }

  getStatusLabel(status: number): string {
    switch (status) {
      case 0: return 'Scheduled';
      case 1: return 'Ongoing';
      case 2: return 'Finished';
      case 3: return 'Cancelled';
      case 4: return 'Active';
      case 5: return 'Completed';
      default: return 'Unknown';
    }
  }

  formatTime(value: string): string {
    return value ? value.substring(0, 5) : '';
  }

  private isValidMeetingUrl(value: string): boolean {
    if (!value) {
      return true;
    }

    try {
      const url = new URL(value);
      return url.protocol === 'https:' || url.protocol === 'http:';
    } catch {
      return false;
    }
  }

  private resetForm(): void {
    this.form = {
      title: '',
      description: '',
      date: '',
      startTime: '',
      endTime: '',
      capacity: 20,
      price: 0,
      meetingUrl: ''
    };
  }

  private resetScheduleForm(): void {
    this.scheduleForm = {
      title: '',
      description: '',
      daysOfWeek: [],
      startDate: this.getLocalDate(),
      endDate: '',
      startTime: '',
      endTime: '',
      capacity: 20,
      price: 0,
      meetingUrl: ''
    };
  }

  private getLocalDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
