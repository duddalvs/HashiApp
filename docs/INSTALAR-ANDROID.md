# Instalar o aplicativo no Android

Versão **0.1**, gerada em **18/09/2026**: [baixar APK (23,4 MB)](https://expo.dev/artifacts/eas/zydxBaOzbqacEchCpw3sdtBRuDtwzQIM3HFDlVDeWno.apk). Arquivo local: `entrega/Hashi-App-0.1.apk`.

**Alteração posterior no código:** o Histórico passou a mostrar a hora original do envio ao lado da data em Registros e Manutenções. Essa mudança foi validada no navegador, mas ainda exige nova compilação para aparecer no aplicativo instalado; não está no APK deste link.

O aplicativo se chama **Hashi App** e usa a imagem fornecida em `assets/iconn.png` como ícone, centralizada sem cortar o desenho. O menu mostra **Hashi App · versão 0.1**; a versão informada ao Android também é **0.1**. Inclui a pesquisa de funcionários por partes do nome, em ordem, com destaque.

1. Baixe o APK ou transfira o arquivo da pasta `entrega` para o celular.
2. Abra o arquivo e toque em **Instalar** ou **Atualizar**. Se o Android solicitar, permita a instalação por esse navegador ou gerenciador de arquivos.
3. Abra **Hashi App** e entre com seu usuário e senha existentes.

Para atualizar o APK anterior, escolha **Atualizar**, sem desinstalar antes. O pacote `com.hashimoto.frota` e o certificado de assinatura foram preservados. O código interno da compilação passou de 2 para **3**; ele é separado do nome público da versão **0.1**.

Compatível com celulares Android ARM de 32 ou 64 bits, API 24 ou superior. Não instala no iPhone. O aplicativo não depende de Expo Go nem do computador ligado; precisa de internet para autenticar, consultar e salvar no Supabase. Os registros continuam no banco na nuvem.

## Tamanho e verificação

Arquivo com **23.421.863 bytes (23,4 MB; 22,3 MiB)**. Mantidas as otimizações R8, remoção de recursos não utilizados e compressão das bibliotecas nativas e do JavaScript. O tamanho continua **52,41% menor** que o APK original de 49.211.807 bytes. Isso não mede o tamanho instalado ou o desempenho no celular. A compressão do JavaScript pode afetar o tempo de abertura, conforme a [documentação do Expo](https://docs.expo.dev/versions/latest/sdk/build-properties/).

Integridade ZIP/CRC, manifesto, versão 0.1, nome, ícones extraídos do APK, bibliotecas ARM e configuração pública do Supabase conferidos. Assinatura APK v2 e digest do conteúdo verificados com OpenSSL e verificador local do formato; mesmo certificado do APK anterior. Não foi usado `apksigner`. Relatório: `entrega/verificacao-apk-0.1.json`.

TypeScript, Prettier, Expo Doctor 21/21 e dois fluxos de perfil/menu no navegador aprovados. A versão no menu foi conferida em 320 px, com captura em `.tools/menu-0.1.png`.

SHA-256: `f71bdc651d9fef92f39634b84d56a4ddbe15d6eabe44de6bab3fc627002bd4c0`.

## Conferência no aparelho

Instalação, abertura, desempenho e fluxos em Android físico ainda não foram testados nesta revisão. Após instalar, conferir o ícone na tela do celular, versão 0.1 no menu, login, Histórico, envio, edição e restauração da sessão ao reabrir. Use dados identificáveis de teste ao conferir gravações.

## Próximas atualizações

Mudanças no ícone ou código exigem nova compilação nesta configuração. Preserve o pacote e a assinatura; aumente `android.versionCode` a cada atualização. O menu lê a versão de `app.json`, evitando um texto fixo divergente. `package.json` usa `0.1.0` por compatibilidade com a versão semântica do npm; a interface e o Android usam **0.1**.

`assets/iconn.png` é a imagem original de 119 × 74 px. `node scripts/prepare-launcher-icon.mjs` prepara os recursos quadrados `iconn-launcher.png` e `iconn-adaptive.png`, preservando a proporção e as margens do ícone adaptável. Esses recursos já acompanham o pacote enviado ao Expo.

Para distribuir, envie somente o APK; não envie o projeto, arquivos de acesso ou uma cópia do banco. APKs anteriores permanecem em `entrega` como histórico.
