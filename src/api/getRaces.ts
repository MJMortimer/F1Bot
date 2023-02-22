import axios from "axios";

export const getRace = async (year: string, round: string) => {
    const response = await axios.get(`http://ergast.com/api/f1/${year}/${round}.json`);
    return response.data.MRData.RaceTable.Races[0];
}