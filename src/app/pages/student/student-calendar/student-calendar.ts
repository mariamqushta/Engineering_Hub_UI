import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CalendarService,
  CalendarEvent,
} from '../../../core/services/calendar';
import { LanguageService } from '../../../core/services/language.service';
import { AuthService } from '../../../core/services/auth';

interface CalendarDay {
  date: Date;
  inCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

@Component({
  selector: 'app-student-calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-calendar.html',
})
export class StudentCalendar implements OnInit {
  private calendarService = inject(CalendarService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  events: CalendarEvent[] = [];
  calendarDays: CalendarDay[] = [];

  // 0 = GroupStudent, 1 = PrivateStudent
  accountType: number | null = null;

  currentMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  );

  selectedDay: Date | null = new Date();

  loading = true;
  errorMessage = '';

  constructor(public languageService: LanguageService) {}

  ngOnInit(): void {
    this.loadCurrentStudent();
  }

  get isGroupStudent(): boolean {
    return this.accountType === 0;
  }

  get isPrivateStudent(): boolean {
    return this.accountType === 1;
  }

  private loadCurrentStudent(): void {
    this.loading = true;
    this.errorMessage = '';

    this.authService.getCurrentUser().subscribe({
      next: user => {
        const rawAccountType =
          user?.accountType ?? user?.AccountType;

        if (
          rawAccountType === 0 ||
          rawAccountType === '0' ||
          rawAccountType === 'GroupStudent'
        ) {
          this.accountType = 0;
        } else if (
          rawAccountType === 1 ||
          rawAccountType === '1' ||
          rawAccountType === 'PrivateStudent'
        ) {
          this.accountType = 1;
        } else {
          console.error(
            'AccountType is missing or invalid in current user response:',
            user
          );

          this.errorMessage =
            this.languageService.translate('couldNotDetermineAccountType');

          this.loading = false;
          this.cdr.markForCheck();
          return;
        }

        this.loadCalendar();
      },

      error: error => {
        console.error('Failed to load current student:', error);

        this.errorMessage =
          this.languageService.translate('couldNotLoadAccountInformation');

        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  loadCalendar(): void {
    this.loading = true;
    this.errorMessage = '';

    this.calendarService.getStudentCalendar().subscribe({
      next: events => {
        const allEvents = events ?? [];

        if (this.isGroupStudent) {
          this.events = allEvents.filter(
            event => event.eventType !== 'PrivateSession'
          );
        } else if (this.isPrivateStudent) {
          this.events = allEvents.filter(
            event => event.eventType !== 'Interactive'
          );
        } else {
          this.events = [];
        }

        this.buildCalendar();
        this.loading = false;
        this.cdr.markForCheck();
      },

      error: error => {
        console.error('Failed to load student calendar:', error);

        this.errorMessage =
          this.languageService.translate('couldNotLoadAccountInformation');

        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  get currentMonthLabel(): string {
    const locale = this.languageService.currentLanguage === 'ar'
      ? 'ar-EG'
      : 'en-US';

    return new Intl.DateTimeFormat(locale, {
      month: 'long',
      year: 'numeric',
    }).format(this.currentMonth);
  }

  get weekdays(): string[] {
    return ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
      .map(day => this.languageService.translate(day));
  }

  get selectedDayKey(): string {
    return this.selectedDay ? this.dateKey(this.selectedDay) : '';
  }

  get selectedDayEvents(): CalendarEvent[] {
    if (!this.selectedDay) return [];

    const key = this.dateKey(this.selectedDay);

    return this.events
      .filter(event => {
        const start = new Date(event.startDateTime);
        return !Number.isNaN(start.getTime()) &&
          this.dateKey(start) === key;
      })
      .sort((a, b) =>
        new Date(a.startDateTime).getTime() -
        new Date(b.startDateTime).getTime()
      );
  }

  openDay(day: CalendarDay): void {
    this.selectedDay = new Date(day.date);
  }

  clearSelectedDay(): void {
    this.selectedDay = null;
  }

  isCancelled(event: CalendarEvent): boolean {
    const status = String(event.status).toLowerCase();
    const title = (event.title ?? '').toLowerCase();

    return status === 'cancelled' ||
      status === '3' ||
      title.includes('cancelled');
  }

  canJoinMeeting(event: CalendarEvent): boolean {
    if (this.isCancelled(event)) return false;

    if (this.isGroupStudent && event.eventType !== 'Interactive') {
      return false;
    }

    if (this.isPrivateStudent && event.eventType !== 'PrivateSession') {
      return false;
    }

    const meetingUrl = event.meetingUrl?.trim();

    if (!meetingUrl) return false;

    try {
      const url = new URL(meetingUrl);
      return url.protocol === 'https:' || url.protocol === 'http:';
    } catch {
      return false;
    }
  }

  goToToday(): void {
    const today = new Date();

    this.currentMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );

    this.selectedDay = today;
    this.buildCalendar();
  }

  previousMonth(): void {
    this.currentMonth = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() - 1,
      1
    );

    this.selectedDay = null;
    this.buildCalendar();
  }

  nextMonth(): void {
    this.currentMonth = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() + 1,
      1
    );

    this.selectedDay = null;
    this.buildCalendar();
  }

  private buildCalendar(): void {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const mondayOffset = (firstDay.getDay() + 6) % 7;

    const gridStart = new Date(year, month, 1 - mondayOffset);
    const todayKey = this.dateKey(new Date());

    this.calendarDays = Array.from(
      { length: 42 },
      (_, index): CalendarDay => {
        const date = new Date(gridStart);
        date.setDate(gridStart.getDate() + index);

        const key = this.dateKey(date);

        const dayEvents = this.events
          .filter(event => {
            const start = new Date(event.startDateTime);
            return !Number.isNaN(start.getTime()) &&
              this.dateKey(start) === key;
          })
          .sort((a, b) =>
            new Date(a.startDateTime).getTime() -
            new Date(b.startDateTime).getTime()
          );

        return {
          date,
          inCurrentMonth: date.getMonth() === month,
          isToday: key === todayKey,
          events: dayEvents,
        };
      }
    );
  }

  dateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  get currentMonthEventCount(): number {
    return this.calendarDays
      .filter(day => day.inCurrentMonth)
      .reduce((total, day) => total + day.events.length, 0);
  }

  trackDay(index: number, day: CalendarDay): string {
    return this.dateKey(day.date);
  }

  trackEvent(index: number, event: CalendarEvent): string {
    return `${event.eventType}-${event.id}-${event.startDateTime}`;
  }
}