import { ChatInputCommandInteraction, Client, Embed, IntentsBitField, Interaction } from 'discord.js';
import { F1ScheduleBotCommand, setCommands } from "./commands.js";
import * as api from "./api/index.js";
import table from "text-table";

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
            const driverStandingsTable = await getDriverStandingsTable();
            await interaction.reply(driverStandingsTable);
            return;
        }

        if(commandInteraction.commandName === F1ScheduleBotCommand.CONSTRUCTOR_STANDINGS){
            const constructorStandingsTable = await getConstructorStandingsTable();
            await interaction.reply(constructorStandingsTable);
            return;
        }

        if(commandInteraction.commandName === F1ScheduleBotCommand.RESULT){
            const raceResultTable = await getLastRaceResultTable();
            await interaction.reply(raceResultTable);
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

const getDriverStandingsTable = async () => {
    const driverStandings = await api.getCurrentSeasonDriverStandings();

    const tableEntries = [["Pos", "Pts", "Driver"]];

    for (let i = 0; i < driverStandings.length; i++) {
        const driverStanding = driverStandings[i];
        tableEntries.push([driverStanding.position, driverStanding.points, `${driverStanding.Driver.givenName} ${driverStanding.Driver.familyName}`]);
    }

    const tableData = table(tableEntries, {align:['r', 'r', 'l']});

    return (
`\`\`\`
${tableData}
\`\`\``
    );
}

const getConstructorStandingsTable = async () => {
    const constructorStandings = await api.getCurrentSeasonConstructorStandings();

    const tableEntries = [["Pos", "Pts", "Constructor"]];

    for (let i = 0; i < constructorStandings.length; i++) {
        const constructorStanding = constructorStandings[i];
        tableEntries.push([constructorStanding.position, constructorStanding.points, constructorStanding.Constructor.name]);
    }

    const tableData = table(tableEntries, {align:['r', 'r', 'l']});

    return (
`\`\`\`
${tableData}
\`\`\``
    );
}

const getLastRaceResultTable = async () => {
    const raceResults = await api.getLastRaceResult();

    const tableEntries = [["Pos", "Pts", "Driver", "Time", "Gained/Lost", "Fastest Lap"]];

    for (let i = 0; i < raceResults.length; i++) {
        const raceResult = raceResults[i];

        // Calculate the postions gained / lost
        const posChange = parseInt(raceResult.grid) - parseInt(raceResult.position);
        let posChangeString = "";

        switch(true) {
            case(posChange > 0):
                posChangeString = `+${posChange}`;
                break;
            case(posChange < 0):
                posChangeString = `${posChange}`;
                break;
            default:
                posChangeString = "--";
                break;
        }

        // Figure out the finish time to display

        let finishTime = raceResult.Time?.time;
        if(!finishTime && raceResult.position === raceResult.positionText){
            finishTime = raceResult.status;
        } 
        else if (!finishTime && raceResult.position !== raceResult.positionText){
            finishTime = "---"
        }


        tableEntries.push([raceResult.positionText, raceResult.points, `${raceResult.Driver.givenName} ${raceResult.Driver.familyName}`, finishTime, posChangeString, raceResult.FastestLap?.Time?.time ?? "---"]);
    }

    const tableData = table(tableEntries, {align:['r', 'r', 'l', 'r', 'r', 'r']});

    return (
`\`\`\`
${tableData}
\`\`\``
    );
}
