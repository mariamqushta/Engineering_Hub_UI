import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrerequisiteQuiz } from './prerequisite-quiz';

describe('PrerequisiteQuiz', () => {
  let component: PrerequisiteQuiz;
  let fixture: ComponentFixture<PrerequisiteQuiz>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrerequisiteQuiz],
    }).compileComponents();

    fixture = TestBed.createComponent(PrerequisiteQuiz);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
