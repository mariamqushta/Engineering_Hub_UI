
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TrackService } from '../../core/services/track.service';
import { Track } from '../../core/models/track';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../core/services/language.service';
import { environment } from '../../../environments/environment';
interface TrackBookingRequest {
  id: number;
  trackId: number;
  bookingType: number;
  approvalStatus: number | string;
  requestedAt: string;
}
@Component({
  selector: 'app-track-booking',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './track-booking.html',
  styleUrl: './track-booking.css',
})

export class TrackBooking implements OnInit {
  private route = inject(ActivatedRoute);
  private trackService = inject(TrackService);
  private cdr = inject(ChangeDetectorRef);
  bookingStatuses: Record<number, string> = {};

  trackId: number = 0;
  track: Track | null = null;

  bookingInProgress: number | null = null;
  bookingMessage = '';
  bookingError = '';

  trackOnlyPrice: number | null = null;
  interactivePrice: number | null = null;
  completePackagePrice: number | null = null;
  coachingPrice: number | null = null;

  constructor(

     public languageService: LanguageService,

  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id) {
      console.error('Invalid track ID.');
      return;
    }

    this.trackId = id;

    this.trackService.getTracks().subscribe({
      next: (tracks) => {
        this.track = tracks.find(track => track.id === id) ?? null;

        if (!this.track) {
          console.error('Track not found:', id);
          return;
        }
        this.loadMyBookings();
        this.loadPrices();
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading track:', error);
      }
    });
  }

  loadPrices(): void {
    this.trackService.getBookingPrice(this.trackId, 0).subscribe({
      next: (result) => {
        this.trackOnlyPrice = result.price;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading Track Only price:', error);
      }
    });

    this.trackService.getBookingPrice(this.trackId, 1).subscribe({
      next: (result) => {
        this.interactivePrice = result.price;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading Interactive price:', error);
      }
    });

    this.trackService.getBookingPrice(this.trackId, 2).subscribe({
      next: (result) => {
        this.completePackagePrice = result.price;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading Complete Package price:', error);
      }
    });

    this.trackService.getBookingPrice(this.trackId, 3).subscribe({
      next: (result) => {
        this.coachingPrice = result.price;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading Coaching price:', error);
      }
    });
  }


bookTrack(bookingType: number): void {
  this.bookingMessage = '';
  this.bookingError = '';

  // Prevent multiple requests while one is being submitted.
  if (this.bookingInProgress !== null) {
    return;
  }

  // Prevent submitting a booking type that already has a saved status.
  if (this.bookingStatuses[bookingType] !== undefined) {
    return;
  }

  this.bookingInProgress = bookingType;

  this.trackService.bookTrack(this.trackId, bookingType).subscribe({
    next: (response) => {
      // Update ONLY the card that was clicked.
      this.bookingStatuses[bookingType] = 'Pending';

      this.bookingMessage = response.message;
      this.bookingInProgress = null;

      this.cdr.markForCheck();
    },
    error: (error) => {
      this.bookingError =
        error.error?.message ||
        'Unable to submit your booking request.';

      this.bookingInProgress = null;
      this.cdr.markForCheck();
    }
  });
}

loadMyBookings(): void {
  this.trackService.getMyBookings().subscribe({
    next: (requests: TrackBookingRequest[]) => {
      this.bookingStatuses = {};

      const trackRequests = requests
        .filter(request => request.trackId === this.trackId)
        .sort(
          (a, b) =>
            new Date(b.requestedAt).getTime() -
            new Date(a.requestedAt).getTime()
        );

      for (const request of trackRequests) {
        if (this.bookingStatuses[request.bookingType] === undefined) {
          this.bookingStatuses[request.bookingType] =
            this.normalizeBookingStatus(request.approvalStatus);
        }
      }

      this.cdr.markForCheck();
    },
    error: error => {
      console.error('Error loading student bookings:', error);
    }
  });
}

private normalizeBookingStatus(status: number | string): string {
  if (typeof status === 'string') {
    return status;
  }

  // Assumes BookingApprovalStatus uses Pending=0, Approved=1, Rejected=2.
  const statuses: Record<number, string> = {
    0: 'Pending',
    1: 'Approved',
    2: 'Rejected'
  };

  return statuses[status] ?? 'Unknown';
}
}
