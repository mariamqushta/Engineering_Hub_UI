
import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  inject,
  Input,
  OnChanges,
  OnInit
} from '@angular/core';
import {
  InteractiveBookingService,
  MyInteractiveBooking
} from '../../core/services/interactive-booking.service';
import { InteractiveActivity } from '../../core/models/InteractiveActivity';
import { LanguageService } from '../../core/services/language.service';
import { environment } from '../../../environments/environment';
@Component({
  selector: 'app-interactive-booking',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './interactive-booking.html',
  styleUrl: './interactive-booking.css',
})
export class InteractiveBooking implements OnChanges {
  @Input() activities: InteractiveActivity[] = [];
 private cdr = inject(ChangeDetectorRef);
  monthNames = [
    'January', 'February', 'March', 'April',
    'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'
  ];

  weekDays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

  currentMonth = new Date().getMonth();
  currentYear = new Date().getFullYear();

  calendarDays: (number | null)[] = [];
  selectedActivity: InteractiveActivity | null = null;
  selectedDay: number | null = null;

bookingInProgress = false;
bookingMessage = '';
bookingError = '';

bookingStatuses: Record<number, 'Pending' | 'Approved' | 'Rejected'> = {};


  constructor(
  private interactiveBookingService: InteractiveBookingService,
     public languageService: LanguageService,
) {}

  ngOnChanges(): void {
    this.updateCalendar();
    this.selectFirstActivityInMonth();
  }

  updateCalendar(): void {
    const firstDay = new Date(
      this.currentYear,
      this.currentMonth,
      1
    ).getDay();

    const daysInMonth = new Date(
      this.currentYear,
      this.currentMonth + 1,
      0
    ).getDate();

    this.calendarDays = [
      ...Array(firstDay).fill(null),
      ...Array.from({ length: daysInMonth }, (_, index) => index + 1)
    ];
  }
ngOnInit(): void {
  this.loadMyBookings();
}

private loadMyBookings(): void {
  this.interactiveBookingService.getMyBookings().subscribe({
    next: (bookings: MyInteractiveBooking[]) => {
      this.bookingStatuses = {};

      for (const booking of bookings) {
        const activityId =
          booking.interactiveActivityId ??
          booking.interactiveActivity?.id;

        if (activityId == null) {
          continue;
        }

        const approval = String(booking.approvalStatus)
          .toLowerCase();

        const sessionStatus = String(booking.bookingStatus)
          .toLowerCase();

        // BookingApprovalStatus: Pending = 0, Approved = 1,
        // Rejected = 2.
        if (approval === '2' || approval === 'rejected') {
          continue;
        }

        // SessionStatus: Cancelled = 3.
        if (sessionStatus === '3' ||
            sessionStatus === 'cancelled' ||
            sessionStatus === 'canceled') {
          continue;
        }

        const displayStatus =
          approval === '1' || approval === 'approved'
            ? 'Approved'
            : 'Pending';

        const existing = this.bookingStatuses[activityId];

        // If several records refer to the same activity,
        // keep Approved rather than allowing Pending to overwrite it.
        if (existing !== 'Approved' || displayStatus === 'Approved') {
          this.bookingStatuses[activityId] = displayStatus;
        }
      }

      this.cdr.markForCheck();
    },
    error: (error) => {
      if (error.status !== 401) {
        console.error('Could not load interactive bookings:', error);
      }
    }
  });
}
  previousMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }

    this.updateCalendar();
    this.selectFirstActivityInMonth();
  }

  nextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }

    this.updateCalendar();
    this.selectFirstActivityInMonth();
  }
  hasBooking(activity: InteractiveActivity): boolean {
  return this.bookingStatuses[activity.id] !== undefined;
}

  selectFirstActivityInMonth(): void {
    const activity = this.activities.find(item => {
      const date = new Date(item.date);

      return date.getMonth() === this.currentMonth &&
             date.getFullYear() === this.currentYear;
    });

    if (activity) {
      this.selectedDay = new Date(activity.date).getDate();
      this.selectedActivity = activity;
    } else {
      this.selectedDay = null;
      this.selectedActivity = null;
    }

    this.clearBookingFeedback();
  }

  selectDate(day: number): void {
    this.selectedDay = day;

    this.selectedActivity = this.activities.find(item => {
      const date = new Date(item.date);

      return date.getDate() === day &&
             date.getMonth() === this.currentMonth &&
             date.getFullYear() === this.currentYear;
    }) ?? null;

    this.clearBookingFeedback();
  }
getActivitiesOnDate(day: number): InteractiveActivity[] {
  return this.activities.filter(item => {
    const date = new Date(item.date);

    return (
      date.getDate() === day &&
      date.getMonth() === this.currentMonth &&
      date.getFullYear() === this.currentYear
    );
  });
}

selectActivity(activity: InteractiveActivity): void {
  this.selectedDay = new Date(activity.date).getDate();
  this.selectedActivity = activity;
  this.clearBookingFeedback();
}
  hasActivityOnDate(day: number): boolean {
    return this.activities.some(item => {
      const date = new Date(item.date);

      return date.getDate() === day &&
             date.getMonth() === this.currentMonth &&
             date.getFullYear() === this.currentYear;
    });
  }

  isSelectedDate(day: number): boolean {
    return this.selectedDay === day;
  }

  /**
   * Reads availability from the API model.
   * The backend must supply availableCapacity for this to work reliably.
   * We do not treat total capacity as remaining capacity.
   */
getAvailableCapacity(activity: InteractiveActivity): number | null {
  const available = (
    activity as InteractiveActivity & {
      availableCapacity?: number;
    }
  ).availableCapacity;

  if (typeof available !== 'number' || !Number.isFinite(available)) {
    return null;
  }

  return Math.max(0, Math.floor(available));
}

bookActivity(activity: InteractiveActivity): void {
  this.bookingMessage = '';
  this.bookingError = '';

  if (this.bookingInProgress || this.hasBooking(activity)) {
    return;
  }

  const availableCapacity = this.getAvailableCapacity(activity);

  if (availableCapacity === null) {
    this.bookingError =
      'We could not confirm availability. Please try again later.';
    return;
  }

  if (availableCapacity <= 0) {
    this.bookingError = 'This session is fully booked.';
    return;
  }

  this.bookingInProgress = true;

  this.interactiveBookingService
    .bookActivity(activity.id)
    .subscribe({
      next: (response) => {
        this.bookingStatuses[activity.id] = 'Pending';

        this.bookingMessage =
          response.message ||
          'Your booking request was submitted and is awaiting approval.';

        this.bookingInProgress = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Booking failed:', error.status, error.error);

        this.bookingError =
          error.error?.message ||
          'We could not submit your booking request. Please try again.';

        this.bookingInProgress = false;
      }
    });
}

private clearBookingFeedback(): void {
  this.bookingMessage = '';
  this.bookingError = '';
}
}
