# Verificação de Certificados — Setup & Policies

## Causa raiz (bug do "não encontrado")

O componente `CertificateVerification` chamava
`GET /api/certificates/verify/<code>`, mas só existia a rota
`app/api/certificates/verify/route.ts` (sem segmento dinâmico). A requisição
caía num 404 do Next.js, `response.json()` falhava e a UI mostrava
"Certificado não encontrado" para qualquer código válido.

Correção:
- Criada a rota `app/api/certificates/verify/[code]/route.ts`.
- Tanto ela quanto `POST /api/certificates/verify` agora usam a mesma função
  compartilhada `getPublicCertificateByCode(code)` (`lib/certificates.ts`),
  que lê da mesma tabela (`certificates`) e campo (`publicCode`) usados pelo
  Mural de Formados e pela emissão.
- Normalização compartilhada em `lib/certificateCode.ts`
  (`normalizePublicCode` / `validatePublicCodeFormat`): trim, maiúsculas,
  remove espaços internos e aceita códigos colados sem hífens.
- Erros de rede/servidor (429, 500, falha de fetch) agora mostram
  "Não foi possível verificar agora. Tente novamente." com botão de retry,
  em vez de "não encontrado".

## "Security rules" da verificação pública

Certificados ficam no Postgres (Neon) via Prisma — não usamos Firestore para
isso. A verificação é exposta apenas pela API pública:

- `GET /api/certificates/verify/[code]` — retorna **somente**
  `publicCode, recipientName, courseId, issuedAt, status`. Nunca email,
  userId ou ids internos. Não existe endpoint de listagem de certificados.
- Rate limit simples em memória: 20 req/min por IP (HTTP 429 com
  `Retry-After`). Em produção multi-instância, troque por Upstash/Vercel KV
  para um limite global.
- Códigos são imprevisíveis (8 chars de Base32 sem ambíguos), gerados no
  servidor com `crypto.randomBytes` em `lib/certificates.ts#generatePublicCode`.
- Escritas (emissão/revogação) só acontecem server-side com token Firebase
  Admin (`lib/serverAuth.ts`); o cliente nunca escreve certificado direto.

Se no futuro um cache público de certificados for necessário (ex.: coleção
Firestore `publicCertificates`), use estas regras como referência:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /publicCertificates/{code} {
      // Leitura de UM documento por código apenas (get), nunca listagem
      allow get: if true;
      allow list: if false;
      // Escrita somente via Admin SDK (backend)
      allow create, update, delete: if false;
    }
  }
}
```

Campos permitidos no documento público: `code`, `recipientName`,
`courseName`, `issuedAt`, `completedAt`, `status` ("valid" | "revoked").
Nada de email, userId ou endereço.

## Migração de códigos

```bash
npx tsx scripts/fix-certificate-codes.ts          # dry-run
npx tsx scripts/fix-certificate-codes.ts --apply  # aplica
```

O script normaliza `publicCode` quando possível e regenera códigos inválidos
ou com colisão, logando cada alteração.

## Checklist manual de teste

1. [ ] Logado, abrir "Seu Certificado" no curso → botão "Verificar" abre
       `/verificar/<code>` e mostra "Certificado válido".
2. [ ] Janela anônima: abrir `/verificar`, digitar `ESM-2026-MMJ8NMT6`
       → válido.
3. [ ] Janela anônima: digitar em minúsculas e com espaços
       (`esm-2026-mmj8nmt6`, ` esm 2026 mmj8nmt6 `) → válido.
4. [ ] Código inexistente (`ESM-2026-AAAAAAAA`) → "Certificado não encontrado".
5. [ ] Configurações → aba "Certificados" → "Verificar certificado" abre `/verificar`;
       "Meus certificados" lista código, botões Ver/Baixar/Verificar.
6. [ ] Modal do certificado → "Verificar" → página pública correta.
7. [ ] URL compartilhada `/verificar/ESM-2026-MMJ8NMT6` verifica ao carregar
       e mostra o código no input; verificar outro código atualiza a URL.
8. [ ] Simular erro (DevTools → offline) → mensagem de erro com retry,
       nunca "não encontrado".
9. [ ] Mural de Formados continua listando normalmente.
