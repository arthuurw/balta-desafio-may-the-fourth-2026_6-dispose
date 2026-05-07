"use client";

import {
  CalendarDays,
  MapPin,
  Bell,
  MessageSquare,
  Navigation,
  CheckCircle,
  Plus,
  RefreshCw,
  ChevronRight,
  Trash2,
  CalendarClock,
  Package,
  CalendarPlus,
  MapPinPlus,
} from "lucide-react";

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function Section({ icon, title, children }: SectionProps) {
  return (
    <div
      className="rounded-[8px] overflow-hidden"
      style={{ backgroundColor: "var(--color-surface-container)" }}
    >
      <div
        className="flex items-center gap-2.5 px-4 py-3 border-b"
        style={{ borderColor: "var(--color-outline-variant)" }}
      >
        <span style={{ color: "var(--color-primary)" }}>{icon}</span>
        <h2 className="text-sm font-semibold" style={{ color: "var(--color-on-surface)" }}>
          {title}
        </h2>
      </div>
      <div className="px-4 py-3 space-y-3 text-sm" style={{ color: "var(--color-on-surface-variant)" }}>
        {children}
      </div>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span
        className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
        style={{ backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }}
      >
        {n}
      </span>
      <p className="flex-1">{children}</p>
    </div>
  );
}

function ChatExample({ text }: { text: string }) {
  return (
    <div
      className="flex items-start gap-2 px-3 py-2 rounded-[6px] text-xs"
      style={{ backgroundColor: "var(--color-surface-high)" }}
    >
      <ChevronRight size={12} style={{ color: "var(--color-primary)", marginTop: 2, flexShrink: 0 }} />
      <span style={{ color: "var(--color-on-surface)" }}>{text}</span>
    </div>
  );
}

function Tag({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mr-1 mb-1"
      style={{ backgroundColor: `${color}22`, color }}
    >
      {children}
    </span>
  );
}

export default function HelpGuide() {
  return (
    <div className="space-y-4 max-w-lg mx-auto pb-6">
      <div>
        <h1 className="text-base font-semibold mb-0.5" style={{ color: "var(--color-on-surface)" }}>
          Como usar o Dispose
        </h1>
        <p className="text-xs" style={{ color: "var(--color-on-surface-variant)" }}>
          Guia completo de todas as funcionalidades disponíveis.
        </p>
      </div>

      {/* GPS */}
      <div
        className="flex items-start gap-3 px-4 py-3 rounded-[8px]"
        style={{ backgroundColor: "var(--color-surface-container)", borderLeft: "3px solid var(--color-primary)" }}
      >
        <Navigation size={16} style={{ color: "var(--color-primary)", marginTop: 2, flexShrink: 0 }} />
        <div>
          <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--color-on-surface)" }}>
            GPS / Localização
          </p>
          <p className="text-xs" style={{ color: "var(--color-on-surface-variant)" }}>
            Na primeira visita o navegador solicita permissão de localização. Se concedida, a aba{" "}
            <strong style={{ color: "var(--color-on-surface)" }}>Pontos</strong> exibe os mais próximos (raio 5 km),
            o <strong style={{ color: "var(--color-on-surface)" }}>Chat</strong> envia suas coordenadas ao agente
            para sugestões precisas, e o cadastro de pontos via chat usa sua posição atual como localização do ponto.
            O badge no canto superior direito mostra as coordenadas ativas.
          </p>
        </div>
      </div>

      {/* Calendário */}
      <Section icon={<CalendarDays size={16} />} title="Calendário de Coleta">
        <p>Consulte os dias e horários de coleta por tipo de resíduo para cada bairro disponível. Também é possível cadastrar novas agendas.</p>

        <div className="space-y-2">
          <Step n={1}>
            Selecione o bairro no menu suspenso (Centro, Bela Vista, Liberdade, Pinheiros ou Lapa).
          </Step>
          <Step n={2}>
            A agenda carrega automaticamente, exibindo um card por tipo de resíduo com dias, horário e observações.
            Use o botão <RefreshCw size={11} className="inline" /> para recarregar.
          </Step>
          <Step n={3}>
            Clique em <strong style={{ color: "var(--color-on-surface)" }}>+ Nova</strong> para cadastrar
            uma nova agenda. Escolha bairro, tipo de resíduo, dias da semana, horário e observações opcionais.
          </Step>
        </div>

        <div>
          <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--color-on-surface)" }}>
            Tipos de resíduo
          </p>
          <div>
            <Tag color="#72be8a">Orgânico</Tag>
            <Tag color="#5bb8d4">Reciclável</Tag>
            <Tag color="#9b8ddb">Vidro</Tag>
            <Tag color="#a0845a">Poda</Tag>
          </div>
        </div>
      </Section>

      {/* Pontos */}
      <Section icon={<MapPin size={16} />} title="Pontos de Coleta Especial">
        <p>
          Localize ecopontos, farmácias e postos que aceitam itens especiais como pilhas,
          eletrônicos, medicamentos e óleo de cozinha. Você também pode cadastrar novos pontos.
        </p>

        <div className="space-y-2">
          <Step n={1}>
            Com GPS ativo, os pontos aparecem ordenados por distância (raio 5 km). Sem GPS, todos os pontos são listados.
          </Step>
          <Step n={2}>
            Cada card mostra nome, endereço, distância, horário e tipos aceitos. Clique em{" "}
            <strong style={{ color: "var(--color-on-surface)" }}>Criar lembrete</strong> para ir direto ao formulário com o ponto pré-selecionado.
          </Step>
          <Step n={3}>
            Clique em <strong style={{ color: "var(--color-on-surface)" }}>+ Novo</strong> para cadastrar
            um ponto. Preencha nome, endereço, coordenadas (ou use o GPS), tipos aceitos e horário.
          </Step>
        </div>

        <div>
          <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--color-on-surface)" }}>
            Itens especiais aceitos
          </p>
          <div>
            <Tag color="#f4a942">Pilhas / Baterias</Tag>
            <Tag color="#f4a942">Eletrônicos</Tag>
            <Tag color="#f4a942">Medicamentos</Tag>
            <Tag color="#f4a942">Óleo de cozinha</Tag>
          </div>
          <p className="text-xs mt-1">
            Esses itens <strong style={{ color: "var(--color-on-surface)" }}>não devem</strong> ser
            descartados no lixo comum. Use os ecopontos específicos.
          </p>
        </div>
      </Section>

      {/* Lembretes */}
      <Section icon={<Bell size={16} />} title="Lembretes de Descarte">
        <p>
          Crie lembretes vinculados a um ponto de coleta para não esquecer de descartar seus itens
          especiais. Os lembretes ficam salvos na sessão atual.
        </p>

        <div className="space-y-2">
          <p className="text-xs font-semibold" style={{ color: "var(--color-on-surface)" }}>
            Criando manualmente
          </p>
          <Step n={1}>
            Clique em <Plus size={11} className="inline" />{" "}
            <strong style={{ color: "var(--color-on-surface)" }}>Novo</strong> no canto superior direito.
          </Step>
          <Step n={2}>
            Selecione o tipo de item, o ponto de coleta e opcionalmente adicione uma descrição (ex.: "bateria do notebook").
          </Step>
          <Step n={3}>
            Clique em <strong style={{ color: "var(--color-on-surface)" }}>Salvar lembrete</strong>. Ele
            aparece na lista com status <em>pendente</em>.
          </Step>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold" style={{ color: "var(--color-on-surface)" }}>
            Gerenciando lembretes
          </p>
          <Step n={1}>
            Após descartar o item, clique em{" "}
            <CheckCircle size={11} className="inline" />{" "}
            <strong style={{ color: "var(--color-on-surface)" }}>Descartar</strong> para marcar como concluído.
          </Step>
          <Step n={2}>
            Para remover um lembrete sem concluí-lo, clique em{" "}
            <Trash2 size={11} className="inline" />{" "}
            <strong style={{ color: "var(--color-on-surface)" }}>Cancelar</strong>. O lembrete é excluído permanentemente.
          </Step>
        </div>

        <p className="text-xs">
          Lembretes também podem ser criados, concluídos e cancelados diretamente pelo{" "}
          <strong style={{ color: "var(--color-on-surface)" }}>Chat com o agente</strong>.
        </p>
      </Section>

      {/* Chat */}
      <Section icon={<MessageSquare size={16} />} title="Chat com o Agente IA">
        <p>
          Converse em português com o agente especializado em coleta urbana. Ele entende seu contexto
          (bairro selecionado + localização GPS) e executa ações diretamente.
        </p>

        <div
          className="px-3 py-2 rounded-[6px] text-xs"
          style={{ backgroundColor: "var(--color-surface-high)", color: "var(--color-on-surface-variant)" }}
        >
          <span style={{ color: "var(--color-primary)" }}>Dica:</span> o agente usa o bairro selecionado
          na aba Calendário e as coordenadas GPS ativas. Mude o bairro antes de perguntar sobre a agenda.
        </div>

        <div className="space-y-3">

          <div>
            <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-on-surface)" }}>
              <CalendarDays size={11} className="inline mr-1" />
              1. Consultar agenda de coleta
            </p>
            <p className="text-xs mb-1.5">Pergunte sobre dias e horários de coleta para o bairro selecionado.</p>
            <div className="space-y-1">
              <ChatExample text="Quando é a coleta de recicláveis no Centro?" />
              <ChatExample text="Quais os dias de coleta de orgânico?" />
              <ChatExample text="Qual o horário da coleta de vidro?" />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-on-surface)" }}>
              <CalendarClock size={11} className="inline mr-1" />
              2. Próxima coleta
            </p>
            <p className="text-xs mb-1.5">
              O agente calcula quantos dias faltam para a próxima ocorrência de coleta.
            </p>
            <div className="space-y-1">
              <ChatExample text="Quando é a próxima coleta de orgânico?" />
              <ChatExample text="Quantos dias faltam para a coleta de recicláveis?" />
              <ChatExample text="Qual o próximo dia de coleta no Centro?" />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-on-surface)" }}>
              <MapPin size={11} className="inline mr-1" />
              3. Encontrar ponto de descarte próximo
            </p>
            <p className="text-xs mb-1.5">
              Com GPS ativo, o agente sugere o ponto mais próximo que aceita o item. Aparece um card
              com nome, endereço e distância e um botão para criar lembrete.
            </p>
            <div className="space-y-1">
              <ChatExample text="Onde descarto pilhas velhas perto de mim?" />
              <ChatExample text="Onde posso jogar fora eletrônicos usados?" />
              <ChatExample text="Onde descarto medicamentos vencidos?" />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-on-surface)" }}>
              <Package size={11} className="inline mr-1" />
              4. Listar todos os pontos por tipo
            </p>
            <p className="text-xs mb-1.5">
              Veja todos os pontos cadastrados que aceitam determinado tipo de item, com botão para criar lembrete em cada um.
            </p>
            <div className="space-y-1">
              <ChatExample text="Quais pontos aceitam pilhas?" />
              <ChatExample text="Lista todos os ecopontos de eletrônicos" />
              <ChatExample text="Onde posso descartar óleo de cozinha?" />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-on-surface)" }}>
              <Bell size={11} className="inline mr-1" />
              5. Criar lembrete via chat
            </p>
            <p className="text-xs mb-1.5">
              O agente cria o lembrete automaticamente quando você usa palavras como "cria",
              "me lembra" ou "registra". O lembrete aparece na aba Lembretes.
            </p>
            <div className="space-y-1">
              <ChatExample text="Cria um lembrete para eu descartar as pilhas" />
              <ChatExample text="Me lembra de levar os eletrônicos ao ecoponto" />
              <ChatExample text="Quero criar um lembrete para o óleo de cozinha" />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-on-surface)" }}>
              <Bell size={11} className="inline mr-1" />
              6. Listar e gerenciar lembretes
            </p>
            <p className="text-xs mb-1.5">Consulte, conclua ou cancele lembretes diretamente pelo chat.</p>
            <div className="space-y-1">
              <ChatExample text="Quais são meus lembretes pendentes?" />
              <ChatExample text="Já descartei as pilhas" />
              <ChatExample text="Cancela o lembrete de eletrônicos" />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-on-surface)" }}>
              <CalendarPlus size={11} className="inline mr-1" />
              7. Cadastrar agenda de coleta
            </p>
            <p className="text-xs mb-1.5">
              Registre uma nova agenda de coleta informando bairro, tipo de resíduo, dias e horário.
            </p>
            <div className="space-y-1">
              <ChatExample text="Cadastra agenda de recicláveis no Ipiranga, terças e sextas, das 08:00 às 14:00" />
              <ChatExample text="Registra coleta de orgânico na Vila Mariana, segunda e quinta, às 07:00" />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-on-surface)" }}>
              <MapPinPlus size={11} className="inline mr-1" />
              8. Cadastrar ponto de coleta
            </p>
            <p className="text-xs mb-1.5">
              Registre um novo ponto de descarte. As coordenadas são obtidas automaticamente pelo GPS
              — certifique-se de que o GPS esteja ativo antes de usar este comando.
            </p>
            <div className="space-y-1">
              <ChatExample text="Cadastra um ponto chamado Farmácia São João, Rua das Flores 100, aceita medicamentos, das 08:00 às 18:00" />
              <ChatExample text="Registra ecoponto Posto Shell, Av. Brasil 500, aceita pilhas e óleo, das 06:00 às 22:00" />
            </div>
          </div>

        </div>

        <div
          className="px-3 py-2 rounded-[6px] text-xs space-y-1"
          style={{ backgroundColor: "var(--color-surface-high)" }}
        >
          <p className="font-semibold" style={{ color: "var(--color-on-surface)" }}>
            Segurança do agente
          </p>
          <p>
            O agente responde <strong>apenas</strong> sobre coleta e descarte urbano. Tentativas de
            redirecionar para outros assuntos ou injetar instruções são ignoradas e retornam{" "}
            <code
              className="px-1 rounded text-xs"
              style={{ backgroundColor: "var(--color-surface-container)", color: "var(--color-tertiary)" }}
            >
              action: unknown
            </code>.
          </p>
        </div>
      </Section>

      {/* Sessão */}
      <Section icon={<Bell size={16} />} title="Sessão e Persistência">
        <p>
          O app não requer cadastro nem login. Uma sessão anônima é criada automaticamente no
          primeiro acesso e salva no <code className="text-xs px-1 rounded"
            style={{ backgroundColor: "var(--color-surface-high)", color: "var(--color-on-surface)" }}>
            localStorage
          </code> do navegador.
        </p>
        <p>
          Seus lembretes ficam vinculados a essa sessão. Se você limpar os dados do navegador ou
          acessar de outro dispositivo, os lembretes não serão recuperados.
        </p>
        <p>
          Enquanto a sessão estiver ativa, o agente tem acesso à lista de lembretes pendentes para
          executar as ações de listagem, conclusão e cancelamento.
        </p>
      </Section>
    </div>
  );
}
