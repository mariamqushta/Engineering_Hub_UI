import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentCalendar } from './student-calendar';

describe('StudentCalendar', () => {
  let component: StudentCalendar;
  let fixture: ComponentFixture<StudentCalendar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentCalendar],
    }).compileComponents();

    fixture = TestBed.createComponent(StudentCalendar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
