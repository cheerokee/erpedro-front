import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin, map, Observable, of, switchMap, take } from 'rxjs';

import { getAuthenticatedUser } from '../../../../../@core/utils/get-authenticated-user.helper';
import { AuthenticatedUser } from '../../../../../@core/services/auth.service';
import { AlertService } from '../../../../../@core/services/alert.service';
import { ResultModel } from '../../../../../@core/models/result.model';
import { SharedModule } from '../../../../../@shared/shared.module';

import { BaptismService } from '../../../../../@core/modules/parishioner/services/baptism.service';
import { BaptismGodparentService } from '../../../../../@core/modules/parishioner/services/baptism-godparent.service';
import { BaptismModel } from '../../../../../@core/modules/parishioner/entities/baptism.model';
import { CompanySelectorComponent } from '../../../../../@shared/components/selectors/company-selector/company-selector.component';
import { CompanyModel } from '../../../../../@core/modules/company/entities/company.model';
import { CustomerSelectorComponent } from '../../../../../@shared/components/selectors/customer-selector/customer-selector.component';
import { CustomerModel } from '../../../../../@core/modules/general/entities/customer.model';
import {
  BaptismGodparentRow,
  GodparentsFormListComponent,
} from '../godparents-form-list/godparents-form-list.component';

export type FormDataBaptism = BaptismModel.JsonProps;

@Component({
  selector: 'app-form-baptisms',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
  imports: [
    SharedModule,
    CustomerSelectorComponent,
    CompanySelectorComponent,
    GodparentsFormListComponent,
  ],
})
export class FormComponent implements OnChanges, OnInit {
  form: FormGroup;
  authenticatedUser: AuthenticatedUser;
  saving = false;

  companyId: string | null = null;
  godparents: BaptismGodparentRow[] = [];

  @Input() id: string;
  @Output() onSave = new EventEmitter<void>();

  @ViewChild('companySelector') companySelectorRef: CompanySelectorComponent;
  @ViewChild('parishionerSelector')
  parishionerSelectorRef: CustomerSelectorComponent;

  // ids dos padrinhos já existentes no backend no momento em que o form foi
  // carregado — usado só pra diff no submit() (syncGodparents), mesmo padrão
  // de originalRepresentations em features/admin/users (AI_CONTEXT §3.7).
  private originalGodparentIds: string[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private baptismService: BaptismService,
    private baptismGodparentService: BaptismGodparentService,
    private alertService: AlertService,
    private cdr: ChangeDetectorRef,
  ) {
    this.define();
  }

  ngOnInit() {
    this.authenticatedUser = getAuthenticatedUser();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes['id'] &&
      changes['id'].previousValue !== changes['id'].currentValue
    ) {
      if (this.id) {
        this.load();
      } else {
        this.default();
      }
    }
  }

  define() {
    this.form = this.formBuilder.group({
      id: [null],
      baptism_place: [null, Validators.required],
      baptism_date: [null, Validators.required],
      observation: [null],
      parishioner_id: [null, Validators.required],
      company_id: [null, Validators.required],
    });

    this.default();
  }

  default() {
    this.companyId = null;
    this.godparents = [];
    this.originalGodparentIds = [];

    this.form.setValue({
      id: null,
      baptism_place: null,
      baptism_date: null,
      observation: null,
      parishioner_id: null,
      company_id: null,
    });
  }

  onGodparentsChange(rows: BaptismGodparentRow[]) {
    this.godparents = rows;
  }

  load() {
    const obs$: Observable<ResultModel<BaptismModel.JsonProps>> =
      this.baptismService.get(this.id);

    obs$.pipe(take(1)).subscribe({
      next: (result) => {
        if (result.success && result.data) {
          const { company, parishioner, ...otherData } = result.data;

          this.companyId = otherData.company_id ?? company?.id ?? null;
          // Capturado antes do detectChanges() abaixo — o reset do
          // parishioner-selector (disparado por ele) zera parishioner_id no
          // próprio form via onParishionerSelected(null), então reler
          // form.get('parishioner_id').value depois do detectChanges() já
          // pegaria null em vez do valor carregado.
          const parishionerId =
            otherData.parishioner_id ?? parishioner?.id ?? null;

          this.form.setValue({
            id: otherData.id,
            baptism_place: otherData.baptism_place ?? null,
            baptism_date: otherData.baptism_date ?? null,
            observation: otherData.observation ?? null,
            parishioner_id: parishionerId,
            company_id: this.companyId,
          });

          // Força o reset automático do parishioner-selector (dispara via
          // ngOnChanges quando o [companyId] muda, ver AI_CONTEXT §3.2) a
          // acontecer antes dos autoset explícitos abaixo, senão ele pode
          // sobrescrever a pré-seleção correta com null.
          this.cdr.detectChanges();

          if (this.companyId) this.companySelectorRef?.autoset(this.companyId);
          if (parishionerId)
            this.parishionerSelectorRef?.autoset(parishionerId);

          this.loadGodparents(otherData.id);
        }
      },
      error: () => {
        this.alertService.alert({
          title: 'Ops, houve um erro!',
          text: 'Não foi possível carregar o registro',
          icon: 'error',
          timer: 3000,
        });
      },
    });
  }

  /** Backend já traz `godparent.company` (ver front/@core/.../baptism-godparent.service.ts)
   * — monta as linhas direto, sem chamada extra por padrinho. */
  private loadGodparents(baptismId: string) {
    this.baptismGodparentService
      .listByBaptism(baptismId)
      .pipe(take(1))
      .subscribe({
        next: (result) => {
          const rows: BaptismGodparentRow[] = (result.data ?? []).map(
            (item: any) => ({
              id: item.id,
              godparent_id: item.godparent_id ?? item.godparent?.id,
              godparent_name: item.godparent?.name ?? '-',
              company_name: item.godparent?.company?.name ?? '-',
              course_date: item.course_date ?? undefined,
              course_hours: item.course_hours ?? undefined,
              course_place: item.course_place ?? undefined,
            }),
          );

          this.godparents = rows;
          this.originalGodparentIds = rows
            .map((row) => row.id)
            .filter((id): id is string => !!id);
        },
      });
  }

  /** Client-orchestrated, mesmo espírito de syncRepresentations em
   * features/admin/users (AI_CONTEXT §7): sem endpoint de "definir todos os
   * padrinhos de uma vez", cada linha nova vira um POST e cada padrinho
   * removido vira um DELETE. Não é atômico, e não há UPDATE — editar curso
   * de um padrinho já adicionado significa remover e readicionar (mesma
   * simplificação de syncRepresentations, que também só cria/remove). */
  private syncGodparents(
    baptismId: string,
    rows: BaptismGodparentRow[],
  ): Observable<any> {
    const currentIds = rows.map((row) => row.id).filter(Boolean);
    const removedIds = this.originalGodparentIds.filter(
      (id) => !currentIds.includes(id),
    );
    const toCreate = rows.filter((row) => !row.id);

    const requests: Observable<any>[] = [
      ...toCreate.map((row) =>
        this.baptismGodparentService.create({
          baptism_id: baptismId,
          godparent_id: row.godparent_id,
          course_date: row.course_date,
          course_hours: row.course_hours,
          course_place: row.course_place,
        } as any),
      ),
      ...removedIds.map((id) => this.baptismGodparentService.delete(id)),
    ];

    return requests.length > 0 ? forkJoin(requests) : of(null);
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const data: FormDataBaptism = { ...this.form.value };
    // company_id é enviado normalmente (CreateBaptismDto/UpdateBaptismDto
    // aceitam, igual Customer/Employee) — pra usuário comum (tenant
    // resolvido) o backend ignora e sempre stampa a partir do próprio
    // contexto (BaseCrudService.tenantStamp); pra superadmin (sem tenant
    // resolvido) é o único jeito de informar em qual paróquia o batismo está
    // sendo registrado, já que tenantStamp não faz nada nesse caso.

    const existingId = data.id;
    delete data.id;

    this.saving = true;

    const godparents = this.godparents;
    const save$: Observable<ResultModel<any>> = existingId
      ? this.baptismService.update(existingId, data)
      : this.baptismService.create(data);

    // O batismo precisa existir antes dos padrinhos (FK baptism_id) — na
    // criação, o id só existe depois da resposta do create(); na edição, já
    // é o existingId. Mesma ordem de syncRepresentations (só roda depois do
    // userId existir), ver AI_CONTEXT §3.7 do front.
    save$
      .pipe(
        switchMap((result) => {
          const baptismId = existingId ?? (result.data as any)?.id;
          return this.syncGodparents(baptismId, godparents).pipe(
            map(() => result),
          );
        }),
        take(1),
      )
      .subscribe({
        next: () => {
          this.saving = false;
          this.alertService.alert({
            title: 'Sucesso',
            text: 'Registro salvo com sucesso',
            icon: 'success',
            timer: 3000,
          });
          this.default();
          this.onSave.emit();
        },
        error: () => {
          this.saving = false;
          this.alertService.alert({
            title: 'Ops, houve um erro!',
            text: 'Não foi possível cadastrar ou atualizar o registro',
            icon: 'error',
            timer: 3000,
          });
        },
      });
  }

  onCompanySelected(entity: CompanyModel.Entity | null) {
    this.companyId = entity?.id ?? null;
    this.form.get('company_id').setValue(entity?.id ?? null);
    this.form.get('company_id').markAsTouched();
    this.form.get('parishioner_id').setValue(null);
  }

  onParishionerSelected(entity: CustomerModel.Entity | null) {
    this.form.get('parishioner_id').setValue(entity?.id ?? null);
    this.form.get('parishioner_id').markAsTouched();
  }
}
