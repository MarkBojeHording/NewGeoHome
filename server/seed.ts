import "dotenv/config";
import { db } from "./db";
import { users, groups, groupMembers } from "@shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  const username = process.env.SEED_USERNAME || "test";
  const password = process.env.SEED_PASSWORD || "test";
  const email = process.env.SEED_EMAIL || "test@example.com";
  const groupName = process.env.SEED_GROUP || "Demo Group";

  // upsert user
  const existingUser = await db.select().from(users).where(eq(users.username, username)).limit(1);
  let userId: string;
  if (existingUser.length > 0) {
    userId = existingUser[0].id;
  } else {
    const [u] = await db.insert(users).values({ username, password, email }).returning();
    userId = u.id;
  }

  // upsert group
  const existingGroup = await db.select().from(groups).where(eq(groups.name, groupName)).limit(1);
  let groupId: string;
  if (existingGroup.length > 0) {
    groupId = existingGroup[0].id;
  } else {
    const [g] = await db.insert(groups).values({ name: groupName, description: "Local test", created_by: userId }).returning();
    groupId = g.id;
  }

  // ensure membership
  const existingMembership = await db
    .select()
    .from(groupMembers)
    .where(eq(groupMembers.user_id, userId))
    .limit(1);
  if (existingMembership.length === 0) {
    await db.insert(groupMembers).values({ group_id: groupId, user_id: userId, role: "admin", is_active: true });
  }

  console.log(JSON.stringify({ userId, groupId }, null, 2));
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });

