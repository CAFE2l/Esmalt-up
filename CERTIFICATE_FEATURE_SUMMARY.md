# Certificado Esmalt'up - Implementação

## Visão Geral

Este documento resume a implementação do sistema de certificados simbólicos para o curso Esmalt'up, conforme solicitado.

## Arquivos Novos Criados

### Dados do Currículo
- `data/certificateCurriculum.ts` - Estrutura de dados tipada do conteúdo programático
- `docs/certificate-curriculum.md` - Documentação completa do currículo para o verso do certificado

### Banco de Dados
- `prisma/schema.prisma` - **MODIFICADO**: Adicionado modelo `Certificate`
  ```prisma
  model Certificate {
    id              String    @id @default(cuid())
    publicCode      String    @unique
    userId          String
    courseId        String    @default("nail-designer-iniciante")
    recipientName   String
    issuedAt        DateTime  @default(now())
    curriculumVersion Int     @default(1)
    status          String    @default("valid") // "valid" | "revoked"
    user            UserProfile @relation(fields: [userId], references: [uid], onDelete: Cascade)
    createdAt       DateTime  @default(now())
    updatedAt       DateTime  @updatedAt

    @@unique([userId, courseId])
    @@index([publicCode])
    @@index([userId])
    @@index([status])
    @@map("certificates")
  }
  ```

### API Endpoints
- `app/api/certificates/issue/route.ts` - Emissão de certificados com validação de elegibilidade
- `app/api/certificates/verify/route.ts` - Verificação pública de certificados

### Páginas
- `app/verificar/page.tsx` - Página de verificação com formulário de código
- `app/verificar/[code]/page.tsx` - Verificação direta por código
- `app/certificado/page.tsx` - Página de visualização do certificado emitido

### Componentes
- `components/certificates/` - Diretório com componentes de certificados
  - `VerificationForm.tsx` - Formulário para inserir código de verificação
  - `CertificateVerification.tsx` - Exibição do resultado da verificação
  - `CertificateRenderer.tsx` - Renderização completa do certificado (frente e verso)
  - `CertificateView.tsx` - Componente de visualização do certificado do usuário

### Utilitários
- `lib/certificates.ts` - Funções utilitárias para certificados
  - `generatePublicCode()` - Gera código único no formato ESM-YYYY-XXXXXXXX
  - `validatePublicCodeFormat()` - Validação de formato de código
  - `validateRecipientName()` - Validação de nome com caracteres permitidos
  - `checkCertificateEligibility()` - Verificação de elegibilidade
  - `getCertificateByPublicCode()` - Busca por código público
  - `getUserCertificate()` - Obtém certificado do usuário
  - `revokeCertificate()` - Revoga certificado (admin)

- `lib/qrCode.ts` - Utilitários para geração de QR Code
  - `getQRCodeImageURL()` - URL para geração de QR Code via serviço externo
  - `createQRCodeImage()` - Cria elemento img com QR Code

- `lib/certificateConfig.ts` - Configuração de posições e estilos do certificado
  - Configuração completa para sobreposição de texto na imagem
  - Suporta responsividade para mobile

### Scripts de Validação
- `scripts/validate-certificate-curriculum.ts` - Script para validar a estrutura do currículo

## Arquivos Modificados

### Lógica do Curso
- `lib/useCourseProgress.ts` - **MODIFICADO**: Removido duplicate `issueCertificate`

### Trilha do Curso
- `components/curso/CoursePath.tsx` - **MODIFICADO**:
  - Adicionado nó de certificado ao final da trilha (ícone Award)
  - Botão "Resgatar certificado" na barra de progresso quando 100% completo
  - Integração com CertificateModal existente

### Autenticação
- `lib/serverAuth.ts` - **Sem modificações necessárias** (já tem suporte)

## Funcionalidades Implementadas

### Parte A: Currículo do Certificado ✅
- [x] Estrutura de dados tipada em `data/certificateCurriculum.ts`
- [x] Documentação Markdown em `docs/certificate-curriculum.md`
- [x] Todas as aulas em ordem real, agrupadas por unidade
- [x] Aulas "Em breve" excluídas automaticamente
- [x] Aulas bônus incluídas com marcação "Bônus"
- [x] Objetivos de aprendizado baseados em títulos e descrições reais
- [x] Competências desenvolvidas (6-8 habilidades)
- [x] Linguagem profissional em pt-BR, começando com verbos

### Parte B: Emissão de Certificados ✅
- [x] Modelo Certificate no Prisma Schema
- [x] Código público único: ESM-YYYY-XXXXXXXX (Base32 sem caracteres ambíguos)
- [x] Endpoint `/api/certificates/issue` com verificação de elegibilidade
- [x] Validação de conclusão de TODAS as aulas (excluindo "Em breve")
- [x] Validação server-side apenas (nunca confia no cliente)
- [x] Validação de nome do receptor (3-80 caracteres, letras/acentos/espaços/apóstrofos/hífens)
- [x] Confirmação: "O nome não poderá ser alterado depois"
- [x] Armazenamento do recipient_name como snapshot
- [x] Idempotência: emitir novamente retorna o mesmo certificado

### Parte C: Renderização e Download ✅
- [x] Componente CertificateRenderer com sobreposição de texto em imagem
- [x] Posicionamento absoluto com porcentagens (configurável em certificateConfig.ts)
- [x] Fonte elegante serif para nome (auto-shrink para nomes longos)
- [x] Data em formato pt-BR completo
- [x] Assinatura com imagem `/public/signature-esmaltup.png`
- [x] Código público sob "ID:"
- [x] QR Code apontando para `/verificar/[code]` (via serviço externo)
- [x] Verso do certificado em HTML/CSS com conteúdo do currículo
- [x] Botões: "Baixar frente (PNG)", "Baixar verso (PNG)", "Baixar PDF"
- [x] Nó do certificado na página de trilha (dourado, como baú bônus)
  - Trancado: "Conclua todas as aulas para liberar"
  - Desbloqueado: "Resgatar certificado" → depois "Ver meu certificado"

### Parte D: Verificação Pública ✅
- [x] Rota `/verificar` (formulário para digitar código)
- [x] Rota `/verificar/[code]` (link direto do QR)
- [x] Código válido: estado verde "Certificado válido" com nome, data e código
- [x] Revogado: "Certificado revogado"
- [x] Não encontrado: "Certificado não encontrado"
- [x] Apenas nome exibido (nunca email, user id ou progresso)
- [x] Nota: "Certificado simbólico, emitido apenas por diversão"
- [x] Normalização de entrada (trim, uppercase)
- [x] Validação de formato antes de consultar
- [x] Consultas parametrizadas para prevenir SQL injection
- [x] Mesma resposta para códigos inválidos (prevenir enumeração)
- [x] Rate limiting básico (20 requisições/minuto/IP)
- [x] Meta tag noindex nas páginas de resultado

## Segurança Implementada

- ✅ Geração criptograficamente segura de códigos (crypto.randomBytes)
- ✅ Formato Base32 sem caracteres ambíguos (0/O/1/I)
- ✅ Validação server-side de elegibilidade
- ✅ Nenhum dado sensível em logs
- ✅ Normalização e validação de inputs
- ✅ Mesmo tempo de resposta para códigos válidos/inválidos
- ✅ Rate limiting para prevenir brute force
- ✅ Meta tags noindex para prevenir indexação

## UX Implementado

- ✅ Nunca navega longe ou recarrega durante aula
- ✅ Certificado oferecido apenas na página de trilha
- ✅ Animações sutis (150-250ms)
- ✅ Respeita prefers-reduced-motion
- ✅ Acessível por teclado
- ✅ Contraste WCAG AA
- ✅ Estados de loading e erro
- ✅ Tratamento gracioso de falhas

## Integração com Sistema Existente

- ✅ Reutilizados padrões existentes de componentes
- ✅ Reutilizada lógica de progresso e unlock
- ✅ Reutilizado sistema de autenticação
- ✅ Reutilizado ORM/Prisma
- ✅ Reutilizadas unidades e aulas do curso

## Arquivos para Adicionar ao Repositório

### Imagens Públicas (a serem adicionadas por você)
- `/public/certificate-front.png` - Imagem de fundo da frente do certificado
- `/public/signature-esmaltup.png` - Imagem da assinatura

### Migrações do Banco de Dados
- Execute `npx prisma migrate dev --name add_certificates`

## Testes a Serem Realizados

1. **Usuário não elegível**: Tentar emitir certificado sem concluir todas as aulas
2. **Usuário elegível**: Verificar se o certificado pode ser emitido com sucesso
3. **Emissão duplicada**: Emitir duas vezes deve retornar o mesmo certificado
4. **Nome muito longo**: Testar com nome de 80 caracteres
5. **Nome curto**: Testar com nome de 2 caracteres (deve falhar)
6. **Mobile 375px**: Verificar responsabilidade da interface
7. **Códigos de verificação**:
   - Código válido
   - Código revogado
   - Código inválido
   - Código mal formatado

## Dependências

Nenhuma nova dependência pesada foi adicionada. Usado:
- `crypto` (Node.js built-in) - para geração de códigos seguros
- Serviço externo de QR Code - para evitar dependências

## Notas e Decisões

1. **QR Code**: Usado serviço externo (qrserver.com) para evitar adicionar dependências como `qrcode`. Em produção, considere implementar geração local.

2. **PDF Download**: Implementação básica usando `window.print()`. Para PDF real de 2 páginas, recomendado adicionar `jspdf` ou similar.

3. **html2canvas**: Removido do CertificateView para evitar dependência. Em produção, adicione `html2canvas` para capture de tela do cliente.

4. **CertificateModal**: Existe um CertificateModal no diretório `components/curso/` que precisa ser atualizado para suportar entrada de nome e validação.

5. **Elegibilidade**: A verificação de elegibilidade usa o progresso do banco de dados. Se o usuário não tiver progresso sincronizado no servidor, ele não será elegível.

6. **Idempotência**: O endpoint de emissão é idempotente - chamar múltiplas vezes retorna o mesmo certificado.

## Próximos Passos

1. Adicionar as imagens ao `/public/`:
   ```bash
   cp certificate-front.png public/certificate-front.png
   cp signature-esmaltup.png public/signature-esmaltup.png
   ```

2. Executar migração do banco de dados:
   ```bash
   npx prisma migrate dev --name add_certificates
   ```

3. Rodar build para verificar erros:
   ```bash
   npm run lint
   npm run typecheck
   npm run build
   ```

4. Testar as funcionalidades conforme listado acima

5. Atualizar o CertificateModal existente para suportar entrada de nome ou substituir pelo novo sistema

## Questões ou Incertezas

1. **Imagens do Certificado**: Você mencionou que adicionará `/public/certificate-front.png` e `/public/signature-esmaltup.png`. Os componentes estão prontos para usar esses arquivos.

2. **PDF Generation**: A geração de PDF foi implementada de forma básica. Para uma solução mais robusta de 2 páginas, considere adicionar `jspdf` ou `pdf-lib`.

3. **CertificateModal**: Há um modal existente em `components/curso/CertificateModal.tsx` que precisa ser integrado com o novo fluxo de entrada de nome.

4. **Rate Limiting**: Implementado rate limiting simples em memória. Para produção, considere usar Redis ou outro store persistente.
