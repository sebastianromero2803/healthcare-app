import { Component } from '@angular/core';
import { TranslationService } from '../../services/translation.service';

@Component({
  standalone: false,
  selector: 'app-voice-input',
  templateUrl: './voice-input.component.html',
  styles: [
    `
      :host {
        display: block;
        margin-bottom: 1rem;
      }
    `,
  ],
})
export class VoiceInputComponent {
  recording: boolean = false;

  constructor(private translationService: TranslationService) {}

  toggleRecording(): void {
    if (this.recording) {
      // Stop recording logic
      this.stopRecording();
    } else {
      // Start recording logic
      this.startRecording();
    }
    this.recording = !this.recording;
  }

  // For demonstration, we'll just do file upload.
  // If you want to handle actual live recording, you'd need to capture audio in the browser
  // and then convert it to a Blob or File to send to the backend.

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    // Create FormData
    const formData = new FormData();
    formData.append('file', file);

    // Call the backend
    this.translationService.transcribeAudio(formData).subscribe({
      next: (res) => {
        // On success, the service updates the shared transcript
        console.log('Transcription successful:', res);
      },
      error: (err) => {
        console.error('Transcription error:', err);
      },
    });
  }

  startRecording(): void {
    // Here you could implement getUserMedia and record audio.
    // We'll just set a flag for demonstration.
    this.recording = true;
  }

  stopRecording(): void {
    // Stop recording logic
    this.recording = false;
    // Then pass the recorded audio to the service
  }
}
