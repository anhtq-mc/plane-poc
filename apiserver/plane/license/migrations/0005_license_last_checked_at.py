# Generated by Django 4.2.3 on 2023-10-27 11:37

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('license', '0004_alter_license_instance_id'),
    ]

    operations = [
        migrations.AddField(
            model_name='license',
            name='last_checked_at',
            field=models.DateTimeField(null=True),
        ),
    ]