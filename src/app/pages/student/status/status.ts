import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef,Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { LanguageService } from '../../../core/services/language.service';
import { environment } from '../../../../environments/environment';
type BookingType = 'Track' | 'Workshop' | 'Interactive';

interface BookingItem {
  id: number | string;
  type: BookingType;
  name: string;
  requestedAt: string | null;
  approvalStatus: string;
  sessionStatus: string | null;
  source: string | null;
}

@Component({
  selector: 'app-status',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './status.html'
})
export class Status implements OnInit {
  private http = inject(HttpClient);
   private cdr = inject(ChangeDetectorRef);

private readonly apiUrl = 'https://localhost:7109/api';

  bookings: BookingItem[] = [];
  isLoading = true;
  errorMessage = '';

  selectedType = 'All';
  selectedStatus = 'All';
  constructor(

     public languageService: LanguageService,

  ) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      tracks: this.http.get<any[]>(
        `${this.apiUrl}/TrackBooking/MyBookings`,
        { withCredentials: true }
      ),
      workshops: this.http.get<any[]>(
        `${this.apiUrl}/WorkshopBooking/MyBookings`,
        { withCredentials: true }
      ),
      interactives: this.http.get<any[]>(
        `${this.apiUrl}/InteractiveBooking/MyBookings`,
        { withCredentials: true }
      )
    }).subscribe({
      next: (result) => {
          console.log('Track bookings:', result.tracks.length, result.tracks);
          console.log('Workshop bookings:', result.workshops.length, result.workshops);
          console.log('Interactive bookings:', result.interactives.length, result.interactives);

       const trackBookings = this.normalizeBookings(
          result.tracks,
          'Track'
        );

        const workshopBookings = this.normalizeBookings(
          result.workshops,
          'Workshop'
        );

        const interactiveBookings = this.normalizeBookings(
          result.interactives,
          'Interactive'
        );

        // Keep only one row per recurring Interactive Activity.
        const uniqueInteractiveBookings = Array.from(
          new Map(
            interactiveBookings.map((booking) => [
              booking.id,
              booking
            ])
          ).values()
        );

        this.bookings = [
          ...trackBookings,
          ...workshopBookings,
          ...uniqueInteractiveBookings
        ].sort((a, b) => {
            const dateA = a.requestedAt ? new Date(a.requestedAt).getTime() : 0;
            const dateB = b.requestedAt ? new Date(b.requestedAt).getTime() : 0;
            return dateB - dateA;
          });

          this.isLoading = false;
          this.cdr.markForCheck();
        },
      error: (error) => {
        console.error('Failed to load booking status:', error);

        this.errorMessage =
          'We could not load your bookings. Please try again.';

        this.isLoading = false;
      }
    });
  }

  private normalizeBookings(
    items: any[] | null,
    type: BookingType
  ): BookingItem[] {
    if (!Array.isArray(items)) {
      return [];
    }

    return items.map((item: any) => {
      const relatedItem =
        item.track ??
        item.Track ??
        item.workshop ??
        item.Workshop ??
        item.interactiveActivity ??
        item.InteractiveActivity ??
        {};

     const rawApproval =
      item.approvalStatus ??
      item.ApprovalStatus;

    const rawSession =
      item.bookingStatus ??
      item.BookingStatus ??
      item.sessionStatus ??
      item.SessionStatus ??
      item.status ??
      item.Status;

      const rawDate =
        item.requestedAt ??
        item.RequestedAt ??
        item.bookedAt ??
        item.BookedAt;

      const rawName =
        item.trackTitle ??
        item.TrackTitle ??
        item.track?.title ??
        item.Track?.Title ??
        item.workshop?.title ??
        item.Workshop?.Title ??
        item.interactiveActivity?.title ??
        item.InteractiveActivity?.Title ??
        item.title ??
        item.Title ??
        relatedItem.title ??
        relatedItem.Title ??
        relatedItem.name ??
        relatedItem.Name;

      return {
        id:
          item.id ??
          item.Id ??
          item.bookingId ??
          item.BookingId ??
          item.trackBookingRequestId ??
          item.TrackBookingRequestId ??
          `${type}-${rawDate ?? Math.random()}`,

        type,
        name: rawName ?? `${type} booking`,

        requestedAt: rawDate ?? null,

        approvalStatus: this.formatStatus(rawApproval),

        sessionStatus:
          rawSession === null || rawSession === undefined
            ? null
            : this.formatStatus(rawSession),

        source: this.formatSource(
          item.source ?? item.Source
        )
      };
    });
  }

  private formatStatus(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return 'Unknown';
    }

    if (typeof value === 'number') {
      const statusNames: Record<number, string> = {
        0: 'Pending',
        1: 'Approved',
        2: 'Rejected'
      };

      return statusNames[value] ?? String(value);
    }

    const text = String(value);

    const statusNames: Record<string, string> = {
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      scheduled: 'Scheduled',
      active: 'Active',
      finished: 'Finished',
      cancelled: 'Cancelled',
      canceled: 'Cancelled'
    };

    return statusNames[text.toLowerCase()] ?? text;
  }

  private formatSource(value: unknown): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'number') {
      const sourceNames: Record<number, string> = {
        0: 'Individual',
        1: 'Track booking',
        2: 'Track package'
      };

      return sourceNames[value] ?? String(value);
    }

    return String(value);
  }

  get filteredBookings(): BookingItem[] {
    return this.bookings.filter((booking) => {
      const matchesType =
        this.selectedType === 'All' ||
        booking.type === this.selectedType;

      const matchesStatus =
        this.selectedStatus === 'All' ||
        booking.approvalStatus.toLowerCase() ===
          this.selectedStatus.toLowerCase();

      return matchesType && matchesStatus;
    });
  }

  get pendingCount(): number {
    return this.bookings.filter(
      (booking) => booking.approvalStatus === 'Pending'
    ).length;
  }

  get approvedCount(): number {
    return this.bookings.filter(
      (booking) => booking.approvalStatus === 'Approved'
    ).length;
  }

  get rejectedCount(): number {
    return this.bookings.filter(
      (booking) => booking.approvalStatus === 'Rejected'
    ).length;
  }

  getApprovalClass(status: string): string {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-700';
      case 'Rejected':
        return 'bg-red-100 text-red-700';
      case 'Pending':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }

  getSessionClass(status: string | null): string {
    switch (status) {
      case 'Scheduled':
        return 'bg-blue-100 text-blue-700';
      case 'Active':
        return 'bg-cyan-100 text-cyan-700';
      case 'Finished':
        return 'bg-green-100 text-green-700';
      case 'Cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }
}
