import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { InstallmentsComponent } from './installments.component';
import { FinancialInstallmentService } from '../../../../../../@core/modules/financial/services/financial-installment.service';
import { FinancialTransactionService } from '../../../../../../@core/modules/financial/services/financial-transaction.service';
import { FinancialBillService } from '../../../../../../@core/modules/financial/services/financial-bill.service';
import { AlertService } from '../../../../../../@core/services/alert.service';

@Component({
  selector: 'app-host',
  template: `
    <section [formGroup]="form">
      <app-form-installments-financial-bill #installments [billId]="null"></app-form-installments-financial-bill>
    </section>
  `,
  imports: [ReactiveFormsModule, InstallmentsComponent],
})
class HostComponent {
  form: FormGroup;
  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({ items: [[]], installments: [[]], total: [0] });
  }
}

describe('InstallmentsComponent — não permite remover a última parcela', () => {
  let fixture: ComponentFixture<HostComponent>;
  let component: InstallmentsComponent;
  let alertSpy: jasmine.SpyObj<AlertService>;

  beforeEach(async () => {
    alertSpy = jasmine.createSpyObj('AlertService', ['alert', 'confirm']);
    alertSpy.confirm.and.resolveTo({ isConfirmed: true } as any);

    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        { provide: FinancialInstallmentService, useValue: {} },
        { provide: FinancialTransactionService, useValue: {} },
        { provide: FinancialBillService, useValue: {} },
        { provide: AlertService, useValue: alertSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    component = fixture.debugElement.query(
      (de) => de.name === 'app-form-installments-financial-bill',
    ).componentInstance;
  });

  function addInstallment(amount: number) {
    component.addForm.setValue({ due_date: '2026-01-01', amount });
    component.add();
    fixture.detectChanges();
  }

  it('bloqueia a remoção quando só resta uma parcela', async () => {
    addInstallment(100);

    await component.remove(component.installments[0].id);
    fixture.detectChanges();

    expect(component.installments.length).toBe(1);
    expect(alertSpy.alert).toHaveBeenCalledTimes(1);
    expect(alertSpy.confirm).not.toHaveBeenCalled();
  });

  it('permite remover quando há mais de uma parcela', async () => {
    addInstallment(100);
    addInstallment(50);

    await component.remove(component.installments[0].id);
    fixture.detectChanges();

    expect(component.installments.length).toBe(1);
    expect(alertSpy.confirm).toHaveBeenCalledTimes(1);
  });
});
