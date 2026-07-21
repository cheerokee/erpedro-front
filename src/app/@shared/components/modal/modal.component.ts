import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import {
  ChangeDetectorRef,
  Component,
  ContentChild,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  Output,
  ViewChild,
} from '@angular/core';

export enum ModalDismissCustomReasons {
  BACKDROP_CLICK = 0,
  ESC = 1,
  CROSS_CLICK = 2,
  CANCEL = 3,
  SUBMIT = 4,
  UNKNOWN = 5,
}

@Component({
  selector: 'modal-header',
  template: `<ng-content>card-header</ng-content>`,
})
export class ModalHeader {}

@Component({
  selector: 'modal-body',
  template: `<ng-content>card-body</ng-content>`,
})
export class ModalBody {}

@Component({
  selector: 'modal-footer',
  template: `<ng-content>card-footer</ng-content>`,
})
export class ModalFooter {}

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
})
export class ModalComponent {
  private modalService = inject(NgbModal);

  modalRef: NgbModalRef;

  modalDismissCustomReasons = ModalDismissCustomReasons;
  hasHeaderContent = false;
  hasBodyContent = false;
  hasFooterContent = false;

  @Input() size: 'sm' | 'lg' | 'xl' | string;
  @Input() animation: boolean = true;
  @Input() backdrop: boolean = true;
  @Input() scrollable: boolean = false;

  /**
   * If true modal will always be displayed in fullscreen mode.
   * For values like 'md' it means that modal will be displayed in fullscreen mode only if the viewport width is below 'md'.
   * For custom strings (ex. when passing 'mysize') it will add a 'modal-fullscreen-mysize-down' class.
   * If not specified will be false.
   */
  @Input() fullscreen: 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | boolean | string =
    false;
  @Output() onHide = new EventEmitter<ModalDismissCustomReasons>();

  @ViewChild('contentElement') contentElement: ElementRef;
  @ContentChild(ModalHeader) headerRef?: ModalHeader;
  @ContentChild(ModalBody) bodyRef?: ModalBody;
  @ContentChild(ModalFooter) footerRef?: ModalFooter;

  constructor(private cdr: ChangeDetectorRef) {}

  ngAfterContentInit(): void {
    this.hasHeaderContent = !!this.headerRef;
    this.hasBodyContent = !!this.bodyRef;
    this.hasFooterContent = !!this.footerRef;
  }

  show() {
    this.modalRef = this.modalService.open(this.contentElement, {
      ariaLabelledBy: 'modal-basic-title',
      backdrop: this.backdrop,
      size: this.size,
      animation: this.animation,
      scrollable: this.scrollable,
      fullscreen: this.fullscreen,
    });

    this.modalRef.result.then(
      (result) => {
        this.onHide.emit(this.getDismissReason(result));
      },
      (reason) => {
        this.onHide.emit(this.getDismissReason(reason));
      },
    );
  }

  hide(reason: ModalDismissCustomReasons = ModalDismissCustomReasons.UNKNOWN) {
    if (this.modalRef) {
      this.modalRef.dismiss(reason);
    }
  }

  private getDismissReason(reason: any): ModalDismissCustomReasons {
    let customReason = ModalDismissCustomReasons.UNKNOWN;

    if (Object.values(ModalDismissCustomReasons).includes(reason)) {
      customReason = reason;
    }

    return customReason;
  }
}
