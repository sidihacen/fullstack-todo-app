import { Routes } from '@angular/router';

import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Todo } from './pages/todo/todo';

import { authGuard } from './auth.guard';

export const routes: Routes = [

  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  {
    path: 'login',
    component: Login
  },

  {
    path: 'register',
    component: Register
  },

  {
    path: 'todo',
    component: Todo,
    canActivate: [authGuard]
  },

 {
  path: '**',
  redirectTo: 'login'
}

];