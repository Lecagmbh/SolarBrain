type QueueItem = {
  id: string;
  createdAt: number;
  installationId: number;
  kategorie: string;
  dokumentTyp: string;
  filename: string;
  mime: string;
  blob: Blob;
  tries: number;
  lastError?: string;
};

const DB_NAME = "gridnetz_upload_queue";
const DB_VERSION = 1;
const STORE = "queue";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const s = db.createObjectStore(STORE, { keyPath: "id" });
        s.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txDone(tx: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function enqueueUpload(input: Omit<QueueItem, "id" | "tries" | "createdAt">) {
  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  const store = tx.objectStore(STORE);

  const id = crypto.randomUUID();
  const item: QueueItem = {
    ...input,
    id,
    createdAt: Date.now(),
    tries: 0,
  };

  store.put(item);
  await txDone(tx);
  db.close();
  return id;
}

export async function listUploads(limit = 20): Promise<QueueItem[]> {
  const db = await openDb();
  const tx = db.transaction(STORE, "readonly");
  const store = tx.objectStore(STORE);
  const idx = store.index("createdAt");

  const items: QueueItem[] = [];

  await new Promise<void>((resolve, reject) => {
    const req = idx.openCursor();
    req.onsuccess = () => {
      const cur = req.result;
      if (!cur) return resolve();
      items.push(cur.value as QueueItem);
      if (items.length >= limit) return resolve();
      cur.continue();
    };
    req.onerror = () => reject(req.error);
  });

  db.close();
  // älteste zuerst
  items.sort((a, b) => a.createdAt - b.createdAt);
  return items;
}

export async function updateUpload(id: string, patch: Partial<QueueItem>) {
  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  const store = tx.objectStore(STORE);

  const existing: QueueItem | undefined = await new Promise((resolve, reject) => {
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result as any);
    req.onerror = () => reject(req.error);
  });

  if (!existing) {
    db.close();
    return;
  }

  store.put({ ...existing, ...patch });
  await txDone(tx);
  db.close();
}

export async function removeUpload(id: string) {
  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).delete(id);
  await txDone(tx);
  db.close();
}
