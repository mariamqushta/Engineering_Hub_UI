import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LanguageService } from '../../../core/services/language.service';
import { environment } from '../../../../environments/environment';
interface AdminWorkshopStudent {
  userName: string;
  fullName?: string;
  email?: string;
  bookingStatus?: string | number;
}

interface AdminWorkshop {
  id: number;
  title: string;
  description?: string | null;
  trackTitle?: string;
  instructorUserName?: string | null;
  date: string;
  startTime: string;
  endTime: string;
  place: string;
  capacity: number;
  status: string | number;
  students: AdminWorkshopStudent[];
}

@Component({
  selector: 'app-admin-workshops',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-workshops.html'
})
export class AdminWorkshops implements OnInit {
  private readonly apiUrl = `${environment.apiUrl}/api/Admin/workshops`;
  private cdr = inject(ChangeDetectorRef);
  workshops: AdminWorkshop[] = [];
  searchTerm = '';
  expandedWorkshopId: number | null = null;
  isLoading = false;
  errorMessage = '';

  constructor(private http: HttpClient,
     public languageService: LanguageService,) {}

  ngOnInit(): void {
    this.loadWorkshops();
  }

  loadWorkshops(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.http.get<AdminWorkshop[] | { workshops: AdminWorkshop[] }>(
      this.apiUrl,
      { withCredentials: true }
    ).subscribe({
      next: response => {
        const items = Array.isArray(response)
          ? response
          : response?.workshops ?? [];

        this.workshops = items.map(item => ({
          ...item,
          students: item.students ?? []
        }));

        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: error => {
        console.error('Could not load workshops:', error);
        this.errorMessage =
          error.error?.message || 'Could not load workshops.';
        this.isLoading = false;
      }
    });
  }

  get filteredWorkshops(): AdminWorkshop[] {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) return this.workshops;

    return this.workshops.filter(workshop =>
      (workshop.title ?? '').toLowerCase().includes(term) ||
      (workshop.trackTitle ?? '').toLowerCase().includes(term) ||
      (workshop.instructorUserName ?? '').toLowerCase().includes(term) ||
      (workshop.place ?? '').toLowerCase().includes(term) ||
      workshop.students.some(student =>
        (student.userName ?? '').toLowerCase().includes(term) ||
        (student.fullName ?? '').toLowerCase().includes(term)
      )
    );
  }

  toggleStudents(workshopId: number): void {
    this.expandedWorkshopId =
      this.expandedWorkshopId === workshopId ? null : workshopId;
  }

  statusLabel(status: string | number): string {
    return String(status);
  }

  statusClass(status: string | number): string {
    const value = String(status).toLowerCase();

    if (['scheduled', '0'].includes(value))
      return 'bg-blue-100 text-blue-700';

    if (['active', '1'].includes(value))
      return 'bg-emerald-100 text-emerald-700';

    if (['finished', '2', 'completed'].includes(value))
      return 'bg-slate-200 text-slate-700';

    if (['cancelled', 'canceled', '3'].includes(value))
      return 'bg-red-100 text-red-700';

    return 'bg-amber-100 text-amber-700';
  }

  bookingStatusClass(status: string | number | undefined): string {
    const value = String(status ?? 'Unknown').toLowerCase();

    if (value === 'approved' || value === 'confirmed')
      return 'bg-emerald-100 text-emerald-700';

    if (value === 'pending')
      return 'bg-amber-100 text-amber-700';

    if (value === 'rejected' || value === 'cancelled')
      return 'bg-red-100 text-red-700';

    return 'bg-slate-100 text-slate-700';
  }
  get totalBookings(): number {
  return this.workshops.reduce(
    (total, workshop) => total + workshop.students.length,
    0
  );
}
}
