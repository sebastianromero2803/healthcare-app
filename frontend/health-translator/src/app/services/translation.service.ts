import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private baseUrl = 'https://your-fastapi-backend-url.com'; // Update with your real endpoint

  // BehaviorSubjects store the latest value and allow other components to subscribe
  private originalTranscriptSubject = new BehaviorSubject<string>('');
  originalTranscript$ = this.originalTranscriptSubject.asObservable();

  private translatedTranscriptSubject = new BehaviorSubject<string>('');
  translatedTranscript$ = this.translatedTranscriptSubject.asObservable();

  constructor(private http: HttpClient) {}

  get currentTranslatedTranscript(): string {
    return this.translatedTranscriptSubject.value;
  }

  /**
   * Transcribe an audio file
   */
  transcribeAudio(formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/transcribe`, formData)
      .pipe(
        tap((response: any) => {
          // The backend response might be { status: 'success', transcript: '...' }
          if (response && response.status === 'success') {
            // Update the original transcript
            const transcriptText = response.transcript;
            // If the transcript is a string, update the BehaviorSubject
            if (typeof transcriptText === 'string') {
              this.originalTranscriptSubject.next(transcriptText);
            }
          }
        })
      );
  }

  /**
   * Translate the current originalTranscript from sourceLang to targetLang
   */
  translateCurrentTranscript(sourceLang: string, targetLang: string): void {
    const textToTranslate = this.originalTranscriptSubject.value;
    if (!textToTranslate) return;

    const payload = { text: textToTranslate };
    let params = new HttpParams()
      .set('source_language', sourceLang)
      .set('target_language', targetLang);

    this.http.post(`${this.baseUrl}/translate`, payload, { params })
      .subscribe({
        next: (res: any) => {
          if (res && res.translation) {
            this.translatedTranscriptSubject.next(res.translation);
          }
        },
        error: (err) => {
          console.error('Translation error:', err);
        }
      });
  }
}
