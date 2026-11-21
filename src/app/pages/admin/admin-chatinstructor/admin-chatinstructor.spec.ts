import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminChatInstructor } from './admin-chatinstructor';

describe('AdminChatInstructor', () => {
  let component: AdminChatInstructor;
  let fixture: ComponentFixture<AdminChatInstructor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminChatInstructor],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminChatInstructor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
