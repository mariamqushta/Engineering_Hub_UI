
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { LanguageService } from '../../../core/services/language.service';
import { environment } from '../../../../environments/environment';
interface Track {
  id: number;
  title: string;
  description?: string;
  price: number;
  isActive?: boolean;
}

interface TrackForm {
  title: string;
  description: string;
  price: number;
}

@Component({
  selector: 'app-admin-tracks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-tracks.html',
})
export class AdminTracks implements OnInit {
  private readonly apiUrl = `${environment.apiUrl}/api/Track`;
  private cdr = inject(ChangeDetectorRef);
  tracks: Track[] = [];
  loading = true;
  form: TrackForm = this.emptyForm();
  editingId: number | null = null;
  formVisible = false;

  message = '';
  messageType: 'success' | 'error' = 'success';

constructor(private http: HttpClient,
     public languageService: LanguageService,) {}

ngOnInit(): void {
  this.getTracks();
}

getTracks(): void {
  this.loading = true;

  this.http.get<Track[]>(this.apiUrl, {
    withCredentials: true,
  }).subscribe({
     next: (tracks) => {
      this.tracks = tracks ?? [];
      this.loading = false;

      this.cdr.markForCheck();
    },
    error: (error) => {
      console.error('Failed to retrieve tracks:', error);
      this.loading = false;
      this.showMessage('Could not retrieve tracks.', 'error');
    },
  });
}

  openCreateForm(): void {
    this.editingId = null;
    this.form = this.emptyForm();
    this.formVisible = true;
    this.message = '';
  }

  openEditForm(track: Track): void {
    this.editingId = track.id;
    this.form = {
      title: track.title,
      description: track.description ?? '',
      price: track.price,
    };
    this.formVisible = true;
    this.message = '';
  }

  saveTrack(): void {
    if (
      !this.form.title.trim() ||
      !Number.isFinite(this.form.price) ||
      this.form.price < 0
    ) {
      this.showMessage(
        'Enter a track title and a valid non-negative price.',
        'error'
      );
      return;
    }

    const dto = {
      Title: this.form.title.trim(),
      Description: this.form.description.trim(),
      Price: this.form.price,
    };

    if (this.editingId === null) {
      this.http.post<Track>(this.apiUrl, dto, {
        withCredentials: true,
      }).subscribe({
        next: () => {
          this.formVisible = false;
          this.showMessage('Track created successfully.', 'success');
          this.getTracks();
        },
        error: (error) => {
          console.error('Failed to create track:', error);
          this.showMessage(
            error.error?.message ?? 'Could not create the track.',
            'error'
          );
        },
      });
    } else {
      const id = this.editingId;

      this.http.put(
        `${this.apiUrl}/${id}`,
        dto,
        { withCredentials: true }
      ).subscribe({
        next: () => {
          this.formVisible = false;
          this.showMessage('Track updated successfully.', 'success');
          this.getTracks();
        },
        error: (error) => {
          console.error('Failed to update track:', error);
          this.showMessage(
            error.error?.message ?? 'Could not update the track.',
            'error'
          );
        },
      });
    }
  }

  deactivateTrack(track: Track): void {
    if (!window.confirm(`Deactivate "${track.title}"?`)) {
      return;
    }

    this.http.delete(`${this.apiUrl}/${track.id}`, {
      withCredentials: true,
      responseType: 'text',
    }).subscribe({
      next: () => {
        this.showMessage('Track deactivated successfully.', 'success');
        this.getTracks();
      },
      error: (error) => {
        console.error('Failed to deactivate track:', error);
        this.showMessage(
          error.error?.message ?? 'Could not deactivate the track.',
          'error'
        );
      },
    });
  }

  private emptyForm(): TrackForm {
    return {
      title: '',
      description: '',
      price: 0,
    };
  }

  private showMessage(
    message: string,
    type: 'success' | 'error'
  ): void {
    this.message = message;
    this.messageType = type;
  }
}
