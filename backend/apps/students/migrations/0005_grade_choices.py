from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("students", "0004_phase3_gamification"),
    ]

    operations = [
        migrations.AlterField(
            model_name="student",
            name="grade",
            field=models.CharField(
                choices=[
                    ("P1", "P1"),
                    ("P2", "P2"),
                    ("P3", "P3"),
                    ("P4", "P4"),
                    ("P5", "P5"),
                    ("P6", "P6"),
                ],
                max_length=2,
            ),
        ),
    ]
