import {
  User,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../firebase';

export type PlanTier = 'free' | 'limited_trial' | 'starter' | 'pro' | 'vip';
export type SubscriptionStatus = 'inactive' | 'active' | 'expired' | 'suspended';
export type UsageEventType =
  | 'session_start'
  | 'audiobook_created'
  | 'pdf_created'
  | 'voice_generated'
  | 'video_exported'
  | 'checkout_opened'
  | 'subscription_activated';

export interface StudioUserAccount {
  uid: string;
  displayName: string;
  email: string;
  role: 'subscriber' | 'admin';
  planTier: PlanTier;
  subscriptionStatus: SubscriptionStatus;
  tokenBalance: number;
  projectsCreated: number;
  audiobooksCreated: number;
  pdfsCreated: number;
  sessionsCount: number;
  lastModuleUsed: string;
  lastOrderId: string;
  lastActiveAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface StudioUsageEvent {
  id: string;
  userId: string;
  userLabel: string;
  eventType: UsageEventType;
  moduleId: string;
  summary: string;
  createdAt: Date | null;
}

export interface StudioOrderRecord {
  orderId: string;
  userId: string;
  userLabel: string;
  packageId: string;
  packageTitle: string;
  planTier: 'limited_trial' | 'starter' | 'pro' | 'vip';
  amountUsd: number;
  tokensGranted: number;
  status: 'pending' | 'paid' | 'cancelled';
  paypalTxId: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface MonetizationSettings {
  trialPriceUsd: number;
  proPriceUsd: number;
  annualPriceUsd: number;
  freeProjectsLimit: number;
  requireLoginForExport: boolean;
  promoBannerEnabled: boolean;
  promoBannerText: string;
  updatedAt?: Date | null;
}

export const DEFAULT_MONETIZATION_SETTINGS: MonetizationSettings = {
  trialPriceUsd: 5,
  proPriceUsd: 19.99,
  annualPriceUsd: 149,
  freeProjectsLimit: 1,
  requireLoginForExport: true,
  promoBannerEnabled: true,
  promoBannerText:
    'Oferta de lanzamiento: 1 proyecto gratis · Prueba por solo $5 DLL (7 días) o Plan Pro $19.99/mes.',
};

export function formatUsdPrice(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.max(0, amount) : 0;
  return Number.isInteger(safe) ? String(safe) : safe.toFixed(2);
}

export function buildDefaultPromoBannerText(
  settings: Pick<
    MonetizationSettings,
    'trialPriceUsd' | 'proPriceUsd' | 'annualPriceUsd' | 'freeProjectsLimit'
  >
): string {
  const trial = formatUsdPrice(settings.trialPriceUsd);
  const pro = formatUsdPrice(settings.proPriceUsd);
  const freeLabel =
    settings.freeProjectsLimit <= 0
      ? 'Acceso inmediato'
      : settings.freeProjectsLimit === 1
        ? '1 proyecto gratis'
        : `${settings.freeProjectsLimit} proyectos gratis`;
  return `Oferta activa: ${freeLabel} · Prueba por solo $${trial} DLL (7 días) o Plan Pro $${pro}/mes.`.slice(
    0,
    180
  );
}

export function resolvePromoBannerText(settings: MonetizationSettings): string {
  const trial = formatUsdPrice(settings.trialPriceUsd);
  const pro = formatUsdPrice(settings.proPriceUsd);
  const annual = formatUsdPrice(settings.annualPriceUsd);
  const freeLimit = String(Math.max(0, Math.round(settings.freeProjectsLimit)));

  let text = (settings.promoBannerText || '').trim();
  if (!text) {
    return buildDefaultPromoBannerText(settings);
  }
  text = text
    .replace(/\{trial\}/gi, `$${trial}`)
    .replace(/\{pro\}/gi, `$${pro}`)
    .replace(/\{annual\}/gi, `$${annual}`)
    .replace(/\{freeLimit\}/gi, freeLimit);
  return text;
}

function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120);
  return cleaned.length > 0 ? cleaned : `id-${Date.now()}`;
}

function clampString(val: unknown, fallback: string, maxLen: number): string {
  const str = typeof val === 'string' ? val.trim() : '';
  const safe = str.length > 0 ? str : fallback;
  return safe.slice(0, maxLen);
}

function toDateOrNull(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    try {
      return (value as { toDate: () => Date }).toDate();
    } catch {
      return null;
    }
  }
  return null;
}

function mapUserDoc(uid: string, data: Record<string, unknown>): StudioUserAccount {
  return {
    uid,
    displayName: clampString(data.displayName, 'Usuario del Estudio', 120),
    email: clampString(data.email, 'usuario@kinetix.studio', 160),
    role: data.role === 'admin' ? 'admin' : 'subscriber',
    planTier:
      data.planTier === 'limited_trial' ||
      data.planTier === 'starter' ||
      data.planTier === 'pro' ||
      data.planTier === 'vip'
        ? data.planTier
        : 'free',
    subscriptionStatus:
      data.subscriptionStatus === 'active' ||
      data.subscriptionStatus === 'expired' ||
      data.subscriptionStatus === 'suspended'
        ? data.subscriptionStatus
        : 'inactive',
    tokenBalance: typeof data.tokenBalance === 'number' ? data.tokenBalance : 0,
    projectsCreated: typeof data.projectsCreated === 'number' ? data.projectsCreated : 0,
    audiobooksCreated: typeof data.audiobooksCreated === 'number' ? data.audiobooksCreated : 0,
    pdfsCreated: typeof data.pdfsCreated === 'number' ? data.pdfsCreated : 0,
    sessionsCount: typeof data.sessionsCount === 'number' ? data.sessionsCount : 1,
    lastModuleUsed: clampString(data.lastModuleUsed, 'videobook', 64),
    lastOrderId: typeof data.lastOrderId === 'string' ? data.lastOrderId.slice(0, 128) : '',
    lastActiveAt: toDateOrNull(data.lastActiveAt),
    createdAt: toDateOrNull(data.createdAt),
    updatedAt: toDateOrNull(data.updatedAt),
  };
}

export async function signInWithGooglePopup(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOutFirebaseUser(): Promise<void> {
  await signOut(auth);
}

export function subscribeFirebaseAuth(cb: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, cb);
}

export class AdminAccessDeniedError extends Error {
  constructor(operation = 'panel administrativo') {
    super(
      `Acceso denegado: solo los usuarios con role === 'admin' en Firestore pueden ejecutar ${operation}.`
    );
    this.name = 'AdminAccessDeniedError';
  }
}

/**
 * Strictly verifies directly against Firestore (/users/{uid}) that the authenticated
 * user has the field `role === 'admin'`.
 */
export async function verifyFirestoreAdminRole(uid?: string): Promise<boolean> {
  const currentUser = auth.currentUser;
  const resolvedUid = uid ? sanitizeId(uid) : currentUser?.uid ? sanitizeId(currentUser.uid) : '';
  if (!resolvedUid) return false;
  if (currentUser && sanitizeId(currentUser.uid) !== resolvedUid) return false;

  try {
    const userSnap = await getDoc(doc(db, 'users', resolvedUid));
    if (userSnap.exists() && userSnap.data()?.role === 'admin') {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

/**
 * Guard invoked at the entry point of every administrative panel mutation or listener.
 * Throws AdminAccessDeniedError if Firestore does not confirm `role === 'admin'`.
 */
export async function assertFirestoreAdminRole(operationName: string): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new AdminAccessDeniedError(operationName);
  }
  const safeUid = sanitizeId(currentUser.uid);
  const isVerifiedAdmin = await verifyFirestoreAdminRole(safeUid);
  if (!isVerifiedAdmin) {
    throw new AdminAccessDeniedError(operationName);
  }
  return safeUid;
}

/**
 * Checks whether the signed-in user already has `role === 'admin'` in Firestore
 * (or passes the bootstrapped owner Firestore security rule) during login sync.
 * Never embeds personal owner emails in client code.
 */
async function resolveFirestoreAdminAuthority(uid: string): Promise<boolean> {
  // 1. Primary source of truth: /users/{uid}.role === 'admin'
  if (await verifyFirestoreAdminRole(uid)) {
    return true;
  }

  // 2. Secondary explicit admin registry: /admins/{uid}.role === 'admin'
  try {
    const adminSnap = await getDoc(doc(db, 'admins', uid));
    if (adminSnap.exists() && adminSnap.data()?.role === 'admin') {
      return true;
    }
  } catch {
    // Non-admin or unavailable
  }

  // 3. First-login bootstrap check via /admins list rule (only allowed for verified owner)
  try {
    await getDocs(query(collection(db, 'admins'), limit(1)));
    try {
      await setDoc(doc(db, 'admins', uid), {
        uid,
        displayName: 'Administrador Principal',
        role: 'admin',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch {
      // Ignore if already created concurrently
    }
    return true;
  } catch {
    return false;
  }
}

export async function syncSignedInUserProfile(
  firebaseUser: User,
  activeModule = 'videobook'
): Promise<{ profile: StudioUserAccount; isAdmin: boolean }> {
  const uid = sanitizeId(firebaseUser.uid);
  const isAdmin = await resolveFirestoreAdminAuthority(uid);
  const userRef = doc(db, 'users', uid);
  const safeDisplayName = isAdmin
    ? 'Administrador Principal'
    : clampString(
        firebaseUser.displayName || firebaseUser.email?.split('@')[0],
        'Usuario Kinetix',
        120
      );
  const safeEmail = clampString(firebaseUser.email, 'usuario@kinetix.studio', 160);
  const safeModule = clampString(activeModule, 'videobook', 64);

  let existingSnap;
  try {
    existingSnap = await getDoc(userRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
  }

  if (!existingSnap.exists()) {
    const initialDoc = {
      uid,
      displayName: safeDisplayName,
      email: safeEmail,
      role: isAdmin ? 'admin' : 'subscriber',
      planTier: isAdmin ? 'vip' : 'free',
      subscriptionStatus: isAdmin ? 'active' : 'inactive',
      tokenBalance: isAdmin ? 9999999 : 5000,
      projectsCreated: 0,
      audiobooksCreated: 0,
      pdfsCreated: 0,
      sessionsCount: 1,
      lastModuleUsed: safeModule,
      lastOrderId: '',
      lastActiveAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    try {
      await setDoc(userRef, initialDoc);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${uid}`);
    }
  } else {
    const prev = mapUserDoc(uid, existingSnap.data() as Record<string, unknown>);
    const updatePayload: Record<string, unknown> = {
      displayName: isAdmin ? 'Administrador Principal' : prev.displayName,
      lastModuleUsed: safeModule,
      lastActiveAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (isAdmin) {
      updatePayload.role = 'admin';
      updatePayload.planTier = 'vip';
      updatePayload.subscriptionStatus = 'active';
      if (prev.tokenBalance < 1000000) {
        updatePayload.tokenBalance = 9999999;
      }
    } else {
      updatePayload.sessionsCount = Math.min(prev.sessionsCount + 1, 999999);
    }

    try {
      await updateDoc(userRef, updatePayload);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  }

  // Re-read fresh profile
  let freshSnap;
  try {
    freshSnap = await getDoc(userRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
  }

  const profile = freshSnap.exists()
    ? mapUserDoc(uid, freshSnap.data() as Record<string, unknown>)
    : mapUserDoc(uid, {
        uid,
        displayName: safeDisplayName,
        email: safeEmail,
        role: isAdmin ? 'admin' : 'subscriber',
        planTier: isAdmin ? 'vip' : 'free',
        subscriptionStatus: isAdmin ? 'active' : 'inactive',
        tokenBalance: isAdmin ? 9999999 : 5000,
        projectsCreated: 0,
        audiobooksCreated: 0,
        pdfsCreated: 0,
        sessionsCount: 1,
        lastModuleUsed: safeModule,
        lastOrderId: '',
      });

  // Guarantee final admin status comes strictly from Firestore /users/{uid}.role === 'admin'
  const verifiedRoleIsAdmin = profile.role === 'admin';

  // Log session start event (non-blocking for UX)
  void logUsageEvent(
    firebaseUser,
    verifiedRoleIsAdmin ? 'Administrador Principal' : profile.displayName,
    'session_start',
    safeModule,
    verifiedRoleIsAdmin ? 'Inicio de sesión en Modo Administrador' : 'Inicio de sesión en el Estudio'
  );

  return { profile, isAdmin: verifiedRoleIsAdmin };
}

export async function logUsageEvent(
  firebaseUser: User,
  userLabel: string,
  eventType: UsageEventType,
  moduleId: string,
  summary: string
): Promise<void> {
  const uid = sanitizeId(firebaseUser.uid);
  const eventId = sanitizeId(`evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  try {
    await setDoc(doc(db, 'usageEvents', eventId), {
      userId: uid,
      userLabel: clampString(userLabel, 'Usuario', 120),
      eventType,
      moduleId: clampString(moduleId, 'videobook', 64),
      summary: clampString(summary, 'Actividad registrada', 240),
      createdAt: serverTimestamp(),
    });
  } catch {
    // Non-critical telemetry failure should not crash user creative flow
  }
}

export async function recordUserStudioActivity(
  firebaseUser: User,
  profile: StudioUserAccount,
  eventType: UsageEventType,
  moduleId: string,
  summary: string,
  deltas?: {
    projectsDelta?: number;
    audiobooksDelta?: number;
    pdfsDelta?: number;
    tokensSpent?: number;
  }
): Promise<void> {
  const uid = sanitizeId(firebaseUser.uid);
  const safeModule = clampString(moduleId, 'videobook', 64);

  await logUsageEvent(
    firebaseUser,
    profile.role === 'admin' ? 'Administrador Principal' : profile.displayName,
    eventType,
    safeModule,
    summary
  );

  const userRef = doc(db, 'users', uid);
  const nextProjects = Math.min(
    profile.projectsCreated + Math.max(0, deltas?.projectsDelta ?? 0),
    100000
  );
  const nextAudiobooks = Math.min(
    profile.audiobooksCreated + Math.max(0, deltas?.audiobooksDelta ?? 0),
    100000
  );
  const nextPdfs = Math.min(
    profile.pdfsCreated + Math.max(0, deltas?.pdfsDelta ?? 0),
    100000
  );
  const nextTokens =
    profile.role === 'admin'
      ? profile.tokenBalance
      : Math.max(0, profile.tokenBalance - Math.max(0, deltas?.tokensSpent ?? 0));

  try {
    if (profile.role === 'admin') {
      await updateDoc(userRef, {
        lastModuleUsed: safeModule,
        lastActiveAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(userRef, {
        tokenBalance: nextTokens,
        projectsCreated: nextProjects,
        audiobooksCreated: nextAudiobooks,
        pdfsCreated: nextPdfs,
        lastModuleUsed: safeModule,
        lastActiveAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
}

export async function createFirestorePendingOrder(
  firebaseUser: User,
  userLabel: string,
  order: {
    orderId: string;
    packageId: string;
    packageTitle: string;
    planTier: 'limited_trial' | 'starter' | 'pro' | 'vip';
    amountUsd: number;
    tokensGranted: number;
  }
): Promise<void> {
  const safeOrderId = sanitizeId(order.orderId);
  const uid = sanitizeId(firebaseUser.uid);
  try {
    await setDoc(doc(db, 'orders', safeOrderId), {
      orderId: safeOrderId,
      userId: uid,
      userLabel: clampString(userLabel, 'Cliente Kinetix', 120),
      packageId: clampString(order.packageId, 'trial-5', 64),
      packageTitle: clampString(order.packageTitle, 'Prueba $5 DLL', 140),
      planTier: order.planTier,
      amountUsd: Math.max(1, Math.min(5000, Number(order.amountUsd) || 5)),
      tokensGranted: Math.max(0, Math.min(10000000, Number(order.tokensGranted) || 0)),
      status: 'pending',
      paypalTxId: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `orders/${safeOrderId}`);
  }
}

export async function confirmFirestorePaidOrderAtomically(
  firebaseUser: User,
  profile: StudioUserAccount,
  order: {
    orderId: string;
    packageId: string;
    packageTitle: string;
    planTier: 'limited_trial' | 'starter' | 'pro' | 'vip';
    amountUsd: number;
    tokensGranted: number;
    paypalTxId?: string | null;
  }
): Promise<void> {
  const safeOrderId = sanitizeId(order.orderId);
  const uid = sanitizeId(firebaseUser.uid);
  const orderRef = doc(db, 'orders', safeOrderId);
  const userRef = doc(db, 'users', uid);

  // Ensure pending order exists before atomic transition
  const existingOrder = await getDoc(orderRef);
  if (!existingOrder.exists()) {
    await createFirestorePendingOrder(firebaseUser, profile.displayName, order);
  }

  const batch = writeBatch(db);
  batch.update(orderRef, {
    status: 'paid',
    paypalTxId: clampString(order.paypalTxId || '', '', 120),
    updatedAt: serverTimestamp(),
  });
  batch.update(userRef, {
    planTier: order.planTier,
    subscriptionStatus: 'active',
    tokenBalance: Math.min(50000000, profile.tokenBalance + Math.max(0, order.tokensGranted)),
    lastOrderId: safeOrderId,
    lastActiveAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `orders/${safeOrderId}`);
  }

  void logUsageEvent(
    firebaseUser,
    profile.displayName,
    'subscription_activated',
    'paypal-monetization',
    `Activó ${order.packageTitle} ($${order.amountUsd.toFixed(2)} USD)`
  );
}

export function subscribeOwnUserProfile(
  uid: string,
  onProfile: (profile: StudioUserAccount | null) => void
): () => void {
  const safeUid = sanitizeId(uid);
  return onSnapshot(
    doc(db, 'users', safeUid),
    (snap) => {
      if (!snap.exists()) {
        onProfile(null);
        return;
      }
      onProfile(mapUserDoc(safeUid, snap.data() as Record<string, unknown>));
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${safeUid}`);
    }
  );
}

export function subscribeMonetizationSettings(
  onSettings: (settings: MonetizationSettings) => void
): () => void {
  return onSnapshot(
    doc(db, 'appSettings', 'monetization'),
    (snap) => {
      if (!snap.exists()) {
        onSettings(DEFAULT_MONETIZATION_SETTINGS);
        return;
      }
      const d = snap.data() as Record<string, unknown>;
      onSettings({
        trialPriceUsd:
          typeof d.trialPriceUsd === 'number'
            ? d.trialPriceUsd
            : DEFAULT_MONETIZATION_SETTINGS.trialPriceUsd,
        proPriceUsd:
          typeof d.proPriceUsd === 'number'
            ? d.proPriceUsd
            : DEFAULT_MONETIZATION_SETTINGS.proPriceUsd,
        annualPriceUsd:
          typeof d.annualPriceUsd === 'number'
            ? d.annualPriceUsd
            : DEFAULT_MONETIZATION_SETTINGS.annualPriceUsd,
        freeProjectsLimit:
          typeof d.freeProjectsLimit === 'number'
            ? d.freeProjectsLimit
            : DEFAULT_MONETIZATION_SETTINGS.freeProjectsLimit,
        requireLoginForExport:
          typeof d.requireLoginForExport === 'boolean'
            ? d.requireLoginForExport
            : DEFAULT_MONETIZATION_SETTINGS.requireLoginForExport,
        promoBannerEnabled:
          typeof d.promoBannerEnabled === 'boolean'
            ? d.promoBannerEnabled
            : DEFAULT_MONETIZATION_SETTINGS.promoBannerEnabled,
        promoBannerText: clampString(
          d.promoBannerText,
          DEFAULT_MONETIZATION_SETTINGS.promoBannerText,
          180
        ),
        updatedAt: toDateOrNull(d.updatedAt),
      });
    },
    () => {
      onSettings(DEFAULT_MONETIZATION_SETTINGS);
    }
  );
}

// ============================================================================
// ADMIN-ONLY REAL-TIME SUBSCRIPTIONS & MANAGEMENT MUTATIONS
// Every function enforces Firestore `users/{uid}.role === 'admin'` before execution.
// ============================================================================
export function subscribeAllUsersForAdmin(
  onUsers: (users: StudioUserAccount[]) => void,
  onUnauthorized?: () => void
): () => void {
  let cancelled = false;
  let unsubSnapshot: (() => void) | null = null;

  void verifyFirestoreAdminRole().then((hasAdminRole) => {
    if (cancelled) return;
    if (!hasAdminRole) {
      onUsers([]);
      onUnauthorized?.();
      return;
    }
    unsubSnapshot = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        const list: StudioUserAccount[] = snap.docs.map((d) =>
          mapUserDoc(d.id, d.data() as Record<string, unknown>)
        );
        list.sort((a, b) => (b.lastActiveAt?.getTime() || 0) - (a.lastActiveAt?.getTime() || 0));
        onUsers(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'users');
      }
    );
  });

  return () => {
    cancelled = true;
    if (unsubSnapshot) unsubSnapshot();
  };
}

export function subscribeAllUsageEventsForAdmin(
  onEvents: (events: StudioUsageEvent[]) => void,
  onUnauthorized?: () => void
): () => void {
  let cancelled = false;
  let unsubSnapshot: (() => void) | null = null;

  void verifyFirestoreAdminRole().then((hasAdminRole) => {
    if (cancelled) return;
    if (!hasAdminRole) {
      onEvents([]);
      onUnauthorized?.();
      return;
    }
    const q = query(collection(db, 'usageEvents'), orderBy('createdAt', 'desc'), limit(120));
    unsubSnapshot = onSnapshot(
      q,
      (snap) => {
        const list: StudioUsageEvent[] = snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          return {
            id: d.id,
            userId: clampString(data.userId, '', 128),
            userLabel: clampString(data.userLabel, 'Usuario', 120),
            eventType: clampString(data.eventType, 'session_start', 64) as UsageEventType,
            moduleId: clampString(data.moduleId, 'videobook', 64),
            summary: clampString(data.summary, 'Acción en el estudio', 240),
            createdAt: toDateOrNull(data.createdAt),
          };
        });
        onEvents(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'usageEvents');
      }
    );
  });

  return () => {
    cancelled = true;
    if (unsubSnapshot) unsubSnapshot();
  };
}

export function subscribeAllOrdersForAdmin(
  onOrders: (orders: StudioOrderRecord[]) => void,
  onUnauthorized?: () => void
): () => void {
  let cancelled = false;
  let unsubSnapshot: (() => void) | null = null;

  void verifyFirestoreAdminRole().then((hasAdminRole) => {
    if (cancelled) return;
    if (!hasAdminRole) {
      onOrders([]);
      onUnauthorized?.();
      return;
    }
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(120));
    unsubSnapshot = onSnapshot(
      q,
      (snap) => {
        const list: StudioOrderRecord[] = snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          return {
            orderId: d.id,
            userId: clampString(data.userId, '', 128),
            userLabel: clampString(data.userLabel, 'Cliente', 120),
            packageId: clampString(data.packageId, 'trial-5', 64),
            packageTitle: clampString(data.packageTitle, 'Suscripción', 140),
            planTier:
              data.planTier === 'starter' || data.planTier === 'pro' || data.planTier === 'vip'
                ? data.planTier
                : 'limited_trial',
            amountUsd: typeof data.amountUsd === 'number' ? data.amountUsd : 0,
            tokensGranted: typeof data.tokensGranted === 'number' ? data.tokensGranted : 0,
            status:
              data.status === 'paid' || data.status === 'cancelled' ? data.status : 'pending',
            paypalTxId: typeof data.paypalTxId === 'string' ? data.paypalTxId : '',
            createdAt: toDateOrNull(data.createdAt),
            updatedAt: toDateOrNull(data.updatedAt),
          };
        });
        onOrders(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'orders');
      }
    );
  });

  return () => {
    cancelled = true;
    if (unsubSnapshot) unsubSnapshot();
  };
}

export async function adminUpdateUserPlan(
  targetUid: string,
  updates: {
    planTier?: PlanTier;
    subscriptionStatus?: SubscriptionStatus;
    tokenBalance?: number;
    projectsCreated?: number;
  }
): Promise<void> {
  await assertFirestoreAdminRole('adminUpdateUserPlan');
  const safeUid = sanitizeId(targetUid);
  const payload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };
  if (updates.planTier) payload.planTier = updates.planTier;
  if (updates.subscriptionStatus) payload.subscriptionStatus = updates.subscriptionStatus;
  if (typeof updates.tokenBalance === 'number') {
    payload.tokenBalance = Math.max(0, Math.min(50000000, updates.tokenBalance));
  }
  if (typeof updates.projectsCreated === 'number') {
    payload.projectsCreated = Math.max(0, Math.min(100000, Math.round(updates.projectsCreated)));
  }
  try {
    await updateDoc(doc(db, 'users', safeUid), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${safeUid}`);
  }
}

export async function adminApproveOrder(
  order: StudioOrderRecord,
  currentTargetTokens: number
): Promise<void> {
  await assertFirestoreAdminRole('adminApproveOrder');
  const safeOrderId = sanitizeId(order.orderId);
  const safeUid = sanitizeId(order.userId);
  const batch = writeBatch(db);
  batch.update(doc(db, 'orders', safeOrderId), {
    status: 'paid',
    paypalTxId: order.paypalTxId || 'ADMIN-APPROVED',
    updatedAt: serverTimestamp(),
  });
  batch.update(doc(db, 'users', safeUid), {
    planTier: order.planTier,
    subscriptionStatus: 'active',
    tokenBalance: Math.min(50000000, currentTargetTokens + order.tokensGranted),
    lastOrderId: safeOrderId,
    updatedAt: serverTimestamp(),
  });
  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `orders/${safeOrderId}`);
  }
}

export async function saveMonetizationSettingsByAdmin(
  settings: MonetizationSettings
): Promise<void> {
  await assertFirestoreAdminRole('saveMonetizationSettingsByAdmin');
  const payload = {
    trialPriceUsd: Math.max(1, Math.min(500, Number(settings.trialPriceUsd) || 5)),
    proPriceUsd: Math.max(1, Math.min(1000, Number(settings.proPriceUsd) || 19.99)),
    annualPriceUsd: Math.max(1, Math.min(5000, Number(settings.annualPriceUsd) || 149)),
    freeProjectsLimit: Math.max(0, Math.min(100, Math.round(Number(settings.freeProjectsLimit) || 0))),
    requireLoginForExport: Boolean(settings.requireLoginForExport),
    promoBannerEnabled: Boolean(settings.promoBannerEnabled),
    promoBannerText: clampString(
      settings.promoBannerText,
      DEFAULT_MONETIZATION_SETTINGS.promoBannerText,
      180
    ),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'appSettings', 'monetization'), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'appSettings/monetization');
  }
}
