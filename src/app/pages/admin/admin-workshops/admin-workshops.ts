
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LanguageService } from '../../../core/services/language.service';
import { environment } from '../../../../environments/environment';
import { Time12Pipe } from '../../../shared/pipes/time-12.pipe';

interface AdminWorkshopStudent {
  userName: string;
  fullName?: string;
  email?: string;
  bookingStatus?: string | number;
}

interface AdminWorkshop {
  id: number;
  title: string;
  description?: string | null;
  trackTitle?: string;
  instructorUserName?: string | null;
  date: string;
  startTime: string;
  endTime: string;
  place: string;
  capacity: number;
  status: string | number;
  approvalStatus: string | number;
  students: AdminWorkshopStudent[];
}

interface RescheduleWorkshopRequest {
  date: string;
  startTime: string;
  endTime: string;
}

@Component({
  selector: 'app-admin-workshops',
  standalone: true,
  imports: [CommonModule, FormsModule, Time12Pipe],
  templateUrl: './admin-workshops.html'
})
export class AdminWorkshops implements OnInit {
  private readonly apiUrl = `${environment.apiUrl}/api/Admin/workshops`;

  private cdr = inject(ChangeDetectorRef);

  workshops: AdminWorkshop[] = [];
  searchTerm = '';
  expandedWorkshopId: number | null = null;

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  actionLoadingId: number | null = null;
  reschedulingWorkshopId: number | null = null;
  rescheduleForm = {
    date: '',
    startTime: '',
    endTime: ''
  };

  constructor(
    private http: HttpClient,
    public languageService: LanguageService
  ) {}

  ngOnInit(): void {
    this.loadWorkshops();
  }

  loadWorkshops(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.http.get<AdminWorkshop[] | { workshops: AdminWorkshop[] }>(
      this.apiUrl,
      { withCredentials: true }
    ).subscribe({
      next: response => {
        const items = Array.isArray(response)
          ? response
          : response?.workshops ?? [];

        this.workshops = items.map(item => ({
          ...item,
          approvalStatus: item.approvalStatus ?? 'Pending',
          students: item.students ?? []
        }));

        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: error => {
        console.error('Could not load workshops:', error);
        this.errorMessage =
          error.error?.message || 'Could not load workshops.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  get filteredWorkshops(): AdminWorkshop[] {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) return this.workshops;

    return this.workshops.filter(workshop =>
      (workshop.title ?? '').toLowerCase().includes(term) ||
      (workshop.trackTitle ?? '').toLowerCase().includes(term) ||
      (workshop.instructorUserName ?? '').toLowerCase().includes(term) ||
      (workshop.place ?? '').toLowerCase().includes(term) ||
      workshop.students.some(student =>
        (student.userName ?? '').toLowerCase().includes(term) ||
        (student.fullName ?? '').toLowerCase().includes(term)
      )
    );
  }

  toggleStudents(workshopId: number): void {
    this.expandedWorkshopId =
      this.expandedWorkshopId === workshopId ? null : workshopId;
  }

  // -----------------------------
  // Approval status
  // -----------------------------

  approvalStatusLabel(status: string | number | undefined): string {
    const value = String(status ?? 'Pending').toLowerCase();

    if (value === '0' || value === 'pending') return 'Pending';
    if (value === '1' || value === 'approved') return 'Approved';
    if (value === '2' || value === 'rejected') return 'Rejected';

    return String(status);
  }

  approvalStatusClass(status: string | number | undefined): string {
    const value = String(status ?? 'Pending').toLowerCase();

    if (value === '1' || value === 'approved')
      return 'bg-emerald-100 text-emerald-700';

    if (value === '2' || value === 'rejected')
      return 'bg-red-100 text-red-700';

    return 'bg-amber-100 text-amber-700';
  }

  isPending(status: string | number | undefined): boolean {
    const value = String(status ?? 'Pending').toLowerCase();
    return value === '0' || value === 'pending';
  }

  // -----------------------------
  // Admin moderation actions
  // -----------------------------

  approveWorkshop(workshop: AdminWorkshop): void {
    if (!this.isPending(workshop.approvalStatus)) return;

    if (!confirm(`Approve "${workshop.title}"?`)) return;

    this.performWorkshopAction(
      workshop,
      'approve',
      'Workshop approved successfully.'
    );
  }

  rejectWorkshop(workshop: AdminWorkshop): void {
    if (!this.isPending(workshop.approvalStatus)) return;

    if (!confirm(`Reject "${workshop.title}"?`)) return;

    this.performWorkshopAction(
      workshop,
      'reject',
      'Workshop rejected successfully.'
    );
  }

  cancelWorkshop(workshop: AdminWorkshop): void {
    if (this.isCancelled(workshop.status)) return;

    if (!confirm(
      `Cancel "${workshop.title}"? This will cancel the workshop session.`
    )) return;

    this.performWorkshopAction(
      workshop,
      'cancel',
      'Workshop cancelled successfully.'
    );
  }

  openRescheduleForm(workshop: AdminWorkshop): void {
    if (this.isCancelled(workshop.status)) return;

    if (this.reschedulingWorkshopId === workshop.id) {
      this.cancelReschedule();
      return;
    }

    this.reschedulingWorkshopId = workshop.id;
    this.rescheduleForm = {
      date: this.toDateInputValue(workshop.date),
      startTime: this.toTimeInputValue(workshop.startTime),
      endTime: this.toTimeInputValue(workshop.endTime)
    };
    this.errorMessage = '';
    this.successMessage = '';
  }

  cancelReschedule(): void {
    this.reschedulingWorkshopId = null;
  }

  saveReschedule(workshop: AdminWorkshop): void {
    const { date, startTime, endTime } = this.rescheduleForm;

    if (!this.isValidDate(date)) {
      this.errorMessage = 'Please enter a valid date in YYYY-MM-DD format.';
      this.successMessage = '';
      return;
    }

    if (!this.isValidTime(startTime) || !this.isValidTime(endTime)) {
      this.errorMessage = 'Please enter valid times in HH:mm format.';
      this.successMessage = '';
      return;
    }

    if (startTime >= endTime) {
      this.errorMessage = 'The end time must be later than the start time.';
      this.successMessage = '';
      return;
    }

    const request: RescheduleWorkshopRequest = {
      date,
      startTime: `${startTime}:00`,
      endTime: `${endTime}:00`
    };

    this.performWorkshopAction(
      workshop,
      'reschedule',
      'Workshop rescheduled successfully.',
      request
    );
  }

  private performWorkshopAction(
    workshop: AdminWorkshop,
    action: 'approve' | 'reject' | 'cancel' | 'reschedule',
    successMessage: string,
    body: RescheduleWorkshopRequest | Record<string, never> = {}
  ): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.actionLoadingId = workshop.id;

    const url = `${this.apiUrl}/${workshop.id}/${action}`;

    this.http.put(url, body, { withCredentials: true }).subscribe({
      next: () => {
        this.successMessage = successMessage;
        this.actionLoadingId = null;
        this.reschedulingWorkshopId = null;

        // Reload from the backend so the displayed status is authoritative.
        this.loadWorkshops();
      },
      error: error => {
        console.error(`Could not ${action} workshop:`, error);

        this.errorMessage =
          error.error?.message ||
          error.error?.title ||
          (typeof error.error === 'string' ? error.error : null) ||
          (error.status === 409
            ? this.languageService.translate('scheduleOverlapError')
            : `Could not ${action} workshop. Please try again.`);

        this.actionLoadingId = null;
        this.cdr.markForCheck();
      }
    });
  }

  private toDateInputValue(value: string): string {
    return value ? value.substring(0, 10) : '';
  }

  private toTimeInputValue(value: string): string {
    return value ? value.substring(0, 5) : '';
  }

  private isValidDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

    const date = new Date(`${value}T00:00:00`);
    return !Number.isNaN(date.getTime()) &&
      date.toISOString().substring(0, 10) === value;
  }

  private isValidTime(value: string): boolean {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  }

  // -----------------------------
  // Existing session status helpers
  // -----------------------------

  statusLabel(status: string | number): string {
    const value = String(status).toLowerCase();

    if (value === '0' || value === 'scheduled') return 'Scheduled';
    if (value === '1' || value === 'active') return 'Active';
    if (value === '2' || value === 'finished') return 'Finished';
    if (value === '3' || value === 'cancelled' || value === 'canceled')
      return 'Cancelled';

    return String(status);
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

  isCancelled(status: string | number): boolean {
    const value = String(status).toLowerCase();
    return value === '3' || value === 'cancelled' || value === 'canceled';
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

  get totalBookings(): number {
    return this.workshops.reduce(
      (total, workshop) => total + workshop.students.length,
      0
    );
  }
}
