import { WebClient } from "@slack/web-api";

const client = new WebClient(process.env.SLACK_BOT_TOKEN);
const channelId = process.env.SLACK_CHANNEL_ID!;

// Only these Slack user IDs are eligible for the spotlight.
// To find a Slack user ID: click their profile → ⋮ More → Copy member ID
const MULIGE_AGENTER = [
  "U77CMGUJ2", // Daniel
  "U0163L554HH", // Eirik
  "U01PLCAA12R", // Geir
  "U07BP7J2FGT", // Håkon
  "U0AKKLHS3N1", // Peter
];

const AGENT_GIFS = [
  "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExNG1iMGNnbGR4MmxqZ3ZhcXh6Mnh4N2VxOGVoNjF5dTc5bG93ODR4diZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/umh24MvNmRCBq/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNGlrZHZyYWE3azhsMGpncTM4Mnc2dXA0aTBoejhuZm9laWd2dDgwZyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/119LVmecQWrzlm/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExajhwMDB0aGdoaXU3amdoZWVqc3hraXhuM3ByemdoMWZlcTV1aGx1dSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/0HMhOCi7k9BH0BPdM5/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3eXI1czN4MDI2YW94MmI4dWt2bzhmd3g2cjhlMWZiajVxMm90ejI1bSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/Xw6yFn7frR3Y4/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3aWh0Zzd3NWs2a2g3c3BqNmdud2xrd2c3d3dwbW5qb2VsM2Fia2w4aSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/cYZkY9HeKgofpQnOUl/giphy.gif",
];

function randomGif(): string {
  return AGENT_GIFS[Math.floor(Math.random() * AGENT_GIFS.length)];
}

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
      { type: "image", image_url: randomGif(), alt_text: "agent gif" },
    ],
  });
}

run().catch((err) => { console.error(err); process.exit(1); });
