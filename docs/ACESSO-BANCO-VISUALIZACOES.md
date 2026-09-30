# Acesso ao banco para visualizações

**Revisão dos filtros — 30/09/2026:** o app usa `filtrar_historico_multiplos` e `opcoes_filtros_historico_completas`, instaladas e testadas no Supabase. A consulta combina datas inicial/final com listas de motoristas, placas, contratos, autores e tipos de manutenção. Filtra sempre pela data informada no registro; o padrão é hoje e os seis dias anteriores em Brasília. Para relatórios sem limite de datas, enviar explicitamente `p_data_de: null` e `p_data_ate: null` e percorrer as páginas. As opções de autores incluem nome e sobrenome. O painel do aplicativo agora exige as duas datas antes de aplicar; os limites opcionais descritos aqui continuam disponíveis na RPC para integrações. As RPCs anteriores permanecem sem mudança de contrato.

**Adendo de 30/09/2026:** disponível a RPC `buscar_historico_com_autor`, aplicada e testada no Supabase. Recebe os mesmos parâmetros de `buscar_historico` e acrescenta `autor_nome` (o valor completo de `usuarios.nome` da conta criadora do envio). A consulta antiga continua disponível; filtros, paginação e visibilidade são preservados. Nenhuma credencial de conexão foi alterada.

Conferência em **29/09/2026**. Projeto existente: **Hashimoto Frota**, referência `qxkhjlkexsjgkttdugqt`, região cadastrada `sa-east-1` (São Paulo). PostgreSQL remoto **17.6**.

## Painel do Supabase

[Abrir o projeto](https://supabase.com/dashboard/project/qxkhjlkexsjgkttdugqt).

O painel usa a conta Supabase que possui acesso ao projeto. Esse acesso é separado dos usuários do Hashi App e da senha PostgreSQL. Em **Connect**, consulte as conexões do banco; em **Settings → API Keys**, consulte as chaves. Nenhuma senha da conta do painel foi consultada ou alterada.

## PostgreSQL para ferramenta de relatórios ou servidor

Conexão Session pooler encontrada no projeto vinculado:

| Configuração | Valor |
|---|---|
| Host | `aws-0-sa-east-1.pooler.supabase.com` |
| Porta | `5432` |
| Banco | `postgres` |
| Usuário administrativo | `postgres.qxkhjlkexsjgkttdugqt` |
| Schema operacional | `public` |
| SSL | Ativado; `sslmode=require` |
| Senha salva | Abra `VER-ACESSO-BANCO.cmd` na raiz do projeto |

O atalho mostra a senha e a connection string completa, com a senha codificada para URL. Usa a cópia protegida pelo Windows em `.tools/supabase-frota-db-password.dpapi`; depende do mesmo usuário/ambiente Windows. A leitura dessa cópia foi verificada sem exibir o segredo no relatório. Se a senha tiver sido redefinida no painel, a cópia local pode estar desatualizada. Não houve teste de autenticação PostgreSQL com essa senha nesta entrega; a consulta remota de metadados foi feita pelo CLI vinculado.

Modelo, sem a senha:

```text
postgresql://postgres.qxkhjlkexsjgkttdugqt:SENHA_CODIFICADA@aws-0-sa-east-1.pooler.supabase.com:5432/postgres?sslmode=require
```

O Session pooler atende conexões de redes IPv4; os dados também podem ser conferidos no botão Connect do projeto. [Documentação de conexões Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres).

Esse usuário é administrativo. Para disponibilizar um sistema destinado apenas a visualizações, prefira um usuário PostgreSQL com permissão somente de leitura, configurado no servidor ou na ferramenta de relatórios. Não foi criado novo usuário ou alterada permissão nesta entrega. Senhas do banco e chaves secretas devem ficar no servidor, fora do código enviado ao navegador. [Documentação de chaves Supabase](https://supabase.com/docs/guides/api/api-keys).

## API para o novo sistema

```env
SUPABASE_URL=https://qxkhjlkexsjgkttdugqt.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_VbAyds6D5l3bchOBVMWC1g_XMITcsss
```

URL REST: `https://qxkhjlkexsjgkttdugqt.supabase.co/rest/v1`.

Os nomes das variáveis acima são genéricos; no aplicativo atual possuem prefixo `EXPO_PUBLIC_`. A chave é publicável e identifica o projeto; não substitui o login nem concede leitura irrestrita.

O Hashi App usa **autenticação própria por usuário e senha**, por RPC, sem Supabase Auth. O token retornado não é JWT. A integração deve:

1. Chamar `autenticar_usuario` com `p_usuario` e `p_senha`; verificar erro da requisição e `data.error`.
2. Guardar a sessão adequadamente no sistema novo e enviar `data.token` como `p_token` nas RPCs seguintes.
3. Usar `meu_perfil`, `listar_catalogos`, `filtrar_historico_multiplos`, `opcoes_filtros_historico_completas` e `obter_envio` para leitura. As consultas anteriores continuam disponíveis com os contratos anteriores.
4. Chamar `encerrar_sessao` ao sair.

| RPC | Parâmetros |
|---|---|
| `autenticar_usuario` | `p_usuario`, `p_senha` |
| `meu_perfil` | `p_token` |
| `listar_catalogos` | `p_token` |
| `buscar_historico` | `p_token`, `p_busca=''`, `p_limite=21`, `p_offset=0`, `p_tipo='todos'` |
| `buscar_historico_com_autor` | Mesmos parâmetros de `buscar_historico`; retorna também `autor_nome` |
| `filtrar_historico_multiplos` | `p_token`, `p_tipo='registro'`, `p_data_de=hoje-6`, `p_data_ate=hoje`, arrays `p_motorista_ids`, `p_veiculo_ids`, `p_contrato_ids`, `p_autor_ids`, `p_tipo_manutencao_ids` vazios por padrão; `p_limite=21`, `p_offset=0` |
| `opcoes_filtros_historico_completas` | `p_token`; opções do histórico autorizado, inclusive inativas; autores incluem `nome`, `sobrenome` e `login` |
| `filtrar_historico` | `p_token`, `p_tipo='registro'`, `p_periodo='week'`, `p_campo_data='created_at'`, `p_data_de=NULL`, `p_data_ate=NULL`, `p_motorista_id=NULL`, `p_veiculo_id=NULL`, `p_contrato_id=NULL`, `p_autor_id=NULL`, `p_tipo_manutencao_id=NULL`, `p_limite=21`, `p_offset=0` |
| `opcoes_filtros_historico` | `p_token`; retorna motoristas, veículos, contratos, autores e serviços referenciados no histórico autorizado, inclusive inativos |
| `obter_envio` | `p_token`, `p_id`, `p_tipo` (`registro` ou `manutencao`) |
| `encerrar_sessao` | `p_token` |

As assinaturas e permissões acima foram conferidas no banco remoto. `anon` não possui SELECT direto nas oito tabelas públicas: chamar `.from('manutencoes').select()` usando apenas a chave publicável não é o fluxo permitido atualmente. Funcionários consultam os próprios envios; administradores do aplicativo consultam todos. Um administrador do aplicativo também possui operações de escrita/exclusão; ocultar botões não transforma a conta em somente leitura.

As consultas de Histórico paginam resultados; limite máximo de 101 itens por chamada. Um relatório completo precisa percorrer as páginas. `filtrar_historico_multiplos` aceita apenas `registro` ou `manutencao`. As datas são inclusivas e aplicadas a `data`; `created_at` continua indicando o lançamento e ordenando os resultados. Omitir as datas usa a semana padrão; enviar NULL remove o respectivo limite. Arrays vazios não filtram. As opções do mesmo campo são combinadas com OU, e campos diferentes com E. Motorista `0` na lista significa Motorista não identificado em manutenção. Os critérios são aplicados antes da paginação; motorista e placa devem corresponder à mesma equipe na alocação. Assinatura detalhada no [documento de integração](HASHI-APP-INTEGRACAO-HASH-WEB.md#11-operações-supabase).

`filtrar_historico` e `opcoes_filtros_historico` são versões anteriores preservadas para compatibilidade. A consulta singular continua usando `p_periodo`, `p_campo_data` e IDs únicos; o aplicativo atualizado usa as duas novas RPCs. `buscar_historico` e `buscar_historico_com_autor` também mantêm seus contratos, inclusive a categoria `todos`.

## Tabelas para as visualizações

| Tabela | Conteúdo |
|---|---|
| `registros_frota` | Cabeçalho da alocação: data, contrato, autor e versão. |
| `registro_equipes` | Equipes, responsáveis e veículos vinculados à alocação. |
| `manutencoes` | Serviços, veículos, motorista, contrato, custo e observação de até 40 caracteres. |
| `funcionarios` | Catálogo de responsáveis/motoristas. |
| `veiculos` | Placas, modelos e tipo de veículo/equipamento. |
| `contratos` | Catálogo de contratos. |
| `tipos_manutencao` | Catálogo dos serviços. |
| `usuarios` | Contas do aplicativo e seus perfis. |

`usuarios` e `funcionarios` têm finalidades diferentes. Credenciais e sessões ficam no schema `private` e não são dados necessários aos gráficos operacionais.

As relações e regras completas estão em [HASHI-APP-INTEGRACAO-HASH-WEB.md](HASHI-APP-INTEGRACAO-HASH-WEB.md). Relatório da conferência de acesso: `.tools/verificar-acesso-visualizacoes-20260929.json`. A entrega de 29/09 continha informações e um atalho local, sem alteração de banco ou APK. As revisões de 30/09 adicionaram consultas de autoria e filtros, sem alterar credenciais ou dados operacionais. A última validação SQL remota passou com rollback integral; conferência posterior manteve 7 contas, 21 alocações, 50 manutenções e zero cadastros temporários. Relatórios `.tools/history-multiple-validated.json`, `.tools/history-multiple-postcheck.json` e `.tools/history-multiple-api.json`.
