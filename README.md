<img width="1280" height="630" alt="banner" src="https://github.com/user-attachments/assets/eb2f345f-7b28-41d0-b374-6336dc8f8f75" />

## May The Fourth 2026 — Desafio 6 · Dispose

Oi, eu sou o Arthur e este é meu projeto do desafio **May The Fourth 2026**, realizado pelo [balta.io](https://balta.io).

**Dispose** é um app de coleta de lixo urbano com IA. Informa os dias de coleta por tipo de resíduo (orgânico, reciclável, vidro, poda) para cada bairro, e organiza lembretes para descartar itens especiais (pilhas, eletrônicos, medicamentos, óleo) quando o usuário estiver próximo a um ponto de coleta.

---

## Nível implementado

**Nível 2 — Fullstack + IA**
- Backend: .NET 10 Minimal API + EF Core + SQLite
- Frontend: Next.js 16 + TypeScript + Tailwind CSS v4
- IA: Microsoft Agent Framework (MAF) + Groq `llama-3.3-70b-versatile`

---

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | .NET 10 Minimal API, Vertical Slice, EF Core 10, SQLite |
| Frontend | Next.js 16, TypeScript, Tailwind CSS v4, Lucide React |
| Agente IA | Microsoft Agents Framework 1.4.0 (`Microsoft.Agents.AI.OpenAI`) |
| LLM | Groq — `llama-3.3-70b-versatile` via endpoint OpenAI-compatível |
| Testes BE | xUnit + NSubstitute + WebApplicationFactory — **33 testes** |
| Testes FE | Vitest 2 + Testing Library — **17 testes** |

---

## Arquitetura

### Backend — Vertical Slice

Cada feature é um arquivo `.cs` contendo: `Request`, `Validator`, `Handler`, `Response` e `MapEndpoint`. Sem camadas extras.

```
backend/
├── agents/
│   └── agente-coleta.md              ← instruções do agente MAF (10 ações)
├── Dispose.Api/
│   ├── Agents/
│   │   ├── ICollectionAgent.cs
│   │   ├── CollectionAgent.cs        ← MAF + json_object mode + 1 retry
│   │   ├── AgentException.cs
│   │   └── AgentResponseDto.cs
│   ├── Data/
│   │   ├── DisposeContext.cs
│   │   ├── SeedData.cs               ← 5 bairros × 4 tipos + 8 pontos de coleta
│   │   └── Entities/
│   ├── Features/
│   │   ├── Schedule/
│   │   │   ├── GetSchedule.cs        ← GET /api/schedule
│   │   │   └── CreateSchedule.cs     ← POST /api/schedule
│   │   ├── CollectionPoints/
│   │   │   ├── ListPoints.cs         ← GET /api/collection-points
│   │   │   ├── NearbyPoints.cs       ← GET /api/collection-points/nearby (Haversine)
│   │   │   └── CreateCollectionPoint.cs ← POST /api/collection-points
│   │   ├── Reminders/
│   │   │   ├── CreateReminder.cs     ← POST /api/reminders
│   │   │   ├── ListReminders.cs      ← GET /api/reminders
│   │   │   ├── CompleteReminder.cs   ← PATCH /api/reminders/{id}/complete
│   │   │   └── DeleteReminder.cs     ← DELETE /api/reminders/{id}
│   │   └── Chat/
│   │       └── Chat.cs               ← POST /api/chat — contexto injetado por chamada
│   ├── Extensions/
│   │   ├── ServiceCollectionExtensions.cs
│   │   └── WebApplicationExtensions.cs
│   └── Infrastructure/Llm/GroqClientFactory.cs
└── Dispose.Api.Tests/
    ├── ApiFactory.cs                 ← SQLite temporário por instância
    ├── Schedule/GetScheduleTests.cs
    ├── CollectionPoints/NearbyPointsTests.cs
    ├── Reminders/ReminderTests.cs    ← 10 testes
    └── Chat/ChatTests.cs             ← 14 testes, NSubstitute mock
```

### Frontend — App Router

```
frontend/src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                      ← 5 tabs: Calendário / Pontos / Lembretes / Chat / Ajuda
│   └── globals.css                   ← design system via @theme
├── components/
│   ├── ScheduleCard.tsx
│   ├── CollectionPointList.tsx
│   ├── ReminderForm.tsx
│   ├── ReminderList.tsx              ← concluir + cancelar
│   ├── ChatAgent.tsx                 ← 10 ações do agente renderizadas
│   ├── HelpGuide.tsx                 ← guia de uso completo
│   ├── CreateScheduleForm.tsx        ← formulário nova agenda
│   └── CreateCollectionPointForm.tsx ← formulário novo ponto
├── services/api.ts                   ← fetch wrapper, timeout 30s, ApiError
└── types/index.ts
```

---

## API

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/schedule?neighborhood=Centro` | Agenda de coleta do bairro |
| `POST` | `/api/schedule` | Criar nova agenda de coleta |
| `GET` | `/api/collection-points` | Todos os pontos de coleta |
| `GET` | `/api/collection-points/nearby?lat=&lng=&radius=&wasteType=` | Pontos próximos (Haversine) |
| `POST` | `/api/collection-points` | Criar novo ponto de coleta |
| `POST` | `/api/reminders` | Criar lembrete de descarte |
| `GET` | `/api/reminders?sessionId=` | Listar lembretes da sessão |
| `PATCH` | `/api/reminders/{id}/complete` | Marcar lembrete como concluído |
| `DELETE` | `/api/reminders/{id}` | Remover lembrete |
| `POST` | `/api/chat` | Chat com agente IA |

### POST /api/chat

```json
// Request
{
  "sessionId": "uuid",
  "message": "Quando é a próxima coleta de orgânico?",
  "neighborhood": "Centro",
  "lat": -23.55,
  "lng": -46.63
}

// Response 200 — schedule_info
{
  "action": "schedule_info",
  "reply": "No Centro, orgânicos são coletados nas segundas, quartas e sextas, das 07:00 às 12:00.",
  "neighborhood": "Centro",
  "wasteType": "organico"
}

// Response 200 — next_collection
{
  "action": "next_collection",
  "reply": "A próxima coleta de orgânico no Centro é na quarta-feira, em 2 dias.",
  "nextCollection": { "wasteType": "organico", "neighborhood": "Centro", "nextDay": "quarta", "daysUntil": 2 }
}

// Response 200 — suggest_reminder
{
  "action": "suggest_reminder",
  "reply": "O Ecoponto Anhangabaú (665m) aceita pilhas e baterias.",
  "suggestedPoint": { "id": 1, "name": "Ecoponto Anhangabaú", "address": "...", "distanceMeters": 665 }
}

// Response 200 — filter_points
{
  "action": "filter_points",
  "reply": "Encontrei 3 pontos que aceitam pilhas.",
  "filteredPoints": [
    { "id": 1, "name": "Ecoponto Anhangabaú", "address": "...", "distanceMeters": 665, "acceptedTypes": ["pilhas","eletronicos","oleo"] }
  ]
}

// Response 200 — create_reminder
{
  "action": "create_reminder",
  "reply": "Lembrete criado!",
  "createdReminder": { "id": "guid", "itemType": "pilhas", "pointName": "Ecoponto Anhangabaú", "status": "pendente" }
}

// Response 200 — list_reminders
{
  "action": "list_reminders",
  "reply": "Você tem 2 lembretes pendentes.",
  "reminders": [
    { "id": "guid", "itemType": "pilhas", "pointName": "Ecoponto Anhangabaú", "status": "pendente" }
  ]
}

// Response 200 — complete_reminder
{
  "action": "complete_reminder",
  "reply": "Lembrete de pilhas marcado como concluído.",
  "completedReminderId": "guid"
}

// Response 200 — delete_reminder
{
  "action": "delete_reminder",
  "reply": "Lembrete cancelado e removido.",
  "deletedReminderId": "guid"
}

// Response 200 — create_schedule
{
  "action": "create_schedule",
  "reply": "Agenda cadastrada com sucesso!",
  "createdSchedule": { "id": 21, "neighborhood": "Santana", "wasteType": "poda", "days": ["segunda","quinta"], "timeSlot": "07:00 às 12:00" }
}

// Response 200 — create_point
{
  "action": "create_point",
  "reply": "Ponto de coleta cadastrado com sucesso!",
  "createdPoint": { "id": 9, "name": "Farmácia Central", "address": "Rua das Flores, 123", "acceptedTypes": ["medicamentos"], "openingHours": "08:00 às 18:00" }
}
```

Ações do agente: `schedule_info` · `next_collection` · `suggest_reminder` · `filter_points` · `create_reminder` · `list_reminders` · `complete_reminder` · `delete_reminder` · `create_schedule` · `create_point` · `general_reply` · `unknown`

---

## Injeção de contexto no prompt

Para cada chamada ao chat, o handler monta o prompt com:

```
[Data atual: quarta, 07/05/2026]

[Agenda de coleta — Bairro: Centro]
organico: segunda, quarta, sexta | 07:00–12:00
reciclavel: terca, sabado | 08:00–14:00 | Separar papel, plástico e metal

[Pontos de coleta próximos (raio 5km)]
1. Ecoponto Anhangabaú — Rua Boa Vista, 50 — 665m (id:1)
   Aceita: pilhas, eletronicos, oleo
   Horário: Seg–Sex 08:00–18:00

[Lembretes pendentes]
id:550e8400-... — pilhas — Ecoponto Anhangabaú

[Pergunta do usuário]
Quando é a próxima coleta de orgânico?
```

- `[Data atual]` injetado em BRT (UTC-3) para cálculo de `next_collection`
- Agenda filtrada pelo `neighborhood` do request
- Pontos filtrados por Haversine, máximo 5, raio 5 km — omitido se sem GPS
- Lembretes pendentes da sessão — omitido se não existirem

---

## Decisões técnicas

| # | Decisão |
|---|---|
| D1 | **Stateless agent** — nova sessão MAF por chamada; contexto injetado no prompt a cada request |
| D2 | **`json_object` mode** — `ChatResponseFormat.Json` + 1 retry se JSON inválido → `AgentException` → 502 |
| D3 | **Haversine no backend** — sem serviço externo de geolocalização |
| D4 | **Seed data no startup** — `EnsureCreated()` + guard `if Any() return`; sem migrations |
| D5 | **SessionId no `localStorage`** — sem autenticação; identificação de sessão client-side |
| D6 | **Dados fictícios** — 5 bairros (SP) × 4 tipos de resíduo + 8 pontos de coleta pré-populados |
| D7 | **`AgentException`** wrappeia falhas LLM → HTTP 502 |
| D8 | **`ICollectionAgent`** público para testabilidade com NSubstitute |
| D9 | **`[Data atual]` no prompt** — backend injeta data/dia em BRT; agente calcula `daysUntil` sem lógica extra no servidor |
| D10 | **`create_point` requer GPS** — coordenadas do request usado como localização do ponto; sem GPS → `general_reply` |
| D11 | **`filter_points` — backend filtra, agente só informa o tipo** — evita fabricação de dados pelo LLM |

---

## Rodando localmente

### Pré-requisitos

- .NET 10 SDK
- Node.js 20+
- Chave de API Groq: [console.groq.com/keys](https://console.groq.com/keys)

### Backend

```bash
cd backend/Dispose.Api
```

Criar `appsettings.Development.json` (gitignored):

```json
{
  "Llm": {
    "ApiKey": "gsk_SUA_CHAVE_GROQ",
    "BaseUrl": "https://api.groq.com/openai/v1",
    "Model": "llama-3.3-70b-versatile"
  },
  "ConnectionStrings": {
    "Default": "Data Source=dispose.db"
  }
}
```

```bash
dotnet run
# http://localhost:5059
# http://localhost:5059/swagger
```

### Frontend

```bash
cd frontend
cp .env.example .env.local   # já configurado para localhost:5059
npm install
npm run dev
# http://localhost:3000
```

### Testes

```bash
# Backend (33 testes)
cd backend
dotnet test

# Frontend (17 testes)
cd frontend
npm test
```

---

## O que aprendi

- Padrão MAF stateless com injeção de contexto por chamada — mais robusto que session reuse para APIs REST
- `json_object` mode + retry manual é suficiente para manter JSON válido sem depender de structured outputs
- Injetar data/dia no prompt (BRT) desloca lógica de cálculo de dias para o LLM — sem código extra no backend
- Haversine inline por feature (Vertical Slice) evita over-engineering de um serviço de geolocalização
- `WebApplicationFactory` com SQLite temporário por instância garante isolamento perfeito entre test classes
- `filter_points`: delegar só o `itemType` ao agente e construir a lista no backend elimina risco de alucinação de pontos

---

## Badge

<img src="https://baltaio.blob.core.windows.net/static/images/v4/challenges/may-the-fourth-2026/rewards/dispose/image.png" width="200" />

---

## Sobre o May The Fourth 2026

O desafio **May The Fourth 2026** consiste em implementar agentes e inteligência artificial em cenários reais, resolvendo problemas do dia-a-dia com Microsoft Agent Framework, C# e .NET.

### Imersão — Microsoft Agents Framework
https://www.youtube.com/watch?v=XkgjeBurtFw

### Curso — Microsoft Agents Framework
https://balta.io/cursos/fundamentos-do-microsoft-agent-framework
