import { relations } from 'drizzle-orm'
import { blob, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { post } from '.'

export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email'),
	picture: text('picture').notNull(),
})

export const userRelations = relations(user, ({many})=> ({
    posts: many(post)
}))

export const session = sqliteTable('user_session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	activeExpires: blob('active_expires', {
		mode: 'bigint',
	}).notNull(),
	idleExpires: blob('idle_expires', {
		mode: 'bigint',
	}).notNull(),
})

export const key = sqliteTable('user_key', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	hashedPassword: text('hashed_password'),
})
