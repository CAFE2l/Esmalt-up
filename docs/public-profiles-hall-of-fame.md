# Perfis públicos, follows e Hall da Fama

## Banco de dados

A aplicação usa PostgreSQL via Prisma. Firebase Auth autentica os pedidos HTTP; não há acesso direto do navegador às tabelas. Os endpoints públicos selecionam somente os campos públicos allowlisted, e os endpoints de follow/configuração validam o Firebase ID token no servidor.

Antes de aplicar a mudança, faça backup do banco. Para aplicar no banco atual sem histórico de migrações Prisma, execute a migration idempotente usando uma conexão com os privilégios de proprietário:

```sh
npx prisma db execute --file prisma/migrations/20261010000000_public_profiles_follows_rank/migration.sql --schema prisma/schema.prisma
npx prisma generate
```

Em bancos novos, aplique a migration com `npx prisma migrate deploy` depois de configurar o baseline/migration history já usado pelo projeto. A migration faz o backfill de `rankPosition` para os certificados existentes pela ordem `issuedAt ASC, createdAt ASC, publicCode ASC`, cria os perfis públicos seguros existentes e inicializa o contador atômico. O código de emissão incrementa o contador dentro da mesma transação que insere o certificado.

Índices e constraints criados:

| Objeto | Índice/constraint | Uso |
|---|---|---|
| `certificates` | unique `rankPosition` | impede posições duplicadas |
| `certificates` | `(status, show_on_wall, rankPosition)` | ranking/paginação por posição |
| `certificates` | `(status, show_on_wall, issuedAt, createdAt, publicCode)` | ordem/data e filtros temporais |
| `public_profiles` | unique `username` | perfil `/u/:username` |
| `public_profiles` | `(isPublic, username)` e `(isPublic, displayName)` | mural e filtragem por visibilidade |
| `public_profiles` | GIN trigram em `displayName` | pesquisa parcial por nome |
| `follows` | primary key `(followerId, followingId)` | follow determinístico sem duplicatas |
| `follows` | `(followingId, createdAt)`, `(followerId, createdAt)` | listas paginadas de conexões |

A migration instala a extensão PostgreSQL `pg_trgm` para o índice de pesquisa. Se o banco impedir `CREATE EXTENSION`, habilite `pg_trgm` no painel do provedor e execute novamente esse comando antes de criar o índice `public_profiles_displayName_trgm_idx`.

## Segurança e regras

Não configure regras Firebase/Firestore para estes dados: as tabelas ficam no PostgreSQL e só são acessadas pelo servidor Next.js. Mantenha `DATABASE_URL` apenas no servidor. As regras efetivas são:

- `GET /api/formados`, perfis e listas: somente DTOs públicos; campos privados de `UserProfile`, pedidos, endereço, favoritos e carrinho não são selecionados nem serializados.
- `POST`/`DELETE /api/follows` e `GET` autenticado: exigem Firebase ID token; o servidor define `followerId` pelo token, recusa auto-follow e perfis privados/desabilitados, e a PK composta bloqueia duplicatas.
- Alterações de follow, contadores e notificação são feitas em transação serializável no servidor. Não aceite contadores enviados pelo cliente.
- `PATCH /api/public-profiles/settings`: exige token e só aceita `isPublic`, `allowFollows` e bio com até 160 caracteres.
- Listas de seguidores/seguindo são paginadas e só são expostas para perfis públicos (ou ao próprio dono).

## Dados de demonstração

Use somente um banco local/de teste vazio. O script recusa executar se já houver certificados, evitando reordenar ranks permanentes:

```sh
npm run seed:graduate-test-data
```

Cria 18 usuários identificados por `test-graduate-*`, certificados com `isTestData=true`, datas em meses diferentes e três perfis privados/anônimos. Remova-os com:

```sh
npm run cleanup:graduate-test-data
```

O script de limpeza apaga apenas certificados de teste desses IDs e os respectivos perfis.

## Verificação manual

1. Abra `/formados`; confirme o #1 pela menor data de emissão.
2. Selecione **Mais recentes** e confira que os números permanentes não mudam.
3. Teste busca, mês, 3 meses, ano, só perfis públicos e o filtro **Seguindo** com sessão autenticada.
4. Siga e deixe de seguir pela tabela, pódio, perfil e verificação; confira os contadores, o estado dos botões e a notificação no sino.
5. Abra um `/u/:username`, teste as abas Sobre/Seguidores/Seguindo, copiar/compartilhar certificado e carregar mais.
6. Teste seguir deslogado (prompt/login com retorno à rota), perfil privado, bio com limite e a opção de privacidade.
7. Verifique `ESM-2026-MMJ8NMT6`; quando associado a perfil público, confira **Ver perfil** e **Seguir**. Com perfil privado, o link de perfil deve sumir.
8. Teste **Ir para minha posição**, viewport móvel, navegação por teclado e `prefers-reduced-motion`.

