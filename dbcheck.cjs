const { PrismaClient } = require("@prisma/client");

async function main() {
  const p = new PrismaClient();
  try {
    const rows = await p.$queryRawUnsafe('select count(*)::int as c from "ContentDraft"');
    console.log("DB_OK ContentDraft_count=" + (rows && rows[0] ? rows[0].c : "?"));
    const planRows = await p.$queryRawUnsafe("select count(*)::int as c from \"ContentDraft\" where source like 'content-plan:%'");
    console.log("DB_OK plan_drafts=" + (planRows && planRows[0] ? planRows[0].c : "?"));
  } catch (e) {
    console.log("DB_FAIL code=" + (e.code || "none") + " msg=" + String(e.message).slice(0, 160));
  } finally {
    await p.$disconnect();
  }
}
main();