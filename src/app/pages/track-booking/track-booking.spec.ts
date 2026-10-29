import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackBooking } from './track-booking';

describe('TrackBooking', () => {
  let component: TrackBooking;
  let fixture: ComponentFixture<TrackBooking>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrackBooking],
    }).compileComponents();

    fixture = TestBed.createComponent(TrackBooking);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
