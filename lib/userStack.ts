import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

interface UserStackProps extends cdk.StackProps {
  stageName?: string;
  removalPolicy?: cdk.RemovalPolicy;
}

export class UserStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: UserStackProps) {
    super(scope, id, props);
  }
}
