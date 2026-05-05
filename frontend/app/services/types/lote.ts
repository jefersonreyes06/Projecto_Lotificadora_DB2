export interface Lote {
    LoteID: number | null;
    BloqueID: number | null;
    NumeroLote: string;
    AreaVaras: number;
    PrecioVara: number;
    Estado: string;
    FechaReserva: string | null;
}

export type LoteFormInput = Record<string, any>;