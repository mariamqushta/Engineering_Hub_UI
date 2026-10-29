import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InteractiveBooking } from './interactive-booking';

describe('InteractiveBooking', () => {
  let component: InteractiveBooking;
  let fixture: ComponentFixture<InteractiveBooking>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InteractiveBooking],
    }).compileComponents();

    fixture = TestBed.createComponent(InteractiveBooking);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
