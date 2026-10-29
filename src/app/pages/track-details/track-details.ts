import { ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { TrackService } from '../../core/services/track.service';
import { Lesson } from '../../core/models/lesson';
import { WorkshopBooking } from '../workshop-booking/workshop-booking';
import { InteractiveBooking } from '../interactive-booking/interactive-booking';
import { QuizService } from '../../core/services/quiz';
import { CertificateService } from '../../core/services/certificate';
import { AuthService } from '../../core/services/auth';
import { LanguageService } from '../../core/services/language.service';
import { environment } from '../../../environments/environment';
@Component({
  selector: 'app-track-details',
  standalone:true,
  imports: [RouterOutlet, WorkshopBooking, InteractiveBooking],
  templateUrl: './track-details.html',
  styleUrl: './track-details.css',
})
export class TrackDetails {
  hasCoachingAccess = false;
  isCheckingBooking = true;
  trackId: string | null = null;
  selectedTab: string = 'lessons';
  isTrackCompleted = false;
  lessons: Lesson[] = [];

  interactiveActivities: any[] = [];
  workshops: any[] = [];

  constructor(
  private route: ActivatedRoute,
  private router: Router,
  private trackService: TrackService,
  private authService: AuthService,
  private quizService: QuizService,
  private certificateService:CertificateService,
  private cdr: ChangeDetectorRef,
  private RouterOutlet: RouterOutlet
  ,
     public languageService: LanguageService,
) {}

  ngOnInit(): void {

    this.trackId = this.route.snapshot.paramMap.get('id');

    if (this.trackId) {

      const id = Number(this.trackId);

this.loadLessons(id);
this.loadInteractiveActivities(id);
this.loadWorkshops(id);
this.loadTrackCompletionStatus(id);
this.loadCoachingAccess();
    }
  }

loadLessons(trackId: number): void {
  this.trackService.getLessonsByTrack(trackId).subscribe({
    next: (data) => {
      this.lessons = data;
      console.log('Lessons:', data);
      this.cdr.detectChanges();
    },
    error: (error) => {
      console.error('Error loading lessons:', error);
    }
  });
}



loadCoachingAccess(): void {
  this.trackService.getMyBookings().subscribe({
    next: (bookings) => {
      this.hasCoachingAccess = bookings.some((booking: any) =>
        Number(booking.trackId) === Number(this.trackId) &&
        Number(booking.bookingType) === 3 &&
        (booking.status === undefined ||
          booking.status === 'Approved' ||
          booking.status === 'Active' ||
          booking.status === 1)
      );

      this.isCheckingBooking = false;
      this.cdr.detectChanges();
    },
    error: (error) => {
      console.error('Could not check coaching booking:', error);
      this.hasCoachingAccess = false;
      this.isCheckingBooking = false;
      this.cdr.detectChanges();
    }
  });
}



  loadMyBookings(): void {
  this.trackService.getMyBookings().subscribe({
    next: (bookings) => {
      console.log('My bookings:', bookings);
    },
    error: (error) => {
      console.error('Error loading my bookings:', error);
    }
  });
}

  loadInteractiveActivities(trackId: number): void {

    this.trackService.getInteractiveActivitiesByTrack(trackId).subscribe({

      next: (data) => {
        this.interactiveActivities = data;
        console.log('Interactive Activities:', data);
        this.cdr.detectChanges();
      },

      error: (error) => {
        console.error('Error loading interactive activities:', error);
      }

    });
  }

  loadWorkshops(trackId: number): void {

    this.trackService.getWorkshopsByTrack(trackId).subscribe({

      next: (data) => {
        this.workshops = data;
        console.log('Workshops:', data);
        this.cdr.detectChanges();
      },

      error: (error) => {
        console.error('Error loading workshops:', error);
      }

    });
  }
openLesson(lessonId: number): void {
  this.router.navigate(['/learn/lesson', lessonId]);
}



openCoachingChat(): void {
  if (!this.trackId || this.isCheckingBooking) {
    return;
  }

  // Verify authentication before opening chat or booking.
  this.authService.getCurrentUser().subscribe({
    next: () => {
      if (this.hasCoachingAccess) {
        this.router.navigate(['/coaching', this.trackId]);
      } else {
        this.router.navigate(['/booking/track', this.trackId]);
      }
    },
    error: () => {
      this.router.navigate(['/login']);
    }
  });
}


openPrerequisiteQuiz(lessonId: number): void {
  this.quizService.getStudentLessonQuizzes(lessonId).subscribe({
    next: (quizzes) => {
      const prerequisiteQuiz = quizzes.find(
        quiz =>
          quiz.type === 1 ||
          quiz.type === '1' ||
          quiz.type === 'Prerequisite'
      );

      if (!prerequisiteQuiz) {
        alert('No prerequisite quiz is available for this lesson yet.');
        return;
      }

            this.router.navigate([
          '/learn/lesson',
          lessonId,
          'prerequisite',
          prerequisiteQuiz.id
        ]);
    },
    error: (error) => {
      console.error('Error loading prerequisite quiz:', error);
      alert('Could not load the prerequisite quiz. Please try again.');
    }
  });
}
openCertificate(): void {
  if (!this.trackId) {
    console.error('Track ID is missing.');
    return;
  }

  this.router.navigate([
    '/track',
    this.trackId,
    'certificate'
  ]);
}
loadTrackCompletionStatus(trackId: number): void {
  this.certificateService.isTrackCompleted(trackId).subscribe({
    next: (result) => {
      this.isTrackCompleted = result.isCompleted;
      this.cdr.detectChanges();
    },
    error: (error) => {
      console.error('Error loading track completion status:', error);
      this.isTrackCompleted = false;
      this.cdr.detectChanges();
    }
  });
}
}
