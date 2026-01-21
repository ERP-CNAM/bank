export interface IBankProvider {
    fetchDirectDebits(executionDate: string): Promise<any[]>
    notifyPaymentUpdates(updates: any[]): Promise<void>
    registerService(routes: any[]): Promise<void>
}
