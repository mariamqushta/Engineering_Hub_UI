import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { of } from 'rxjs';

// import '../../../test-setup';
import { InstructorInteractive } from './instructor-interactive';
import { TrackService } from '../../../core/services/track.service';
import { CalendarService } from '../../../core/services/calendar';

describe('InstructorInteractive', () => {
  let component: InstructorInteractive;
  let fixture: ComponentFixture<InstructorInteractive>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstructorInteractive],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TrackService, useValue: { getMyTracks: () => of([]) } },
        { provide: CalendarService, useValue: { getInstructorCalendar: () => of([]) } }
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InstructorInteractive);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
