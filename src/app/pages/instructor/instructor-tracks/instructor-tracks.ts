
import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { TrackService } from '../../../core/services/track.service';
import { LanguageService } from '../../../core/services/language.service';
import { environment } from '../../../../environments/environment';
interface Track {
  id: number;
  title: string;
  description?: string;
}

@Component({
  selector: 'app-instructor-tracks',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './instructor-tracks.html',
  styleUrl: './instructor-tracks.css'
})
export class InstructorTracks implements OnInit {
  tracks: Track[] = [];
  isLoading = true;
  errorMessage = '';

  private isRequestInProgress = false;

  constructor(
    private trackService: TrackService,
    private router: Router,
    private cdr: ChangeDetectorRef,
         public languageService: LanguageService,
  ) {}

  ngOnInit(): void {
    this.loadMyTracks();
  }

  loadMyTracks(): void {
    // Prevent duplicate API requests while one is already running.
    if (this.isRequestInProgress) {
      return;
    }

    this.isRequestInProgress = true;
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.trackService.getMyTracks()
      .pipe(
        // Always stop loading, whether the request succeeds or fails.
        finalize(() => {
          this.isLoading = false;
          this.isRequestInProgress = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (tracks: Track[]) => {
          this.tracks = tracks ?? [];
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading instructor tracks:', error);

          if (error.status === 401 || error.status === 403) {
            this.errorMessage =
              'Your instructor session is invalid or has expired. Please log in again.';
          } else {
            this.errorMessage =
              'Could not load your tracks. Please try again.';
          }

          this.cdr.detectChanges();
        }
      });
  }

  manageLessons(trackId: number): void {
    this.router.navigate([
      '/instructor/tracks',
      trackId,
      'lessons'
    ]);
  }
}
