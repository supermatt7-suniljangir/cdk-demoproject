import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
} from "aws-cdk-lib/pipelines";
import { Stage } from "./stage";
import { STAGES } from "../utils/stages";

interface PipelineStackProps extends cdk.StackProps {
  stageName: STAGES;
  removalPolicy: cdk.RemovalPolicy;
}

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: PipelineStackProps) {
    super(scope, id, props);
    const pipeline = new CodePipeline(this, "Pipeline", {
      pipelineName: `pipeline-${props?.stageName || "dev"}`,
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

    pipeline.addStage(
      new Stage(this, "DEV", {
        stageName: props?.stageName || STAGES.DEV,
        removalPolicy: props?.removalPolicy || cdk.RemovalPolicy.DESTROY,
      })
    );
    pipeline.addStage(
      new Stage(this, "DEV", {
        stageName: props?.stageName || STAGES.DEV,
        removalPolicy: props?.removalPolicy || cdk.RemovalPolicy.DESTROY,
      })
    );
  }
}
