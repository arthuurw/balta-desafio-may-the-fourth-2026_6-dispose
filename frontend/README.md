# Dispose — Frontend

Interface web do app de coleta de lixo urbano com IA. Consome a API .NET em `backend/`.

## Stack

- **Next.js 16** — App Router, Server/Client Components
- **TypeScript**
- **Tailwind CSS v4** — design system via `@theme` em `globals.css`
- **Lucide React** — ícones
- **Vitest 2 + Testing Library** — testes unitários

## Estrutura

```
src/
├── app/
│   ├── layout.tsx          — fonte Inter, metadados
│   ├── page.tsx            — página principal (4 tabs)
│   └── globals.css         — tokens de cor e tipografia via @theme
├── components/
│   ├── ScheduleCard.tsx    — agenda de coleta por tipo de resíduo
│   ├── CollectionPointList.tsx — pontos de coleta com distância
│   ├── ReminderForm.tsx    — formulário de novo lembrete
│   ├── ReminderList.tsx    — lembretes pendentes/concluídos
│   └── ChatAgent.tsx       — chat com agente IA
├── services/
│   └── api.ts              — fetch wrapper, timeout 30s, ApiError
├── test/
│   ├── setup.ts
│   └── api.test.ts         — 17 testes (schedule, nearby, reminders, chat)
└── types/
    └── index.ts            — todos os tipos de request/response
```

## Configuração

Criar `.env.local` (ou copiar de `.env.example`):

```
NEXT_PUBLIC_API_URL=http://localhost:5059
```

## Rodando

```bash
npm install
npm run dev       # http://localhost:3000
```

O backend deve estar rodando em `http://localhost:5059`. Ver `backend/README.md` ou o README raiz.

## Testes

```bash
npm test          # vitest run (17 testes)
npm run test:watch
```

## Funcionalidades

| Tab | O que faz |
|---|---|
| Calendário | Seleciona bairro e exibe agenda de coleta por tipo de resíduo com próximo dia calculado |
| Pontos | Lista pontos de coleta; com GPS ativo mostra os mais próximos (raio 5km) |
| Lembretes | Cria lembretes de descarte vinculados a um ponto; marca como concluído |
| Chat | Chat com agente IA: consulta calendário, sugere ponto de descarte, cria/lista/conclui lembretes direto pelo chat |

## GPS / Geolocalização

Na primeira visita o browser solicita permissão de localização. Se concedida:
- Tab Pontos exibe ordenação por proximidade
- Chat envia `lat`/`lng` para o agente injetar pontos próximos no contexto

Badge verde/âmbar no input do chat indica status do GPS.
