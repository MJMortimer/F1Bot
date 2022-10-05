import axios from "axios";

export const getRace = async (year: string, round: string) => {
    const response = await axios.get(`http://ergast.com/api/f1/${year}/${round}.json`);
    return response.data.MRData.RaceTable.Races[0];
}

export const getNextSession = async () => {
    const nextRace = await getRace("current", "next");
    
    if(!nextRace){
        return null;
    }

    const now = new Date();    

    let sessionOrder: string[];
    // The order is different for sprint race weekends
    if(nextRace.Sprint){
        sessionOrder = [
            "FirstPractice",
            "Qualifying",
            "SecondPractice",
            "Sprint",
            "Race"
        ];
    }else{
        sessionOrder = [
            "FirstPractice",
            "SecondPractice",
            "ThirdPractice",
            "Qualifying",
            "Race"
        ];
    }

    for (let i = 0; i < sessionOrder.length; i++) {
        const session = sessionOrder[i];

        if(session === "Race"){
            return {
                raceName: nextRace.raceName,
                nextSessionName: session,
                nextSessionTime: new Date(`${nextRace.date} ${nextRace.time}`)
            }
        }

        const sessionTime = new Date(`${nextRace[session].date} ${nextRace[session].time}`);
        if(sessionTime > now){
            return {
                raceName: nextRace.raceName,
                nextSessionName: session,
                nextSessionTime: sessionTime
            }
        }
    }

    return null;
}