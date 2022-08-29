import { ChatInputCommandInteraction, Client, Embed, IntentsBitField, Interaction } from 'discord.js';
import { F1ScheduleBotCommand, RaceResultOptions, setCommands } from "./commands.js";
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

        if(commandInteraction.commandName === F1ScheduleBotCommand.RACE_RESULT){
            // TODO: Refactor to DRY up the conversion and defaulting

            // Figure out year option
            let yearValue = "current";

            let year = commandInteraction.options.get(RaceResultOptions.YEAR);
            if(year?.value && (year.value as string).toLowerCase() !== "current"){
                const yearNum = Number(year.value);
                if(!isNaN(yearNum)){
                    yearValue = year.value as string;
                }
            }

            // Figure out round option
            let roundValue = "last";
            
            let round = commandInteraction.options.get(RaceResultOptions.ROUND);

            if(round?.value && (round.value as string).toLowerCase() !== "last"){
                const roundNum = Number(round.value);
                if(!isNaN(roundNum)){
                    roundValue = round.value as string;
                }
            }

            const raceResultTable = await getRaceResultTable(yearValue, roundValue);
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

const getRaceResultTable = async (year: string, round: string) => {
    const raceResult = await api.getRaceResult(year, round);
    if(!raceResult?.Races || raceResult.Races.length === 0){
        return "No race found";
    }

    const race = raceResult.Races[0];

    const tableEntries = [["Pos", "Pts", "Driver", "Time/Status", "Gained/Lost", "Fastest Lap"]];

    for (let i = 0; i < race.Results.length; i++) {
        const result = race.Results[i];

        // Calculate the postions gained / lost
        const gridPosition = Number(result.grid);
        const finishingPosition = Number(result.position);

        const posChange = gridPosition - finishingPosition;
        
        let posChangeString = "";

        switch(true) {
            case(gridPosition === 0):
                posChangeString = "--"
                break;
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
        let finishTime = result.Time?.time ?? result.status;

        tableEntries.push([result.positionText, result.points, `${result.Driver.givenName} ${result.Driver.familyName}`, finishTime, posChangeString, result.FastestLap?.Time?.time ?? "---"]);
    }

    const tableData = table(tableEntries, {align:['r', 'r', 'l', 'r', 'r', 'r']});

    return (
`\`\`\`
${race.season}, Round ${race.round}, ${race.raceName}

${tableData}
\`\`\``
    );
}
