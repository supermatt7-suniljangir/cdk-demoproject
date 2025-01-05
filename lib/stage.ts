import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import { DemoAppStack } from "./demo_app-stack";
import { STAGES } from "../utils/stages";

interface StageProps {
  stageName?: STAGES;
  removalPolicy?: cdk.RemovalPolicy;
}

export class Stage extends cdk.Stage {
  constructor(scope: Construct, id: string, props: StageProps) {
    super(scope, id, props);
    const { stageName, removalPolicy = cdk.RemovalPolicy.DESTROY } =
      props || {};

    const demoStack = new DemoAppStack(this, `DemoStack-new-${stageName}`, {
      stageName: stageName || STAGES.DEV,
      removalPolicy: removalPolicy,
    });

    // this.urlOutput = new CfnOutput(this, "Url", {
    //   value: stack.urlOutput,
    // });
  }
}
