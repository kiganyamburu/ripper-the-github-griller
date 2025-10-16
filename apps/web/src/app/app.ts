import { Component, inject, signal } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { FormsModule } from '@angular/forms';
import { injectMutation } from '@tanstack/angular-query-experimental';
import { SuggestCardComponent } from './suggest-card/suggest-card.component';

@Component({
  imports: [FormsModule, SuggestCardComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  functions = inject(Functions);
  isRoastCardOpen = signal(false);
  // Holds the suggestion text
  suggestionText = signal<string | null>(null);

  suggestMutations = injectMutation(() => ({
    mutationFn: async (username: string) => {
      const callable = httpsCallable<{ username: string }, string>(
        this.functions,
        'githubProjectSuggestFunction',
      );
      const result = await callable({ username });
      console.log('Suggestion result:', result);
      return result.data;
    },
    onSuccess: (data: string) => {
      console.log('Suggestion successful:', data);
      this.suggestionText.set(data);
      this.isRoastCardOpen.set(true);
    },
    onError: (error: unknown) => {
      console.error('Suggestion failed:', error);
      alert('Failed to generate a suggestion. Please try again.');
    },
  }));

  closeRoastCard(): void {
    this.isRoastCardOpen.set(false);
  }
}
