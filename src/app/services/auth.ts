import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';

interface AuthResponse {
  token: string;
  username: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  register(username: string, password: string) {
    return this.http.post(
      `${this.apiUrl}/register`,
      {
        username: username,
        password: password
      }
    );
  }

  login(username: string, password: string) {
    return this.http
      .post<AuthResponse>(
        `${this.apiUrl}/login`,
        {
          username: username,
          password: password
        }
      )
      .pipe(
        tap(response => {
          localStorage.setItem('token', response.token);
          localStorage.setItem('username', response.username);
        })
      );
  }

  getToken() {
    return localStorage.getItem('token');
  }

  getUsername() {
    return localStorage.getItem('username');
  }

  isLoggedIn() {
    return !!this.getToken();
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
  }
}