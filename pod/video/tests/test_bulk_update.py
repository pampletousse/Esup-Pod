"""Unit tests for videos bulk update.

*  run with `python manage.py test pod.video.tests.test_bulk_update
"""

from datetime import datetime

from django.contrib.sites.models import Site
from django.test import RequestFactory, Client, TransactionTestCase

from pod.authentication.backends import User
from pod.video.models import Video, Type
from pod.video.views import bulk_update


class BulkUpdateTestCase(TransactionTestCase):
    """Test the videos bulk update."""

    fixtures = [
        "initial_data.json",
    ]
    serialized_rollback = True

    def setUp(self):
        """Create videos to be tested."""
        self.factory = RequestFactory()
        self.client = Client()

        site = Site.objects.get(pk=1)
        user1 = User.objects.create(
            username="pod1", password="pod1234pod", email="pod@univ.fr"
        )
        user2 = User.objects.create(
            username="pod2", password="pod1234pod", email="pod@univ.fr"
        )
        user3 = User.objects.create(
            username="pod3", password="pod1234pod", email="pod@univ.fr"
        )

        type1 = Type.objects.create(title="type1")
        type2 = Type.objects.create(title="type2")

        Video.objects.create(
            type=type1,
            title="Video1",
            password=None,
            date_added=datetime.today(),
            encoding_in_progress=False,
            owner=user1,
            date_evt=datetime.today(),
            video="test.mp4",
            allow_downloading=True,
            description="test",
            is_draft=False,
            duration=3,
        )

        Video.objects.create(
            type=type1,
            title="Video2",
            password=None,
            date_added=datetime.today(),
            encoding_in_progress=False,
            owner=user2,
            date_evt=datetime.today(),
            video="test.mp4",
            allow_downloading=True,
            description="test",
            is_draft=False,
            duration=3,
        )

        Video.objects.create(
            type=type2,
            title="Video3",
            password=None,
            date_added=datetime.today(),
            encoding_in_progress=False,
            owner=user2,
            date_evt=datetime.today(),
            video="test.mp4",
            allow_downloading=True,
            description="test",
            is_draft=False,
            duration=3,
        )

        Video.objects.create(
            type=type2,
            title="Video4",
            password=None,
            date_added=datetime.today(),
            encoding_in_progress=False,
            owner=user3,
            date_evt=datetime.today(),
            video="test.mp4",
            allow_downloading=True,
            description="test",
            is_draft=False,
            duration=3,
        )

        Video.objects.create(
            type=type2,
            title="Video5",
            password=None,
            date_added=datetime.today(),
            encoding_in_progress=False,
            owner=user3,
            date_evt=datetime.today(),
            video="test.mp4",
            allow_downloading=True,
            description="test",
            is_draft=False,
            duration=3,
        )

        for vid in Video.objects.all():
            vid.sites.add(site)

        print(" --->  SetUp of BulkUpdateTestCase: OK!")

    def test_bulk_update_type(self):
        """Test bulk update of type attribute."""
        video1 = Video.objects.get(pk=1)
        video2 = Video.objects.get(pk=2)

        type1 = Type.objects.get(title="type1")
        type2 = Type.objects.get(title="type2")

        user1 = User.objects.get(username="pod1")

        self.client.force_login(user1)

        post_request = self.factory.post(
            "/bulk_update/",
            {
                "type": type2.id,
                "selected_videos": '["%s", "%s"]' % (video1.slug, video2.slug),
                "update_fields": '["type"]',
                "update_action": "fields",
            },
            HTTP_X_REQUESTED_WITH="XMLHttpRequest",
        )

        post_request.user = user1
        post_request.LANGUAGE_CODE = "fr"
        response = bulk_update(post_request)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(Video.objects.filter(type=type1)), 0)
        self.assertEqual(len(Video.objects.filter(type=type2)), 5)

        print("--->  test_bulk_update_type of BulkUpdateTestCase: OK")
        self.client.logout()

    def test_bulk_update_owner(self):
        """Test bulk update of owner attribute."""
        video1 = Video.objects.get(pk=1)
        video2 = Video.objects.get(pk=2)
        video3 = Video.objects.get(pk=3)
        video4 = Video.objects.get(pk=4)
        video5 = Video.objects.get(pk=5)

        user1 = User.objects.get(username="pod1")
        user2 = User.objects.get(username="pod2")
        user3 = User.objects.get(username="pod3")

        self.client.force_login(user1)

        post_request = self.factory.post(
            "/bulk_update/",
            {
                "owner": user2.id,
                "selected_videos":
                    '["%s", "%s", "%s", "%s", "%s"]'
                    % (
                        video1.slug,
                        video2.slug,
                        video3.slug,
                        video4.slug,
                        video5.slug,
                       ),
                "update_fields": '["owner"]',
                "update_action": "fields",
            },
            HTTP_X_REQUESTED_WITH="XMLHttpRequest",
        )

        post_request.user = user1
        post_request.LANGUAGE_CODE = "fr"
        response = bulk_update(post_request)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(Video.objects.filter(owner=user1)), 0)
        self.assertEqual(len(Video.objects.filter(owner=user2)), 5)
        self.assertEqual(len(Video.objects.filter(owner=user3)), 0)

        print("--->  test_bulk_update_owner of BulkUpdateTestCase: OK")
        self.client.logout()

    def tearDown(self):
        """Cleanup all created stuffs."""
        del self.client
        del self.factory
