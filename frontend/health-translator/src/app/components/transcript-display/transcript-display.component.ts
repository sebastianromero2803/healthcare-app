import { Component, OnInit } from '@angular/core';
import { TranslationService } from '../../services/translation.service';

@Component({
  standalone: false,
  selector: 'app-transcript-display',
  templateUrl: './transcript-display.component.html',
  styles: [
    `
      :host {
        display: block;
        margin-bottom: 1rem;
      }
    `,
  ],
})
export class TranscriptDisplayComponent implements OnInit {
  originalTranscript: string = '';
  translatedTranscript: string = '';

  constructor(private translationService: TranslationService) {}

  ngOnInit(): void {
    // Subscribe to transcript Observables from the service
    this.translationService.originalTranscript$.subscribe({
      next: (text) => this.originalTranscript = text || '',
    });

    this.translationService.translatedTranscript$.subscribe({
      next: (text) => this.translatedTranscript = text || '',
    });
  }
}
