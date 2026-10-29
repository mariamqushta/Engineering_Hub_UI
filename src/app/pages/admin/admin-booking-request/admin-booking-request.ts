
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LanguageService } from '../../../core/services/language.service';
import { environment } from '../../../../environments/environment';
type BookingTab = 'tracks' | 'interactive' | 'workshops';

interface StudentInfo {
  fullName?: string;
  userName?: string;
  email?: string;
}

interface BookingRequest {
  id: number;
  studentId: string;
  approvalStatus: number | string;
  status?: number | string;
  requestedAt: string;
  requestedPrice?: number;
  student?: StudentInfo;

  // Track/package booking
  trackId?: number;
  bookingType?: number | string;
  track?: { title?: string };
  trackTitle?: string;
  packageName?: string;

  // Individual interactive booking
  interactiveActivityId?: number;
  activityTitle?: string;

  // Individual workshop booking
  workshopId?: number;
  workshopTitle?: string;
  place?: string;

  // Interactive/workshop schedule
  date?: string;
  startTime?: string;
  endTime?: string;
}

@Component({
  selector: 'app-admin-booking-request',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-booking-request.html',
})
export class AdminBookingRequest implements OnInit {
  private readonly apiUrl = `${environment.apiUrl}/api/Admin`;
  private cdr = inject(ChangeDetectorRef);

  activeTab: BookingTab = 'tracks';

  requests: BookingRequest[] = [];
  interactiveRequests: BookingRequest[] = [];
  workshopRequests: BookingRequest[] = [];

  message = '';
  messageType: 'success' | 'error' = 'success';
  loading = false;
  private messageVersion = 0;

  constructor(private http: HttpClient,public languageService: LanguageService,) {}

  ngOnInit(): void {
    this.getPendingRequests();
  }

  get currentRequests(): BookingRequest[] {
    switch (this.activeTab) {
      case 'interactive':
        return this.interactiveRequests;
      case 'workshops':
        return this.workshopRequests;
      default:
        return this.requests;
    }
  }

  get totalPendingRequests(): number {
    return this.requests.length +
      this.interactiveRequests.length +
      this.workshopRequests.length;
  }

  changeTab(tab: BookingTab): void {
    this.activeTab = tab;
    this.message = '';
  }

  getPendingRequests(): void {
    this.loading = true;

    let completed = 0;
    let failed = false;

    const finishLoading = (): void => {
      completed++;

      if (completed === 3) {
        this.loading = false;

        if (failed) {
          this.showMessage(
            'Some booking requests could not be loaded. Check the API and try again.',
            'error'
          );
        }

        this.cdr.markForCheck();
      }
    };

    this.http.get<BookingRequest[]>(
      `${this.apiUrl}/pending-bookings`,
      { withCredentials: true }
    ).subscribe({
      next: requests => {
        this.requests = requests ?? [];
        finishLoading();
      },
      error: error => {
        console.error('Failed to retrieve track booking requests:', error);
        failed = true;
        finishLoading();
      }
    });

    this.http.get<BookingRequest[]>(
      `${this.apiUrl}/pending-interactive-bookings`,
      { withCredentials: true }
    ).subscribe({
      next: requests => {
        this.interactiveRequests = requests ?? [];
        finishLoading();
      },
      error: error => {
        console.error('Failed to retrieve interactive booking requests:', error);
        failed = true;
        finishLoading();
      }
    });

    this.http.get<BookingRequest[]>(
      `${this.apiUrl}/pending-workshop-bookings`,
      { withCredentials: true }
    ).subscribe({
      next: requests => {
        this.workshopRequests = requests ?? [];
        finishLoading();
      },
      error: error => {
        console.error('Failed to retrieve workshop booking requests:', error);
        failed = true;
        finishLoading();
      }
    });
  }

  approveRequest(id: number): void {
    this.processRequest(id, 'approve');
  }

  rejectRequest(id: number): void {
    this.processRequest(id, 'reject');
  }

  private processRequest(
    id: number,
    action: 'approve' | 'reject'
  ): void {
    const list = this.getCurrentList();

    if (!list.some(request => request.id === id)) {
      return;
    }

    if (!window.confirm(`Are you sure you want to ${action} this request?`)) {
      return;
    }

    const endpoint = this.getActionEndpoint(id, action);

    this.http.put<{ message?: string }>(
      `${this.apiUrl}/${endpoint}`,
      {},
      { withCredentials: true }
    ).subscribe({
      next: response => {
        this.removeRequest(id);
        this.showMessage(
          response?.message ??
            `Booking request ${action}d successfully.`,
          'success'
        );
        this.cdr.markForCheck();
      },
      error: error => {
        console.error(`Failed to ${action} booking request:`, error);

        this.showMessage(
          error.error?.message ??
            `Could not ${action} this booking request.`,
          'error'
        );
      }
    });
  }

  private getCurrentList(): BookingRequest[] {
    switch (this.activeTab) {
      case 'interactive':
        return this.interactiveRequests;
      case 'workshops':
        return this.workshopRequests;
      default:
        return this.requests;
    }
  }

  private getActionEndpoint(
    id: number,
    action: 'approve' | 'reject'
  ): string {
    if (this.activeTab === 'interactive') {
      return `interactive-bookings/${id}/${action}`;
    }

    if (this.activeTab === 'workshops') {
      return `workshop-bookings/${id}/${action}`;
    }

    return `bookings/${id}/${action}`;
  }

  private removeRequest(id: number): void {
    switch (this.activeTab) {
      case 'interactive':
        this.interactiveRequests =
          this.interactiveRequests.filter(request => request.id !== id);
        break;

      case 'workshops':
        this.workshopRequests =
          this.workshopRequests.filter(request => request.id !== id);
        break;

      default:
        this.requests = this.requests.filter(request => request.id !== id);
    }
  }

  getBookingType(type: number | string | undefined): string {
    if (typeof type === 'string') return type;
    if (type === undefined) return 'Track booking';

    const types = [
      'Track Only',
      'Track + Interactive Activities',
      'Track + Interactive Activities + Workshops',
      'Track + Coaching'
    ];

    return types[type] ?? 'Unknown';
  }

  getStatus(status: number | string): string {
    if (typeof status === 'string') return status;

    return ['Pending', 'Approved', 'Rejected'][status] ?? 'Unknown';
  }

  formatTime(time?: string): string {
    if (!time) return '—';

    const parts = time.split(':');

    return parts.length >= 2
      ? `${parts[0]}:${parts[1]}`
      : time;
  }

  private showMessage(
    message: string,
    type: 'success' | 'error'
  ): void {
    this.messageVersion++;
    const currentVersion = this.messageVersion;

    this.message = message;
    this.messageType = type;

    setTimeout(() => {
      if (this.messageVersion === currentVersion) {
        this.message = '';
        this.cdr.markForCheck();
      }
    }, 4000);
  }
}
