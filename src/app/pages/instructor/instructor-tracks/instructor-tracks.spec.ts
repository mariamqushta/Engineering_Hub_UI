import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstructorTracks } from './instructor-tracks';

describe('InstructorTracks', () => {
  let component: InstructorTracks;
  let fixture: ComponentFixture<InstructorTracks>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstructorTracks],
    }).compileComponents();

    fixture = TestBed.createComponent(InstructorTracks);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
