import { ChatInputCommandInteraction, Client, AttachmentBuilder, IntentsBitField, Interaction } from 'discord.js';
import { F1ScheduleBotCommand, RaceResultOptions, SendOptions, setCommands } from "./commands.js";
import * as api from "./api/index.js";
import table from "text-table";
import Canvas from '@napi-rs/canvas';
import dateFormat from 'dateformat';

Canvas.GlobalFonts.registerFromPath("build/fonts/Formula1-Regular.ttf", "f1-reg");
Canvas.GlobalFonts.registerFromPath("build/fonts/Formula1-Bold.ttf", "f1-bold");

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
        const sendToAll = commandInteraction.options.getBoolean(SendOptions.SENDTOALL, false) ?? false;
        await commandInteraction.deferReply({ephemeral: !sendToAll});

        if(commandInteraction.commandName === F1ScheduleBotCommand.DRIVER_STANDINGS){
            const driverStandingsTable = await getDriverStandingsTable();
            await interaction.editReply({content: driverStandingsTable});
            return;
        }

        if(commandInteraction.commandName === F1ScheduleBotCommand.CONSTRUCTOR_STANDINGS){
            const canvas = await getConstructorStandingsCanvas();

            if(!canvas){
                await interaction.editReply("Something went wrong");
                return;
            }

            const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'constructorstandings.png' });

            await interaction.editReply({files: [attachment]});
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
            await interaction.editReply({content: raceResultTable});
            return;
        }

        if(commandInteraction.commandName === F1ScheduleBotCommand.SCHEDULE){
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
            let roundValue = "next";
            
            let round = commandInteraction.options.get(RaceResultOptions.ROUND);

            if(round?.value && (round.value as string).toLowerCase() !== "next"){
                const roundNum = Number(round.value);
                if(!isNaN(roundNum)){
                    roundValue = round.value as string;
                }
            }

            const canvas = await getScheduleCanvas(yearValue, roundValue);

            if(!canvas){
                await interaction.editReply("Something went wrong");
                return;
            }

            const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'schedule.png' });

            await interaction.editReply({files: [attachment]});
            return;
        }

        if(commandInteraction.commandName === F1ScheduleBotCommand.TEST){
            const canvas = await getConstructorStandingsCanvas();

            if(!canvas){
                await interaction.editReply("Something went wrong");
                return;
            }

            const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'test.png' });

            await interaction.editReply({files: [attachment]});
            return;            
        }

        await interaction.editReply("Something went wrong");
        return;
    }
});

client.login(process.env.BOT_TOKEN);

const getSchedule = async (year: string, round: string) => {
    const race = await api.getRace(year, round);

    if(!race){
        return null;
    }

    const firstPracticeDateTimeUtc = new Date(`${race["FirstPractice"].date} ${race["FirstPractice"].time}`);
    const secondPracticeDateTimeUtc = new Date(`${race["SecondPractice"].date} ${race["SecondPractice"].time}`);
    const qualifyingDateTimeUtc = new Date(`${race["Qualifying"].date} ${race["Qualifying"].time}`);
    const raceDateTimeUtc = new Date(`${race.date} ${race.time}`);

    if(race.Sprint){        
        const sprintDateTimeUtc = new Date(`${race["Sprint"].date} ${race["Sprint"].time}`);

        return {
            raceName: race.raceName,
            sessions: [
                {
                    sessionName: "First practice",
                    utcDateTime: firstPracticeDateTimeUtc,
                    sydneyDateTime: aest(firstPracticeDateTimeUtc),
                    nzDateTime: nzt(firstPracticeDateTimeUtc)
                },
                {
                    sessionName: "Qualifying",
                    utcDateTime: qualifyingDateTimeUtc,
                    sydneyDateTime: aest(qualifyingDateTimeUtc),
                    nzDateTime: nzt(qualifyingDateTimeUtc)
                },
                {
                    sessionName: "Second practice",
                    utcDateTime: secondPracticeDateTimeUtc,
                    sydneyDateTime: aest(secondPracticeDateTimeUtc),
                    nzDateTime: nzt(secondPracticeDateTimeUtc)
                },
                {
                    sessionName: "Sprint",
                    utcDateTime: sprintDateTimeUtc,
                    sydneyDateTime: aest(sprintDateTimeUtc),
                    nzDateTime: nzt(sprintDateTimeUtc)
                },
                {
                    sessionName: "Grand prix",
                    utcDateTime: raceDateTimeUtc,
                    sydneyDateTime: aest(raceDateTimeUtc),
                    nzDateTime: nzt(raceDateTimeUtc)
                }
            ]
        };
    } else {
        const thirdPracticeDateTimeUtc = new Date(`${race["ThirdPractice"].date} ${race["ThirdPractice"].time}`);

        return {
            raceName: race.raceName,
            sessions: [
                {
                    sessionName: "First practice",
                    utcDateTime: firstPracticeDateTimeUtc,
                    sydneyDateTime: aest(firstPracticeDateTimeUtc),
                    nzDateTime: nzt(firstPracticeDateTimeUtc)
                },
                {
                    sessionName: "Second practice",
                    utcDateTime: secondPracticeDateTimeUtc,
                    sydneyDateTime: aest(secondPracticeDateTimeUtc),
                    nzDateTime: nzt(secondPracticeDateTimeUtc)
                },
                {
                    sessionName: "Third practice",
                    utcDateTime: thirdPracticeDateTimeUtc,
                    sydneyDateTime: aest(thirdPracticeDateTimeUtc),
                    nzDateTime: nzt(thirdPracticeDateTimeUtc)
                },
                {
                    sessionName: "Qualifying",
                    utcDateTime: qualifyingDateTimeUtc,
                    sydneyDateTime: aest(qualifyingDateTimeUtc),
                    nzDateTime: nzt(qualifyingDateTimeUtc)
                },
                {
                    sessionName: "Grand prix",
                    utcDateTime: raceDateTimeUtc,
                    sydneyDateTime: aest(raceDateTimeUtc),
                    nzDateTime: nzt(raceDateTimeUtc)
                }
            ]
        };
    }
}

const getConstructorStandings = async () => {
    const constructorStandings = await api.getCurrentSeasonConstructorStandings();

    if(!constructorStandings){
        return null;
    }

    const standings = [];

    for (let i = 0; i < constructorStandings.length; i++) {
        const constructorStanding = constructorStandings[i];

        standings.push({
            points: constructorStanding.points,
            constructor: {
                id: constructorStanding.Constructor.constructorId,
                name: constructorStanding.Constructor.name
            }
        });
    }

    return standings;
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

const getRaceResultTable = async (year: string, round: string) => {
    const raceResult = await api.getRaceResult(year, round);
    if(!raceResult?.Races || raceResult.Races.length === 0){
        return "No race found";
    }

    const race = raceResult.Races[0];

    const tableEntries = [["Pos", "Pts", "Driver", "Time/Status", "+/-", "Best Lap"]];

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

const getScheduleCanvas = async (year: string, round: string) => {
    const data = await getSchedule(year, round);

    if(!data){
        return null;
    }

    const buffer = 20;
    const titleSize = 60;
    const titleSeparator = 20;
    const sessionSize = 40;
    const sessionSeparator = 10;

    const canvasHeight = 
        buffer + 
        titleSize + 
        titleSeparator + 
        (data.sessions.length * sessionSize) + 
        (data.sessions.length * sessionSeparator) + 
        buffer;

    const canvas = Canvas.createCanvas(1250, canvasHeight);
    const context = canvas.getContext('2d');
    
    const background = await Canvas.loadImage("build/images/bg.png");
    context.drawImage(background, 0, 0, canvas.width, canvas.height);

    const logo = await Canvas.loadImage("build/images/F1-logo.png");
    context.drawImage(logo, (canvas.width - logo.width - buffer), 0); // There's already a bit of buffer built into the png, ignore it for the y value

    // Draw the title
    context.fillStyle = '#000000';
    context.font = `${titleSize}px f1-bold`;
    context.fillText(data.raceName, 20, buffer + titleSize, 1000);

    const now = new Date();
    let hasDrawnNextSession = false;

    // Draw the sessions
    for (let i = 0; i < data.sessions.length; i++) {
        const session = data.sessions[i];
        
        const isFutureSession = session.utcDateTime > now;
        const isNextSession = isFutureSession && !hasDrawnNextSession;

        // Change the font to bold if it's the next session being drawn
        if(isNextSession) {
            context.font = `${sessionSize}px f1-bold`;
        }
        else {
            context.font = `${sessionSize}px f1-reg`;
        }

        const y = buffer + titleSize + titleSeparator + ((i + 1) * sessionSize) + (i * sessionSeparator);

        // Draw the session name
        context.fillStyle = '#000000';
        context.textAlign = 'right';
        context.fillText(session.sessionName, (canvas.width / 3) - 10, y);

        // Set the font colour to white or red depending on whether the session is the next session                
        if(isNextSession) {
            context.fillStyle = '#EE0000';
        }
        else {
            context.fillStyle = '#FFFFFF';
        }

        //Draw the session times                
        context.textAlign = 'left';
        context.fillText(`${dateFormat(session.nzDateTime, "dd/mm HH:MM")} NZL  ${dateFormat(session.sydneyDateTime, "dd/mm HH:MM")} SYD`, (canvas.width / 3) + 10, y);

        // If we've just drawn the next session, update the bool to indicate this so all other sessions are drawn appropriately
        if(isNextSession) {
            hasDrawnNextSession = true;
        }
    }

    return canvas;
}

const getConstructorStandingsCanvas = async () => {
    const data = await getConstructorStandings();

    if(!data){
        return null;
    }

    const buffer = 20;
    const titleSize = 50;
    const titleSeparator = 20;
    const headingSize = 40;
    const headingSeparator = 15;
    const entrantSize = 30;
    const entrantSeparator = 10;

    const canvasHeight = 
        buffer +
        titleSize +
        titleSeparator +
        headingSize +
        headingSeparator +
        (data.length * entrantSize) +
        (data.length * entrantSeparator) +
        buffer;

    const canvas = Canvas.createCanvas(1000, canvasHeight);
    const context = canvas.getContext('2d');
    
    const background = await Canvas.loadImage("build/images/bg.png");
    context.drawImage(background, 0, 0, canvas.width, canvas.height);

    const logo = await Canvas.loadImage("build/images/F1-logo.png");
    context.drawImage(logo, (canvas.width - logo.width - buffer), 0); // There's already a bit of buffer built into the png, ignore it for the y value

    // Draw the title
    context.fillStyle = '#000000';
    context.font = `${titleSize}px f1-bold`;
    context.fillText("Constructor standings", 20, buffer + titleSize);

    const headingY = buffer + titleSize + titleSeparator + headingSize;

    // Draw the headings
    context.font = `${headingSize}px f1-bold`;

    context.textAlign = "right";
    context.fillText("Pos", 180, headingY);

    context.textAlign = "left";
    context.fillText("Constructor", 240, headingY);

    context.textAlign = "right";
    context.fillText("Pts", 755, headingY);
    context.fillText("Gap", 895, headingY);

    

    // Draw the standings
    context.fillStyle = '#FFFFFF';
    context.font = `${headingSize}px f1-reg`;
    
    for (let i = 0; i < data.length; i++) {
        const standing = data[i];
        const pointGap = i === 0 ? "- - -" : `${data[i - 1].points - data[i].points}`;

        const entrantY = buffer + titleSize + titleSeparator + headingSize + headingSeparator + ((i + 1) * entrantSize) + (i * entrantSeparator);

        context.textAlign = "right";
        context.fillText(`${i + 1}`, 180, entrantY);

        context.textAlign = "left";
        context.fillText(standing.constructor.name, 240, entrantY, 375);

        context.textAlign = "right";
        context.fillText(standing.points, 755, entrantY);
        context.fillText(pointGap, 895, entrantY);
    }

    return canvas;
}

const aest = (date: Date) => {
    return new Date(date.toLocaleString("en", {timeZone: "Australia/Sydney"}));
}

const nzt = (date: Date) => {
    return new Date(date.toLocaleString("en", {timeZone: "Pacific/Auckland"}));
}