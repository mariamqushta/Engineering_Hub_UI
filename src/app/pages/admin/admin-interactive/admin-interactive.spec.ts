import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminInteractive } from './admin-interactive';

describe('AdminInteractive', () => {
  let component: AdminInteractive;
  let fixture: ComponentFixture<AdminInteractive>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminInteractive],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminInteractive);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
