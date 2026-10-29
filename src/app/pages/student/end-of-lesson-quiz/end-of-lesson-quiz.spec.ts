import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EndOfLessonQuiz } from './end-of-lesson-quiz';

describe('EndOfLessonQuiz', () => {
  let component: EndOfLessonQuiz;
  let fixture: ComponentFixture<EndOfLessonQuiz>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EndOfLessonQuiz],
    }).compileComponents();

    fixture = TestBed.createComponent(EndOfLessonQuiz);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
