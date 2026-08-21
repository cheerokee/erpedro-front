import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { take } from 'rxjs';

import { SharedModule } from '../../../../../@shared/shared.module';
import { AlertService } from '../../../../../@core/services/alert.service';
import {
  ModalBody,
  ModalComponent,
  ModalFooter,
  ModalHeader,
} from '../../../../../@shared/components/modal/modal.component';
import { ConfirmationAttachmentService } from '../../../../../@core/modules/parishioner/services/confirmation-attachment.service';

const ALLOWED_MIMETYPES = ['image/png', 'image/jpeg', 'application/pdf'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

// Vive em memória (sem persistir sozinho), mesmo contrato de
// BaptismAttachmentsFormListComponent — quem usa (FormComponent) decide
// quando sincronizar com o backend, no submit(), comparando com os
// documentos originais carregados no load(). Isso permite anexar já na
// criação do registro (antes de existir confirmation_id), não só na edição.
//
// "Editar" um documento já existente (com id) NÃO pode ser remover +
// readicionar (diferente de padrinho): o arquivo não fica em memória depois
// de enviado, só existe no S3. Por isso só o título é editável pra linhas
// existentes.
export interface ConfirmationAttachmentRow {
  // presente só quando a linha já existe no backend (carregada na edição) —
  // ausente numa linha recém-adicionada (ainda não enviada).
  id?: string;
  title: string;
  // presente só numa linha nova, ainda não enviada — é o que
  // FormComponent.syncAttachments manda no upload real.
  file?: File;
  // nome/tipo do arquivo pra exibir na tabela — de uma linha nova vem do
  // próprio File, de uma existente vem do S3FileEntity já carregado.
  fileName?: string;
  mimetype?: string;
  // só presente numa linha existente — usado só pra "Baixar".
  s3FileId?: string;
}

@Component({
  selector: 'app-confirmation-attachments-form-list',
  templateUrl: './confirmation-attachments-form-list.component.html',
  styleUrls: ['./confirmation-attachments-form-list.component.scss'],
  imports: [SharedModule, FormsModule, ModalComponent, ModalHeader, ModalBody, ModalFooter],
})
export class ConfirmationAttachmentsFormListComponent {
  @Input() data: ConfirmationAttachmentRow[] = [];
  @Output() dataChange = new EventEmitter<ConfirmationAttachmentRow[]>();

  title: string | null = null;
  selectedFile: File | null = null;
  selectedFileError: string | null = null;

  editingIndex: number | null = null;
  editTitle: string | null = null;

  @ViewChild('addModal') addModal: ModalComponent;
  @ViewChild('fileInput') fileInput: ElementRef<HTMLInputElement>;

  constructor(
    private readonly service: ConfirmationAttachmentService,
    private readonly alertService: AlertService,
  ) {}

  get canUpload(): boolean {
    return !!this.title?.trim() && !!this.selectedFile && !this.selectedFileError;
  }

  openAddModal() {
    this.clear();
    this.addModal.show();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.selectedFileError = null;
    this.selectedFile = null;

    if (!file) return;

    if (!ALLOWED_MIMETYPES.includes(file.type)) {
      this.selectedFileError = 'Formato não suportado — envie PNG, JPG, JPEG ou PDF';
      input.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      this.selectedFileError = 'Arquivo maior que 10MB';
      input.value = '';
      return;
    }

    this.selectedFile = file;
  }

  // Só adiciona na lista em memória — o upload de verdade só acontece no
  // submit() do form pai (FormComponent.syncAttachments), depois que o
  // registro (novo ou existente) já tem id garantido.
  add() {
    if (!this.canUpload) return;

    const row: ConfirmationAttachmentRow = {
      title: this.title.trim(),
      file: this.selectedFile,
      fileName: this.selectedFile.name,
      mimetype: this.selectedFile.type,
    };

    this.dataChange.emit([...this.data, row]);
    this.addModal.hide();
    this.clear();
  }

  startEdit(index: number) {
    this.editingIndex = index;
    this.editTitle = this.data[index].title;
  }

  cancelEdit() {
    this.editingIndex = null;
    this.editTitle = null;
  }

  saveEdit(index: number) {
    if (!this.editTitle?.trim()) return;

    const next = [...this.data];
    next[index] = { ...next[index], title: this.editTitle.trim() };
    this.dataChange.emit(next);
    this.editingIndex = null;
  }

  // Só faz sentido pra linha já existente (s3FileId vem do backend) — uma
  // linha nova ainda não tem nada pra baixar, o arquivo está só no browser.
  download(row: ConfirmationAttachmentRow) {
    if (!row.s3FileId) return;

    this.service
      .getDownloadUrl(row.s3FileId)
      .pipe(take(1))
      .subscribe({
        next: (result) => {
          window.open(result.data.url, '_blank');
        },
        error: (err) => {
          this.alertService.alertError(err, 'Não foi possível gerar o link de download');
        },
      });
  }

  async remove(index: number) {
    const confirmation = await this.alertService.confirm({
      title: 'Remover documento?',
      text: 'Essa ação não poderá ser desfeita.',
    });

    if (!confirmation.isConfirmed) return;

    const next = [...this.data];
    next.splice(index, 1);
    this.dataChange.emit(next);
  }

  fileIcon(mimetype?: string): string {
    return mimetype === 'application/pdf' ? 'fa-file-pdf-o' : 'fa-file-image-o';
  }

  private clear() {
    this.title = null;
    this.selectedFile = null;
    this.selectedFileError = null;
    // input[type=file] mantém o nome do arquivo exibido mesmo depois do
    // estado do componente ser limpo — precisa resetar o elemento nativo.
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }
}
