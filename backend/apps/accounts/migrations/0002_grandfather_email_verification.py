from django.db import migrations


def grandfather_existing_users(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    EmailAddress = apps.get_model("account", "EmailAddress")
    for user in User.objects.all():
        if not user.email:
            continue
        EmailAddress.objects.update_or_create(
            user=user,
            email=user.email,
            defaults={"verified": True, "primary": True},
        )


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0001_initial"),
        ("account", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(grandfather_existing_users, noop_reverse),
    ]
