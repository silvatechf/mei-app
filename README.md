# MEI em Dia 2.0

**Guia independente para ajudar o Microempreendedor Individual (MEI) a compreender orientações sobre débitos, encontrar canais oficiais e organizar tarefas e prazos.**

> **Aviso importante:** o MEI em Dia não é um serviço do Governo Federal, não consulta a situação fiscal do usuário e não confirma elegibilidade individual ao perdão de débitos. As informações e datas são referências educativas e devem ser confirmadas nos canais oficiais. O projeto não substitui orientação contábil ou jurídica.

## Objetivos

- Explicar informações fiscais em linguagem simples.
- Orientar o usuário para fontes oficiais, sem solicitar cadastro.
- Oferecer um checklist de organização com progresso salvo no navegador.
- Exportar tarefas pendentes para um calendário (`.ics`).
- Permitir cópia de segurança e restauração manual do progresso (`.json`).
- Disponibilizar uma aplicação web instalável (PWA) e preparar acesso offline após a primeira visita online.

## Funcionalidades incluídas

- Fluxo guiado com uma pergunta por vez, quatro motivos para começar e orientações de prevenção contra golpes.
- Links para canais oficiais da PGFN e da Receita Federal.
- Checklist de tarefas, indicador de progresso e datas de referência.
- Exportação dos prazos pendentes para arquivo de calendário com lembrete configurado para um dia antes. A exibição e entrega dos alertas dependem do aplicativo de calendário e do dispositivo.
- Salvamento local das tarefas concluídas no navegador.
- Exportação e restauração manual do progresso por arquivo JSON.
- Manifesto, ícones e service worker para suporte PWA/offline.

**Limitações:** não há backend, conta de usuário, sincronização entre dispositivos nem notificações automáticas próprias. O modo offline só pode ser avaliado depois de uma primeira abertura online numa versão de produção servida por `npm run preview` ou HTTPS. Links externos precisam de conexão. A funcionalidade offline deve ser testada no navegador e no caminho de publicação escolhidos antes de divulgar o site.

## Requisitos

- Node.js 20 ou superior recomendado.
- npm incluído com Node.js.
- Git (opcional, para versionamento).

## Executar localmente — Windows PowerShell

Abra o PowerShell na pasta do projeto que contém `package.json` e execute:

```powershell
npm install
npm run dev
```

Abra o endereço local informado pelo Vite, normalmente `http://localhost:5173`.

## Validar a versão de produção

```powershell
npm run build
npm run preview
```

Abra o endereço indicado pelo comando `preview` (normalmente `http://localhost:4173`). Para testar o service worker, use o preview de produção, não apenas o servidor de desenvolvimento.

## Testar o modo offline

1. Execute `npm run build` e `npm run preview`.
2. Abra a aplicação com conexão disponível e aguarde o carregamento completo.
3. Em DevTools do navegador, abra **Application → Service Workers** e confirme que o service worker está ativo.
4. Em **Application → Cache Storage**, verifique se os recursos locais foram armazenados.
5. Ative o modo offline e recarregue a página.
6. Repita após uma atualização de versão e confirme que a aplicação não fica em branco.

O comportamento pode variar entre navegadores; não considere o modo offline aprovado até realizar esse teste.

## Dados e privacidade

- O projeto não envia as respostas do diagnóstico a um servidor próprio.
- As tarefas concluídas são guardadas no `localStorage` do navegador.
- O arquivo de backup exportado contém identificadores das tarefas concluídas e a data da exportação; não deve ser tratado como um arquivo fiscal.
- O armazenamento local pode ser apagado pelo usuário, pelo navegador ou pelo sistema. Faça uma cópia de segurança se precisar transferir o progresso.
- Não inclua senhas, CPF, CNPJ, documentos fiscais ou outros dados pessoais em issues, commits ou arquivos do repositório.

## Fontes oficiais para consulta

- **PGFN — Perguntas frequentes sobre o perdão de débitos do MEI:** https://www.gov.br/pgfn/pt-br/servicos/perguntas-frequentes/perguntas-frequentes-perdao-do-mei
- **Receita Federal — serviços digitais:** https://servicos.receitafederal.gov.br/
- **PGMEI — emissão/consulta do DAS:** https://www8.receita.fazenda.gov.br/simplesnacional/aplicacoes/atspo/pgmei.app/identificacao
- **Regularize / PGFN:** https://www.regularize.pgfn.gov.br/

Confirme sempre a regra aplicável, os prazos vigentes e a situação individual diretamente nos portais oficiais. Datas fixas exibidas no checklist são lembretes de organização e não substituem uma consulta oficial atualizada.

## Publicação

O repositório inclui uma configuração inicial de CI para GitLab Pages (`.gitlab-ci.yml`). Antes de publicar, revise a configuração de `base` em `vite.config.ts` e confirme o caminho do projeto no GitLab Pages. Depois do deploy, valide os links, a instalação PWA e o modo offline no URL público real.

## Estrutura do projeto

```text
mei-em-dia-v2-work/
├── public/
│   ├── icons/
│   ├── manifest.webmanifest
│   └── sw.js
├── src/
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── vite-env.d.ts
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
├── .gitlab-ci.yml
├── .gitignore
└── README.md
```

## Estado de validação

A versão candidata inclui um fluxo guiado de uma pergunta por tela e uma orientação inicial para mensagens suspeitas. A instalação de dependências não terminou no ambiente de preparação; portanto, a compilação desta alteração ainda precisa ser executada localmente.

Este pacote é uma versão candidata. Antes de publicar, execute `npm install` e `npm run build`, teste exportação/importação do backup, importação do `.ics`, funcionamento offline e o caminho de deploy. Não declarar a versão pronta para produção sem concluir esses testes.

## Licença

Nenhuma licença de distribuição foi definida neste repositório ainda. Antes de tornar o projeto open source, escolha e adicione explicitamente uma licença apropriada.


### Organização de prazos — experiência simplificada

- A ação principal é adicionar lembretes ao calendário; a aplicação prepara um arquivo `.ics` para importação no calendário escolhido.
- Cópia e recuperação do progresso ficam em **Mais opções**, para não sobrecarregar a tela principal.
- O progresso das tarefas é salvo automaticamente no armazenamento local do navegador.
- Os lembretes e alertas dependem do calendário e das configurações do dispositivo. Confirme os vencimentos nos canais oficiais.
