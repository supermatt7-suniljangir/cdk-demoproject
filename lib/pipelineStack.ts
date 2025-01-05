import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
} from "aws-cdk-lib/pipelines";

interface PipelineStackProps extends cdk.StackProps {
  stageName: string;
  removalPolicy: cdk.RemovalPolicy;
}

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: PipelineStackProps) {
    super(scope, id, props);

    // Define the pipeline
    const pipeline = new CodePipeline(this, "Pipeline", {
      pipelineName: "MyPipeline",
      synth: new ShellStep("Synth", {
        input: CodePipelineSource.gitHub(
          "supermatt7-suniljangir/cdk-demoproject",
          "main",
          {
            authentication: cdk.SecretValue.secretsManager("CDK-GITHUB-TOKEN"),
          }
        ),
        commands: [
          "npm ci",
          "npm run build",
          `npx cdk synth -c stage=${props?.stageName || "dev"}`,
        ],
        primaryOutputDirectory: "cdk.out",
      }),
    });
  }
}
