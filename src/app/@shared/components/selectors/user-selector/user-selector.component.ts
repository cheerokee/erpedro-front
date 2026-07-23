import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {
  Select2Data,
  Select2Module,
  Select2SearchEvent,
  Select2UpdateEvent,
} from 'ng-select2-component';
import { Subject, switchMap, take, takeUntil } from 'rxjs';

import { SharedModule } from '../../../shared.module';
import { UserService } from '../../../../@core/modules/account/services/user.service';
import { UserModel } from '../../../../@core/modules/account/entities/user.model';
import { RoleModel } from '../../../../@core/modules/acl/entities/role.model';

@Component({
  selector: 'app-user-selector',
  templateUrl: './user-selector.component.html',
  styleUrls: ['./user-selector.component.scss'],
  imports: [SharedModule, Select2Module],
})
export class UserSelectorComponent implements OnInit, OnChanges, OnDestroy {
  @Input() placeholder: string = 'Selecione um usuário';
  /** Restringe a busca a usuários com pelo menos um desses tipos de role. */
  @Input() roleTypes: RoleModel.RoleTypeEnum[] = [];
  /** Restringe a busca a usuários com pelo menos uma dessas roles. */
  @Input() roleIds: string[] = [];
  @Output() selected = new EventEmitter<UserModel.Entity | null>();

  data: Select2Data = [];
  value: string | null = null;
  isLoading: boolean = false;

  private users: UserModel.Entity[] = [];
  private readonly searchTerm$ = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  constructor(private readonly userService: UserService) {}

  ngOnInit() {
    this.searchTerm$
      .pipe(
        switchMap((q) =>
          this.userService.byLike(q, 20, this.roleTypes, this.roleIds),
        ),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (result) => {
          this.isLoading = false;
          this.setUsers(result.data ?? []);
        },
        error: () => {
          this.isLoading = false;
        },
      });

    this.fetch('');
  }

  ngOnChanges(changes: SimpleChanges) {
    const filterChanged =
      (changes['roleTypes'] && !changes['roleTypes'].firstChange) ||
      (changes['roleIds'] && !changes['roleIds'].firstChange);

    if (filterChanged) {
      this.value = null;
      this.setUsers([]);
      this.selected.emit(null);
      this.fetch('');
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearch(event: Select2SearchEvent) {
    this.fetch((event.search ?? '').toString());
  }

  onUpdate(event: Select2UpdateEvent) {
    this.value = (event.value as string) ?? null;

    const user = this.users.find((user) => user.id === event.value) ?? null;

    this.selected.emit(user);
  }

  /** Preseleciona um usuário por id (uso em telas de edição). */
  autoset(id: string) {
    if (!id) return;

    this.userService
      .get(id)
      .pipe(take(1))
      .subscribe({
        next: (result) => {
          if (!result.data) return;

          const entity = UserModel.Entity.toEntity(result.data);

          this.setUsers([
            entity,
            ...this.users.filter((user) => user.id !== result.data.id),
          ]);
          this.value = result.data.id;
          this.selected.emit(entity);
        },
      });
  }

  clear() {
    this.value = null;
    this.selected.emit(null);
  }

  private fetch(q: string) {
    this.isLoading = true;
    this.searchTerm$.next(q);
  }

  private setUsers(users: UserModel.Entity[]) {
    this.users = users;
    this.data = users.map((user) => ({
      id: user.id,
      value: user.id,
      label: user.name ? `${user.name} (${user.email})` : user.email,
    }));
  }
}
