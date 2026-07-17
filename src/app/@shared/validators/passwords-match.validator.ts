import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// Validator de FormGroup (não de FormControl): compara dois FormControls irmãos
// e seta o erro manualmente no controle de confirmação, pois cross-field validation
// não tem como ser expressa num Validator de controle único.
export function passwordsMatchValidator(
  passwordControlName: string = 'password',
  confirmPasswordControlName: string = 'confirmPassword',
): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const password = group.get(passwordControlName)?.value;
    const confirmPassword = group.get(confirmPasswordControlName)?.value;
    const confirmControl = group.get(confirmPasswordControlName);

    if (confirmPassword && password !== confirmPassword) {
      confirmControl?.setErrors({ passwordMismatch: true });
    } else if (confirmControl?.hasError('passwordMismatch')) {
      confirmControl?.setErrors(null);
    }

    return null;
  };
}
