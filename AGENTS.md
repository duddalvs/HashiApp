# AGENTS.md — Hashimoto Frota

Documento de contexto para continuidade do projeto. Atualizado em **18/09/2026**, com base nos arquivos locais e na conversa disponível.

## Contas de Renato, Armino e Marcio — 18/09/2026

- Criadas e ativadas, a pedido do usuário, três contas com perfil `funcionario`: **`user_renato`** — nome **Carlos Renato**, sobrenome **Dantas Nascimneto**; **`user_armino`** — nome **Armino**, sobrenome **Correia Ointo Sales Netp**; **`user_mario`** — nome **Marcio**, sobrenome **Flores dos Santos**. Grafias e logins preservados exatamente como solicitados, inclusive `user_mario` para Marcio. Senhas fornecidas pelo usuário, sem cópia em documentos, fontes ou arquivos locais de acesso.
- `public.cadastrar_usuario` executada para as três contas na mesma transação, com rejeição caso algum login já existisse. Perfis ativos conferidos; nenhuma conta anterior alterada, sem mudanças de schema, catálogos de funcionários, Supabase Auth ou aplicativo/APK.
- Login real das três contas aprovado pela API; `meu_perfil` confirmou todos os nomes, logins, perfis e atividade. Sessões de teste encerradas e revogação confirmada pelo erro `28000`. Relatório sem senhas/tokens em `.tools/cadastros-renato-armino-marcio-20260918-verificacao.json`. Não houve teste em aparelho físico nem atualização da cópia consultada por `VER-ACESSOS.cmd`.

## Hora do envio no Histórico — 18/09/2026

- `historico.tsx` exibe a hora original do envio ao lado da data nos cards de **Registro e Manutenção**, no formato `18/09/2026 · 11:42`. A data continua sendo a informada no formulário (`data`); o horário vem de `created_at`, já retornado por `buscar_historico`. Usa o fuso local do dispositivo, formato de 24 horas e dois dígitos para horas/minutos. A edição mantém o horário original, conforme a preservação existente de `created_at` no banco e na demonstração.
- `displayTime` em `src/lib/format.ts` centraliza a formatação e não inventa um horário caso receba um timestamp inválido. O rótulo acessível do card também informa data e hora do envio. O topo permite quebra entre o marcador da categoria e a data/hora em espaços reduzidos, preservando a legibilidade.
- TypeScript, Prettier e **40 testes locais** aprovados. Conferência no navegador com API simulada em **320 e 412 px**, nas duas categorias e fusos **America/Sao_Paulo e UTC**, confirmou a data do formulário preservada, conversão do timestamp, zeros à esquerda (`00:05`), data/hora em uma linha e ausência de transbordamento/erros JavaScript. Capturas `.tools/historico-hora-*.png`; relatório `.tools/historico-hora-verificacao.json`.
- Sem migração, gravação remota ou mudança de versão nesta revisão. **Nenhum novo APK gerado; o APK 0.1 já entregue não contém esta alteração do Histórico. Android físico não testado.**

## Contas de Eduardo e Wallace — 18/09/2026

- A pedido do usuário, criadas contas ativas com perfil `funcionario`: **`user_eduardo`**, nome **Carlos Eduardo**, sobrenome **Alves Germano**; **`user_wallace`**, nome **Wallace**, sobrenome **Felizardo de Queiroz**. Nomes completos confirmados pelo usuário antes da gravação; senhas fornecidas na conversa, não copiadas para a documentação ou fontes do aplicativo.
- Cadastro feito no Supabase por `public.cadastrar_usuario`, na mesma transação e com conferência de ausência dos dois logins. Nenhuma conta existente foi alterada. Credenciais protegidas criadas pela função existente; sem mudanças de schema, Supabase Auth, catálogos de funcionários ou APK.
- Login real de ambas as contas aprovado pela API pública do aplicativo; `meu_perfil` confirmou login, nome, sobrenome, perfil e atividade. Sessões de teste encerradas, com retorno `28000` ao tentar reutilizá-las. Relatório sem senhas ou tokens em `.tools/cadastros-20260918-verificacao.json`. Não houve teste em aparelho físico. A cópia antiga consultada por `VER-ACESSOS.cmd` não foi ampliada.

## Ícone iconn e versão 0.1 — 18/09/2026

- A pedido do usuário, a versão pública em `app.json` é **0.1**. `AppShell.tsx` usa nome e versão de `Constants.expoConfig`; o menu exibe **Hashi App · versão 0.1**, substituindo o texto fixo antigo. O pacote npm e seu lockfile usam `0.1.0`, conforme o formato semântico do npm; esse valor não alimenta a interface. `android.versionCode` aumentou para **3**, preservando a sequência de atualização do Android apesar da troca do nome público da versão.
- Novo ícone baseado em **`assets/iconn.png`**, fornecido pelo usuário (119 × 74 px). O original foi preservado. `scripts/prepare-launcher-icon.mjs` prepara recursos quadrados de 1024 px, centralizando a imagem com sua proporção original: `iconn-launcher.png` com fundo branco e `iconn-adaptive.png` com transparência e margem para as máscaras do Android. Configuração geral, Android e favicon atualizados. O desenho adaptável foi conferido dentro da área segura circular. Para regenerar esses recursos, executar `node scripts/prepare-launcher-icon.mjs`; o gerador antigo `generate-assets.mjs` não prepara este novo ícone.
- TypeScript, Prettier e Expo Doctor **21/21** aprovados. Dois fluxos existentes de perfil/menu passaram em servidor local com cache limpo; inspeção direta e captura em 320 px confirmaram a versão 0.1 sem transbordamento. O primeiro servidor local exibiu bundle antigo em cache; foi reiniciado com `--clear`, e os testes foram repetidos. Captura: `.tools/menu-0.1.png`. Não houve alteração de banco ou teste em Android físico nesta revisão.
- R8, remoção de recursos, compressão de bibliotecas/JavaScript e suporte ARM 32/64 mantidos. Pacote de envio conferido: **54 arquivos, 988.182 bytes** antes da compressão; sem diferenças em relação aos fontes locais e sem `.env`, senhas ou scripts administrativos. Upload EAS de **574 KB**; perfil `preview`, pacote `com.hashimoto.frota`, chave remota existente. Build solicitado: **`d9b109a5-f6e0-40c9-a415-4bbb646c3355`**. Concluído com estado **FINISHED** em **2026-09-18T14:30:28.251Z**, após espera na fila do Expo. Logs remotos confirmam compilação de release bem-sucedida.
- APK `entrega/Hashi-App-0.1.apk`: **23.421.863 bytes (23,4 MB; 22,3 MiB)**. SHA-256 `f71bdc651d9fef92f39634b84d56a4ddbe15d6eabe44de6bab3fc627002bd4c0`. Download: `https://expo.dev/artifacts/eas/zydxBaOzbqacEchCpw3sdtBRuDtwzQIM3HFDlVDeWno.apk`. ZIP/CRC, manifesto com `versionName: 0.1`/`versionCode: 3`, nome Hashi App e configuração embarcada usada pelo menu conferidos. Ícones geral/adaptável extraídos do APK e conferidos visualmente. Bibliotecas ARM 32/64 e bytecode Hermes comprimidos; pesquisa de nomes e ambas as variáveis públicas do Supabase presentes. Nenhum arquivo administrativo encontrado.
- Assinatura APK v2 RSA/SHA-256 e digest verificados com OpenSSL e o verificador local; certificado idêntico ao APK 1.0.1. Relatório: `entrega/verificacao-apk-0.1.json`. Guia, README e instruções da entrega atualizados. **Instalação e uso em Android físico continuam não testados.**

## APK 1.0.1 otimizado — 18/09/2026

- Usuário autorizou gerar novo APK e enviar ao Expo. `app.json`, `package.json` e lockfile estão na versão **1.0.1**, `android.versionCode: 2`; pacote `com.hashimoto.frota` e assinatura preservados. Inclui nome Hashi App, ícone de `assets/icon.png`, pesquisa de nomes com destaque e as mudanças de formulário posteriores ao APK de 17/09.
- Mantidos R8, remoção de recursos não utilizados e ARM de 32/64 bits. Ativados `useLegacyPackaging` e `enableBundleCompression`; compressão de PNG explicitamente habilitada. Essas opções reduzem o arquivo APK; não medem o tamanho instalado. Compressão do JavaScript pode afetar o tempo de abertura, ainda não medido em aparelho.
- Expo Doctor indicou quatro correções, aplicadas: Expo `~57.0.24`, expo-build-properties `~57.0.21`, expo-constants `~57.0.19` e expo-router `~57.0.22`. Após atualização: TypeScript, **40 testes locais**, **6 fluxos Playwright com API simulada** e Expo Doctor **21/21** aprovados. Configuração nativa resolvida conferiu nome, versão, arquiteturas e opções de otimização. Prettier dos arquivos alterados aprovado.
- Pacote de fontes inspecionado: 52 arquivos, 872.679 bytes antes da compressão; 467 KB enviados ao EAS. `.env`, acessos locais, scripts administrativos, banco, testes e documentos excluídos. Ambiente `preview` forneceu as duas variáveis públicas do Supabase. Fontes do pacote comparadas com as locais, sem diferenças.
- Build **`09d52e95-d419-4cae-83a4-2dd033f64752`**, perfil `preview`, concluído com estado **FINISHED** às **13:17:34 UTC**. O Expo informou fila elevada; a compilação terminou normalmente. Logs confirmam Doctor 21/21, bundle JavaScript, R8 e `BUILD SUCCESSFUL` no Gradle.
- APK: `entrega/Hashi-App-1.0.1.apk`, **23.429.567 bytes (23,4 MB; 22,3 MiB)**, redução de **52,39%** frente aos 49.211.807 bytes anteriores. SHA-256 `a60fc13c053da28d2bc90134422a2e94081bcf8e59f3ceccc4c8df46cd71156e`. Download: `https://expo.dev/artifacts/eas/aMCjmabZDv3c4HPzTYQQ8_X0ry4cpuglBrToL7EK1mY.apk`.
- Verificados no arquivo: ZIP/CRC, pacote/versão, Android mínimo API 24/alvo 36, nome Hashi App, ícones extraídos e conferidos visualmente, bibliotecas somente ARM 32/64, bytecode Hermes, pesquisa de nomes e ambas as configurações públicas do Supabase. Bibliotecas passaram de 36.872.100 bytes brutos para 13.172.653 comprimidos; JavaScript de 2.993.252 para 1.254.796. Sem atributo debuggable ou arquivos administrativos encontrados.
- Assinatura APK v2 RSA/SHA-256 e digest do conteúdo verificados com OpenSSL e verificador local do formato em `.tools/verify-apk-signature.py`; certificado idêntico ao APK anterior. Não foi usado apksigner. Relatório em `entrega/verificacao-apk-1.0.1.json`; guia e `entrega/LEIA-ME.txt` atualizados. **Instalação, abertura, desempenho e fluxos em Android físico continuam não testados.**

## Pesquisa de funcionários por partes do nome — 18/09/2026

- `SearchSelect.tsx` oferece o modo `ordered-name`, usado somente nos campos de responsável de cada equipe em `registro.tsx` e motorista em `manutencao.tsx`, inclusive na edição. `src/lib/nameSearch.ts` procura os trechos digitados na ordem, permitindo pular palavras, ignorando caixa/acentos e tolerando espaços extras. Para “Carlos Eduardo Alves Germano”, encontra “Eduardo”, “Eduardo Alves”, “Alves”, “Germano” e “Carlos Alves”; “Alves Carlos” não encontra esse nome.
- As opções mantêm o nome completo, com destaque em laranja, fundo claro e negrito somente nos trechos encontrados. A grafia original e os acentos são preservados, inclusive em nomes com caracteres Unicode decompostos. Continua obrigatório tocar na opção para selecionar o ID; fechar a pesquisa não confirma a seleção, e Limpar seleção mantém seu comportamento. Placas, contratos, tipos de manutenção e busca do Histórico mantêm suas regras anteriores.
- Verificados nesta revisão: TypeScript, Prettier, **40 testes locais** e dois fluxos Playwright com API simulada em 320 px, cobrindo busca, ordem inversa, acentos, destaque, limpar/fechar, IDs enviados e edição nos dois formulários. Nenhuma alteração no banco remoto, nenhum novo APK e nenhum teste em Android físico.

## Nome e ícone do aplicativo no celular — 18/09/2026

- `app.json` define o nome de exibição **Hashi App** e usa `assets/icon.png` tanto no ícone geral quanto em `android.adaptiveIcon.foregroundImage`, substituindo a referência Android a `assets/adaptive-icon.png`. A imagem fornecida foi preservada, sem edição; PNG de 1024 × 1024 px. Pacote Android, slug e scheme preservados.
- Configuração resolvida pelo Expo e pelos seletores de nome/ícone dos plugins Android conferida; TypeScript aprovado. Orientações em `docs/INSTALAR-ANDROID.md` atualizadas. Nenhum APK gerado ou teste em aparelho nesta alteração; o APK de 17/09/2026 continua com nome/ícone anteriores. A mudança exige nova compilação e instalação.
- `scripts/generate-assets.mjs` é o gerador antigo e sobrescreve `assets/icon.png`; não executá-lo para aplicar essa configuração, pois o ícone solicitado já está no arquivo fornecido pelo usuário.

## Contrato abaixo da data — 17/09/2026

- A pedido do usuário, `manutencao.tsx` agora exibe Data, Contrato, Placa, Motorista, Tipo de manutenção e Valor, tanto no novo envio quanto na edição. Substitui a posição de Contrato ao final descrita na revisão abaixo.
- Ajustada a ordem esperada no teste de interface existente e atualizada a documentação. TypeScript e Prettier aprovados. Conferência no navegador/aparelho não repetida; nenhum novo APK ou alteração de banco nesta troca de posição. A captura anterior de manutenção ainda mostra a ordem antiga.

## Datas, cabeçalho e manutenção — 17/09/2026

- `DateField.tsx` limita os calendários nativos e web a hoje e recusa entrada web futura; `validation.ts` bloqueia envio/edição com data futura em Registro e Manutenção. As quatro RPCs públicas também validam a data, usando `America/Sao_Paulo` no servidor. O aplicativo usa o dia local do dispositivo. Datas anteriores e hoje continuam aceitas.
- Retirado somente o botão de relógio “Abrir histórico” do cabeçalho em `AppShell.tsx`. O card da tela inicial e o destino no menu continuam disponíveis. Seletores dos testes e do script de validação remota foram ajustados.
- Manutenção segue Data, Placa (com modelo derivado), Motorista, Tipo de manutenção, Valor e Contrato. O usuário foi consultado sobre Contrato, omitido na lista solicitada; sem resposta até a implementação, foi mantido obrigatório após Valor, com essa decisão comunicada. Não foi removido do banco nem dos envios.
- Caixa acessível “Motorista não identificado” limpa o ID e preenche visualmente o campo com essa opção. Desmarcar exige nova seleção. A flag `driverUnidentified` existe apenas no formulário; o banco recebe `NULL` na coluna `motorista_id` existente. Novos formulários não presumem motorista desconhecido. Edição remota deriva a flag do ID nulo, e demonstração preserva a escolha durante a navegação. Histórico mostra “Motorista não identificado”.
- Migração `supabase/migrations/202609170001_manutencao_datas.sql` aplicada no Supabase: coluna de motorista anulável, funções privadas de salvar/editar com validação de IDs não nulos e comparação segura para idempotência, Histórico com `LEFT JOIN` de motorista e preservação de autoria/permissões. Funções privadas continuam inacessíveis ao cliente. Não altera os envios existentes.
- Consulta remota confirmou apenas quatro tipos antes da mudança: Mecânica, Hidráulica, Pneus e Lanternagem. **Outros** foi inserido, preservando esses tipos. O seed inicial/demonstração já continha Outros, mas não representava o catálogo remoto atual. Não atribuir as mudanças cadastrais anteriores a uma pessoa ou operação sem evidência.
- TypeScript e **36 testes locais** aprovados. Teste SQL real `supabase/tests/maintenance-dates-validation.sql` aprovado: criação/edição com motorista nulo, repetição segura, conflitos, referências inválidas, Histórico, isolamento de autoria, administrador, ausência de sessão, hoje/ontem e rejeição de amanhã nas quatro RPCs. Contas/envios temporários desfeitos por rollback. Não houve build de APK nem teste em Android físico nesta revisão.
- Cinco fluxos Playwright em demonstração e um fluxo de manutenção com API simulada aprovados. Cobrem ordem dos campos em 320 px, bloqueio de data, obrigatoriedade de escolha explícita, navegação com rascunho, envio nulo, Histórico e troca nulo/pessoa ao editar. Corrigido o estado `aria-checked` da caixa no navegador. Uma execução simultânea das suítes colidiu na pasta de artefatos; o fluxo afetado passou ao repetir com saída isolada em `test-results/demo`. Capturas existentes foram atualizadas pela suíte. O APK das 14:07 UTC não contém estas mudanças de interface.

## Diagnósticos do Histórico no editor — 17/09/2026

- Usuário mostrou sublinhados em imports `@/` e JSX de `historico.tsx`. O arquivo salvo passou em TypeScript e Prettier antes da alteração; a mensagem exata dos diagnósticos do editor não foi disponibilizada, portanto não foi confirmada uma causa única.
- Explicitados `jsx: react-jsx`, `module: preserve` e `moduleResolution: bundler` no `tsconfig.json`, preservando os valores já herdados do Expo. Configuração do VS Code passou a incluir `js/ts.tsdk.path` e o aviso para usar a versão do workspace, mantendo a chave antiga para compatibilidade. Sem alteração de comportamento ou conteúdo de `historico.tsx`.
- Verificação após o ajuste: TypeScript e Prettier aprovados; consulta direta a uma instância nova do tsserver confirmou o tsconfig da raiz e zero diagnósticos sintáticos/semânticos do Histórico. Logs do VS Code registraram reinício do serviço; a ausência dos sublinhados na janela do usuário ainda não foi confirmada visualmente. Nenhum novo APK gerado, pois as opções efetivas de compilação foram preservadas.

## APK gerado — 17/09/2026

- Instalado `expo-build-properties` compatível com SDK 57. Configurados R8 e remoção de recursos não utilizados em release, com arquiteturas Android `armeabi-v7a` e `arm64-v8a` (celulares ARM de 32/64 bits; sem x86). Aplicadas correções de compatibilidade indicadas pelo Expo Doctor, incluindo Expo 57.0.23. Nenhuma função do aplicativo foi removida para reduzir tamanho.
- `.easignore` exclui caches, cópias, documentos, testes, scripts administrativos, dados de acesso e `.env` do envio ao EAS. Inspeção local do estágio archive: 51 arquivos, 866.966 bytes antes da compressão, somente fontes/assets/configurações. O tamanho do pacote de fontes não é o tamanho do APK. `entrega/` também excluída do upload e do Git.
- Conta Expo `duddalvs` autenticada; ambiente EAS `preview` contém URL e chave pública do Supabase. Histórico consultado sem builds Android existentes. TypeScript, 33 testes locais, 21 verificações Expo Doctor e exportação Android com bytecode Hermes aprovados. A primeira execução local do Hermes encontrou permissão negada no sandbox; repetição autorizada passou.
- Após a rejeição inicial da revisão automática, o usuário autorizou explicitamente o envio ao Expo. Build Android `4e277b8f-a9fd-4c92-90bc-d97a4cc75d54` concluído com estado `FINISHED` em 17/09/2026 às 14:07:30 UTC, perfil `preview`, versão 1.0.0 (1), pacote `com.hashimoto.frota`. Chave de assinatura gerada pelo Expo; fontes comprimidas enviadas com 466 KB. Logs remotos confirmam Expo Doctor 21/21, empacotamento JavaScript e build Gradle de release com R8.
- APK baixado em `entrega/Hashi-App-1.0.0.apk`: **49.211.807 bytes (49,2 MB; 46,9 MiB)**. SHA-256 `e11dc0e1b98e28e81b1a866b93e52048d9b301039aca8ddc14edbb9eeedc16d3`. Integridade ZIP/CRC conferida; manifesto confirma pacote/versão, Android mínimo API 24 e alvo 36, sem atributo debuggable. Bibliotecas somente ARM 32/64 bits; bundle Hermes e as duas configurações públicas do Supabase presentes. Nenhum arquivo `.env`, script administrativo SQL/PowerShell/CMD ou arquivo de senhas encontrado no APK. Bloco de assinatura APK v2 presente; assinatura não foi validada criptograficamente com apksigner local.
- Download: `https://expo.dev/artifacts/eas/YR9noa5v26RDpK2FdTabQWJ6rgJIVsKtt93CiWybGb4.apk`. Relatório local `entrega/verificacao-apk.json`, instruções em `docs/INSTALAR-ANDROID.md`. **Instalação/abertura e fluxos em Android físico ainda não testados.** Não confundir build concluído com validação operacional no aparelho. Não é necessário manter Expo Go ou computador ligado; acesso ao banco exige internet.

## Nome do card de alocação — 17/09/2026

- Após pedido de reversão, o subtítulo do card Manutenção voltou para “Serviço e custo”; seletor correspondente do teste de navegação também restaurado. Mudança somente de texto.
- Ícone do card Alocação trocado de caderneta para caminhão SVG (`truck` em `Icon.tsx`), mantendo tamanho e cor laranja. Alteração restrita ao card da tela inicial. TypeScript aprovado; navegador/aparelho não testados novamente nesta troca.
- Após refinamento do pedido, o card da tela inicial se chama apenas **Alocação**, em uma linha e com o estilo padrão dos cards. Substitui o nome intermediário “Alocação de veículos”. Mantida a rota `/registro` e o formulário existente. Rodapé e categoria do Histórico não foram renomeados nesta alteração.
- Seletor do teste de navegação atualizado. TypeScript aprovado; conferência no navegador/aparelho não repetida nesta revisão.

## Alerta de funcionário ou veículo repetido — 17/09/2026

- `validateRegistration` verifica IDs de responsáveis e veículos entre equipes do mesmo formulário, incluindo edição. Repetições válidas produzem erros em todos os campos envolvidos e resumo com nomes/placas e números das equipes; campos vazios/inválidos mantêm sua validação própria, sem falso alerta de repetição.
- Ao salvar, `registro.tsx` abre o modal “Confira as equipes”, com detalhes roláveis e botão “Corrigir equipes”. Não chama a gravação enquanto houver repetição; mantém os dados preenchidos e destaca os campos. Ao corrigir e reenviar, valida novamente. Não compara envios anteriores, datas ou outros usuários. Não houve alteração de tabelas, RPCs ou restrições SQL: esta é uma conferência do formulário para evitar seleção acidental.
- Verificados: TypeScript, 33 testes locais e três fluxos Playwright em demonstração aprovados. Cobertura inclui funcionário repetido, veículo repetido, ambos em equipes distintas, campos vazios, correção e envio posterior; fluxo web confirma alerta com ambos, correção parcial e sucesso após corrigir o restante. Não houve teste em aparelho físico ou chamada ao banco remoto nesta revisão.

## Remoção da engrenagem — 16/09/2026

- A pedido do usuário, removidos o botão flutuante laranja da tela inicial, seu estilo e o ícone sem outros usos. Removida a reserva inferior de 76 px; espaçamento agora simétrico de 16 px, mantendo o conjunto centralizado. Menu da conta continua acessível pelo cabeçalho. Esta decisão substitui a engrenagem descrita na revisão abaixo.
- Teste existente de navegação ajustado para abrir o menu pelo cabeçalho. TypeScript aprovado; navegador e aparelho não testados novamente nesta remoção. A captura anterior ainda mostra a engrenagem e não representa esta revisão.

## Novo visual da tela inicial — 16/09/2026

- Aplicada a nova imagem de referência enviada pelo usuário: traço laranja acima da saudação (sem emoji), prancheta com fundo cinza e sombra sem folhas, cards brancos com sombras e setas circulares, ícones azul/laranja, Histórico com ícone circular cinza e faixa informativa em laranja claro com borda lateral. As curvas decorativas voltaram conforme a nova referência, substituindo o pedido visual anterior de removê-las.
- Mantida a saudação somente pelo primeiro nome e a separação da ilustração. `inicio.tsx` reserva espaço inferior para a engrenagem. Título Manutenção reduzido em telas menores que 370 px para permanecer inteiro numa linha. Cabeçalho preservado.
- `AppShell.tsx` exibe engrenagem laranja somente na tela inicial; ela abre o menu existente “Sua conta”, sem criar nova tela de configurações. Rodapé mantém os dois destinos, com ponto laranja como indicador. Na inicial, Registro recebe destaque visual; estado acessível de seleção continua baseado na rota real.
- TypeScript aprovado, 3 fluxos Playwright em demonstração e 2 fluxos de perfil com API simulada aprovados. Botão da engrenagem testado ao abrir/fechar menu e ocultar ao navegar para Histórico. Conferência visual em 320 e 412 px, sem transbordamento horizontal e sem sobreposição da faixa informativa com a engrenagem; título Manutenção em uma linha em 320 px. Captura `docs/screenshots/inicio.png` atualizada. Não houve teste no aparelho ou build de APK nesta revisão.

## Correção de 16/09/2026 — erro de sintaxe no Histórico

- Corrigida a primeira linha de `src/app/(frota)/historico.tsx`, que estava com `mport` em vez de `import`, causando o erro “Missing semicolon (1:5)” mostrado no Expo. Sem alterações de comportamento.
- `npm.cmd run typecheck` aprovado após a correção, sem outros erros TypeScript. Abertura no aparelho não verificada nesta revisão.

## Ajuste de 16/09/2026 — saudação somente pelo primeiro nome

- A pedido do usuário, `inicio.tsx` extrai somente a primeira palavra do nome, ignorando espaços nas extremidades e separando por espaços em branco. “Maria Eduarda” aparece como “Olá, Maria!”. Nome completo e sobrenome continuam preservados no banco e no menu.
- Mantida fonte de 24 px (22 px em telas menores), separação de 16 px da imagem e saudação limitada a uma linha, com ajuste de fonte quando necessário. Substitui a orientação anterior de mostrar o nome composto na saudação.
- Verificados: TypeScript e os dois testes de perfil no navegador com API simulada, incluindo Lucas/Maria na saudação e nomes completos no menu, também em 320 px. Sem teste Android físico nesta revisão.

## Ajuste de 16/09/2026 — saudação um pouco maior

- Aumentada a fonte de “Olá, nome!” em `inicio.tsx` de 22 para 24 px (de 20 para 22 px em telas menores que 370 px), com altura de linha proporcional. Mantidas as colunas separadas por 16 px e a quebra de linha para nomes longos, sem alterar a imagem ou os cards.
- Verificação desta alteração: TypeScript aprovado. Não repetida a conferência visual em navegador ou Android físico.

## Ajuste de 16/09/2026 — cards sem ondas e centralização vertical

- Removidas as ondas decorativas de Registro, Manutenção e Histórico na tela inicial, incluindo o componente `CardWave` sem outros usos. Mantidos cores, ícones e tamanhos dos cards. O conjunto da tela fica centralizado verticalmente no espaço entre cabeçalho e rodapé; o conteúdo interno de Registro/Manutenção também foi centralizado com espaçamento vertical simétrico.
- Verificados: TypeScript e comparação das dimensões antes/depois em navegador nas larguras de 320, 412 e 660 px, sem alteração de largura/altura dos três cards. Centro vertical conferido, sem transbordamento horizontal; conteúdo alcançável por rolagem em 320 × 568 px. Captura `docs/screenshots/inicio.png` atualizada e conferida em demonstração. Android físico não testado nesta revisão.

## Ajuste de 16/09/2026 — espaço entre saudação e ilustração

- Em `inicio.tsx`, a saudação e a ilustração agora ocupam colunas flexíveis separadas por 16 px; removido o posicionamento absoluto que permitia sobreposição. Fonte reduzida para 22 px (20 px em telas menores que 370 px), ilustração para 104 × 116 px (80 × 96 px nas menores). Nomes compostos permanecem completos, com quebra de linha quando necessário.
- Verificados: TypeScript e navegador com perfil simulado de Maria Eduarda em larguras de 320, 412 e 660 px; espaço medido de 16 px e ausência de transbordamento horizontal. Captura de 412 px conferida visualmente. Sem teste Android físico nesta alteração.

## Atualização de 16/09/2026 — nome, sobrenome e organização do Histórico

- Aplicada remotamente a migração `202609160002_nome_sobrenome.sql`: coluna `public.usuarios.sobrenome` e nova assinatura `cadastrar_usuario(p_usuario,p_senha,p_perfil,p_nome,p_sobrenome)`. Novos cadastros exigem nome e sobrenome não vazios, até 100 caracteres cada; nomes compostos são preservados. A função continua exclusiva de `postgres`. Cadastros legados recebem sobrenome vazio, sem inferências; os dois perfis atuais foram preenchidos explicitamente.
- O usuário autorizou substituir as contas por Lucas Melgaço (admin) e Maria Eduarda Alves (funcionária). Foi perguntado se preferia manter logins/senhas ou usar novos logins. Sem resposta durante o trabalho, foi adotada e comunicada a opção de manter os acessos e atualizar os perfis existentes, sem exclusão/recriação: `user_admin` é Lucas Melgaço e `user_pessoa1` é Maria Eduarda Alves. Script aplicado: `scripts/atualizar-nomes-iniciais.sql`, com conferência prévia dos UUIDs e perfis. IDs e senhas preservados; consulta antes/depois confirmou 2 registros do administrador e 1 manutenção da funcionária.
- `Profile` inclui sobrenome; a saudação usa `profile.nome` inteiro (“Maria Eduarda”, sem cortar no primeiro espaço), e o menu exibe nome + sobrenome. Cadastro continua administrativo pelo SQL Editor, sem nova tela de autoinscrição. Exemplos atualizados em README e `docs/ACESSOS.md`.
- Histórico sem filtro “Todos”: seletores Registros (equipes/veículos) e Manutenções (serviços/custos), busca na categoria, títulos claros, contrato/placa identificados, detalhes com rótulos e ações alinhadas. Lista mostra a página de até 20 envios, com Carregar mais, sem a etapa antiga de expandir cinco itens. Categoria vazia permite iniciar o formulário correspondente.
- Salvar Registro/Manutenção e voltar/cancelar/salvar edição encaminham `tipo` ao Histórico. A seleção é sincronizada na rota, com indicação acessível. API SQL mantém compatibilidade com `todos`, mas esse filtro foi removido dos tipos e da interface do cliente.
- Verificados: TypeScript; 32 testes locais (incluindo obrigatoriedade, tamanho, trim, nome composto, sobrenome no login/perfil e permissões); 3 fluxos Playwright em demonstração (categorias, isolamento visual, envio e edição); 3 fluxos com API simulada (saudações/menu das duas pessoas em 320 px e recuperação). Captura de Histórico conferida visualmente. Validação SQL no Supabase real passou com contas temporárias e rollback, incluindo retorno dos novos campos. Não houve login real com as duas senhas nesta revisão, nem teste Android físico ou APK.

## Atualização de 16/09/2026 — tela principal conforme referência visual

- `src/app/(frota)/inicio.tsx` foi redesenhada a partir da imagem enviada pelo usuário: saudação com mão, prancheta ilustrada, cards brancos com ícones em fundos pastel e ondas decorativas, Histórico em verde suave e faixa “Tudo em um só lugar”. O nome continua vindo do perfil.
- `HomeArtwork.tsx` contém a recriação vetorial da ilustração e as ondas em SVG, sem dependências adicionais. Cores base da tela ficam em `theme.ts`. A ilustração é uma aproximação vetorial da referência, não uma extração da imagem original.
- Cabeçalho preservado. Rodapé compartilhado mantém exatamente Registro e Manutenção, agora com cantos superiores arredondados e indicador laranja na rota selecionada. Botões principais mantêm textos brancos; Adicionar equipe mantém o visual tracejado restaurado.
- Verificados nesta revisão: TypeScript e três fluxos Playwright em demonstração aprovados; captura `docs/screenshots/inicio.png` conferida visualmente. Conferência adicional em 320 px com nome `user_pessoa1` simulado no navegador, sem transbordamento horizontal. Sem validação em Android físico ou build de APK.

## Atualização de 16/09/2026 — textos dos botões

- A pedido do usuário, `Button.tsx` usa texto, ícone e indicador de carregamento brancos. Botões principais mantêm o fundo laranja; secundários usam fundo azul para que o texto branco permaneça visível.
- Após esclarecimento do usuário, “Adicionar equipe” voltou integralmente ao estilo anterior: fundo laranja claro, borda laranja tracejada, título azul, subtítulo cinza e ícone branco em círculo laranja. Botões principais, incluindo entrada e salvar registros, mantêm texto branco. Ações “Editar” e “Apagar” no histórico usam textos/ícones brancos sobre azul e vermelho, respectivamente. Alteração visual, sem mudar permissões ou operações.
- Verificação desta alteração: `npm.cmd run typecheck` aprovado. Interface em navegador e Android físico não testados nesta revisão.

## Atualização de 16/09/2026 — recuperação e visibilidade de senha

- Adicionados **Esqueceu sua senha?** ao login e rota `src/app/recuperar-senha.tsx`. A recuperação exige usuário e código temporário fornecido pelo administrador; após validação, mostra somente Nova senha e Confirmar senha. Sem e-mail. O usuário foi consultado sobre código versus redefinição administrativa; sem resposta durante a implementação, foi adotada e comunicada a alternativa recomendada de código, para não permitir troca de senha apenas conhecendo o login.
- `PasswordField.tsx` centraliza campo e olho de mostrar/ocultar, com rótulo acessível e área de toque de 48 px. Usado no login e nos dois campos de recuperação. Confirmação diferente ou senha menor que 12 caracteres não é enviada. O servidor valida também o máximo de 72 bytes. A senha não é persistida pelo formulário.
- Migração **`202609160001_recuperar_senha.sql` aplicada no Supabase**. `private.recuperacoes_senha` guarda apenas hashes SHA-256 dos códigos e das autorizações, com RLS e sem acesso pelas contas do app. `gerar_codigo_recuperacao(p_usuario)` é exclusiva de `postgres`, retorna código aleatório de 64 bits em quatro grupos hexadecimais; válido por 30 minutos, até cinco erros. Emissão de novo código invalida código/autorização anteriores. O administrador deve conferir a identidade antes de entregar o código.
- RPC `validar_codigo_recuperacao(p_usuario,p_codigo)` consome o código e retorna autorização aleatória de 256 bits por dez minutos, apenas para redefinição. RPC `recuperar_senha(p_token,p_senha)` consome a autorização e usa a redefinição existente, revogando sessões. Token de sessão normal não substitui autorização de recuperação, nem o contrário. A autorização fica só em memória no aplicativo; não vai em URL ou armazenamento persistente.
- Expiração, reutilização, usuário desconhecido e código incorreto recebem mensagem genérica. Falhas incrementam tentativas sem rollback e sem bloquear o login normal. Troca administrativa de senha e desativação invalidam códigos/autorização. A ordem de locks acompanha a redefinição existente para preservar consistência.
- Verificados: TypeScript, **32 testes locais**, um fluxo Playwright específico em `tests/auth-ui/recovery.spec.ts` com API simulada (olho, duas etapas, erro de código, confirmação diferente e sucesso) e teste SQL real `supabase/tests/recovery-validation.sql` com conta temporária/rollback. Nenhuma senha dos usuários existentes foi alterada. Android físico não testado nesta revisão.
- Executar o teste de interface com `npx.cmd playwright test --config playwright.auth.config.ts` e servidor web conectado em 8085. A suíte anterior de demonstração permanece separada. Orientações de geração de códigos em `docs/ACESSOS.md` e README.

## Estado mais recente — contas, edição e exclusão (15/09/2026)

### Autenticação própria, sem qualquer e-mail — revisão final de 15/09/2026

O usuário explicitou que não aceita nem identificadores técnicos `@hashimoto.invalid`. Foi instalada a migração **`202609150003_acesso_por_usuario.sql`**, substituindo o Supabase Auth por autenticação própria de usuário/senha no PostgreSQL. Esta seção prevalece sobre todo o histórico abaixo.

- `public.usuarios` não referencia mais `auth.users`. Os IDs e os hashes de senha existentes foram migrados internamente, sem exibição de senhas. As duas contas técnicas foram apagadas de `auth.users` depois de remover a FK, preservando os perfis e seus envios. Consulta final: **0 contas Auth, 0 colunas email em public/private, 2 credenciais protegidas**; `user_admin` tem 2 registros/0 manutenções e `user_pessoa1` tem 0 registros/1 manutenção, como no preflight desta revisão.
- Novas contas: **`public.cadastrar_usuario(p_usuario,p_senha,p_perfil,p_nome)`**, disponível somente ao administrador do banco (`postgres` no SQL Editor), cria perfil ativo e hash na mesma transação. Não usar Authentication ou inserir só o perfil manualmente. Senha com 12 caracteres no mínimo e 72 bytes no máximo; bcrypt custo 12 para novas senhas. **`public.definir_senha_usuario(p_usuario,p_senha)`** redefine e revoga sessões. Guia completo e exemplos em `docs/ACESSOS.md` e README.
- Credenciais e sessões em schema `private`, sem acesso para `public`, `anon`, `authenticated` ou `service_role`; RLS habilitada nas tabelas privadas também. Banco guarda hash bcrypt da senha e SHA-256 do token; o dispositivo guarda somente o token de sessão, com persistência AsyncStorage.
- **`autenticar_usuario`** usa somente login/senha. Sessões aleatórias de 256 bits, validade de 7 dias, no máximo 10 por usuário. **`meu_perfil`**, **`listar_catalogos`** e todas as funções operacionais exigem `p_token`, validado em cada chamada. Logout, desativação e redefinição revogam sessões. Erro SQL `28000` representa sessão inválida/expirada, com HTTP 403 pelo PostgREST.
- Dez falhas em janela de 15 minutos limitam o login. Usa 1.024 buckets fixos derivados do nome para limitar memória mesmo com nomes inexistentes; nomes diferentes podem compartilhar o limite. Erros de credenciais são genéricos e usam hash fictício para nomes inexistentes. Contagem é retornada como erro em JSON, não por exceção que desfaria a transação. Locks mantêm redefinição/desativação consistentes com login concorrente.
- Funções anteriores de gravação/edição foram movidas a `private` e usam identidade validada em contexto transacional próprio. Wrappers públicos verificam sessão antes da operação. Histórico e obtenção do formulário verificam autoria/admin explicitamente, pois as funções executam como definer. A chave pública não permite leitura direta das tabelas nem execução das funções internas. JWTs antigos não concedem acesso. Funcionários continuam editando seus próprios registros e recebendo acesso negado ao apagar; administradores editam/apagam todos.
- `src/lib/session.ts` gerencia autenticação, armazenamento, expiração e logout. `AuthProvider` passou a usar a sessão própria. `src/lib/api.ts` usa RPCs com token; o cliente Supabase tem persistência/refresh de Auth desabilitados. `normalizeLogin` não cria identificador técnico. A restauração remove o antigo cache Auth do próprio projeto. O aplicativo não chama `/auth/v1`.
- A proposta anterior de cadastro via Auth Admin/Vault foi **abandonada**, seus arquivos pendentes removidos. Nenhuma chave administrativa foi armazenada. A rejeição anterior não foi contornada: esta implementação não usa Auth Admin, HTTP do banco ou segredos Vault; a nova migração foi aprovada pela revisão automática e aplicada. Não há aprovação pendente para o cadastro atual.
- Scripts antigos `configurar-usuarios.ps1` e `criar-administrador.ps1` foram desativados com erro explícito para impedir recriação de contas por e-mail. Cópia local DPAPI das duas senhas preservada, removida a propriedade email. `VER-ACESSOS.cmd` continua válido; não reflete automaticamente novas contas ou senhas redefinidas no banco.
- Verificação: **31 testes locais**, **3 fluxos Playwright em demonstração**, TypeScript e **API/navegador com os dois acessos reais** aprovados; inclui persistência após reload, edição e exclusão. `supabase/tests/remote-validation.sql` validou criação de contas sem Auth, login, hash, isolamento, cascata e redefinição, com rollback dos dados temporários. `supabase/tests/login-schema.sql` confirmou o inventário final. A verificação HTTP foi ajustada para esperar 403/28000 na ausência de sessão (em vez do antigo 401 de JWT). APK e Android físico não foram testados nesta revisão.

As seções seguintes registram versões anteriores e não descrevem a autenticação atual.

### Revisão de login e cadastro — 15/09/2026

- A pedido do usuário, aplicada remotamente `202609150002_login_sem_email.sql`: **removida a coluna `email` de `public.usuarios`**, `login` obrigatório e único. IDs, perfis, senhas existentes e envios foram preservados. `src/lib/api.ts` e os tipos não dependem de e-mail; login da interface aceita apenas nome de usuário. `nome` é o nome de exibição; `login` identifica a conta e não pode ser renomeado isoladamente.
- Supabase Auth continua responsável pelas senhas em hash e pelas sessões. O identificador `<login>@hashimoto.invalid` permanece apenas no Auth para compatibilidade com seu protocolo, sem exigir e-mail pessoal. O aplicativo não consulta senhas nem hashes da tabela. `criar_perfil` preenche login pelo identificador técnico; rejeita cadastro Auth incompatível. Metadados comuns não concedem perfil/atividade; apenas `raw_app_meta_data` da API administrativa pode inicializar `hashi_perfil`/`hashi_ativo`. Depois, a autorização operacional continua sendo `public.usuarios`.
- **Cadastro por SQL ainda pendente:** preparado `supabase/pending/202609150003_cadastro_auth.sql`, com `cadastrar_usuario(p_usuario,p_senha,p_perfil,p_nome)`. Faz criação pelo Auth Admin API e trigger, sem persistir senha legível. Execução reservada ao administrador do banco (`postgres`), revogada de `anon`, `authenticated` e `service_role`. Não foi implantado; permanece fora de `supabase/migrations` para evitar instalação automática.
- A revisão automática rejeitou executar `scripts/preparar-cadastro-banco.ps1`: habilitaria chave `service_role` persistente no Vault para o banco gerenciar contas no Auth. Motivo informado: requer autorização específica para essa ampliação do acesso administrativo. **Não contornar a rejeição.** Aguardando autorização explícita antes de armazenar a chave, instalar a função e testar cadastro remoto. A tentativa rejeitada não executou o script nem armazenou a chave.
- A função preparada foi validada localmente quanto a sintaxe, validação de parâmetros e bloqueio de acesso pelas contas do app; a chamada HTTP ainda não foi testada. Quando habilitada, cria conta imediatamente por HTTP, sem reversão por ROLLBACK do SQL Editor. Nunca gravar a senha em `public.usuarios`. O exemplo de uso e os limites estão no README.
- Verificação após remoção do e-mail: TypeScript e **24 testes locais** aprovados; os dois logins reais e o fluxo web/API de edição, aviso de acesso negado para funcionário e exclusão administrativa passaram. Envios temporários removidos. Não houve APK ou teste físico.
- Consulta final de `supabase/tests/login-schema.sql`: colunas `id`, `nome`, `perfil`, `ativo`, `created_at`, `login`, todas não nulas; `cadastrar_usuario` ausente no servidor. Naquele momento havia 2 registros/0 manutenções para `user_admin` e 0 registros/1 manutenção para `user_pessoa1`. Essa contagem atual substitui o inventário histórico de cinco envios; não atribuir autoria das alterações de contagem sem evidência. A migração desta revisão não altera operações.

As descrições históricas abaixo sobre e-mail e 22 testes foram substituídas por essa revisão.

Revisão posterior nesta mesma data: a pedido do usuário, **Apagar agora aparece também para funcionários**. Ao tocar, abre um modal “Acesso negado” / “Somente administradores podem fazer esse tipo de ação.” com botão **Entendi**. Não chama exclusão para funcionários; a proteção já existente no banco permanece. Administradores continuam com confirmação e exclusão. Essa revisão substitui as descrições anteriores de botão oculto para funcionários. O teste de interface e o script de validação remota foram ajustados para o novo comportamento.

Verificação desta revisão: TypeScript e fluxo Playwright de equipes em demonstração aprovados, incluindo abrir/fechar o aviso, ausência da confirmação de exclusão para funcionário e edição posterior do registro preservado. Não foi repetida a validação remota nesta revisão de interface.

Esta seção registra a mudança solicitada e validada após a consolidação inicial abaixo. Em caso de divergência, estas informações e o código atual prevalecem sobre os registros históricos deste documento.

- A conta `dev.hashimoto.ltda@gmail.com` foi apagada do Supabase Auth por solicitação explícita do usuário. Antes da exclusão, seus **3 registros de equipes e 2 manutenções** foram transferidos para o novo administrador, preservando os envios. Consulta remota após os testes confirmou essas contagens e nenhum envio de teste restante nas duas contas.
- Contas criadas e ativas: `user_admin` (`perfil='admin'`, UUID `1520389d-6884-4ea3-a896-afd080443a98`) e `user_pessoa1` (`perfil='funcionario'`, UUID `921b8720-7b8c-4437-bcd4-6e00521a84e0`). O segundo usuário começa sem envios.
- Login na interface por nome e senha. `src/lib/login.ts` converte o nome para `<login>@hashimoto.invalid` ao autenticar no Supabase Auth; endereços de e-mail reais continuam aceitos. Os endereços técnicos não recebem e-mail. Senhas pertencem ao Auth, não a `public.usuarios`; `id` é UUID. Nova coluna `usuarios.login` é única e aceita 3–40 caracteres, começando por letra, com letras minúsculas, números e `_`.
- As duas senhas estão protegidas por DPAPI em `.tools/hashimoto-users-access.json`. Consultar localmente por `VER-ACESSOS.cmd`; `VER-ACESSO-ADMIN.cmd` agora filtra o novo administrador. Não exibir senhas ou chaves privadas no chat ou documentação. Os arquivos antigos de acesso não identificam uma conta ativa.
- Histórico oferece **Editar** nos envios visíveis. Funcionários ativos consultam/editam os próprios; administradores ativos consultam/editam/apagam todos. A autorização depende do perfil no banco, não do nome de usuário. Menu da conta mostra o perfil.
- Nova rota `src/app/(frota)/editar.tsx` carrega o envio e reutiliza os formulários de Registro/Manutenção com estado separado dos rascunhos. Salvar atualiza o mesmo envio; cancelar descarta somente a edição. ID, autor e `created_at` permanecem; versão é incrementada. Conflito de versão pede reabrir o registro. Repetir o conteúdo já salvo é seguro.
- **Apagar** aparece somente para administradores. Modal confirma exclusão definitiva; RPC verifica administrador ativo e apaga a operação real. Equipes são removidas em cascata. Não foram concedidas permissões diretas de UPDATE/DELETE operacional ao cliente.
- Migração **`202609150001_edicao_usuarios.sql` aplicada no Supabase hospedado** nesta alteração: coluna `login`, colunas `versao`, RPCs `obter_envio`, `editar_registro`, `editar_manutencao` e `apagar_envio`. As migrações iniciais não foram reaplicadas. Para instalar em outro banco, aplicar todas as migrações em ordem; `instalar.sql` permanece apenas com as duas iniciais.
- `scripts/configurar-usuarios.ps1` realizou a substituição específica solicitada: usa CLI oficial autenticado, protege senhas, valida os dois logins, transfere envios e só então remove o ID antigo conferido. É uma ferramenta administrativa para essa substituição, não uma etapa necessária para executar o aplicativo.
- Verificações efetivamente executadas: TypeScript; **22 testes locais** (incluindo novas permissões, conflitos, rollback, anonimato e inatividade); **3 fluxos Playwright em demonstração** com edição de equipes; **API e navegador conectados ao Supabase real** com as duas contas. Validação real cobriu editar/salvar/cancelar manutenção, ausência de Apagar para funcionário, bloqueio de exclusão e acesso alheio pela API, bloqueio de promoção de perfil, administrador editando envio alheio, confirmação/cancelamento de exclusão e cascata. Envios temporários removidos.
- Repetição da validação real: servidor web conectado na porta 8085 e `scripts/verificar-edicao-remota.ps1` (wrapper DPAPI de `scripts/verificar-edicao-remota.mjs`). Cria e remove somente UUIDs temporários próprios. Testes de demonstração exigem servidor separado sem `.env` (usada porta 8084).
- Não houve build de APK nem teste em aparelho físico nesta mudança. Essas pendências anteriores permanecem. README e `docs/ENTREGA.md` atualizados.

## 1. Fontes e limites deste histórico

- [docs/solicitacao.md](docs/solicitacao.md): pedido original, requisitos, critérios de conclusão e cadastros fornecidos.
- [docs/reference/](docs/reference/): sete páginas de referência visual, extraídas em PNG e texto. O PDF original não foi localizado nesta pasta do projeto.
- [README.md](README.md): instruções de execução, conexão, acessos, distribuição e cópia do projeto.
- [docs/ENTREGA.md](docs/ENTREGA.md): situação e resultados de verificações registrados em 10/09/2026.
- Código em `src/`, migrações, scripts, testes e configurações: evidência da implementação atual.
- `copias/HashimotoFrota_20260914_135504223.zip`: cópia local com 91 arquivos. Em 15/09/2026, todos os 91 arquivos eram idênticos, por SHA-256, aos correspondentes na pasta de trabalho antes da criação deste documento.
- Esta pasta **não contém repositório Git**: `git status`, `git rev-parse` e `git log` retornaram “not a git repository”. Não há commits ou branches locais disponíveis para reconstruir a cronologia.
- A conversa disponível solicita este documento e exige informações confirmadas. Ela não fornece transcrições completas de outras sessões. Relatos anteriores preservados em `docs/ENTREGA.md` são identificados como registros documentais.

As configurações remotas descritas abaixo são as registradas na documentação. Supabase e EAS não foram consultados novamente nesta atualização. Não interpretar a existência de scripts, configurações ou testes como prova de execução remota ou de entrega do APK.

## 2. Objetivo e público

O **Hashimoto Frota** é um aplicativo interno para funcionários em campo, incluindo pessoas com pouca familiaridade com tecnologia. Permite:

1. Registrar equipes, responsáveis, veículos e contratos.
2. Registrar manutenções, motorista, veículo, serviço e custo.
3. Consultar o histórico dos envios conforme as permissões do usuário.

A distribuição prevista é por **APK Android interno**, sem publicação na Google Play Store. O desenvolvimento usa Expo/Expo Go, e a geração do APK usa EAS Build. A versão web serve à execução no computador e aos testes de interface.

O aplicativo instalado deve acessar o banco na nuvem sem depender do computador do desenvolvedor. A entrega operacional ainda depende das validações de celular e APK descritas na seção de pendências.

### Identidade e experiência

- Nome de exibição: `Hashimoto Frota`; marca nas telas: `HASHIMOTO FROTA`.
- Laranja principal `#ff6200`, azul principal `#0b2c44`, fundo branco ou claro.
- Tema centralizado em `src/lib/theme.ts`, incluindo laranja de texto `#bd4700` e fundo `#f5f8fa`.
- Orientação retrato e tema claro em `app.json`.
- Botões grandes, campos pesquisáveis, textos em português, cantos arredondados e feedback de envio.
- Caminhão na marca e no cabeçalho. Navegação inferior com ícones de prancheta e chave, sem repetir o caminhão.
- Rodapé com exatamente **Registro** e **Manutenção**. Histórico acessível pela tela principal, pelo cabeçalho e também pelo menu implementado.

## 3. Histórico confirmado

| Marco                                                 | Evidência e alcance                                                                                                                                                                                                                                 |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Solicitação original, sem data explícita no documento | Define o aplicativo, a identidade visual, o fluxo, as tabelas, os cadastros, RLS e a entrega por APK.                                                                                                                                               |
| 10/09/2026 — esquema e dados                          | Existem as migrações `202609100001_schema.sql` e `202609100002_cadastros.sql`. `docs/ENTREGA.md` registra sua aplicação no Supabase hospedado.                                                                                                      |
| 10/09/2026 — entrega documentada                      | Registra telas implementadas, conexão Supabase/EAS, administrador ativo e testes locais/remotos aprovados. Também registra abertura das telas pelo usuário via Expo e mantém pendentes envios no celular e APK.                                     |
| Cópia identificada como 14/09/2026                    | O ZIP `HashimotoFrota_20260914_135504223.zip` preserva os mesmos 91 arquivos presentes na pasta atual. O nome do arquivo identifica a cópia; não estabelece a data individual das alterações de código.                                             |
| Estado atual da tela Registro                         | Usa “Adicionar equipe” e remoção por bloco. O pedido original descrevia um dropdown “Número de equipes”. Código e teste de interface confirmam o comportamento atual; não há justificativa ou data dessa mudança registrada nas fontes consultadas. |
| 15/09/2026 — consolidação deste documento             | Leitura dos arquivos e da cópia, conferência de cadastros, TypeScript e 14 testes locais aprovados; validação local da configuração também aprovada.                                                                                                |

Não atribuir autores, aprovações, datas de implementação ou resultados posteriores aos que essas fontes demonstram.

## 4. Tecnologias e configuração

Versões abaixo resolvidas no `package-lock.json`; os intervalos de dependências estão no `package.json`.

| Tecnologia             | Versão/configuração confirmada             | Uso                                                                                                                       |
| ---------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Expo                   | `57.0.21`, SDK 57                          | Desenvolvimento, bundling, exportação e integração nativa.                                                                |
| Expo Router            | `57.0.20`                                  | Rotas por arquivos; entrada `expo-router/entry`; rotas tipadas habilitadas.                                               |
| React / React DOM      | `19.2.3`                                   | Componentes e execução web.                                                                                               |
| React Native           | `0.86.3`                                   | Interface do aplicativo.                                                                                                  |
| React Native Web       | `~0.21.0` declarado                        | Execução no navegador.                                                                                                    |
| TypeScript             | `6.0.3`                                    | Tipagem; `strict: true`; configuração base do Expo.                                                                       |
| Supabase JS            | `2.116.0`                                  | Auth, consultas às tabelas e chamadas RPC.                                                                                |
| PostgreSQL / Supabase  | `major_version = 17` na configuração local | Banco relacional, funções SQL/PLpgSQL, transações e RLS. A configuração local não confirma a versão atualmente hospedada. |
| AsyncStorage           | `2.2.0` declarado                          | Persistência da sessão de autenticação.                                                                                   |
| DateTimePicker         | `9.1.0` declarado                          | Seleção nativa de data.                                                                                                   |
| React Native SVG       | `15.15.4` declarado                        | Marca e ícones vetoriais.                                                                                                 |
| Expo Crypto            | `~57.0.2` declarado                        | UUID dos formulários.                                                                                                     |
| PGlite                 | `0.5.8`                                    | PostgreSQL local em memória nos testes.                                                                                   |
| Playwright Test        | `1.63.0`                                   | Fluxos web em Chrome com configuração Pixel 7.                                                                            |
| Node test runner + tsx | Script `tsx --test tests/*.test.ts`        | Testes de regras e banco.                                                                                                 |
| Prettier               | Configuração local                         | Aspas simples, largura 100, vírgula final e indentação de 2 espaços.                                                      |
| Sharp                  | Dependência de desenvolvimento             | Geração dos assets PNG a partir de SVG.                                                                                   |
| Python                 | Script `scripts/import-brief.py`           | Importação dos dados da solicitação para JSON e SQL.                                                                      |
| EAS CLI / Supabase CLI | Executados por `npx` nos scripts           | Build e configuração de serviços. Não são dependências diretas no `package.json`.                                         |

Também estão declarados módulos Expo de splash, fontes, links, constantes, status bar e system UI, além de Safe Area, Screens, Gesture Handler, Reanimated, Worklets e URL Polyfill. Uma dependência declarada não comprova uma funcionalidade adicional do produto.

### Identificadores e convenções

- Pacote npm privado `hashimoto-frota`, versão `1.0.0`.
- Android: `com.hashimoto.frota`, `versionCode: 1`.
- Scheme: `hashimotofrota`.
- Web: `output: single`.
- Aliases TypeScript: `@/*` → `src/*`; `@/assets/*` → `assets/*`.
- Metro usa a configuração base do Expo, `maxWorkers = 2` e bloqueia `.tools/`, `docs/`, `supabase/` e `test-results/` na resolução.
- O cache npm é local: `.tools/npm-cache`, definido em `.npmrc`.
- O ambiente observado nesta atualização usa Node `v24.12.0` e npm `11.12.1`. O `package.json` do projeto não fixa uma versão de Node por `engines`.
- `.vscode/` define tarefas de execução/teste, UTF-8, TypeScript local e formatação ao salvar. Há recomendação da extensão ESLint, mas não há script `lint` nem configuração ESLint no projeto examinado.

## 5. Estrutura de arquivos

```text
HashimotoFrota/
├── AGENTS.md                         Contexto e continuidade
├── README.md                         Operação e configuração
├── package.json / package-lock.json  Dependências e comandos
├── app.json / eas.json               Expo, Android e perfis EAS
├── tsconfig.json / metro.config.js   TypeScript e Metro
├── .env.example                      Nomes das variáveis públicas
├── .env                              Configuração local, ignorada
├── .gitignore / .npmrc               Exclusões e cache npm
├── .prettierrc.json / .prettierignore Formatação
├── playwright.config.ts              Configuração dos testes web
├── .vscode/                          Tarefas, ajustes e extensões
├── src/
│   ├── app/
│   │   ├── _layout.tsx               SafeAreaProvider, AuthProvider e Stack
│   │   ├── index.tsx                 Boas-vindas e botão Entrar
│   │   ├── login.tsx                 Login e acesso pendente de liberação
│   │   ├── +not-found.tsx            Rota inexistente
│   │   └── (frota)/
│   │       ├── _layout.tsx           Proteção das rotas, FleetProvider e AppShell
│   │       ├── inicio.tsx            Cards de serviços e histórico
│   │       ├── registro.tsx          Registro de equipes
│   │       ├── manutencao.tsx        Serviço, veículo e custo
│   │       └── historico.tsx         Busca, filtros, detalhes e paginação
│   ├── components/
│   │   ├── AppShell.tsx              Cabeçalho, rodapé, menu e faixa de demo
│   │   ├── Brand.tsx / Icon.tsx      Marca e ícones SVG
│   │   ├── Button.tsx               Botão, carregamento e desabilitação
│   │   ├── DateField.tsx            Data nativa e campo web
│   │   ├── SearchSelect.tsx         Seleção pesquisável por ID
│   │   ├── FormScreen.tsx           Estrutura rolável e botão de salvar fixo
│   │   └── Feedback.tsx             Erros e diálogo de sucesso
│   ├── providers/
│   │   ├── AuthProvider.tsx         Sessão, perfil, demonstração e saída
│   │   └── FleetProvider.tsx        Catálogos, rascunhos e dados de demonstração
│   ├── lib/
│   │   ├── supabase.ts              Cliente, validação de configuração e sessão
│   │   ├── api.ts                   Consultas e RPCs
│   │   ├── validation.ts            Regras dos formulários
│   │   ├── format.ts                Datas, moeda, busca e mensagens de erro
│   │   └── theme.ts                 Cores e estilos comuns
│   ├── types/models.ts              Tipos de domínio
│   └── data/demo.ts                 Pequeno catálogo ilustrativo
├── assets/                          Marca SVG, PNGs de ícone/splash e imagem secundária
├── supabase/
│   ├── config.toml                  Configuração local de API, banco e Auth
│   ├── cadastros.json               Dados fornecidos estruturados
│   ├── instalar.sql                 Consolidação das duas migrações iniciais
│   ├── migrations/
│   │   ├── 202609100001_schema.sql  Tabelas, índices, funções, grants e RLS
│   │   └── 202609100002_cadastros.sql Cadastros iniciais
│   └── tests/
│       ├── preflight.sql            Inspeção de tabelas e RLS
│       ├── inventory.sql            Contagens de dados
│       └── remote-validation.sql    Validação transacional com rollback
├── scripts/                         Ferramentas descritas na seção de comandos
├── tests/
│   ├── validation.test.ts           Formatação, validações e integridade dos cadastros
│   ├── database.test.ts             Migrações reais executadas no PGlite
│   └── ui/flows.spec.ts             Três fluxos de interface
├── docs/
│   ├── solicitacao.md               Solicitação original preservada
│   ├── ENTREGA.md                   Relatório de 10/09/2026
│   ├── reference/                   Sete páginas em PNG e TXT
│   └── screenshots/                 inicio.png, manutencao.png e historico.png
├── INICIAR.cmd / ABRIR-WEB.cmd       Atalhos de desenvolvimento
├── CONECTAR-CONTAS.cmd              Login nas ferramentas Expo e Supabase
├── VER-ACESSO-ADMIN.cmd              Consulta local da senha protegida
├── COPIAR-PROJETO.cmd               Geração de ZIP sem caches e credenciais
├── copias/                          ZIPs gerados
├── .tools/                          Ferramentas, caches e credenciais locais protegidas
├── .expo/ / expo-env.d.ts            Arquivos gerados pelo Expo
├── node_modules/                    Dependências instaladas
├── dist/                            Exportação web presente nesta pasta
└── test-results/                    Artefatos dos testes de interface
```

Não há diretórios nativos `android/` ou `ios/` nesta cópia. Ambos constam no `.gitignore`. `assets/Hashimoto_secundaria.png` está presente; a marca utilizada pelo componente `Brand` é desenhada em SVG no próprio código.

## 6. Funcionalidades implementadas

### Entrada, autenticação e navegação

- Boas-vindas com marca, mensagem e botão **Entrar**; indicador enquanto a sessão é carregada.
- Login por e-mail/senha com `signInWithPassword`, mensagens de erro e redirecionamento para `/inicio` quando o perfil está ativo.
- Acesso ainda não liberado mostra mensagem ao usuário e permite tentar carregar o perfil novamente ou usar outra conta.
- Rotas de frota protegidas por sessão e `profile.ativo`, exceto a demonstração de desenvolvimento.
- Menu com dados da conta, tela principal, histórico e saída da sessão local.
- Tela principal com Registro e Manutenção lado a lado e Histórico abaixo.
- `AuthProvider` recarrega o perfil ao retornar ao aplicativo. O código evita ativar o carregamento global nessa atualização quando o perfil já corresponde à sessão.

### Registro da Frota

- Data e contrato selecionado do catálogo.
- Começa com uma equipe; **Adicionar equipe** acrescenta blocos até o limite de 50.
- Cada bloco contém responsável e veículo obrigatórios; é possível remover equipes enquanto houver mais de uma.
- O número de equipes enviado ao banco é calculado pela função SQL a partir do array recebido.
- Validação de data, contrato ativo, pessoa ativa que não seja status e veículo ativo.
- Botão de salvar fixo, bloqueio de envio repetido enquanto a chamada está em andamento e mensagem de sucesso após retorno da gravação.
- Após o sucesso, opções de consultar o histórico ou iniciar novo registro, com novo UUID.

### Manutenção da Frota

- Data, tipo de manutenção, motorista, contrato, placa e custo.
- Placa escolhida na lista determina automaticamente o modelo; campo de modelo é somente leitura e limpa ao remover a placa.
- Modelos com `PENDENTE` exibem aviso de atualização cadastral pendente.
- Custo com máscara BRL; letras e outros caracteres não numéricos são removidos. O estado guarda até 12 dígitos representando centavos.
- Custo vazio é inválido; zero é aceito se informado explicitamente.
- Salva por RPC e apresenta confirmação, com opção de abrir o histórico ou limpar para novo envio.

### Seletores e datas

- `SearchSelect` abre modal com pesquisa, opções, seleção atual, fechamento e **Limpar seleção**.
- Pesquisa por partes do texto, sem distinção de caixa/acentos; a normalização de placa também ignora hífens e espaços.
- O texto digitado só filtra: o valor do campo muda ao tocar numa opção, armazenando seu ID, ou ao limpar para `null`.
- Usado para responsáveis, motoristas, contratos, placas e tipos de manutenção. Não há seletor independente de modelo nem dropdown de quantidade na tela atual.
- Datas são guardadas como `YYYY-MM-DD` e exibidas como `DD/MM/YYYY`. O código usa componentes locais de data e parsing ao meio-dia; valida datas impossíveis por comparação com a data reconstruída.
- Android usa DateTimePicker; web usa `input type="date"`; existe adaptação de seletor para iOS, sem comprovação de entrega iOS.

### Histórico

- Consulta registros de frota e manutenções pela RPC `buscar_historico`.
- Busca por placa ou contrato, com espera de 300 ms após a digitação.
- Filtros **Todos**, **Registros** e **Manutenções**.
- Cards com tipo, data, contrato, placas, custo quando aplicável e detalhes expansíveis de responsável/modelo/equipe.
- Mostra inicialmente até cinco itens. **Ver todos os registros** expande a lista carregada; **Carregar mais registros** busca outra página.
- Carrega 21 linhas por requisição para exibir 20 e detectar a existência da próxima página.
- Atualização ao entrar na tela, gesto de atualizar, estados de erro/vazio e nova tentativa. Controle de geração descarta respostas de buscas antigas.

### Rascunhos e demonstração

- Rascunhos ficam no `FleetProvider` e permanecem ao navegar entre serviços ou após erro de envio.
- A saída da conta, troca de sessão ou fechamento do aplicativo descarta os rascunhos. Não há fila offline nem sincronização posterior automática.
- Demonstração exige `__DEV__ && !isConfigured`, acionada explicitamente em **Conhecer as telas**.
- A demonstração usa `src/data/demo.ts`, faixa visível e exemplos somente em memória; não autentica nem grava no Supabase.
- A sessão real é persistida em AsyncStorage; isso não significa persistência dos formulários.

## 7. Banco de dados, permissões e decisões técnicas

Fonte principal: [migração de esquema](supabase/migrations/202609100001_schema.sql).

### Modelo relacional

Todas as oito tabelas têm `created_at`. Os quatro catálogos usam IDs `bigint` gerados como identidade; operações e usuários usam UUID.

| Tabela             | Campos/relações principais                                                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `usuarios`         | `id` referencia `auth.users`; `nome`, `email`, `perfil` (`funcionario` ou `admin`), `ativo`.                                                    |
| `funcionarios`     | `nome` único, `is_status`, `ativo`. Catálogo de pessoas, separado das contas de login.                                                          |
| `veiculos`         | `placa` única, `modelo`, `tipo` (`veiculo` ou `equipamento`), `ativo`.                                                                          |
| `contratos`        | `nome` único e `ativo`.                                                                                                                         |
| `tipos_manutencao` | `nome` único e `ativo`.                                                                                                                         |
| `registros_frota`  | `data`, `contrato_id`, `numero_equipes` entre 1 e 50, `usuario_id`.                                                                             |
| `registro_equipes` | `registro_frota_id`, `numero_equipe`, `responsavel_id`, `veiculo_id`; combinação registro/número única; exclusão em cascata com o registro pai. |
| `manutencoes`      | `data`, `tipo_manutencao_id`, `motorista_id`, `contrato_id`, `veiculo_id`, `custo`, `usuario_id`.                                               |

`usuarios` identifica quem acessa e envia; `funcionarios` identifica quem pode ser escolhido como responsável/motorista. A migração não cria vínculo obrigatório entre esses dois cadastros.

### Gravações e consultas

- **Relações por ID:** nomes, placas e modelos são obtidos dos catálogos. Não há tabela duplicada para consultas nem campo de modelo duplicado em `manutencoes`.
- **`salvar_registro`:** recebe UUID, data, contrato e equipes JSON; valida usuário e referências e grava pai/filhos na mesma transação.
- **`salvar_manutencao`:** recebe UUID e referências, valida atividade e custo e atribui `usuario_id` a partir de `auth.uid()`.
- **Idempotência:** o UUID nasce no formulário. As RPCs usam `pg_advisory_xact_lock` e comparação de conteúdo; repetir ID, usuário e dados retorna o mesmo ID. Reutilizar um ID existente com dados diferentes é rejeitado. A interface também bloqueia chamadas simultâneas do mesmo formulário.
- **Custo:** `numeric(12,2)`, de zero a `9999999999.99`; a RPC rejeita valores negativos, acima do limite ou com mais de duas casas decimais.
- **`buscar_historico`:** faz `UNION ALL` das operações e joins dos catálogos, agrega equipes e ordena por `created_at DESC, id DESC`. Usa `security invoker`, preservando RLS.
- **Busca SQL:** `normalizar` usa `lower` e `translate` para os acentos listados na função e hífens, sem depender de extensão adicional.
- **Catálogos:** `api.ts` lê ativos em lotes de 500, carrega os quatro catálogos em paralelo e remove `is_status` da lista de pessoas. Não usa uma tabela auxiliar de consultas.

### Autorização no banco

- RLS habilitada nas oito tabelas; acesso anônimo às tabelas e RPCs operacionais revogado.
- Funcionário ativo consulta seus próprios envios; administrador ativo consulta todos.
- Equipes seguem a visibilidade do registro pai.
- Usuário autenticado pode ler seu próprio perfil, inclusive para identificar que está inativo; administrador ativo pode ler os demais perfis.
- Leitura de catálogos exige usuário ativo. Inserção/atualização cadastral pelo papel autenticado exige administrador pelas políticas; o cliente não recebe permissão de exclusão dessas tabelas.
- Escritas operacionais pelo cliente passam pelas RPCs. Não há grants de inserção direta das operações nem de alteração de perfis para `authenticated`.
- Trigger `criar_perfil` cria perfil com `perfil='funcionario'` e `ativo=false`. Metadados do usuário podem fornecer o nome, mas não concedem atividade ou papel administrativo.
- Funções com `security definer` fixam `search_path=''`; as RPCs de gravação verificam usuário ativo e referências antes de novas inserções.
- Gestão de contas, ativação de perfis e administração cadastral são feitas pelo painel/SQL do Supabase nesta versão. Não existe tela administrativa no aplicativo.

### Cadastros iniciais

Fonte: [supabase/cadastros.json](supabase/cadastros.json) e [migração de cadastros](supabase/migrations/202609100002_cadastros.sql).

- **82 veículos/equipamentos**, preservando a associação placa/modelo fornecida.
- **102 pessoas** e uma entrada adicional **Parado na Base**, total de 103 linhas em `funcionarios`.
- `Parado na Base`: `is_status=true`, `ativo=false`; não pode ser responsável ou motorista.
- `SP-6539` e `SP-7188`: equipamentos, com modelos `RETROESCAVADEIRA` e `MINI RETROESCAVADEIRA`.
- **9 contratos:** Belford Roxo, Buri, Campos dos Goytacazes, Duque de Caxias, Magé, Natal, Paty do Alferes, São Gonçalo e Saquarema.
- **8 tipos:** Preventiva, Corretiva, Revisão, Pneus, Elétrica, Mecânica, Funilaria e Outros.
- Seeds usam `ON CONFLICT ... DO NOTHING`; sua repetição não deve substituir modelos corrigidos posteriormente. A migração de esquema não é um instalador repetível.

Os 12 modelos pendentes no arquivo fornecido são:

| Placa   | Modelo preservado     |
| ------- | --------------------- |
| BBE9E35 | PENDENTE - ALTERAR 1  |
| FJT9I54 | PENDENTE - ALTERAR 2  |
| FOW2B35 | PENDENTE - ALTERAR 3  |
| GIG9B72 | PENDENTE - ALTERAR 4  |
| KNC1076 | PENDENTE - ALTERAR 5  |
| KNH7B51 | PENDENTE - ALTERAR 6  |
| KRK8F40 | PENDENTE - ALTERAR 7  |
| KRN6J98 | PENDENTE - ALTERAR 8  |
| KTV1201 | PENDENTE - ALTERAR 9  |
| KYH5D78 | PENDENTE - ALTERAR 10 |
| LUL8A32 | PENDENTE - ALTERAR 11 |
| RFY4C30 | PENDENTE - ALTERAR 12 |

Essas contagens e pendências foram verificadas nos arquivos locais. Não representam uma nova contagem do banco hospedado.

## 8. Serviços e variáveis de ambiente

### Estado registrado em README e ENTREGA

- Supabase: projeto **Hashimoto Frota**, referência `qxkhjlkexsjgkttdugqt`, organização Hashimoto Soluções em Energia, região São Paulo (`sa-east-1`).
- O relatório registra as duas migrações aplicadas, RLS, cadastros e testes remotos concluídos. **Não executar novamente `supabase/instalar.sql` nesse banco já instalado.**
- EAS: `@duddalvs/hashimoto-frota`, ID `15fd53c4-415d-4545-aa0e-9d13cabf71fa`, também presente em `app.json`.
- O relatório registra URL/chave pública nos ambientes EAS `preview` e `production`, cadastro público desabilitado e login por e-mail habilitado.
- Administrador documentado: `dev.hashimoto.ltda@gmail.com`, criado e ativo, com login e leitura de catálogos testados na ocasião.

### Configuração local

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://qxkhjlkexsjgkttdugqt.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

O valor acima da chave é apenas um marcador. Preencher a chave pública real localmente conforme o README.

- `.env.example` contém somente os dois nomes, com valores vazios.
- O cliente só é configurado com URL HTTPS no domínio `*.supabase.co` aceito pela expressão regular e chave iniciada por `sb_publishable_`.
- `secret`, `service_role` e senhas não pertencem ao cliente nem a variáveis `EXPO_PUBLIC_*`.
- `scripts/check-env.mjs` valida o formato da URL/chave e a presença do ID EAS. Seu sucesso não verifica conectividade, credenciais remotas ou build.
- A sessão usa AsyncStorage, `persistSession`, `autoRefreshToken` e `detectSessionInUrl: false`; o refresh nativo acompanha o estado ativo do aplicativo.
- Reiniciar o Expo após alterar `.env` para carregar a configuração.
- O Supabase local usa portas 54321 (API) e 54322 (banco), URL Auth `http://localhost:8081`, redirect `hashimotofrota://`, JWT de 3600 segundos e senha mínima de 12 caracteres. O cliente atual restringe a URL a Supabase hospedado; esse arquivo de configuração não estabelece um fluxo pronto de uso do aplicativo contra localhost.
- Em `config.toml`, `auth.enable_signup=false` fecha o cadastro global, enquanto a seção de e-mail mantém o provedor habilitado conforme o comentário existente.

### Acessos e arquivos locais

- O login nas plataformas Expo/Supabase é separado do login no aplicativo.
- A senha administrativa fica protegida pelo Windows em `.tools/hashimoto-admin-access.json`; o atalho `VER-ACESSO-ADMIN.cmd` a mostra no computador de origem, para o mesmo usuário Windows.
- Existe também `.tools/supabase-frota-db-password.dpapi`; seu conteúdo não foi aberto para elaborar este documento.
- `.tools/`, `.env`, credenciais de assinatura e temporários do Supabase estão ignorados no `.gitignore` e excluídos pelo script de cópia.
- Para novos acessos, o README orienta criar a conta no Supabase Auth e ativar `public.usuarios`; a conta administrativa escolhida recebe `perfil='admin'` via administração do banco.

## 9. Comandos e ferramentas

Executar na raiz do projeto. No PowerShell, o README usa `npm.cmd`/`npx.cmd` para evitar a restrição dos wrappers `.ps1`, sem alterar a política global do Windows.

### Desenvolvimento, verificação e build

| Comando                              | Efeito e pré-requisito                                                                                       |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `npm.cmd ci`                         | Reinstala as dependências conforme `package-lock.json`; indicado no README para uma cópia extraída.          |
| `npm.cmd install`                    | Instala dependências; também consta nas instruções de início. Pode atualizar o lockfile.                     |
| `npm.cmd start`                      | `expo start`, para desenvolvimento com Expo Go.                                                              |
| `npm.cmd run android`                | `expo start --android`.                                                                                      |
| `npm.cmd run web`                    | `expo start --web`.                                                                                          |
| `npm.cmd run typecheck`              | `tsc --noEmit`.                                                                                              |
| `npm.cmd test`                       | `tsx --test tests/*.test.ts`; regras e banco PGlite local.                                                   |
| `npm.cmd run test:ui`                | `playwright test`; exige servidor web separado e modo de demonstração disponível.                            |
| `npm.cmd run doctor`                 | `expo-doctor`; o README também registra `npx.cmd expo-doctor`.                                               |
| `npm.cmd run build:web`              | `expo export --platform web`, saída em `dist/`.                                                              |
| `node scripts/check-env.mjs`         | Confere configuração local pública e vínculo EAS, sem consultar serviços.                                    |
| `node scripts/verificar-conexao.mjs` | Consulta o Supabase remoto; verifica Auth, cadastro fechado e bloqueio anônimo das oito tabelas e histórico. |
| `npm.cmd run build:apk`              | Executa `check-env.mjs` e `npx eas-cli@latest build -p android --profile preview`; inicia build remoto EAS.  |

O perfil `preview` usa `distribution: internal`, ambiente `preview` e `buildType: apk`. O perfil `production` também configura APK e ambiente `production`. Não há comando de publicação na Play Store.

Para Expo Go, o README orienta computador e celular na mesma rede e versão compatível com SDK 57. O requisito de mesma rede é do desenvolvimento; o APK instalado acessa o Supabase hospedado.

### Pré-requisito específico dos testes de interface

`playwright.config.ts` usa `http://localhost:8081` por padrão, aceita `PLAYWRIGHT_BASE_URL`, configura Chrome/Chromium com dispositivo Pixel 7, um worker, zero retries e trace em falha. Não inicia o servidor automaticamente.

Os três testes clicam em **Conhecer as telas**. Como o código oculta esse botão quando o Supabase está configurado, apenas iniciar a versão web com o `.env` conectado não satisfaz o cenário. Para reproduzir a suíte, usar uma cópia de desenvolvimento sem credenciais Supabase configuradas, mantendo o ambiente conectado preservado. Os testes salvam screenshots em `docs/screenshots/`.

### Scripts auxiliares e efeitos

| Arquivo/atalho                                              | Função                                                                                                                                                                                                                                                             |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `INICIAR.cmd`                                               | Abre `npm.cmd start` na pasta correta.                                                                                                                                                                                                                             |
| `ABRIR-WEB.cmd`                                             | Abre `npm.cmd run web`.                                                                                                                                                                                                                                            |
| `CONECTAR-CONTAS.cmd`                                       | Executa login Expo pelo navegador e login Supabase pelos CLIs oficiais.                                                                                                                                                                                            |
| `scripts/conectar-supabase.ps1 -ProjectRef <referencia>`    | Obtém a chave publishable via sessão CLI, atualiza `.env` e grava variáveis públicas no EAS em `preview` e `production`. Altera configuração local e remota.                                                                                                       |
| `scripts/criar-administrador.ps1 -Email <email>`            | Usa o projeto Supabase fixo do código, cria/reutiliza acesso administrativo conforme as verificações do script, protege a senha localmente, ativa perfil e testa login/catálogos. Altera Auth e banco; não é necessário executá-lo para apenas abrir o aplicativo. |
| `VER-ACESSO-ADMIN.cmd` / `scripts/mostrar-acesso-admin.ps1` | Mostra o acesso protegido localmente. Não registrar a saída em documentação, chat ou logs compartilhados.                                                                                                                                                          |
| `COPIAR-PROJETO.cmd` / `scripts/copiar-projeto.ps1`         | Gera ZIP em `copias/` com código, assets, docs, migrações e lockfile; exclui dependências, caches, builds, credenciais e links simbólicos/junctions.                                                                                                               |
| `node scripts/prepare-database.mjs`                         | Regera `supabase/instalar.sql` pela concatenação das duas migrações iniciais. Não aplica SQL no banco.                                                                                                                                                             |
| `python scripts/import-brief.py <arquivo>`                  | Importação única: sobrescreve `docs/solicitacao.md`, `supabase/cadastros.json` e a migração inicial de cadastros a partir do arquivo fornecido.                                                                                                                    |
| `node scripts/generate-assets.mjs`                          | Regera `assets/brand.svg`, `icon.png`, `splash.png` e `adaptive-icon.png`.                                                                                                                                                                                         |

Scripts administrativos exigem as sessões e os arquivos locais previstos no código. `criar-administrador.ps1` também contém as contagens iniciais de catálogos como expectativas de validação; essas expectativas podem deixar de valer depois de alterações cadastrais legítimas.

## 10. Verificações e alcance dos resultados

### Executadas em 15/09/2026 nesta atualização

| Verificação                      | Resultado                                                                               |
| -------------------------------- | --------------------------------------------------------------------------------------- |
| `npm.cmd run typecheck`          | Passou, código de saída 0.                                                              |
| `npm.cmd test`                   | 14 testes passaram; zero falhas, cancelamentos ou testes ignorados.                     |
| `node scripts/check-env.mjs`     | Passou a validação local; nenhum valor de chave foi incluído neste documento.           |
| Contagem do JSON inicial         | 82 veículos, 103 entradas em funcionários, 9 contratos, 8 tipos e 12 modelos pendentes. |
| Comparação do ZIP existente      | 91 de 91 arquivos idênticos aos correspondentes locais antes deste AGENTS.md.           |
| Corpo de `supabase/instalar.sql` | Corresponde à concatenação das duas migrações, após o cabeçalho de instalação.          |

Os 14 testes incluem três testes de formatação/validação/cadastros e um teste de banco com dez subtestes. PGlite cria um esquema Auth de teste, aplica as migrações reais e verifica seeds repetíveis, RLS, anonimato, inatividade, isolamento, administrador, atomicidade, idempotência, moeda, busca e paginação. Não realiza login real no Supabase Auth hospedado nem executa o aplicativo Android.

### Registradas anteriormente em `docs/ENTREGA.md`

- TypeScript e 14 testes locais aprovados.
- Expo Doctor: 21 de 21 verificações aprovadas.
- Três fluxos de interface em Chrome/Pixel 7 aprovados, sem erros de console.
- Exportações web e Android com bytecode Hermes aprovadas; o relatório ressalva que isso não é APK assinado.
- Instalação remota das migrações, contagens, RLS e testes de gravação/permissões aprovados.
- Conexão pública, Auth, cadastro público fechado, bloqueio anônimo e login do administrador com leitura dos catálogos aprovados.
- Abertura das telas via Expo informada pelo usuário naquele relatório.

`supabase/tests/remote-validation.sql` usa dados temporários e termina com `rollback`. Sua execução anterior é documentada; ele não foi executado novamente nesta atualização. `test-results/.last-run.json` contém `status: passed`, mas não substitui a execução atual nem informa por si só a data ou o alcance da suíte.

Não foram repetidos nesta atualização Expo Doctor, testes de interface, exportações, testes remotos, EAS Build ou validação em aparelho físico.

## 11. Problemas, divergências e limites conhecidos

| Situação confirmada                                    | Tratamento atual / consequência                                                                                                                                    |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Histórico Git indisponível nesta pasta                 | A continuidade depende dos arquivos, documentação e ZIP disponível; não há base local para atribuir mudanças a commits.                                            |
| 12 modelos sem definição                               | Preservados como `PENDENTE - ALTERAR N`; a manutenção mostra aviso. Não há dados confirmados para substituí-los.                                                   |
| Significado operacional de “Parado na Base” indefinido | Mantido como status inativo e excluído das opções de pessoa.                                                                                                       |
| Quantidade de equipes difere do pedido original        | Pedido descreve dropdown; código e teste atuais usam adicionar/remover blocos, com limite de 1 a 50. A motivação da mudança não está registrada.                   |
| Testes web dependem da demonstração                    | O `.env` conectado faz o botão de demonstração desaparecer; preparar o cenário correto antes de executar a suíte.                                                  |
| Rascunhos somente em memória                           | Permanecem durante a navegação e após erros, mas se perdem ao fechar/sair.                                                                                         |
| Operação exige conexão                                 | Não há persistência offline de envios nem sincronização automática.                                                                                                |
| Administração externa ao aplicativo                    | Contas, permissões e cadastros são geridos no Supabase. A tela de login encaminha recuperação de senha ao administrador.                                           |
| Histórico usa catálogos atuais                         | Nomes, placas e modelos são lidos por joins; não há snapshot textual desses dados no envio. Alterações cadastrais podem aparecer em consultas a registros antigos. |
| Cópia manual inclui arquivos locais                    | `.gitignore` não filtra o Explorador do Windows. O script de ZIP faz suas próprias exclusões.                                                                      |
| Senhas protegidas não acompanham o ZIP                 | O acesso protegido depende do usuário Windows e dos arquivos da pasta original. A cópia exige reinstalar dependências e configurar `.env`.                         |
| Exportação não comprova entrega Android                | O relatório mantém pendentes build EAS, instalação e abertura do APK.                                                                                              |

Não foram encontrados marcadores `TODO` ou `FIXME` no código, scripts e testes consultados. Isso não elimina as pendências documentadas nem comprova ausência de defeitos. Nenhuma falha foi reproduzida no TypeScript ou nos 14 testes locais desta atualização.

## 12. Pendências confirmadas

### Entrega operacional

1. Validar no aparelho Android o login real, um envio de Registro, um envio de Manutenção e a consulta de ambos no Histórico, conforme `docs/ENTREGA.md`.
2. Instalar e abrir em Android real o APK gerado pelo EAS em 17/09/2026, validando o uso sem Expo Go e sem depender do computador. Build e download concluídos; teste no aparelho continua pendente.

### Dados e documentação

3. Obter os modelos definitivos dos 12 veículos pendentes, preservando a associação com as placas até haver informação confirmada.
4. Definir a regra de negócio para **Parado na Base** antes de alterar sua disponibilidade nos formulários.
5. Alinhar a especificação de “Número de equipes” com a implementação atual de adicionar/remover blocos, preservando a distinção já registrada neste documento. Não há justificativa histórica confirmada para escolher automaticamente uma das versões como nova exigência.

Persistência offline, telas administrativas e recuperação autônoma de senha são limites da versão atual; não há compromisso de implementação desses itens nas fontes consultadas. Não convertê-los em escopo aprovado sem uma solicitação.

### Critério de conclusão a preservar

Os critérios originais incluem fluxo de entrada/principal, cards e navegação, seletores com escolha obrigatória, modelo derivado da placa, gravações e histórico no Supabase, catálogos reais, RLS e uso em Android físico com APK independente de Expo Go/computador. Código e testes locais cobrem parte desses critérios; a comprovação operacional em aparelho e APK continua necessária.

## 13. Orientações para continuidade

Revisão seguinte do cabeçalho em 15/09/2026: usuário pediu retirar o caminhão e aumentar levemente a logo. O cabeçalho agora usa `Brand compact wordmarkOnly`, com imagem de 144 × 48 px (antes 114 × 38 px) e altura da faixa mantida em 64 px. Essa revisão substitui a composição horizontal descrita abaixo; entrada/login e splash continuam com caminhão. TypeScript aprovado.

Ajuste do cabeçalho em 15/09/2026: por solicitação do usuário, somente o cabeçalho usa `Brand compact horizontal`, com “Hashi App” à esquerda e caminhão laranja à direita, ambos menores. Cabeçalho de 64 px, áreas de toque de 48 px; telas de entrada/login e splash continuam com composição vertical. TypeScript aprovado e renderização conferida em larguras de 320 e 412 px, sem sobreposição e com menu funcional.

Logo aprovada e aplicada em 15/09/2026: a pedido do usuário, `assets/Hashi_App_v1.png`, gerada com base em `assets/Hashimoto_secundaria.png`, substitui os textos da marca em `Brand.tsx`, abaixo do caminhão laranja. Abrange cabeçalho, entrada/espera de sessão e login. `app.json` usa `assets/splash-hashi-app.png` para abertura nativa, reproduzível por `scripts/generate-splash.mjs`; exige nova compilação nativa. TypeScript e renderização web conferidos, sem build/teste físico de APK nesta alteração. Nome do pacote e identificadores dos serviços permanecem os documentados. Prompt e origem em `docs/hashi-app-logo.md`.

### Refinamento da tela principal — 15/09/2026

A pedido do usuário nesta conversa, a tela principal foi refinada mantendo a proposta básica: saudação personalizada e pergunta curta “O que vamos registrar hoje?”, cards de Registro e Manutenção lado a lado com bordas suaves, ícones menores e textos alinhados à esquerda, além do Histórico abaixo. Foram removidos o texto “SEU DIA EM CAMPO”, a pergunta longa e a frase decorativa inferior. Fonte: `src/app/(frota)/inicio.tsx`. TypeScript e os três fluxos Playwright passaram nesta alteração; a captura `docs/screenshots/inicio.png` foi conferida visualmente. Os testes usaram demonstração em servidor isolado na porta 8084, sem carregar `.env`; não constituem teste Android físico ou remoto.

- Consultar primeiro a solicitação original, este documento e os arquivos da área alterada. Para comportamento atual, conferir o código; quando ele divergir da documentação, registrar a diferença sem inventar uma decisão anterior.
- Preservar componentes reutilizáveis, tipagem estrita, tema centralizado, textos em português e os dois botões do rodapé.
- Preservar seleção por IDs, modelo derivado do veículo, custo decimal, referências ativas, RLS, perfil inicialmente inativo e gravações transacionais/idempotentes.
- Preservar grafia e associações dos cadastros fornecidos, equipamentos e modelos pendentes até confirmação de dados novos.
- Manter chaves administrativas e senhas fora do aplicativo, dos arquivos compartilhados e deste documento. Os identificadores públicos de projeto não substituem credenciais.
- Não reaplicar o instalador inicial ao banco documentado como instalado. Para mudanças de banco, considerar o estado já instalado e verificar os efeitos sobre dados, funções e permissões.
- Distinguir teste local, teste de interface em demonstração, validação remota e teste Android físico ao registrar resultados. Não declarar APK entregue apenas porque uma exportação passou.
- Ao alterar regras, API, validação ou SQL, usar `typecheck` e os testes locais pertinentes. Para fluxos de interface, observar os pré-requisitos do Playwright. Mudanças apenas documentais pedem conferência das fontes e formatação.
- Atualizar este AGENTS.md e a documentação operacional quando houver mudanças confirmadas, incluindo a data, a fonte e o que efetivamente foi verificado.
