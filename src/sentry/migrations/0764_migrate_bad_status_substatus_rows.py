# Generated by Django 5.1.1 on 2024-09-17 21:16

from datetime import timedelta

from django.apps.registry import Apps
from django.db import migrations
from django.db.backends.base.schema import BaseDatabaseSchemaEditor
from django.utils import timezone

from sentry.new_migrations.migrations import CheckedMigration
from sentry.utils.query import RangeQuerySetWrapperWithProgressBarApprox


class ActivityType:
    SET_IGNORED = 3


class GroupHistoryStatus:
    REGRESSED = 7
    ARCHIVED_UNTIL_ESCALATING = 15
    ARCHIVED_FOREVER = 16
    ARCHIVED_UNTIL_CONDITION_MET = 17


class GroupSubStatus:
    # GroupStatus.IGNORED
    UNTIL_ESCALATING = 1
    # Group is ignored/archived for a count/user count/duration
    UNTIL_CONDITION_MET = 4
    # Group is ignored/archived forever
    FOREVER = 5

    # GroupStatus.UNRESOLVED
    ESCALATING = 2
    ONGOING = 3
    REGRESSED = 6
    NEW = 7


class GroupStatus:
    UNRESOLVED = 0
    RESOLVED = 1
    IGNORED = 2
    PENDING_DELETION = 3
    DELETION_IN_PROGRESS = 4
    PENDING_MERGE = 5

    # The group's events are being re-processed and after that the group will
    # be deleted. In this state no new events shall be added to the group.
    REPROCESSING = 6

    # TODO(dcramer): remove in 9.0
    MUTED = IGNORED


UNRESOLVED_SUBSTATUS_CHOICES = {
    GroupSubStatus.ONGOING,
    GroupSubStatus.ESCALATING,
    GroupSubStatus.REGRESSED,
    GroupSubStatus.NEW,
}

IGNORED_SUBSTATUS_CHOICES = {
    GroupSubStatus.UNTIL_ESCALATING,
    GroupSubStatus.FOREVER,
    GroupSubStatus.UNTIL_CONDITION_MET,
}

# End copy

ACTIVITY_DATA_FIELDS = {
    "ignoreCount",
    "ignoreDuration",
    "ignoreUntil",
    "ignoreUserCount",
    "ignoreUserWindow",
    "ignoreWindow",
}


def fix_substatus_for_groups(apps: Apps, schema_editor: BaseDatabaseSchemaEditor) -> None:
    Group = apps.get_model("sentry", "Group")
    Activity = apps.get_model("sentry", "Activity")
    GroupSnooze = apps.get_model("sentry", "GroupSnooze")
    GroupHistory = apps.get_model("sentry", "GroupHistory")

    seven_days_ago = timezone.now() - timedelta(days=7)
    group_history = GroupHistory.objects.filter(
        date_added__gt=seven_days_ago, status=GroupHistoryStatus.REGRESSED
    )
    activity = Activity.objects.filter(type=ActivityType.SET_IGNORED)
    for group in RangeQuerySetWrapperWithProgressBarApprox(Group.objects.all()):
        if (
            group.status not in [GroupStatus.UNRESOLVED, GroupStatus.IGNORED]
            and group.substatus is None
        ):
            # These groups are correct
            continue

        new_substatus = None

        if group.status == GroupStatus.IGNORED:
            if group.substatus in IGNORED_SUBSTATUS_CHOICES:
                # These groups are correct
                continue

            group_activity = activity.filter(group_id=group.id).order_by("-datetime").first()
            if group_activity:
                # If ignoreUntilEscalating is set, we should set the substatus to UNTIL_ESCALATING
                if group_activity.data.get("ignoreUntilEscalating", False):
                    new_substatus = GroupSubStatus.UNTIL_ESCALATING
                # If any other field in the activity data is set, we should set the substatus to UNTIL_CONDITION_MET
                elif any(group_activity.data.get(field) for field in ACTIVITY_DATA_FIELDS):
                    new_substatus = GroupSubStatus.UNTIL_CONDITION_MET

            # If no activity is found or the activity data is not set, check the group snooze table
            if not new_substatus:
                snooze = GroupSnooze.objects.filter(group=group)
                if snooze.exists():
                    # If snooze exists, we should set the substatus to UNTIL_CONDITION_MET
                    new_substatus = GroupSubStatus.UNTIL_CONDITION_MET
                else:
                    # If we have no other information stored about the group's status conditions, the group is ignored forever
                    new_substatus = GroupSubStatus.FOREVER

        elif group.status == GroupStatus.UNRESOLVED:
            if group.substatus in UNRESOLVED_SUBSTATUS_CHOICES:
                # These groups are correct
                continue

            if group.first_seen > seven_days_ago:
                new_substatus = GroupSubStatus.NEW
            else:
                histories = group_history.filter(group=group)
                if histories.exists():
                    new_substatus = GroupSubStatus.REGRESSED

            if new_substatus is None:
                new_substatus = GroupSubStatus.ONGOING

        group.substatus = new_substatus
        group.save(update_fields=["substatus"])


class Migration(CheckedMigration):
    # This flag is used to mark that a migration shouldn't be automatically run in production.
    # This should only be used for operations where it's safe to run the migration after your
    # code has deployed. So this should not be used for most operations that alter the schema
    # of a table.
    # Here are some things that make sense to mark as post deployment:
    # - Large data migrations. Typically we want these to be run manually so that they can be
    #   monitored and not block the deploy for a long period of time while they run.
    # - Adding indexes to large tables. Since this can take a long time, we'd generally prefer to
    #   run this outside deployments so that we don't block them. Note that while adding an index
    #   is a schema change, it's completely safe to run the operation after the code has deployed.
    # Once deployed, run these manually via: https://develop.sentry.dev/database-migrations/#migration-deployment

    is_post_deployment = True

    dependencies = [
        ("sentry", "0763_add_created_by_to_broadcasts"),
    ]

    operations = [
        migrations.RunPython(
            fix_substatus_for_groups,
            migrations.RunPython.noop,
            hints={"tables": ["sentry_groupedmessage", "sentry_grouphistory"]},
        ),
    ]