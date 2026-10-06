import { describe, expect, it } from "vitest";
import { isNewGraduate, toWallEntry } from "./wall";

describe("public graduate wall projection", () => {
  it("keeps permanent rank while hiding private profile identity", () => {
    const entry = toWallEntry({
      userId: "private-user-id",
      recipientName: "Nome particular",
      issuedAt: new Date("2026-01-01T00:00:00.000Z"),
      publicCode: "ESM-2026-MMJ8NMT6",
      rankPosition: 7,
      user: {
        publicProfile: {
          userId: "private-user-id",
          username: "private-user",
          displayName: "Nome particular",
          avatarUrl: "https://example.com/avatar.png",
          isPublic: false,
          allowFollows: true,
          followersCount: 2,
          followingCount: 3,
        },
      },
    });

    expect(entry.rankPosition).toBe(7);
    expect(entry.recipientName).toBe("Formado(a) anônimo(a)");
    expect(entry.profile).toBeNull();
    expect(entry).not.toHaveProperty("userId");
  });

  it("only exposes a safe public profile projection", () => {
    const entry = toWallEntry({
      userId: "uid-internal",
      recipientName: "Nome do certificado",
      issuedAt: new Date("2026-01-01T00:00:00.000Z"),
      publicCode: "ESM-2026-MMJ8NMT6",
      rankPosition: 1,
      user: {
        publicProfile: {
          userId: "uid-internal",
          username: "nome-publico",
          displayName: "Nome Público",
          avatarUrl: "javascript:alert(1)",
          isPublic: true,
          allowFollows: true,
          followersCount: 4,
          followingCount: 2,
        },
      },
    });

    expect(entry.profile).toEqual({
      username: "nome-publico",
      displayName: "Nome Público",
      avatarUrl: null,
      followersCount: 4,
      followingCount: 2,
      allowFollows: true,
    });
    expect(entry).not.toHaveProperty("userId");
  });
});

describe("graduate freshness", () => {
  it("marks certificates from the last seven days as new", () => {
    const now = Date.parse("2026-10-06T12:00:00.000Z");
    expect(isNewGraduate("2026-10-01T12:00:00.000Z", now)).toBe(true);
    expect(isNewGraduate("2026-09-20T12:00:00.000Z", now)).toBe(false);
  });
});
