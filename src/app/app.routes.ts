import { Routes } from '@angular/router';
import { AccueilComponent } from './features/public/accueil/accueil.component';

import { roleGuard } from './core/guards/role.guard';
import { AdminDashboardComponent } from './features/admin/pages/admin-dashboard/admin-dashboard';
import { LoginComponent } from './features/auth/pages/login/login';
import { RegisterComponent } from './features/auth/pages/register/register';
import { CalendrierComponent } from './features/calendrier/calendrier';
import { DirectionThemesComponent } from './features/direction/pages/direction-themes/direction-themes';
import { DirecteurSuiviComponent } from './features/directeur/pages/directeur-suivi/directeur-suivi';
import { DashboardComponent } from './features/etudiant/pages/dashboard/dashboard';
import { EligibiliteComponent } from './features/etudiant/pages/eligibilite/eligibilite';
import { ThemeFormComponent } from './features/etudiant/pages/theme-form/theme-form';
import { UploadMemoireComponent } from './features/etudiant/upload-memoire/upload-memoire';
import { ExamenComponent } from './features/examen/examen/examen';
import { ExamenCheckComponent } from './features/examen/pages/examen-check/examen-check';
import { JuryNotationComponent } from './features/jury/pages/jury-notation/jury-notation';
import { OrganisationPlanifComponent } from './features/organisation/pages/organisation-planif/organisation-planif';
import { RecouvrementComponent } from './features/recouvrement/recouvrement/recouvrement';
import { RecouvrementListeComponent } from './features/recouvrement/pages/recouvrement-liste/recouvrement-liste';

export const routes: Routes = [
  { path: 'auth/login', component: LoginComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'etudiant',
    component: DashboardComponent,
    canActivate: [roleGuard],
    data: { role: 'STUDENT' },
  },
  { path: 'etudiant/dashboard', component: DashboardComponent },
  { path: 'etudiant/memoire', component: UploadMemoireComponent },
  { path: 'etudiant/theme/nouveau', component: ThemeFormComponent },
  { path: 'etudiant/eligibilite', component: EligibiliteComponent },
  { path: 'direction/themes', component: DirectionThemesComponent },
  { path: 'directeur/suivi', component: DirecteurSuiviComponent },
  { path: 'recouvrement', component: RecouvrementListeComponent },
  { path: 'recouvrement/dashboard', component: RecouvrementComponent },
  { path: 'organisation/planification', component: OrganisationPlanifComponent },
  { path: 'examen', component: ExamenComponent },
  { path: 'examen/conformite', component: ExamenCheckComponent },
  { path: 'jury/notation', component: JuryNotationComponent },
  { path: 'admin', component: AdminDashboardComponent },
  { path: 'calendrier', component: CalendrierComponent },
  { path: '', component: AccueilComponent },
  { path: '**', redirectTo: '' },
];
