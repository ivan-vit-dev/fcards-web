import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  collection,
  collectionGroup,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  serverTimestamp,
  limit,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "./firebase";
import { generateSlug } from "./utils";
import type {
  User,
  Player,
  CareerStats,
  Team,
  Match,
  PlayerMatchStats,
  Card,
  Template,
  Achievement,
  UserAchievement,
  Club,
} from "@/types";

// ─── Users ────────────────────────────────────────────────────────────────────

export async function getUserDoc(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as User;
}

export async function createUserDoc(uid: string, data: Partial<User>): Promise<User> {
  const ref = doc(db, "users", uid);
  const payload = {
    uid,
    role: "player" as const,
    subscriptionTier: "free" as const,
    xp: 0,
    level: 1,
    cardsGeneratedThisMonth: 0,
    aiCreditsUsedThisMonth: 0,
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(ref, payload);
  return { id: uid, ...payload } as unknown as User;
}

export async function updateUserDoc(uid: string, data: Partial<User>): Promise<void> {
  await updateDoc(doc(db, "users", uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// ─── Players ──────────────────────────────────────────────────────────────────

const defaultCareerStats: CareerStats = {
  matchesPlayed: 0,
  goals: 0,
  assists: 0,
  yellowCards: 0,
  redCards: 0,
  cleanSheets: 0,
  saves: 0,
  mvpCount: 0,
};

export async function getPlayers(userId: string): Promise<Player[]> {
  const q = query(
    collection(db, "users", userId, "players"),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Player));
}

export async function getPlayerDoc(userId: string, playerId: string): Promise<Player | null> {
  const snap = await getDoc(doc(db, "users", userId, "players", playerId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Player;
}

export async function getPlayerBySlug(userId: string, slug: string): Promise<Player | null> {
  const q = query(
    collection(db, "users", userId, "players"),
    where("slug", "==", slug)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Player;
}

export async function createPlayer(userId: string, data: Partial<Player>): Promise<Player> {
  const ref = await addDoc(collection(db, "users", userId, "players"), {
    userId,
    isPublic: false,
    careerStats: defaultCareerStats,
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: ref.id, userId, careerStats: defaultCareerStats, isPublic: false, ...data } as Player;
}

export async function updatePlayer(
  userId: string,
  playerId: string,
  data: Partial<Player>
): Promise<void> {
  await updateDoc(doc(db, "users", userId, "players", playerId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deletePlayer(userId: string, playerId: string): Promise<void> {
  await deleteDoc(doc(db, "users", userId, "players", playerId));
}

export async function removePlayerFromTeam(userId: string, playerId: string): Promise<void> {
  await updateDoc(doc(db, "users", userId, "players", playerId), {
    teamId: deleteField(),
    updatedAt: serverTimestamp(),
  });
}

export async function getPublicPlayerBySlug(slug: string): Promise<Player | null> {
  const q = query(
    collectionGroup(db, "players"),
    where("slug", "==", slug),
    where("isPublic", "==", true)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Player;
}

export async function generateUniquePlayerSlug(userId: string, displayName: string): Promise<string> {
  const base = generateSlug(displayName) || "hrac";
  let slug = base;
  let n = 2;
  while (true) {
    const existing = await getPlayerBySlug(userId, slug);
    if (!existing) return slug;
    slug = `${base}-${n++}`;
  }
}

// ─── Teams ────────────────────────────────────────────────────────────────────

export async function getTeams(coachId: string): Promise<Team[]> {
  const q = query(
    collection(db, "teams"),
    where("coachId", "==", coachId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Team));
}

export async function getTeamDoc(teamId: string): Promise<Team | null> {
  const snap = await getDoc(doc(db, "teams", teamId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Team;
}

export async function createTeam(data: Partial<Team>): Promise<Team> {
  const ref = await addDoc(collection(db, "teams"), {
    memberIds: [],
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: ref.id, memberIds: [], ...data } as Team;
}

export async function updateTeam(teamId: string, data: Partial<Team>): Promise<void> {
  await updateDoc(doc(db, "teams", teamId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTeam(teamId: string): Promise<void> {
  await deleteDoc(doc(db, "teams", teamId));
}

// ─── Matches ──────────────────────────────────────────────────────────────────

export async function getMatches(teamId: string): Promise<Match[]> {
  const q = query(
    collection(db, "matches"),
    where("teamId", "==", teamId),
    orderBy("date", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Match));
}

export async function getMatchDoc(matchId: string): Promise<Match | null> {
  const snap = await getDoc(doc(db, "matches", matchId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Match;
}

export async function createMatch(data: Partial<Match>): Promise<Match> {
  const ref = await addDoc(collection(db, "matches"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: ref.id, ...data } as Match;
}

export async function updateMatch(matchId: string, data: Partial<Match>): Promise<void> {
  await updateDoc(doc(db, "matches", matchId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// ─── Player match stats ───────────────────────────────────────────────────────

export async function getPlayerMatchStats(matchId: string): Promise<PlayerMatchStats[]> {
  const snap = await getDocs(
    collection(db, "matches", matchId, "playerStats")
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PlayerMatchStats));
}

export async function setPlayerMatchStats(
  matchId: string,
  playerId: string,
  data: Partial<PlayerMatchStats>
): Promise<void> {
  await setDoc(doc(db, "matches", matchId, "playerStats", playerId), {
    matchId,
    playerId,
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

// ─── Cards ────────────────────────────────────────────────────────────────────

export async function getCards(userId: string): Promise<Card[]> {
  const q = query(
    collection(db, "cards"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Card));
}

export async function getCardDoc(cardId: string): Promise<Card | null> {
  const snap = await getDoc(doc(db, "cards", cardId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Card;
}

export async function getCardBySlug(shareSlug: string): Promise<Card | null> {
  const q = query(
    collection(db, "cards"),
    where("shareSlug", "==", shareSlug)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Card;
}

export async function createCard(data: Partial<Card>): Promise<Card> {
  const ref = await addDoc(collection(db, "cards"), {
    aiStatus: "pending",
    effect: "none",
    shareCount: 0,
    printCount: 0,
    isPublic: false,
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: ref.id, ...data } as Card;
}

export async function updateCard(cardId: string, data: Partial<Card>): Promise<void> {
  await updateDoc(doc(db, "cards", cardId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCard(cardId: string): Promise<void> {
  await deleteDoc(doc(db, "cards", cardId));
}

// ─── Templates ────────────────────────────────────────────────────────────────

export async function getTemplates(): Promise<Template[]> {
  const q = query(collection(db, "templates"), where("isActive", "==", true));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Template));
}

export async function getTemplateDoc(templateId: string): Promise<Template | null> {
  const snap = await getDoc(doc(db, "templates", templateId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Template;
}

// ─── Achievements ─────────────────────────────────────────────────────────────

export async function getAchievements(): Promise<Achievement[]> {
  const snap = await getDocs(collection(db, "achievements"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Achievement));
}

export async function getUserAchievements(userId: string): Promise<UserAchievement[]> {
  const snap = await getDocs(
    collection(db, "userAchievements", userId, "unlocked")
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserAchievement));
}

export async function unlockAchievement(
  userId: string,
  achievementId: string
): Promise<void> {
  await setDoc(
    doc(db, "userAchievements", userId, "unlocked", achievementId),
    {
      userId,
      achievementId,
      unlockedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
  );
}

// ─── Clubs ────────────────────────────────────────────────────────────────────

export async function getClubDoc(clubId: string): Promise<Club | null> {
  const snap = await getDoc(doc(db, "clubs", clubId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Club;
}

export async function createClub(data: Partial<Club>): Promise<Club> {
  const ref = await addDoc(collection(db, "clubs"), {
    teamIds: [],
    memberCount: 0,
    subscriptionTier: "free" as const,
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: ref.id, ...data } as Club;
}

export async function updateClub(clubId: string, data: Partial<Club>): Promise<void> {
  await updateDoc(doc(db, "clubs", clubId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function getClubsByOwner(ownerId: string): Promise<Club[]> {
  const q = query(collection(db, "clubs"), where("ownerId", "==", ownerId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Club));
}

export async function deleteClub(clubId: string): Promise<void> {
  await deleteDoc(doc(db, "clubs", clubId));
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function getAdminStats(): Promise<{
  users: number;
  cards: number;
  clubs: number;
  templates: number;
}> {
  const [u, c, cl, t] = await Promise.all([
    getCountFromServer(collection(db, "users")),
    getCountFromServer(collection(db, "cards")),
    getCountFromServer(collection(db, "clubs")),
    getCountFromServer(collection(db, "templates")),
  ]);
  return {
    users: u.data().count,
    cards: c.data().count,
    clubs: cl.data().count,
    templates: t.data().count,
  };
}

export async function getAllUsers(limitCount = 100): Promise<User[]> {
  const q = query(
    collection(db, "users"),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as User));
}

export async function getAllClubs(): Promise<Club[]> {
  const q = query(collection(db, "clubs"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Club));
}

export async function getAllTemplates(): Promise<Template[]> {
  const q = query(collection(db, "templates"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Template));
}

export async function createTemplate(data: Partial<Template>): Promise<Template> {
  const ref = await addDoc(collection(db, "templates"), {
    isActive: true,
    rarityRange: ["common", "uncommon", "rare"],
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: ref.id, isActive: true, ...data } as Template;
}

export async function updateTemplate(
  templateId: string,
  data: Partial<Template>
): Promise<void> {
  await updateDoc(doc(db, "templates", templateId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTemplate(templateId: string): Promise<void> {
  await deleteDoc(doc(db, "templates", templateId));
}
