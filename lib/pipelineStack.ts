import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";

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
    const {
      stageName = STAGES.DEV,
      removalPolicy = cdk.RemovalPolicy.DESTROY,
    } = props || {};
    // Create an IAM role for the CDK pipeline with necessary permissions
    const pipelineRole = new iam.Role(this, `CDKPipelineRole-${stageName}`, {
      assumedBy: new iam.ServicePrincipal("codepipeline.amazonaws.com"),
      description: `Role used by CodePipeline to deploy CDK stacks for ${stageName}`,
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "AWSCodePipeline_FullAccess"
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AWSCodeBuildAdminAccess"),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AdministratorAccess"),
      ],
    });

    const pipeline = new CodePipeline(this, `MyPipelineID-${stageName}`, {
      pipelineName: `MyCDKPipeline-${stageName}`,
      role: pipelineRole,
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
          `npx cdk synth -c stage=${stageName}`,
        ],
        primaryOutputDirectory: "cdk.out",
      }),
    });

    pipeline.addStage(
      new Stage(this, `CDK-Deployment-Stage-${stageName}`, {
        stageName: stageName,
        removalPolicy: removalPolicy,
      })
    );
  }
}
