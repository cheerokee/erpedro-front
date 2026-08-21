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

import { MarriageService } from '../../../../../@core/modules/parishioner/services/marriage.service';
import { MarriageWitnessService } from '../../../../../@core/modules/parishioner/services/marriage-witness.service';
import { MarriageModel } from '../../../../../@core/modules/parishioner/entities/marriage.model';
import { CompanySelectorComponent } from '../../../../../@shared/components/selectors/company-selector/company-selector.component';
import { CompanyModel } from '../../../../../@core/modules/company/entities/company.model';
import { CustomerSelectorComponent } from '../../../../../@shared/components/selectors/customer-selector/customer-selector.component';
import { CustomerModel } from '../../../../../@core/modules/general/entities/customer.model';
import { EmployeeSelectorComponent } from '../../../../../@shared/components/selectors/employee-selector/employee-selector.component';
import { EmployeeModel } from '../../../../../@core/modules/general/entities/employee.model';
import {
  WitnessesFormListComponent,
  MarriageWitnessRow,
} from '../witnesses-form-list/witnesses-form-list.component';
import {
  MarriageAttachmentRow,
  MarriageAttachmentsFormListComponent,
} from '../marriage-attachments-form-list/marriage-attachments-form-list.component';
import { MarriageAttachmentService } from '../../../../../@core/modules/parishioner/services/marriage-attachment.service';

export type FormDataMarriage = MarriageModel.JsonProps;

@Component({
  selector: 'app-form-marriages',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
  imports: [
    SharedModule,
    NgbTypeahead,
    CustomerSelectorComponent,
    CompanySelectorComponent,
    EmployeeSelectorComponent,
    WitnessesFormListComponent,
    MarriageAttachmentsFormListComponent,
  ],
})
export class FormComponent implements OnChanges, OnInit {
  form: FormGroup;
  authenticatedUser: AuthenticatedUser;
  saving = false;

  companyId: string | null = null;
  witnesses: MarriageWitnessRow[] = [];
  attachments: MarriageAttachmentRow[] = [];

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
  @ViewChild('husbandSelector') husbandSelectorRef: CustomerSelectorComponent;
  @ViewChild('wifeSelector') wifeSelectorRef: CustomerSelectorComponent;
  @ViewChild('celebrantSelector')
  celebrantSelectorRef: EmployeeSelectorComponent;

  // ids das testemunhas já existentes no backend no momento em que o form
  // foi carregado — usado só pra diff no submit() (syncWitnesses), mesmo
  // padrão de FormComponent de Batismo/Primeira Comunhão/Crisma.
  private originalWitnessIds: string[] = [];

  // mesma ideia, mas pra documentos precisa também do título original (pra
  // detectar edição de título de uma linha existente — ver syncAttachments).
  private originalAttachmentIds: string[] = [];
  private originalAttachmentTitleById: Record<string, string> = {};

  constructor(
    private formBuilder: FormBuilder,
    private marriageService: MarriageService,
    private marriageWitnessService: MarriageWitnessService,
    private marriageAttachmentService: MarriageAttachmentService,
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
      marriage_place: [null, Validators.required],
      marriage_date: [null, Validators.required],
      observation: [null],
      husband_id: [null, Validators.required],
      wife_id: [null, Validators.required],
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
    this.witnesses = [];
    this.originalWitnessIds = [];
    this.attachments = [];
    this.originalAttachmentIds = [];
    this.originalAttachmentTitleById = {};
    this.placeSuggestions = [];
    this.registryBookSuggestions = [];
    this.registryPageSuggestions = [];
    this.registryTermSuggestions = [];

    this.form.setValue({
      id: null,
      marriage_place: null,
      marriage_date: null,
      observation: null,
      husband_id: null,
      wife_id: null,
      company_id: null,
      registry_book: null,
      registry_page: null,
      registry_term: null,
      celebrant_id: null,
    });

    // company-selector/customer-selector mantêm rótulo exibido em estado
    // próprio (não é [(ngModel)]/formControlName) — setValue() acima não
    // limpa a exibição sozinho, precisa do clear() explícito. clear()
    // dispara (selected) -> onXSelected(null), que marca os controles como
    // touched; desfaz isso no fim pra não abrir o form já com erro de
    // validação visível.
    this.companySelectorRef?.clear();
    this.husbandSelectorRef?.clear();
    this.wifeSelectorRef?.clear();
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
      place: this.marriageService.suggestions('marriage_place', companyId),
      registryBook: this.marriageService.suggestions('registry_book', companyId),
      registryPage: this.marriageService.suggestions('registry_page', companyId),
      registryTerm: this.marriageService.suggestions('registry_term', companyId),
    }).subscribe({
      next: (result) => {
        this.placeSuggestions = result.place.data ?? [];
        this.registryBookSuggestions = result.registryBook.data ?? [];
        this.registryPageSuggestions = result.registryPage.data ?? [];
        this.registryTermSuggestions = result.registryTerm.data ?? [];
      },
    });
  }

  onWitnessesChange(rows: MarriageWitnessRow[]) {
    this.witnesses = rows;
  }

  onAttachmentsChange(rows: MarriageAttachmentRow[]) {
    this.attachments = rows;
  }

  load() {
    const obs$: Observable<ResultModel<MarriageModel.JsonProps>> =
      this.marriageService.get(this.id);

    obs$.pipe(take(1)).subscribe({
      next: (result) => {
        if (result.success && result.data) {
          const { company, husband, wife, celebrant, ...otherData } = result.data;

          this.companyId = otherData.company_id ?? company?.id ?? null;
          // Capturado antes do detectChanges() abaixo — o reset dos
          // seletores (disparado por ele) zera os campos no próprio form via
          // onHusbandSelected(null)/onWifeSelected(null), então reler
          // form.get('husband_id').value depois do detectChanges() já
          // pegaria null em vez do valor carregado. Mesmo raciocínio pro
          // celebrant, que também depende de [companyId].
          const husbandId = otherData.husband_id ?? husband?.id ?? null;
          const wifeId = otherData.wife_id ?? wife?.id ?? null;
          const celebrantId = otherData.celebrant_id ?? celebrant?.id ?? null;

          this.form.setValue({
            id: otherData.id,
            marriage_place: otherData.marriage_place ?? null,
            marriage_date: otherData.marriage_date ?? null,
            observation: otherData.observation ?? null,
            husband_id: husbandId,
            wife_id: wifeId,
            company_id: this.companyId,
            registry_book: otherData.registry_book ?? null,
            registry_page: otherData.registry_page ?? null,
            registry_term: otherData.registry_term ?? null,
            celebrant_id: celebrantId,
          });

          // Força o reset automático dos seletores dependentes de
          // [companyId] a acontecer antes dos autoset explícitos abaixo,
          // senão eles podem sobrescrever a pré-seleção correta com null.
          this.cdr.detectChanges();

          if (this.companyId) this.companySelectorRef?.autoset(this.companyId);
          if (husbandId) this.husbandSelectorRef?.autoset(husbandId);
          if (wifeId) this.wifeSelectorRef?.autoset(wifeId);
          if (celebrantId) this.celebrantSelectorRef?.autoset(celebrantId);

          this.loadWitnesses(otherData.id);
          this.loadAttachments(otherData.id);
          this.loadSuggestions();
        }
      },
      error: (err) => {
        this.alertService.alertError(err, 'Não foi possível carregar o registro');
      },
    });
  }

  /** Backend já traz `witness.company` — monta as linhas direto, sem
   * chamada extra por testemunha. Modelo híbrido: um registro sem `witness`
   * (Customer) é uma pessoa externa, identificada por
   * `witness_name`/`witness_origin_parish` em texto livre. Sem campos de
   * curso (diferente de padrinho). */
  private loadWitnesses(marriageId: string) {
    this.marriageWitnessService
      .listByMarriage(marriageId)
      .pipe(take(1))
      .subscribe({
        next: (result) => {
          const rows: MarriageWitnessRow[] = (result.data ?? []).map(
            (item: any) => {
              const isExternal = !item.witness && !item.witness_id;

              return {
                id: item.id,
                is_external: isExternal,
                witness_id: item.witness_id ?? item.witness?.id,
                witness_name: isExternal
                  ? (item.witness_name ?? '-')
                  : (item.witness?.name ?? '-'),
                witness_origin_parish: item.witness_origin_parish ?? undefined,
                company_name: item.witness?.company?.name ?? '-',
              };
            },
          );

          this.witnesses = rows;
          this.originalWitnessIds = rows
            .map((row) => row.id)
            .filter((id): id is string => !!id);
        },
      });
  }

  private loadAttachments(marriageId: string) {
    this.marriageAttachmentService
      .listByMarriage(marriageId)
      .pipe(take(1))
      .subscribe({
        next: (result) => {
          const rows: MarriageAttachmentRow[] = (result.data ?? []).map((item) => ({
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

  /** Client-orchestrated, mesmo espírito de FormComponent de Batismo/Primeira
   * Comunhão/Crisma — cada linha nova (com `file`, sem `id`) vira um upload
   * real (multipart), cada removida vira um DELETE, e uma linha existente
   * cujo título mudou vira um PUT (só título é editável). Não é atômico. */
  private syncAttachments(
    marriageId: string,
    rows: MarriageAttachmentRow[],
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
        this.marriageAttachmentService.create(marriageId, row.title, row.file as File),
      ),
      ...toUpdate.map((row) =>
        this.marriageAttachmentService.updateTitle(row.id as string, row.title),
      ),
      ...removedIds.map((id) => this.marriageAttachmentService.delete(id)),
    ];

    return requests.length > 0 ? forkJoin(requests) : of(null);
  }

  /** Client-orchestrated, mesmo espírito de syncGodparents dos outros
   * sacramentos: sem endpoint de "definir todas as testemunhas de uma vez",
   * cada linha nova vira um POST e cada testemunha removida vira um DELETE.
   * Não é atômico, e não há UPDATE — editar uma testemunha já adicionada
   * significa remover e readicionar. */
  private syncWitnesses(
    marriageId: string,
    rows: MarriageWitnessRow[],
  ): Observable<any> {
    const currentIds = rows.map((row) => row.id).filter(Boolean);
    const removedIds = this.originalWitnessIds.filter(
      (id) => !currentIds.includes(id),
    );
    const toCreate = rows.filter((row) => !row.id);

    const requests: Observable<any>[] = [
      ...toCreate.map((row) =>
        this.marriageWitnessService.create({
          marriage_id: marriageId,
          // Modelo híbrido: só um dos dois é enviado — Customer cadastrado
          // (witness_id) ou pessoa externa (nome/paróquia de origem).
          ...(row.is_external
            ? {
                witness_name: row.witness_name,
                witness_origin_parish: row.witness_origin_parish,
              }
            : { witness_id: row.witness_id }),
        } as any),
      ),
      ...removedIds.map((id) => this.marriageWitnessService.delete(id)),
    ];

    return requests.length > 0 ? forkJoin(requests) : of(null);
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const husbandId = this.form.get('husband_id').value;
    const wifeId = this.form.get('wife_id').value;

    // Mesma regra do backend (MarriageService.validateSpouses) — marido e
    // esposa não podem ser o mesmo paroquiano. Barrar no client dá feedback
    // imediato, sem esperar o POST falhar.
    if (husbandId && wifeId && husbandId === wifeId) {
      this.alertService.alert({
        title: 'Ops, houve um erro!',
        text: 'Marido e esposa não podem ser o mesmo paroquiano',
        icon: 'error',
        timer: 4000,
      });
      return;
    }

    const hasSpouseAsWitness = this.witnesses.some(
      (row) => !row.is_external && (row.witness_id === husbandId || row.witness_id === wifeId),
    );
    // Validado aqui, antes do POST — o backend também recusa isso
    // (MarriageWitnessService.validate), mas só na criação da testemunha,
    // que acontece DEPOIS do casamento já persistido (ver syncWitnesses).
    // Barrar no client evita criar um registro "órfão" sem testemunha
    // quando o usuário comete esse erro.
    if (hasSpouseAsWitness) {
      this.alertService.alert({
        title: 'Ops, houve um erro!',
        text: 'A testemunha não pode ser um dos nubentes',
        icon: 'error',
        timer: 4000,
      });
      return;
    }

    const data: FormDataMarriage = { ...this.form.value };
    // company_id é enviado normalmente — pra usuário comum (tenant
    // resolvido) o backend ignora e sempre stampa a partir do próprio
    // contexto; pra superadmin é o único jeito de informar em qual paróquia
    // o registro está sendo criado.

    const existingId = data.id;
    delete data.id;

    this.saving = true;

    const witnesses = this.witnesses;
    const attachments = this.attachments;
    const save$: Observable<ResultModel<any>> = existingId
      ? this.marriageService.update(existingId, data)
      : this.marriageService.create(data);

    // O casamento precisa existir antes das testemunhas/documentos (FK
    // marriage_id) — na criação, o id só existe depois da resposta do
    // create(); na edição, já é o existingId.
    save$
      .pipe(
        switchMap((result) => {
          const marriageId = existingId ?? (result.data as any)?.id;
          return forkJoin([
            this.syncWitnesses(marriageId, witnesses),
            this.syncAttachments(marriageId, attachments),
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
    this.form.get('husband_id').setValue(null);
    this.form.get('wife_id').setValue(null);
    this.loadSuggestions();
  }

  onHusbandSelected(entity: CustomerModel.Entity | null) {
    this.form.get('husband_id').setValue(entity?.id ?? null);
    this.form.get('husband_id').markAsTouched();
  }

  onWifeSelected(entity: CustomerModel.Entity | null) {
    this.form.get('wife_id').setValue(entity?.id ?? null);
    this.form.get('wife_id').markAsTouched();
  }

  onCelebrantSelected(entity: EmployeeModel.Entity | null) {
    this.form.get('celebrant_id').setValue(entity?.id ?? null);
  }
}
