import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { TranslationService } from '../../services/translation.service';

@Component({
  standalone: false,
  selector: 'app-translation',
  templateUrl: './translation.component.html',
  styleUrls: ['./translation.component.scss']
})
export class TranslationComponent {
  sourceLanguage = new FormControl('en');
  targetLanguage = new FormControl('es');

  constructor(private translationService: TranslationService) {}

  onTranslate(): void {
    // Translate the text currently in originalTranscript$
    const sourceLang = this.sourceLanguage.value!;
    const targetLang = this.targetLanguage.value!;

    this.translationService.translateCurrentTranscript(sourceLang, targetLang);
  }

  onSpeak(): void {
    // Speak the translated transcript from the service
    const utterance = new SpeechSynthesisUtterance(
      this.translationService.currentTranslatedTranscript
    );
    // Optionally set the language if recognized by the browser
    utterance.lang = this.targetLanguage.value!;
    speechSynthesis.speak(utterance);
  }
}
