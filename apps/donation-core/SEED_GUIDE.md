# 🌱 Seed Database Guide

## Overview

O seed script popula o banco de dados com dados de exemplo para facilitar testes da aplicação, especialmente do checkout de doações.

## Problem Statement

O schema Prisma define relações obrigatórias:

```prisma
model Donation {
  ngoId   String
  ngo     Ngo   @relation(fields: [ngoId], references: [id])
  donorId String
  donor   Donor @relation(fields: [donorId], references: [id])
}
```

Se o banco estiver vazio, ao tentar criar uma doação via `CreateCheckoutSessionUseCase`, o Prisma retornará um erro de constraint:

```
Foreign key constraint failed on the field: `Donation_ngoId_fkey`
```

**Solução:** Execute o seed antes de testar.

---

## Setup

### 1. Instalar dependências de desenvolvimento

```bash
cd apps/donation-core
pnpm install
```

### 2. Configurar variáveis de ambiente

Crie um arquivo `.env.local` com:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/donation_db"
NODE_ENV=development
```

### 3. Executar migrações Prisma

```bash
pnpm exec prisma migrate dev
```

### 4. Usando Docker (Recomendado para desenvolvimento)

Para facilitar o desenvolvimento, use Docker Compose. O seed será executado automaticamente se `RUN_SEED=true` no `.env`.

```bash
# Na raiz do projeto
docker-compose up --build
```

Isso irá:
- Construir e iniciar PostgreSQL e Redis
- Executar migrações do banco
- Executar o seed automaticamente (se RUN_SEED=true)
- Iniciar a aplicação

Para executar o seed manualmente em um container em execução:

```bash
docker-compose exec donation-core sh -c "cd apps/donation-core && pnpm exec prisma db seed"
```

---

## Running the Seed

### Opção 1: NPX (Recomendado)

```bash
cd apps/donation-core
pnpm exec prisma db seed
```

### Opção 2: Compilar e executar TypeScript

```bash
cd apps/donation-core
pnpm exec ts-node prisma/seed.ts
```

---

## What the Seed Creates

### 1. **NGOs** (3 organizações)
- **Save the Children** - Organização internacional para crianças
- **Red Cross** - Assistência humanitária
- **Doctors Without Borders** - Organização médica

### 2. **Donors** (3 doadores)
- **John Doe** - john.doe@example.com
- **Jane Smith** - jane.smith@example.com
- **Carlos Silva** - carlos.silva@example.com

### 3. **Sample Donations** (3 doações em status PENDING)
- John Doe → Save the Children ($100)
- Jane Smith → Red Cross ($250)
- Carlos Silva → Doctors Without Borders ($500)

---

## Valid Relationships for Testing

### Working Donation Creation

Após executar o seed, você pode criar doações com os seguintes IDs:

#### Exemplo 1: John Doe to Save the Children
```bash
curl -X POST http://localhost:3000/donation/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 150,
    "ngoId": "cuid-ngo-1",
    "donorId": "cuid-donor-1",
    "successUrl": "http://localhost:3000/success",
    "cancelUrl": "http://localhost:3000/cancel"
  }'
```

#### Exemplo 2: Query Prisma Studio

```bash
pnpm exec prisma studio
```

Então use a UI para:
1. Visualizar todos os NGOs e seus IDs
2. Visualizar todos os Donors e seus IDs
3. Copiar os IDs para usar nos requests

---

## Database Schema Overview

### Donation Table Structure

| Field | Type | Relation | Required |
|-------|------|----------|----------|
| `id` | String | Primary Key | ✅ |
| `amount` | Float | - | ✅ |
| `ngoId` | String | Foreign Key → Ngo | ✅ |
| `donorId` | String | Foreign Key → Donor | ✅ |
| `status` | DonationStatus | PENDING/COMPLETED/FAILED | ✅ |
| `stripeCheckoutSessionId` | String | Unique | ❌ |
| `stripeSubscriptionId` | String | Unique | ❌ |
| `createdAt` | DateTime | Auto-generated | ✅ |
| `updatedAt` | DateTime | Auto-generated | ✅ |

### NGO Table Structure

| Field | Type | Relation | Required |
|-------|------|----------|----------|
| `id` | String | Primary Key | ✅ |
| `name` | String | - | ✅ |
| `email` | String | Unique | ✅ |
| `description` | String | - | ❌ |
| `createdAt` | DateTime | Auto-generated | ✅ |
| `updatedAt` | DateTime | Auto-generated | ✅ |

### Donor Table Structure

| Field | Type | Relation | Required |
|-------|------|----------|----------|
| `id` | String | Primary Key | ✅ |
| `name` | String | - | ✅ |
| `email` | String | Unique | ✅ |
| `createdAt` | DateTime | Auto-generated | ✅ |
| `updatedAt` | DateTime | Auto-generated | ✅ |

---

## Testing Workflow

### 1. Setup Inicial
```bash
# Setup do projeto
cd apps/donation-core
pnpm install

# Configure o .env.local com DATABASE_URL

# Execute migrações
pnpm exec prisma migrate dev
```

### 2. Popule dados de teste
```bash
pnpm exec prisma db seed
```

### 3. (Opcional) Visualize os dados
```bash
pnpm exec prisma studio
```

### 4. Teste o CreateCheckoutSessionUseCase
```bash
# Inicie a aplicação
pnpm run start

# Em outro terminal, faça requests POST para /donation/checkout com IDs válidos
```

### 5. (Opcional) Reset completo
```bash
# Limpa tudo e re-executa o seed
pnpm exec prisma migrate reset
```

---

## Troubleshooting

### ❌ Erro: "Foreign key constraint failed"
**Causa:** Você está usando um ID de NGO ou Donor que não existe.
**Solução:** Execute o seed novamente e copie os IDs corretos do output.

### ❌ Erro: "Unique constraint failed on the fields: (`email`)"
**Causa:** O seed já foi executado e os emails já existem.
**Solução:** 
1. Execute `pnpm exec prisma migrate reset` (limpa tudo)
2. Ou modifique os emails no `seed.ts`

### ❌ Erro: "Cannot find module 'prisma'"
**Causa:** Dependências não instaladas.
**Solução:** Execute `pnpm install` na pasta `donation-core`.

### ❌ Erro: "Database connection failed"
**Causa:** A string DATABASE_URL está incorreta ou o banco não está rodando.
**Solução:** 
1. Verifique `docker ps` para ver se PostgreSQL está rodando
2. Configure corretamente `DATABASE_URL` no `.env.local`

---

## Advanced: Custom Seeds

Para adicionar mais dados personalizados, edite [prisma/seed.ts](./prisma/seed.ts):

```typescript
const customNgo = await prisma.ngo.create({
  data: {
    name: 'My Custom NGO',
    email: 'custom@ngo.org',
    description: 'Custom description',
  },
});

const customDonor = await prisma.donor.create({
  data: {
    name: 'Custom Donor',
    email: 'donor@custom.com',
  },
});

const customDonation = await prisma.donation.create({
  data: {
    amount: 999.99,
    ngoId: customNgo.id,
    donorId: customDonor.id,
    status: DonationStatus.PENDING,
  },
});
```

Depois execute o seed novamente:
```bash
pnpm exec prisma db seed
```
