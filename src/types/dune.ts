// types/dune.ts
export interface DuneResponse<T> {
    execution_id: string;
    query_id: number;
    state: string;
    submitted_at: string;
    expires_at: string;
    execution_started_at: string;
    execution_ended_at: string;
    result: {
        rows: T[];
        metadata: {
            column_names: string[];
            result_set_bytes: number;
            total_row_count: number;
            datatype_names: string[];
        };
    };
}

export interface DuneRawCast {
    url: string;
    text: string;
    reaction_count: number;
    reply_count: number;
    reaction_reply_ratio: number;
    username: string;
    timestamp: string;
    hash: string;
    fid: number;
}

export interface Cast {
    url: string;
    text: string;
    reactionCount: number;
    replyCount: number;
    reactionReplyRatio: number;
    username: string;
    timestamp: string;
    hash: string;
    fid: number;
}

export interface PaginationState {
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
    totalItems: number;
}