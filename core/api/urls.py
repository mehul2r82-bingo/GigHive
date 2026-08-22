from django.urls import include, path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.permissions import AllowAny
from .views import (
    RegisterView,
    TaskListView,
    TaskDetailView,
    TaskPublishView,
    TaskAcceptView,
    TaskSubmitView,
    TaskCompleteView,
    TaskRevisionView,
    TaskCancelView,
    PaymentSubmitView,
    PaymentStatusView,
    PaymentVerifyView,
    PaymentPayoutView,
    PaymentRefundView,
    UserProfileView,
    TokenAccountView,
    MyTasksView,
    TaskTypeListView,
    fail_expired_tasks_api,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", TokenObtainPairView.as_view(), name="login"),
    path(
    "login/",
    TokenObtainPairView.as_view(permission_classes=[AllowAny]),
    name="login"
),
    path("refresh/", TokenRefreshView.as_view(), name="refresh"),
    path(
    "profile/",
    UserProfileView.as_view(),
    name="profile",
),
    path("task-types/", TaskTypeListView.as_view(), name="task-types"),
    path(
    "token-account/",
    TokenAccountView.as_view(),
    name="token-account",
),
    
    
    path("tasks/", TaskListView.as_view()),
    path("tasks/<int:pk>/", TaskDetailView.as_view()),
    path("tasks/<int:pk>/publish/", TaskPublishView.as_view(), name="task-publish"),
    path("tasks/<int:pk>/accept/", TaskAcceptView.as_view(), name="task-accept"),
    path("tasks/<int:pk>/submit/", TaskSubmitView.as_view(), name="task-submit"),
    path(
    "tasks/<int:pk>/complete/",
    TaskCompleteView.as_view(),
    
    name="task-complete",
),
    path(
    "tasks/<int:pk>/request-revision/",
    TaskRevisionView.as_view(),
    name="task-request-revision",
),
    path("auth/", include("core.api.auth.urls")),
    path("tasks/<int:pk>/cancel/", TaskCancelView.as_view(), name="task-cancel"),
    path("my-tasks/", MyTasksView.as_view()),
    path(
        "payments/<int:task_id>/submit/",
        PaymentSubmitView.as_view(),
        name="payment-submit"
    ),
    
    path(
    "payments/<int:task_id>/status/",
    PaymentStatusView.as_view(),
),
    path(
        "payments/<int:task_id>/verify/",
        PaymentVerifyView.as_view(),
        name="payment-verify"
    ),
    path(
        "payments/<int:task_id>/payout/",
        PaymentPayoutView.as_view(),
        name="payment-payout"
    ),
    path(
        "payments/<int:task_id>/refund/",
        PaymentRefundView.as_view(),
        name="payment-refund"
    ),
    path(
        "internal/fail-expired/",
        fail_expired_tasks_api,
        name="fail-expired-tasks-api",
    ),
]


