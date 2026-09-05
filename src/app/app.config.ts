import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
//import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClient,
  withInterceptors
} from '@angular/common/http';

import { authInterceptor } from './services/auth.interceptor';
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    //provideHttpClient()
    provideHttpClient(
  withInterceptors([authInterceptor])
)
  ]
};
