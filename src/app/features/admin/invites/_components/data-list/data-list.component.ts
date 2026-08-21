import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

import { AlertService } from '../../../../../@core/services/alert.service';
import { Card } from '../../../../../@shared/components/ui/card/card';
import { SharedModule } from '../../../../../@shared/shared.module';
import { InviteService } from '../../../../../@core/modules/acl/services/invite.service';
import { InviteModel } from '../../../../../@core/modules/acl/entities/invite.model';
import { ModalInvitesComponent } from '../modal/modal.component';

// Sem FilterStore/paginação (diferente de companies/users): GET /v1/invites
// não pagina no backend (lista já é escopada à própria company/holding do
// chamador) e não há filtro que valha a pena agora — adicionar os dois
// seria abstração sem necessidade comprovada.
@Component({
  selector: 'app-data-list-invites',
  templateUrl: './data-list.component.html',
  styleUrls: ['./data-list.component.scss'],
  imports: [SharedModule, Card, ModalInvitesComponent],
})
export class DataListComponent implements OnInit, OnDestroy {
  rows: InviteModel.Entity[] = [];
  loading = false;

  @ViewChild('modal') modal: ModalInvitesComponent;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly inviteService: InviteService,
    private readonly alertService: AlertService,
  ) {}

  ngOnInit() {
    this.fetch();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  fetch() {
    this.loading = true;
    this.inviteService
      .list()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.loading = false;
          this.rows = result.data ?? [];
        },
        error: () => (this.loading = false),
      });
  }

  new() {
    this.modal.show();
  }

  async revoke(id: string) {
    const confirmation = await this.alertService.confirm({
      title: 'Revogar convite?',
      text: 'A pessoa não vai mais conseguir usar esse link para entrar.',
    });

    if (!confirmation.isConfirmed) return;

    this.inviteService
      .revoke(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.fetch(),
        error: (err) => {
          this.alertService.alertError(err, 'Não foi possível revogar o convite');
        },
      });
  }

  onSaved() {
    this.fetch();
  }

  statusLabel(invite: InviteModel.Entity): string {
    switch (invite.status) {
      case 'accepted':
        return 'Aceito';
      case 'revoked':
        return 'Revogado';
      case 'expired':
        return 'Expirado';
      default:
        return 'Pendente';
    }
  }

  roleLabel(invite: InviteModel.Entity): string {
    return invite.role_type === InviteModel.RoleTypeEnum.ADMIN ? 'Responsável' : 'Funcionário';
  }
}
