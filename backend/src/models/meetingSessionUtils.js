const ensurePromises = new WeakMap();

export const ensureMeetingSessionHistory = async (client) => {
  if (!client) {
    throw new Error('Prisma client instance is required');
  }

  const pending = ensurePromises.get(client);
  if (pending) {
    return pending;
  }

  const ensurePromise = (async () => {
    // PostgreSQL-compatible column check (instead of SQLite's PRAGMA)
    const columns = await client.$queryRawUnsafe(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'Meeting';
    `);
    const columnNames = columns.map(col => col.column_name);

    const missingSourceSession = !columnNames.includes('sourceSessionId');
    const missingSequence = !columnNames.includes('sessionSequence');

    if (missingSourceSession) {
      console.log('🛠️  Adding sourceSessionId column to Meeting table');
      await client.$executeRawUnsafe(`ALTER TABLE "Meeting" ADD COLUMN "sourceSessionId" TEXT DEFAULT ''`);
    }

    if (missingSequence) {
      console.log('🛠️  Adding sessionSequence column to Meeting table');
      await client.$executeRawUnsafe(`ALTER TABLE "Meeting" ADD COLUMN "sessionSequence" INTEGER DEFAULT 1`);
    }

    if (missingSourceSession || missingSequence) {
      console.log('🛠️  Backfilling Meeting session metadata');
      await client.$executeRawUnsafe(`
        UPDATE "Meeting"
        SET "sourceSessionId" = CASE
          WHEN COALESCE("sourceSessionId", '') = '' THEN "readaiId"
          ELSE "sourceSessionId"
        END,
            "sessionSequence" = CASE
          WHEN "sessionSequence" IS NULL OR "sessionSequence" < 1 THEN 1
          ELSE "sessionSequence"
        END;
      `);
    } else {
      // Ensure any NULL or empty values are repaired (e.g., older data)
      await client.$executeRawUnsafe(`
        UPDATE "Meeting"
        SET "sourceSessionId" = "readaiId"
        WHERE COALESCE("sourceSessionId", '') = '';
      `);
      await client.$executeRawUnsafe(`
        UPDATE "Meeting"
        SET "sessionSequence" = 1
        WHERE "sessionSequence" IS NULL OR "sessionSequence" < 1;
      `);
    }

    console.log('🛠️  Ensuring Meeting session indexes exist');
    await client.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "Meeting_sourceSessionId_idx" ON "Meeting"("sourceSessionId");');
    await client.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "Meeting_sourceSessionId_sessionSequence_key" ON "Meeting"("sourceSessionId", "sessionSequence");');
  })();

  ensurePromises.set(client, ensurePromise);

  try {
    await ensurePromise;
    ensurePromises.set(client, Promise.resolve());
  } catch (error) {
    ensurePromises.delete(client);
    throw error;
  }
};
