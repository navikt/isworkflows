import { WebClient } from "@slack/web-api";

const client = new WebClient(process.env.SLACK_BOT_TOKEN);
const channelId = process.env.SLACK_CHANNEL_ID!;

// Only these Slack user IDs are eligible for the spotlight.
// To find a Slack user ID: click their profile → ⋮ More → Copy member ID
const MULIGE_AGENTER = [
  "U77CMGUJ2", // Daniel
  "U0163L554HH", // Eirik
  "U01PLCAA12R", // Geir
  "U0729180HJQ", // Ingrid
  "U07BP7J2FGT", // Håkon
  "U0AKKLHS3N1", // Peter
];

async function run() {
  const profiles = await Promise.all(MULIGE_AGENTER.map((id) => client.users.info({ user: id })));
  const humans = profiles
    .filter((result) => !result.user?.is_bot && !result.user?.deleted)
    .map((result) => result.user!);

  if (!humans.length) throw new Error("No eligible members found");
  const chosen = humans[Math.floor(Math.random() * humans.length)];

  await client.chat.postMessage({
    channel: channelId,
    text: `🌟 Dagens agent: ${chosen.profile?.real_name}`,
  });
}

run().catch((err) => { console.error(err); process.exit(1); });
