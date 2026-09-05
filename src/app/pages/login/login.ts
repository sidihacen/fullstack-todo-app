import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  username = '';
  password = '';
  message = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  login() {

  this.message = '';

  if (this.username.trim() === '') {
    this.message = 'Le nom utilisateur est obligatoire.';
    return;
  }

  if (this.password === '') {
    this.message = 'Le mot de passe est obligatoire.';
    return;
  }

  this.authService
    .login(
      this.username.trim(),
      this.password
    )
    .subscribe({

      next: () => {
        this.router.navigate(['/todo']);
      },

      error: (error) => {

        this.message =
          error.error?.message ||
          'Identifiants incorrects.';

      }

    });
}
}