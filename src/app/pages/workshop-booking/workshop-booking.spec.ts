import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkshopBooking } from './workshop-booking';

describe('WorkshopBooking', () => {
  let component: WorkshopBooking;
  let fixture: ComponentFixture<WorkshopBooking>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkshopBooking],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkshopBooking);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
