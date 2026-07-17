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

## 7. Débito técnico conhecido

- **`noImplicitReturns` desligado no `tsconfig.json`** (era `true`). O código do template (`sidebar.ts`, `search.ts`, `header-bookmark.ts`, `cart.service.ts`) usa `.filter()` como se fosse `.forEach()` — callbacks com efeito colateral e sem `return` em todos os caminhos — o que quebrava o build (`TS7030`). Em vez de reescrever esses componentes de terceiros, a flag foi afrouxada para todo o projeto. **A revisitar:** corrigir esses callbacks (trocar `.filter()` por `.forEach()`, cujo retorno era descartado) e reativar `noImplicitReturns`.

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
