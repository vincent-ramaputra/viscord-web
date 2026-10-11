import { DMChannel } from "../channel";
import { Guild } from "../guild";
import Relationship from "../relationship";
import { UserData } from "../user-data";

export interface ClientReadyResponseDTO {
    user: UserData;
    guilds?: Guild[];
    relationships?: Relationship[];
    presences: string[];
    dmChannels?: DMChannel[];
}