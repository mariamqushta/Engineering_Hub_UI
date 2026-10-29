import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoachingChat } from './coaching-chat';

describe('CoachingChat', () => {
  let component: CoachingChat;
  let fixture: ComponentFixture<CoachingChat>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoachingChat],
    }).compileComponents();

    fixture = TestBed.createComponent(CoachingChat);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
