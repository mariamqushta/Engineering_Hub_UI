import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstructorCalendar } from './instructor-calendar';

describe('InstructorCalendar', () => {
  let component: InstructorCalendar;
  let fixture: ComponentFixture<InstructorCalendar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstructorCalendar],
    }).compileComponents();

    fixture = TestBed.createComponent(InstructorCalendar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
