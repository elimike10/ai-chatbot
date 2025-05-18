import 'server-only';

import { genSaltSync, hashSync } from 'bcrypt-ts';
import { kv } from '@vercel/kv';
import { BlockKind } from '@/components/block';
import type { Chat, Document, Message, Suggestion, User, Vote } from './schema';

export async function getUser(email: string): Promise<Array<User>> {
  const id = await kv.get<string>(`userEmail:${email}`);
  if (!id) return [];
  const user = await kv.get<User>(`user:${id}`);
  return user ? [user] : [];
}

export async function createUser(email: string, password: string) {
  const salt = genSaltSync(10);
  const hash = hashSync(password, salt);
  const id = crypto.randomUUID();
  const user: User = { id, email, password: hash };
  await kv.set(`user:${id}`, user);
  await kv.set(`userEmail:${email}`, id);
  return user;
}

export async function saveChat({
  id,
  userId,
  title,
}: {
  id: string;
  userId: string;
  title: string;
}) {
  const chat: Chat = {
    id,
    createdAt: new Date(),
    userId,
    title,
    visibility: 'private',
  };
  await kv.set(`chat:${id}`, chat);
  const chats = ((await kv.get<Array<string>>(`userChats:${userId}`)) || []).filter(
    Boolean,
  );
  chats.push(id);
  await kv.set(`userChats:${userId}`, chats);
  return chat;
}

export async function deleteChatById({ id }: { id: string }) {
  const chat = await kv.get<Chat>(`chat:${id}`);
  if (chat) {
    const chats = ((await kv.get<Array<string>>(`userChats:${chat.userId}`)) || []).filter(
      (c) => c !== id,
    );
    await kv.set(`userChats:${chat.userId}`, chats);
  }
  await kv.delete(`chat:${id}`);
  await kv.delete(`messages:${id}`);
  await kv.delete(`votes:${id}`);
}

export async function getChatsByUserId({ id }: { id: string }) {
  const ids = (await kv.get<Array<string>>(`userChats:${id}`)) || [];
  const chats: Array<Chat> = [];
  for (const chatId of ids) {
    const chat = await kv.get<Chat>(`chat:${chatId}`);
    if (chat) chats.push(chat);
  }
  return chats.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getChatById({ id }: { id: string }) {
  return kv.get<Chat>(`chat:${id}`);
}

export async function saveMessages({ messages }: { messages: Array<Message> }) {
  for (const message of messages) {
    const list = (await kv.get<Array<Message>>(`messages:${message.chatId}`)) || [];
    list.push(message);
    await kv.set(`messages:${message.chatId}`, list);
    await kv.set(`message:${message.id}`, message);
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  return (await kv.get<Array<Message>>(`messages:${id}`)) || [];
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  const votes = (await kv.get<Record<string, boolean>>(`votes:${chatId}`)) || {};
  votes[messageId] = type === 'up';
  await kv.set(`votes:${chatId}`, votes);
}

export async function getVotesByChatId({ id }: { id: string }) {
  const votes = (await kv.get<Record<string, boolean>>(`votes:${id}`)) || {};
  return Object.entries(votes).map(([messageId, isUpvoted]) => ({
    chatId: id,
    messageId,
    isUpvoted,
  })) as Array<Vote>;
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: BlockKind;
  content: string;
  userId: string;
}) {
  const document: Document = {
    id,
    title,
    kind,
    content,
    userId,
    createdAt: new Date(),
  };
  const docs = (await kv.get<Array<Document>>(`documents:${id}`)) || [];
  docs.push(document);
  await kv.set(`documents:${id}`, docs);
  return document;
}

export async function getDocumentsById({ id }: { id: string }) {
  return (await kv.get<Array<Document>>(`documents:${id}`)) || [];
}

export async function getDocumentById({ id }: { id: string }) {
  const docs = (await kv.get<Array<Document>>(`documents:${id}`)) || [];
  return docs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  const docs = (await kv.get<Array<Document>>(`documents:${id}`)) || [];
  const filtered = docs.filter((d) => d.createdAt < timestamp);
  await kv.set(`documents:${id}`, filtered);
  const suggestions = (await kv.get<Array<Suggestion>>(`suggestions:${id}`)) || [];
  const filteredS = suggestions.filter((s) => s.documentCreatedAt < timestamp);
  await kv.set(`suggestions:${id}`, filteredS);
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  if (suggestions.length === 0) return;
  const id = suggestions[0].documentId;
  const existing = (await kv.get<Array<Suggestion>>(`suggestions:${id}`)) || [];
  existing.push(...suggestions);
  await kv.set(`suggestions:${id}`, existing);
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  return (await kv.get<Array<Suggestion>>(`suggestions:${documentId}`)) || [];
}

export async function getMessageById({ id }: { id: string }) {
  const message = await kv.get<Message>(`message:${id}`);
  return message ? [message] : [];
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  const messages = (await kv.get<Array<Message>>(`messages:${chatId}`)) || [];
  const filtered = messages.filter((m) => m.createdAt < timestamp);
  await kv.set(`messages:${chatId}`, filtered);
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  const chat = await kv.get<Chat>(`chat:${chatId}`);
  if (!chat) return;
  chat.visibility = visibility;
  await kv.set(`chat:${chatId}`, chat);
}
