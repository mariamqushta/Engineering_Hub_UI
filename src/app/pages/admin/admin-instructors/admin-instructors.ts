
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

@Component({
  selector: 'app-admin-instructors',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-instructors.html'
})
export class AdminInstructors implements OnInit {
  private readonly adminApi = 'https://localhost:7109/api/Admin';
  private readonly trackApi = 'https://localhost:7109/api/Track';
  private cdr = inject(ChangeDetectorRef);
  instructors: Instructor[] = [];
  tracks: Track[] = [];

  isLoading = true;
  isSaving = false;
  errorMessage = '';
  successMessage = '';

  constructor(private http: HttpClient, public languageService: LanguageService,) {}

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
        this.cdr.markForCheck();
      },
      error: error => {
        console.error('Could not load tracks:', error);
        this.errorMessage = 'Could not load tracks.';
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

        instructorsLoaded = true;
        finishLoading();
        this.cdr.markForCheck();
      },
      error: error => {
        console.error('Could not load instructors:', error);
        this.errorMessage = 'Could not load instructors.';
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
      this.errorMessage = 'Choose a track for this instructor.';
      return;
    }

    const track = this.tracks.find(item => item.id === trackId);

    if (!track) {
      this.errorMessage = 'The selected track could not be found.';
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
          message || 'Instructor assigned successfully.';

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
          'Could not assign instructor to this track.';
        this.isSaving = false;
      }
    });
  }

  removeInstructor(instructor: Instructor, track: Track): void {
    if (!confirm(
      `Remove ${instructor.fullName || instructor.userName} from "${track.title}"?`
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
          message || 'Instructor removed successfully.';

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
          'Could not remove instructor from this track.';
        this.isSaving = false;
      }
    });
  }
}
