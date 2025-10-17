import { Component, ElementRef, input, output, viewChild } from '@angular/core';

@Component({
  selector: 'app-suggest-card',
  templateUrl: './suggest-card.component.html',
})
export class SuggestCardComponent {
  results = input.required<string>();
  cardRef = viewChild<ElementRef<HTMLDivElement>>('card');

  isModalOpen = input.required<boolean>();

  modalClosed = output<void>();

  closeCard(): void {
    this.modalClosed.emit();
  }

  downloadCard(): void {
    const card = this.cardRef()?.nativeElement;
    if (!card) return;
    import('html2canvas').then((html2canvas) => {
      html2canvas.default(card).then((canvas: HTMLCanvasElement) => {
        const link = document.createElement('a');
        link.download = 'project-suggestion.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
    });
  }

  shareCard(): void {
    const card = this.cardRef()?.nativeElement;
    if (!card) return;
    import('html2canvas').then((html2canvas) => {
      html2canvas.default(card).then((canvas: HTMLCanvasElement) => {
        canvas.toBlob((blob: Blob | null) => {
          const navObj: Navigator | undefined =
            typeof navigator !== 'undefined' ? navigator : undefined;
          if (navObj && 'share' in navObj && blob) {
            const file = new File([blob], 'project-suggestion.png', {
              type: 'image/png',
            });
            (
              navObj as unknown as { share: (data: ShareData) => Promise<void> }
            ).share({
              title: 'GitHub Project Suggestion',
              text: 'Check out this project idea tailored to my GitHub profile!',
              files: [file],
            });
          } else {
            alert(
              'Sharing is not supported in this browser. Please download instead.',
            );
          }
        });
      });
    });
  }
}
