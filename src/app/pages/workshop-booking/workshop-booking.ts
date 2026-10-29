import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  inject,
  Input,
  OnChanges,
  OnInit
} from '@angular/core';

import { Workshop } from '../../core/models/workshop';
import {
  WorkshopBookingResponse,
  WorkshopBookingService
} from '../../core/services/workshop-booking.service';
import { LanguageService } from '../../core/services/language.service';
import { environment } from '../../../environments/environment';
@Component({
  selector: 'app-workshop-booking',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './workshop-booking.html',
  styleUrl: './workshop-booking.css'
})
export class WorkshopBooking implements OnChanges, OnInit {
  @Input() workshops: Workshop[] = [];

  private cdr = inject(ChangeDetectorRef);

  constructor(
    private workshopBookingService: WorkshopBookingService,
         public languageService: LanguageService,
  ) {}

  monthNames = [
    'January', 'February', 'March', 'April',
    'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'
  ];

  weekDays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

  currentMonth = new Date().getMonth();
  currentYear = new Date().getFullYear();

  calendarDays: (number | null)[] = [];

  selectedWorkshop: Workshop | null = null;
  selectedDay: number | null = null;

  bookingInProgress = false;
  loadingBookings = false;
  bookingMessage = '';
  bookingError = '';

  bookingStatuses: Record<
    number,
    'Pending' | 'Approved' | 'Rejected'
  > = {};

  ngOnInit(): void {
    this.updateCalendar();
    this.loadMyBookings();
  }

  ngOnChanges(): void {
    this.updateCalendar();
    this.selectFirstWorkshopInMonth();
  }

  private parseDate(dateValue: string): Date {
    // Avoid shifting a date-only value because of UTC parsing.
    const parts = dateValue.slice(0, 10).split('-').map(Number);

    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  private isInCurrentMonth(workshop: Workshop): boolean {
    const date = this.parseDate(workshop.date);

    return date.getMonth() === this.currentMonth &&
      date.getFullYear() === this.currentYear;
  }

  private isOnDay(workshop: Workshop, day: number): boolean {
    const date = this.parseDate(workshop.date);

    return date.getDate() === day && this.isInCurrentMonth(workshop);
  }

  workshopsOnDate(day: number): Workshop[] {
    return this.workshops.filter(workshop =>
      this.isOnDay(workshop, day)
    );
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
      ...Array.from(
        { length: daysInMonth },
        (_, index) => index + 1
      )
    ];
  }

  previousMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }

    this.updateCalendar();
    this.selectFirstWorkshopInMonth();
  }

  nextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }

    this.updateCalendar();
    this.selectFirstWorkshopInMonth();
  }

  selectFirstWorkshopInMonth(): void {
    const workshop = this.workshops.find(item =>
      this.isInCurrentMonth(item)
    );

    if (workshop) {
      this.selectWorkshop(workshop);
    } else {
      this.selectedDay = null;
      this.selectedWorkshop = null;
      this.clearBookingFeedback();
    }
  }

  selectDate(day: number): void {
    this.selectedDay = day;

    const workshops = this.workshopsOnDate(day);
    this.selectedWorkshop = workshops[0] ?? null;

    this.clearBookingFeedback();
  }

  selectWorkshop(workshop: Workshop): void {
    const date = this.parseDate(workshop.date);

    this.selectedDay = date.getDate();
    this.selectedWorkshop = workshop;

    this.clearBookingFeedback();
  }

  hasWorkshopOnDate(day: number): boolean {
    return this.workshopsOnDate(day).length > 0;
  }

  isSelectedDate(day: number): boolean {
    return this.selectedDay === day;
  }

  isSelectedWorkshop(workshop: Workshop): boolean {
    return this.selectedWorkshop?.id === workshop.id;
  }

  hasBooking(workshop: Workshop): boolean {
    const status = this.bookingStatuses[workshop.id];

    // Rejected requests do not prevent a new booking request.
    return status === 'Pending' || status === 'Approved';
  }

  isWorkshopBookable(workshop: Workshop): boolean {
    const availableCapacity =
      workshop.availableCapacity ?? workshop.capacity;

    if (
      workshop.status === 2 ||
      workshop.status === 3 ||
      availableCapacity <= 0 ||
      this.hasBooking(workshop)
    ) {
      return false;
    }

    const date = this.parseDate(workshop.date);
    const [hours, minutes] = workshop.startTime.split(':').map(Number);

    date.setHours(hours || 0, minutes || 0, 0, 0);

    return date.getTime() > Date.now();
  }

  private loadMyBookings(): void {
    this.loadingBookings = true;

    this.workshopBookingService.getMyBookings().subscribe({
      next: (bookings: WorkshopBookingResponse[]) => {
        this.bookingStatuses = {};

        for (const booking of bookings) {
          // Assumes BookingApprovalStatus is Pending=0,
          // Approved=1, Rejected=2. Confirm these values
          // against your C# enum.
          if (booking.approvalStatus === 0) {
            this.bookingStatuses[booking.workshopId] = 'Pending';
          } else if (booking.approvalStatus === 1) {
            this.bookingStatuses[booking.workshopId] = 'Approved';
          } else if (booking.approvalStatus === 2) {
            this.bookingStatuses[booking.workshopId] = 'Rejected';
          }
        }

        this.loadingBookings = false;
        this.cdr.markForCheck();
      },

      error: (error) => {
        console.error('Could not load workshop bookings:', error);

        this.loadingBookings = false;
        this.cdr.markForCheck();
      }
    });
  }

  bookWorkshop(workshop: Workshop): void {
    this.clearBookingFeedback();

    if (
      this.bookingInProgress ||
      !this.isWorkshopBookable(workshop)
    ) {
      return;
    }

    this.bookingInProgress = true;

    this.workshopBookingService
      .bookWorkshop(workshop.id)
      .subscribe({
        next: (response) => {
          this.bookingStatuses[workshop.id] = 'Pending';

          if (workshop.availableCapacity !== undefined) {
            workshop.availableCapacity = Math.max(
              0,
              workshop.availableCapacity - 1
            );
          }

          this.bookingMessage =
            response.message ||
            'Your workshop booking request was submitted and is awaiting approval.';

          this.bookingInProgress = false;
          this.cdr.markForCheck();
        },

        error: (error) => {
          console.error(
            'Workshop booking failed:',
            error.status,
            error.error
          );

          this.bookingError =
            error.error?.message ||
            'We could not submit your workshop booking request. Please try again.';

          this.bookingInProgress = false;
          this.cdr.markForCheck();
        }
      });
  }

  private clearBookingFeedback(): void {
    this.bookingMessage = '';
    this.bookingError = '';
  }
}
