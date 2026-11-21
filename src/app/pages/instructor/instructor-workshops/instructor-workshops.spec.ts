import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { of } from 'rxjs';

// import '../../../../test-setup';
import { InstructorWorkshops } from './instructor-workshops';
import { TrackService } from '../../../core/services/track.service';
import { CalendarService } from '../../../core/services/calendar';

describe('InstructorWorkshops', () => {
  let component: InstructorWorkshops;
  let fixture: ComponentFixture<InstructorWorkshops>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstructorWorkshops],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TrackService, useValue: { getMyTracks: () => of([]) } },
        { provide: CalendarService, useValue: { getInstructorCalendar: () => of([]) } }
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InstructorWorkshops);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
