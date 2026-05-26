import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService, StudentRegisterPayload } from '../../../../core/services/auth/auth';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class RegisterComponent {
  form: StudentRegisterPayload & { confirmPassword: string } = {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    matricule: '',
  };

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  onRegister(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.form.password !== this.form.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
      return;
    }

    this.isLoading = true;
    const { confirmPassword, ...payload } = this.form;

    this.authService.registerStudent(payload).subscribe({
      next: () => {
        this.successMessage = 'Compte etudiant cree. Vous pouvez maintenant vous connecter.';
        setTimeout(() => this.router.navigate(['/login']), 900);
      },
      error: (err) => {
        console.error('Erreur inscription etudiant', err);
        this.errorMessage = "Inscription impossible. Verifiez les informations saisies.";
        this.isLoading = false;
      },
    });
  }
}
