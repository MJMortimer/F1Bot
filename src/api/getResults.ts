import axios from "axios";

export const getRaceResult = async (year: string, round: string) => {
    const response = await axios.get(`http://ergast.com/api/f1/${year}/${round}/results.json`);
    
    return response.data.MRData.RaceTable;
}