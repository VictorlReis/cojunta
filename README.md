# Cojunta

Aplicativo de controle financeiro para casais. Gerencie gastos individuais e compartilhados, visualize evolução mensal e conecte-se com seu parceiro(a) através de um sistema de convites.

## Funcionalidades (Fase 1)

- **Autenticação** — email/senha e Google OAuth
- **Sistema de parceria** — envio e aceite de convites dentro do app para vincular dois usuários
- **Controle de gastos** — criar, editar e excluir despesas com categorias predefinidas
- **Visualizações** — alternar entre meus gastos, gastos compartilhados e todos
- **Dashboard** — cards de resumo mensal + gráfico de pizza por categoria + linha de tendência dos últimos 6 meses
- **Perfil e configurações** — editar nome, gerenciar parceria

## Stack

- **Frontend:** React + Vite + TypeScript
- **UI:** Tailwind CSS v4 + shadcn/ui
- **Gráficos:** Recharts
- **Backend:** Supabase (auth, banco de dados, RLS)
- **Estado:** Zustand + TanStack Query
- **Roteamento:** React Router v6

## Como rodar

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Copie o arquivo de exemplo e preencha com as credenciais do seu projeto Supabase:

```bash
cp .env.local.example .env.local
```

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

### 3. Configurar o banco de dados

No [Supabase SQL Editor](https://supabase.com/dashboard), execute as migrations em ordem:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_rls_policies.sql
supabase/migrations/003_seed_categories.sql
```

### 4. (Opcional) Google OAuth

No painel do Supabase: **Authentication → Providers → Google** — adicione suas credenciais OAuth do Google Cloud Console.

### 5. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

## Estrutura do projeto

```
src/
├── components/
│   ├── auth/          # Login, signup, guards de rota
│   ├── dashboard/     # Cards, gráficos (pizza, tendência)
│   ├── expenses/      # Formulário, lista, filtros, dialogs
│   ├── layout/        # AppLayout, sidebar, header, nav mobile
│   ├── partnership/   # Convites, card do parceiro
│   └── ui/            # Componentes shadcn/ui
├── hooks/             # useExpenses, usePartnership, useDashboardData...
├── lib/               # Supabase client, utilitários, constantes
├── pages/             # DashboardPage, ExpensesPage, SettingsPage...
├── stores/            # Zustand (auth)
└── types/             # Tipos do banco e domínio
supabase/
└── migrations/        # SQL: schema, RLS policies, seed de categorias
```

## Roadmap — Fase 2

- Categorias customizadas
- Gastos recorrentes
- Limites de orçamento por categoria
- Exportação de dados (CSV/PDF)
- Notificações
- Relatórios avançados
