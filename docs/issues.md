# Esmalt'up — Issues Tracker

> Generated from full codebase audit. Ready to paste into Claude for fixes.

---

## 🔴 Critical

### 1. Certificate API never returns `completedAt`
**File:** `app/api/certificates/issue/route.ts`  
**Problem:** The POST response only returns `{ id, publicCode, recipientName, issuedAt, status }`. It never includes `completedAt`. `CoursePath.tsx` tries to read `data.certificate.completedAt` from the response — it will always be `undefined`, so the certificate modal always shows the issue date as the completion date.  
**Fix:** Query the latest `completedAt` from `LessonProgress` for the user and include it in the response body.

```ts
// After creating/finding the certificate, add:
const lastCompleted = await prisma.lessonProgress.findFirst({
  where: { userId: uid, completedAt: { not: null } },
  orderBy: { completedAt: "desc" },
  select: { completedAt: true },
});

// Then in the response:
completedAt: lastCompleted?.completedAt?.toISOString() ?? null,
```

---

### 2. Certificate eligibility check is too strict — blocks all users
**File:** `app/api/certificates/issue/route.ts` → `checkEligibility()`  
**Problem:** If any lesson slug from `getMainTrackLessons()` is not found in the `Lesson` table in the database, the function immediately returns `false`. This means any user whose DB was seeded before a new lesson was added will be permanently blocked from claiming a certificate, even if they completed everything available.  
**Fix:** Skip lessons that don't exist in the DB (treat them as not required), or seed all lessons on deploy.

```ts
// Replace the hard return false with:
if (!lessonId) continue; // lesson not seeded yet, skip
```

---

### 3. `CoursePath.tsx` uses unsafe type cast to read `publicCode` / `completedAt`
**File:** `components/curso/CoursePath.tsx` (lines ~230–235)  
**Problem:** The `onClaimed` callback casts `data` to `{ recipientName: string; issuedAt: string; publicCode?: string }` with `as`. This is a smell left over from when `CertificateClaimModal`'s interface was being updated. The interface now correctly includes `publicCode` and `completedAt`, so the casts are redundant and hide type errors.  
**Fix:** Remove the `as` casts — the types already match.

```ts
// Replace:
setClaimedPublicCode((data as { ... }).publicCode ?? null);
setClaimedCompletedAt((data as { ... }).completedAt ?? null);
// With:
setClaimedPublicCode(data.publicCode ?? null);
setClaimedCompletedAt(data.completedAt ?? null);
```

---

## 🟠 High

### 4. `ReviewsSection` — `state.loading` property doesn't exist
**File:** `components/produto/ReviewsSection.tsx`  
**Problem:** `loadMore` checks `!state.loading`, but `ReviewState` has no `loading` field. TypeScript will infer it as `undefined` (always falsy), so `loadMore` will fire multiple times if the user clicks fast.  
**Fix:** Add a separate `loading` boolean state, or guard with a ref.

```ts
const [loadingMore, setLoadingMore] = useState(false);

const loadMore = useCallback(() => {
  if (state.hasMore && !loadingMore) {
    setLoadingMore(true);
    setPage((p) => p + 1);
    void load(sort, page + 1, true).finally(() => setLoadingMore(false));
  }
}, [state.hasMore, loadingMore, sort, page, load]);
```

---

### 5. `ReviewsSection` — `load()` passes a Promise as the Authorization header
**File:** `components/produto/ReviewsSection.tsx` (inside `load()`)  
**Problem:**
```ts
const token = user?.getIdToken().catch(() => null); // this is a Promise, not a string
const response = await fetch(url, {
  headers: token ? { authorization: `Bearer ${token}` } : undefined,
});
```
`token` is `Promise<string | null>`, not a string. The header will be `"Bearer [object Promise]"`, causing all authenticated review fetches to fail silently.  
**Fix:** Await the token.

```ts
const token = user ? await user.getIdToken().catch(() => null) : null;
```

---

### 6. `ProductBuyBox` — `FavoritesButton` is not wrapped with `authGuard`
**File:** `components/produto/ProductBuyBox.tsx`  
**Problem:** The conversation summary says favorites are auth-gated, but `FavoritesButton` is rendered directly without any `authGuard` wrapper. The guard is only applied to `handleAddToCart` and `handleBuyNowClick`.  
**Fix:** Wrap `FavoritesButton` or pass an `onAuthRequired` prop to it.

---

### 7. `SocialProof` uses `Math.random()` on every render — causes hydration mismatch
**File:** `components/produto/ProductBuyBox.tsx` → `SocialProof`  
**Problem:**
```ts
recentViews={Math.floor(Math.random() * 50) + 10}
recentSales={Math.floor(Math.random() * 10) + 1}
```
`Math.random()` produces different values on server vs client, causing a React hydration error in production.  
**Fix:** Either use static/seeded values, fetch real data from the API, or move these to a `useEffect`-driven state.

---

### 8. `ReviewForm` — media upload uses `URL.createObjectURL` but never revokes it
**File:** `components/produto/ReviewsSection.tsx` → `ReviewForm`  
**Problem:** Object URLs created with `URL.createObjectURL` are never revoked when the component unmounts or when media is removed. This leaks memory, especially on mobile.  
**Fix:** Revoke URLs in `removeMedia` and in a cleanup `useEffect`.

```ts
const removeMedia = (id: string) => {
  setMedia(prev => {
    const item = prev.find(m => m.id === id);
    if (item?.url.startsWith("blob:")) URL.revokeObjectURL(item.url);
    return prev.filter(m => m.id !== id);
  });
};
```

---

### 9. `ReviewForm` — media is sent as local blob URLs to the API
**File:** `components/produto/ReviewsSection.tsx` → `ReviewForm.handleSubmit`  
**Problem:** The form sends `media` (which contains `blob:` URLs from `URL.createObjectURL`) directly to `POST /api/reviews`. The server cannot access `blob:` URLs — they are client-only. The comment in the code even acknowledges this: *"In a real implementation, you would upload to Cloudinary here"*.  
**Fix:** Upload files to Cloudinary (or Firebase Storage) before submitting, then send the resulting public URLs.

---

## 🟡 Medium

### 10. `useCourseProgress` — `issueCertificate` only saves to localStorage, never to DB
**File:** `lib/useCourseProgress.ts` → `issueCertificate()`  
**Problem:** `issueCertificate()` only sets `certificateIssuedAt` in localStorage. If the user clears storage or logs in on another device, the certificate issued date is lost. The actual certificate record is created by `POST /api/certificates/issue`, but `issueCertificate()` is called in `CoursePath` *after* the API call — it's redundant and inconsistent.  
**Fix:** Remove the local `issueCertificate()` call from `CoursePath` after the API succeeds, or sync the `certificateIssuedAt` from the API response back into local state.

---

### 11. `CoursePath` — certificate button visible at 100% but eligibility is only local
**File:** `components/curso/CoursePath.tsx`  
**Problem:** `progressPercent >= 100` is computed from localStorage progress. A user could manually set localStorage to 100% and see the certificate button. The server-side `checkEligibility()` will block them, but the UX is confusing — they'll click "Resgatar certificado", fill in their name, and get a 403 error.  
**Fix:** This is acceptable as a soft gate, but the error message from the API should be surfaced clearly in `CertificateClaimModal` (it already is via `setError`). No code change needed, but worth noting.

---

### 12. `QuestionsSection` — form stays open after `authGuard` closes modal
**File:** `components/produto/QuestionsSection.tsx`  
**Problem:** The "Fazer uma pergunta" button toggles `openForm` inside `authGuard`. If the user is logged out, the modal shows. If they dismiss the modal without logging in and click the button again, `openForm` may already be `true` from a previous toggle, so the button label shows "Fechar" even though the form was never opened by an authenticated user.  
**Fix:** Always set `openForm(false)` when the auth gate modal is shown, or only toggle when `authGuard` actually runs the action.

---

### 13. `LessonPlayerView` — YouTube player `useEffect` missing `user` in deps
**File:** `components/curso/LessonPlayerView.tsx`  
**Problem:** The YouTube player `useEffect` dependency array is:
```ts
[lesson, slug, isUnlocked, hasVideoError, markCompleted, savePosition, positions]
```
`user` is not included, but the `onStateChange` handler closes over `user` to decide whether to call `markCompleted`. If `user` changes (login/logout while the player is mounted), the stale closure will use the old `user` value.  
**Fix:** Add `user` to the dependency array (this will re-mount the player on auth change, which is acceptable).

---

### 14. `perfil/page.tsx` — `isDirty` check uses `JSON.stringify` on arrays
**File:** `app/(perfil)/perfil/page.tsx`  
**Problem:** `isDirty` compares `JSON.stringify(localProfile)` vs `JSON.stringify(initialProfileRef.current)`. Array field order matters in JSON — if `interests` is `["A","B"]` initially and the user removes and re-adds "A", the order may differ, causing false positives (showing "unsaved changes" when nothing actually changed).  
**Fix:** Sort array fields before stringifying, or use a deep-equal utility.

---

### 15. `Header.tsx` — scroll listener never removed on unmount (potential)
**File:** `components/Header.tsx`  
**Problem:** (Needs verification) If the scroll listener added in `useEffect` doesn't return a cleanup function, it will leak on unmount. Based on the conversation summary, this was recently refactored — worth confirming the cleanup is in place.

---

## 🔵 Low / Polish

### 16. `CertificateModal` — canvas download draws text at hardcoded % positions
**File:** `components/curso/CertificateModal.tsx`  
**Problem:** Text is drawn at `h * 0.56`, `h * 0.66`, etc. These positions are calibrated for the current `certificate-bg.png`. If the background image is ever replaced, all text will be misaligned.  
**Fix:** Document the expected image dimensions and text anchor points, or make positions configurable via props/constants.

---

### 17. `CoursePath` — `ZIG_ZAG_OFFSETS` cycles by index, not by lesson position
**File:** `components/curso/CoursePath.tsx`  
**Problem:** `ZIG_ZAG_OFFSETS[idx % ZIG_ZAG_OFFSETS.length]` uses the index within each unit. If units have different numbers of lessons, the zig-zag pattern resets at each unit boundary, making the visual path look inconsistent across units.  
**Fix:** Use a global lesson index across all units for the offset calculation.

---

### 18. `NotificationBell` — 60s polling runs even when tab is hidden
**File:** `components/notifications/NotificationBell.tsx`  
**Problem:** The `useNotifications(60000)` hook polls every 60 seconds regardless of tab visibility. This wastes network requests when the user has the tab in the background.  
**Fix:** Pause polling when `document.visibilityState === "hidden"` using a `visibilitychange` listener.

---

### 19. `ProductBuyBox` — `lastPurchase` is hardcoded as `"há 2 horas"`
**File:** `components/produto/ProductBuyBox.tsx` → `SocialProof`  
**Problem:** `lastPurchase="há 2 horas"` is a static string. It will always show "2 hours ago" regardless of actual purchase data.  
**Fix:** Either remove this field or fetch real data from the API.

---

### 20. `ReviewsSection` — `"Escrever avaliação"` button only shown when `canReview`
**File:** `components/produto/ReviewsSection.tsx`  
**Problem:** The `authGuard` is applied to the "Escrever avaliação" button, but the button is only rendered when `canReview === true`. A logged-out user who has purchased the product (but isn't logged in) will never see the button at all — they can't be prompted to log in.  
**Fix:** Show the button to all users; let `authGuard` handle the login prompt, and then check purchase eligibility after login.

---

## 📋 Prompt for Claude

```
I'm working on a Next.js 14 app called Esmalt'up (nail art e-commerce + course platform).
Below is a list of bugs and issues found in the codebase. Please fix them one by one, starting with the Critical ones.

For each fix, show only the changed lines with enough context to locate them (no need to reprint entire files).

Tech stack: Next.js 14 App Router, TypeScript, Tailwind CSS, Prisma (PostgreSQL), Firebase Auth, Framer Motion.

Key patterns:
- Auth: `useAuth()` from `@/lib/AuthContext` returns `{ user }` (Firebase User | null)
- Auth gate: `useAuthGate(user, message?)` returns `{ guard, modal }` — call `guard(() => action())` on protected buttons
- Profile: `useUserProfile()` from `@/lib/profile` returns `{ profile, loading, updateProfile, saveStatus, saveError }`
- Dark theme: `--branco` = dark plum (35 26 31), all CSS vars are space-separated RGB triplets
- Course system: `data/course.ts` + `LessonPlayerView` + `CoursePath` (active). Never mix with legacy `lib/courseData.ts` + `CursoApp`
- Certificate flow: `CertificateClaimModal` → POST `/api/certificates/issue` → `CertificateModal`

Issues to fix:
[paste the Critical and High sections from this file]
```
