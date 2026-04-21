export interface ImpactReportPayload {
  donationId: string;
  sessionId?: string;
  subscriptionId?: string;
  processedAt: string;
  correlationId?: string;
}
