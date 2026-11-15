import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminChatinstructor } from './admin-chatinstructor';

describe('AdminChatinstructor', () => {
  let component: AdminChatinstructor;
  let fixture: ComponentFixture<AdminChatinstructor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminChatinstructor],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminChatinstructor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
