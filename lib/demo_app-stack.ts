import * as cdk from "aws-cdk-lib";
import { Bucket, CfnBucket } from "aws-cdk-lib/aws-s3";
import { Queue } from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import { aws_apigateway as apigateway } from "aws-cdk-lib";
import { NodejsFunction, LogLevel } from "aws-cdk-lib/aws-lambda-nodejs";
import path = require("path");
import config from "../utils/config";
import { addCorsToResponses } from "../utils/others";
import { STAGES } from "../utils/stages";

interface DemoAppStackProps extends cdk.StackProps {
  stageName: STAGES;
  removalPolicy?: cdk.RemovalPolicy;
}

export class DemoAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: DemoAppStackProps) {
    super(scope, id, props);
    const { stageName = "dev", removalPolicy = cdk.RemovalPolicy.DESTROY } =
      props || {};

    const level2S3Bucket = new Bucket(this, "uselessbucket348806", {
      versioned: true,
      bucketName: config.DEMO_TABLE_NAME(stageName),
      removalPolicy: removalPolicy,
    });


   
    const lambdaRole = new iam.Role(this, "LambdaExecutionRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        ),
      ],
    });
    const commonBundling = {
      minify: true,
      externalModules: [
        "@aws-sdk/client-dynamodb",
        "@aws-sdk/lib-dynamodb",
        "@aws-sdk/client-s3",
        "@aws-sdk/client-secrets-manager",
        "aws-cdk-lib",
        "@aws-cdk",
      ],
      target: "es2020",
      logLevel: LogLevel.INFO,
    };
    //  create a new lambda
    const myLambda = new NodejsFunction(this, `${stageName}-demolambda`, {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "handler",
      entry: path.join(__dirname, "../lambda/demo/index.ts"), // Just use entry instead of code
      environment: {
        DEMO_TABLE_NAME: config.DEMO_TABLE_NAME(stageName),
        JWT_SECRET_NAME: config.AWS_SECRET.JWT_SECRET(stageName),
        stageName: stageName,
      },
      role: lambdaRole,
      bundling: commonBundling,
    });

    // Create an API Gateway REST API
    const api = new apigateway.RestApi(this, "demoApi", {
      restApiName: `${stageName}-demoApi`,
      defaultCorsPreflightOptions: config.DEFAULT_CORS_PREFLIGHT_OPTIONS,
      deployOptions: config.DEPLOY_OPTIONS[stageName],
    });

    //  add CORS to the API Gateway
    addCorsToResponses(api);

    // Define the /user path
    const demoResource = api.root.addResource("demo");

    // Attach the Lambda functions to API Gateway
    demoResource.addMethod("GET", new apigateway.LambdaIntegration(myLambda));
    level2S3Bucket.grantReadWrite(myLambda);
  }
}
