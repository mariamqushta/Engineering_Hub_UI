import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstructorAssignments } from './instructor-assignments';

describe('InstructorAssignments', () => {
  let component: InstructorAssignments;
  let fixture: ComponentFixture<InstructorAssignments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstructorAssignments],
    }).compileComponents();

    fixture = TestBed.createComponent(InstructorAssignments);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
