import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  NgbNav,
  NgbNavContent,
  NgbNavItem,
  NgbNavLink,
  NgbNavOutlet,
} from '@ng-bootstrap/ng-bootstrap';

import { ItemsComponent } from './items.component';

@Component({
  selector: 'app-host',
  template: `
    <div ngbNav #nav="ngbNav" [(activeId)]="active" class="nav">
      <div [ngbNavItem]="1">
        <a class="nav-link" ngbNavLink>Itens</a>
        <ng-template ngbNavContent>
          <section [formGroup]="form">
            <app-form-items-financial-bill #items [billId]="null" [companyId]="null"></app-form-items-financial-bill>
          </section>
        </ng-template>
      </div>
      <div [ngbNavItem]="2">
        <a class="nav-link" ngbNavLink>Parcelas</a>
        <ng-template ngbNavContent>
          <div>parcelas</div>
        </ng-template>
      </div>
    </div>
    <div [ngbNavOutlet]="nav"></div>
  `,
  imports: [
    ReactiveFormsModule,
    ItemsComponent,
    NgbNav,
    NgbNavItem,
    NgbNavLink,
    NgbNavOutlet,
    NgbNavContent,
  ],
})
class HostComponent {
  form: FormGroup;
  active = 1;
  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({ items: [[]], installments: [[]] });
  }
}

describe('ItemsComponent — mantém a lista ao trocar de aba (ngbNav destroyOnHide)', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('mantém o item após trocar de aba (ngbNav real) e voltar', () => {
    const itemsDebugEl = () =>
      fixture.debugElement.query((de) => de.name === 'app-form-items-financial-bill');

    let itemsComponent: ItemsComponent = itemsDebugEl().componentInstance;
    itemsComponent.addForm.setValue({
      service_id: 'service-1',
      quantity: 2,
      unit_price: 10,
      description: 'teste',
    });
    itemsComponent.add();
    fixture.detectChanges();

    expect(host.form.get('items').value.length).toBe(1);

    host.active = 2;
    fixture.detectChanges();

    host.active = 1;
    fixture.detectChanges();

    itemsComponent = itemsDebugEl().componentInstance;
    expect(itemsComponent.items.length).toBe(1);
    expect(host.form.get('items').value.length).toBe(1);
  });
});
