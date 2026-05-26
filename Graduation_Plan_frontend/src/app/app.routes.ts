import { Routes } from '@angular/router';
import { LoginComponent }          from './features/auth/pages/login/login';
import { RegisterComponent }        from './features/auth/pages/register/register';
import { AccueilComponent }         from './features/public/accueil/accueil.component';
import { CalendrierComponent }      from './features/calendrier/calendrier';
import { ChatComponent }            from './features/chat/chat';
import { PlanningComponent }           from './features/directeur/pages/planning/planning';
import { DirecteurMemoireComponent }   from './features/directeur/pages/directeur-memoire/directeur-memoire';

import { roleGuard } from './core/guards/role.guard';

import { RecouvrementComponent }    from './features/recouvrement/recouvrement/recouvrement';
import { UploadMemoireComponent }         from './features/etudiant/upload-memoire/upload-memoire';
import { EtudiantMemoireVoirComponent }   from './features/etudiant/pages/memoire-voir/memoire-voir';

import { AdminDashboardComponent }        from './features/admin/pages/admin-dashboard/admin-dashboard';
import { DirectionThemesComponent }       from './features/direction/pages/direction-themes/direction-themes';
import { AffectationsComponent }          from './features/direction/pages/affectations/affectations';
import { DirecteurSuiviComponent }        from './features/directeur/pages/directeur-suivi/directeur-suivi';
import { DirecteurSuiviListComponent }    from './features/directeur/pages/directeur-suivi-list/directeur-suivi-list';
import { DashboardComponent }             from './features/etudiant/pages/dashboard/dashboard';
import { ChoisirDirecteurComponent }      from './features/etudiant/pages/choisir-directeur/choisir-directeur';
import { EligibiliteComponent }           from './features/etudiant/pages/eligibilite/eligibilite';
import { EtudiantPaiementComponent }      from './features/etudiant/pages/paiement/paiement';
import { ThemeFormComponent }             from './features/etudiant/pages/theme-form/theme-form';
import { EtudiantChatComponent }          from './features/etudiant/pages/chat/etudiant-chat';
import { EtudiantSuiviMemoireComponent }  from './features/etudiant/pages/suivi-memoire/suivi-memoire';
import { EtudiantRattrapagesComponent }   from './features/etudiant/pages/rattrapages/rattrapages';
import { EtudiantNotesComponent }         from './features/etudiant/pages/notes/notes';
import { ExamenCheckComponent }           from './features/examen/pages/examen-check/examen-check';
import { RattrapagesComponent }           from './features/examen/pages/rattrapages/rattrapages';
import { JuryNotationComponent }          from './features/jury/pages/jury-notation/jury-notation';
import { OrganisationPlanifComponent }    from './features/organisation/pages/organisation-planif/organisation-planif';
import { RecouvrementListeComponent }     from './features/recouvrement/pages/recouvrement-liste/recouvrement-liste';
import { RattrapageRecouvrementComponent } from './features/recouvrement/pages/rattrapage-recouvrement/rattrapage-recouvrement';
import { AnalyseDocumentComponent }       from './features/shared/pages/analyse-document/analyse-document';
import { ArchiveDossierComponent }        from './features/shared/pages/archive-dossier/archive-dossier';

const STUDENT_ROLES   = ['STUDENT'];
const DIRECTEUR_ROLES = ['INTERNAL_TRAINER', 'EXTERNAL_TRAINER'];
const DIRECTION_ROLES = ['ADMIN_ACADEMIC'];
const EXAMEN_ROLES    = ['CHEF_SERVICE_EXAM'];
const RECOUV_ROLES    = ['SERVICE_RECOUVREMENT'];
const ORGA_ROLES      = ['CHARGE_ORGANISATION'];
const JURY_ROLES      = ['EXAMINER', 'PRESIDENT_JURY'];
const ADMIN_ROLES     = ['ADMIN_ACADEMIC'];

function guard(roles: string[]) {
  return { canActivate: [roleGuard], data: { roles } };
}

export const routes: Routes = [
  // ── Publiques ──────────────────────────────────────────────────────────
  { path: '',           component: AccueilComponent },
  { path: 'auth/login', component: LoginComponent },
  { path: 'login',      component: LoginComponent },
  { path: 'register',   component: RegisterComponent },
  { path: 'calendrier', component: CalendrierComponent },

  // ── Étudiant ───────────────────────────────────────────────────────────
  { path: 'etudiant',                    component: DashboardComponent,          ...guard(STUDENT_ROLES) },
  { path: 'etudiant/dashboard',          component: DashboardComponent,          ...guard(STUDENT_ROLES) },
  { path: 'etudiant/memoire/voir',       component: EtudiantMemoireVoirComponent, ...guard(STUDENT_ROLES) },
  { path: 'etudiant/memoire',            component: UploadMemoireComponent,       ...guard(STUDENT_ROLES) },
  { path: 'etudiant/paiement',           component: EtudiantPaiementComponent,    ...guard(STUDENT_ROLES) },
  { path: 'etudiant/theme/nouveau',      component: ThemeFormComponent,           ...guard(STUDENT_ROLES) },
  { path: 'etudiant/eligibilite',        component: EligibiliteComponent,         ...guard(STUDENT_ROLES) },
  { path: 'etudiant/choisir-directeur',  component: ChoisirDirecteurComponent,    ...guard(STUDENT_ROLES) },
  { path: 'etudiant/chat',              component: EtudiantChatComponent,          ...guard(STUDENT_ROLES) },
  { path: 'etudiant/suivi-memoire',    component: EtudiantSuiviMemoireComponent,  ...guard(STUDENT_ROLES) },
  { path: 'etudiant/rattrapages',      component: EtudiantRattrapagesComponent,   ...guard(STUDENT_ROLES) },
  { path: 'etudiant/notes',           component: EtudiantNotesComponent,         ...guard(STUDENT_ROLES) },

  // ── Direction Académique ───────────────────────────────────────────────
  { path: 'direction/themes',       component: DirectionThemesComponent, ...guard(DIRECTION_ROLES) },
  { path: 'direction/affectations', component: AffectationsComponent,    ...guard(DIRECTION_ROLES) },

  // ── Directeur de mémoire ──────────────────────────────────────────────
  { path: 'directeur/suivi',            component: DirecteurSuiviComponent,     ...guard(DIRECTEUR_ROLES) },
  { path: 'directeur/suivi/:openId',   component: DirecteurSuiviComponent,     ...guard(DIRECTEUR_ROLES) },
  { path: 'directeur/suivi-memoire',   component: DirecteurSuiviListComponent, ...guard(DIRECTEUR_ROLES) },
  { path: 'directeur/planning',       component: PlanningComponent,          ...guard(DIRECTEUR_ROLES) },
  { path: 'directeur/memoire/:docId', component: DirecteurMemoireComponent,  ...guard(DIRECTEUR_ROLES) },

  // ── Chat directeur ↔ étudiant ─────────────────────────────────────────
  { path: 'chat/:id', component: ChatComponent, canActivate: [roleGuard] },

  // ── Service Examen ────────────────────────────────────────────────────
  { path: 'examen/conformite',  component: ExamenCheckComponent, ...guard(EXAMEN_ROLES) },
  { path: 'examen/rattrapages', component: RattrapagesComponent, ...guard(EXAMEN_ROLES) },

  // ── Recouvrement ──────────────────────────────────────────────────────
  { path: 'recouvrement',             component: RecouvrementListeComponent,     ...guard(RECOUV_ROLES) },
  { path: 'recouvrement/liste',       component: RecouvrementListeComponent,     ...guard(RECOUV_ROLES) },
  { path: 'recouvrement/dashboard',   component: RecouvrementComponent,          ...guard(RECOUV_ROLES) },
  { path: 'recouvrement/rattrapages', component: RattrapageRecouvrementComponent, ...guard(RECOUV_ROLES) },

  // ── Autres rôles ──────────────────────────────────────────────────────
  { path: 'organisation/planification', component: OrganisationPlanifComponent, ...guard(ORGA_ROLES) },
  { path: 'jury/notation',              component: JuryNotationComponent,        ...guard(JURY_ROLES) },
  { path: 'admin',                      component: AdminDashboardComponent,      ...guard(ADMIN_ROLES) },

  // ── Outils partagés (SE + DA) ─────────────────────────────────────────
  { path: 'analyse', component: AnalyseDocumentComponent, canActivate: [roleGuard] },
  { path: 'archive', component: ArchiveDossierComponent,  canActivate: [roleGuard] },

  // ── Défaut ────────────────────────────────────────────────────────────
  { path: '**', redirectTo: '' },
];
