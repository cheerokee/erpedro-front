# AI_CONTEXT.md — Frontend

> Documento de referência para qualquer IA/dev que for implementar novas telas neste repositório.
> Reflete o estado real do código (não um ideal aspiracional). Se o código divergir deste documento, **o código manda** — atualize este arquivo.
> Se o arquivo CLAUDE.local.md não for encontrado na raiz desse projeto, peça para solicitar esse arquivo ao DEV responsável, um arquivo exemplo está disponibilizado CLAUDE_EXAMPLE.local.md
> Complementa o `AI_CONTEXT.md` do backend e o `PRODUCT_CONTEXT.md` — o caminho para esses arquivos estão em CLAUDE.local.md, leia-os primeiro para entender o domínio (paróquia / paroquiano / funcionário) antes de implementar qualquer tela.

## 1. Stack

- Angular 21
- Standalone components (padrão do Angular 21 — sem `NgModule`)
- Zoneless change detection (padrão do Angular 21) — **[confirmar]** se o projeto manteve isso
- Signals para estado (`signal`, `computed`, `linkedSignal`, signal inputs/outputs)
- Control flow nativo (`@if` / `@for` / `@switch`) — nunca `*ngIf` / `*ngFor` em código novo. Todo `@for` exige `track`.
- `httpResource()` para leituras simples — **[confirmar]** se o projeto usa isso ou um service tradicional com `HttpClient` + RxJS
- UI kit / estilos: Bootstrap, via um **template administrativo** de terceiros (não construído do zero) 
- Test runner: Karma/Jasmine

### 1.1 Template administrativo de terceiros

- Nome/origem do template: Cuba Template https://angular-cuba-doc.vercel.app/
- O que o template já fornece "pronto" (não reimplementar): layout com sidebar/topbar, cards, tabelas, formulários estilizados, ícones, dashboard de exemplo
- O projeto já tem um **starterkit** do template integrado ao código-fonte (dentro de `src/`). Além disso existe uma **cópia completa do template original** (com exemplos de todos os componentes), mantida **fora do repositório**, como biblioteca de referência para migrar componentes ainda não usados no starterkit.
- O caminho local dessa cópia é pessoal/por máquina — está documentado em `CLAUDE.local.md` (arquivo não versionado), não aqui.
- Antes de criar um componente do zero, verificar se ele já existe no starterkit (`src/`) ou na cópia de referência do template.
- **Nunca copiar o código da cópia de referência ao pé da letra** — ela provavelmente segue padrões mais antigos do Angular (NgModules, `*ngIf`, zone.js). Adaptar para os padrões deste projeto (seção 1: standalone, `@if`/`@for`, signals, zoneless).

## 2. Arquitetura / estrutura de pastas (sugestão inicial — ajustar conforme o projeto crescer)

```
src/app/
  @core/                  # serviços singleton, interceptors, guards
    interceptors/
    guards/
    services/
    modules/     # entidades separadas por módulos 
  @shared/                # componentes/pipes/directives reutilizáveis entre features
    components/
    pipes/
  features/
    <feature>/
      _components/        # componentes específicos da feature
      _services/
      _models/
      <feature>.page.ts
      <feature>.scss
      <feature>.routes.ts
  app.routes.ts
  app.config.ts
```

Manter a separação `core` / `shared` / `features` desde o início evita reorganizar depois que o projeto crescer.

## 3. Padrões de componente

- **[preencher]** `ChangeDetectionStrategy.OnPush` em todo componente novo? (recomendado, principalmente combinado com zoneless)
- **[preencher]** Convenção container/presentational, ou componentes "espertos" por padrão?
- Nomenclatura: `nome-da-tela.page.ts` para componentes de rota, `nome-do-componente.component.ts` para os demais.

### 3.1 Componentes de seleção assíncrona (`@shared/components/selectors/`)

Padrão para inputs de busca (`ng-select2-component`) que buscam no backend conforme o usuário digita — introduzido em `company-selector`:

- `<select2 [customSearchEnabled]="true" ...>` com `(search)` emitindo pro componente, que empurra o termo digitado num `Subject` interno e usa `switchMap` pro `<entidade>Service.byLike(q)` (cancela automaticamente a busca anterior se o usuário continuar digitando).
- Carga inicial (sem termo) já dispara `byLike('')`, trazendo os N primeiros registros do backend — não fica esperando o primeiro caractere.
- Pré-seleção pra telas de edição: método público `autoset(id)` (chamado via `@ViewChild` pelo componente pai) que busca o registro por id (`service.get(id)`) e garante que ele apareça no `data`/`value` do `<select2>` mesmo que não esteja entre os N primeiros trazidos pelo `byLike`.
- Seleção do usuário é emitida via `@Output() selected` com a entidade completa (não só o id) — quem usa o componente decide o que fazer (setar num `FormControl`, etc.).
- **Não implementa `ControlValueAccessor`** (sem precedente disso no projeto ainda) — não dá pra usar `formControlName` direto no `<app-company-selector>`, só `@Output()`/método público. Se surgir a necessidade de um form usar `formControlName` diretamente no seletor, avaliar introduzir CVA nesse momento (o próprio `<select2>` já suporta, via auto-registro em `NgControl` — ver `ng-select2-component`).
- `Select2` não expõe `valueChange`, então `[(value)]` (banana-in-a-box) não funciona sem `ngModel`/`formControl`; usar `[value]` (one-way) e atualizar a propriedade do componente host imperativamente — o setter interno do `<select2>` já resincroniza a UI.

## 4. Comunicação com o backend

- O backend expõe **REST** (escrita) e **GraphQL** (somente leitura/listagem) — ver seção 2 do `AI_CONTEXT.md` do backend.
- Toda resposta REST vem envelopada no formato `Result` (`{ message, success, data, error }`). O service HTTP do frontend deve desembrulhar isso de forma **centralizada** (ex. um `HttpInterceptorFn` ou um wrapper único) — nenhuma tela deve acessar `.data` manualmente.
- Autenticação é Bearer JWT — o token deve ser anexado via interceptor central, nunca manualmente em cada request.
- A URL base da API fica no arquivo enviroment.ts dentro de src/environments de acordo com o ambiente adotado.
- O Cliente GraphQL usado para queries de listagem vai ser feito com Apollo Angular.

## 5. Formulários

- Reactive Forms tradicional ou Signal Forms (ainda experimental no Angular 21 — se optar por essa API, documentar aqui que é experimental e pode quebrar em upgrades de versão).
- Validação client-side deve espelhar as regras dos DTOs do backend (`create-*.dto.ts` / `update-*.dto.ts`), para o usuário não descobrir um erro de validação só depois do submit.
- **Validação cross-field (ex. confirmação de senha):** usar o `ValidatorFn` `passwordsMatchValidator()` em `@shared/validators/passwords-match.validator.ts`, aplicado no `FormGroup` pai (via `setValidators`) — ele seta o erro manualmente no `FormControl` filho de confirmação (`confirmPassword.setErrors({ passwordMismatch: true })`), pois cross-field validation não é expressável num Validator de controle único. Usado em `sign-up.ts` e `reset-password.ts` (`features/auth/`).

## 6. Fluxos de negócio já mapeados (ver docs do backend)

As telas iniciais do sistema, segundo `docs/business/funcionarios.md` e `docs/business/paroquianos.md`, precisam cobrir o fluxo de onboarding:

1. Cadastro (email/senha)
2. Confirmação via link recebido por email
3. Tela de espera — usuário ainda não sabe se será funcionário ou paroquiano
4. Entrada como **funcionário** (via link do fundador/admin) ou como **paroquiano** (via link de um funcionário ou QR code)

Ao implementar essas telas, manter nomes de rota e conceitos alinhados ao `PRODUCT_CONTEXT.md` do backend (`Company`/`Employee`/`Customer`/`Role`).

### 6.1 Auto-cadastro público vinculado a company (link/QR code)

Fluxo alternativo ao item 4 acima: em vez de um funcionário "aceitar" o convite depois do cadastro genérico, o funcionário compartilha um link/QR code que já leva o paroquiano a um formulário público (`/sign-up-customer?company=<uuid>`) preenchendo `User` (login) e `Customer` (paroquiano) numa única submissão, já vinculado à `company`. Testado manualmente (curl + banco + Playwright) em 2026-07-18.

- **Contrato da URL:** `?company=<uuid-da-company>`, sem entidade de convite dedicada — o id da company vai direto na URL/QR code. Trade-off aceito: sem expiração/revogação de link.
- **Backend:**
  - `GET /v1/companies/:id/public-info` (`companies/controllers/company.controller.ts`) — sem `AuthGuard`, retorna só `{ id, name }` (nunca o resto dos dados da company).
  - `POST /v1/customers/self-register` (`general/controllers/customer.controller.ts`, DTO `create-customer-self-register.dto.ts`) — sem `AuthGuard`. `CustomerService.selfRegister()` primeiro confere se a `company` existe (falha rápido, sem criar nada), depois reaproveita `UsersService.create()` (mesma lógica de hash/role/e-mail do cadastro genérico) e por fim `CustomerService.create()` (já linkando `user_id`/`company_id`).
  - Para `CustomerService` enxergar `UsersService`/`CompanyService` entre módulos, `UserModule` e `CompaniesModule` agora exportam esses services, e `GeneralModule` os importa.
- **Frontend:** páginas novas em `features/auth/sign-up-customer/` e `features/auth/confirm-email/` (a segunda foi criada agora porque não existia — o backend já gerava o link `/confirm-email?token=...` no e-mail, mas a rota não existia no front, então a confirmação de e-mail estava quebrada mesmo pro cadastro genérico já existente). `CustomerService` (`@core/modules/general/services/customer.service.ts`) é o primeiro service desse módulo — só existiam entidades antes.
- **Fora de escopo (não implementado ainda):** tela do funcionário para gerar/exibir o link ou QR code; campos extras (endereço, catequese, matrimônio etc.) — quando entrarem, avaliar se cabem como novos `FormGroup`s dentro do mesmo formulário antes de criar infraestrutura genérica de "seções dinâmicas".

## 7. Débito técnico conhecido

- **`noImplicitReturns` desligado no `tsconfig.json`** (era `true`). O código do template (`sidebar.ts`, `search.ts`, `header-bookmark.ts`, `cart.service.ts`) usa `.filter()` como se fosse `.forEach()` — callbacks com efeito colateral e sem `return` em todos os caminhos — o que quebrava o build (`TS7030`). Em vez de reescrever esses componentes de terceiros, a flag foi afrouxada para todo o projeto. **A revisitar:** corrigir esses callbacks (trocar `.filter()` por `.forEach()`, cujo retorno era descartado) e reativar `noImplicitReturns`.
- **`CustomerService.selfRegister` (backend) não é transacional entre `User` e `Customer`** (ver [6.1](#61-auto-cadastro-público-vinculado-a-company-linkqr-code)) — são duas escritas em repositórios/módulos diferentes (`UsersService.create` depois `CustomerService.create`). Se a segunda falhar (ex. banco cai entre as duas chamadas), fica um `User` pendente órfão, sem `Customer`/company vinculados — caso raro, recuperável manualmente hoje. **A revisitar:** unificar numa transação real (`DataSource.transaction` cruzando os dois repositories) se o volume de auto-cadastro justificar.
- **`GET /v1/companies/by-like` (backend, novo endpoint pro `company-selector`) duplica lógica de filtro que já existe genericamente na query GraphQL `companyList`** (`BaseListArgs`/`BaseReportService.proccessFilter` já suportam filtro tipo `"like"` em qualquer campo, sem precisar de código novo por entidade). Foi implementado como endpoint REST dedicado — decisão tomada explicitamente com o usuário — pra manter `company.service.ts` (front) simples (uma chamada HTTP igual aos outros métodos do serviço, sem introduzir Apollo/GraphQL nesse ponto), mas isso diverge do padrão documentado na seção 4 (GraphQL = leitura/listagem, REST = escrita). Usa `Like` do TypeORM (não `ILike`, que é só Postgres — banco aqui é MySQL, já case-insensitive nas collations padrão). **A revisitar:** se surgir a necessidade de busca com autocomplete em outras entidades (funcionário, paroquiano etc.), decidir entre (a) generalizar esse `by-like` como endpoint reutilizável no `BaseCrudController`, ou (b) migrar pro padrão GraphQL genérico já existente, evitando reimplementar filtro por entidade.

## 8. Checklist mínimo para nova tela/feature

- [ ] Rota registrada em `<feature>.routes.ts`, lazy-loaded (`loadChildren`/`loadComponent`)
- [ ] Estados de loading e erro tratados explicitamente — nunca deixar a tela "travada" sem feedback visual
- [ ] Erros de API tratados via o wrapper `Result` (seção 4) — nunca `try/catch` solto e divergente por tela
- [ ] Formulário validando client-side as mesmas regras do DTO do backend correspondente
- [ ] Rota protegida? Guard de auth explícito adicionado
- [ ] Nomenclatura de arquivo seguindo o padrão da seção 3
- [ ] Se a tela introduziu um padrão novo (não copiado de nenhum outro lugar) ou um débito técnico conhecido, **atualizar este documento antes de finalizar**

## 9. Convenção de commits / branch

**[preencher se houver um padrão definido]**
