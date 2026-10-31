import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LanguageService } from '../../../core/services/language.service';
import { environment } from '../../../../environments/environment';
interface AdminActivityStudent {
  userName: string;
  fullName?: string;
  email?: string;
  bookingStatus?: string | number;
}

interface AdminInteractiveActivity {
  id: number;
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
  students: AdminActivityStudent[];
  occurrences?: AdminInteractiveActivity[];
}

@Component({
  selector: 'app-admin-interactive',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-interactive.html'
})
export class AdminInteractive implements OnInit {


private readonly apiUrl = `${environment.apiUrl}/api/Admin/interactive-activities`;
  private cdr = inject(ChangeDetectorRef);
  activities: AdminInteractiveActivity[] = [];
  searchTerm = '';
  expandedActivityId: number | null = null;
  isLoading = false;
  errorMessage = '';

  constructor(private http: HttpClient,
     public languageService: LanguageService,) {}

  ngOnInit(): void {
    this.loadActivities();
  }

  loadActivities(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.http.get<
      AdminInteractiveActivity[] |
      { activities: AdminInteractiveActivity[] }
    >(this.apiUrl, { withCredentials: true }).subscribe({
      next: response => {

        const items = Array.isArray(response)
          ? response
          : response?.activities ?? [];

     const groupedActivities = new Map<string, AdminInteractiveActivity>();

      for (const activity of items) {
        const isRecurring =
          activity.title?.trim().toLowerCase() === 'weekly recurring session';

        const key = isRecurring
          ? `${activity.title}|${activity.trackTitle}|${activity.instructorUserName}`
          : `activity-${activity.id}`;

        const existing = groupedActivities.get(key);

        if (existing) {
          existing.occurrences = [
            ...(existing.occurrences ?? [existing]),
            activity
          ];
        } else {
          groupedActivities.set(key, {
            ...activity,
            students: activity.students ?? [],
            occurrences: [activity]
          });
        }
      }

      this.activities = Array.from(groupedActivities.values());

        this.isLoading = false;
         this.cdr.markForCheck();
      },
      error: error => {
        console.error('Could not load interactive activities:', error);
        this.errorMessage =
          error.error?.message || 'Could not load interactive activities.';
        this.isLoading = false;
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
    return this.activities.reduce(
      (total, activity) => total + activity.students.length,
      0
    );
  }

  toggleStudents(activityId: number): void {
    this.expandedActivityId =
      this.expandedActivityId === activityId ? null : activityId;
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
