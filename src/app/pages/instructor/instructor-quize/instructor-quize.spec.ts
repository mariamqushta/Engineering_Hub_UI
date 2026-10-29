import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstructorQuize } from './instructor-quize';

describe('InstructorQuize', () => {
  let component: InstructorQuize;
  let fixture: ComponentFixture<InstructorQuize>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstructorQuize],
    }).compileComponents();

    fixture = TestBed.createComponent(InstructorQuize);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
