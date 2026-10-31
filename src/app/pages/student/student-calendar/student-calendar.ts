
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
import { environment } from '../../../../environments/environment';
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
  private cdr = inject(ChangeDetectorRef);

  events: CalendarEvent[] = [];
  calendarDays: CalendarDay[] = [];

  currentMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  );
  get currentMonthLabel(): string {
  const locale = this.languageService.currentLanguage === 'ar'
    ? 'ar-EG'
    : 'en-US';

  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric'
  }).format(this.currentMonth);
}

  loading = true;
  errorMessage = '';

  // readonly weekdays = [
  //   'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun',
  // ];
  get weekdays(): string[] {
  const days = [
    'mon',
    'tue',
    'wed',
    'thu',
    'fri',
    'sat',
    'sun'
  ];

  return days.map(day => this.languageService.translate(day));
}
  constructor(
     public languageService: LanguageService,

  ) {}
  ngOnInit(): void {
    this.buildCalendar();
    this.loadCalendar();
  }

  loadCalendar(): void {
    this.loading = true;
    this.errorMessage = '';

    this.calendarService.getStudentCalendar().subscribe({
      next: (events) => {
        this.events = events ?? [];
        this.buildCalendar();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to load student calendar:', error);
        this.errorMessage =
          'Could not load your calendar. Please try again.';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  previousMonth(): void {
    this.currentMonth = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() - 1,
      1
    );
    this.buildCalendar();
  }

  nextMonth(): void {
    this.currentMonth = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() + 1,
      1
    );
    this.buildCalendar();
  }

  goToToday(): void {
    const today = new Date();
    this.currentMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );
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
          .filter((event) => {
            const start = new Date(event.startDateTime);
            return (
              !Number.isNaN(start.getTime()) &&
              this.dateKey(start) === key
            );
          })
          .sort(
            (a, b) =>
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

  get currentMonthEventCount(): number {
    return this.calendarDays
      .filter((day) => day.inCurrentMonth)
      .reduce((total, day) => total + day.events.length, 0);
  }

  trackDay(index: number, day: CalendarDay): string {
    const year = day.date.getFullYear();
    const month = String(day.date.getMonth() + 1).padStart(2, '0');
    const date = String(day.date.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  }

  trackEvent(index: number, event: CalendarEvent): string {
    return `${event.eventType}-${event.id}-${event.startDateTime}`;
  }
}
