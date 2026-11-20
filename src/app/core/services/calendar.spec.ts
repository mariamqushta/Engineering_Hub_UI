import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { beforeEach, describe, expect, it } from 'vitest';

// import '../../../../test-setup';
import {
  CalendarEvent,
  CalendarService,
  findScheduleConflict
} from './calendar';

describe('CalendarService', () => {
  let service: CalendarService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()]
    });
    service = TestBed.inject(CalendarService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

describe('findScheduleConflict', () => {
  const eventStart = new Date(2030, 0, 2, 10, 0);
  const eventEnd = new Date(2030, 0, 2, 11, 0);
  const eventDate = [
    eventStart.getFullYear(),
    String(eventStart.getMonth() + 1).padStart(2, '0'),
    String(eventStart.getDate()).padStart(2, '0')
  ].join('-');

  const event: CalendarEvent = {
    id: 1,
    title: 'Scheduled class',
    eventType: 'Interactive',
    trackId: 1,
    trackTitle: 'Track',
    startDateTime: eventStart.toISOString(),
    endDateTime: eventEnd.toISOString(),
    status: 'Scheduled'
  };

  it('detects an overlap on the same instructor calendar', () => {
    expect(findScheduleConflict([event], {
      startDate: eventDate,
      startTime: '10:30',
      endTime: '11:30'
    })).toBe(event);
  });

  it('allows adjacent sessions and ignores availability blocks', () => {
    const availability: CalendarEvent = {
      ...event,
      id: 2,
      eventType: 'PrivateAvailability'
    };

    expect(findScheduleConflict([event, availability], {
      startDate: eventDate,
      startTime: '11:00',
      endTime: '12:00'
    })).toBeUndefined();
  });
});
