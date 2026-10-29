import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstructorChat } from './instructor-chat';

describe('InstructorChat', () => {
  let component: InstructorChat;
  let fixture: ComponentFixture<InstructorChat>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstructorChat],
    }).compileComponents();

    fixture = TestBed.createComponent(InstructorChat);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
