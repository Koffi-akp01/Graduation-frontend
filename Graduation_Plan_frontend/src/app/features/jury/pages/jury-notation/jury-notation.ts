import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { JuryService } from '../../../../core/services/jury/jury';

@Component({
  selector: 'app-jury-notation',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './jury-notation.html',
  styleUrl: './jury-notation.scss',
})
export class JuryNotationComponent implements OnInit {
  notationForm!: FormGroup;
  isSubmitting = signal(false);

  moyenne = computed(() => {
    if (!this.notationForm) {
      return '0.00';
    }

    const f = this.notationForm.value;
    return (((+f.note_rapport || 0) + (+f.note_presentation || 0) + (+f.note_reponses || 0)) / 3).toFixed(2);
  });

  constructor(private fb: FormBuilder, private juryService: JuryService) {}

  ngOnInit(): void {
    this.notationForm = this.fb.group({
      note_rapport: [0, [Validators.required, Validators.min(0), Validators.max(20)]],
      note_presentation: [0, [Validators.required, Validators.min(0), Validators.max(20)]],
      note_reponses: [0, [Validators.required, Validators.min(0), Validators.max(20)]],
      observations: ['', Validators.required],
    });
  }

  validerNote(): void {
    if (this.notationForm.valid) {
      this.isSubmitting.set(true);
      this.juryService.submitNotes(this.notationForm.value).subscribe({
        next: () => this.isSubmitting.set(false),
        error: () => this.isSubmitting.set(false),
      });
    }
  }
}
