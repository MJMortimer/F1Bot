import axios from "axios";
import { ChatInputCommandInteraction, Client, CommandInteraction, IntentsBitField, Interaction } from 'discord.js';
import { F1ScheduleBotCommand, setCommands } from "./commands.js";

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

        await interaction.reply("Something went wrong");
        return;
    }
});

client.login(process.env.BOT_TOKEN);

const getNextRaceString = async () => {
    const response = await axios.get("http://ergast.com/api/f1/current.json")
    const races = response.data.MRData.RaceTable.Races;

    const now = new Date();
    let nextRace: any;

    for (let i = 0; i < races.length; i++) {
        const race = races[i];
        const raceDate = new Date(`${race.date} ${race.time}`);

        if(raceDate > now){
            nextRace = race;
            break;
        }
    }

    const raceDate: any = new Date(`${nextRace.date} ${nextRace.time}`);

    const aestTime = raceDate.toLocaleString("en-nz", {timeZone: "Australia/Sydney"});
    const nzTime = raceDate.toLocaleString("en-nz", {timeZone: "Pacific/Auckland"});

    return `The ${nextRace.raceName} starts at:\n${aestTime} AEST\n${nzTime} NZT`;
}


