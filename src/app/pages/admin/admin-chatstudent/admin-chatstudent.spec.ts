import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminChatStudent } from './admin-chatstudent';

describe('AdminChatStudent', () => {
  let component: AdminChatStudent;
  let fixture: ComponentFixture<AdminChatStudent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminChatStudent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminChatStudent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
