import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import { DemoAppStack } from "./demoStack";
import { STAGES } from "../utils/stages";

interface PipelineStageProps {
  stageName?: STAGES;
  removalPolicy?: cdk.RemovalPolicy;
}

export class PipelineStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props: PipelineStageProps) {
    super(scope, id, props);
    const {
      stageName = STAGES.DEV,
      removalPolicy = cdk.RemovalPolicy.DESTROY,
    } = props || {};

    const demoStack = new DemoAppStack(this, `DemoStack-${stageName}`, {
      stageName: stageName,
      removalPolicy: removalPolicy,
    });
  }
}
