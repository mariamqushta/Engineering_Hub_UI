import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminBookingRequest } from './admin-booking-request';

describe('AdminBookingRequest', () => {
  let component: AdminBookingRequest;
  let fixture: ComponentFixture<AdminBookingRequest>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminBookingRequest],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminBookingRequest);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
