
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import {
  Certificate,
  CertificateService
} from '../../../core/services/certificate';
import { LanguageService } from '../../../core/services/language.service';
import { environment } from '../../../../environments/environment';
@Component({
  selector: 'app-certificate',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './certificate.html',
  styleUrl: './certificate.css'
})
export class CertificateComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private location = inject(Location);
  certificates: Certificate[] = [];
  selectedCertificate: Certificate | null = null;

  trackId: number | null = null;
downloadingCertificateId: number | null = null;
downloadErrorMessage = '';
  loading = true;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private certificateService: CertificateService,
     public languageService: LanguageService,
  ) {}

  ngOnInit(): void {
    const trackIdParam = this.route.snapshot.paramMap.get('trackId');

    if (trackIdParam !== null) {
      const parsedTrackId = Number(trackIdParam);

      if (!Number.isInteger(parsedTrackId) || parsedTrackId <= 0) {
        this.errorMessage = 'Invalid track ID.';
        this.loading = false;
        return;
      }

      this.trackId = parsedTrackId;
    }

    this.loadCertificates();
  }

  loadCertificates(): void {
    this.loading = true;
    this.errorMessage = '';

    this.certificateService.getMyCertificates().subscribe({
      next: (certificates) => {
        this.certificates = certificates ?? [];

        if (this.trackId !== null) {
          this.selectedCertificate =
            this.certificates.find(
              certificate => certificate.trackId === this.trackId
            ) ?? null;
        }

        this.loading = false;
         this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading certificates:', error);

        this.errorMessage =
          'Could not load your certificates. Please try again.';

        this.loading = false;
      }
    });
  }

downloadCertificate(certificate: Certificate): void {
  if (this.downloadingCertificateId !== null) {
    return;
  }

  this.downloadingCertificateId = certificate.id;
  this.downloadErrorMessage = '';

  this.certificateService
    .downloadCertificate(certificate.id)
    .subscribe({
      next: (blob) => {
        const fileUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = fileUrl;
        link.download =
          `EngineeringHub-Certificate-${certificate.id}.pdf`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(fileUrl);

        this.downloadingCertificateId = null;
        this.cdr.markForCheck();
      },
      error: async (error) => {
        console.error('Download status:', error.status);

        if (error.error instanceof Blob) {
          const responseText = await error.error.text();
          console.log('Backend response:', responseText);
        } else {
          console.log('Backend response:', error.error);
        }

        this.downloadErrorMessage =
          'Could not download the certificate. Check the console for details.';

        this.downloadingCertificateId = null;
        this.cdr.markForCheck();
      }
    });
}

  goBack(): void {
  this.location.back();
}
}
