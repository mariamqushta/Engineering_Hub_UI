import { Component, Input } from '@angular/core';
import { Track } from '../../../core/models/track';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { LanguageService } from '../../../core/services/language.service';
@Component({
  selector: 'app-track-card',
  imports: [RouterLink],
  templateUrl: './track-card.html',
  styleUrl: './track-card.css',
})
export class TrackCard {

  @Input() track!: Track;
constructor(
  private authService: AuthService,
  private router: Router,
   public languageService: LanguageService,
) {}

bookTrack(): void {
  this.authService.getCurrentUser().subscribe({
    next: () => {
      this.router.navigate(['/booking/track', this.track.id]);
    },
    error: () => {
      this.router.navigate(['/login']);
    }
  });
}
}
