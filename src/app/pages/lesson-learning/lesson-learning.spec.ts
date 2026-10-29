import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LessonLearning } from './lesson-learning';

describe('LessonLearning', () => {
  let component: LessonLearning;
  let fixture: ComponentFixture<LessonLearning>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LessonLearning],
    }).compileComponents();

    fixture = TestBed.createComponent(LessonLearning);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
