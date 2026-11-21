import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';

import { TrackService } from '../../../core/services/track.service';
import { Track } from '../../../core/models/track';
import { Workshop } from '../../../core/models/workshop';
import { LanguageService } from '../../../core/services/language.service';
import { environment } from '../../../../environments/environment';
import {
  CalendarService,
  findScheduleConflict
} from '../../../core/services/calendar';
import type { ScheduleConflictQuery } from '../../../core/services/calendar';
import { Time12Pipe } from '../../../shared/pipes/time-12.pipe';

// Adds the Admin approval status without requiring changes to the shared Workshop model.
type InstructorWorkshop = Workshop & {
  approvalStatus?: number | string | null;
};

@Component({
  selector: 'app-instructor-workshops',
  standalone: true,
  imports: [CommonModule, FormsModule, Time12Pipe],
  templateUrl: './instructor-workshops.html',
  styleUrl: './instructor-workshops.css'
})
export class InstructorWorkshops implements OnInit {
  private readonly apiUrl = `${environment.apiUrl}/api`;

  tracks: Track[] = [];
  workshops: InstructorWorkshop[] = [];

  selectedTrackId: number | null = null;

  isLoadingTracks = false;
  isLoadingWorkshops = false;
  isSaving = false;
  isCancelling: number | null = null;

  showForm = false;
  errorMessage = '';
  successMessage = '';

  minDate = this.getLocalDate();

  form = {
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    place: '',
    capacity: 20,
    price: 0
  };

  constructor(
    private trackService: TrackService,
    private http: HttpClient,
    private calendarService: CalendarService,
    private cdr: ChangeDetectorRef,
    public languageService: LanguageService
  ) {}

  ngOnInit(): void {
    this.loadMyTracks();
  }

  loadMyTracks(): void {
    this.isLoadingTracks = true;
    this.errorMessage = '';

    this.trackService.getMyTracks()
      .pipe(finalize(() => {
        this.isLoadingTracks = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (response: any) => {
          const data = Array.isArray(response)
            ? response
            : response?.data ?? response?.tracks ?? [];

          this.tracks = data.map((item: any) => ({
            id: Number(item.id ?? item.Id ?? item.trackId ?? item.TrackId),
            title: item.title ?? item.Title ?? item.name ?? item.Name ?? '',
            description: item.description ?? item.Description ?? '',
            price: Number(item.price ?? item.Price ?? 0),
            isActive: item.isActive ?? item.IsActive ?? true
          })).filter((track: Track) => track.id > 0);

          if (this.tracks.length > 0) {
            this.selectedTrackId = this.tracks[0].id;
            this.loadWorkshops();
          }
        },
        error: (error) => {
          console.error('Error loading instructor tracks:', error);

          this.errorMessage =
            error.status === 401 || error.status === 403
              ? 'Your instructor session has expired or you do not have permission. Please log in again.'
              : 'Could not load your assigned tracks. Please try again.';

          this.cdr.detectChanges();
        }
      });
  }

  onTrackChange(value: string | number): void {
    const trackId = Number(value);

    this.selectedTrackId = Number.isFinite(trackId) && trackId > 0
      ? trackId
      : null;

    this.workshops = [];
    this.showForm = false;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.selectedTrackId !== null) {
      this.loadWorkshops();
    }
  }

  /**
   * Loads all workshops belonging to the logged-in instructor.
   *
   * This endpoint is important because the public track endpoint may
   * hide Pending and Rejected workshops from the instructor.
   *
   * We then filter the results by the currently selected track.
   */
  loadWorkshops(): void {
    if (this.selectedTrackId === null) {
      this.workshops = [];
      return;
    }

    this.isLoadingWorkshops = true;
    this.errorMessage = '';

    this.http.get<any[] | { data?: any[]; workshops?: any[] }>(
      `${this.apiUrl}/Workshop/Instructor`,
      { withCredentials: true }
    )
      .pipe(finalize(() => {
        this.isLoadingWorkshops = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (response: any) => {
          const data = Array.isArray(response)
            ? response
            : response?.data ?? response?.workshops ?? [];

          const instructorWorkshops: InstructorWorkshop[] = data.map((item: any) => ({
            id: Number(item.id ?? item.Id),
            trackId: Number(item.trackId ?? item.TrackId),
            title: item.title ?? item.Title ?? '',
            description: item.description ?? item.Description ?? '',
            date: item.date ?? item.Date ?? '',
            startTime: item.startTime ?? item.StartTime ?? '',
            endTime: item.endTime ?? item.EndTime ?? '',
            place: item.place ?? item.Place ?? '',
            capacity: Number(item.capacity ?? item.Capacity ?? 0),
            price: Number(item.price ?? item.Price ?? 0),
            status: Number(item.status ?? item.Status ?? 0),
            approvalStatus: this.normalizeApprovalStatus(
              item.approvalStatus ?? item.ApprovalStatus
            )
          }));

          this.workshops = instructorWorkshops.filter(
            workshop => workshop.trackId === this.selectedTrackId
          );

          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading instructor workshops:', error);

          this.errorMessage =
            error.status === 401 || error.status === 403
              ? 'You do not have permission to view your workshops. Please log in again.'
              : error.status === 404
                ? 'The instructor workshops endpoint was not found. Please check the backend route.'
                : 'Could not load your workshops for this track.';

          this.cdr.detectChanges();
        }
      });
  }

  openCreateForm(): void {
    if (this.selectedTrackId === null) {
      this.errorMessage = 'Please select a track first.';
      return;
    }

    this.resetForm();
    this.showForm = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  closeCreateForm(): void {
    this.showForm = false;
    this.resetForm();
  }

  createWorkshop(): void {
    if (this.selectedTrackId === null) {
      this.errorMessage = 'Please select a track first.';
      return;
    }

    if (
      !this.form.title.trim() ||
      !this.form.date ||
      !this.form.startTime ||
      !this.form.endTime ||
      !this.form.place.trim()
    ) {
      this.errorMessage = 'Please complete all required fields.';
      return;
    }

    if (this.form.endTime <= this.form.startTime) {
      this.errorMessage = 'End time must be later than start time.';
      return;
    }

    if (this.form.date < this.minDate) {
      this.errorMessage = 'Workshop date cannot be in the past.';
      return;
    }

    if (
      !Number.isInteger(this.form.capacity) ||
      this.form.capacity < 1 ||
      this.form.price < 0
    ) {
      this.errorMessage = 'Capacity must be at least 1 and price cannot be negative.';
      return;
    }

    const payload = {
      trackId: this.selectedTrackId,
      title: this.form.title.trim(),
      description: this.form.description.trim() || null,
      price: Number(this.form.price),
      place: this.form.place.trim(),
      date: this.form.date,
      startTime: this.form.startTime,
      endTime: this.form.endTime,
      capacity: Number(this.form.capacity)
    };

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.verifyScheduleAvailability({
      startDate: this.form.date,
      startTime: this.form.startTime,
      endTime: this.form.endTime
    }, () => {
      this.http.post<Workshop>(
        `${this.apiUrl}/Workshop`,
        payload,
        { withCredentials: true }
      )
        .pipe(finalize(() => {
          this.isSaving = false;
          this.cdr.detectChanges();
        }))
        .subscribe({
          next: () => {
            this.showForm = false;
            this.resetForm();

            this.successMessage =
              'Workshop created and submitted to the Admin for approval. You can follow its approval status below.';

            this.loadWorkshops();
          },
          error: error => {
            console.error('Error creating workshop:', error);

            this.errorMessage =
              error.error?.message ??
              (typeof error.error === 'string' ? error.error : null) ??
              (error.status === 409
                ? this.languageService.translate('scheduleOverlapError')
                : 'Could not create the workshop. Check your track assignment and the entered details.');

            this.cdr.detectChanges();
          }
        });
    });
  }

  private verifyScheduleAvailability(
    query: ScheduleConflictQuery,
    submit: () => void
  ): void {
    this.calendarService.getInstructorCalendar().subscribe({
      next: events => {
        const conflict = findScheduleConflict(events ?? [], query);

        if (conflict) {
          this.isSaving = false;
          this.errorMessage = this.languageService.translate('scheduleOverlapError');
          this.cdr.detectChanges();
          return;
        }

        submit();
      },
      error: error => {
        console.error('Could not verify instructor schedule:', error);
        this.isSaving = false;
        this.errorMessage = this.languageService.translate(
          'couldNotVerifyScheduleConflicts'
        );
        this.cdr.detectChanges();
      }
    });
  }

  cancelWorkshop(workshop: InstructorWorkshop): void {
    if (workshop.status === 3) {
      this.errorMessage = 'This workshop is already cancelled.';
      return;
    }

    if (workshop.status === 2) {
      this.errorMessage = 'A finished workshop cannot be cancelled.';
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to cancel "${workshop.title}"?`
    );

    if (!confirmed) {
      return;
    }

    this.isCancelling = workshop.id;
    this.errorMessage = '';
    this.successMessage = '';

    this.http.put(
      `${this.apiUrl}/Workshop/${workshop.id}/cancel`,
      {},
      { withCredentials: true }
    )
      .pipe(finalize(() => {
        this.isCancelling = null;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.successMessage = 'Workshop cancelled successfully.';
          this.loadWorkshops();
        },
        error: (error) => {
          console.error('Error cancelling workshop:', error);

          this.errorMessage =
            error.error?.message ??
            (typeof error.error === 'string' ? error.error : null) ??
            'Could not cancel this workshop.';

          this.cdr.detectChanges();
        }
      });
  }

  getStatusLabel(status: number): string {
    switch (status) {
      case 0: return 'Scheduled';
      case 1: return 'Active';
      case 2: return 'Finished';
      case 3: return 'Cancelled';
      default: return 'Unknown';
    }
  }

  /**
   * Converts the API approval status into a consistent value.
   * Supports both numeric enums and string values.
   */
  private normalizeApprovalStatus(
    value: number | string | null | undefined
  ): number | string | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (typeof value === 'number') {
      return value;
    }

    const numericValue = Number(value);

    if (!Number.isNaN(numericValue)) {
      return numericValue;
    }

    return value.trim();
  }

  getApprovalStatusLabel(status: number | string | null | undefined): string {
    if (status === null || status === undefined) {
      return 'Approval status unavailable';
    }

    const normalized = String(status).toLowerCase();

    switch (normalized) {
      case '0':
      case 'pending':
        return 'Pending Admin Approval';

      case '1':
      case 'approved':
        return 'Approved by Admin';

      case '2':
      case 'rejected':
        return 'Rejected by Admin';

      default:
        return 'Unknown Approval Status';
    }
  }

  getApprovalStatusClass(status: number | string | null | undefined): string {
    if (status === null || status === undefined) {
      return 'bg-gray-100 text-gray-600';
    }

    const normalized = String(status).toLowerCase();

    switch (normalized) {
      case '0':
      case 'pending':
        return 'bg-amber-50 text-amber-700';

      case '1':
      case 'approved':
        return 'bg-green-50 text-green-700';

      case '2':
      case 'rejected':
        return 'bg-red-50 text-red-700';

      default:
        return 'bg-gray-100 text-gray-600';
    }
  }

  get selectedTrack(): Track | undefined {
    return this.tracks.find(track => track.id === this.selectedTrackId);
  }

  private resetForm(): void {
    this.form = {
      title: '',
      description: '',
      date: '',
      startTime: '',
      endTime: '',
      place: '',
      capacity: 20,
      price: 0
    };
  }

  private getLocalDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}