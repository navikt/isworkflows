import { WebClient } from "@slack/web-api";

const client = new WebClient(process.env.SLACK_BOT_TOKEN);
const channelId = process.env.SLACK_CHANNEL_ID!;

// Only these Slack user IDs are eligible for the spotlight.
// To find a Slack user ID: click their profile → ⋮ More → Copy member ID
const MULIGE_AGENTER = [
  "U77CMGUJ2", // Daniel
  "U0AU9EB7F61", // Marius
  "U0163L554HH", // Eirik
  "U01PLCAA12R", // Geir
  "U07BP7J2FGT", // Håkon
  "U0AKKLHS3N1", // Peter
];

const TIMEZONE = "Europe/Oslo";

/** Returns midnight UTC of today's calendar date in the Oslo timezone. */
function getOsloToday(): Date {
  return new Date(new Date().toLocaleDateString("en-CA", { timeZone: TIMEZONE }));
}

// Returns the ISO week index (Monday-aligned) since the Unix epoch.
function getWeekIndex(): number {
  const today = getOsloToday();
  const dayOfWeek = today.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(today);
  monday.setUTCDate(today.getUTCDate() - daysSinceMonday);
  // Jan 5, 1970 was the first Monday of the Unix epoch
  const FIRST_MONDAY_MS = 4 * 24 * 60 * 60 * 1000;
  return Math.floor((monday.getTime() - FIRST_MONDAY_MS) / (7 * 24 * 60 * 60 * 1000));
}

function buildMessage(dayOfWeek: number, mention: string): string | null {
  switch (dayOfWeek) {
    case 1: return `🌟 Ukas agent: ${mention}`;       // Monday message
    case 3: return `🔔 Keep it up ${mention}!`;       // Wednesday message
    case 5: return `🤌 Siste innspurt ${mention}!`;   // Friday message
    default: return null;
  }
}

async function run() {
  const dayOfWeek = getOsloToday().getUTCDay();
  if (buildMessage(dayOfWeek, "") === null) return; // No message on Tue/Thu

  const profiles = await Promise.all(MULIGE_AGENTER.map((id) => client.users.info({ user: id })));
  const humans = profiles
    .filter((result) => !result.user?.is_bot && !result.user?.deleted)
    .map((result) => result.user!);

  if (!humans.length) throw new Error("No eligible members found");

  const chosen = humans[getWeekIndex() % humans.length];
  const text = buildMessage(dayOfWeek, `<@${chosen.id}>`);
  if (text === null) return;

  await client.chat.postMessage({
    channel: channelId,
    text,
    blocks: [
      { type: "section", text: { type: "mrkdwn", text } },
    ],
  });
}

run().catch((err) => { console.error(err); process.exit(1); });
