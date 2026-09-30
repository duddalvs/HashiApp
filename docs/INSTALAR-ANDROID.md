# Instalar o aplicativo no Android

Versão **0.1**, compilação **8**, gerada em **25/09/2026**: [baixar APK (23,4 MB)](https://expo.dev/artifacts/eas/vtfONwZgzUtcid4OXmi9-VMOSWjEct5QubtLwMdKads.apk). Arquivo: `entrega/Hashi-App-0.1-b8.apk`.

## Atualização da Manutenção

Inclui **Observação (opcional)** abaixo de Tipo de manutenção e antes de Valor, com contador e limite de **40 caracteres**. O texto é salvo no Supabase, pode ser alterado ou limpo na edição e aparece nos detalhes do Histórico quando preenchido. A migração correspondente já está aplicada; registros anteriores continuam válidos e não recebem texto inventado.

As melhorias anteriores de busca de motoristas, seletor em camada do aplicativo e sugestão do último veículo na Alocação foram preservadas. A observação não altera motorista, placa, custo, autoria ou permissões.

## Instalação

1. Baixe **Hashi-App-0.1-b8.apk** pelo link acima no Android.
2. Abra o arquivo e toque em **Atualizar**, sem desinstalar o aplicativo anterior. Aguarde a confirmação. Se solicitado pelo Android, permita instalar por esse navegador/gerenciador de arquivos.
3. Confira no login ou em **Menu → Sua conta**: **Hashi App · versão 0.1 · compilação 8**.
4. Abra **Manutenção**, escolha o tipo e confira **Observação (opcional)** logo abaixo. Preencha até 40 caracteres, salve e consulte o detalhe no Histórico.
5. Ao editar, confira que o texto foi carregado e que é possível alterá-lo ou deixá-lo vazio.

O código interno **8** é maior que os anteriores, incluindo o APK 0.2/6. Pacote `com.hashimoto.frota` e certificado de assinatura são os mesmos da compilação 7. As contas e os registros existentes são preservados. APKs antigos continuam compatíveis com o banco e não apagam uma observação ao editar outros campos; porém só a compilação 8 ou posterior exibe o novo campo.

Android ARM de 32/64 bits, API 24 ou superior. Não instala no iPhone. Não depende de Expo Go ou computador ligado; precisa de internet para autenticar, consultar e salvar no Supabase.

## Verificações

Arquivo com **23.428.019 bytes (23,4 MB)**. Mantidos R8, remoção de recursos, compressão de bibliotecas/JavaScript e ARM 32/64. Compilado no EAS com `--clear-cache`.

Build **`110a9726-5d0a-47d6-bf06-cc78db1a055e`**, concluído em **2026-09-25T15:24:27.472Z**. Verificados ZIP/CRC, manifesto e configuração embarcada 0.1/8, nome, pacote, código da observação no bytecode Hermes, configurações públicas do Supabase, seletores anteriores, compressão e ausência de arquivos administrativos. Assinatura APK v2 e digest verificados com OpenSSL e verificador local; certificado idêntico ao APK 0.1/7. Relatório: `entrega/verificacao-apk-0.1-b8.json`.

Na implementação imediatamente anterior: TypeScript, Prettier, **45 testes locais**, **dois fluxos Playwright** e teste SQL no Supabase com rollback aprovados. Limite de 40 caracteres, colagem, contador, envio, leitura/Histórico, edição/limpeza, concorrência, permissões e compatibilidade das RPCs cobertos. Expo Doctor **21/21** aprovado antes deste build. **Instalação e uso desta compilação em Android físico ainda não testados.**

SHA-256: `a0708e32aa167d2d79dfdc67e2d5cdca46e18306269755b3575c8890ecd5cb6c`.

## Próximas atualizações

Preservar pacote e assinatura e aumentar `android.versionCode`. Login e menu usam a configuração Expo embarcada; o manifesto web omite o código Android. Alterações de código ou ícone exigem nova compilação nesta configuração. npm usa 0.1.0, versão pública 0.1.

Para distribuir, enviar apenas o APK. Os arquivos anteriores permanecem em `entrega` como histórico; o projeto e os arquivos administrativos não são necessários no celular.
