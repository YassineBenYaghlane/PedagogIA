from django.db import migrations, models

INPUT_TYPES = [
    ("number", "Number"),
    ("mcq", "MCQ"),
    ("symbol", "Symbol"),
    ("decomposition", "Decomposition"),
    ("point_on_line", "Point on number line"),
    ("drag_order", "Drag to order"),
]


class Migration(migrations.Migration):
    dependencies = [
        ("exercises", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="exercisetemplate",
            name="input_type",
            field=models.CharField(choices=INPUT_TYPES, default="number", max_length=20),
        ),
        migrations.AddField(
            model_name="attempt",
            name="input_type",
            field=models.CharField(choices=INPUT_TYPES, default="number", max_length=20),
        ),
    ]
