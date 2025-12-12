from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient

from .models import Category, Note


class NotesApiTest(APITestCase):
    def setUp(self):
        self.User = get_user_model()
        self.user = self.User.objects.create_user(username="user@example.com", password="pass1234")
        self.client: APIClient
        self.client.force_authenticate(user=self.user)

        # Another user for isolation tests
        self.other = self.User.objects.create_user(username="other@example.com", password="pass1234")

        # Seed categories for primary user
        self.cat_random = Category.objects.create(user=self.user, name="Random Thoughts", color="#A78BFA")
        self.cat_school = Category.objects.create(user=self.user, name="School", color="#60A5FA")
        self.cat_personal = Category.objects.create(user=self.user, name="Personal", color="#F59E0B")

    def test_health_ok(self):
        url = reverse('health')
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data.get("status"), "ok")

    # Categories
    def test_categories_list_only_current_user(self):
        # create a category for other user
        Category.objects.create(user=self.other, name="OtherCat", color="#000000")
        url = reverse('category-list')
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        names = {c["name"] for c in res.data}
        self.assertIn("Random Thoughts", names)
        self.assertIn("School", names)
        self.assertIn("Personal", names)
        self.assertNotIn("OtherCat", names)

    def test_categories_create(self):
        url = reverse('category-list')
        payload = {"name": "Work", "color": "#10B981"}
        res = self.client.post(url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["name"], "Work")
        self.assertEqual(res.data["color"], "#10B981")

    def test_categories_create_unique_per_user(self):
        url = reverse('category-list')
        payload = {"name": "School", "color": "#000000"}
        res = self.client.post(url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_categories_retrieve_update_delete(self):
        # retrieve
        url = reverse('category-detail', kwargs={"pk": str(self.cat_school.id)})
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["name"], "School")

        # update
        res = self.client.patch(url, {"name": "Uni"}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["name"], "Uni")

        # delete
        res = self.client.delete(url)
        self.assertIn(res.status_code, (status.HTTP_204_NO_CONTENT, status.HTTP_200_OK))
        self.assertFalse(Category.objects.filter(id=self.cat_school.id).exists())

    # Notes
    def test_notes_crud_and_filter_by_category(self):
        # create notes
        url_list = reverse('note-list')
        # without category should default to Random Thoughts (if exists)
        res = self.client.post(url_list, {}, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        note1_id = res.data["id"]
        self.assertEqual(str(res.data["category"]), str(self.cat_random.id))

        # with explicit category
        res = self.client.post(url_list, {"category": str(self.cat_school.id)}, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        note2_id = res.data["id"]
        self.assertEqual(str(res.data["category"]), str(self.cat_school.id))

        # list all
        res = self.client.get(url_list)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(res.data), 2)

        # filter by category (school)
        res = self.client.get(url_list + f"?category={self.cat_school.id}")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(all(str(n["category"]) == str(self.cat_school.id) for n in res.data))

        # retrieve
        url_detail = reverse('note-detail', kwargs={"pk": note1_id})
        res = self.client.get(url_detail)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["id"], note1_id)

        # update
        res = self.client.patch(url_detail, {"title": "Hello", "content": "World"}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["title"], "Hello")
        self.assertEqual(res.data["content"], "World")

        # delete
        res = self.client.delete(url_detail)
        self.assertIn(res.status_code, (status.HTTP_204_NO_CONTENT, status.HTTP_200_OK))
        self.assertFalse(Note.objects.filter(id=note1_id).exists())

    def test_notes_are_user_scoped(self):
        # Create a note for other user in their category
        other_cat = Category.objects.create(user=self.other, name="OtherCat", color="#111111")
        other_note = Note.objects.create(user=self.other, category=other_cat, title="x", content="y")

        url_list = reverse('note-list')
        res = self.client.get(url_list)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        ids = {n["id"] for n in res.data}
        self.assertNotIn(str(other_note.id), ids)
