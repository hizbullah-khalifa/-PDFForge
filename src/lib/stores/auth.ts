"use client";

export interface User {
  email: string;
  name: string;
  createdAt: string;
}

type Listener = () => void;

const USERS_KEY = "pf-users";
const SESSION_KEY = "pf-session";
let currentUser: User | null = null;
const listeners = new Set<Listener>();

function readUsers(): Array<User & { hash: string }> {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeUsers(users: Array<User & { hash: string }>): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

async function hash(pw: string): Promise<string> {
  const data = new TextEncoder().encode("pdfforge::" + pw);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function emit(): void {
  listeners.forEach((l) => l());
}

export function subscribeAuth(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function getAuthSnapshot(): User | null {
  return currentUser;
}

export async function initAuth(): Promise<void> {
  if (currentUser !== null) return;
  try {
    const email = localStorage.getItem(SESSION_KEY);
    if (email) {
      const found = readUsers().find((u) => u.email === email);
      if (found) currentUser = { email: found.email, name: found.name, createdAt: found.createdAt };
    }
  } catch {}
  currentUser = currentUser ?? null;
  emit();
}

export async function signUp(email: string, name: string, password: string): Promise<void> {
  const users = readUsers();
  if (users.some((u) => u.email === email.toLowerCase()))
    throw new Error("An account with this email already exists. Try logging in.");
  const h = await hash(password);
  users.push({ email: email.toLowerCase(), name, createdAt: new Date().toISOString(), hash: h });
  writeUsers(users);
  currentUser = { email: email.toLowerCase(), name, createdAt: users[users.length - 1].createdAt };
  localStorage.setItem(SESSION_KEY, currentUser.email);
  emit();
}

export async function login(email: string, password: string): Promise<void> {
  const h = await hash(password);
  const found = readUsers().find((u) => u.email === email.toLowerCase());
  if (!found || found.hash !== h) throw new Error("Incorrect email or password.");
  currentUser = { email: found.email, name: found.name, createdAt: found.createdAt };
  localStorage.setItem(SESSION_KEY, found.email);
  emit();
}

export async function resetPassword(email: string, newPassword: string): Promise<void> {
  const users = readUsers();
  const idx = users.findIndex((u) => u.email === email.toLowerCase());
  if (idx < 0) throw new Error("No account found with this email.");
  users[idx].hash = await hash(newPassword);
  writeUsers(users);
}

export function logout(): void {
  currentUser = null;
  localStorage.removeItem(SESSION_KEY);
  emit();
}

export function updateProfile(name: string): void {
  if (!currentUser) return;
  currentUser = { ...currentUser, name };
  const users = readUsers();
  const idx = users.findIndex((u) => u.email === currentUser!.email);
  if (idx >= 0) {
    users[idx].name = name;
    writeUsers(users);
  }
  emit();
}
