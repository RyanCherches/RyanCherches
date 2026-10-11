import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';
export const profiles = sqliteTable('profiles', { id: text('id').primaryKey(), name: text('name').notNull(), created: integer('created').notNull() });
export const pieces = sqliteTable('pieces', {
 id:text('id').primaryKey(), userId:text('user_id').notNull().references(()=>profiles.id), title:text('title').notNull(), composer:text('composer').notNull(), instrument:text('instrument').notNull(), url:text('url').notNull(), notes:text('notes').notNull(), fingerprint:text('fingerprint').notNull(), status:text('status').notNull().default('pending'), difficulty:integer('difficulty').notNull().default(0), review:text('review').notNull().default(''), created:integer('created').notNull(), reviewed:integer('reviewed')
}, t=>[uniqueIndex('pieces_fingerprint_unique').on(t.fingerprint)]);
export const sessions = sqliteTable('admin_sessions',{token:text('token').primaryKey(),userId:text('user_id').notNull(),expires:integer('expires').notNull()});
export const limits = sqliteTable('rate_limits',{key:text('key').primaryKey(),count:integer('count').notNull(),expires:integer('expires').notNull()});
export const accounts = sqliteTable('accounts', {
 id:text('id').primaryKey().references(()=>profiles.id), username:text('username').notNull(), email:text('email').notNull(), passwordHash:text('password_hash').notNull(), recoveryHash:text('recovery_hash').notNull(), created:integer('created').notNull()
}, t=>[uniqueIndex('accounts_username_unique').on(t.username),uniqueIndex('accounts_email_unique').on(t.email)]);
export const userSessions=sqliteTable('user_sessions',{token:text('token').primaryKey(),userId:text('user_id').notNull().references(()=>accounts.id),expires:integer('expires').notNull()});
