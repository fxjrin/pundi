import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  boolean,
  numeric,
  integer,
  date,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

export const roleEnum = pgEnum('role', ['user', 'admin'])
// Shared by categories.type and transactions.type: which side of the ledger something is on.
export const flowTypeEnum = pgEnum('flow_type', ['income', 'expense'])
export const transactionSourceEnum = pgEnum('transaction_source', ['manual', 'ai_scan'])

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: roleEnum('role').notNull().default('user'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  // Null means a global default category (managed by admin), not owned by any single user.
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: flowTypeEnum('type').notNull(),
  // Also doubles as the "active" flag for global categories: admin toggles this to
  // retire a default without deleting it (existing transactions/budgets keep their FK).
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // restrict: a category still referenced by a transaction cannot be deleted.
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    type: flowTypeEnum('type').notNull(),
    amount: numeric('amount', { precision: 14, scale: 2, mode: 'string' }).notNull(),
    note: text('note'),
    // Plain 'YYYY-MM-DD' string, never a JS Date, to avoid UTC-midnight day-shift bugs.
    transactionDate: date('transaction_date', { mode: 'string' }).notNull(),
    source: transactionSourceEnum('source').notNull().default('manual'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('transactions_user_id_idx').on(table.userId),
    index('transactions_category_id_idx').on(table.categoryId),
    index('transactions_transaction_date_idx').on(table.transactionDate),
  ]
)

export const budgets = pgTable(
  'budgets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    month: integer('month').notNull(),
    year: integer('year').notNull(),
    amount: numeric('amount', { precision: 14, scale: 2, mode: 'string' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('budgets_user_category_month_year_unique').on(
      table.userId,
      table.categoryId,
      table.month,
      table.year
    ),
  ]
)
