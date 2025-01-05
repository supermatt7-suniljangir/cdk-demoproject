import * as cdk from "aws-cdk-lib";
import { Bucket, CfnBucket } from "aws-cdk-lib/aws-s3";
import { Queue } from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as lambda from "aws-cdk-lib/aws-lambda";

interface DemoAppStackProps extends cdk.StackProps {
  stageName?: string;
  removalPolicy?: cdk.RemovalPolicy;
}

export class DemoAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: DemoAppStackProps) {
    super(scope, id, props);
    const { stageName = "dev", removalPolicy = cdk.RemovalPolicy.DESTROY } =
      props || {};

    const level2S3Bucket = new Bucket(this, "myFirstLevel2S3Bucket", {
      versioned: true,
      bucketName: "smlevel2s3bucket",
      removalPolicy: removalPolicy,
    });

    const queue = new Queue(this, "MyFirstQueue", {
      queueName: "myfirstqueue",
    });

    level2S3Bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.SqsDestination(queue)
    );
}
}
