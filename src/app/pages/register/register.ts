import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {

  username = '';
  password = '';
  message = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  register() {

  this.message = '';

  if (this.username.trim() === '') {
    this.message = 'Le nom utilisateur est obligatoire.';
    return;
  }

  if (this.password.length < 4) {
    this.message = 'Le mot de passe doit contenir au moins 4 caractères.';
    return;
  }

  this.authService
    .register(
      this.username.trim(),
      this.password
    )
    .subscribe({

      next: () => {
        this.router.navigate(['/login']);
      },

      error: (error) => {

        this.message =
          error.error?.message ||
          'Erreur lors de l’inscription.';

      }

    });
}
}