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
import { EmployeeSelectorComponent } from '../../../../../@shared/components/selectors/employee-selector/employee-selector.component';
import { EmployeeModel } from '../../../../../@core/modules/general/entities/employee.model';
import {
  BaptismGodparentRow,
  GodparentsFormListComponent,
} from '../godparents-form-list/godparents-form-list.component';
import { BaptismAttachmentsFormListComponent } from '../baptism-attachments-form-list/baptism-attachments-form-list.component';

export type FormDataBaptism = BaptismModel.JsonProps;

@Component({
  selector: 'app-form-baptisms',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
  imports: [
    SharedModule,
    CustomerSelectorComponent,
    CompanySelectorComponent,
    EmployeeSelectorComponent,
    GodparentsFormListComponent,
    BaptismAttachmentsFormListComponent,
  ],
})
export class FormComponent implements OnChanges, OnInit {
  form: FormGroup;
  authenticatedUser: AuthenticatedUser;
  saving = false;
  downloadingCertificate = false;

  companyId: string | null = null;
  godparents: BaptismGodparentRow[] = [];

  @Input() id: string;
  @Output() onSave = new EventEmitter<void>();

  @ViewChild('companySelector') companySelectorRef: CompanySelectorComponent;
  @ViewChild('parishionerSelector')
  parishionerSelectorRef: CustomerSelectorComponent;
  @ViewChild('celebrantSelector')
  celebrantSelectorRef: EmployeeSelectorComponent;

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
      registry_book: [null],
      registry_page: [null],
      registry_term: [null],
      celebrant_id: [null],
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
      registry_book: null,
      registry_page: null,
      registry_term: null,
      celebrant_id: null,
    });

    // company-selector/customer-selector mantêm rótulo exibido em estado
    // próprio (não é [(ngModel)]/formControlName) — setValue() acima não
    // limpa a exibição sozinho, precisa do clear() explícito. clear()
    // dispara (selected) -> onCompanySelected(null), que marca os controles
    // como touched; desfaz isso no fim pra não abrir o form já com erro de
    // validação visível.
    this.companySelectorRef?.clear();
    this.parishionerSelectorRef?.clear();
    this.celebrantSelectorRef?.clear();
    this.form.markAsUntouched();
    this.form.markAsPristine();

    // clear() acima às vezes reflete um (selected) tardio (~250ms) vindo do
    // próprio select2 — a busca de opções (companies/by-like) que ainda
    // estava em voo quando o usuário selecionou e cancelou quase junto
    // termina depois, o componente reemite (selected) com o valor já nulo,
    // e onCompanySelected/onParishionerSelected marcam touched de novo
    // incondicionalmente. O valor em si não volta a ficar preenchido — só a
    // mensagem de validação piscaria — por isso reforça o untouched um
    // pouco depois. Não é 100% à prova de race, mas cobre o caso comum.
    setTimeout(() => {
      this.form.markAsUntouched();
      this.form.markAsPristine();
    }, 400);
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
          const { company, parishioner, celebrant, ...otherData } = result.data;

          this.companyId = otherData.company_id ?? company?.id ?? null;
          // Capturado antes do detectChanges() abaixo — o reset do
          // parishioner-selector (disparado por ele) zera parishioner_id no
          // próprio form via onParishionerSelected(null), então reler
          // form.get('parishioner_id').value depois do detectChanges() já
          // pegaria null em vez do valor carregado. Mesmo raciocínio pro
          // celebrant, que também depende de [companyId].
          const parishionerId =
            otherData.parishioner_id ?? parishioner?.id ?? null;
          const celebrantId = otherData.celebrant_id ?? celebrant?.id ?? null;

          this.form.setValue({
            id: otherData.id,
            baptism_place: otherData.baptism_place ?? null,
            baptism_date: otherData.baptism_date ?? null,
            observation: otherData.observation ?? null,
            parishioner_id: parishionerId,
            company_id: this.companyId,
            registry_book: otherData.registry_book ?? null,
            registry_page: otherData.registry_page ?? null,
            registry_term: otherData.registry_term ?? null,
            celebrant_id: celebrantId,
          });

          // Força o reset automático do parishioner-selector/celebrant-selector
          // (dispara via ngOnChanges quando o [companyId] muda, ver
          // AI_CONTEXT §3.2) a acontecer antes dos autoset explícitos abaixo,
          // senão ele pode sobrescrever a pré-seleção correta com null.
          this.cdr.detectChanges();

          if (this.companyId) this.companySelectorRef?.autoset(this.companyId);
          if (parishionerId)
            this.parishionerSelectorRef?.autoset(parishionerId);
          if (celebrantId) this.celebrantSelectorRef?.autoset(celebrantId);

          this.loadGodparents(otherData.id);
        }
      },
      error: (err) => {
        this.alertService.alertError(err, 'Não foi possível carregar o registro');
      },
    });
  }

  /** Backend já traz `godparent.company` (ver front/@core/.../baptism-godparent.service.ts)
   * — monta as linhas direto, sem chamada extra por padrinho. Modelo híbrido:
   * um registro sem `godparent` (Customer) é uma pessoa externa, identificada
   * por `godparent_name`/`godparent_origin_parish` em texto livre. */
  private loadGodparents(baptismId: string) {
    this.baptismGodparentService
      .listByBaptism(baptismId)
      .pipe(take(1))
      .subscribe({
        next: (result) => {
          const rows: BaptismGodparentRow[] = (result.data ?? []).map(
            (item: any) => {
              const isExternal = !item.godparent && !item.godparent_id;

              return {
                id: item.id,
                is_external: isExternal,
                godparent_id: item.godparent_id ?? item.godparent?.id,
                godparent_name: isExternal
                  ? (item.godparent_name ?? '-')
                  : (item.godparent?.name ?? '-'),
                godparent_origin_parish: item.godparent_origin_parish ?? undefined,
                company_name: item.godparent?.company?.name ?? '-',
                course_date: item.course_date ?? undefined,
                course_hours: item.course_hours ?? undefined,
                course_place: item.course_place ?? undefined,
              };
            },
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
          // Modelo híbrido: só um dos dois é enviado — Customer cadastrado
          // (godparent_id) ou pessoa externa (nome/paróquia de origem).
          ...(row.is_external
            ? {
                godparent_name: row.godparent_name,
                godparent_origin_parish: row.godparent_origin_parish,
              }
            : { godparent_id: row.godparent_id }),
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
        error: (err) => {
          this.saving = false;
          this.alertService.alertError(err, 'Não foi possível cadastrar ou atualizar o registro');
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

  onCelebrantSelected(entity: EmployeeModel.Entity | null) {
    this.form.get('celebrant_id').setValue(entity?.id ?? null);
  }

  // Só disponível com o registro já salvo (form.get('id').value) — o backend
  // busca o batismo por id (BaptismCertificateService.generate), não dá pra
  // gerar a partir de dados ainda não persistidos.
  downloadCertificate() {
    const id = this.form.get('id').value;
    if (!id) return;

    this.downloadingCertificate = true;
    this.baptismService
      .certificate(id)
      .pipe(take(1))
      .subscribe({
        next: (blob) => {
          this.downloadingCertificate = false;

          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `certidao-batismo-${id}.pdf`;
          link.click();
          URL.revokeObjectURL(url);
        },
        error: (err) => {
          this.downloadingCertificate = false;
          this.alertBlobError(err, 'Não foi possível gerar o certificado');
        },
      });
  }

  // responseType: 'blob' (certificate()) faz o Angular tratar o corpo do
  // erro também como Blob, não JSON — err.error.message (que
  // AlertService.alertError lê direto) vem undefined nesse caso. Decodifica
  // manualmente antes de mostrar o alerta.
  private async alertBlobError(err: any, fallbackText: string) {
    let message = fallbackText;

    if (err?.error instanceof Blob) {
      try {
        message = JSON.parse(await err.error.text())?.message ?? fallbackText;
      } catch {
        // corpo do erro não era JSON (ex.: falha de rede) — mantém o fallback
      }
    } else {
      message = err?.error?.message ?? fallbackText;
    }

    this.alertService.alert({
      title: 'Ops, houve um erro!',
      text: message,
      icon: 'error',
      timer: 3000,
    });
  }
}
