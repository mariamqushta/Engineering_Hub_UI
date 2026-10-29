import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstructorTrackLessons } from './instructor-track-lessons';

describe('InstructorTrackLessons', () => {
  let component: InstructorTrackLessons;
  let fixture: ComponentFixture<InstructorTrackLessons>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstructorTrackLessons],
    }).compileComponents();

    fixture = TestBed.createComponent(InstructorTrackLessons);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
