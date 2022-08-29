import { ChatInputCommandInteraction, Client, IntentsBitField, Interaction } from 'discord.js';
import { F1ScheduleBotCommand, setCommands } from "./commands.js";
import * as api from "./api/index.js";

const client = new Client({intents: [IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildMessages]});

// The bot has been added to a new guild
client.on("guildCreate", (guild) => {
    setCommands(guild);
});

// Bot has been initialised
client.on('ready', async () => {
    console.log(`${client.user?.tag} has logged in`);

    // Once the bot is ready, load some default state for each guild it's in
    const guilds = client.guilds.cache;
    console.log(`Bot has been initialised into the following guilds: '${guilds.map(it => it.name)}'`);

    guilds.forEach(guild => {
        setCommands(guild);
    });
});

// Someone has used a slash command. Let's see respond to it
client.on('interactionCreate', async (interaction: Interaction) => {
    console.log("Interaction Received")

    if(interaction.isChatInputCommand()){
        const commandInteraction = interaction as ChatInputCommandInteraction;

        if(commandInteraction.commandName === F1ScheduleBotCommand.NEXT_RACE){
            const nextRaceString = await getNextRaceString();
            await interaction.reply(nextRaceString);
            return;
        }

        if(commandInteraction.commandName === F1ScheduleBotCommand.DRIVER_STANDINGS){
            const driverStandingsString = await getDriverStandingsString();
            await interaction.reply(driverStandingsString);
            return;
        }

        if(commandInteraction.commandName === F1ScheduleBotCommand.CONSTRUCTOR_STANDINGS){
            const constructorStandingsString = await getConstructorStandingsString();
            await interaction.reply(constructorStandingsString);
            return;
        }

        await interaction.reply("Something went wrong");
        return;
    }
});

client.login(process.env.BOT_TOKEN);

const getNextRaceString = async () => {
    const nextRace = await api.getNextRace();

    if(nextRace === undefined){
        return "No race found";
    }

    const raceDate: any = new Date(`${nextRace.date} ${nextRace.time}`);

    const aestTime = raceDate.toLocaleString("en-nz", {timeZone: "Australia/Sydney"});
    const nzTime = raceDate.toLocaleString("en-nz", {timeZone: "Pacific/Auckland"});

    return `The ${nextRace.raceName} starts at:\n${aestTime} AEST\n${nzTime} NZT`;
}

const getDriverStandingsString = async () => {
    const driverStandings = await api.getCurrentSeasonDriverStandings();

    let result = "";

    result += `\`\`\`\n`;

    result += "Pos  Pts  Driver\n";

    for (let i = 0; i < driverStandings.length; i++) {
        const driverStanding = driverStandings[i];

        result += `${driverStanding.position.padStart(3, " ")}`;
        result += `  ${driverStanding.points.padStart(3, " ")}`;
        result += `  ${driverStanding.Driver.givenName} ${driverStanding.Driver.familyName}\n`;
    }

    result += `\`\`\``;

    return result;
}

const getConstructorStandingsString = async () => {
    const constructorStandings = await api.getCurrentSeasonConstructorStandings();

    let result = "";

    result += `\`\`\`\n`;

    result += "Pos  Pts  Constructor\n";

    for (let i = 0; i < constructorStandings.length; i++) {
        const constructorStanding = constructorStandings[i];

        result += `${constructorStanding.position.padStart(3, " ")}`;
        result += `  ${constructorStanding.points.padStart(3, " ")}`;
        result += `  ${constructorStanding.Constructor.name}\n`;
    }

    result += `\`\`\``;

    return result;
}
