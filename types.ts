import type { ChatInputCommandInteraction, Client, ClientUser, Collection, SlashCommandBuilder } from "discord.js";
import type sqlite3 from "sqlite3";

export interface UserRow {
    roblox_id: number;
    discord_id: string | null;
    status: number;
    score: number;
    verified: number;
}

export interface MedalRow {
    id: number;
    name: string;
    description: string | null;
    display_order: number;
}

export interface GroupBindRow {
    id: number;
    group_id: string;
    rank: number;
    points_needed: number;
}

export interface RankBindRow {
    id: number;
    group_id: string;
    server_id: string;
    rank_start: number;
    rank_end: number | null;
    role_id: string;
}

export interface StatusBindRow {
    id: number;
    group_id: string;
    rank: number;
    status: number;
}

export interface ReactionRoleRow {
    id: number;
    message_id: string;
    role_id: string;
    emoji: string;
}

export interface CommandContext {
    client: BotClient;
    db: sqlite3.Database;
    localData: UserRow | null;
}

export interface CommandModule {
    verificationNeeded?: boolean;
    statusReq?: number;
    data: SlashCommandBuilder;
    execute: (
        roblox: any,
        bot: ClientUser | null,
        interaction: ChatInputCommandInteraction,
        misc: CommandContext
    ) => Promise<void> | void;
}

export type BotClient = Client & {
    commands: Collection<string, CommandModule>;
};
