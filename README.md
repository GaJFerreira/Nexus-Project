# Nexus Project - Sistema de Gerenciamento de Finanças Pessoais

## 1. Visão Geral do Projeto
O **Nexus** é um sistema de gerenciamento de finanças pessoais desenvolvido para auxiliar usuários no controle de suas movimentações financeiras, incluindo receitas, despesas, aportes e saques [cite: uploaded:gajferreira/nexus-project/Nexus-Project-c7ca78121a813ab2eb624059d40b2189af720cfd/Planejamento.md].

Este projeto é construído sobre o framework **Next.js** para o desenvolvimento Full-Stack, utilizando **TypeScript** para maior robustez.  
As rotas de API do Next.js gerenciam a lógica de negócios, que interage diretamente com o **Firebase Firestore** para persistência de dados e **Firebase Authentication** para gerenciamento de usuários.

---

## 2. Tecnologias Utilizadas

| Categoria    | Tecnologia                       | Função Principal |
|--------------|----------------------------------|------------------|
| Frontend     | Next.js, React, Tailwind CSS     | Framework moderno, biblioteca de UI e sistema de estilização utilitário |
| Backend      | Next.js API Routes, TypeScript   | Desenvolvimento de endpoints RESTful seguros e tipados |
| Database     | Firebase Firestore (Admin SDK)   | Banco de dados NoSQL escalável para persistência de dados [cite: uploaded:gajferreira/nexus-project/Nexus-Project-c7ca78121a813ab2eb624059d40b2189af720cfd/src/lib/firebase/admin.ts] |
| Autenticação | Firebase Authentication          | Gerenciamento de ciclo de vida do usuário (registro e login) [cite: uploaded:gajferreira/nexus-project/Nexus-Project-c7ca78121a813ab2eb624059d40b2189af720cfd/src/app/api/auth/register/route.ts] |
| Testes       | Jest, ts-jest                    | Framework para testes unitários e de integração [cite: uploaded:gajferreira/nexus-project/Nexus-Project-c7ca78121a813ab2eb624059d40b2189af720cfd/jest.config.js] |

---

## 3. Roadmap e Status do Projeto

Esta seção detalha o planejamento inicial do projeto e o progresso alcançado até o momento, baseando-se nos requisitos documentados.

### Progresso das Funcionalidades Principais

| Funcionalidade                   | Módulo Envolvido | Status        | Observações e Próximos Passos |
|----------------------------------|------------------|--------------|--------------------------------|
| Autenticação (Login e Cadastro)  | api/auth/        | ✅ Concluído | Rotas implementadas para registro e login de usuários no Firebase Auth [cite: uploaded:gajferreira/nexus-project/Nexus-Project-c7ca78121a813ab2eb624059d40b2189af720cfd/src/app/api/auth/register/route.ts] |
| Gerenciamento de Contas (CRUD)   | api/accounts/    | ✅ Concluído | Suporte completo para criar, buscar, atualizar e deletar contas. A deleção em cascata (remoção das transações associadas) já está implementada [cite: uploaded:gajferreira/nexus-project/Nexus-Project-c7ca78121a813ab2eb624059d40b2189af720cfd/src/lib/services/accountService.ts] |
| Registro e Consulta de Transações| api/transactions/| ✅ Concluído | Rotas para criação e listagem (com filtros) estão operacionais [cite: uploaded:gajferreira/nexus-project/Nexus-Project-c7ca78121a813ab2eb624059d40b2189af720cfd/src/app/api/transactions/route.ts] |
| Regras de Lógica Financeira      | services/        | ✅ Concluído | Estrutura preparada para saldo, diaFechamento, diaVencimento, totalParcelas e transacaoPaiId. A lógica para compras parceladas e impacto no saldo/fatura está modelada [cite: uploaded:gajferreira/nexus-project/Nexus-Project-c7ca78121a813ab2eb624059d40b2189af720cfd/Planejamento.md] |
| Cálculo de Despesas/Receitas     | src/app/page.tsx | ❌ Não Iniciado | Falta a implementação da interface de usuário para agrupar e exibir cálculos (somas por mês, categoria, etc.) [cite: uploaded:gajferreira/nexus-project/Nexus-Project-c7ca78121a813ab2eb624059d40b2189af720cfd/Planejamento.md] |
| Recuperação de Senha             | api/auth/        | ❌ Não Iniciado | Funcionalidade essencial para UX que precisa ser adicionada |

---

## 4. Estrutura da Aplicação e Modelo de Dados

O projeto segue o padrão **App Router** do Next.js e é modularizado para separar as camadas de serviços e API.

### Modelo de Entidades do Firestore
O modelo de dados é centrado no usuário e suas interações financeiras:

- **users** → Informações básicas do usuário (baseado no Firebase Auth).  
  - `uid` (Chave Primária)  
- **accounts** → Contas financeiras do usuário (ex.: Carteira, Conta Corrente, Cartão de Crédito).  
  - `userId` (FK para users.uid)  
- **transactions** → Registros individuais de receitas ou despesas.  
  - `accountId` (FK para accounts.id)  
  - `userId` (FK para users.uid)  
  - `transacaoPaiId` (Agrupamento de parcelas)  

### Estrutura de Diretórios
```
nexus-project/
├── src/
│   ├── app/
│   │   ├── api/                  // Rotas de API (Backend)
│   │   │   ├── accounts/         
│   │   │   ├── auth/             
│   │   │   └── transactions/     
│   │   ├── globals.css           // Estilos (Tailwind)
│   │   ├── layout.tsx            // Layout Root
│   │   └── page.tsx              // Componente Principal
│   └── lib/
│       ├── firebase/             // Lógica de inicialização do Firebase (Admin e Client)
│       └── services/             // Funções de CRUD e lógica de negócio (e.g., `accountService.ts`)
└── ...
```

---

## 5. Estrutura da API

A API é o pilar da lógica do Nexus, garantindo que todas as operações de dados sejam validadas e autorizadas (previsto no escopo, atualmente usando um ID de teste para simplificação do desenvolvimento [cite: uploaded:gajferreira/nexus-project/Nexus-Project-c7ca78121a813ab2eb624059d40b2189af720cfd/src/app/api/accounts/route.ts]).

### Endpoints

#### Auth
- `POST /api/auth/register` → Cria um novo usuário (nome, email, password).  
- `POST /api/auth/login` → Autentica via idToken e retorna dados do usuário.  

#### Accounts
- `POST /api/accounts` → Criação de Conta (adiciona uma nova conta ao Firestore).  
- `GET /api/accounts` → Consulta todas as contas do usuário logado.  
- `PUT /api/accounts/[id]` → Atualização de Conta.  
- `DELETE /api/accounts/[id]` → Remove a conta e todas as transações associadas [cite: uploaded:gajferreira/nexus-project/Nexus-Project-c7ca78121a813ab2eb624059d40b2189af720cfd/src/lib/services/accountService.ts].  

#### Transactions
- `POST /api/transactions` → Criação de Transação.  
- `GET /api/transactions` → Lista transações (suporta query parameter `accountId`).  
- `DELETE /api/transactions/[id]` → Remove uma transação específica.  

---

## 6. Iniciando o Projeto

Este projeto requer que as variáveis de ambiente do Firebase sejam configuradas para que o Admin SDK (rotas de API) e o Client SDK (frontend) funcionem corretamente.

### Configuração de Ambiente
Crie um arquivo `.env.local` na raiz do projeto e preencha com as suas credenciais do Firebase:

```env
# Credenciais do Firebase Client SDK (usadas em src/lib/firebase/client.ts)
NEXT_PUBLIC_FIREBASE_API_KEY="..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="..."
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="..."

# Credenciais do Firebase Admin SDK (usadas em src/lib/firebase/admin.ts)
# FIREBASE_PRIVATE_KEY deve estar formatada com '
'
FIREBASE_PROJECT_ID="..."
FIREBASE_CLIENT_EMAIL="..."
FIREBASE_PRIVATE_KEY="..."
```

### Execução
```bash
# Clone o repositório
git clone <url>

# Instale as dependências
npm install
# ou yarn install / pnpm install / bun install

# Inicie o servidor de desenvolvimento
npm run dev
```

Acesse a aplicação em: **http://localhost:3000**

---

## 7. Testes

Os testes são configurados com **Jest** e **TypeScript**.  
Para executar o conjunto de testes:

```bash
npm run test
```

A configuração detalhada (ts-jest, moduleNameMapper) está em `jest.config.js` [cite: uploaded:gajferreira/nexus-project/Nexus-Project-c7ca78121a813ab2eb624059d40b2189af720cfd/jest.config.js].
