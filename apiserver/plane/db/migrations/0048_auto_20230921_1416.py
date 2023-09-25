# Generated by Django 4.2.3 on 2023-09-21 14:16

import boto3
import botocore
from django.db import migrations
from django.conf import settings


def move_s3_objects(apps, schema_editor):
    IssueAttachment = apps.get_model("db", "IssueAttachment")

    # Your source and destination bucket names
    source_bucket = settings.AWS_PUBLIC_STORAGE_BUCKET_NAME
    destination_bucket = settings.AWS_PRIVATE_STORAGE_BUCKET_NAME

    s3_client = boto3.client(
        "s3",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )

    for key in IssueAttachment.objects.values_list("asset", flat=True):
        try:
            copy_source = {"Bucket": source_bucket, "Key": key}
            s3_client.copy_object(
                Bucket=destination_bucket, CopySource=copy_source, Key=key
            )
        except Exception as e:
            pass


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0047_auto_20230921_0758"),
    ]

    operations = [
        migrations.RunPython(move_s3_objects),
    ]
