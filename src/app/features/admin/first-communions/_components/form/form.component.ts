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
import { NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import { forkJoin, map, Observable, of, switchMap, take } from 'rxjs';

import { getAuthenticatedUser } from '../../../../../@core/utils/get-authenticated-user.helper';
import { createTypeaheadSearch } from '../../../../../@core/utils/create-typeahead-search.helper';
import { AuthenticatedUser } from '../../../../../@core/services/auth.service';
import { AlertService } from '../../../../../@core/services/alert.service';
import { ResultModel } from '../../../../../@core/models/result.model';
import { SharedModule } from '../../../../../@shared/shared.module';

import { FirstCommunionService } from '../../../../../@core/modules/parishioner/services/first-communion.service';
import { FirstCommunionGodparentService } from '../../../../../@core/modules/parishioner/services/first-communion-godparent.service';
import { FirstCommunionModel } from '../../../../../@core/modules/parishioner/entities/first-communion.model';
import { CompanySelectorComponent } from '../../../../../@shared/components/selectors/company-selector/company-selector.component';
import { CompanyModel } from '../../../../../@core/modules/company/entities/company.model';
import { CustomerSelectorComponent } from '../../../../../@shared/components/selectors/customer-selector/customer-selector.component';
import { CustomerModel } from '../../../../../@core/modules/general/entities/customer.model';
import { EmployeeSelectorComponent } from '../../../../../@shared/components/selectors/employee-selector/employee-selector.component';
import { EmployeeModel } from '../../../../../@core/modules/general/entities/employee.model';
import {
  FirstCommunionGodparentRow,
  GodparentsFormListComponent,
} from '../godparents-form-list/godparents-form-list.component';
import {
  FirstCommunionAttachmentRow,
  FirstCommunionAttachmentsFormListComponent,
} from '../first-communion-attachments-form-list/first-communion-attachments-form-list.component';
import { FirstCommunionAttachmentService } from '../../../../../@core/modules/parishioner/services/first-communion-attachment.service';

export type FormDataFirstCommunion = FirstCommunionModel.JsonProps;

@Component({
  selector: 'app-form-first-communions',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
  imports: [
    SharedModule,
    NgbTypeahead,
    CustomerSelectorComponent,
    CompanySelectorComponent,
    EmployeeSelectorComponent,
    GodparentsFormListComponent,
    FirstCommunionAttachmentsFormListComponent,
  ],
})
export class FormComponent implements OnChanges, OnInit {
  form: FormGroup;
  authenticatedUser: AuthenticatedUser;
  saving = false;

  companyId: string | null = null;
  godparents: FirstCommunionGodparentRow[] = [];
  attachments: FirstCommunionAttachmentRow[] = [];

  // Sugestões de autocomplete (ver BaseCrudHttp.suggestions) — carregadas
  // por paróquia em loadSuggestions(), assim que companyId é conhecido.
  // Campo continua livre: [ngbTypeahead] só sugere, não restringe o valor.
  placeSuggestions: string[] = [];
  registryBookSuggestions: string[] = [];
  registryPageSuggestions: string[] = [];
  registryTermSuggestions: string[] = [];
  searchPlace = createTypeaheadSearch(() => this.placeSuggestions);
  searchRegistryBook = createTypeaheadSearch(() => this.registryBookSuggestions);
  searchRegistryPage = createTypeaheadSearch(() => this.registryPageSuggestions);
  searchRegistryTerm = createTypeaheadSearch(() => this.registryTermSuggestions);

  @Input() id: string;
  @Output() onSave = new EventEmitter<void>();

  @ViewChild('companySelector') companySelectorRef: CompanySelectorComponent;
  @ViewChild('parishionerSelector')
  parishionerSelectorRef: CustomerSelectorComponent;
  @ViewChild('celebrantSelector')
  celebrantSelectorRef: EmployeeSelectorComponent;

  // ids dos padrinhos já existentes no backend no momento em que o form foi
  // carregado — usado só pra diff no submit() (syncGodparents), mesmo padrão
  // de FormComponent de Batismo.
  private originalGodparentIds: string[] = [];

  // mesma ideia, mas pra documentos precisa também do título original (pra
  // detectar edição de título de uma linha existente — ver syncAttachments).
  private originalAttachmentIds: string[] = [];
  private originalAttachmentTitleById: Record<string, string> = {};

  constructor(
    private formBuilder: FormBuilder,
    private firstCommunionService: FirstCommunionService,
    private firstCommunionGodparentService: FirstCommunionGodparentService,
    private firstCommunionAttachmentService: FirstCommunionAttachmentService,
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
      first_communion_place: [null, Validators.required],
      first_communion_date: [null, Validators.required],
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
    this.attachments = [];
    this.originalAttachmentIds = [];
    this.originalAttachmentTitleById = {};
    this.placeSuggestions = [];
    this.registryBookSuggestions = [];
    this.registryPageSuggestions = [];
    this.registryTermSuggestions = [];

    this.form.setValue({
      id: null,
      first_communion_place: null,
      first_communion_date: null,
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

    // clear() acima às vezes reflete um (selected) tardio vindo do próprio
    // select2 — mesma race documentada em FormComponent de Batismo.
    setTimeout(() => {
      this.form.markAsUntouched();
      this.form.markAsPristine();
    }, 400);
  }

  // Carrega as sugestões de local/livro/folha/termo pra paróquia atual —
  // chamado ao selecionar a paróquia (criação) e ao final do load() (edição).
  private loadSuggestions() {
    if (!this.companyId) return;

    const companyId = this.companyId;
    forkJoin({
      place: this.firstCommunionService.suggestions('first_communion_place', companyId),
      registryBook: this.firstCommunionService.suggestions('registry_book', companyId),
      registryPage: this.firstCommunionService.suggestions('registry_page', companyId),
      registryTerm: this.firstCommunionService.suggestions('registry_term', companyId),
    }).subscribe({
      next: (result) => {
        this.placeSuggestions = result.place.data ?? [];
        this.registryBookSuggestions = result.registryBook.data ?? [];
        this.registryPageSuggestions = result.registryPage.data ?? [];
        this.registryTermSuggestions = result.registryTerm.data ?? [];
      },
    });
  }

  onGodparentsChange(rows: FirstCommunionGodparentRow[]) {
    this.godparents = rows;
  }

  onAttachmentsChange(rows: FirstCommunionAttachmentRow[]) {
    this.attachments = rows;
  }

  load() {
    const obs$: Observable<ResultModel<FirstCommunionModel.JsonProps>> =
      this.firstCommunionService.get(this.id);

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
            first_communion_place: otherData.first_communion_place ?? null,
            first_communion_date: otherData.first_communion_date ?? null,
            observation: otherData.observation ?? null,
            parishioner_id: parishionerId,
            company_id: this.companyId,
            registry_book: otherData.registry_book ?? null,
            registry_page: otherData.registry_page ?? null,
            registry_term: otherData.registry_term ?? null,
            celebrant_id: celebrantId,
          });

          // Força o reset automático do parishioner-selector/celebrant-selector
          // a acontecer antes dos autoset explícitos abaixo, senão ele pode
          // sobrescrever a pré-seleção correta com null.
          this.cdr.detectChanges();

          if (this.companyId) this.companySelectorRef?.autoset(this.companyId);
          if (parishionerId)
            this.parishionerSelectorRef?.autoset(parishionerId);
          if (celebrantId) this.celebrantSelectorRef?.autoset(celebrantId);

          this.loadGodparents(otherData.id);
          this.loadAttachments(otherData.id);
          this.loadSuggestions();
        }
      },
      error: (err) => {
        this.alertService.alertError(err, 'Não foi possível carregar o registro');
      },
    });
  }

  /** Backend já traz `godparent.company` — monta as linhas direto, sem
   * chamada extra por padrinho. Modelo híbrido: um registro sem `godparent`
   * (Customer) é uma pessoa externa, identificada por
   * `godparent_name`/`godparent_origin_parish` em texto livre. Diferente de
   * Batismo, padrinho é opcional aqui — pode não ter nenhum. */
  private loadGodparents(firstCommunionId: string) {
    this.firstCommunionGodparentService
      .listByFirstCommunion(firstCommunionId)
      .pipe(take(1))
      .subscribe({
        next: (result) => {
          const rows: FirstCommunionGodparentRow[] = (result.data ?? []).map(
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

  private loadAttachments(firstCommunionId: string) {
    this.firstCommunionAttachmentService
      .listByFirstCommunion(firstCommunionId)
      .pipe(take(1))
      .subscribe({
        next: (result) => {
          const rows: FirstCommunionAttachmentRow[] = (result.data ?? []).map((item) => ({
            id: item.id,
            title: item.attachment.title,
            fileName: item.attachment.s3_file.originalName,
            mimetype: item.attachment.s3_file.mimetype,
            s3FileId: item.attachment.s3_file.id,
          }));

          this.attachments = rows;
          this.originalAttachmentIds = rows
            .map((row) => row.id)
            .filter((id): id is string => !!id);
          this.originalAttachmentTitleById = Object.fromEntries(
            rows.filter((row) => row.id).map((row) => [row.id, row.title]),
          );
        },
      });
  }

  /** Client-orchestrated, mesmo espírito de FormComponent de Batismo — cada
   * linha nova (com `file`, sem `id`) vira um upload real (multipart), cada
   * removida vira um DELETE, e uma linha existente cujo título mudou vira um
   * PUT (só título é editável). Não é atômico. */
  private syncAttachments(
    firstCommunionId: string,
    rows: FirstCommunionAttachmentRow[],
  ): Observable<any> {
    const currentIds = rows.map((row) => row.id).filter(Boolean);
    const removedIds = this.originalAttachmentIds.filter(
      (id) => !currentIds.includes(id),
    );
    const toCreate = rows.filter((row) => !row.id && row.file);
    const toUpdate = rows.filter(
      (row) => row.id && row.title !== this.originalAttachmentTitleById[row.id],
    );

    const requests: Observable<any>[] = [
      ...toCreate.map((row) =>
        this.firstCommunionAttachmentService.create(firstCommunionId, row.title, row.file as File),
      ),
      ...toUpdate.map((row) =>
        this.firstCommunionAttachmentService.updateTitle(row.id as string, row.title),
      ),
      ...removedIds.map((id) => this.firstCommunionAttachmentService.delete(id)),
    ];

    return requests.length > 0 ? forkJoin(requests) : of(null);
  }

  /** Client-orchestrated, mesmo espírito de FormComponent de Batismo: sem
   * endpoint de "definir todos os padrinhos de uma vez", cada linha nova
   * vira um POST e cada padrinho removido vira um DELETE. Não é atômico, e
   * não há UPDATE — editar curso de um padrinho já adicionado significa
   * remover e readicionar. */
  private syncGodparents(
    firstCommunionId: string,
    rows: FirstCommunionGodparentRow[],
  ): Observable<any> {
    const currentIds = rows.map((row) => row.id).filter(Boolean);
    const removedIds = this.originalGodparentIds.filter(
      (id) => !currentIds.includes(id),
    );
    const toCreate = rows.filter((row) => !row.id);

    const requests: Observable<any>[] = [
      ...toCreate.map((row) =>
        this.firstCommunionGodparentService.create({
          first_communion_id: firstCommunionId,
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
      ...removedIds.map((id) => this.firstCommunionGodparentService.delete(id)),
    ];

    return requests.length > 0 ? forkJoin(requests) : of(null);
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const parishionerId = this.form.get('parishioner_id').value;
    const hasSelfGodparent = this.godparents.some(
      (row) => !row.is_external && row.godparent_id === parishionerId,
    );
    // Validado aqui, antes do POST — o backend também recusa isso
    // (FirstCommunionGodparentService.validate), mas só na criação do
    // padrinho, que acontece DEPOIS do registro já persistido (ver
    // syncGodparents). Barrar no client evita criar um registro "órfão" sem
    // padrinho quando o usuário comete esse erro.
    if (hasSelfGodparent) {
      this.alertService.alert({
        title: 'Ops, houve um erro!',
        text: 'O padrinho/madrinha não pode ser a mesma pessoa que está fazendo a primeira comunhão',
        icon: 'error',
        timer: 4000,
      });
      return;
    }

    const data: FormDataFirstCommunion = { ...this.form.value };
    // company_id é enviado normalmente — pra usuário comum (tenant
    // resolvido) o backend ignora e sempre stampa a partir do próprio
    // contexto; pra superadmin é o único jeito de informar em qual paróquia
    // o registro está sendo criado.

    const existingId = data.id;
    delete data.id;

    this.saving = true;

    const godparents = this.godparents;
    const attachments = this.attachments;
    const save$: Observable<ResultModel<any>> = existingId
      ? this.firstCommunionService.update(existingId, data)
      : this.firstCommunionService.create(data);

    // O registro precisa existir antes dos padrinhos/documentos (FK
    // first_communion_id) — na criação, o id só existe depois da resposta do
    // create(); na edição, já é o existingId.
    save$
      .pipe(
        switchMap((result) => {
          const firstCommunionId = existingId ?? (result.data as any)?.id;
          return forkJoin([
            this.syncGodparents(firstCommunionId, godparents),
            this.syncAttachments(firstCommunionId, attachments),
          ]).pipe(map(() => result));
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
    this.loadSuggestions();
  }

  onParishionerSelected(entity: CustomerModel.Entity | null) {
    this.form.get('parishioner_id').setValue(entity?.id ?? null);
    this.form.get('parishioner_id').markAsTouched();
  }

  onCelebrantSelected(entity: EmployeeModel.Entity | null) {
    this.form.get('celebrant_id').setValue(entity?.id ?? null);
  }
}
