# CLAUDE.local.md (pessoal, não versionado)

A cópia completa do template administrativo está em:
/home/jonas/projetos/cuba/Template

Ao consultar um componente de lá que ainda não existe no projeto:
- Rode o Claude Code com `--add-dir` apontando pra essa pasta.
- NUNCA copie o código bruto de lá — o template provavelmente foi construído com padrões antigos do Angular (NgModules, *ngIf, zone.js, HttpClient com RxJS "na unha"). Adapte para os padrões deste projeto (seção 1/3 do AI_CONTEXT.md: standalone, @if/@for, signals, zoneless).

A documentação do Backend está disponível em:
/home/jonas/projetos/erpedro/back

Você pode consultar os arquivos e diretórios para poder saber sobre arquitetura e contexto:
- AI_CONTEXT.md
- PRODUCT_CONTEXT.md
- docs/business
- docs/technical
