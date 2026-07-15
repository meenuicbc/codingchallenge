import { initializeApp } from "https://www.gstatic.com/firebasejs/11.14.0/firebase-app.js";
import { getFirestore, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, runTransaction, deleteDoc } from "https://www.gstatic.com/firebasejs/11.14.0/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.14.0/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export async function ensureAnonymousUser() {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      if (user) {
        resolve(user);
      } else {
        try {
          const result = await signInAnonymously(auth);
          resolve(result.user);
        } catch (error) {
          reject(error);
        }
      }
    });
  });
}

export function listenToGames(callback) {
  const q = query(collection(db, "games"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const games = snapshot.docs
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      .filter((game) => game.status === "approved");
    callback(games);
  }, (error) => {
    callback([], error);
  });
}

export function listenToGamesAdmin(callback) {
  const q = query(collection(db, "games"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const games = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    callback(games);
  }, (error) => {
    callback([], error);
  });
}

export function listenToVotes(gameId, callback) {
  const votesRef = collection(db, "games", gameId, "votes");
  return onSnapshot(votesRef, (snapshot) => {
    callback(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
  }, (error) => {
    callback([], error);
  });
}

export async function submitGame(gameData) {
  return addDoc(collection(db, "games"), {
    ...gameData,
    voteCount: 0,
    status: "approved",
    createdAt: serverTimestamp()
  });
}

export async function voteForGame(gameId, userId) {
  const gameRef = doc(db, "games", gameId);
  const voteRef = doc(db, "games", gameId, "votes", userId);

  return runTransaction(db, async (transaction) => {
    const gameDoc = await transaction.get(gameRef);
    const existingVote = await transaction.get(voteRef);

    if (existingVote.exists()) {
      return { alreadyVoted: true, voteCount: gameDoc.data()?.voteCount ?? 0 };
    }

    const newVoteCount = (gameDoc.data()?.voteCount ?? 0) + 1;

    transaction.update(gameRef, { voteCount: newVoteCount });
    transaction.set(voteRef, {
      voterId: userId,
      createdAt: serverTimestamp()
    });

    return { alreadyVoted: false, voteCount: newVoteCount };
  });
}

export async function hasVoted(gameId, userId) {
  const voteRef = doc(db, "games", gameId, "votes", userId);
  const voteDoc = await getDoc(voteRef);
  return voteDoc.exists();
}

export async function deleteGame(gameId) {
  return deleteDoc(doc(db, "games", gameId));
}
