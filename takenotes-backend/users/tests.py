from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from notes.models import Category
from users.views import DEFAULT_CATEGORIES


class UsersAuthTest(APITestCase):
    def test_register_creates_user_and_default_categories_and_tokens(self):
        url = reverse('register')
        payload = {"username": "new@example.com", "password": "pass1234"}
        res = self.client.post(url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn("tokens", res.data)
        self.assertIn("access", res.data["tokens"])
        self.assertIn("refresh", res.data["tokens"])

        # categories created
        User = get_user_model()
        u = User.objects.get(username="new@example.com")
        cats = Category.objects.filter(user=u)
        self.assertEqual(cats.count(), len(DEFAULT_CATEGORIES))
        names = {c.name for c in cats}
        for name, _ in DEFAULT_CATEGORIES:
            self.assertIn(name, names)

    def test_obtain_and_refresh_token(self):
        User = get_user_model()
        u = User.objects.create_user(username="login@example.com", password="pass1234")

        # obtain
        url_token = reverse('token_obtain_pair')
        res = self.client.post(url_token, {"username": "login@example.com", "password": "pass1234"}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("access", res.data)
        self.assertIn("refresh", res.data)

        # refresh
        url_refresh = reverse('token_refresh')
        res2 = self.client.post(url_refresh, {"refresh": res.data["refresh"]}, format='json')
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertIn("access", res2.data)
