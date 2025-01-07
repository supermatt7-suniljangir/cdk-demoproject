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
import { commonNodeJsFunctionBundling } from "../utils/bundling";

interface DemoAppStackProps extends cdk.StackProps {
  stageName: STAGES;
  removalPolicy?: cdk.RemovalPolicy;
}

export class DemoAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: DemoAppStackProps) {
    super(scope, id, props);
    const {
      stageName = STAGES.DEV,
      removalPolicy = cdk.RemovalPolicy.DESTROY,
    } = props || {};

    const level2S3Bucket = new Bucket(this, "demo-storage-bucket", {
      versioned: true,
      bucketName: `demo-bucket-348806-unique`,
      removalPolicy: removalPolicy,
      autoDeleteObjects: removalPolicy === cdk.RemovalPolicy.DESTROY,
    });

    const lambdaRole = new iam.Role(this, "LambdaExecutionRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        ),
      ],
    });

    //  create a new lambda
    const myLambda = new NodejsFunction(this, `demolambda`, {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "handler",
      functionName: `demolambda-${stageName}`,
      entry: path.join(__dirname, "../lambda/demo/index.ts"), // Just use entry instead of code
      environment: {
        DEMO_TABLE_NAME: config.DEMO_TABLE_NAME(stageName),
        JWT_SECRET_NAME: config.AWS_SECRET.JWT_SECRET(stageName),
        stageName: stageName,
      },
      role: lambdaRole,
      bundling: commonNodeJsFunctionBundling,
    });

    // Create an API Gateway REST API
    const api = new apigateway.RestApi(this, "demoApi", {
      restApiName: `demoApi-${stageName}`,
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
