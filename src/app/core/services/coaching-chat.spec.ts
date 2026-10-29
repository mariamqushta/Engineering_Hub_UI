
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CoachingService } from './coaching-chat';

describe('CoachingService', () => {
  let service: CoachingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    service = TestBed.inject(CoachingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

