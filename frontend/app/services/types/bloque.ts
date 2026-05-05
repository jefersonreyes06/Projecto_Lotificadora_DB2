export interface Bloque {
    BloqueID: number | null;
    EtapaID?: number | null;
    Bloque: string;
    AreaTotalVaras: number;
    //estado: string;
}

export type BloqueFormInput = Record<string, any>;