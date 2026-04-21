import { Injectable, Logger } from '@nestjs/common';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

@Injectable()
export class LambdaService {
  private readonly logger = new Logger(LambdaService.name);
  private readonly client: LambdaClient;

  constructor() {
    this.client = new LambdaClient({
      region: process.env.AWS_REGION,
    });
  }

  async generateImpactReport(donationData: unknown) {
    const functionName = process.env.LAMBDA_FUNCTION_NAME;
    if (!functionName) {
      throw new Error('AWS Lambda function name is not configured');
    }

    const command = new InvokeCommand({
      FunctionName: functionName,
      Payload: Buffer.from(JSON.stringify(donationData)),
    });

    const response = await this.client.send(command);

    if (response.FunctionError) {
      const errorMessage = `Lambda invocation failed: ${response.FunctionError}`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    this.logger.log(`Lambda invoked with status ${response.StatusCode}`);
    return response;
  }
}
