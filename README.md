# Hashimoto Frota

**Atualização de 30/09/2026 — Filtros do Histórico (revisão final):** o painel recolhível começa diretamente em **Data inicial** e **Data final**, preenchidas com hoje e os seis dias anteriores. A consulta usa sempre a **data informada no registro**. As duas datas são obrigatórias. Não há ações “Sem data inicial/final”; somente ao tentar aplicar com data ausente ou inválida, o campo recebe borda laranja e mensagem específica. A tela volta aos campos, e a indicação desaparece ao corrigir. Motorista/responsável, placa, contrato, autor e tipo de manutenção aceitam várias seleções: por exemplo, Caxias ou Saquarema, combinadas com Eduardo ou Wallace. O seletor de autores mostra nome e sobrenome completos. Migração `202609300003_historico_multiplos.sql` aplicada no Supabase; consultas anteriores preservadas. **Disponível no código/Expo; não está no APK 0.1/8 já entregue.**

**Atualização de 30/09/2026 — Autoria no Histórico:** os cards de alocação e manutenção mostram **Lançado por: Nome**, inclusive fechados e para envios anteriores. O texto vem de `usuarios.nome` da conta que criou o envio, preserva nomes compostos e não acrescenta sobrenome ou login. Edições mantêm o autor original. A migração `202609300001_historico_autor.sql` adiciona a RPC `buscar_historico_com_autor` e já está aplicada no Supabase; a consulta antiga continua disponível. Disponível no código/Expo; o APK 0.1/8 já entregue ainda não contém essa exibição.

Aplicativo interno Android em React Native, Expo SDK 57, Expo Router e TypeScript, com PostgreSQL no Supabase e autenticação própria por nome de usuário. Interface inspirada no PDF fornecido, nas cores `#ff6200` e `#0b2c44`.

**Atualização de 25/09/2026 — Manutenção:** campo **Observação (opcional)** abaixo de Tipo de manutenção, com contador e máximo de **40 caracteres** na digitação, colagem, envio e banco. A informação é salva em `public.manutencoes.observacao`, reaparece na edição e nos detalhes do Histórico. A migração `202609250001_manutencao_observacao.sql` já está aplicada no Supabase. APKs anteriores continuam compatíveis e preservam a observação ao editar; o campo novo está disponível no código/Expo e no APK **0.1 · compilação 8**, gerado após autorização do usuário. Detalhes em [Manutenção e integração](docs/HASHI-APP-INTEGRACAO-HASH-WEB.md#74-manutenção).

APK **Hashi App 0.1 — compilação 8**, gerado em 25/09/2026: **23,4 MB**. Inclui Observação de até 40 caracteres na Manutenção, com gravação, edição e Histórico; preserva os seletores e a sugestão de último veículo. Arquivo `entrega/Hashi-App-0.1-b8.apk`; download e instruções em [Instalar no Android](docs/INSTALAR-ANDROID.md). Build com cache limpo, integridade e assinatura verificados. Instalação e uso em Android físico ainda não testados.

**Alocação — sugestão de veículo:** escolha o responsável e abra as placas. “Último veículo deste motorista” aparece acima de “Todos os veículos”, com modelo, data e ícone de histórico. Toque para confirmar; não há preenchimento automático. A sugestão usa a alocação salva mais recente pela data dentro do histórico que a conta pode consultar e exclui o registro atual na edição. Sem histórico ou conexão, a lista comum continua disponível. A consulta está instalada no Supabase; a funcionalidade existe desde a compilação 5 e sua apresentação foi reestruturada na compilação 7.

A marca nas telas usa a logo **Hashi App** abaixo do caminhão laranja. Para regenerar a imagem de abertura nativa, execute `node scripts/generate-splash.mjs`. Alterações nessa abertura exigem nova compilação do aplicativo; as logos das telas React aparecem ao recarregar o Expo.

## Abrir no computador

Para fazer uma cópia leve, abra `COPIAR-PROJETO.cmd`. O ZIP será criado em `copias/`, com código, imagens, configurações, migrações e `package-lock.json`. Caches, dependências instaladas, compilações e credenciais locais ficam de fora. O `.gitignore` não filtra cópias feitas pelo Explorador do Windows.

Depois de extrair o ZIP em outra pasta, execute `npm.cmd ci` para reinstalar as dependências e configure `.env` a partir de `.env.example`. As senhas protegidas em `.tools/` permanecem apenas na pasta original; o atalho de consulta dessas senhas depende desses arquivos locais.

Na pasta do projeto, pelo terminal PowerShell do VS Code:

```powershell
npm.cmd install
npm.cmd run web
```

Para Expo Go no Android:

```powershell
npm.cmd start
```

Computador e celular precisam estar na mesma rede durante o desenvolvimento. Use uma versão do Expo Go compatível com SDK 57, disponível em [expo.dev/go](https://expo.dev/go). O APK final usa o banco na nuvem e não precisa do computador.

O sufixo `.cmd` evita a restrição de scripts `.ps1` do PowerShell sem alterar configurações do Windows. O cache do npm fica em `.tools/npm-cache`.

Sem credenciais, a tela inicial oferece **Conhecer as telas** apenas no desenvolvimento. A demonstração usa poucas opções ilustrativas, tem uma faixa visível e guarda exemplos somente em memória. Ela não autentica usuários, não faz envios ao Supabase e não está disponível na compilação de produção.

## Supabase conectado e acesso por usuário

O projeto [Hashimoto Frota](https://supabase.com/dashboard/project/qxkhjlkexsjgkttdugqt) usa **somente usuário e senha**, sem e-mail, telefone ou contas no Supabase Auth. A migração `202609150003_acesso_por_usuario.sql` foi aplicada em 15/09/2026, preservando os IDs, senhas e envios das duas contas existentes e removendo as contas técnicas do Auth.

Consulte os usuários em **Table Editor → public → usuarios**. O guia [docs/ACESSOS.md](docs/ACESSOS.md) explica cadastro, redefinição de senha e permissões.

| Usuário        | Perfil        | Histórico                                                        |
| -------------- | ------------- | ---------------------------------------------------------------- |
| `user_admin`   | Administrador | Consulta, edita e apaga todos os envios                          |
| `user_pessoa1` | Funcionário   | Consulta e edita os próprios envios; Apagar mostra acesso negado |

Os dois acessos continuam com as mesmas senhas. Abra `VER-ACESSOS.cmd` na pasta original para consultar a cópia local protegida pelo Windows. `VER-ACESSO-ADMIN.cmd` mostra somente o administrador. Novas contas e redefinições pelo banco não atualizam automaticamente essa cópia local.

Para criar um usuário, abra **SQL Editor → New query**, como administrador do banco (`postgres`), e preencha a senha:

```sql
select public.cadastrar_usuario(
  p_usuario => 'user_pessoa2',
  p_senha => '', -- PREENCHA: pelo menos 12 caracteres, no máximo 72 bytes
  p_perfil => 'funcionario',
  p_nome => 'Maria Eduarda',
  p_sobrenome => 'Alves'
);
```

O comando cria perfil ativo e credencial protegida juntos, sem e-mail. Use `admin` para cadastrar um administrador. Não use “Insert row” para cadastrar apenas o perfil: isso não cria sua senha.

Nome e sobrenome são obrigatórios, separados, com até 100 caracteres cada. A saudação usa somente a primeira palavra do nome (“Maria” para “Maria Eduarda”); o menu mantém o nome completo com sobrenome. Os perfis iniciais são Lucas Melgaço (`user_admin`) e Maria Eduarda Alves (`user_pessoa1`), com os acessos, senhas e envios preservados. As contas adicionadas posteriormente estão documentadas em [Acessos por nome de usuário](docs/ACESSOS.md).

O Histórico separa **Registros** e **Manutenções**, sem a categoria Todos. O painel **Filtros** combina as seleções após tocar em **Aplicar filtros**, com os envios mais recentes primeiro e botão Carregar mais. Os critérios são aplicados no banco antes da paginação; motorista e placa correspondem à mesma equipe. **Limpar filtro** limpa as seleções e volta à semana inicial. Ao abrir o histórico após salvar ou editar, a categoria correspondente é selecionada automaticamente.

Os cards das duas categorias mostram **Lançado em 30/09/2026 · 11:42**, com data e hora de `created_at` no fuso do aparelho, e **Data do registro: 25/09/2026** separadamente. O filtro usa o dia 25 nesse exemplo. Editar preserva o lançamento original. Essa separação faz parte da revisão de 30/09 e ainda não está no APK 8.

O atalho de relógio foi retirado do cabeçalho. O Histórico continua disponível no card da tela inicial e no menu da conta.

Na manutenção, os campos seguem **Data → Contrato → Placa → Motorista → Tipo de manutenção → Valor**. O modelo continua sendo exibido automaticamente junto da placa. A caixa **Motorista não identificado** preenche o campo com esse texto e grava `NULL` em `manutencoes.motorista_id`, sem criar pessoa fictícia. Ao desmarcar, é necessário escolher um motorista. A opção é restaurada ao editar, e o Histórico mostra o mesmo texto para motorista nulo.

Registro e Manutenção aceitam somente datas até hoje, inclusive na edição. O calendário limita a seleção, e a entrada web recusa datas futuras digitadas ou coladas. A validação do formulário e as quatro funções públicas de gravação/edição também conferem a data. O aplicativo usa o dia local do dispositivo; o banco usa o fuso `America/Sao_Paulo`. A migração `202609170001_manutencao_datas.sql` foi aplicada em 17/09/2026, incluindo motorista nulo e o tipo **Outros**.

Para redefinir a senha, use `public.definir_senha_usuario(p_usuario, p_senha)`; isso revoga todas as sessões da pessoa. Senhas são hashes na tabela privada `private.credenciais`, inacessível ao aplicativo. Nenhuma senha legível é baixada do banco. Não salve consultas contendo senhas em locais compartilhados.

A tela de login oferece **Esqueceu sua senha?** e olho para mostrar/ocultar a senha. Na recuperação, o usuário valida um código fornecido pelo administrador e então preenche **Nova senha** e **Confirmar senha**. Gere o código no SQL Editor com `select public.gerar_codigo_recuperacao('user_pessoa1');`, depois de conferir a identidade. Ele vale por 30 minutos, é de uso único e permite até cinco tentativas. A migração `202609160001_recuperar_senha.sql` foi aplicada em 16/09/2026. Consulte os detalhes em [ACESSOS.md](docs/ACESSOS.md).

Todas as migrações de `supabase/migrations` estão aplicadas. Não reaplique `supabase/instalar.sql`: ele contém somente o esquema inicial. Em outro banco, aplique todas as migrações em ordem. A configuração anteriormente proposta com Auth Admin/Vault foi substituída; não há chave administrativa persistida nem aprovação pendente para o fluxo atual.

A URL e a chave pública permanecem configuradas em `.env` e nos ambientes EAS. Recarregue o aplicativo e entre novamente após atualizar o código.

Para configurar outra máquina, preencher `.env` com a URL e a chave **publishable** do mesmo projeto:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://qxkhjlkexsjgkttdugqt.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

As únicas chaves aceitas no cliente são as novas chaves públicas `sb_publishable_`. Chaves secret e `service_role` nunca devem entrar no aplicativo. `.env` está no `.gitignore`.

O cadastro de acessos é feito somente pelo administrador do banco. O aplicativo usa funções de sessão próprias e não chama o Supabase Auth.

As ferramentas EAS CLI e Supabase CLI estão no cache local. `CONECTAR-CONTAS.cmd` permite refazer o login pelos próprios serviços. `scripts/conectar-supabase.ps1` configura as variáveis públicas localmente e no EAS usando essa sessão autenticada.

## Dados e permissões

- 82 veículos/equipamentos; a associação placa/modelo foi preservada.
- 12 modelos continuam `PENDENTE - ALTERAR N`.
- `SP-6539` e `SP-7188` são equipamentos.
- 102 pessoas e uma entrada `Parado na Base`, marcada `is_status=true`, `ativo=false`. Ela não aparece como responsável ou motorista até definição da regra de negócio.
- O cadastro inicial contém 9 contratos e 8 tipos de manutenção. Na consulta remota de 17/09/2026, os tipos eram Mecânica, Hidráulica, Pneus e Lanternagem; **Outros** foi acrescentado nesta revisão. O catálogo inicial e o modo demonstração não representam todas as alterações cadastrais feitas no banco em uso.
- Os catálogos são consultados pela função autenticada `listar_catalogos`. O histórico combina as tabelas reais por uma função SQL; não existe tabela duplicada de consultas.
- Na pesquisa de responsável ou motorista, digite partes do nome na ordem em que aparecem, mesmo pulando palavras. “Carlos Alves” encontra “Carlos Eduardo Alves Germano”; “Alves Carlos” não encontra esse nome. Também é possível buscar só “Eduardo” ou “Germano”. A busca ignora maiúsculas/acentos e destaca os trechos encontrados, preservando o nome completo. Toque na opção para confirmar; vale tanto no novo envio quanto na edição.
- Funcionários ativos veem e editam seus próprios envios. Administradores ativos veem, editam e apagam todos. A permissão depende de `perfil='admin'`, não do nome `user_admin`, e é conferida no banco. Referências são legíveis a funcionários ativos; alterações cadastrais são restritas a administradores. A administração dos perfis fica no painel/SQL do Supabase nesta versão.
- Contas criadas pelo comando administrativo começam ativas; funcionários não podem criar contas, redefinir senhas ou mudar o próprio perfil.
- RLS permanece habilitada, e o cliente não tem acesso direto às tabelas. Todas as consultas e gravações operacionais passam por funções que validam a sessão, a atividade, o perfil e a autoria. Tokens de sessão expiram em sete dias; sair, desativar a conta e redefinir a senha revogam o acesso.
- Registro pai e equipes são gravados na mesma transação. Cada formulário tem UUID de envio; repetir os mesmos dados com o mesmo ID não duplica o registro.
- Antes de enviar ou salvar a edição de equipes, o aplicativo verifica se há funcionário ou veículo repetido dentro do mesmo formulário. O alerta **Confira as equipes** informa os nomes/placas e os números das equipes; os campos ficam destacados e o envio aguarda correção. A verificação compara IDs, ignora campos vazios e não compara com envios anteriores. É uma validação do formulário, sem nova restrição SQL.
- No Histórico, **Editar** abre o formulário preenchido; **Salvar alterações** atualiza o envio existente e **Cancelar edição** descarta as mudanças. As edições preservam ID, autor e data de criação. A coluna `versao` impede sobrescrever uma alteração concorrente; nesse caso, reabra a edição. Os rascunhos de novos envios são separados da edição.
- **Apagar** aparece para todos. Para funcionários, abre o aviso **Acesso negado** com a mensagem “Somente administradores podem fazer esse tipo de ação.” e o botão **Entendi**, sem excluir dados. Para administradores, exige confirmação e exclui de fato a manutenção ou o registro de equipes no banco; as equipes vinculadas são excluídas em cascata. Usuários comuns também são impedidos de apagar por chamadas diretas à API.
- O custo é `numeric(12,2)`. O modelo é derivado do veículo; não há campo editável ou texto de modelo duplicado na manutenção.

## Gerar o APK interno

O projeto EAS [@duddalvs/hashimoto-frota](https://expo.dev/accounts/duddalvs/projects/hashimoto-frota) já está vinculado e com as variáveis públicas configuradas. O arquivo `eas.json` tem o perfil `preview` com `distribution: internal` e `buildType: apk`.

Preparação de 17/09/2026: release com redução de código (R8) e recursos não utilizados, para celulares Android ARM de 32 e 64 bits. `.easignore` evita enviar caches, cópias, documentos e credenciais locais. O build usa as variáveis públicas do ambiente `preview` do Expo; `.env` não é enviado. [Configurações oficiais de otimização](https://docs.expo.dev/versions/latest/sdk/build-properties/).

O [build Android de 17/09/2026](https://expo.dev/accounts/duddalvs/projects/hashimoto-frota/builds/4e277b8f-a9fd-4c92-90bc-d97a4cc75d54) foi concluído com sucesso após autorização do envio ao Expo. [Baixar APK 1.0.0 — 49,2 MB](https://expo.dev/artifacts/eas/YR9noa5v26RDpK2FdTabQWJ6rgJIVsKtt93CiWybGb4.apk). Cópia local: `entrega/Hashi-App-1.0.0.apk`. Compatível com Android API 24 ou superior em ARM 32/64 bits. Integridade do arquivo, manifesto, bundle e configuração pública do Supabase conferidos. Instalação e uso em aparelho físico ainda precisam ser validados; veja [instruções de instalação](docs/INSTALAR-ANDROID.md).

```powershell
$env:EAS_NO_VCS = '1' # Esta pasta não possui repositório Git.
npm.cmd run build:apk
```

O comando verifica a configuração antes de executar `eas build -p android --profile preview`. Após o build, o EAS fornece o link do APK para instalar nos celulares. A instalação de aplicativos dessa origem deve ser permitida no Android. Não há publicação na Play Store. A ferramenta EAS é executada por `npx`, sem dependência instalada no projeto.

## Verificação

Revisão de recuperação em 16/09/2026: TypeScript e **32 testes locais** aprovados; teste de interface de login/recuperação aprovado com respostas controladas da API; recuperação real validada no banco por `supabase/tests/recovery-validation.sql`, com usuário temporário e rollback. Para repetir a verificação visual/funcional, use o servidor web conectado na porta 8085 e `npx.cmd playwright test --config playwright.auth.config.ts`. O teste usa somente dados fictícios e intercepta as chamadas de recuperação, sem alterar senhas reais.

```powershell
npm.cmd run typecheck
npm.cmd test
npx.cmd expo-doctor
npm.cmd run build:web
```

Na revisão de autenticação por usuário passaram TypeScript, **31 testes locais** e **3 fluxos Playwright em demonstração**. Os testes locais usam PostgreSQL/PGlite, incluindo pgcrypto, e cobrem a migração de senhas, cadastro, sessões, expiração, bloqueio de tentativas, autorização, concorrência de edição e cascata.

Também passaram os logins reais das duas contas pela API e navegador, persistência de sessão após recarregar, edição, aviso de acesso negado e exclusão administrativa. `supabase/tests/remote-validation.sql` validou cadastro sem Auth, senha, redefinição, permissões e operações no PostgreSQL hospedado, com rollback de todos os dados temporários.

Para repetir a validação de API/navegador, mantenha um servidor web conectado ao `.env` na porta 8085 e execute `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/verificar-edicao-remota.ps1`. Exige as senhas locais protegidas e Chrome; cria e remove somente envios temporários com UUIDs próprios. `node scripts/verificar-conexao.mjs` verifica que tabelas e histórico não ficam acessíveis sem sessão.

Para os testes de interface em demonstração, use um servidor separado sem carregar `.env`, e execute `npm.cmd run test:ui` com `PLAYWRIGHT_BASE_URL` apontando para ele. O teste físico no Expo Go e no APK continua necessário.

## Estrutura

| Pasta                     | Conteúdo                                                     |
| ------------------------- | ------------------------------------------------------------ |
| `src/app`                 | Entrada, login e rotas internas                              |
| `src/components`          | Cabeçalho, navegação, campos, seletor pesquisável e feedback |
| `src/providers`           | Sessão, cadastros e estado dos formulários                   |
| `src/lib`                 | Integração Supabase, validação, formatação e tema            |
| `supabase/migrations`     | Esquema, segurança e cadastros iniciais                      |
| `supabase/cadastros.json` | Dados originais estruturados                                 |
| `tests`                   | Validações, banco e fluxos de interface                      |
| `docs/reference`          | Referência extraída do PDF                                   |
| `docs/screenshots`        | Capturas dos testes                                          |

Os campos permanecem preenchidos após erros de envio e durante a navegação entre serviços. Rascunhos não são persistidos após fechar o aplicativo ou sair da conta. O envio exige conexão; não existe sincronização offline automática nesta versão.

Fontes técnicas: [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/), [senhas protegidas no PostgreSQL](https://www.postgresql.org/docs/17/pgcrypto.html), [EAS APK interno](https://docs.expo.dev/build-reference/apk/).
