export interface IFileGenerator {
    generateInvoice(data: any): Promise<{ pdf: string; facturx: string }>
    generateBankingFile(
        orders: any[],
        type: 'SEPA' | 'CARD',
        executionDate: string,
    ): string
}
