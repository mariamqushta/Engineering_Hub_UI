
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LanguageService } from '../../../core/services/language.service';
import { environment } from '../../../../environments/environment';
interface TrackBooking {
  id: number;
  trackId: number;
  trackTitle: string;
  enrolledAt: string;
  status: string | number;
  completedAt: string | null;
  approvedPrice: number;
  bookingType: string | number;
  approvalStatus: string | number;
}

interface WorkshopBooking {
  id: number;
  workshopId: number;
  workshopTitle: string;
  trackTitle: string;
  bookedAt: string;
  status: string | number;
  source: string | number;
  approvalStatus: string | number;
  date: string;
  startTime: string;
  endTime: string;
  place: string;
}

interface InteractiveBooking {
  id: number;
  interactiveActivityId: number;
  activityTitle: string;
  trackTitle: string;
  bookedAt: string;
  status: string | number;
  source: string | number;
  approvalStatus: string | number;
  date: string;
  startTime: string;
  endTime: string;
}

interface Student {
  id: string;
  userName: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  emailConfirmed: boolean;
  phoneNumberConfirmed: boolean;
  profileImageUrl: string | null;
  bio: string | null;
  isActive: boolean;
  createdAt: string;
  trackBookings: TrackBooking[];
  workshopBookings: WorkshopBooking[];
  interactiveBookings: InteractiveBooking[];
  totalTrackBookings: number;
  totalWorkshopBookings: number;
  totalInteractiveBookings: number;
}

interface StudentsResponse {
  totalCount: number;
  students: Student[];
}

@Component({
  selector: 'app-admin-students',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-students.html'
})
export class AdminStudents implements OnInit {
  private readonly apiUrl = `${environment.apiUrl}/api/Admin/students`;
   private cdr = inject(ChangeDetectorRef);
  students: Student[] = [];
  isLoading = true;
  errorMessage = '';
  searchTerm = '';
  expandedStudentId: string | null = null;

  constructor(private http: HttpClient,
     public languageService: LanguageService,) {}

  ngOnInit(): void {
    this.loadStudents();
  }

  loadStudents(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.http.get<StudentsResponse>(this.apiUrl, {
      withCredentials: true
    }).subscribe({
      next: response => {
        this.students = (response.students ?? []).map(student => {
          const trackBookings = student.trackBookings ?? [];
          const workshopBookings = student.workshopBookings ?? [];
          const interactiveBookings = Array.from(
          new Map(
            (student.interactiveBookings ?? []).map(booking => {
              const key = [
                booking.activityTitle?.trim().toLowerCase(),
                booking.trackTitle?.trim().toLowerCase()
              ].join('|');

              return [key, booking];
            })
          ).values()
        );

          return {
            ...student,
            trackBookings,
            workshopBookings,
            interactiveBookings,

            totalTrackBookings: student.totalTrackBookings ?? 0,
            totalWorkshopBookings: student.totalWorkshopBookings ?? 0,

            // Count unique interactive activities, not recurring occurrences.
            totalInteractiveBookings: interactiveBookings.length
          };
        });

        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: error => {
        console.error('Could not load students:', error);
        this.errorMessage =
          error.error?.message || 'Could not load students.';
        this.isLoading = false;
      }
    });
  }

  get filteredStudents(): Student[] {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      return this.students;
    }

    return this.students.filter(student =>
      (student.fullName ?? '').toLowerCase().includes(term) ||
      (student.userName ?? '').toLowerCase().includes(term) ||
      (student.email ?? '').toLowerCase().includes(term)
    );
  }

  toggleDetails(studentId: string): void {
    this.expandedStudentId =
      this.expandedStudentId === studentId ? null : studentId;
  }

  getBookingCount(student: Student): number {
    return student.totalTrackBookings +
      student.totalWorkshopBookings +
      student.totalInteractiveBookings;
  }

  getBookingStatusClass(status: string | number): string {
    const value = String(status).toLowerCase();

    if (value === 'approved' || value === 'confirmed' || value === 'completed') {
      return 'bg-emerald-100 text-emerald-700';
    }

    if (value === 'pending' || value === '0') {
      return 'bg-amber-100 text-amber-700';
    }

    if (value === 'rejected' || value === 'cancelled' || value === 'canceled') {
      return 'bg-red-100 text-red-700';
    }

    return 'bg-slate-100 text-slate-700';
  }
}
