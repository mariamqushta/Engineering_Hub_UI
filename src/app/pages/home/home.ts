import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TrackCard } from '../../shared/components/track-card/track-card';
import { TrackService } from '../../core/services/track.service';
import { Track } from '../../core/models/track';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-home',
  imports: [TrackCard, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {

  tracks: Track[] = [];
  filteredTracks: Track[] = [];
  searchText: string = '';

  constructor(
    private trackService: TrackService,
    private cdr: ChangeDetectorRef,
     public languageService: LanguageService,
  ) {}

  ngOnInit(): void {
    this.trackService.getTracks().subscribe({
      next: (data) => {
        this.tracks = data;
        this.filteredTracks = data;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading tracks:', error);
      }
    });
  }

searchTracks(): void {
  const search = this.searchText.toLowerCase().trim();

  this.filteredTracks = this.tracks.filter(track =>
    (track.title ?? '').toLowerCase().includes(search) ||
    (track.description ?? '').toLowerCase().includes(search)
  );
}
}
