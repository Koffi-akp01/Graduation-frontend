import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { ThemeService } from '../../../../core/services/theme/theme';

@Component({
  selector: 'app-theme-form',
  imports: [ReactiveFormsModule],
  templateUrl: './theme-form.html',
  styleUrl: './theme-form.scss',
})
export class ThemeFormComponent implements OnInit {
  themeForm!: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private themeService: ThemeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.themeForm = this.fb.group({
      titre: ['', [Validators.required, Validators.minLength(10)]],
      description: ['', [Validators.required, Validators.minLength(50)]],
      domaine: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.themeForm.valid) {
      this.isSubmitting = true;

      this.themeService.submitTheme(this.themeForm.value).subscribe({
        next: () => {
          this.router.navigate(['/etudiant/dashboard']);
        },
        error: (err) => {
          this.isSubmitting = false;
          console.error('Erreur lors du depot', err);
        },
      });
    }
  }
}
