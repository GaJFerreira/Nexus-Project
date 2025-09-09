# Planejamento do Projeto Nexus

## 1. Objetivo Geral

O objetivo do projeto é servir como um sistema de gerenciamento de finanças pessoal. Um lugar onde o usuário pode armazenar seus dados de compras, renda, aportes e saques, bem como controlar suas despesas fixas e variáveis, podendo também planejar os próximos meses de acordo com as parcelas e contas futuras.

## 2. Requisitos Básicos

1.  O sistema deve permitir que o usuário crie uma conta com login e senha para registrar os dados na nuvem.
2.  O sistema deve permitir que o usuário cadastre suas contas bancárias para um melhor controle, incluindo o gerenciamento de faturas de cartão de crédito.
3.  O sistema deve permitir que o usuário cadastre suas despesas, que podem ser de variados tipos (compras, contas, gastos fixos, etc.), incluindo compras parceladas.
4.  O sistema deve mostrar ao usuário uma lista de transações, idealmente agrupadas por mês, permitindo a utilização de filtros para uma melhor visualização.

## 3. Entidades

### Usuário (`users`)
- **Descrição:** A entidade `Usuario` é a identificação de cada usuário. Ela carrega seus dados no banco para relacionar as contas e transações. Contém apenas dados básicos para identificação.
- **Campos:**
    - `uid` (string, ID do Firebase Auth, Chave Primária)
    - `nome` (string)
    - `email` (string)

### Conta (`accounts`)
- **Descrição:** A `Conta` serve para organizar melhor os saldos. Um usuário pode ter várias contas, com diferentes entradas e saídas. Esta entidade facilita a organização dos saldos do usuário. Para contas do tipo "cartão de crédito", ela também gerencia a fatura, com seu fechamento e vencimento.
- **Campos:**
    - `id` (string, auto-gerado, Chave Primária)
    - `userId` (string, Chave Estrangeira -> `users.uid`)
    - `nome` (string, ex: "Carteira", "Cartão Nubank")
    - `saldo` (number)
        - *Nota:* Para contas correntes, representa o saldo atual. Para cartões de crédito, pode representar o limite disponível.
    - `tipo` (string, ex: "conta_corrente", "cartao_credito", "dinheiro")
    - `diaFechamento` (number, **NOVO**)
        - *Nota:* Dia do mês em que a fatura do cartão fecha (ex: 20). Aplicável apenas para `tipo` "cartao_credito".
    - `diaVencimento` (number, **NOVO**)
        - *Nota:* Dia do mês em que a fatura do cartão vence (ex: 28). Aplicável apenas para `tipo` "cartao_credito".

### Transação (`transactions`)
- **Descrição:** Esta entidade carrega os dados importantes da movimentação financeira, sendo relacionada a uma `Conta` que, por sua vez, se relaciona com um `Usuario`. Cada transação pode ser de entrada (receita) ou saída (despesa) e classificada em várias categorias.
- **Campos:**
    - `id` (string, auto-gerado, Chave Primária)
    - `accountId` (string, Chave Estrangeira -> `accounts.id`)
    - `userId` (string, Chave Estrangeira -> `users.uid`)
    - `descricao` (string)
    - `valor` (number)
    - `data` (timestamp)
    - `tipo` (string, "receita" ou "despesa")
    - `categoria` (string, ex: "Alimentação", "Transporte")
    - `metodoPagamento` (string, **NOVO**, ex: "pix", "debito", "credito_avista", "credito_parcelado")
    - `totalParcelas` (number, **NOVO**, default: 1)
        - *Nota:* Para compras parceladas, indica o número total de parcelas.
    - `parcelaAtual` (number, **NOVO**, default: 1)
        - *Nota:* Indica qual é a parcela atual de uma compra parcelada.
    - `transacaoPaiId` (string, **NOVO**, opcional)
        - *Nota:* Usado para agrupar todas as parcelas de uma mesma compra.

## 5. Regras de Negócio e Validações (Atualizado)

- **Segurança:** Um usuário só pode acessar os dados que pertencem a ele.
- **Validação de Dados:**
    - `valor` de uma transação deve ser `> 0`.
    - `tipo` deve ser "receita" ou "despesa".
- **Lógica de Negócio:**
    - **Transação de Receita/Despesa à Vista (`pix`, `debito`):** O `valor` deve ser somado/subtraído imediatamente do `saldo` da `Conta` correspondente.
    - **Transação no Cartão de Crédito (`credito_avista`):** O `valor` **não** abate o `saldo` da conta. Em vez disso, é adicionado à fatura do mês corrente (se a compra for feita antes do `diaFechamento`) ou do mês seguinte (se for feita após o `diaFechamento`).
    - **Transação Parcelada (`credito_parcelado`):**
        - O sistema deve criar múltiplas "transações-filhas" (uma para cada mês da parcela), todas ligadas por uma `transacaoPaiId`.
        - Cada transação-filha será alocada na fatura do seu respectivo mês.
    - **Fechamento de Fatura:** No `diaFechamento` de uma conta `cartao_credito`, o sistema deve consolidar todas as transações daquele período em uma fatura a ser paga.
