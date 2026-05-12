import { action } from "./_generated/server";

export const getServerIp = action({
  args: {},
  handler: async () => {
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();
    return data.ip;
  },
});
