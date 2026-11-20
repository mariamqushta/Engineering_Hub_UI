
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LanguageService } from '../../../core/services/language.service';
import { environment } from '../../../../environments/environment';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';

interface Track {
  id: number;
  title: string;
  description?: string | null;
  isActive?: boolean;
}

interface Instructor {
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
  tracks: Track[];
  selectedTrackId: number | null;
}

interface InstructorsResponse {
  totalCount: number;
  instructors: Instructor[];
}

interface PrivateAvailability {
  id: number;
  instructorId: string;
  instructorName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  validFrom: string;
  validTo: string | null;
  isActive: boolean;
}

interface AvailabilityForm {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  validFrom: string;
  validTo: string;
}

@Component({
  selector: 'app-admin-instructors',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-instructors.html'
})
export class AdminInstructors implements OnInit {
  private readonly adminApi = `${environment.apiUrl}/api/Admin`;
  private readonly trackApi = `${environment.apiUrl}/api/Track`;

  private cdr = inject(ChangeDetectorRef);

  instructors: Instructor[] = [];
  tracks: Track[] = [];

  availabilityByInstructor: Record<string, PrivateAvailability[]> = {};
  availabilityForms: Record<string, AvailabilityForm> = {};

  private loadedAvailability = new Set<string>();

  expandedAvailabilityInstructorId: string | null = null;
  loadingAvailabilityInstructorId: string | null = null;
  savingAvailabilityInstructorId: string | null = null;

  get dayNames(): string[] {
    return [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday'
    ].map(day => this.languageService.translate(day));
  }

  isLoading = true;
  isSaving = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private http: HttpClient,
    public languageService: LanguageService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    let tracksLoaded = false;
    let instructorsLoaded = false;

    const finishLoading = (): void => {
      if (tracksLoaded && instructorsLoaded) {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    };

    this.http.get<any>(this.trackApi, {
      withCredentials: true
    }).subscribe({
      next: response => {
        const items = Array.isArray(response)
          ? response
          : response?.tracks ?? [];

        this.tracks = items.map((track: any) => ({
          id: track.id ?? track.Id,
          title: track.title ?? track.Title,
          description: track.description ?? track.Description ?? null,
          isActive: track.isActive ?? track.IsActive
        }));

        tracksLoaded = true;
        finishLoading();
      },
      error: error => {
        console.error('Could not load tracks:', error);
        this.errorMessage = this.languageService.translate('couldNotLoadTracks');
        tracksLoaded = true;
        finishLoading();
      }
    });

    this.http.get<InstructorsResponse>(
      `${this.adminApi}/instructors`,
      { withCredentials: true }
    ).subscribe({
      next: response => {
        this.instructors = (response.instructors ?? []).map(
          instructor => ({
            ...instructor,
            tracks: instructor.tracks ?? [],
            selectedTrackId: null
          })
        );

        for (const instructor of this.instructors) {
          this.availabilityForms[instructor.id] =
            this.createEmptyAvailabilityForm();
        }

        instructorsLoaded = true;
        finishLoading();
      },
      error: error => {
        console.error('Could not load instructors:', error);
        this.errorMessage = this.languageService.translate('couldNotLoadInstructors');
        instructorsLoaded = true;
        finishLoading();
      }
    });
  }

  getAvailableTracks(instructor: Instructor): Track[] {
    const assignedIds = new Set(
      instructor.tracks.map(track => track.id)
    );

    return this.tracks.filter(track => !assignedIds.has(track.id));
  }

  assignInstructor(instructor: Instructor): void {
    const trackId = instructor.selectedTrackId;

    if (trackId === null) {
      this.errorMessage = this.languageService.translate('chooseTrackForInstructor');
      return;
    }

    const track = this.tracks.find(item => item.id === trackId);

    if (!track) {
      this.errorMessage = this.languageService.translate('selectedTrackNotFound');
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const url =
      `${this.trackApi}/${trackId}/instructors/` +
      encodeURIComponent(instructor.userName);

    this.http.post(url, {}, {
      withCredentials: true,
      responseType: 'text'
    }).subscribe({
      next: message => {
        this.successMessage =
          message || this.languageService.translate('instructorAssignedSuccessfully');

        instructor.tracks = [...instructor.tracks, track];
        instructor.selectedTrackId = null;
        this.isSaving = false;
        this.cdr.markForCheck();
      },
      error: error => {
        console.error('Could not assign instructor:', error);
        this.errorMessage =
          error.error?.message ||
          (typeof error.error === 'string' ? error.error : null) ||
          this.languageService.translate('couldNotAssignInstructor');

        this.isSaving = false;
        this.cdr.markForCheck();
      }
    });
  }

  removeInstructor(instructor: Instructor, track: Track): void {
    if (!confirm(
      this.languageService.translate('confirmRemoveInstructorFromTrack')
    )) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const url =
      `${this.trackApi}/${track.id}/instructors/` +
      encodeURIComponent(instructor.userName);

    this.http.delete(url, {
      withCredentials: true,
      responseType: 'text'
    }).subscribe({
      next: message => {
        this.successMessage =
          message || this.languageService.translate('instructorRemovedSuccessfully');

        instructor.tracks = instructor.tracks.filter(
          item => item.id !== track.id
        );

        this.isSaving = false;
        this.cdr.markForCheck();
      },
      error: error => {
        console.error('Could not remove instructor:', error);
        this.errorMessage =
          error.error?.message ||
          (typeof error.error === 'string' ? error.error : null) ||
          this.languageService.translate('couldNotRemoveInstructor');

        this.isSaving = false;
        this.cdr.markForCheck();
      }
    });
  }

  private createEmptyAvailabilityForm(): AvailabilityForm {
    return {
      dayOfWeek: 0,
      startTime: '10:00',
      endTime: '15:00',
      validFrom: new Date().toISOString().split('T')[0],
      validTo: ''
    };
  }

  toggleAvailability(instructor: Instructor): void {
    if (this.expandedAvailabilityInstructorId === instructor.id) {
      this.expandedAvailabilityInstructorId = null;
      return;
    }

    this.expandedAvailabilityInstructorId = instructor.id;

    if (!this.loadedAvailability.has(instructor.id)) {
      this.loadAvailability(instructor);
    }
  }

  loadAvailability(instructor: Instructor): void {
    this.loadingAvailabilityInstructorId = instructor.id;
    this.errorMessage = '';

    this.http.get<PrivateAvailability[]>(
      `${this.adminApi}/private/availability/${encodeURIComponent(instructor.id)}`,
      { withCredentials: true }
    ).subscribe({
      next: response => {
        this.availabilityByInstructor[instructor.id] =
          (response ?? []).map((item: any) => ({
            id: item.id ?? item.Id,
            instructorId: item.instructorId ?? item.InstructorId,
            instructorName: item.instructorName ?? item.InstructorName,
            dayOfWeek: item.dayOfWeek ?? item.DayOfWeek,
            startTime: item.startTime ?? item.StartTime,
            endTime: item.endTime ?? item.EndTime,
            validFrom: item.validFrom ?? item.ValidFrom,
            validTo: item.validTo ?? item.ValidTo ?? null,
            isActive: item.isActive ?? item.IsActive
          }));

        this.loadedAvailability.add(instructor.id);
        this.loadingAvailabilityInstructorId = null;
        this.cdr.markForCheck();
      },
      error: error => {
        console.error('Could not load instructor availability:', error);
        this.errorMessage = this.languageService.translate('couldNotLoadInstructorAvailability');
        this.loadingAvailabilityInstructorId = null;
        this.cdr.markForCheck();
      }
    });
  }

  createAvailability(instructor: Instructor): void {
    const form = this.availabilityForms[instructor.id];

    if (!form) {
      return;
    }

    if (!form.startTime || !form.endTime || !form.validFrom) {
      this.errorMessage = this.languageService.translate('completeRequiredAvailabilityFields');
      return;
    }

    if (form.startTime >= form.endTime) {
      this.errorMessage = this.languageService.translate('endTimeMustBeLater');
      return;
    }

    if (form.validTo && form.validTo < form.validFrom) {
      this.errorMessage = this.languageService.translate('validToCannotBeEarlier');
      return;
    }

    this.savingAvailabilityInstructorId = instructor.id;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = {
      instructorId: instructor.id,
      dayOfWeek: Number(form.dayOfWeek),
      startTime: `${form.startTime}:00`,
      endTime: `${form.endTime}:00`,
      validFrom: `${form.validFrom}T00:00:00`,
      validTo: form.validTo
        ? `${form.validTo}T23:59:59`
        : null
    };

    this.http.post(
      `${this.adminApi}/private/availability`,
      payload,
      {
        withCredentials: true,
        responseType: 'text'
      }
    ).subscribe({
      next: message => {
        this.successMessage =
          message || this.languageService.translate('availabilityAddedSuccessfully');

        this.savingAvailabilityInstructorId = null;

        this.loadedAvailability.delete(instructor.id);
        this.loadAvailability(instructor);

        this.availabilityForms[instructor.id] =
          this.createEmptyAvailabilityForm();

        this.cdr.markForCheck();
      },
      error: error => {
        console.error('Could not create availability:', error);
        this.errorMessage =
          error.error?.message ||
          (typeof error.error === 'string' ? error.error : null) ||
          this.languageService.translate('couldNotAddInstructorAvailability');

        this.savingAvailabilityInstructorId = null;
        this.cdr.markForCheck();
      }
    });
  }

  deactivateAvailability(
    instructor: Instructor,
    availability: PrivateAvailability
  ): void {
    if (!confirm(
      this.languageService.translate('confirmDeactivateAvailability')
    )) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.savingAvailabilityInstructorId = instructor.id;

    this.http.delete(
      `${this.adminApi}/private/availability/${availability.id}`,
      {
        withCredentials: true,
        responseType: 'text'
      }
    ).subscribe({
      next: message => {
        this.successMessage =
          message || this.languageService.translate('availabilityDeactivatedSuccessfully');

        availability.isActive = false;
        this.savingAvailabilityInstructorId = null;
        this.cdr.markForCheck();
      },
      error: error => {
        console.error('Could not deactivate availability:', error);
        this.errorMessage =
          error.error?.message ||
          (typeof error.error === 'string' ? error.error : null) ||
          this.languageService.translate('couldNotDeactivateAvailability');

        this.savingAvailabilityInstructorId = null;
        this.cdr.markForCheck();
      }
    });
  }

  formatTime(time: string): string {
    if (!time) return '';
    const match = time.match(/^(\d{1,2}):(\d{2})/);
    if (!match) return time;

    const hours = Number(match[1]);
    const minutes = match[2];
    if (hours < 0 || hours > 23) return time;

    return `${hours % 12 || 12}:${minutes} ${hours >= 12 ? 'PM' : 'AM'}`;
  }

  formatDate(date: string | null): string {
    if (!date) {
      return this.languageService.translate('noEndDate');
    }

    return new Date(date).toLocaleDateString(
      this.languageService.currentLanguage === 'ar' ? 'ar-EG' : 'en-US'
    );
  }
}
