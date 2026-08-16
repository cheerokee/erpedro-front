import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
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
import {
  BaptismAttachmentItem,
  BaptismAttachmentService,
} from '../../../../../@core/modules/parishioner/services/baptism-attachment.service';

const ALLOWED_MIMETYPES = ['image/png', 'image/jpeg', 'application/pdf'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

// Diferente de GodparentsFormListComponent (fica em memória, o pai sincroniza
// no submit()): aqui não dá pra "ficar em memória" — upload é uma chamada
// HTTP real com um arquivo binário, e precisa de um baptism_id que já
// exista no backend. Por isso este componente busca e sincroniza sozinho
// (chamada imediata por ação), em vez de emitir um array pro pai.
@Component({
  selector: 'app-baptism-attachments-form-list',
  templateUrl: './baptism-attachments-form-list.component.html',
  styleUrls: ['./baptism-attachments-form-list.component.scss'],
  imports: [SharedModule, FormsModule, ModalComponent, ModalHeader, ModalBody, ModalFooter],
})
export class BaptismAttachmentsFormListComponent implements OnChanges {
  @Input() baptismId: string | null = null;

  items: BaptismAttachmentItem[] = [];
  loading = false;
  uploading = false;

  title: string | null = null;
  selectedFile: File | null = null;
  selectedFileError: string | null = null;

  editingId: string | null = null;
  editTitle: string | null = null;

  @ViewChild('addModal') addModal: ModalComponent;

  constructor(
    private readonly service: BaptismAttachmentService,
    private readonly alertService: AlertService,
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['baptismId'] && this.baptismId) {
      this.fetch();
    }
  }

  get canUpload(): boolean {
    return !!this.title?.trim() && !!this.selectedFile && !this.selectedFileError;
  }

  fetch() {
    this.loading = true;
    this.service
      .listByBaptism(this.baptismId as string)
      .pipe(take(1))
      .subscribe({
        next: (result) => {
          this.loading = false;
          this.items = result.data ?? [];
        },
        error: (err) => {
          this.loading = false;
          this.alertService.alertError(err, 'Não foi possível carregar os documentos');
        },
      });
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

  upload() {
    if (!this.canUpload) return;

    this.uploading = true;
    this.service
      .create(this.baptismId as string, this.title.trim(), this.selectedFile)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.uploading = false;
          this.addModal.hide();
          this.clear();
          this.fetch();
        },
        error: (err) => {
          this.uploading = false;
          this.alertService.alertError(err, 'Não foi possível anexar o documento');
        },
      });
  }

  startEdit(item: BaptismAttachmentItem) {
    this.editingId = item.id;
    this.editTitle = item.attachment.title;
  }

  cancelEdit() {
    this.editingId = null;
    this.editTitle = null;
  }

  saveEdit(item: BaptismAttachmentItem) {
    if (!this.editTitle?.trim()) return;

    this.service
      .updateTitle(item.id, this.editTitle.trim())
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.editingId = null;
          this.fetch();
        },
        error: (err) => {
          this.alertService.alertError(err, 'Não foi possível atualizar o documento');
        },
      });
  }

  download(item: BaptismAttachmentItem) {
    this.service
      .getDownloadUrl(item.attachment.s3_file.id)
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

  async remove(item: BaptismAttachmentItem) {
    const confirmation = await this.alertService.confirm({
      title: 'Remover documento?',
      text: 'Essa ação não poderá ser desfeita.',
    });

    if (!confirmation.isConfirmed) return;

    this.service
      .delete(item.id)
      .pipe(take(1))
      .subscribe({
        next: () => this.fetch(),
        error: (err) => {
          this.alertService.alertError(err, 'Não foi possível remover o documento');
        },
      });
  }

  fileIcon(mimetype: string): string {
    return mimetype === 'application/pdf' ? 'fa-file-pdf-o' : 'fa-file-image-o';
  }

  private clear() {
    this.title = null;
    this.selectedFile = null;
    this.selectedFileError = null;
  }
}
