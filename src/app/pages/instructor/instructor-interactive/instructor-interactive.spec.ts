import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstructorInteractive } from './instructor-interactive';

describe('InstructorInteractive', () => {
  let component: InstructorInteractive;
  let fixture: ComponentFixture<InstructorInteractive>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstructorInteractive],
    }).compileComponents();

    fixture = TestBed.createComponent(InstructorInteractive);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
