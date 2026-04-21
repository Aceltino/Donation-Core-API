# 🗺️ Roadmap & Contributing Ideas

Ideias de contribuições organizadas por dificuldade e área.

---

## 📊 Visão Geral

| Categor ía | Prioridade | Status | 
|-----------|-----------|--------|
| Backend (NestJS + Prisma) | 🔴 Alta | Em progresso |
| DevOps (Terraform + AWS) | 🔴 Alta | Em progresso |
| Experiência do Dev (DX) | 🟡 Média | Planejado |
| Estabilidade | 🔴 Alta | Crítico |

---

## 🟢 Boas para Iniciantes

### Documentação

- [ ] **Adicionar Comentários ao Swagger**
  - Melhorar descrições de endpoints
  - Adicionar exemplos mais detalhados
  - Documentar códigos de erro
  - **Tempo:** 2-3 horas
  - **Dificuldade:** ⭐ Fácil
  - **Habilidades:** TypeScript, Swagger

- [ ] **Melhorar README com Screenshots**
  - Adicionar screenshots das rotas funcionando
  - Criar diagrama de fluxo Mermaid
  - Explicar cada camada da arquitetura
  - **Tempo:** 3-4 horas
  - **Dificuldade:** ⭐ Fácil
  - **Habilidades:** Markdown, Diagramas

- [ ] **Criar CONTRIBUTING.md com Exemplos**
  - ✅ Já feito! Mas pode melhorar com vídeos
  - Adicionar links para tutoriais
  - Criar templates de PRs
  - **Tempo:** 2 horas
  - **Dificuldade:** ⭐ Fácil

### Testes

- [ ] **Adicionar Testes Unitários Faltando**
  - Testar `CreateCheckoutSessionUseCase`
  - Testar `StripeService` com mocks
  - Testar validações de DTOs
  - **Tempo:** 4-5 horas
  - **Dificuldade:** ⭐⭐ Fácil-Médio
  - **Habilidades:** Jest, TypeScript, Mocks

- [ ] **Aumentar Cobertura de Testes**
  - Atingir 85%+ cobertura em donation-core
  - Adicionar testes de erro/exception
  - Testar edge cases
  - **Tempo:** 6-8 horas
  - **Dificuldade:** ⭐⭐ Médio
  - **Habilidades:** Jest, Clean Code

### Code Quality

- [ ] **Fix Typos e Grammar**
  - Procurar e corrigir erros em comentários
  - Melhorar mensagens de erro
  - Revisar logs (português vs inglês)
  - **Tempo:** 1-2 horas
  - **Dificuldade:** ⭐ Muito Fácil

- [ ] **Adicionar ESLint Rules**
  - Configurar regras mais rigorosas
  - Automatizar formatação
  - Adicionar husky hooks
  - **Tempo:** 2-3 horas
  - **Dificuldade:** ⭐⭐ Fácil

### Docker

- [ ] **Criar Docker Compose com Seed Profile**
  ```yaml
  docker compose --profile seed up
  # Popula banco com dados fake automaticamente
  ```
  - Criar script SQL com dados de teste
  - Adicionar profile no docker-compose.yml
  - Documentar uso
  - **Tempo:** 2-3 horas
  - **Dificuldade:** ⭐⭐ Fácil
  - **Habilidades:** Docker, SQL

---

## 🟡 Intermediário

### Backend Features

- [ ] **Integração com PayPal**
  ```typescript
  // apps/donation-core/src/infrastructure/paypal.service.ts
  export class PayPalService implements PaymentGateway {
    async createCheckout(dto) { }
    async verifyWebhook() { }
  }
  ```
  - Criar interface PaymentGateway
  - Implementar PayPalService
  - Testes e2e completos
  - Documentar setup PayPal
  - **Tempo:** 8-12 horas
  - **Dificuldade:** ⭐⭐⭐ Médio-Alto
  - **Habilidades:** PayPal API, TypeScript, NestJS

- [ ] **Sistema de Relatórios (PDF/CSV)**
  ```
  POST /api/v1/reports/export
  {
    "format": "csv" | "pdf",
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "ngoId": "ngo-001"
  }
  
  Response: { reportId, downloadUrl, expiresIn }
  ```
  - Criar ReportService
  - Integrar pdfkit ou jsPDF
  - Querys otimizadas no banco
  - Background job para gerar arquivo
  - **Tempo:** 10-15 horas
  - **Dificuldade:** ⭐⭐⭐ Médio

- [ ] **Validações Avançadas**
  - Implementar validação de CPF/NIF
  - Integrar e-mail verification
  - Detecção básica de fraud
  - Blacklist de emails/CPF
  - **Tempo:** 8-10 horas
  - **Dificuldade:** ⭐⭐⭐ Médio
  - **Habilidades:** NestJS, Regex, Business Logic

- [ ] **Sistema de Notificações (Email)**
  ```typescript
  // Enviar email após doação confirmada
  export class SendDonationConfirmationEmail {
    async execute(donation: Donation): Promise<void> { }
  }
  ```
  - Integrar SendGrid ou Mailgun
  - Criar templates HTML
  - Testes com Mailhog local
  - **Tempo:** 6-8 horas
  - **Dificuldade:** ⭐⭐⭐ Médio

### DevOps

- [ ] **Configuração de HTTPS com AWS ACM**
  ```hcl
  # terraform/ssl.tf
  resource "aws_acm_certificate" "main" {
    domain_name = "api.seu-dominio.com"
    validation_method = "DNS"
  }
  ```
  - Criar certificado SSL
  - Validar via CNAME no DNS
  - Configurar no ALB
  - Testar renovação automática
  - **Tempo:** 4-6 horas
  - **Dificuldade:** ⭐⭐⭐ Médio
  - **Habilidades:** Terraform, DNS, AWS

- [ ] **Monitoramento com CloudWatch & Alerts**
  - Criar dashboards no CloudWatch
  - Configurar alarmes para CPU/Memory
  - Alertas de erro no SNS
  - **Tempo:** 6-8 horas
  - **Dificuldade:** ⭐⭐⭐ Médio

### DX (Developer Experience)

- [ ] **Shell Script para Setup Local**
  ```bash
  ./scripts/setup-dev.sh
  # Faz tudo: clone, .env, docker, migrations
  ```
  - Criar scripts bash para setup
  - Incluir validações
  - Listar troubleshooting
  - **Tempo:** 3-4 horas
  - **Dificuldade:** ⭐⭐ Fácil-Médio

---

## 🔴 Avançado

### Backend Architecture

- [ ] **Implementar Exponential Backoff para Outbox**
  ```typescript
  // Retry com delayed exponentially: 1s, 2s, 4s, 8s...
  export class OutboxRetryStrategy {
    async executeWithRetry(event: OutboxEvent): Promise<void> { }
  }
  ```
  - Entender Outbox Pattern
  - Implementar retry logic
  - Versionar eventos
  - Dead Letter Queue
  - **Tempo:** 12-16 horas
  - **Dificuldade:** ⭐⭐⭐⭐ Alto
  - **Habilidades:** Event Sourcing, Patterns, TypeScript

- [ ] **Logs Estruturados (Winston/Pino)**
  ```typescript
  // Substituir console.log por logger estruturado em JSON
  logger.info('Donation created', {
    donationId: '123',
    amount: 50,
    ngoId: 'ngo-001',
    timestamp: new Date()
  });
  ```
  - Integrar Winston ou Pino
  - Estruturar logs em JSON
  - Integrar com New Relic
  - Testes de structured logging
  - **Tempo:** 8-10 horas
  - **Dificuldade:** ⭐⭐⭐⭐ Alto

- [ ] **CQRS + Event Sourcing**
  ```typescript
  // Separar read e write models
  // Commands: Mudam estado (escrita)
  // Queries: Buscam dados (leitura)
  // Events: Registram histórico (auditoria)
  ```
  - Refatorar para Command handlers
  - Criar Query handlers
  - Event store no banco
  - Projeções de leitura
  - **Tempo:** 20-30 horas
  - **Dificuldade:** ⭐⭐⭐⭐⭐ Muito Alto
  - **Habilidades:** DDD, Event Sourcing, TypeScript, Database

### Infrastructure

- [ ] **Multi-Cloud Support (GCP, Azure)**
  ```terraform
  # Adaptar terraform para suportar múltiplos clouds
  variable "cloud_provider" {
    type = string
    default = "aws"
    validation {
      condition = contains(["aws", "gcp", "azure"], var.cloud_provider)
    }
  }
  ```
  - Refatorar Terraform em módulos
  - Criar provider abstrato
  - Testes em múltiplos clouds
  - Documentação
  - **Tempo:** 25-40 horas
  - **Dificuldade:** ⭐⭐⭐⭐⭐ Muito Alto
  - **Habilidades:** Terraform, AWS, GCP, Azure, IaC

- [ ] **Kubernetes Deployment**
  - Criar manifests K8s
  - Helm charts
  - Service mesh (Istio)
  - Auto-scaling
  - **Tempo:** 15-20 horas
  - **Dificuldade:** ⭐⭐⭐⭐⭐ Muito Alto

---

## 📱 Frontend & UI

### React Dashboard

- [ ] **Dashboard de Doações**
  ```
  Visualizar:
  - Total doações por período
  - Top NGOs
  - Gráficos de tendências
  - Detalhes de cada doação
  ```
  - Criar repo separado
  - Setup React + TypeScript
  - Integração com API
  - Gráficos com Chart.js
  - **Tempo:** 30-40 horas
  - **Dificuldade:** ⭐⭐⭐⭐ Alto
  - **Habilidades:** React, TypeScript, CSS, API Integration

- [ ] **Admin Panel**
  - CRUD de NGOs
  - CRUD de Doadores
  - Gestão de Webhooks
  - Relatórios
  - **Tempo:** 40-60 horas
  - **Dificuldade:** ⭐⭐⭐⭐⭐ Muito Alto

### Mobile

- [ ] **React Native App**
  - Setup Expo
  - Login/Register
  - Tela de checkout
  - Histórico de doações
  - Push notifications
  - **Tempo:** 50-80 horas
  - **Dificuldade:** ⭐⭐⭐⭐⭐ Muito Alto

---

## 🎓 Learning Resources Sugeridos

Dependendo do que quer contribuir:

### Para Backend
- 📚 [Domain-Driven Design by Eric Evans](https://www.domainlanguage.com/ddd/)
- 📚 [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- 🎥 [NestJS Advanced Patterns](https://docs.nestjs.com/fundamentals/dynamic-modules)

### Para DevOps
- 📚 [Terraform AWS Guide](https://registry.terraform.io/providers/hashicorp/aws/latest)
- 🎥 [AWS ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/)
- 📚 [Infrastructure as Code by Sam Newman](https://www.oreilly.com/library/view/infrastructure-as-code/9781491924334/)

### Para Frontend
- 📚 [React Patterns](https://reactjs.org/docs/getting-started.html)
- 🎥 [TypeScript for React](https://www.typescriptlang.org/docs/handbook/react.html)

---

## 🚀 Como Começar?

1. **Escolha uma tarefa acima** (comece com 🟢 Fácil)
2. **Abra uma issue** no GitHub descrevendo o que quer fazer
3. **Discuta com mantainers** (para não duplicar trabalho)
4. **Fork + Create PR** (seguindo [CONTRIBUTING.md](CONTRIBUTING.md))
5. **Receba feedback** e iterate
6. **Merge!** Seu código agora faz parte do projeto 🎉

---

## 📅 Release Timeline

- **v1.1 (Próximas 4 semanas)**
  - [ ] Integração PayPal
  - [ ] Email confirmação
  - [ ] Cobertura 85%+ testes

- **v1.2 (4-8 semanas)**
  - [ ] Relatórios PDF/CSV
  - [ ] Dashboard básico
  - [ ] Logs estruturados

- **v2.0 (3-4 meses)**
  - [ ] App mobile (React Native)
  - [ ] GraphQL API
  - [ ] Sistema de afiliados

---

## 🎯 Votação Comunitária

Qual feature você quer que desenvolvamos primeiro?

- [ ] PayPal Integration
- [ ] PDF Reports
- [ ] Mobile App
- [ ] Dashboard
- [ ] Multi-Cloud

[Vote aqui](https://github.com/seu-usuario/donation-core-api/discussions)

---

**Vamos construir juntos! 🚀**

*Last updated: 2026-04-21*
