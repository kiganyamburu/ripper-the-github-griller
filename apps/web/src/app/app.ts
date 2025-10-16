import { Component, inject, signal } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { FormsModule } from '@angular/forms';
import { injectMutation } from '@tanstack/angular-query-experimental';
import { RoastCardComponent } from './roast-card/roast-card.component';

@Component({
  imports: [FormsModule, RoastCardComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  functions = inject(Functions);
  isRoastCardOpen = signal(false);
  // Mode toggle: 'roast' or 'suggest'
  mode = signal<'roast' | 'suggest'>('roast');

  // Holds the suggestion text if mode is 'suggest'
  suggestionText = signal<string | null>(null);

  roastMutations = injectMutation(() => ({
    mutationFn: async (username: string) => {
      const callable = httpsCallable<{ username: string }, string>(
        this.functions,
        'githubGrillerFunction',
      );
      const result = await callable({ username });
      console.log('Roast result:', result);
      return result.data;
    },
    onSuccess: (data: string) => {
      console.log('Roast successful:', data);
      this.isRoastCardOpen.set(true);
    },
    onError: (error: unknown) => {
      console.error('Roast failed:', error);
      alert('Failed to roast the user. Please try again.');
    },
  }));

  suggestMutations = injectMutation(() => ({
    mutationFn: async (username: string) => {
      const callable = httpsCallable<{ username: string }, string>(
        this.functions,
        'githubProjectSuggestFunction',
      );
      const result = await callable({ username });
      console.log('Suggest result:', result);
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
