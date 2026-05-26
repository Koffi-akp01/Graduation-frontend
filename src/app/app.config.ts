import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { provideLucideIcons, Users, Lightbulb, Book, CheckCircle, Folder, Gavel, Calendar, FileText, Wallet, ShieldCheck, GraduationCap, ArrowRight } from 'lucide-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideLucideIcons({ Users, Lightbulb, Book, CheckCircle, Folder, Gavel, Calendar, FileText, Wallet, ShieldCheck, GraduationCap, ArrowRight }),
  ],
};
