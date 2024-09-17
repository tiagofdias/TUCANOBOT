const { Events, ActivityType } = require('discord.js');

let status = [
    {
        name: 'with your Mom',
        type: ActivityType.Playing,
    },
    {
        name: 'your Mom Live',
        type: ActivityType.Streaming,
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    },
    {
        name: "Ronaldo's SIUUU",
        type: ActivityType.Listening,
    },
    {
        name: "Benfica goals on repeat",
        type: ActivityType.Watching,
    },
    {
        name: "Alex Fernandes's Gameplay",
        type: ActivityType.Watching,
    },
    {
        name: "Paulo Meireles's Gameplay",
        type: ActivityType.Watching,
    },
    {
        name: "Nuno Hacker's getting scammed",
        type: ActivityType.Watching,
    },
    {
        name: "GTA 6 Gameplay",
        type: ActivityType.Watching,
    },
    {
        name: "XTEAMPT on Youtube",
        type: ActivityType.Watching,
    },
    {
        name: "Tuga Server's Revolution",
        type: ActivityType.Watching,
    },
    {
        name: "Afonso's Mom Yelling",
        type: ActivityType.Listening,
    },
    {
        name: "UFC",
        type: ActivityType.Competing,
    },
    {
        name: "Zecalangas's OG Videos",
        type: ActivityType.Watching,
    },
];

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {

        setInterval(() => {
            let random = Math.floor(Math.random() * status.length);
            client.user.setActivity(status[random]);
        }, 10000);

    }
}