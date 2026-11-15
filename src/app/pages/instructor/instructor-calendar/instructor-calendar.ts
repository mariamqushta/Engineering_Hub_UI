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

interface CalendarDay {
  date: Date;
  inCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

@Component({
  selector: 'app-instructor-calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './instructor-calendar.html',
})
export class InstructorCalendar implements OnInit {
  private calendarService = inject(CalendarService);
  private cdr = inject(ChangeDetectorRef);

  events: CalendarEvent[] = [];
  calendarDays: CalendarDay[] = [];

  currentMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  );

  loading = true;
  errorMessage = '';
  selectedDay: Date | null = new Date();

  constructor(public languageService: LanguageService) {}

  get weekdays(): string[] {
    return ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
      .map(day => this.languageService.translate(day));
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

  get currentMonthEventCount(): number {
    return this.calendarDays
      .filter(day => day.inCurrentMonth)
      .reduce((total, day) => total + day.events.length, 0);
  }

  ngOnInit(): void {
    this.buildCalendar();
    this.loadCalendar();
  }

  loadCalendar(): void {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.calendarService.getInstructorCalendar().subscribe({
      next: events => {
        this.events = events ?? [];
        this.buildCalendar();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: error => {
        console.error('Failed to load calendar:', error);
        this.errorMessage =
          this.languageService.translate('couldNotLoadYourCalendar');
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  isCancelled(event: CalendarEvent): boolean {
    const status = String(event.status).toLowerCase();
    const title = (event.title ?? '').toLowerCase();

    return status === 'cancelled' ||
      status === '3' ||
      title.includes('cancelled');
  }

  getEventTypeTranslationKey(event: CalendarEvent): string {
    if (this.isCancelled(event)) return 'cancelledSession';

    switch (event.eventType) {
      case 'Workshop':
        return 'workshops';
      case 'Interactive':
        return 'interactiveActivities';
      case 'PrivateAvailability':
        return 'privateAvailability';
      case 'PrivateSession':
        return 'privateSession';
      default:
        return 'unknown';
    }
  }

  canJoinMeeting(event: CalendarEvent): boolean {
    if (this.isCancelled(event)) return false;

    if (
      event.eventType !== 'Interactive' &&
      event.eventType !== 'PrivateSession'
    ) {
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

  openDay(day: CalendarDay): void {
    this.selectedDay = new Date(day.date);
  }

  clearSelectedDay(): void {
    this.selectedDay = null;
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

  private dateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  trackDay(index: number, day: CalendarDay): string {
    return this.dateKey(day.date);
  }

  trackEvent(index: number, event: CalendarEvent): string {
    return `${event.eventType}-${event.id}-${event.startDateTime}`;
  }
}