from allauth.socialaccount.adapter import DefaultSocialAccountAdapter


class SocialAccountAdapter(DefaultSocialAccountAdapter):
    def populate_user(self, request, sociallogin, data):
        user = super().populate_user(request, sociallogin, data)
        if not user.display_name:
            user.display_name = (
                data.get("name")
                or " ".join(filter(None, [data.get("first_name"), data.get("last_name")]))
                or ""
            )
        return user
